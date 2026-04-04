// ============ ENGLISH TRANSLATIONS ============
module.exports = {
  // ---- Common ----
  common: {
    success: 'Success',
    error: 'Error',
    not_found: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Insufficient permissions',
    validation_failed: 'Validation failed',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
    too_many_requests: 'Too many requests, please try again later',
    server_error: 'Internal server error',
    bad_request: 'Bad request'
  },

  // ---- Auth ----
  auth: {
    invalid_credentials: 'Invalid credentials',
    no_token: 'No token provided',
    token_expired: 'Invalid or expired token',
    username_exists: 'Username already exists',
    password_changed: 'Password changed successfully',
    cannot_delete_self: 'Cannot delete your own account',
    login_rate_limit: 'Too many login attempts, please try again in 15 minutes',
    required_role: 'Required role: {{roles}}'
  },

  // ---- Properties ----
  props: {
    not_found: 'Property not found',
    created: 'Property created',
    deleted: 'Property deleted'
  },

  // ---- Tenants ----
  tenants: {
    not_found: 'Tenant not found',
    created: 'Tenant created',
    deleted: 'Tenant deleted'
  },

  // ---- Tickets ----
  tickets: {
    not_found: 'Ticket not found',
    created: 'Ticket created',
    deleted: 'Ticket deleted',
    status_updated: 'Ticket status updated to {{status}}'
  },

  // ---- Bills ----
  bills: {
    not_found: 'Bill not found',
    created: 'Bill created',
    deleted: 'Bill deleted',
    already_paid: 'Bill already paid',
    paid: 'Bill paid successfully',
    generated: '{{count}} invoices generated'
  },

  // ---- Vendors ----
  vendors: {
    not_found: 'Vendor not found',
    created: 'Vendor created',
    deleted: 'Vendor deleted'
  },

  // ---- Work Orders ----
  work_orders: {
    not_found: 'Work order not found',
    created: 'Work order created',
    deleted: 'Work order deleted',
    status_updated: 'Work order status updated to {{status}}'
  },

  // ---- Leads ----
  leads: {
    not_found: 'Lead not found',
    created: 'Lead created',
    deleted: 'Lead deleted'
  },

  // ---- Landlords ----
  landlords: {
    not_found: 'Landlord not found',
    created: 'Landlord created',
    deleted: 'Landlord deleted'
  },

  // ---- Contracts ----
  contracts: {
    not_found: 'Contract not found',
    created: 'Contract created',
    deleted: 'Contract deleted',
    signed: 'Contract signed successfully'
  },

  // ---- Utility Bills ----
  utility_bills: {
    not_found: 'Utility bill not found',
    paid: 'Utility bill paid',
    generated: '{{count}} utility bills generated'
  },

  // ---- IoT ----
  iot: {
    meter_not_found: 'Meter not found',
    lock_not_found: 'Lock not found',
    disconnected: 'Meter disconnected',
    reconnected: 'Meter reconnected',
    lock_toggled: 'Lock toggled',
    fingerprint_disabled: 'Fingerprint access disabled',
    fingerprint_enabled: 'Fingerprint access enabled'
  },

  // ---- Misc ----
  misc: {
    record_not_found: 'Record not found',
    notif_not_found: 'Notification not found',
    automation_not_found: 'Automation not found',
    config_not_found: 'Config not found',
    data_reset: 'All data reset to demo state',
    data_saved: 'Data saved successfully'
  },

  // ---- Reports ----
  reports: {
    owner_report: 'Owner Report',
    portfolio_report: 'Portfolio Report',
    generated: 'Report generated',
    no_data: 'No data available for report'
  },

  // ---- Audit ----
  audit: {
    create: 'Created {{entity}}',
    update: 'Updated {{entity}}',
    delete: 'Deleted {{entity}}',
    login: 'User logged in',
    password_change: 'Password changed',
    data_reset: 'System data reset',
    status_change: 'Status changed to {{status}}'
  }
};
