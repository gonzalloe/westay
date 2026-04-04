// ============ NOTIFICATION SERVICE ============
// Multi-channel notifications: Email (Nodemailer) + WhatsApp (Meta Cloud API) + In-App
// Graceful degradation: if a channel isn't configured, it silently skips
//
// Required env vars:
//   Email:    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   WhatsApp: WHATSAPP_API_URL, WHATSAPP_API_TOKEN, WHATSAPP_PHONE_ID

const nodemailer = require('nodemailer');

// ---- Email Transport ----
let emailTransport = null;

function getEmailTransport() {
  if (emailTransport) return emailTransport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return emailTransport;
}

// ---- Channel availability checks ----

function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isWhatsAppConfigured() {
  return !!(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);
}

// ---- Email ----

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise<Object>} { success, messageId } or { success: false, error }
 */
async function sendEmail(options) {
  const transport = getEmailTransport();
  if (!transport) {
    return { success: false, error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env' };
  }

  try {
    const result = await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    return { success: true, messageId: result.messageId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ---- WhatsApp (Meta Cloud API) ----

/**
 * Send a WhatsApp message via Meta Cloud API
 * @param {Object} options
 * @param {string} options.to - Recipient phone (with country code, e.g. '60123456789')
 * @param {string} options.message - Text message
 * @param {string} [options.template] - Template name (for pre-approved template messages)
 * @param {Object} [options.templateParams] - Template parameter values
 * @returns {Promise<Object>} { success, messageId } or { success: false, error }
 */
async function sendWhatsApp(options) {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp not configured. Set WHATSAPP_API_URL, WHATSAPP_API_TOKEN in .env' };
  }

  try {
    const phoneId = process.env.WHATSAPP_PHONE_ID || '';
    const url = process.env.WHATSAPP_API_URL.replace('{phone_id}', phoneId);

    let body;
    if (options.template) {
      body = {
        messaging_product: 'whatsapp',
        to: options.to,
        type: 'template',
        template: {
          name: options.template,
          language: { code: options.language || 'en' },
          components: options.templateParams ? [{
            type: 'body',
            parameters: Object.values(options.templateParams).map(v => ({ type: 'text', text: String(v) }))
          }] : []
        }
      };
    } else {
      body = {
        messaging_product: 'whatsapp',
        to: options.to,
        type: 'text',
        text: { body: options.message }
      };
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.WHATSAPP_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: data.error ? data.error.message : 'WhatsApp API error' };
    }
    return {
      success: true,
      messageId: data.messages && data.messages[0] ? data.messages[0].id : null
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ---- In-App Notification (via DB + WebSocket) ----

/**
 * Create an in-app notification
 * @param {Object} db - Database adapter
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification body
 * @param {string} [options.type='info'] - 'info' | 'warning' | 'success' | 'error'
 * @param {string} [options.target] - Target user/role
 * @param {Function} [options.broadcast] - WebSocket broadcast function
 * @returns {Promise<Object>} Created notification
 */
async function createInAppNotification(db, options) {
  const notif = {
    id: 'N-' + Date.now(),
    title: options.title,
    msg: options.message,
    type: options.type || 'info',
    target: options.target || 'all',
    read: false,
    time: new Date().toISOString()
  };

  await db.create('notifs', notif);

  // Broadcast via WebSocket if available
  if (options.broadcast) {
    options.broadcast('notifs', 'new', notif);
  }

  return notif;
}

// ---- Multi-Channel Send ----

/**
 * Send notification through multiple channels at once
 * @param {Object} db - Database adapter
 * @param {Object} options
 * @param {string[]} options.channels - Array of channels: 'email', 'whatsapp', 'inapp'
 * @param {string} [options.emailTo] - Recipient email
 * @param {string} [options.phone] - Recipient phone (WhatsApp)
 * @param {string} options.subject - Subject (email) / title (in-app)
 * @param {string} options.message - Message body
 * @param {string} [options.html] - HTML body for email
 * @param {string} [options.template] - WhatsApp template name
 * @param {Object} [options.templateParams] - WhatsApp template params
 * @param {string} [options.type] - In-app notification type
 * @param {string} [options.target] - In-app notification target
 * @param {Function} [options.broadcast] - WebSocket broadcast function
 * @returns {Promise<Object>} Results per channel
 */
async function sendMultiChannel(db, options) {
  const channels = options.channels || ['inapp'];
  const results = {};

  const promises = [];

  if (channels.includes('email') && options.emailTo) {
    promises.push(
      sendEmail({
        to: options.emailTo,
        subject: options.subject,
        text: options.message,
        html: options.html
      }).then(r => { results.email = r; })
    );
  }

  if (channels.includes('whatsapp') && options.phone) {
    promises.push(
      sendWhatsApp({
        to: options.phone,
        message: options.message,
        template: options.template,
        templateParams: options.templateParams
      }).then(r => { results.whatsapp = r; })
    );
  }

  if (channels.includes('inapp')) {
    promises.push(
      createInAppNotification(db, {
        title: options.subject,
        message: options.message,
        type: options.type,
        target: options.target,
        broadcast: options.broadcast
      }).then(r => { results.inapp = { success: true, notification: r }; })
    );
  }

  await Promise.allSettled(promises);
  return results;
}

// ---- Email Templates ----

/**
 * Generate rent due reminder email HTML
 */
function rentDueEmailHtml(tenantName, amount, dueDate, propertyName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2D3436; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">WeStay</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">Rent Payment Reminder</p>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Dear <strong>${tenantName}</strong>,</p>
        <p>This is a friendly reminder that your rent payment is due:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Property</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${propertyName}</strong></td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${amount}</strong></td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Due Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${dueDate}</strong></td></tr>
        </table>
        <p>Please ensure payment is made by the due date to avoid any service interruptions.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from WeStay Property Management.</p>
      </div>
    </div>
  `;
}

/**
 * Generate ticket update email HTML
 */
function ticketUpdateEmailHtml(tenantName, ticketId, status, description) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2D3436; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">WeStay</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">Maintenance Ticket Update</p>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Dear <strong>${tenantName}</strong>,</p>
        <p>Your maintenance ticket has been updated:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Ticket</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${ticketId}</strong></td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Status</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${status}</strong></td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Details</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${description}</td></tr>
        </table>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from WeStay Property Management.</p>
      </div>
    </div>
  `;
}

module.exports = {
  isEmailConfigured,
  isWhatsAppConfigured,
  sendEmail,
  sendWhatsApp,
  createInAppNotification,
  sendMultiChannel,
  rentDueEmailHtml,
  ticketUpdateEmailHtml
};
