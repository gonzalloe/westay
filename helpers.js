// ============ SHARED UI HELPERS ============
// Note: Data passed to these functions should already be escaped by callers.
// Functions that display user-modifiable data (names, phones, etc.) use escHtml().

function stat(icon, color, val, label, change, dir) {
  const chCls = dir === 'up' ? 'ch up' : dir === 'dn' ? 'ch dn' : 'ch';
  return '<div class="stat"><div class="top"><div class="ic" style="background:' + color + '22;color:' + color + '"><i class="fas ' + icon + '"></i></div>' +
    (change ? '<span class="' + chCls + '">' + escHtml(change) + '</span>' : '') +
    '</div><div class="val">' + escHtml(String(val)) + '</div><div class="lbl">' + escHtml(label) + '</div></div>';
}

// Clickable stat card — wraps stat content in an onclick div
function cStat(icon, color, val, label, change, dir, onclick) {
  const chCls = dir === 'up' ? 'ch up' : dir === 'dn' ? 'ch dn' : 'ch';
  return '<div class="stat" style="cursor:pointer" onclick="' + onclick + '"><div class="top"><div class="ic" style="background:' + color + '22;color:' + color + '"><i class="fas ' + icon + '"></i></div>' +
    (change ? '<span class="' + chCls + '">' + escHtml(change) + '</span>' : '') +
    '</div><div class="val">' + escHtml(String(val)) + '</div><div class="lbl">' + escHtml(label) + '</div></div>';
}

function panel(title, content, extraClass) {
  return '<div class="panel' + (extraClass ? ' ' + extraClass : '') + '"><div class="panel-h"><h3>' + escHtml(title) + '</h3></div>' + content + '</div>';
}

function depRow(k, v) {
  return '<div class="dep-row"><div class="k">' + escHtml(String(k)) + '</div><div class="v">' + escHtml(String(v)) + '</div></div>';
}

// Variant: allows trusted HTML in value (use only for static badge markup, never user input)
function depRowHtml(k, vHtml) {
  return '<div class="dep-row"><div class="k">' + escHtml(String(k)) + '</div><div class="v">' + vHtml + '</div></div>';
}

function qAction(icon, color, title, sub) {
  return '<div style="padding:16px;background:var(--bg3);border-radius:12px;cursor:pointer;text-align:center;transition:.2s" onmouseover="this.style.background=\'var(--card)\'" onmouseout="this.style.background=\'var(--bg3)\'">' +
    '<div style="width:40px;height:40px;border-radius:10px;background:' + color + '22;color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:16px;margin:0 auto 8px"><i class="fas ' + icon + '"></i></div>' +
    '<div style="font-size:12px;font-weight:600">' + title + '</div><div style="font-size:10px;color:var(--t3)">' + sub + '</div></div>';
}

function meterRow(icon, color, label, period, val, unit) {
  return '<div class="meter-row"><div class="meter-ic" style="background:' + color + '22;color:' + color + '"><i class="fas ' + icon + '"></i></div>' +
    '<div class="meter-info"><h5>' + label + '</h5><p>' + period + '</p></div>' +
    '<div class="meter-val"><div class="v">' + val + '</div><div class="u">' + unit + '</div></div></div>';
}

function ticketListHtml(tickets) {
  let html = '';
  tickets.forEach(tk => {
    const pcls = tk.pr === 'High' ? 'b-err' : tk.pr === 'Medium' ? 'b-warn' : 'b-ok';
    html += '<div class="tk" onclick="showTicketDetail(\'' + tk.id + '\')"><div class="tk-ic" style="background:' + tk.c + '22;color:' + tk.c + '"><i class="fas ' + tk.icon + '"></i></div>' +
      '<div class="tk-info"><h5>' + escHtml(tk.t) + '</h5><p>' + escHtml(tk.loc) + ' \u2022 ' + escHtml(tk.time) + '</p></div>' +
      '<span class="bs ' + pcls + '">' + escHtml(tk.pr) + '</span></div>';
  });
  return html;
}

function activityHtml() {
  const acts = [
    { c:'#00B894', t:'Sarah Lim paid RM 280', time:'35 min ago' },
    { c:'#E17055', t:'New ticket: Water heater (Cambridge)', time:'40 min ago' },
    { c:'#6C5CE7', t:'Ahmad Rizal signed lease agreement', time:'2h ago' },
    { c:'#FDCB6E', t:'Vendor assigned to WiFi repair', time:'3h ago' },
    { c:'#FD79A8', t:'New lead: Daniel Tan (Website)', time:'5h ago' }
  ];
  let html = '';
  acts.forEach(a => {
    html += '<div class="act"><div class="act-dot" style="background:' + a.c + '"></div><div><div class="act-p">' + a.t + '</div><div class="act-t">' + a.time + '</div></div></div>';
  });
  return html;
}

