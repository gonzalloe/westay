// ============ TENANT / LANDLORD / VENDOR / AGENT PAGES (Interactive) ============

// ---- TENANT ----
function tenantDashboard() {
  return '<div class="pg-h"><h1>Welcome back, Sarah!</h1><p>Cambridge A201 \u2022 Lease active until 31 Aug 2026</p></div>' +
    '<div class="stats">' +
    cStat('fa-receipt','#6C5CE7','RM 280','Rent Due','01 Apr','','navigateTo(\'my-bills\')') +
    cStat('fa-calendar-check','#00B894','153','Days Remaining','','up','navigateTo(\'my-contract\')') +
    cStat('fa-wrench','#FDCB6E','1','Open Requests','','','navigateTo(\'maintenance\')') +
    cStat('fa-star','#FD79A8','4.8','Community Score','','up','navigateTo(\'community\')') +
    '</div><div class="g2">' +
    panel('Quick Actions', '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
      qActionClick('fa-credit-card','#6C5CE7','Pay Rent','Due in 3 days','payMyRent()') +
      qActionClick('fa-wrench','#FDCB6E','New Request','Maintenance','addTicketModal()') +
      qActionClick('fa-key','#00B894','Door Access','Smart Lock','navigateTo(\'smart-access\')') +
      qActionClick('fa-bolt','#74B9FF','Utility Bills','View & pay','tenantViewUtilityBills()') +
      qActionClick('fa-clipboard-check','#00CEC9','Check-In/Out','Photo evidence','showMyCheckInOutList()') +
      qActionClick('fa-comments','#FD79A8','Community','3 new posts','navigateTo(\'community\')') + '</div>') +
    panel('My Bills', tenantBillsHtml()) +
    '</div><div class="g2">' +
    panel('Upcoming Events', eventsHtml()) +
    panel('Community Feed', feedHtml()) +
    '</div>';
}

function qActionClick(icon, color, title, sub, onclick) {
  return '<div style="padding:16px;background:var(--bg3);border-radius:12px;cursor:pointer;text-align:center;transition:.2s" onclick="' + onclick + '" onmouseover="this.style.background=\'var(--card)\'" onmouseout="this.style.background=\'var(--bg3)\'">' +
    '<div style="width:40px;height:40px;border-radius:10px;background:' + color + '22;color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:16px;margin:0 auto 8px"><i class="fas ' + icon + '"></i></div>' +
    '<div style="font-size:12px;font-weight:600">' + title + '</div><div style="font-size:10px;color:var(--t3)">' + sub + '</div></div>';
}

function payMyRent() {
  const myBill = BILLS.find(b => b.t === 'Sarah Lim' && b.s !== 'Paid');
  if (myBill) payBill(myBill.id);
  else toast('No pending bills!', 'info');
}

function tenantMyUnit() {
  return '<div class="pg-h pg-row"><div><h1>My Unit</h1><p>Cambridge A201</p></div>' +
    '<button class="btn" style="background:#00CEC9;color:#fff" onclick="showMyCheckInOutList()"><i class="fas fa-clipboard-check"></i> My Check-In/Out Evidence</button></div>' +
    '<div class="g2">' +
    panel('Unit Details', '<div class="dep-card">' +
      depRow('Property','Cambridge') + depRow('Room','A201 \u2022 Single Room') +
      depRow('Floor','2nd Floor') + depRow('Size','180 sq ft') +
      depRow('Move-in Date','01 Sep 2025') + depRow('Lease End','31 Aug 2026') + '</div>') +
    panel('Deposit Information', '<div class="dep-card">' +
      depRow('Security Deposit','RM 560') + depRow('Utility Deposit','RM 100') +
      depRow('Key Deposit','RM 50') + depRow('Total Deposit','RM 710') +
      depRowHtml('Status','<span class="bs b-ok">Held</span>') + '</div>') +
    '</div>';
}

