// ============ BAHASA MELAYU TRANSLATIONS ============
module.exports = {
  // ---- Common ----
  common: {
    success: 'Berjaya',
    error: 'Ralat',
    not_found: 'Tidak dijumpai',
    unauthorized: 'Tidak dibenarkan',
    forbidden: 'Kebenaran tidak mencukupi',
    validation_failed: 'Pengesahan gagal',
    created: 'Berjaya dicipta',
    updated: 'Berjaya dikemas kini',
    deleted: 'Berjaya dipadam',
    too_many_requests: 'Terlalu banyak permintaan, sila cuba lagi kemudian',
    server_error: 'Ralat pelayan dalaman',
    bad_request: 'Permintaan tidak sah'
  },

  // ---- Auth ----
  auth: {
    invalid_credentials: 'Kelayakan tidak sah',
    no_token: 'Tiada token disediakan',
    token_expired: 'Token tidak sah atau tamat tempoh',
    username_exists: 'Nama pengguna sudah wujud',
    password_changed: 'Kata laluan berjaya ditukar',
    cannot_delete_self: 'Tidak boleh padam akaun sendiri',
    login_rate_limit: 'Terlalu banyak percubaan log masuk, sila cuba lagi dalam 15 minit',
    required_role: 'Peranan diperlukan: {{roles}}'
  },

  // ---- Properties ----
  props: {
    not_found: 'Hartanah tidak dijumpai',
    created: 'Hartanah berjaya dicipta',
    deleted: 'Hartanah berjaya dipadam'
  },

  // ---- Tenants ----
  tenants: {
    not_found: 'Penyewa tidak dijumpai',
    created: 'Penyewa berjaya dicipta',
    deleted: 'Penyewa berjaya dipadam'
  },

  // ---- Tickets ----
  tickets: {
    not_found: 'Tiket tidak dijumpai',
    created: 'Tiket berjaya dicipta',
    deleted: 'Tiket berjaya dipadam',
    status_updated: 'Status tiket dikemas kini kepada {{status}}'
  },

  // ---- Bills ----
  bills: {
    not_found: 'Bil tidak dijumpai',
    created: 'Bil berjaya dicipta',
    deleted: 'Bil berjaya dipadam',
    already_paid: 'Bil sudah dibayar',
    paid: 'Bil berjaya dibayar',
    generated: '{{count}} invois dijana'
  },

  // ---- Vendors ----
  vendors: {
    not_found: 'Vendor tidak dijumpai',
    created: 'Vendor berjaya dicipta',
    deleted: 'Vendor berjaya dipadam'
  },

  // ---- Work Orders ----
  work_orders: {
    not_found: 'Pesanan kerja tidak dijumpai',
    created: 'Pesanan kerja berjaya dicipta',
    deleted: 'Pesanan kerja berjaya dipadam',
    status_updated: 'Status pesanan kerja dikemas kini kepada {{status}}'
  },

  // ---- Leads ----
  leads: {
    not_found: 'Prospek tidak dijumpai',
    created: 'Prospek berjaya dicipta',
    deleted: 'Prospek berjaya dipadam'
  },

  // ---- Landlords ----
  landlords: {
    not_found: 'Tuan rumah tidak dijumpai',
    created: 'Tuan rumah berjaya dicipta',
    deleted: 'Tuan rumah berjaya dipadam'
  },

  // ---- Contracts ----
  contracts: {
    not_found: 'Kontrak tidak dijumpai',
    created: 'Kontrak berjaya dicipta',
    deleted: 'Kontrak berjaya dipadam',
    signed: 'Kontrak berjaya ditandatangani'
  },

  // ---- Utility Bills ----
  utility_bills: {
    not_found: 'Bil utiliti tidak dijumpai',
    paid: 'Bil utiliti berjaya dibayar',
    generated: '{{count}} bil utiliti dijana'
  },

  // ---- IoT ----
  iot: {
    meter_not_found: 'Meter tidak dijumpai',
    lock_not_found: 'Kunci tidak dijumpai',
    disconnected: 'Meter diputuskan',
    reconnected: 'Meter disambung semula',
    lock_toggled: 'Kunci ditukar',
    fingerprint_disabled: 'Akses cap jari dilumpuhkan',
    fingerprint_enabled: 'Akses cap jari diaktifkan'
  },

  // ---- Misc ----
  misc: {
    record_not_found: 'Rekod tidak dijumpai',
    notif_not_found: 'Pemberitahuan tidak dijumpai',
    automation_not_found: 'Automasi tidak dijumpai',
    config_not_found: 'Konfigurasi tidak dijumpai',
    data_reset: 'Semua data ditetapkan semula ke keadaan demo',
    data_saved: 'Data berjaya disimpan'
  },

  // ---- Reports ----
  reports: {
    owner_report: 'Laporan Pemilik',
    portfolio_report: 'Laporan Portfolio',
    generated: 'Laporan dijana',
    no_data: 'Tiada data untuk laporan'
  },

  // ---- Audit ----
  audit: {
    create: 'Dicipta {{entity}}',
    update: 'Dikemas kini {{entity}}',
    delete: 'Dipadam {{entity}}',
    login: 'Pengguna log masuk',
    password_change: 'Kata laluan ditukar',
    data_reset: 'Data sistem ditetapkan semula',
    status_change: 'Status ditukar kepada {{status}}'
  }
};
