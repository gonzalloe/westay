// ============ SHARED UI HELPERS ============

function stat(icon, color, val, label, change, dir) {
  const chCls = dir === 'up' ? 'ch up' : dir === 'dn' ? 'ch dn' : 'ch';
  return '<div class="stat"><div class="top"><div class="ic" style="background:' + color + '22;color:' + color + '"><i class="fas ' + icon + '"></i></div>' +
    (change ? '<span class="' + chCls + '">' + change + '</span>' : '') +
    '</div><div class="val">' + val + '</div><div class="lbl">' + label + '</div></div>';
}

function panel(title, content, extraClass) {
  return '<div class="panel' + (extraClass ? ' ' + extraClass : '') + '"><div class="panel-h"><h3>' + title + '</h3></div>' + content + '</div>';
}

function depRow(k, v) {
  return '<div class="dep-row"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';
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
      '<div class="tk-info"><h5>' + tk.t + '</h5><p>' + tk.loc + ' \u2022 ' + tk.time + '</p></div>' +
      '<span class="bs ' + pcls + '">' + tk.pr + '</span></div>';
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
  const myBills = BILLS.filter(b => b.t === 'Sarah Lim');
  let html = '';
  myBills.forEach(b => {
    const cls = b.s === 'Paid' ? 'b-ok' : 'b-warn';
    html += '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:8px">' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + b.id + '</div><div style="font-size:10px;color:var(--t3)">' + b.d + '</div></div>' +
      '<div style="font-size:14px;font-weight:700">' + b.a + '</div>' +
      '<span class="bs ' + cls + '">' + b.s + '</span></div>';
  });
  return html || '<div style="color:var(--t3);font-size:12px;padding:10px">No bills found</div>';
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
    '<div class="prop-body"><h4>' + p.n + '</h4><div class="prop-meta"><i class="fas fa-map-marker-alt"></i> ' + p.addr + '</div>' +
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
      '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + p.n + '</div><div style="font-size:10px;color:var(--t3)">' + p.r + ' rooms \u2022 ' + p.o + '% occupied</div></div>' +
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
    html += '<div class="tk"><div class="tk-ic" style="background:var(--p);color:#fff;font-size:11px;font-weight:700">' + wo.id.split('-')[1] + '</div>' +
      '<div class="tk-info"><h5>' + wo.desc + '</h5><p>' + wo.loc + ' \u2022 ' + wo.date + '</p></div>' +
      '<span class="bs ' + pcls + '" style="margin-right:6px">' + wo.pr + '</span>' +
      '<span class="bs ' + cls + '">' + wo.s + '</span></div>';
  });
  return html;
}

function agentLeadsHtml() {
  let html = '';
  LEADS.slice(0, 4).forEach((l, i) => {
    const cls = l.s === 'New' ? 'b-info' : l.s === 'Contacted' ? 'b-warn' : l.s === 'Viewing Scheduled' ? 'b-p' : 'b-ok';
    html += '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:8px">' +
      '<div style="width:32px;height:32px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + initials(l.n) + '</div>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + l.n + '</div><div style="font-size:10px;color:var(--t3)">' + l.src + ' \u2022 ' + l.budget + '</div></div>' +
      '<span class="bs ' + cls + '">' + l.s + '</span></div>';
  });
  return html;
}

function agentLeadsTableHtml() {
  let rows = '';
  LEADS.forEach((l, i) => {
    const cls = l.s === 'New' ? 'b-info' : l.s === 'Contacted' ? 'b-warn' : l.s === 'Viewing Scheduled' ? 'b-p' : 'b-ok';
    rows += '<tr><td><div style="display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:' + COLORS[i%8] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff">' + initials(l.n) + '</div>' + l.n + '</div></td>' +
      '<td>' + l.phone + '</td><td>' + l.src + '</td><td>' + l.prop + '</td><td>' + l.budget + '</td><td><span class="bs ' + cls + '">' + l.s + '</span></td></tr>';
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
    { n:'Monthly Revenue Report', icon:'fa-chart-line', c:'#6C5CE7', desc:'Revenue breakdown by property', fn:'exportBills()' },
    { n:'Occupancy Trend', icon:'fa-chart-bar', c:'#00CEC9', desc:'6-month occupancy analysis', fn:'toast(\"Report generating...\",\"info\")' },
    { n:'Maintenance Summary', icon:'fa-wrench', c:'#FDCB6E', desc:'Ticket analysis & vendor performance', fn:'exportTickets()' },
    { n:'Tenant Satisfaction (NPS)', icon:'fa-star', c:'#FD79A8', desc:'Monthly survey results', fn:'toast(\"NPS report generating...\",\"info\")' },
    { n:'Financial P&L', icon:'fa-money-bill-wave', c:'#00B894', desc:'Profit & loss statement', fn:'toast(\"P&L report generating...\",\"info\")' }
  ];
  let html = '';
  reports.forEach(r => {
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:10px;cursor:pointer" onclick="' + r.fn + '">' +
      '<div style="width:38px;height:38px;border-radius:10px;background:' + r.c + '22;color:' + r.c + ';display:flex;align-items:center;justify-content:center;font-size:16px"><i class="fas ' + r.icon + '"></i></div>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + r.n + '</div><div style="font-size:10px;color:var(--t3)">' + r.desc + '</div></div>' +
      '<button class="btn-s"><i class="fas fa-download"></i> Export</button></div>';
  });
  return html;
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