function tenantMyBills() {
  var tenant = ROLE_CONFIG[currentRole] ? ROLE_CONFIG[currentRole].user.name : 'Sarah Lim';
  var myRentBills = BILLS.filter(function(b) { return b.t === tenant; });
  var myUtilBills = typeof UTILITY_BILLS !== 'undefined' ? UTILITY_BILLS.filter(function(b) { return b.tenant === tenant; }) : [];

  // Unified summary stats
  var totalRentDue = 0, totalUtilDue = 0, totalPaid = 0, totalUnpaid = 0;
  myRentBills.forEach(function(b) {
    var amt = parseInt(b.a.replace(/[^\d]/g, '')) || 0;
    if (b.s === 'Paid') totalPaid += amt; else totalUnpaid += amt;
    if (b.s !== 'Paid') totalRentDue += amt;
  });
  myUtilBills.forEach(function(b) {
    if (b.status === 'Paid') totalPaid += Math.round(b.total); else totalUnpaid += Math.round(b.total);
    if (b.status !== 'Paid') totalUtilDue += Math.round(b.total);
  });
  var totalDue = totalRentDue + totalUtilDue;
  var totalBills = myRentBills.length + myUtilBills.length;
  var unpaidCount = myRentBills.filter(function(b){return b.s !== 'Paid';}).length + myUtilBills.filter(function(b){return b.status !== 'Paid';}).length;

  // Header with action buttons
  var html = '<div class="pg-h pg-row"><div><h1>My Bills</h1><p>All rental &amp; utility invoices in one place</p></div>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn-s" onclick="previewMyBillsReport()"><i class="fas fa-eye"></i> Preview</button>' +
    '<button class="btn-s" onclick="exportMyBillsCSV()"><i class="fas fa-download"></i> Export</button>' +
    '</div></div>';

  // Summary stat cards
  html += '<div class="stats">' +
    cStat('fa-file-invoice','#6C5CE7', totalBills, 'Total Bills','','','') +
    cStat('fa-exclamation-circle','#E17055', unpaidCount, 'Unpaid','','','') +
    cStat('fa-money-bill-wave','#FDCB6E','RM ' + totalDue, 'Total Due','','','') +
    cStat('fa-check-circle','#00B894','RM ' + totalPaid, 'Total Paid','','','') +
    '</div>';

  // Outstanding bills alert + Pay All button
  if (totalDue > 0) {
    html += '<div style="background:linear-gradient(135deg,#6C5CE722,#E1705522);border:1px solid #E1705544;border-radius:14px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:14px">' +
      '<div style="width:48px;height:48px;border-radius:12px;background:#E1705522;color:#E17055;display:flex;align-items:center;justify-content:center;font-size:20px"><i class="fas fa-exclamation-triangle"></i></div>' +
      '<div style="flex:1"><div style="font-size:14px;font-weight:700;color:#E17055">Outstanding Balance: RM ' + totalDue + '</div>' +
      '<div style="font-size:11px;color:var(--t2)">' + unpaidCount + ' unpaid bill(s) — Rent: RM ' + totalRentDue + ' | Utilities: RM ' + totalUtilDue + '</div></div>' +
      '<button class="btn btn-p" style="flex-shrink:0;font-size:12px" onclick="tenantPayAllBills()"><i class="fas fa-credit-card"></i> Pay All (RM ' + totalDue + ')</button></div>';
  }

  // Rent bills table
  var rentRows = '';
  myRentBills.forEach(function(b) {
    var cls = b.s === 'Paid' ? 'b-ok' : b.s === 'Pending' ? 'b-warn' : 'b-err';
    rentRows += '<tr style="cursor:pointer" onclick="showBillDetail(\'' + b.id + '\')">' +
      '<td><i class="fas fa-home" style="color:#6C5CE7;margin-right:6px;font-size:10px"></i><span style="font-weight:600">' + escHtml(b.id) + '</span></td>' +
      '<td>Rent</td><td style="font-weight:600">' + escHtml(b.a) + '</td>' +
      '<td><span class="bs ' + cls + '">' + escHtml(b.s) + '</span></td><td>' + escHtml(b.d) + '</td>' +
      '<td>' + (b.s !== 'Paid' ? '<button class="btn btn-p" style="padding:5px 12px;font-size:11px" onclick="event.stopPropagation();payWithGateway(\'rent\',\'' + b.id + '\')"><i class="fas fa-credit-card"></i> Pay</button>' : '<i class="fas fa-check-circle" style="color:var(--ok)"></i>') + '</td></tr>';
  });

  // Utility bills rows
  var utilRows = '';
  myUtilBills.forEach(function(b) {
    var cls = b.status === 'Paid' ? 'b-ok' : 'b-warn';
    utilRows += '<tr style="cursor:pointer" onclick="showUtilityBillDetail(\'' + b.id + '\')">' +
      '<td><i class="fas fa-bolt" style="color:#FDCB6E;margin-right:6px;font-size:10px"></i><span style="font-weight:600">' + escHtml(b.id) + '</span></td>' +
      '<td>Utility</td><td style="font-weight:600;color:var(--p)">RM ' + b.total.toFixed(2) + '</td>' +
      '<td><span class="bs ' + cls + '">' + escHtml(b.status) + '</span></td><td>' + escHtml(b.period) + '</td>' +
      '<td>' + (b.status !== 'Paid' ? '<button class="btn btn-p" style="padding:5px 12px;font-size:11px" onclick="event.stopPropagation();payWithGateway(\'utility\',\'' + b.id + '\')"><i class="fas fa-credit-card"></i> Pay</button>' : '<i class="fas fa-check-circle" style="color:var(--ok)"></i>') + '</td></tr>';
  });

  // Combined table
  var allRows = rentRows + utilRows;
  html += '<div class="panel"><div class="panel-h"><h3>All Bills</h3>' +
    '<div style="font-size:10px;color:var(--t3)">' + totalBills + ' bill(s) &bull; Rent + Utilities</div></div>';
  if (allRows) {
    html += '<table><thead><tr><th>Invoice</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>' +
      '<tbody>' + allRows + '</tbody></table>';
  } else {
    html += '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No bills found. You\'re all clear!</p></div>';
  }
  html += '</div>';

  return html;
}

