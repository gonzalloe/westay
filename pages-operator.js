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
    rows += '<tr><td><div style="display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + escHtml(initials(t.n)) + '</div>' + escHtml(t.n) + '</div></td><td>' + escHtml(t.p) + '</td><td>' + escHtml(t.r) + '</td><td><span class="bs ' + cls + '">' + escHtml(t.s) + '</span></td><td>' + escHtml(t.e) + '</td>' +
      '<td><button class="btn-s" onclick="showTenantDetail(\'' + t.n.replace(/'/g,"\\'") + '\')"><i class="fas fa-eye"></i></button></td></tr>';
  });
  return '<div class="pg-h pg-row"><div><h1>Tenants</h1><p>' + TENANTS.length + ' tenants across all properties</p></div>' +
    '<button class="btn btn-p" onclick="addTenantModal()"><i class="fas fa-user-plus"></i> Add Tenant</button></div>' +
    '<div class="panel"><div class="panel-h"><h3>All Tenants</h3>' +
    '<div style="display:flex;gap:6px"><button class="btn-s" onclick="showFilterModal(\'tenants\')"><i class="fas fa-filter"></i> Filter</button>' +
    '<button class="btn-s" onclick="exportTenants()"><i class="fas fa-download"></i> Export</button></div></div>' +
    '<table><thead><tr><th>Tenant</th><th>Unit</th><th>Rent</th><th>Status</th><th>Lease End</th><th></th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
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

function operatorIoT() {
  const locks = [
    { n:'Cambridge Main Gate', s:'Locked', bat:'92%', c:'#00B894' },
    { n:'Imperial Block C', s:'Unlocked', bat:'78%', c:'#FDCB6E' },
    { n:'Westlake Entrance', s:'Locked', bat:'95%', c:'#00B894' },
    { n:'Harvard Block B', s:'Locked', bat:'65%', c:'#E17055' },
    { n:'Tsing Hua Gate A', s:'Locked', bat:'88%', c:'#00B894' },
    { n:'Oxford Block B', s:'Locked', bat:'71%', c:'#FDCB6E' }
  ];
  let cards = '';
  locks.forEach(l => {
    const sc = l.s === 'Locked' ? '#00B894' : '#FDCB6E';
    cards += '<div class="lock-card" onclick="toast(\'Lock: ' + l.n + ' — ' + l.s + '\',\'info\')"><div class="lock-icon" style="color:' + sc + '"><i class="fas fa-' + (l.s === 'Locked' ? 'lock' : 'lock-open') + '"></i></div>' +
      '<div class="lock-status" style="background:' + sc + '22;color:' + sc + '">' + l.s + '</div>' +
      '<div class="lock-name">' + l.n + '</div><div class="lock-meta">Battery: ' + l.bat + '</div></div>';
  });
  return '<div class="pg-h"><h1>IoT & Smart Locks</h1><p>Monitor all connected devices</p></div>' +
    '<div class="stats">' +
    stat('fa-lock','#00B894','24','Devices Online','','up') +
    stat('fa-battery-half','#FDCB6E','3','Low Battery','','dn') +
    stat('fa-door-open','#6C5CE7','156','Access Events Today','','up') +
    stat('fa-bolt','#E17055','2.4 kWh','Avg Energy/Room','','up') +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:16px">' +
    '<button class="btn" style="background:#FD79A8;color:#fff" onclick="showSmartLockManager()"><i class="fas fa-fingerprint"></i> Fingerprint Manager</button>' +
    '<button class="btn" style="background:#FDCB6E;color:#1a1929" onclick="showElectricMeterManager()"><i class="fas fa-bolt"></i> Electric Sub-Meters</button>' +
    '<button class="btn" style="background:#00CEC9;color:#fff" onclick="showCheckInOutList()"><i class="fas fa-clipboard-check"></i> Check-In/Out</button></div>' +
    '<div class="panel"><h3 style="margin-bottom:14px">Smart Locks</h3>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">' + cards + '</div></div>';
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
    '<div class="panel" style="margin-top:18px"><div class="panel-h"><h3>Data Management</h3></div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost" onclick="exportTenants()"><i class="fas fa-download"></i> Export Tenants</button>' +
    '<button class="btn btn-ghost" onclick="exportBills()"><i class="fas fa-download"></i> Export Bills</button>' +
    '<button class="btn btn-ghost" onclick="exportTickets()"><i class="fas fa-download"></i> Export Tickets</button>' +
    '<button class="btn" style="background:var(--err);color:#fff" onclick="resetAllData()"><i class="fas fa-undo"></i> Reset Demo Data</button></div></div>';
}

function settingsAutoItem(icon, color, name, desc, key) {
  return '<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg3);border-radius:10px">' +
    '<div style="width:34px;height:34px;border-radius:9px;background:' + color + '22;color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:14px"><i class="fas ' + icon + '"></i></div>' +
    '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + name + '</div><div style="font-size:10px;color:var(--t3)">' + desc + '</div></div>' +
    '<div class="wf-toggle' + (AUTOMATIONS[key].enabled ? '' : ' off') + '" onclick="toggleAutomation(\'' + key + '\',this)"></div></div>';
}
