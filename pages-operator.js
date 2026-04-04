// ============ OPERATOR PAGE GENERATORS (Interactive) ============

function h(tag, cls, html) { return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>' + html + '</' + tag + '>'; }
function initials(name) { return name.split(' ').map(w => w[0]).join(''); }

function operatorDashboard() {
  const totalRooms = PROPS.reduce((s,p) => s + p.r, 0);
  const totalOcc = PROPS.reduce((s,p) => s + Math.round(p.r * p.o / 100), 0);
  const totalRev = PROPS.reduce((s,p) => s + p.rev, 0);
  const occPct = Math.round(totalOcc / totalRooms * 100);
  const overdue = BILLS.filter(b => b.s === 'Overdue').length;
  const openTk = TICKETS.filter(t => t.s !== 'Completed').length;

  // Automation alerts
  let autoAlerts = '';
  const now = new Date();
  const expiringC = CONTRACTS.filter(c => c.end && ((new Date(c.end) - now) / (1000*60*60*24)) > 0 && ((new Date(c.end) - now) / (1000*60*60*24)) <= 30);
  const discMeters = typeof ELECTRIC_METERS !== 'undefined' ? ELECTRIC_METERS.filter(m => m.status !== 'Connected').length : 0;
  const disabledLocks = typeof SMART_LOCK_REGISTRY !== 'undefined' ? SMART_LOCK_REGISTRY.filter(l => l.status.includes('Disabled')).length : 0;

  if (expiringC.length || overdue || discMeters || disabledLocks) {
    autoAlerts = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-bottom:16px">';
    if (expiringC.length) autoAlerts += '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#00CEC922;border:1px solid #00CEC944;border-radius:10px;cursor:pointer" onclick="navigateTo(\'contracts\')"><i class="fas fa-file-contract" style="color:#00CEC9"></i><div style="font-size:11px"><strong>' + expiringC.length + ' contract(s)</strong> expiring soon<br><span style="color:var(--t3)">Auto-TA ready to generate</span></div></div>';
    if (overdue) autoAlerts += '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#E1705522;border:1px solid #E1705544;border-radius:10px;cursor:pointer" onclick="showElectricMeterManager()"><i class="fas fa-bolt" style="color:#E17055"></i><div style="font-size:11px"><strong>' + overdue + ' overdue bill(s)</strong><br><span style="color:var(--t3)">Room-level electric cut after 7 days</span></div></div>';
    if (discMeters) autoAlerts += '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FDCB6E22;border:1px solid #FDCB6E44;border-radius:10px;cursor:pointer" onclick="showElectricMeterManager()"><i class="fas fa-power-off" style="color:#FDCB6E"></i><div style="font-size:11px"><strong>' + discMeters + ' meter(s)</strong> disconnected<br><span style="color:var(--t3)">Click to manage</span></div></div>';
    if (disabledLocks) autoAlerts += '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FD79A822;border:1px solid #FD79A844;border-radius:10px;cursor:pointer" onclick="showSmartLockManager()"><i class="fas fa-fingerprint" style="color:#FD79A8"></i><div style="font-size:11px"><strong>' + disabledLocks + ' lock(s)</strong> disabled<br><span style="color:var(--t3)">Fingerprint access revoked</span></div></div>';
    autoAlerts += '</div>';
  }

  return '<div class="pg-h"><h1>Dashboard</h1><p>Welcome back! Here\'s your portfolio overview.</p></div>' +
    autoAlerts +
    '<div class="stats">' +
    stat('fa-door-open', '#6C5CE7', totalRooms, 'Total Rooms', '+8', 'up') +
    stat('fa-chart-pie', '#00CEC9', occPct + '%', 'Occupancy', '+2%', 'up') +
    stat('fa-money-bill-wave', '#00B894', 'RM ' + (totalRev/1000).toFixed(1) + 'K', 'Revenue (Apr)', '+12%', 'up') +
    stat('fa-exclamation-triangle', '#E17055', overdue, 'Overdue Bills', '', 'dn') +
    stat('fa-wrench', '#FDCB6E', openTk, 'Open Tickets', '-3', 'up') +
    stat('fa-user-plus', '#FD79A8', LEADS.length, 'New Leads', '+2', 'up') +
    '</div>' +
    '<div class="g2">' +
    panel('Revenue Trend (6 Months)', '<div class="bars" id="revChart"></div>') +
    panel('Occupancy by Property', '<div id="occBars"></div>') +
    '</div>' +
    '<div class="g2">' +
    panel('Recent Tickets', ticketListHtml(TICKETS.slice(0, 4))) +
    panel('Recent Activity', activityHtml()) +
    '</div>';
}

function operatorProperties() {
  let cards = '';
  PROPS.forEach(p => {
    const occ = Math.round(p.r * p.o / 100), vac = p.r - occ;
    cards += '<div class="prop-card" onclick="showPropertyDetail(\'' + p.n.replace(/'/g,"\\'") + '\')">' +
      '<div class="prop-img" style="background:linear-gradient(135deg,' + p.c + '22,' + p.c + '08)"><i class="fas ' + p.icon + '" style="color:' + p.c + '"></i></div>' +
      '<div class="prop-body"><h4>' + escHtml(p.n) + '</h4><div class="prop-meta"><i class="fas fa-map-marker-alt"></i> ' + escHtml(p.addr) + '</div>' +
      '<div class="prop-stats"><div class="ps"><div class="v">' + p.r + '</div><div class="l">Rooms</div></div>' +
      '<div class="ps"><div class="v">' + occ + '</div><div class="l">Occupied</div></div>' +
      '<div class="ps"><div class="v">' + vac + '</div><div class="l">Vacant</div></div></div>' +
      '<div class="prop-occ"><div class="prop-occ-fill" style="width:' + p.o + '%;background:' + p.c + '"></div></div></div></div>';
  });
  return '<div class="pg-h pg-row"><div><h1>Properties</h1><p>Manage all ' + PROPS.length + ' properties</p></div>' +
    '<button class="btn btn-p" onclick="addPropertyModal()"><i class="fas fa-plus"></i> Add Property</button></div>' +
    '<div class="prop-grid">' + cards + '</div>';
}

function operatorTenants() {
  let rows = '';
  TENANTS.forEach((t, i) => {
    const cls = t.s === 'active' ? 'b-ok' : t.s === 'pending' ? 'b-warn' : 'b-err';
    // Check-in/out evidence
    const cioRecs = CHECKINOUT_RECORDS.filter(r => r.tenant === t.n);
    const cioInfo = cioRecs.length ? cioRecs.map(r => '<span class="bs ' + (r.type === 'check-in' ? 'b-info' : 'b-warn') + '" style="font-size:9px;margin-right:2px">' + escHtml(r.type.toUpperCase()) + '</span>').join('') : '<span style="color:var(--t3);font-size:10px">None</span>';
    // TA contract
    const ta = CONTRACTS.find(c => c.tenant === t.n);
    const taInfo = ta ? '<span class="bs b-ok" style="font-size:9px;cursor:pointer" onclick="autoGenerateTA(\'' + t.n.replace(/'/g,"\\'") + '\')">' + escHtml(ta.id) + '</span>' : '<span style="color:var(--t3);font-size:10px">—</span>';
    rows += '<tr><td><div style="display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + escHtml(initials(t.n)) + '</div>' + escHtml(t.n) + '</div></td>' +
      '<td>' + escHtml(t.p) + '</td>' +
      '<td>' + escHtml(t.r) + '</td>' +
      '<td>' + escHtml(t.dep || '—') + '</td>' +
      '<td>' + cioInfo + '</td>' +
      '<td>' + taInfo + '</td>' +
      '<td><span class="bs ' + cls + '">' + escHtml(t.s) + '</span></td>' +
      '<td>' + escHtml(t.e) + '</td>' +
      '<td><button class="btn-s" onclick="showTenantDetail(\'' + t.n.replace(/'/g,"\\'") + '\')"><i class="fas fa-eye"></i></button></td></tr>';
  });
  return '<div class="pg-h pg-row"><div><h1>Tenants</h1><p>' + TENANTS.length + ' tenants across all properties</p></div>' +
    '<div style="display:flex;gap:6px"><button class="btn" style="background:#00CEC9;color:#fff" onclick="showCheckInOutList()"><i class="fas fa-clipboard-check"></i> Check-In/Out</button>' +
    '<button class="btn btn-p" onclick="addTenantModal()"><i class="fas fa-user-plus"></i> Add Tenant</button></div></div>' +
    '<div class="panel"><div class="panel-h"><h3>All Tenants</h3>' +
    '<div style="display:flex;gap:6px"><button class="btn-s" onclick="showFilterModal(\'tenants\')"><i class="fas fa-filter"></i> Filter</button>' +
    '<button class="btn-s" onclick="previewTenantsReport()"><i class="fas fa-eye"></i> Preview</button>' +
    '<button class="btn-s" onclick="exportTenants()"><i class="fas fa-download"></i> Export</button></div></div>' +
    '<table><thead><tr><th>Tenant</th><th>Unit</th><th>Rent</th><th>Deposit</th><th>Check-In/Out</th><th>TA</th><th>Status</th><th>Lease End</th><th></th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

function previewTenantsReport() {
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var html = '<div style="max-width:750px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#6C5CE7,#00CEC9);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83D\uDC65</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">TENANT SUMMARY REPORT</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + ' &bull; ' + TENANTS.length + ' Tenants</div></div>';
  var active = TENANTS.filter(function(t){return t.s==='active';}).length;
  var pending = TENANTS.filter(function(t){return t.s==='pending';}).length;
  var overdue = TENANTS.filter(function(t){return t.s==='overdue';}).length;
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#00B894">' + active + '</div><div style="font-size:10px;color:var(--t3)">Active</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#FDCB6E">' + pending + '</div><div style="font-size:10px;color:var(--t3)">Pending</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#E17055">' + overdue + '</div><div style="font-size:10px;color:var(--t3)">Overdue</div></div></div>';
  html += '<table><thead><tr><th>Name</th><th>Unit</th><th>Rent</th><th>Deposit</th><th>Status</th><th>Lease End</th></tr></thead><tbody>';
  TENANTS.forEach(function(t) {
    var cls = t.s==='active'?'b-ok':t.s==='pending'?'b-warn':'b-err';
    html += '<tr><td style="font-weight:600">' + escHtml(t.n) + '</td><td>' + escHtml(t.p) + '</td><td>' + escHtml(t.r) + '</td><td>' + escHtml(t.dep||'—') + '</td><td><span class="bs ' + cls + '">' + escHtml(t.s) + '</span></td><td>' + escHtml(t.e) + '</td></tr>';
  });
  html += '</tbody></table></div>';
  openModal('<i class="fas fa-users" style="color:#6C5CE7"></i> Tenant Summary Report', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="exportTenants()"><i class="fas fa-download"></i> Export CSV</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function operatorContracts() {
  let rows = '';
  CONTRACTS.forEach(c => {
    const cls = c.s === 'Active' ? 'b-ok' : c.s === 'Expiring Soon' ? 'b-warn' : 'b-info';
    rows += '<tr><td style="font-weight:600">' + escHtml(c.id) + '</td><td>' + escHtml(c.tenant) + '</td><td>' + escHtml(c.prop) + '</td><td>' + escHtml(c.rent) + '</td><td>' + escHtml(c.start) + '</td><td>' + escHtml(c.end) + '</td><td><span class="bs ' + cls + '">' + escHtml(c.s) + '</span></td>' +
      '<td><button class="btn-s" onclick="toast(\'Contract PDF downloading...\',\'info\')"><i class="fas fa-file-pdf"></i></button></td></tr>';
  });
  return '<div class="pg-h pg-row"><div><h1>Contracts & E-Signing</h1><p>Manage tenancy agreements</p></div>' +
    '<div style="display:flex;gap:6px"><button class="btn" style="background:#00CEC9;color:#fff" onclick="autoGenerateTA()"><i class="fas fa-robot"></i> Auto-Generate TA</button>' +
    '<button class="btn btn-p" onclick="addContractModal()"><i class="fas fa-file-signature"></i> New Contract</button></div></div>' +
    '<div class="panel"><table><thead><tr><th>ID</th><th>Tenant</th><th>Unit</th><th>Rent</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

function operatorBilling() {
  const paid = BILLS.filter(b => b.s === 'Paid');
  const pend = BILLS.filter(b => b.s === 'Pending');
  const over = BILLS.filter(b => b.s === 'Overdue');
  let rows = '';
  BILLS.forEach(b => {
    const cls = b.s === 'Paid' ? 'b-ok' : b.s === 'Pending' ? 'b-warn' : 'b-err';
    rows += '<tr><td style="font-weight:600">' + escHtml(b.id) + '</td><td>' + escHtml(b.t) + '</td><td>' + escHtml(b.a) + '</td><td><span class="bs ' + cls + '">' + escHtml(b.s) + '</span></td><td>' + escHtml(b.d) + '</td>' +
      '<td>' + (b.s !== 'Paid' ? '<button class="btn-s" onclick="payBill(\'' + b.id + '\')"><i class="fas fa-credit-card"></i> Pay</button>' : '<button class="btn-s" onclick="showBillDetail(\'' + b.id + '\')"><i class="fas fa-eye"></i></button>') + '</td></tr>';
  });
  return '<div class="pg-h"><h1>Billing & Invoices</h1><p>Track all payments and invoices</p></div>' +
    (over.length ? '<div style="background:#E1705522;border:1px solid #E1705544;border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px"><i class="fas fa-exclamation-triangle" style="color:#E17055;font-size:16px"></i><div style="flex:1;font-size:12px"><strong style="color:#E17055">' + over.length + ' Overdue Invoice(s)</strong> — Overdue tenant\'s <em>room</em> sub-meter will be auto-disconnected after 7 days. Other rooms in the same unit are not affected.</div><button class="btn-s" onclick="showElectricMeterManager()" style="font-size:10px"><i class="fas fa-bolt"></i> Meter Status</button></div>' : '') +
    '<div class="inv-sum">' +
    '<div class="inv-c"><div class="l">Paid</div><div class="amt" style="color:var(--ok)">' + paid.length + '</div><div class="l">invoices</div></div>' +
    '<div class="inv-c"><div class="l">Pending</div><div class="amt" style="color:var(--warn)">' + pend.length + '</div><div class="l">invoices</div></div>' +
    '<div class="inv-c"><div class="l">Overdue</div><div class="amt" style="color:var(--err)">' + over.length + '</div><div class="l">invoices</div></div></div>' +
    '<div class="panel"><div class="panel-h"><h3>All Invoices</h3><div style="display:flex;gap:6px">' +
    '<button class="btn-s" onclick="showFilterModal(\'bills\')"><i class="fas fa-filter"></i> Filter</button>' +
    '<button class="btn-s" onclick="exportBills()"><i class="fas fa-download"></i> Export</button>' +
    '<button class="btn" style="background:#74B9FF;color:#1a1929" onclick="showUtilityBillList()"><i class="fas fa-bolt"></i> Utility Bills</button>' +
    '<button class="btn btn-p" onclick="generateInvoicesModal()"><i class="fas fa-plus"></i> Generate</button></div></div>' +
    '<table><thead><tr><th>Invoice</th><th>Tenant</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

function operatorMaintenance() {
  return '<div class="pg-h pg-row"><div><h1>Maintenance</h1><p>' + TICKETS.length + ' tickets</p></div>' +
    '<div style="display:flex;gap:6px"><button class="btn-s" onclick="showFilterModal(\'tickets\')"><i class="fas fa-filter"></i> Filter</button>' +
    '<button class="btn-s" onclick="exportTickets()"><i class="fas fa-download"></i> Export</button>' +
    '<button class="btn btn-p" onclick="addTicketModal()"><i class="fas fa-plus"></i> New Ticket</button></div></div>' +
    '<div class="stats">' +
    stat('fa-exclamation-circle','#E17055', TICKETS.filter(t=>t.pr==='High').length, 'High Priority','','dn') +
    stat('fa-clock','#FDCB6E', TICKETS.filter(t=>t.pr==='Medium').length, 'Medium Priority','','') +
    stat('fa-check-circle','#00B894', TICKETS.filter(t=>t.pr==='Low').length, 'Low Priority','','up') +
    stat('fa-hourglass-half','#6C5CE7', '1.8h', 'Avg Response','','up') +
    '</div><div class="panel"><h3 style="margin-bottom:14px">All Tickets</h3>' + ticketListHtml(TICKETS) + '</div>';
}

function operatorVendors() {
  let cards = '';
  VENDORS.forEach(v => {
    cards += '<div class="prop-card" style="cursor:pointer"><div class="prop-body">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><div style="width:42px;height:42px;border-radius:12px;background:' + v.c + '22;color:' + v.c + ';display:flex;align-items:center;justify-content:center;font-size:18px"><i class="fas fa-tools"></i></div><div><h4 style="font-size:14px">' + escHtml(v.n) + '</h4><div style="font-size:11px;color:var(--t3)">' + escHtml(v.type) + '</div></div></div>' +
      '<div class="prop-stats"><div class="ps"><div class="v">' + v.jobs + '</div><div class="l">Jobs</div></div>' +
      '<div class="ps"><div class="v">\u2605 ' + v.rating + '</div><div class="l">Rating</div></div>' +
      '<div class="ps"><div class="v"><span class="bs b-ok">Active</span></div><div class="l">Status</div></div></div></div></div>';
  });
  return '<div class="pg-h pg-row"><div><h1>Vendors</h1><p>Manage service providers</p></div>' +
    '<button class="btn btn-p" onclick="addVendorModal()"><i class="fas fa-plus"></i> Add Vendor</button></div>' +
    '<div class="prop-grid">' + cards + '</div>';
}

// IoT Smart Lock data — grouped by property with full details
var IOT_LOCKS = [
  { n:'Main Gate', prop:'Cambridge', s:'Locked', bat:92, lastAccess:'Today 18:30', type:'Gate', firmware:'v3.2.1' },
  { n:'Block A Door', prop:'Cambridge', s:'Locked', bat:87, lastAccess:'Today 17:45', type:'Door', firmware:'v3.2.1' },
  { n:'Block C Entry', prop:'Imperial', s:'Unlocked', bat:78, lastAccess:'Today 16:20', type:'Door', firmware:'v3.1.0' },
  { n:'Main Gate', prop:'Imperial', s:'Locked', bat:45, lastAccess:'Today 15:10', type:'Gate', firmware:'v3.0.8' },
  { n:'Entrance', prop:'Westlake Villa', s:'Locked', bat:95, lastAccess:'Today 14:55', type:'Gate', firmware:'v3.2.1' },
  { n:'Pool Gate', prop:'Westlake Villa', s:'Locked', bat:82, lastAccess:'Today 09:30', type:'Gate', firmware:'v3.2.1' },
  { n:'Block B Entry', prop:'Harvard', s:'Locked', bat:65, lastAccess:'Today 12:40', type:'Door', firmware:'v3.1.0' },
  { n:'Main Gate', prop:'Harvard', s:'Locked', bat:38, lastAccess:'Today 08:20', type:'Gate', firmware:'v3.0.8' },
  { n:'Gate A', prop:'Tsing Hua', s:'Locked', bat:88, lastAccess:'Today 17:15', type:'Gate', firmware:'v3.2.1' },
  { n:'Gate B', prop:'Tsing Hua', s:'Locked', bat:91, lastAccess:'Today 16:50', type:'Gate', firmware:'v3.2.1' },
  { n:'Block B Main', prop:'Oxford', s:'Locked', bat:71, lastAccess:'Today 13:20', type:'Door', firmware:'v3.1.0' },
  { n:'Main Gate', prop:'Oxford', s:'Locked', bat:56, lastAccess:'Today 11:05', type:'Gate', firmware:'v3.0.8' },
  { n:'Block D Entry', prop:'Manchester', s:'Locked', bat:83, lastAccess:'Today 10:30', type:'Door', firmware:'v3.2.1' },
  { n:'Main Gate', prop:'Manchester', s:'Locked', bat:90, lastAccess:'Today 09:00', type:'Gate', firmware:'v3.2.1' },
  { n:'Main Gate', prop:'Beijing', s:'Locked', bat:94, lastAccess:'Today 18:10', type:'Gate', firmware:'v3.2.1' },
  { n:'Block A Door', prop:'Beijing', s:'Locked', bat:76, lastAccess:'Today 15:35', type:'Door', firmware:'v3.1.0' }
];

function operatorIoT() {
  var totalLocks = IOT_LOCKS.length;
  var online = IOT_LOCKS.filter(function(l) { return true; }).length; // All are "online" in demo
  var lowBat = IOT_LOCKS.filter(function(l) { return l.bat < 50; }).length;
  var unlocked = IOT_LOCKS.filter(function(l) { return l.s === 'Unlocked'; }).length;

  // Smart lock fingerprint / electric meter summary
  var disabledLocks = typeof SMART_LOCK_REGISTRY !== 'undefined' ? SMART_LOCK_REGISTRY.filter(function(l) { return l.status.includes('Disabled'); }).length : 0;
  var discMeters = typeof ELECTRIC_METERS !== 'undefined' ? ELECTRIC_METERS.filter(function(m) { return m.status !== 'Connected'; }).length : 0;
  var totalMeters = typeof ELECTRIC_METERS !== 'undefined' ? ELECTRIC_METERS.length : 0;

  return '<div class="pg-h"><h1>IoT & Smart Locks</h1><p>Monitor all connected devices</p></div>' +
    '<div class="stats">' +
    cStat('fa-lock','#00B894', totalLocks, 'Total Locks','','up','showIoTDeviceList(\'all\')') +
    cStat('fa-battery-quarter','#FDCB6E', lowBat, 'Low Battery','','dn','showIoTDeviceList(\'low-bat\')') +
    cStat('fa-lock-open','#E17055', unlocked, 'Unlocked','','','showIoTDeviceList(\'unlocked\')') +
    cStat('fa-fingerprint','#FD79A8', disabledLocks, 'Disabled FP','','','showSmartLockManager()') +
    cStat('fa-bolt','#6C5CE7', discMeters + '/' + totalMeters, 'Disc. Meters','','','showElectricMeterManager()') +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:16px">' +
    '<button class="btn" style="background:#FD79A8;color:#fff" onclick="showSmartLockManager()"><i class="fas fa-fingerprint"></i> Fingerprint Manager</button>' +
    '<button class="btn" style="background:#FDCB6E;color:#1a1929" onclick="showElectricMeterManager()"><i class="fas fa-bolt"></i> Electric Sub-Meters</button></div>';
}

function showIoTDeviceList(filter) {
  var filtered;
  var title;
  if (filter === 'low-bat') {
    filtered = IOT_LOCKS.filter(function(l) { return l.bat < 50; });
    title = 'Low Battery Locks (' + filtered.length + ')';
  } else if (filter === 'unlocked') {
    filtered = IOT_LOCKS.filter(function(l) { return l.s === 'Unlocked'; });
    title = 'Unlocked Devices (' + filtered.length + ')';
  } else {
    filtered = IOT_LOCKS;
    title = 'All Locks (' + filtered.length + ')';
  }

  var html = '<table><thead><tr><th>Lock</th><th>Property</th><th>Type</th><th>Status</th><th>Battery</th><th>Last Access</th><th>Firmware</th></tr></thead><tbody>';
  filtered.forEach(function(l) {
    var sc = l.s === 'Locked' ? 'b-ok' : 'b-warn';
    var batColor = l.bat >= 80 ? '#00B894' : l.bat >= 50 ? '#FDCB6E' : '#E17055';
    html += '<tr><td style="font-weight:600">' + escHtml(l.n) + '</td><td>' + escHtml(l.prop) + '</td><td>' + escHtml(l.type) + '</td>' +
      '<td><span class="bs ' + sc + '">' + escHtml(l.s) + '</span></td>' +
      '<td><span style="color:' + batColor + ';font-weight:600">' + l.bat + '%</span></td>' +
      '<td>' + escHtml(l.lastAccess) + '</td><td style="font-family:monospace;font-size:10px">' + escHtml(l.firmware) + '</td></tr>';
  });
  html += '</tbody></table>';

  openModal('<i class="fas fa-microchip" style="color:#6C5CE7"></i> ' + title, html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>', 'lg');
}

function showLockDetail(lockLabel) {
  var parts = lockLabel.split(' — ');
  var propName = parts[0], lockName = parts[1] || '';
  var lock = IOT_LOCKS.find(function(l) { return l.prop === propName && l.n === lockName; });
  if (!lock) { toast('Lock not found', 'error'); return; }

  var sc = lock.s === 'Locked' ? '#00B894' : '#FDCB6E';
  var batColor = lock.bat >= 80 ? '#00B894' : lock.bat >= 50 ? '#FDCB6E' : '#E17055';

  var html = '<div style="text-align:center;margin-bottom:16px">' +
    '<div style="font-size:48px;color:' + sc + ';margin-bottom:8px"><i class="fas fa-' + (lock.s === 'Locked' ? 'lock' : 'lock-open') + '"></i></div>' +
    '<div style="display:inline-block;padding:4px 16px;border-radius:20px;background:' + sc + '22;color:' + sc + ';font-weight:600;font-size:13px">' + lock.s + '</div></div>';

  html += '<div class="dep-card">' +
    depRow('Lock Name', lock.n) +
    depRow('Property', lock.prop) +
    depRow('Type', lock.type) +
    depRowHtml('Battery', '<span style="color:' + batColor + ';font-weight:700">' + lock.bat + '%</span> <i class="fas ' + (lock.bat >= 80 ? 'fa-battery-full' : lock.bat >= 50 ? 'fa-battery-half' : 'fa-battery-quarter') + '" style="color:' + batColor + '"></i>') +
    depRow('Last Access', lock.lastAccess) +
    depRow('Firmware', lock.firmware) +
    '</div>';

  // Simulated access log
  html += '<div style="margin-top:14px"><div style="font-size:12px;font-weight:600;margin-bottom:8px"><i class="fas fa-history" style="color:var(--p);margin-right:6px"></i>Recent Access Log</div>' +
    '<div class="timeline-item"><div class="tl-time">' + escHtml(lock.lastAccess) + '</div><div class="tl-text">Door ' + (lock.s === 'Locked' ? 'locked' : 'unlocked') + ' (auto)</div></div>' +
    '<div class="timeline-item"><div class="tl-time">Today 08:15</div><div class="tl-text">Door unlocked (fingerprint)</div></div>' +
    '<div class="timeline-item"><div class="tl-time">Yesterday 23:00</div><div class="tl-text">Door locked (auto)</div></div>' +
    '<div class="timeline-item"><div class="tl-time">Yesterday 18:20</div><div class="tl-text">Door unlocked (app)</div></div></div>';

  openModal('<i class="fas fa-lock" style="color:' + sc + '"></i> ' + escHtml(lock.prop) + ' — ' + escHtml(lock.n), html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    (lock.s === 'Locked' ? '<button class="btn" style="background:#FDCB6E;color:#1a1929" onclick="toggleIoTLock(\'' + escHtml(lock.prop) + '\',\'' + escHtml(lock.n) + '\',\'unlock\')"><i class="fas fa-lock-open"></i> Unlock</button>' :
    '<button class="btn" style="background:#00B894;color:#fff" onclick="toggleIoTLock(\'' + escHtml(lock.prop) + '\',\'' + escHtml(lock.n) + '\',\'lock\')"><i class="fas fa-lock"></i> Lock</button>'), 'sm');
}

function toggleIoTLock(propName, lockName, action) {
  var lock = IOT_LOCKS.find(function(l) { return l.prop === propName && l.n === lockName; });
  if (!lock) return;
  var newState = action === 'lock' ? 'Locked' : 'Unlocked';
  confirmDialog((action === 'lock' ? 'Lock' : 'Unlock') + ' Device?', (action === 'lock' ? 'Lock' : 'Unlock') + ' ' + escHtml(propName) + ' — ' + escHtml(lockName) + '?', function() {
    lock.s = newState;
    toast(escHtml(lockName) + ' at ' + escHtml(propName) + ' is now ' + newState, 'success');
    pushNotif('fa-lock', action === 'lock' ? '#00B894' : '#FDCB6E', 'Lock ' + newState, escHtml(propName) + ' — ' + escHtml(lockName));
    closeModal();
    if (currentPage === 'iot') navigateTo('iot');
  }, action === 'lock' ? 'success' : 'warning');
}

function operatorLandlords() {
  let rows = '';
  LANDLORDS.forEach((ll, i) => {
    // Compute financials
    let totalRev = 0, totalExp = 0;
    ll.props.forEach(pName => {
      const p = PROPS.find(x => x.n === pName);
      if (p) totalRev += p.rev;
      const e = PROPERTY_EXPENSES[pName];
      if (e) totalExp += Object.values(e).reduce((s, v) => s + v, 0);
    });
    const netPayout = totalRev - totalExp;
    const mgmtFee = Math.round(totalRev * 0.2);

    // Count tenants in landlord's properties
    const llTenants = TENANTS.filter(t => ll.props.some(p => t.p.includes(p)));
    const activeTenants = llTenants.filter(t => t.s === 'active').length;

    // Expiring contracts
    const now = new Date();
    const expiringC = CONTRACTS.filter(c => {
      if (!c.end) return false;
      const pName = c.prop.split(' ')[0];
      if (!ll.props.includes(pName)) return false;
      const diff = (new Date(c.end) - now) / (1000*60*60*24);
      return diff > 0 && diff <= 30;
    }).length;

    rows += '<tr>' +
      '<td><div style="display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + escHtml(initials(ll.n)) + '</div><div><div style="font-weight:600">' + escHtml(ll.n) + '</div><div style="font-size:9px;color:var(--t3)">' + ll.props.length + ' properties</div></div></div></td>' +
      '<td>' + ll.props.map(p => '<span class="bs b-p" style="font-size:9px;margin:1px">' + escHtml(p) + '</span>').join(' ') + '</td>' +
      '<td style="text-align:center">' + ll.units + '</td>' +
      '<td style="text-align:center"><span style="font-weight:600;color:' + (ll.occ >= 90 ? 'var(--ok)' : ll.occ >= 80 ? 'var(--warn)' : 'var(--err)') + '">' + ll.occ + '%</span></td>' +
      '<td style="font-weight:600;color:var(--ok)">RM ' + totalRev.toLocaleString() + '</td>' +
      '<td style="color:var(--err)">RM ' + totalExp.toLocaleString() + '</td>' +
      '<td style="font-weight:700;color:var(--p)">RM ' + netPayout.toLocaleString() + '</td>' +
      '<td style="text-align:center">' + activeTenants + '/' + llTenants.length + '</td>' +
      '<td>' + (expiringC ? '<span class="bs b-warn">' + expiringC + ' expiring</span>' : '<span class="bs b-ok">OK</span>') + '</td>' +
      '<td><div style="display:flex;gap:4px">' +
        '<button class="btn-s" onclick="generateOwnerReport(\'' + ll.n.replace(/'/g,"\\'") + '\')" title="Owner Report"><i class="fas fa-file-alt"></i></button>' +
        '<button class="btn-s" onclick="showLandlordDetail(\'' + ll.n.replace(/'/g,"\\'") + '\')" title="Details"><i class="fas fa-eye"></i></button></div></td></tr>';
  });

  // Summary stats
  const totalLLRevenue = LANDLORDS.reduce((s, ll) => {
    let rev = 0; ll.props.forEach(pName => { const p = PROPS.find(x => x.n === pName); if (p) rev += p.rev; }); return s + rev;
  }, 0);
  const totalMgmtFee = Math.round(totalLLRevenue * 0.2);
  const totalUnits = LANDLORDS.reduce((s, ll) => s + ll.units, 0);
  const avgOcc = Math.round(LANDLORDS.reduce((s, ll) => s + ll.occ, 0) / LANDLORDS.length);

  return '<div class="pg-h pg-row"><div><h1>Landlords</h1><p>' + LANDLORDS.length + ' property owners</p></div>' +
    '<div style="display:flex;gap:6px"><button class="btn" style="background:#FD79A8;color:#fff" onclick="generateOwnerReport()"><i class="fas fa-file-alt"></i> Owner Report</button>' +
    '<button class="btn-s" onclick="previewLandlordsReport()"><i class="fas fa-eye"></i> Preview</button>' +
    '<button class="btn-s" onclick="exportLandlords()"><i class="fas fa-download"></i> Export</button></div></div>' +
    '<div class="stats">' +
    stat('fa-users','#FD79A8', LANDLORDS.length, 'Landlords','','') +
    stat('fa-building','#6C5CE7', totalUnits, 'Total Units','','') +
    stat('fa-chart-pie','#00CEC9', avgOcc + '%', 'Avg Occupancy','','up') +
    stat('fa-money-bill-wave','#00B894', 'RM ' + (totalLLRevenue/1000).toFixed(1) + 'K', 'Gross Revenue','','up') +
    stat('fa-percentage','#FDCB6E', 'RM ' + (totalMgmtFee/1000).toFixed(1) + 'K', 'Mgmt Fee (20%)','','') +
    '</div>' +
    '<div class="panel"><div class="panel-h"><h3>All Landlords</h3></div>' +
    '<table><thead><tr><th>Landlord</th><th>Properties</th><th>Units</th><th>Occ</th><th>Revenue</th><th>Expenses</th><th>Net Payout</th><th>Tenants</th><th>Alerts</th><th></th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

function showLandlordDetail(llName) {
  var ll = LANDLORDS.find(function(l) { return l.n === llName; });
  if (!ll) { toast('Landlord not found', 'error'); return; }

  var totalRev = 0, totalExp = 0;
  ll.props.forEach(function(pName) {
    var p = PROPS.find(function(x) { return x.n === pName; });
    if (p) totalRev += p.rev;
    var e = PROPERTY_EXPENSES[pName];
    if (e) totalExp += Object.values(e).reduce(function(s, v) { return s + v; }, 0);
  });

  var llTenants = TENANTS.filter(function(t) { return ll.props.some(function(p) { return t.p.includes(p); }); });

  var html = '<div class="dep-card">' +
    depRow('Name', ll.n) +
    depRow('Properties', ll.props.join(', ')) +
    depRow('Total Units', ll.units) +
    depRow('Occupancy', ll.occ + '%') +
    depRow('Monthly Revenue', ll.rev) +
    depRow('Est. Payout', ll.payout) +
    '</div>';

  // Property breakdown
  html += '<div style="margin:14px 0"><div style="font-size:12px;font-weight:600;margin-bottom:8px"><i class="fas fa-building" style="color:var(--p);margin-right:6px"></i>Property Breakdown</div>';
  html += '<table><thead><tr><th>Property</th><th>Rooms</th><th>Occ</th><th>Revenue</th><th>Expenses</th><th>Net</th></tr></thead><tbody>';
  ll.props.forEach(function(pName) {
    var p = PROPS.find(function(x) { return x.n === pName; });
    if (!p) return;
    var exp = PROPERTY_EXPENSES[pName] ? Object.values(PROPERTY_EXPENSES[pName]).reduce(function(s, v) { return s + v; }, 0) : 0;
    var net = p.rev - exp;
    html += '<tr><td style="font-weight:600">' + escHtml(pName) + '</td><td>' + p.r + '</td><td>' + p.o + '%</td><td style="color:var(--ok)">RM ' + p.rev.toLocaleString() + '</td><td style="color:var(--err)">RM ' + exp.toLocaleString() + '</td><td style="font-weight:700;color:' + (net >= 0 ? 'var(--ok)' : 'var(--err)') + '">RM ' + net.toLocaleString() + '</td></tr>';
  });
  html += '</tbody></table></div>';

  // Tenants in landlord's properties
  if (llTenants.length) {
    html += '<div style="margin:14px 0"><div style="font-size:12px;font-weight:600;margin-bottom:8px"><i class="fas fa-users" style="color:#00CEC9;margin-right:6px"></i>Tenants (' + llTenants.length + ')</div>';
    html += '<table><thead><tr><th>Tenant</th><th>Unit</th><th>Rent</th><th>Status</th></tr></thead><tbody>';
    llTenants.forEach(function(t) {
      var cls = t.s === 'active' ? 'b-ok' : t.s === 'pending' ? 'b-warn' : 'b-err';
      html += '<tr><td>' + escHtml(t.n) + '</td><td>' + escHtml(t.p) + '</td><td>' + escHtml(t.r) + '</td><td><span class="bs ' + cls + '">' + escHtml(t.s) + '</span></td></tr>';
    });
    html += '</tbody></table></div>';
  }

  openModal('<i class="fas fa-user-tie" style="color:#FD79A8"></i> ' + escHtml(ll.n), html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="closeModal();generateOwnerReport(\'' + ll.n.replace(/'/g, "\\'") + '\')"><i class="fas fa-file-alt"></i> Owner Report</button>', 'lg');
}

function previewLandlordsReport() {
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var html = '<div style="max-width:750px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#FD79A8,#6C5CE7);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83C\uDFE0</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">LANDLORD PORTFOLIO SUMMARY</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + ' &bull; ' + LANDLORDS.length + ' Owners</div></div>';

  html += '<table><thead><tr><th>Landlord</th><th>Properties</th><th>Units</th><th>Occ</th><th>Revenue</th><th>Expenses</th><th>Net Payout</th></tr></thead><tbody>';
  var grandRev = 0, grandExp = 0;
  LANDLORDS.forEach(function(ll) {
    var rev = 0, exp = 0;
    ll.props.forEach(function(pName) {
      var p = PROPS.find(function(x) { return x.n === pName; }); if (p) rev += p.rev;
      var e = PROPERTY_EXPENSES[pName]; if (e) exp += Object.values(e).reduce(function(s, v) { return s + v; }, 0);
    });
    grandRev += rev; grandExp += exp;
    html += '<tr><td style="font-weight:600">' + escHtml(ll.n) + '</td><td>' + ll.props.join(', ') + '</td><td>' + ll.units + '</td><td>' + ll.occ + '%</td><td style="color:var(--ok)">RM ' + rev.toLocaleString() + '</td><td style="color:var(--err)">RM ' + exp.toLocaleString() + '</td><td style="font-weight:700;color:var(--p)">RM ' + (rev - exp).toLocaleString() + '</td></tr>';
  });
  html += '<tr style="background:var(--bg2)"><td colspan="4" style="font-weight:700;text-align:right">Total</td><td style="font-weight:700;color:var(--ok)">RM ' + grandRev.toLocaleString() + '</td><td style="font-weight:700;color:var(--err)">RM ' + grandExp.toLocaleString() + '</td><td style="font-weight:800;color:var(--p)">RM ' + (grandRev - grandExp).toLocaleString() + '</td></tr>';
  html += '</tbody></table></div>';

  openModal('<i class="fas fa-users" style="color:#FD79A8"></i> Landlord Portfolio Summary', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="exportLandlords()"><i class="fas fa-download"></i> Export CSV</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function exportLandlords() {
  var headers = ['Landlord', 'Properties', 'Units', 'Occupancy', 'Revenue (RM)', 'Expenses (RM)', 'Net Payout (RM)'];
  var rows = LANDLORDS.map(function(ll) {
    var rev = 0, exp = 0;
    ll.props.forEach(function(pName) {
      var p = PROPS.find(function(x) { return x.n === pName; }); if (p) rev += p.rev;
      var e = PROPERTY_EXPENSES[pName]; if (e) exp += Object.values(e).reduce(function(s, v) { return s + v; }, 0);
    });
    return [ll.n, ll.props.join('; '), ll.units, ll.occ + '%', rev, exp, rev - exp];
  });
  exportCSV(headers, rows, 'westay-landlords-' + new Date().toISOString().slice(0, 7) + '.csv');
}

function operatorLeads() {
  let rows = '';
  LEADS.forEach((l,i) => {
    const cls = l.s === 'New' ? 'b-info' : l.s === 'Contacted' ? 'b-warn' : l.s === 'Viewing Scheduled' ? 'b-p' : 'b-ok';
    rows += '<tr><td><div style="display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + escHtml(initials(l.n)) + '</div>' + escHtml(l.n) + '</div></td><td>' + escHtml(l.src) + '</td><td>' + escHtml(l.prop) + '</td><td>' + escHtml(l.budget) + '</td><td><span class="bs ' + cls + '">' + escHtml(l.s) + '</span></td><td>' + escHtml(l.date) + '</td>' +
      '<td><select class="btn-s" style="padding:3px 8px;font-size:10px" onchange="if(this.value)updateLeadStatus(\'' + l.n.replace(/'/g,"\\'") + '\',this.value)"><option value="">Action</option><option value="Contacted">Contacted</option><option value="Viewing Scheduled">Schedule Viewing</option><option value="Negotiating">Negotiating</option><option value="Converted">Converted</option></select></td></tr>';
  });
  return '<div class="pg-h pg-row"><div><h1>Leads & CRM</h1><p>Manage prospective tenants</p></div>' +
    '<div style="display:flex;gap:6px"><button class="btn-s" onclick="exportLeads()"><i class="fas fa-download"></i> Export</button>' +
    '<button class="btn btn-p" onclick="addLeadModal()"><i class="fas fa-plus"></i> Add Lead</button></div></div>' +
    '<div class="panel"><table><thead><tr><th>Name</th><th>Source</th><th>Property</th><th>Budget</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

function operatorCommunity() { return communityPage(); }

function operatorAI() {
  return '<div class="pg-h pg-row"><div><h1>AI Insights & Automations</h1><p>Intelligent recommendations & automated workflows</p></div>' +
    '<button class="btn" style="background:linear-gradient(135deg,#6C5CE7,#00CEC9);color:#fff;border:none" onclick="showAutomationDashboard()"><i class="fas fa-robot"></i> Automation Center</button></div>' +
    '<div class="g2">' +
    panel('Dynamic Pricing Engine', '<div id="priceEngine"></div>', 'ai-panel-border') +
    panel('Tenant Risk Scoring', '<div id="tenantScore"></div>', 'ai-panel-border') +
    '</div><div class="g2">' +
    panel('Automation Workflows', '<div id="wfList"></div>') +
    panel('Predictive Maintenance', predMainHtml()) +
    '</div>';
}

function operatorReports() {
  return '<div class="pg-h pg-row"><div><h1>Reports & Analytics</h1><p>Comprehensive portfolio analytics</p></div>' +
    '<div style="display:flex;gap:6px"><button class="btn" style="background:#FD79A8;color:#fff" onclick="generateOwnerReport()"><i class="fas fa-file-alt"></i> Owner Report</button>' +
    '<button class="btn" style="background:#6C5CE7;color:#fff" onclick="autoGenerateReport()"><i class="fas fa-robot"></i> Auto-Generate Report</button></div></div>' +
    '<div class="stats">' +
    stat('fa-chart-line','#6C5CE7','RM 82.4K','Monthly Revenue','+12%','up') +
    stat('fa-percentage','#00CEC9','91%','Avg Occupancy','+2%','up') +
    stat('fa-clock','#00B894','1.8h','Avg Ticket Resolution','-0.5h','up') +
    stat('fa-star','#FDCB6E','4.6','Tenant NPS','+0.3','up') +
    '</div><div class="panel"><h3 style="margin-bottom:14px">Available Reports</h3>' +
    reportListHtml() + '</div>';
}

function operatorSettings() {
  return '<div class="pg-h"><h1>Settings</h1><p>Platform configuration</p></div>' +
    '<div class="g2">' +
    panel('General', settingsGeneral()) +
    panel('Notifications', settingsNotif()) +
    '</div>' +
    '<div class="panel" style="margin-top:18px"><div class="panel-h"><h3>Automations</h3><button class="btn-s" onclick="showAutomationDashboard()"><i class="fas fa-cog"></i> Configure</button></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    settingsAutoItem('fa-chart-bar', '#6C5CE7', 'Auto-Generate Reports', 'Monthly portfolio reports', 'autoReport') +
    settingsAutoItem('fa-file-contract', '#00CEC9', 'Auto-Generate TA', 'Tenancy agreements on renewal', 'autoTA') +
    settingsAutoItem('fa-fingerprint', '#FD79A8', 'Smart Lock Auto-Disable', 'Fingerprint off on lease end', 'smartLockExpiry') +
    settingsAutoItem('fa-bolt', '#FDCB6E', 'Late Payment Electric Cut', 'Room sub-meter off after 7 days overdue (per-room)', 'latePmtElectric') +
    '</div></div>' +
    '<div class="panel" style="margin-top:18px"><div class="panel-h"><h3>Data Export</h3></div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost" onclick="exportTenants()"><i class="fas fa-download"></i> Export Tenants</button>' +
    '<button class="btn btn-ghost" onclick="exportBills()"><i class="fas fa-download"></i> Export Bills</button>' +
    '<button class="btn btn-ghost" onclick="exportTickets()"><i class="fas fa-download"></i> Export Tickets</button></div></div>';
}

// ============ ADMIN-ONLY PAGES ============

function adminSettings() {
  return '<div class="pg-h"><h1>Admin Settings</h1><p>Full platform configuration & data management</p></div>' +
    '<div class="g2">' +
    panel('General', settingsGeneral()) +
    panel('Notifications', settingsNotif()) +
    '</div>' +
    '<div class="panel" style="margin-top:18px"><div class="panel-h"><h3>Automations</h3><button class="btn-s" onclick="showAutomationDashboard()"><i class="fas fa-cog"></i> Configure</button></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    settingsAutoItem('fa-chart-bar', '#6C5CE7', 'Auto-Generate Reports', 'Monthly portfolio reports', 'autoReport') +
    settingsAutoItem('fa-file-contract', '#00CEC9', 'Auto-Generate TA', 'Tenancy agreements on renewal', 'autoTA') +
    settingsAutoItem('fa-fingerprint', '#FD79A8', 'Smart Lock Auto-Disable', 'Fingerprint off on lease end', 'smartLockExpiry') +
    settingsAutoItem('fa-bolt', '#FDCB6E', 'Late Payment Electric Cut', 'Room sub-meter off after 7 days overdue (per-room)', 'latePmtElectric') +
    '</div></div>' +
    '<div class="panel" style="margin-top:18px"><div class="panel-h"><h3>Data Management</h3></div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost" onclick="exportTenants()"><i class="fas fa-download"></i> Export Tenants</button>' +
    '<button class="btn btn-ghost" onclick="exportBills()"><i class="fas fa-download"></i> Export Bills</button>' +
    '<button class="btn btn-ghost" onclick="exportTickets()"><i class="fas fa-download"></i> Export Tickets</button>' +
    '<button class="btn" style="background:var(--err);color:#fff" onclick="resetAllData()"><i class="fas fa-undo"></i> Reset Demo Data</button></div></div>';
}

function adminUsers() {
  let html = '<div class="pg-h"><h1>User Management</h1><p>Manage platform user accounts</p>' +
    '<button class="btn" onclick="adminAddUserModal()"><i class="fas fa-user-plus"></i> Add User</button></div>';

  html += '<div class="panel"><div class="panel-h"><h3>All Users</h3>' +
    '<button class="btn-s" onclick="adminLoadUsers()"><i class="fas fa-sync-alt"></i> Refresh</button></div>' +
    '<div id="adminUserList" style="color:var(--t3);padding:20px;text-align:center"><i class="fas fa-spinner fa-spin"></i> Loading users...</div></div>';

  // Auto-load users after render
  setTimeout(function() { adminLoadUsers(); }, 100);
  return html;
}

function adminLoadUsers() {
  apiFetch('/auth/users').then(function(users) {
    const el = document.getElementById('adminUserList');
    if (!el) return;
    if (!users || users.error) {
      el.innerHTML = '<div style="color:var(--err)"><i class="fas fa-exclamation-circle"></i> ' + escHtml((users && users.error) || 'Failed to load users') + '</div>';
      return;
    }
    if (!users.length) {
      el.innerHTML = '<div style="color:var(--t3)">No users found</div>';
      return;
    }
    let tbl = '<table class="tbl"><thead><tr><th>ID</th><th>Username</th><th>Name</th><th>Role</th><th>Email</th><th>Last Login</th><th>Actions</th></tr></thead><tbody>';
    users.forEach(function(u) {
      const roleColors = { admin:'#E84393', operator:'#6C5CE7', tenant:'#00CEC9', landlord:'#FD79A8', vendor:'#00B894', agent:'#FDCB6E' };
      const rc = roleColors[u.role] || '#A7A5C6';
      tbl += '<tr><td>' + u.id + '</td><td><strong>' + escHtml(u.username) + '</strong></td><td>' + escHtml(u.name) + '</td>' +
        '<td><span class="bs" style="background:' + rc + '22;color:' + rc + '">' + escHtml(u.role) + '</span></td>' +
        '<td>' + escHtml(u.email || '-') + '</td>' +
        '<td>' + (u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never') + '</td>' +
        '<td><button class="btn-s" style="background:var(--err);color:#fff" onclick="adminDeleteUser(' + u.id + ',\'' + escHtml(u.username) + '\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
    tbl += '</tbody></table>';
    el.innerHTML = tbl;
  });
}

function adminAddUserModal() {
  const roles = ['admin', 'operator', 'tenant', 'landlord', 'vendor', 'agent'];
  let roleOpts = roles.map(function(r) { return '<option value="' + r + '">' + r.charAt(0).toUpperCase() + r.slice(1) + '</option>'; }).join('');
  const body = '<div style="display:grid;gap:12px">' +
    '<div><label style="font-size:11px;color:var(--t3)">Username</label><input id="newUserUsername" class="inp" placeholder="username"></div>' +
    '<div><label style="font-size:11px;color:var(--t3)">Password</label><input id="newUserPassword" class="inp" type="password" placeholder="min 6 chars"></div>' +
    '<div><label style="font-size:11px;color:var(--t3)">Full Name</label><input id="newUserName" class="inp" placeholder="Full name"></div>' +
    '<div><label style="font-size:11px;color:var(--t3)">Role</label><select id="newUserRole" class="inp">' + roleOpts + '</select></div>' +
    '<div><label style="font-size:11px;color:var(--t3)">Email</label><input id="newUserEmail" class="inp" placeholder="email@example.com"></div>' +
    '<div><label style="font-size:11px;color:var(--t3)">Phone</label><input id="newUserPhone" class="inp" placeholder="+60 12-345 6789"></div>' +
    '</div>';
  const footer = '<button class="btn" onclick="adminCreateUser()"><i class="fas fa-user-plus"></i> Create User</button>';
  openModal('Add New User', body, footer, 'sm');
}

function adminCreateUser() {
  const data = {
    username: document.getElementById('newUserUsername').value.trim(),
    password: document.getElementById('newUserPassword').value,
    name: document.getElementById('newUserName').value.trim(),
    role: document.getElementById('newUserRole').value,
    email: document.getElementById('newUserEmail').value.trim() || undefined,
    phone: document.getElementById('newUserPhone').value.trim() || undefined
  };
  if (!data.username || !data.password || !data.name) {
    toast('Username, password, and name are required', 'error');
    return;
  }
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }).then(function(res) {
    if (res && !res.error) {
      closeModal();
      toast('User created: ' + escHtml(res.username), 'success');
      adminLoadUsers();
    } else {
      toast((res && res.error) || 'Failed to create user', 'error');
    }
  });
}

function adminDeleteUser(id, username) {
  if (!confirm('Delete user "' + username + '"? This cannot be undone.')) return;
  apiFetch('/auth/users/' + id, { method: 'DELETE' }).then(function(res) {
    if (res && res.success) {
      toast('User deleted', 'success');
      adminLoadUsers();
    } else {
      toast((res && res.error) || 'Failed to delete user', 'error');
    }
  });
}

function adminAudit() {
  let html = '<div class="pg-h"><h1>Audit Log</h1><p>Track all system changes and user activity</p>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn-s" onclick="adminLoadAudit()"><i class="fas fa-sync-alt"></i> Refresh</button>' +
    '<button class="btn-s" onclick="adminExportAudit()"><i class="fas fa-download"></i> Export CSV</button>' +
    '</div></div>';

  html += '<div class="panel" style="margin-bottom:14px"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
    '<select id="auditAction" class="inp" style="width:auto;min-width:120px" onchange="adminLoadAudit()">' +
    '<option value="">All Actions</option><option value="create">Create</option><option value="update">Update</option>' +
    '<option value="delete">Delete</option><option value="login">Login</option></select>' +
    '<select id="auditEntity" class="inp" style="width:auto;min-width:120px" onchange="adminLoadAudit()">' +
    '<option value="">All Entities</option><option value="props">Properties</option><option value="tenants">Tenants</option>' +
    '<option value="bills">Bills</option><option value="tickets">Tickets</option><option value="users">Users</option></select>' +
    '<input id="auditFrom" class="inp" type="date" style="width:auto" onchange="adminLoadAudit()">' +
    '<input id="auditTo" class="inp" type="date" style="width:auto" onchange="adminLoadAudit()">' +
    '</div></div>';

  html += '<div class="panel"><div id="auditList" style="color:var(--t3);padding:20px;text-align:center"><i class="fas fa-spinner fa-spin"></i> Loading audit log...</div></div>';

  setTimeout(function() { adminLoadAudit(); }, 100);
  return html;
}

function adminLoadAudit() {
  let qs = '?limit=100';
  var action = document.getElementById('auditAction');
  var entity = document.getElementById('auditEntity');
  var from = document.getElementById('auditFrom');
  var to = document.getElementById('auditTo');
  if (action && action.value) qs += '&action=' + action.value;
  if (entity && entity.value) qs += '&entity=' + entity.value;
  if (from && from.value) qs += '&from=' + from.value;
  if (to && to.value) qs += '&to=' + to.value;

  apiFetch('/audit' + qs).then(function(entries) {
    const el = document.getElementById('auditList');
    if (!el) return;
    if (!entries || entries.error) {
      el.innerHTML = '<div style="color:var(--err)"><i class="fas fa-exclamation-circle"></i> ' + escHtml((entries && entries.error) || 'Failed to load audit log') + '</div>';
      return;
    }
    var list = Array.isArray(entries) ? entries : (entries.data || []);
    if (!list.length) {
      el.innerHTML = '<div style="color:var(--t3)">No audit entries found</div>';
      return;
    }
    let tbl = '<table class="tbl"><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>User</th><th>Details</th></tr></thead><tbody>';
    list.forEach(function(e) {
      const actionColors = { create:'#00B894', update:'#6C5CE7', delete:'#E17055', login:'#FDCB6E' };
      const ac = actionColors[e.action] || '#A7A5C6';
      tbl += '<tr><td style="white-space:nowrap;font-size:11px">' + new Date(e.timestamp).toLocaleString() + '</td>' +
        '<td><span class="bs" style="background:' + ac + '22;color:' + ac + '">' + escHtml(e.action) + '</span></td>' +
        '<td>' + escHtml(e.entity || '-') + (e.entityId ? ' #' + escHtml(String(e.entityId)) : '') + '</td>' +
        '<td>' + escHtml(e.username || '-') + ' <span style="font-size:10px;color:var(--t3)">(' + escHtml(e.role || '-') + ')</span></td>' +
        '<td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis">' + escHtml(e.details ? JSON.stringify(e.details).slice(0, 80) : '-') + '</td></tr>';
    });
    tbl += '</tbody></table>';
    el.innerHTML = tbl;
  });
}

function adminExportAudit() {
  var token = getAuthToken();
  if (!token) { toast('Not authenticated', 'error'); return; }
  var base = window.API_BASE || '/api';
  window.open(base + '/audit/export?token=' + encodeURIComponent(token), '_blank');
}

function settingsAutoItem(icon, color, name, desc, key) {
  return '<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg3);border-radius:10px">' +
    '<div style="width:34px;height:34px;border-radius:9px;background:' + color + '22;color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:14px"><i class="fas ' + icon + '"></i></div>' +
    '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + name + '</div><div style="font-size:10px;color:var(--t3)">' + desc + '</div></div>' +
    '<div class="wf-toggle' + (AUTOMATIONS[key].enabled ? '' : ' off') + '" onclick="toggleAutomation(\'' + key + '\',this)"></div></div>';
}