function tenantMyContract() {
  const c = CONTRACTS[0];
  return '<div class="pg-h"><h1>My Contract</h1><p>Tenancy agreement details</p></div>' +
    '<div class="panel"><div class="contract-card"><div class="contract-icon" style="background:var(--p);color:#fff"><i class="fas fa-file-contract"></i></div>' +
    '<div class="contract-info"><h5>' + c.id + '</h5><p>' + c.prop + ' \u2022 ' + c.start + ' to ' + c.end + '</p></div>' +
    '<div class="contract-actions"><button class="btn-s" onclick="autoGenerateTA(\'Sarah Lim\')"><i class="fas fa-eye"></i> View TA</button></div></div>' +
    '<div class="dep-card" style="margin-top:14px">' +
    depRow('Monthly Rent', c.rent) + depRow('Deposit', c.dep) + depRow('Start Date', c.start) +
    depRow('End Date', c.end) + depRowHtml('Status', '<span class="bs b-ok">' + escHtml(c.s) + '</span>') + '</div></div>';
}

function tenantMaintenance() {
  const myTk = TICKETS.filter(t => t.by === 'Sarah Lim');
  return '<div class="pg-h pg-row"><div><h1>Maintenance Requests</h1><p>Submit and track maintenance</p></div>' +
    '<button class="btn btn-p" onclick="addTicketModal()"><i class="fas fa-plus"></i> New Request</button></div>' +
    '<div class="panel">' + (myTk.length ? ticketListHtml(myTk) : '<div class="placeholder"><i class="fas fa-check-circle"></i><p>No open maintenance requests</p></div>') + '</div>';
}

function tenantSmartAccess() {
  const lc = lockState === 'Locked' ? '#00B894' : '#FDCB6E';
  const li = lockState === 'Locked' ? 'fa-lock' : 'fa-lock-open';
  return '<div class="pg-h"><h1>Smart Access</h1><p>Your digital key</p></div>' +
    '<div class="g2">' +
    panel('My Door Lock', '<div class="lock-card" style="padding:30px"><div class="lock-icon" style="font-size:48px;color:' + lc + '"><i class="fas ' + li + '"></i></div>' +
      '<div class="lock-status" style="background:' + lc + '22;color:' + lc + ';margin:14px 0">' + lockState + '</div>' +
      '<div class="lock-name">Cambridge A201</div><div class="lock-meta">Last accessed: 2 hours ago</div></div>') +
    panel('Access Log', '<div class="timeline-item"><div class="tl-time">Today 18:30</div><div class="tl-text">Door locked (auto)</div></div>' +
      '<div class="timeline-item"><div class="tl-time">Today 16:45</div><div class="tl-text">Door unlocked (app)</div></div>' +
      '<div class="timeline-item"><div class="tl-time">Today 08:20</div><div class="tl-text">Door locked (manual)</div></div>' +
      '<div class="timeline-item"><div class="tl-time">Today 08:15</div><div class="tl-text">Door unlocked (app)</div></div>') +
    '</div>';
}

