// ============ WEBSOCKET REAL-TIME ENGINE ============
// Provides real-time event broadcasting for:
//   - Notifications (new notif pushed to all connected clients)
//   - IoT status changes (meter cut/reconnect, lock toggle)
//   - Ticket updates (new ticket, status change)
//   - Bill payments
//   - Audit events
//
// Protocol: ws://localhost:PORT/ws
// Auth: Send { type: 'auth', token: '<JWT>' } as first message
// Events: Server pushes { type: 'event', channel: 'notifs', data: {...} }
//
// No external dependency — uses Node.js built-in http upgrade + raw WebSocket frames

const { URL } = require('url');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

// Connected clients: Map<ws, { user, channels }>
const clients = new Map();

/**
 * Attach WebSocket upgrade handler to an HTTP server
 * @param {http.Server} server - The HTTP server from app.listen()
 */
function attachWebSocket(server) {
  server.on('upgrade', (req, socket, head) => {
    // Only handle /ws path
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname !== '/ws') {
      socket.destroy();
      return;
    }

    // WebSocket handshake
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-5AB5DC525C63')
      .digest('base64');

    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      'Sec-WebSocket-Accept: ' + acceptKey + '\r\n' +
      '\r\n'
    );

    const client = {
      socket,
      user: null,
      channels: new Set(['notifs', 'tickets', 'bills', 'iot', 'audit']),
      authenticated: false
    };
    clients.set(socket, client);

    console.log('[WS] Client connected (' + clients.size + ' total)');

    // Send welcome message
    wsSend(socket, { type: 'welcome', message: 'WeStay WebSocket connected. Send { type: "auth", token: "<JWT>" } to authenticate.' });

    // Handle incoming messages
    let buffer = Buffer.alloc(0);
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      while (buffer.length >= 2) {
        const frame = parseFrame(buffer);
        if (!frame) break;
        buffer = buffer.slice(frame.totalLength);

        if (frame.opcode === 0x8) {
          // Close frame
          socket.end();
          return;
        }
        if (frame.opcode === 0x9) {
          // Ping -> Pong
          const pong = Buffer.alloc(2);
          pong[0] = 0x8A; // fin + pong
          pong[1] = 0;
          socket.write(pong);
          continue;
        }
        if (frame.opcode === 0x1) {
          // Text frame
          try {
            const msg = JSON.parse(frame.payload.toString('utf8'));
            handleMessage(client, msg);
          } catch (e) {
            wsSend(socket, { type: 'error', message: 'Invalid JSON' });
          }
        }
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      console.log('[WS] Client disconnected (' + clients.size + ' total)');
    });

    socket.on('error', () => {
      clients.delete(socket);
    });

    // Heartbeat ping every 30s
    const pingInterval = setInterval(() => {
      if (socket.destroyed) {
        clearInterval(pingInterval);
        return;
      }
      const ping = Buffer.alloc(2);
      ping[0] = 0x89; // fin + ping
      ping[1] = 0;
      socket.write(ping);
    }, 30000);

    socket.on('close', () => clearInterval(pingInterval));
  });

  console.log('[WS] WebSocket handler attached at /ws');
}

/**
 * Parse a WebSocket frame from buffer
 */
function parseFrame(buffer) {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];
  const opcode = firstByte & 0x0F;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7F;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    // For simplicity, read as 32-bit (enough for our use case)
    payloadLength = buffer.readUInt32BE(6);
    offset = 10;
  }

  const maskOffset = offset;
  if (masked) offset += 4;

  if (buffer.length < offset + payloadLength) return null;

  let payload = buffer.slice(offset, offset + payloadLength);

  // Unmask
  if (masked) {
    const mask = buffer.slice(maskOffset, maskOffset + 4);
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4];
    }
  }

  return { opcode, payload, totalLength: offset + payloadLength };
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(client, msg) {
  switch (msg.type) {
    case 'auth':
      // Authenticate with JWT
      try {
        const decoded = jwt.verify(msg.token, JWT_SECRET);
        client.user = decoded;
        client.authenticated = true;
        wsSend(client.socket, { type: 'auth_ok', user: { username: decoded.username, role: decoded.role } });
        console.log('[WS] Authenticated: ' + decoded.username + ' (' + decoded.role + ')');
      } catch (e) {
        wsSend(client.socket, { type: 'auth_error', message: 'Invalid or expired token' });
      }
      break;

    case 'subscribe':
      // Subscribe to specific channels
      if (msg.channels && Array.isArray(msg.channels)) {
        msg.channels.forEach(ch => client.channels.add(ch));
        wsSend(client.socket, { type: 'subscribed', channels: Array.from(client.channels) });
      }
      break;

    case 'unsubscribe':
      if (msg.channels && Array.isArray(msg.channels)) {
        msg.channels.forEach(ch => client.channels.delete(ch));
        wsSend(client.socket, { type: 'unsubscribed', channels: Array.from(client.channels) });
      }
      break;

    case 'ping':
      wsSend(client.socket, { type: 'pong', timestamp: Date.now() });
      break;

    default:
      wsSend(client.socket, { type: 'error', message: 'Unknown message type: ' + msg.type });
  }
}

/**
 * Send a JSON message to a WebSocket client
 */
function wsSend(socket, data) {
  if (socket.destroyed) return;
  try {
    const payload = Buffer.from(JSON.stringify(data), 'utf8');
    const frame = createFrame(payload);
    socket.write(frame);
  } catch (e) {
    // Silently fail — client may have disconnected
  }
}

/**
 * Create a WebSocket text frame
 */
function createFrame(payload) {
  const length = payload.length;
  let header;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // fin + text
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeUInt32BE(0, 2); // High 32 bits (0 for our sizes)
    header.writeUInt32BE(length, 6);
  }

  return Buffer.concat([header, payload]);
}

/**
 * Broadcast an event to all connected (optionally authenticated) clients on a channel
 * @param {string} channel - 'notifs', 'tickets', 'bills', 'iot', 'audit'
 * @param {string} event - Event name: 'new', 'update', 'delete', 'status_change'
 * @param {Object} data - Event payload
 * @param {Object} [options] - { requireAuth: true, roles: ['operator'] }
 */
function broadcast(channel, event, data, options) {
  const msg = {
    type: 'event',
    channel,
    event,
    data,
    timestamp: new Date().toISOString()
  };

  const requireAuth = options && options.requireAuth !== false;
  const roles = options && options.roles;

  let sent = 0;
  for (const [socket, client] of clients) {
    // Check auth
    if (requireAuth && !client.authenticated) continue;
    // Check role
    if (roles && client.user && !roles.includes(client.user.role)) continue;
    // Check channel subscription
    if (!client.channels.has(channel)) continue;

    wsSend(socket, msg);
    sent++;
  }

  if (sent > 0) {
    console.log('[WS] Broadcast ' + channel + '.' + event + ' to ' + sent + ' client(s)');
  }
}

/**
 * Get connected client count
 */
function getClientCount() {
  return clients.size;
}

/**
 * Get authenticated client info
 */
function getConnectedUsers() {
  const users = [];
  for (const [, client] of clients) {
    if (client.authenticated && client.user) {
      users.push({
        username: client.user.username,
        role: client.user.role,
        channels: Array.from(client.channels)
      });
    }
  }
  return users;
}

module.exports = { attachWebSocket, broadcast, getClientCount, getConnectedUsers };