function tenantBillsHtml() {
  var tenant = (typeof ROLE_CONFIG !== 'undefined' && typeof currentRole !== 'undefined' && ROLE_CONFIG[currentRole]) ? ROLE_CONFIG[currentRole].user.name : 'Sarah Lim';
  var myRentBills = BILLS.filter(function(b) { return b.t === tenant; });
  var myUtilBills = typeof UTILITY_BILLS !== 'undefined' ? UTILITY_BILLS.filter(function(b) { return b.tenant === tenant; }) : [];

  // Combine both types
  var allBills = [];
  myRentBills.forEach(function(b) {
    allBills.push({ id: b.id, type: 'Rent', amount: b.a, status: b.s, date: b.d, billType: 'rent', icon: 'fa-home', color: '#6C5CE7' });
  });
  myUtilBills.forEach(function(b) {
    allBills.push({ id: b.id, type: 'Utility', amount: 'RM ' + b.total.toFixed(2), status: b.status, date: b.period, billType: 'utility', icon: 'fa-bolt', color: '#FDCB6E' });
  });

  if (!allBills.length) return '<div style="color:var(--t3);font-size:12px;padding:10px">No bills found</div>';

  var html = '';
  allBills.forEach(function(b) {
    var isPaid = b.status === 'Paid';
    var cls = isPaid ? 'b-ok' : b.status === 'Pending' ? 'b-warn' : 'b-err';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:8px;cursor:pointer" onclick="navigateTo(\'my-bills\')">' +
      '<div style="width:30px;height:30px;border-radius:8px;background:' + b.color + '22;color:' + b.color + ';display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0"><i class="fas ' + b.icon + '"></i></div>' +
      '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">' + escHtml(b.id) + ' <span style="font-size:9px;color:var(--t3);font-weight:400">' + escHtml(b.type) + '</span></div><div style="font-size:10px;color:var(--t3)">' + escHtml(b.date) + '</div></div>' +
      '<div style="font-size:13px;font-weight:700;white-space:nowrap">' + escHtml(b.amount) + '</div>' +
      (isPaid ? '<span class="bs ' + cls + '" style="flex-shrink:0">' + escHtml(b.status) + '</span>' :
        '<button class="btn btn-p" style="padding:4px 10px;font-size:10px;flex-shrink:0" onclick="event.stopPropagation();tenantPayWithGateway(\'' + b.billType + '\',\'' + b.id + '\')"><i class="fas fa-credit-card"></i> Pay</button>') +
      '</div>';
  });

  // View all link
  html += '<div style="text-align:center;padding:8px"><button class="btn-s" style="font-size:10px" onclick="navigateTo(\'my-bills\')"><i class="fas fa-arrow-right"></i> View All Bills</button></div>';
  return html;
}

function eventsHtml() {
  const evts = [
    { d:'05', m:'Apr', n:'Movie Night', desc:'Tsing Hua common room \u2022 8 PM' },
    { d:'08', m:'Apr', n:'Study Group Kickoff', desc:'Cambridge library \u2022 3 PM' },
    { d:'12', m:'Apr', n:'Weekend BBQ', desc:'Westlake garden \u2022 6 PM' },
    { d:'15', m:'Apr', n:'Fitness Challenge', desc:'All properties \u2022 7 AM' }
  ];
  let html = '';
  evts.forEach(e => {
    html += '<div class="ev"><div class="ev-date"><div class="d">' + e.d + '</div><div class="m">' + e.m + '</div></div>' +
      '<div class="ev-info"><h5>' + e.n + '</h5><p>' + e.desc + '</p></div></div>';
  });
  return html;
}

function feedHtml() {
  const feeds = [
    { n:'Sarah L.', msg:'Anyone want to join a morning jog group? \ud83c\udfc3\u200d\u2640\ufe0f', time:'2h ago', c:'#6C5CE7' },
    { n:'Ahmad R.', msg:'Looking for a study buddy for finals prep.', time:'5h ago', c:'#00CEC9' },
    { n:'WeStay', msg:'\ud83c\udf89 April community dinner is this Saturday! RSVP now!', time:'1d ago', c:'#FD79A8' }
  ];
  let html = '';
  feeds.forEach(f => {
    const init = f.n.split(' ').map(w => w[0]).join('');
    html += '<div class="feed"><div class="feed-h"><div class="feed-av" style="background:' + f.c + '">' + init + '</div>' +
      '<div class="feed-name">' + f.n + '</div><div class="feed-time">' + f.time + '</div></div><p>' + f.msg + '</p></div>';
  });
  return html;
}

function communityPage() {
  return '<div class="pg-h"><h1>Community</h1><p>Connect with your community</p></div>' +
    '<div class="g2">' +
    panel('Events', '<div id="eventList"></div>') +
    panel('Feed', '<div id="feedList"></div>') +
    '</div>';
}

function propCardHtml(p) {
  const occ = Math.round(p.r * p.o / 100), vac = p.r - occ;
  return '<div class="prop-card"><div class="prop-img" style="background:linear-gradient(135deg,' + p.c + '22,' + p.c + '08)">' +
    '<i class="fas ' + p.icon + '" style="color:' + p.c + '"></i></div>' +
    '<div class="prop-body"><h4>' + escHtml(p.n) + '</h4><div class="prop-meta"><i class="fas fa-map-marker-alt"></i> ' + escHtml(p.addr) + '</div>' +
    '<div class="prop-stats"><div class="ps"><div class="v">' + p.r + '</div><div class="l">Rooms</div></div>' +
    '<div class="ps"><div class="v">' + occ + '</div><div class="l">Occupied</div></div>' +
    '<div class="ps"><div class="v">' + vac + '</div><div class="l">Vacant</div></div></div>' +
    '<div class="prop-occ"><div class="prop-occ-fill" style="width:' + p.o + '%;background:' + p.c + '"></div></div></div></div>';
}

function landlordPropsHtml(ll) {
  let html = '';
  ll.props.forEach(name => {
    const p = PROPS.find(x => x.n === name);
    if (p) html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:10px">' +
      '<div style="width:40px;height:40px;border-radius:10px;background:' + p.c + '22;color:' + p.c + ';display:flex;align-items:center;justify-content:center;font-size:16px"><i class="fas ' + p.icon + '"></i></div>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + escHtml(p.n) + '</div><div style="font-size:10px;color:var(--t3)">' + p.r + ' rooms \u2022 ' + p.o + '% occupied</div></div>' +
      '<div style="font-size:14px;font-weight:700;color:var(--ok)">RM ' + (p.rev/1000).toFixed(1) + 'K</div></div>';
  });
  return html;
}

function landlordPayoutsHtml() {
  const payouts = [
    { m:'April 2026', a:'RM 23,200', s:'Processing', d:'05 Apr 2026' },
    { m:'March 2026', a:'RM 21,500', s:'Paid', d:'05 Mar 2026' },
    { m:'February 2026', a:'RM 20,800', s:'Paid', d:'05 Feb 2026' }
  ];
  let html = '<table><thead><tr><th>Month</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>';
  payouts.forEach(p => {
    const cls = p.s === 'Paid' ? 'b-ok' : 'b-warn';
    html += '<tr><td>' + p.m + '</td><td style="font-weight:600">' + p.a + '</td><td><span class="bs ' + cls + '">' + p.s + '</span></td><td>' + p.d + '</td></tr>';
  });
  return html + '</tbody></table>';
}

function workOrdersHtml(orders) {
  let html = '';
  orders.forEach(wo => {
    const cls = wo.s === 'Completed' ? 'b-ok' : wo.s === 'In Progress' ? 'b-warn' : 'b-info';
    const pcls = wo.pr === 'High' ? 'b-err' : wo.pr === 'Medium' ? 'b-warn' : 'b-ok';
    html += '<div class="tk"><div class="tk-ic" style="background:var(--p);color:#fff;font-size:11px;font-weight:700">' + escHtml(wo.id.split('-')[1]) + '</div>' +
      '<div class="tk-info"><h5>' + escHtml(wo.desc) + '</h5><p>' + escHtml(wo.loc) + ' \u2022 ' + escHtml(wo.date) + '</p></div>' +
      '<span class="bs ' + pcls + '" style="margin-right:6px">' + escHtml(wo.pr) + '</span>' +
      '<span class="bs ' + cls + '">' + escHtml(wo.s) + '</span></div>';
  });
  return html;
}

function agentLeadsHtml() {
  let html = '';
  LEADS.slice(0, 4).forEach((l, i) => {
    const cls = l.s === 'New' ? 'b-info' : l.s === 'Contacted' ? 'b-warn' : l.s === 'Viewing Scheduled' ? 'b-p' : 'b-ok';
    html += '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:8px">' +
      '<div style="width:32px;height:32px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + escHtml(initials(l.n)) + '</div>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + escHtml(l.n) + '</div><div style="font-size:10px;color:var(--t3)">' + escHtml(l.src) + ' \u2022 ' + escHtml(l.budget) + '</div></div>' +
      '<span class="bs ' + cls + '">' + escHtml(l.s) + '</span></div>';
  });
  return html;
}

function agentLeadsTableHtml() {
  let rows = '';
  LEADS.forEach((l, i) => {
    const cls = l.s === 'New' ? 'b-info' : l.s === 'Contacted' ? 'b-warn' : l.s === 'Viewing Scheduled' ? 'b-p' : 'b-ok';
    rows += '<tr><td><div style="display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + escHtml(initials(l.n)) + '</div>' + escHtml(l.n) + '</div></td>' +
      '<td>' + escHtml(l.phone) + '</td><td>' + escHtml(l.src) + '</td><td>' + escHtml(l.prop) + '</td><td>' + escHtml(l.budget) + '</td><td><span class="bs ' + cls + '">' + escHtml(l.s) + '</span></td></tr>';
  });
  return '<table><thead><tr><th>Name</th><th>Phone</th><th>Source</th><th>Property</th><th>Budget</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function agentViewingsHtml() {
  const viewings = [
    { n:'Kevin Lee', prop:'Westlake Villa', date:'03 Apr 2026', time:'10:00 AM', s:'Confirmed' },
    { n:'Aisha Mohamed', prop:'Oxford', date:'03 Apr 2026', time:'2:30 PM', s:'Pending' },
    { n:'Daniel Tan', prop:'Cambridge', date:'04 Apr 2026', time:'11:00 AM', s:'Pending' }
  ];
  let html = '';
  viewings.forEach((v, i) => {
    const cls = v.s === 'Confirmed' ? 'b-ok' : 'b-warn';
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:10px">' +
      '<div style="min-width:48px;text-align:center;padding:8px;background:var(--card);border-radius:8px">' +
      '<div style="font-size:14px;font-weight:700;color:var(--p)">' + v.date.split(' ')[0] + '</div>' +
      '<div style="font-size:9px;color:var(--t3)">' + v.date.split(' ')[1] + '</div></div>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + v.n + '</div>' +
      '<div style="font-size:10px;color:var(--t3)">' + v.prop + ' \u2022 ' + v.time + '</div></div>' +
      '<span class="bs ' + cls + '">' + v.s + '</span></div>';
  });
  return html;
}

function predMainHtml() {
  const preds = [
    { item:'Water heater', loc:'Harvard B302', risk:'78%', c:'#E17055' },
    { item:'AC compressor', loc:'Imperial C201', risk:'45%', c:'#FDCB6E' },
    { item:'Door lock battery', loc:'Oxford B105', risk:'92%', c:'#E17055' }
  ];
  let html = '';
  preds.forEach(p => {
    html += '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#232136;border-radius:8px;margin-bottom:8px">' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + p.item + '</div><div style="font-size:10px;color:#A7A5C6">' + p.loc + '</div></div>' +
      '<div style="font-size:14px;font-weight:700;color:' + p.c + '">' + p.risk + '</div></div>';
  });
  return html;
}

function reportListHtml() {
  const reports = [
    { n:'Monthly Revenue Report', icon:'fa-chart-line', c:'#6C5CE7', desc:'Revenue breakdown by property', exportFn:'exportBills()', previewFn:'previewRevenueReport()' },
    { n:'Occupancy Trend', icon:'fa-chart-bar', c:'#00CEC9', desc:'6-month occupancy analysis', exportFn:'toast(\"Exporting...\",\"info\")', previewFn:'previewOccupancyReport()' },
    { n:'Maintenance Summary', icon:'fa-wrench', c:'#FDCB6E', desc:'Ticket analysis & vendor performance', exportFn:'exportTickets()', previewFn:'previewMaintenanceReport()' },
    { n:'Tenant Satisfaction (NPS)', icon:'fa-star', c:'#FD79A8', desc:'Monthly survey results', exportFn:'toast(\"Exporting NPS...\",\"info\")', previewFn:'previewNPSReport()' },
    { n:'Financial P&L', icon:'fa-money-bill-wave', c:'#00B894', desc:'Profit & loss statement', exportFn:'toast(\"Exporting P&L...\",\"info\")', previewFn:'previewPLReport()' }
  ];
  let html = '';
  reports.forEach(r => {
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:10px">' +
      '<div style="width:38px;height:38px;border-radius:10px;background:' + r.c + '22;color:' + r.c + ';display:flex;align-items:center;justify-content:center;font-size:16px"><i class="fas ' + r.icon + '"></i></div>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + r.n + '</div><div style="font-size:10px;color:var(--t3)">' + r.desc + '</div></div>' +
      '<div style="display:flex;gap:6px"><button class="btn-s" onclick="' + r.previewFn + '" style="background:var(--p);color:#fff"><i class="fas fa-eye"></i> Preview</button>' +
      '<button class="btn-s" onclick="' + r.exportFn + '"><i class="fas fa-download"></i> Export</button></div></div>';
  });
  return html;
}

// ---- REPORT PREVIEW FUNCTIONS ----
function previewRevenueReport() {
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var totalRev = PROPS.reduce(function(s,p){return s+p.rev;},0);
  var html = '<div style="max-width:650px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#6C5CE7,#00CEC9);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83D\uDCCA</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">MONTHLY REVENUE REPORT</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + ' &bull; WeStay Portfolio</div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#00B894">RM ' + (totalRev/1000).toFixed(1) + 'K</div><div style="font-size:10px;color:var(--t3)">Total Revenue</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#6C5CE7">' + PROPS.length + '</div><div style="font-size:10px;color:var(--t3)">Properties</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#00CEC9">' + BILLS.filter(function(b){return b.s==="Paid";}).length + '</div><div style="font-size:10px;color:var(--t3)">Paid Invoices</div></div></div>';
  html += '<table><thead><tr><th>Property</th><th>Rooms</th><th>Occupancy</th><th style="text-align:right">Revenue (RM)</th></tr></thead><tbody>';
  PROPS.forEach(function(p) {
    html += '<tr><td style="font-weight:600">' + escHtml(p.n) + '</td><td>' + p.r + '</td><td>' + p.o + '%</td><td style="text-align:right;font-weight:600">RM ' + p.rev.toLocaleString() + '</td></tr>';
  });
  html += '<tr style="background:var(--bg2)"><td colspan="3" style="font-weight:700;text-align:right">Total</td><td style="text-align:right;font-size:15px;font-weight:800;color:var(--ok)">RM ' + totalRev.toLocaleString() + '</td></tr></tbody></table>';
  html += '<div style="margin-top:16px"><div style="font-size:12px;font-weight:600;margin-bottom:8px"><i class="fas fa-file-invoice" style="color:var(--warn);margin-right:6px"></i>Billing Summary</div>';
  var paid=BILLS.filter(function(b){return b.s==="Paid";}).length, pend=BILLS.filter(function(b){return b.s==="Pending";}).length, over=BILLS.filter(function(b){return b.s==="Overdue";}).length;
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' +
    '<div style="padding:10px;background:#00B89422;border-radius:10px;text-align:center"><div style="font-size:16px;font-weight:700;color:#00B894">' + paid + '</div><div style="font-size:10px;color:var(--t3)">Paid</div></div>' +
    '<div style="padding:10px;background:#FDCB6E22;border-radius:10px;text-align:center"><div style="font-size:16px;font-weight:700;color:#FDCB6E">' + pend + '</div><div style="font-size:10px;color:var(--t3)">Pending</div></div>' +
    '<div style="padding:10px;background:#E1705522;border-radius:10px;text-align:center"><div style="font-size:16px;font-weight:700;color:#E17055">' + over + '</div><div style="font-size:10px;color:var(--t3)">Overdue</div></div></div></div>';
  html += '</div>';
  openModal('<i class="fas fa-chart-line" style="color:#6C5CE7"></i> Monthly Revenue Report', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="exportBills()"><i class="fas fa-download"></i> Export CSV</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function previewOccupancyReport() {
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var totalRooms = PROPS.reduce(function(s,p){return s+p.r;},0);
  var totalOcc = PROPS.reduce(function(s,p){return s+Math.round(p.r*p.o/100);},0);
  var avgOcc = Math.round(totalOcc/totalRooms*100);
  var html = '<div style="max-width:650px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#00CEC9,#6C5CE7);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83C\uDFE2</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">OCCUPANCY TREND REPORT</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + '</div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#00CEC9">' + avgOcc + '%</div><div style="font-size:10px;color:var(--t3)">Avg Occupancy</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#6C5CE7">' + totalOcc + '/' + totalRooms + '</div><div style="font-size:10px;color:var(--t3)">Occupied/Total</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#FD79A8">' + (totalRooms-totalOcc) + '</div><div style="font-size:10px;color:var(--t3)">Vacant Rooms</div></div></div>';
  html += '<table><thead><tr><th>Property</th><th>Rooms</th><th>Occupied</th><th>Vacant</th><th>Rate</th></tr></thead><tbody>';
  PROPS.forEach(function(p) {
    var occ=Math.round(p.r*p.o/100), vac=p.r-occ;
    html += '<tr><td style="font-weight:600">' + escHtml(p.n) + '</td><td>' + p.r + '</td><td>' + occ + '</td><td>' + vac + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="width:'+p.o+'%;height:100%;background:'+p.c+';border-radius:3px"></div></div><span style="font-weight:600;font-size:11px">' + p.o + '%</span></div></td></tr>';
  });
  html += '</tbody></table></div>';
  openModal('<i class="fas fa-chart-bar" style="color:#00CEC9"></i> Occupancy Trend Report', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function previewMaintenanceReport() {
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var high=TICKETS.filter(function(t){return t.pr==='High';}).length, med=TICKETS.filter(function(t){return t.pr==='Medium';}).length, low=TICKETS.filter(function(t){return t.pr==='Low';}).length;
  var open=TICKETS.filter(function(t){return t.s!=='Completed';}).length, closed=TICKETS.filter(function(t){return t.s==='Completed';}).length;
  var html = '<div style="max-width:650px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#FDCB6E,#E17055);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83D\uDD27</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">MAINTENANCE SUMMARY</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + '</div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:#FDCB6E">' + TICKETS.length + '</div><div style="font-size:10px;color:var(--t3)">Total</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:#E17055">' + open + '</div><div style="font-size:10px;color:var(--t3)">Open</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:#00B894">' + closed + '</div><div style="font-size:10px;color:var(--t3)">Resolved</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:#6C5CE7">1.8h</div><div style="font-size:10px;color:var(--t3)">Avg Response</div></div></div>';
  html += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;margin-bottom:8px"><i class="fas fa-exclamation-triangle" style="color:#E17055;margin-right:6px"></i>By Priority</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' +
    '<div style="padding:10px;background:#E1705522;border-radius:10px;text-align:center"><div style="font-size:16px;font-weight:700;color:#E17055">' + high + '</div><div style="font-size:10px;color:var(--t3)">High</div></div>' +
    '<div style="padding:10px;background:#FDCB6E22;border-radius:10px;text-align:center"><div style="font-size:16px;font-weight:700;color:#FDCB6E">' + med + '</div><div style="font-size:10px;color:var(--t3)">Medium</div></div>' +
    '<div style="padding:10px;background:#00B89422;border-radius:10px;text-align:center"><div style="font-size:16px;font-weight:700;color:#00B894">' + low + '</div><div style="font-size:10px;color:var(--t3)">Low</div></div></div></div>';
  html += '<table><thead><tr><th>Ticket</th><th>Issue</th><th>Location</th><th>Priority</th><th>Status</th></tr></thead><tbody>';
  TICKETS.forEach(function(tk) {
    var cls=tk.s==='Completed'?'b-ok':tk.s==='In Progress'?'b-warn':'b-info';
    var pcls=tk.pr==='High'?'b-err':tk.pr==='Medium'?'b-warn':'b-ok';
    html += '<tr><td style="font-weight:600">' + escHtml(tk.id) + '</td><td>' + escHtml(tk.t) + '</td><td>' + escHtml(tk.loc) + '</td><td><span class="bs ' + pcls + '">' + escHtml(tk.pr) + '</span></td><td><span class="bs ' + cls + '">' + escHtml(tk.s) + '</span></td></tr>';
  });
  html += '</tbody></table></div>';
  openModal('<i class="fas fa-wrench" style="color:#FDCB6E"></i> Maintenance Summary', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="exportTickets()"><i class="fas fa-download"></i> Export CSV</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function previewNPSReport() {
  var html = '<div style="max-width:550px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#FD79A8,#6C5CE7);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\u2B50</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">TENANT SATISFACTION (NPS)</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">Monthly Survey Results</div></div>';
  html += '<div style="text-align:center;padding:20px;background:var(--bg3);border-radius:16px;margin-bottom:16px">' +
    '<div style="font-size:48px;font-weight:800;color:#FD79A8">4.6</div><div style="font-size:12px;color:var(--t3)">Overall NPS Score (out of 5.0)</div></div>';
  var cats = [{n:'Living Conditions',s:4.7,c:'#00B894'},{n:'Management Response',s:4.5,c:'#6C5CE7'},{n:'Maintenance Speed',s:4.3,c:'#FDCB6E'},{n:'Community Vibe',s:4.8,c:'#00CEC9'},{n:'Value for Money',s:4.4,c:'#FD79A8'}];
  html += '<div style="display:grid;gap:10px">';
  cats.forEach(function(cat) {
    var pct = Math.round(cat.s/5*100);
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px"><div style="flex:1"><div style="font-size:12px;font-weight:600;margin-bottom:4px">' + cat.n + '</div>' +
      '<div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+cat.c+';border-radius:3px"></div></div></div>' +
      '<div style="font-size:14px;font-weight:700;color:'+cat.c+'">' + cat.s + '</div></div>';
  });
  html += '</div></div>';
  openModal('<i class="fas fa-star" style="color:#FD79A8"></i> Tenant NPS Report', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'sm');
}

function previewPLReport() {
  var totalRev = PROPS.reduce(function(s,p){return s+p.rev;},0);
  var totalExp = 0;
  Object.values(PROPERTY_EXPENSES).forEach(function(e){totalExp += Object.values(e).reduce(function(s,v){return s+v;},0);});
  var netProfit = totalRev - totalExp;
  var html = '<div style="max-width:650px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#00B894,#6C5CE7);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83D\uDCB0</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">FINANCIAL P&L STATEMENT</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">Portfolio Summary</div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:#00B894">RM ' + totalRev.toLocaleString() + '</div><div style="font-size:10px;color:var(--t3)">Total Revenue</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:#E17055">RM ' + totalExp.toLocaleString() + '</div><div style="font-size:10px;color:var(--t3)">Total Expenses</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:18px;font-weight:800;color:' + (netProfit>=0?'#6C5CE7':'#E17055') + '">RM ' + netProfit.toLocaleString() + '</div><div style="font-size:10px;color:var(--t3)">Net Profit</div></div></div>';
  html += '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;margin-bottom:8px"><i class="fas fa-arrow-up" style="color:#00B894;margin-right:6px"></i>Revenue by Property</div>';
  html += '<table><thead><tr><th>Property</th><th style="text-align:right">Revenue</th><th style="text-align:right">Expenses</th><th style="text-align:right">Net</th></tr></thead><tbody>';
  PROPS.forEach(function(p) {
    var exp = PROPERTY_EXPENSES[p.n] ? Object.values(PROPERTY_EXPENSES[p.n]).reduce(function(s,v){return s+v;},0) : 0;
    var net = p.rev - exp;
    html += '<tr><td style="font-weight:600">' + escHtml(p.n) + '</td><td style="text-align:right;color:var(--ok)">RM ' + p.rev.toLocaleString() + '</td><td style="text-align:right;color:var(--err)">RM ' + exp.toLocaleString() + '</td><td style="text-align:right;font-weight:700;color:' + (net>=0?'var(--ok)':'var(--err)') + '">RM ' + net.toLocaleString() + '</td></tr>';
  });
  html += '<tr style="background:var(--bg2)"><td style="font-weight:700;text-align:right">Total</td><td style="text-align:right;font-weight:700;color:var(--ok)">RM ' + totalRev.toLocaleString() + '</td><td style="text-align:right;font-weight:700;color:var(--err)">RM ' + totalExp.toLocaleString() + '</td><td style="text-align:right;font-size:15px;font-weight:800;color:' + (netProfit>=0?'var(--ok)':'var(--err)') + '">RM ' + netProfit.toLocaleString() + '</td></tr>';
  html += '</tbody></table></div></div>';
  openModal('<i class="fas fa-money-bill-wave" style="color:#00B894"></i> Financial P&L Statement', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function printReportPreview() {
  var modalBody = document.querySelector('.modal-body');
  if (!modalBody) return;
  var w = window.open('', '_blank', 'noopener,noreferrer');
  w.document.write('<html><head><title>Report Preview</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#1a1929;color:#e2e0f0;padding:30px;max-width:750px;margin:0 auto}*{box-sizing:border-box}table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #2D2B4A;font-size:11px}</style></head><body>' + modalBody.innerHTML + '</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}

// Landlord-filtered Revenue Report
function previewLandlordRevenueReport() {
  var ll = typeof getCurrentLandlord === 'function' ? getCurrentLandlord() : LANDLORDS[0];
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var myProps = PROPS.filter(function(p) { return ll.props.includes(p.n); });
  var totalRev = myProps.reduce(function(s,p){return s+p.rev;},0);
  var html = '<div style="max-width:650px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#6C5CE7,#00CEC9);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83D\uDCCA</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">REVENUE REPORT — ' + escHtml(ll.n) + '</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + ' &bull; ' + myProps.length + ' Properties</div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#00B894">RM ' + totalRev.toLocaleString() + '</div><div style="font-size:10px;color:var(--t3)">Total Revenue</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#6C5CE7">' + myProps.length + '</div><div style="font-size:10px;color:var(--t3)">Properties</div></div></div>';
  html += '<table><thead><tr><th>Property</th><th>Rooms</th><th>Occupancy</th><th style="text-align:right">Revenue (RM)</th></tr></thead><tbody>';
  myProps.forEach(function(p) {
    html += '<tr><td style="font-weight:600">' + escHtml(p.n) + '</td><td>' + p.r + '</td><td>' + p.o + '%</td><td style="text-align:right;font-weight:600">RM ' + p.rev.toLocaleString() + '</td></tr>';
  });
  html += '<tr style="background:var(--bg2)"><td colspan="3" style="font-weight:700;text-align:right">Total</td><td style="text-align:right;font-size:15px;font-weight:800;color:var(--ok)">RM ' + totalRev.toLocaleString() + '</td></tr></tbody></table>';
  html += '</div>';
  openModal('<i class="fas fa-chart-line" style="color:#6C5CE7"></i> Revenue Report — ' + escHtml(ll.n), html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

// Landlord-filtered Occupancy Report
function previewLandlordOccupancyReport() {
  var ll = typeof getCurrentLandlord === 'function' ? getCurrentLandlord() : LANDLORDS[0];
  var now = new Date();
  var month = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
  var year = now.getFullYear();
  var myProps = PROPS.filter(function(p) { return ll.props.includes(p.n); });
  var totalRooms = myProps.reduce(function(s,p){return s+p.r;},0);
  var totalOcc = myProps.reduce(function(s,p){return s+Math.round(p.r*p.o/100);},0);
  var avgOcc = totalRooms > 0 ? Math.round(totalOcc/totalRooms*100) : 0;
  var html = '<div style="max-width:650px;margin:0 auto">';
  html += '<div style="background:linear-gradient(135deg,#00CEC9,#6C5CE7);padding:24px;border-radius:16px;text-align:center;margin-bottom:18px">' +
    '<div style="font-size:28px;margin-bottom:4px">\uD83C\uDFE2</div>' +
    '<h3 style="color:#fff;font-size:16px;margin-bottom:2px">OCCUPANCY REPORT — ' + escHtml(ll.n) + '</h3>' +
    '<div style="color:rgba(255,255,255,.7);font-size:12px">' + month + ' ' + year + '</div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#00CEC9">' + avgOcc + '%</div><div style="font-size:10px;color:var(--t3)">Avg Occupancy</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#6C5CE7">' + totalOcc + '/' + totalRooms + '</div><div style="font-size:10px;color:var(--t3)">Occupied/Total</div></div>' +
    '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px"><div style="font-size:20px;font-weight:800;color:#FD79A8">' + (totalRooms-totalOcc) + '</div><div style="font-size:10px;color:var(--t3)">Vacant</div></div></div>';
  html += '<table><thead><tr><th>Property</th><th>Rooms</th><th>Occupied</th><th>Vacant</th><th>Rate</th></tr></thead><tbody>';
  myProps.forEach(function(p) {
    var occ=Math.round(p.r*p.o/100), vac=p.r-occ;
    html += '<tr><td style="font-weight:600">' + escHtml(p.n) + '</td><td>' + p.r + '</td><td>' + occ + '</td><td>' + vac + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="width:'+p.o+'%;height:100%;background:'+p.c+';border-radius:3px"></div></div><span style="font-weight:600;font-size:11px">' + p.o + '%</span></div></td></tr>';
  });
  html += '</tbody></table></div>';
  openModal('<i class="fas fa-chart-bar" style="color:#00CEC9"></i> Occupancy Report — ' + escHtml(ll.n), html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReportPreview()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');
}

function settingsGeneral() {
  return '<div class="dep-card">' +
    depRow('Platform Name', 'WeStay Coliving') +
    depRow('Currency', 'MYR (RM)') +
    depRow('Timezone', 'Asia/Kuala_Lumpur (GMT+8)') +
    depRow('Language', 'English') +
    depRow('Billing Cycle', '1st of every month') +
    '</div>';
}

function settingsNotif() {
  return '<div style="display:grid;gap:10px">' +
    '<div class="wf"><div class="wf-ic" style="background:rgba(0,184,148,.15);color:var(--ok)"><i class="fas fa-envelope"></i></div>' +
    '<div class="wf-info"><h5>Email Notifications</h5><p>Billing, maintenance, contracts</p></div><div class="wf-toggle"></div></div>' +
    '<div class="wf"><div class="wf-ic" style="background:rgba(0,206,201,.15);color:var(--ac)"><i class="fab fa-whatsapp"></i></div>' +
    '<div class="wf-info"><h5>WhatsApp Alerts</h5><p>Urgent tickets & overdue payments</p></div><div class="wf-toggle"></div></div>' +
    '<div class="wf"><div class="wf-ic" style="background:rgba(108,92,231,.15);color:var(--p)"><i class="fas fa-bell"></i></div>' +
    '<div class="wf-info"><h5>Push Notifications</h5><p>Real-time updates</p></div><div class="wf-toggle"></div></div></div>';
}