function tenantUtilities() {
  const myMeter = typeof ELECTRIC_METERS !== 'undefined' ? ELECTRIC_METERS.find(m => m.tenant === 'Sarah Lim') : null;
  const isDisc = myMeter && myMeter.status !== 'Connected';
  let warn = '';
  if (isDisc) {
    warn = '<div style="background:#E1705522;border:1px solid #E1705544;border-radius:12px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px"><i class="fas fa-exclamation-triangle" style="color:#E17055;font-size:18px"></i><div style="flex:1"><div style="font-size:13px;font-weight:600;color:#E17055">Electric Supply Disconnected — Room ' + (myMeter ? myMeter.room : '') + '</div><div style="font-size:11px;color:var(--t2)">Your room\'s electric sub-meter has been disconnected. ' +
      (myMeter.status.includes('Overdue') ? 'Please settle your outstanding bill to restore supply.' : 'Please contact management for details.') +
      ' Other rooms in the unit are not affected.</div></div><button class="btn btn-p" style="font-size:11px" onclick="payMyRent()"><i class="fas fa-credit-card"></i> Pay Now</button></div>';
  }
  return '<div class="pg-h pg-row"><div><h1>Utilities</h1><p>Track your utility usage</p></div>' +
    '<button class="btn" style="background:#74B9FF;color:#1a1929" onclick="tenantViewUtilityBills()"><i class="fas fa-file-invoice"></i> My Utility Bills</button></div>' + warn +
    '<div class="panel"><div style="display:grid;gap:10px">' +
    meterRow('fa-bolt','#FDCB6E','Electricity','This month', myMeter ? myMeter.kwh : '42.5','kWh') +
    meterRow('fa-tint','#74B9FF','Water','This month','3.2','m\u00B3') +
    meterRow('fa-wifi','#6C5CE7','Internet','Speed','100','Mbps') +
    '</div>' +
    (myMeter ? '<div style="margin-top:14px;padding:12px;background:var(--bg3);border-radius:10px">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-bolt" style="color:' + (isDisc ? 'var(--err)' : 'var(--ok)') + ';font-size:14px"></i>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">My Room Sub-Meter</div><div style="font-size:10px;color:var(--t3)">Each room has its own independent sub-meter</div></div>' +
      '<span class="bs ' + (isDisc ? 'b-err' : 'b-ok') + '">' + (isDisc ? 'Disconnected' : 'Connected') + '</span></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:10px">' +
      '<div style="padding:8px;background:var(--bg2);border-radius:8px;text-align:center"><div style="font-weight:600;color:var(--t2)">Room</div><div style="font-size:13px;font-weight:700;color:var(--p)">' + myMeter.room + '</div></div>' +
      '<div style="padding:8px;background:var(--bg2);border-radius:8px;text-align:center"><div style="font-weight:600;color:var(--t2)">Meter ID</div><div style="font-size:11px;font-weight:700;font-family:monospace">' + myMeter.meterId + '</div></div>' +
      '<div style="padding:8px;background:var(--bg2);border-radius:8px;text-align:center"><div style="font-weight:600;color:var(--t2)">Unit</div><div style="font-size:13px;font-weight:700">' + myMeter.unit + '</div></div></div></div>' : '') +
    '</div>';
}
function tenantCommunity() { return communityPage(); }
function tenantEvents() { return '<div class="pg-h"><h1>Events</h1><p>Community events & activities</p></div><div class="panel"><div id="eventList"></div></div>'; }
function tenantMarketplace() {
  return '<div class="pg-h"><h1>Marketplace</h1><p>Buy, sell, or share with your community</p></div>' +
    '<div class="placeholder"><i class="fas fa-store"></i><p>Marketplace coming soon! List items for sale or find second-hand deals.</p></div>';
}

// ---- LANDLORD ----
function getCurrentLandlord() {
  var name = ROLE_CONFIG[currentRole] ? ROLE_CONFIG[currentRole].user.name : 'Tan Sri Ahmad';
  return LANDLORDS.find(function(l) { return l.n === name; }) || LANDLORDS[0];
}

function landlordDashboard() {
  const ll = getCurrentLandlord();
  return '<div class="pg-h"><h1>Portfolio Dashboard</h1><p>Welcome, ' + escHtml(ll.n) + '</p></div>' +
    '<div class="stats">' +
    cStat('fa-building','#FD79A8', ll.props.length, 'Properties','','','navigateTo(\'my-properties\')') +
    cStat('fa-door-open','#6C5CE7', ll.units, 'Total Units','','','navigateTo(\'my-properties\')') +
    cStat('fa-chart-pie','#00CEC9', ll.occ + '%', 'Occupancy','+3%','up','navigateTo(\'reports\')') +
    cStat('fa-money-bill-wave','#00B894', ll.rev, 'Monthly Revenue','+8%','up','navigateTo(\'financials\')') +
    cStat('fa-wallet','#FDCB6E', ll.payout, 'Est. Payout','','up','navigateTo(\'payouts\')') +
    '</div><div class="g2">' +
    panel('My Properties', landlordPropsHtml(ll)) +
    panel('Recent Payouts', landlordPayoutsHtml()) +
    '</div>';
}
function landlordMyProperties() {
  var ll = getCurrentLandlord();
  return '<div class="pg-h"><h1>My Properties</h1><p>Property details & performance</p></div><div class="prop-grid">' + PROPS.filter(function(p){return ll.props.includes(p.n);}).map(function(p){return '<div onclick="showPropertyDetail(\''+p.n.replace(/'/g,"\\'")+'\')">' + propCardHtml(p) + '</div>';}).join('') + '</div>';
}
function landlordFinancials() {
  var ll = getCurrentLandlord();
  var totalRev = 0;
  ll.props.forEach(function(pName) { var p = PROPS.find(function(x){return x.n===pName;}); if(p) totalRev += p.rev; });
  var mgmtFee = Math.round(totalRev * 0.2);
  var netPayout = totalRev - mgmtFee;
  return '<div class="pg-h"><h1>Financials</h1><p>Revenue breakdown & payout history</p></div>' +
    '<div class="stats">' +
    stat('fa-money-bill-wave','#00B894','RM ' + totalRev.toLocaleString(),'Gross Revenue','','') +
    stat('fa-percentage','#E17055','RM ' + mgmtFee.toLocaleString(),'Management Fee (20%)','','') +
    stat('fa-wallet','#6C5CE7','RM ' + netPayout.toLocaleString(),'Net Payout','','') +
    '</div><div class="panel"><h3 style="margin-bottom:14px">Payout History</h3>' + landlordPayoutsHtml() + '</div>';
}
function landlordTenancyOverview() {
  var ll = getCurrentLandlord();
  const myT = TENANTS.filter(function(t){ return ll.props.some(function(p){ return t.p.includes(p); }); });
  let rows = '';
  myT.forEach(t => {
    const cls = t.s==='active'?'b-ok':t.s==='pending'?'b-warn':'b-err';
    rows += '<tr><td style="cursor:pointer" onclick="showTenantDetail(\''+t.n.replace(/'/g,"\\'")+'\')">' + escHtml(t.n) + '</td><td>' + escHtml(t.p) + '</td><td>' + escHtml(t.r) + '</td><td><span class="bs '+cls+'">'+escHtml(t.s)+'</span></td><td>' + escHtml(t.e) + '</td></tr>';
  });
  return '<div class="pg-h"><h1>Tenancy Overview</h1><p>Tenants in your properties</p></div>' +
    '<div class="panel"><table><thead><tr><th>Tenant</th><th>Unit</th><th>Rent</th><th>Status</th><th>Lease End</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}
function landlordMaintenanceLog() {
  var ll = getCurrentLandlord();
  var myTickets = TICKETS.filter(function(tk){ return ll.props.some(function(p){ return tk.loc.includes(p); }); });
  return '<div class="pg-h"><h1>Maintenance Log</h1><p>Maintenance on your properties</p></div><div class="panel">' + (myTickets.length ? ticketListHtml(myTickets) : '<div class="placeholder"><i class="fas fa-check-circle"></i><p>No maintenance tickets for your properties.</p></div>') + '</div>';
}
function landlordPayouts() { return landlordFinancials(); }
function landlordDocuments() { return '<div class="pg-h"><h1>Documents</h1><p>Property documents & contracts</p></div><div class="panel"><div style="display:grid;gap:10px">' + landlordReportListHtml() + '</div></div>'; }
function landlordReports() {
  var ll = getCurrentLandlord();
  var totalRev = 0;
  ll.props.forEach(function(pName) { var p = PROPS.find(function(x){return x.n===pName;}); if(p) totalRev += p.rev; });
  var avgOcc = ll.occ;
  // Auto-generated monthly report records (last 6 months retained)
  var monthlyReports = generateLandlordMonthlyRecords(ll);
  var monthlyHtml = '';
  if (monthlyReports.length) {
    monthlyHtml = '<div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Monthly Owner Reports</h3>' +
      '<div style="font-size:10px;color:var(--t3)">Auto-generated &bull; Retained 6 months &bull; Auto-sent to ' + escHtml(ll.n) + '</div></div>' +
      '<table><thead><tr><th>Month</th><th>Properties</th><th>Net Rental</th><th>Status</th><th></th></tr></thead><tbody>';
    monthlyReports.forEach(function(mr) {
      monthlyHtml += '<tr><td style="font-weight:600">' + escHtml(mr.month) + '</td><td>' + escHtml(mr.props) + '</td><td style="font-weight:600;color:var(--ok)">' + escHtml(mr.net) + '</td>' +
        '<td><span class="bs b-ok">' + escHtml(mr.status) + '</span></td>' +
        '<td><button class="btn-s" onclick="generateOwnerReport(\'' + ll.n.replace(/'/g, "\\'") + '\')"><i class="fas fa-eye"></i> View</button></td></tr>';
    });
    monthlyHtml += '</tbody></table></div>';
  }
  return '<div class="pg-h"><h1>Reports</h1><p>View your property performance reports</p></div>' +
    '<div class="stats">' +
    stat('fa-chart-line','#6C5CE7','RM ' + (totalRev/1000).toFixed(1) + 'K','Monthly Revenue','+12%','up') +
    stat('fa-percentage','#00CEC9',avgOcc + '%','Avg Occupancy','+2%','up') +
    stat('fa-clock','#00B894','1.8h','Avg Ticket Resolution','-0.5h','up') +
    stat('fa-star','#FDCB6E','4.6','Tenant NPS','+0.3','up') +
    '</div><div class="panel"><h3 style="margin-bottom:14px">Available Reports</h3>' +
    landlordReportListHtml() + '</div>' + monthlyHtml;
}

// Generate simulated monthly report records for last 6 months
function generateLandlordMonthlyRecords(ll) {
  var records = [];
  var now = new Date();
  for (var i = 0; i < 6; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var monthStr = monthNames[d.getMonth()] + ' ' + d.getFullYear();
    var totalRev = 0;
    ll.props.forEach(function(pName) { var p = PROPS.find(function(x){return x.n===pName;}); if(p) totalRev += p.rev; });
    var totalExp = 0;
    ll.props.forEach(function(pName) { var e = PROPERTY_EXPENSES[pName]; if(e) totalExp += Object.values(e).reduce(function(s,v){return s+v;},0); });
    var net = totalRev - totalExp;
    records.push({
      month: monthStr,
      props: ll.props.join(', '),
      net: 'RM ' + net.toLocaleString(),
      status: i === 0 ? 'Current' : 'Sent'
    });
  }
  return records;
}

// Landlord-specific report list — filters by own properties, includes owner report in the list
function landlordReportListHtml() {
  var ll = getCurrentLandlord();
  var reports = [
    { n:'Owner Monthly Report', icon:'fa-file-alt', c:'#FD79A8', desc:'Income, expenses & net rental breakdown for your properties', previewFn:'generateOwnerReport(\'' + ll.n.replace(/'/g, "\\'") + '\')', exportFn:'downloadOwnerReportCSV(\'' + ll.n.replace(/'/g, "\\'") + '\')' },
    { n:'Revenue Report (My Properties)', icon:'fa-chart-line', c:'#6C5CE7', desc:'Revenue breakdown for ' + ll.props.join(', '), exportFn:'exportBills()', previewFn:'previewLandlordRevenueReport()' },
    { n:'Occupancy Trend (My Properties)', icon:'fa-chart-bar', c:'#00CEC9', desc:'Occupancy analysis for your properties', exportFn:'toast(\"Exporting...\",\"info\")', previewFn:'previewLandlordOccupancyReport()' },
    { n:'Maintenance Summary', icon:'fa-wrench', c:'#FDCB6E', desc:'Tickets on your properties', exportFn:'exportTickets()', previewFn:'previewMaintenanceReport()' },
    { n:'Tenant Satisfaction (NPS)', icon:'fa-star', c:'#FD79A8', desc:'Monthly survey results', exportFn:'toast(\"Exporting NPS...\",\"info\")', previewFn:'previewNPSReport()' }
  ];
  var html = '';
  reports.forEach(function(r) {
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:10px">' +
      '<div style="width:38px;height:38px;border-radius:10px;background:' + r.c + '22;color:' + r.c + ';display:flex;align-items:center;justify-content:center;font-size:16px"><i class="fas ' + r.icon + '"></i></div>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + r.n + '</div><div style="font-size:10px;color:var(--t3)">' + r.desc + '</div></div>' +
      '<div style="display:flex;gap:6px"><button class="btn-s" onclick="' + r.previewFn + '" style="background:var(--p);color:#fff"><i class="fas fa-eye"></i> Preview</button>' +
      '<button class="btn-s" onclick="' + r.exportFn + '"><i class="fas fa-download"></i> Export</button></div></div>';
  });
  return html;
}

// ---- VENDOR ----
function vendorDashboard() {
  const myWO = WORK_ORDERS.filter(w=>w.vendor==='QuickFix Plumbing');
  return '<div class="pg-h"><h1>Dashboard</h1><p>Welcome, QuickFix Plumbing</p></div>' +
    '<div class="stats">' +
    stat('fa-clipboard-list','#00B894', myWO.length, 'My Work Orders','','') +
    stat('fa-clock','#FDCB6E', myWO.filter(w=>w.s==='Pending').length, 'Pending','','') +
    stat('fa-spinner','#6C5CE7', myWO.filter(w=>w.s==='In Progress').length, 'In Progress','','') +
    stat('fa-star','#FD79A8','4.5','My Rating','','up') +
    '</div><div class="panel"><h3 style="margin-bottom:14px">My Work Orders</h3>' + workOrdersInteractive(myWO) + '</div>';
}
function vendorWorkOrders() {
  return '<div class="pg-h pg-row"><div><h1>Work Orders</h1></div></div>' +
    '<div class="panel">' + workOrdersInteractive(WORK_ORDERS.filter(w=>w.vendor==='QuickFix Plumbing')) + '</div>';
}
function vendorSchedule() {
  return '<div class="pg-h"><h1>Schedule</h1></div>' +
    '<div class="panel"><div class="timeline-item"><div class="tl-time">Today 10:00 AM</div><div class="tl-text">Water heater repair \u2022 Cambridge R203</div></div>' +
    '<div class="timeline-item"><div class="tl-time">Today 2:00 PM</div><div class="tl-text">Pipe inspection \u2022 Imperial C108</div></div>' +
    '<div class="timeline-item"><div class="tl-time">Tomorrow 9:00 AM</div><div class="tl-text">Bathroom faucet \u2022 Harvard B210</div></div></div>';
}
function vendorInvoices() {
  return '<div class="pg-h pg-row"><div><h1>My Invoices</h1></div>' +
    '<button class="btn btn-p" onclick="submitVendorInvoiceModal()"><i class="fas fa-plus"></i> Submit Invoice</button></div>' +
    '<div class="panel"><table><thead><tr><th>Invoice</th><th>Work Order</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>' +
    '<tbody><tr><td style="font-weight:600">VI-001</td><td>WO-102</td><td>RM 180</td><td><span class="bs b-warn">Pending</span></td><td>01 Apr 2026</td></tr>' +
    '<tr><td style="font-weight:600">VI-002</td><td>WO-105</td><td>RM 500</td><td><span class="bs b-ok">Paid</span></td><td>28 Mar 2026</td></tr></tbody></table></div>';
}
function vendorPayments() { return vendorInvoices(); }
function vendorProfile() {
  return '<div class="pg-h"><h1>Company Profile</h1></div>' +
    '<div class="panel"><div class="dep-card">' +
    depRow('Company','QuickFix Plumbing') + depRow('Registration','SSM 12345-V') +
    depRow('Contact','+60 12-800 1002') + depRow('Specialty','Plumbing & Water Systems') +
    depRow('Rating','\u2605 4.5 / 5.0') + depRow('Jobs Completed','8') + '</div></div>';
}
function vendorRatings() {
  return '<div class="pg-h"><h1>Reviews & Ratings</h1></div>' +
    '<div class="panel"><div class="feed"><div class="feed-h"><div class="feed-av" style="background:#6C5CE7">AO</div><div class="feed-name">Admin Operator</div><div class="feed-time">2d ago</div></div>' +
    '<p>\u2605\u2605\u2605\u2605\u2605 Excellent work on the pipe repair.</p></div>' +
    '<div class="feed"><div class="feed-h"><div class="feed-av" style="background:#00CEC9">WJ</div><div class="feed-name">Wei Jun</div><div class="feed-time">1w ago</div></div>' +
    '<p>\u2605\u2605\u2605\u2605 Fixed my sink quickly.</p></div></div>';
}

function workOrdersInteractive(orders) {
  let h = '';
  orders.forEach(wo => {
    const cls = wo.s==='Completed'?'b-ok':wo.s==='In Progress'?'b-warn':'b-info';
    const pcls = wo.pr==='High'?'b-err':wo.pr==='Medium'?'b-warn':'b-ok';
    h += '<div class="tk"><div class="tk-ic" style="background:var(--p);color:#fff;font-size:11px;font-weight:700">' + escHtml(wo.id.split('-')[1]) + '</div>' +
      '<div class="tk-info"><h5>' + escHtml(wo.desc) + '</h5><p>' + escHtml(wo.loc) + ' \u2022 ' + escHtml(wo.date) + '</p></div>' +
      '<span class="bs ' + pcls + '" style="margin-right:6px">' + escHtml(wo.pr) + '</span>' +
      '<span class="bs ' + cls + '">' + escHtml(wo.s) + '</span>';
    if (wo.s !== 'Completed') {
      const next = wo.s === 'Pending' ? 'In Progress' : 'Completed';
      h += '<button class="btn-s" style="margin-left:6px" onclick="updateWorkOrderStatus(\'' + wo.id + '\',\'' + next + '\')"><i class="fas fa-' + (next==='In Progress'?'play':'check') + '"></i></button>';
    }
    h += '</div>';
  });
  return h;
}

// ---- AGENT ----
function agentDashboard() {
  return '<div class="pg-h"><h1>Agent Dashboard</h1><p>Welcome, Marcus Tan</p></div>' +
    '<div class="stats">' +
    stat('fa-funnel-dollar','#FDCB6E', LEADS.length, 'Active Leads','','') +
    stat('fa-eye','#6C5CE7','3','Viewings This Week','','up') +
    stat('fa-file-alt','#00CEC9','2','Applications','','') +
    stat('fa-coins','#00B894','RM 2,400','Commission (MTD)','+RM 600','up') +
    '</div><div class="g2">' +
    panel('My Leads', agentLeadsHtml()) +
    panel('Upcoming Viewings', agentViewingsHtml()) +
    '</div>';
}
function agentLeadsPage() {
  return '<div class="pg-h pg-row"><div><h1>My Leads</h1></div>' +
    '<div style="display:flex;gap:6px"><button class="btn-s" onclick="exportLeads()"><i class="fas fa-download"></i> Export</button>' +
    '<button class="btn btn-p" onclick="addLeadModal()"><i class="fas fa-plus"></i> Add Lead</button></div></div>' +
    '<div class="panel">' + agentLeadsTableHtml() + '</div>';
}
function agentListings() {
  const vacant = PROPS.map(p=>({n:p.n,vac:p.r-Math.round(p.r*p.o/100),c:p.c,icon:p.icon})).filter(p=>p.vac>0);
  let cards = '';
  vacant.forEach(v => {
    cards += '<div class="prop-card"><div class="prop-body"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="width:36px;height:36px;border-radius:10px;background:'+v.c+'22;color:'+v.c+';display:flex;align-items:center;justify-content:center"><i class="fas '+v.icon+'"></i></div><div><h4>'+escHtml(v.n)+'</h4><div style="font-size:11px;color:var(--t3)">'+v.vac+' rooms</div></div></div>' +
      '<button class="btn btn-p" style="width:100%;padding:7px;font-size:11px" onclick="toast(\'Listing link copied!\',\'success\')"><i class="fas fa-share"></i> Share Listing</button></div></div>';
  });
  return '<div class="pg-h"><h1>Available Listings</h1></div><div class="prop-grid">' + cards + '</div>';
}
function agentViewings() { return '<div class="pg-h"><h1>Viewings</h1></div><div class="panel">' + agentViewingsHtml() + '</div>'; }
function agentApplications() {
  return '<div class="pg-h"><h1>Applications</h1></div>' +
    '<div class="panel"><table><thead><tr><th>Applicant</th><th>Property</th><th>Status</th><th>Date</th><th></th></tr></thead>' +
    '<tbody><tr><td>Kevin Lee</td><td>Westlake Villa</td><td><span class="bs b-warn">Under Review</span></td><td>31 Mar 2026</td><td><button class="btn-s" onclick="toast(\'Application approved!\',\'success\')"><i class="fas fa-check"></i> Approve</button></td></tr>' +
    '<tr><td>Ryan Chong</td><td>Tsing Hua</td><td><span class="bs b-p">Docs Pending</span></td><td>29 Mar 2026</td><td><button class="btn-s" onclick="toast(\'Reminder sent!\',\'info\')"><i class="fas fa-bell"></i> Remind</button></td></tr></tbody></table></div>';
}
function agentCommission() {
  return '<div class="pg-h"><h1>Commission</h1></div>' +
    '<div class="stats">' +
    stat('fa-coins','#00B894','RM 2,400','This Month','','up') +
    stat('fa-chart-line','#6C5CE7','RM 18,600','Year to Date','','up') +
    stat('fa-handshake','#FDCB6E','12','Deals Closed (YTD)','','up') +
    '</div><div class="panel"><h3 style="margin-bottom:14px">Commission History</h3>' +
    '<table><thead><tr><th>Tenant</th><th>Property</th><th>Commission</th><th>Date</th><th>Status</th></tr></thead>' +
    '<tbody><tr><td>Sarah Lim</td><td>Cambridge A201</td><td>RM 280</td><td>01 Sep 2025</td><td><span class="bs b-ok">Paid</span></td></tr>' +
    '<tr><td>Wei Jun</td><td>Tsing Hua A302</td><td>RM 340</td><td>16 Dec 2025</td><td><span class="bs b-ok">Paid</span></td></tr></tbody></table></div>';
}
function agentContacts() { return '<div class="pg-h"><h1>Contacts</h1></div><div class="placeholder"><i class="fas fa-address-book"></i><p>Contact management coming soon.</p></div>'; }
function agentPerformance() {
  return '<div class="pg-h"><h1>Performance</h1></div>' +
    '<div class="stats">' +
    stat('fa-trophy','#FDCB6E','#2','Team Rank','','up') +
    stat('fa-percentage','#00B894','68%','Conversion Rate','+5%','up') +
    stat('fa-clock','#6C5CE7','2.1 days','Avg Response','-0.4d','up') +
    stat('fa-star','#FD79A8','4.7','Client Rating','','up') +
    '</div>';
}
