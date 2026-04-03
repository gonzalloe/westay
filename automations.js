// ============ WESTAY AUTOMATION ENGINE ============
// 4 key automations: Auto Reports, Auto TA, Smart Lock Expiry, Late Payment Electric Cut

// ---- AUTOMATION STATE ----
const AUTOMATIONS = {
  autoReport: { enabled: true, lastRun: null, schedule: '1st of every month', log: [] },
  autoTA: { enabled: true, lastRun: null, schedule: '30 days before expiry', log: [] },
  smartLockExpiry: { enabled: true, lastRun: null, schedule: 'On lease end date', log: [] },
  latePmtElectric: { enabled: true, lastRun: null, schedule: '7 days after due date', log: [] }
};

function loadAutomationState() {
  try {
    const raw = localStorage.getItem('westay_automations');
    if (!raw) return;
    // Try deobfuscated first, fallback to legacy plain JSON
    let d;
    try {
      d = JSON.parse(deobfuscate(raw));
    } catch(e2) {
      d = JSON.parse(raw);
    }
    if (d) Object.assign(AUTOMATIONS, d);
  } catch(e) {}
}
function saveAutomationState() {
  try { localStorage.setItem('westay_automations', obfuscate(JSON.stringify(AUTOMATIONS))); } catch(e) {}
}
loadAutomationState();

// ============================================================
// 1. AUTO-GENERATE REPORT
// ============================================================
function autoGenerateReport() {
  const now = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  // Compute metrics
  const totalRooms = PROPS.reduce((s,p) => s + p.r, 0);
  const totalOcc = PROPS.reduce((s,p) => s + Math.round(p.r * p.o / 100), 0);
  const occPct = Math.round(totalOcc / totalRooms * 100);
  const totalRev = PROPS.reduce((s,p) => s + p.rev, 0);
  const paidBills = BILLS.filter(b => b.s === 'Paid');
  const pendBills = BILLS.filter(b => b.s === 'Pending');
  const overBills = BILLS.filter(b => b.s === 'Overdue');
  const paidAmt = paidBills.reduce((s,b) => s + parseInt(b.a.replace(/[^\d]/g,''))||0, 0);
  const overAmt = overBills.reduce((s,b) => s + parseInt(b.a.replace(/[^\d]/g,''))||0, 0);
  const openTk = TICKETS.filter(t => t.s !== 'Completed');
  const closedTk = TICKETS.filter(t => t.s === 'Completed');
  const activeTenants = TENANTS.filter(t => t.s === 'active').length;
  const expiringContracts = CONTRACTS.filter(c => c.s === 'Expiring Soon' || c.s === 'Active').filter(c => {
    if (!c.end) return false;
    const diff = (new Date(c.end) - now) / (1000*60*60*24);
    return diff > 0 && diff <= 30;
  });

  // Build report HTML
  let html = '<div style="max-width:700px;margin:0 auto">';

  // Header
  html += '<div style="background:linear-gradient(135deg,#6C5CE7,#00CEC9);padding:30px;border-radius:16px;text-align:center;margin-bottom:20px">' +
    '<div style="font-size:36px;margin-bottom:6px">📊</div>' +
    '<h2 style="color:#fff;font-size:20px;margin-bottom:4px">Monthly Portfolio Report</h2>' +
    '<div style="color:rgba(255,255,255,.8);font-size:13px">' + month + ' ' + year + ' &bull; WeStay Coliving</div>' +
    '<div style="color:rgba(255,255,255,.6);font-size:10px;margin-top:4px">Auto-generated on ' + now.toLocaleDateString('en-MY') + '</div></div>';

  // KPI Summary
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">';
  html += reportKPI('RM ' + (totalRev/1000).toFixed(1) + 'K', 'Revenue', '#00B894');
  html += reportKPI(occPct + '%', 'Occupancy', '#6C5CE7');
  html += reportKPI(activeTenants + '', 'Active Tenants', '#00CEC9');
  html += reportKPI(openTk.length + '', 'Open Tickets', '#E17055');
  html += '</div>';

  // Revenue Breakdown
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:16px">' +
    '<h4 style="font-size:14px;margin-bottom:14px"><i class="fas fa-chart-bar" style="color:#6C5CE7;margin-right:8px"></i>Revenue by Property</h4>';
  PROPS.forEach(p => {
    const pct = Math.round(p.rev / totalRev * 100);
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
      '<div style="width:100px;font-size:11px;font-weight:600;flex-shrink:0">' + p.n + '</div>' +
      '<div style="flex:1;height:20px;background:var(--bg2);border-radius:6px;overflow:hidden">' +
      '<div style="height:100%;width:' + pct + '%;background:' + p.c + ';border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;font-size:9px;font-weight:700;color:#fff;min-width:30px">' + pct + '%</div></div>' +
      '<div style="width:70px;text-align:right;font-size:12px;font-weight:700">RM ' + (p.rev/1000).toFixed(1) + 'K</div></div>';
  });
  html += '</div>';

  // Billing Summary
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:16px">' +
    '<h4 style="font-size:14px;margin-bottom:14px"><i class="fas fa-file-invoice-dollar" style="color:#00B894;margin-right:8px"></i>Billing Summary</h4>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
    '<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:10px"><div style="font-size:22px;font-weight:800;color:var(--ok)">' + paidBills.length + '</div><div style="font-size:10px;color:var(--t3)">Paid (RM ' + paidAmt + ')</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:10px"><div style="font-size:22px;font-weight:800;color:var(--warn)">' + pendBills.length + '</div><div style="font-size:10px;color:var(--t3)">Pending</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:10px"><div style="font-size:22px;font-weight:800;color:var(--err)">' + overBills.length + '</div><div style="font-size:10px;color:var(--t3)">Overdue (RM ' + overAmt + ')</div></div></div></div>';

  // Maintenance Summary
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:16px">' +
    '<h4 style="font-size:14px;margin-bottom:14px"><i class="fas fa-wrench" style="color:#FDCB6E;margin-right:8px"></i>Maintenance Summary</h4>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">' +
    '<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:10px"><div style="font-size:22px;font-weight:800;color:var(--err)">' + TICKETS.filter(t=>t.pr==='High').length + '</div><div style="font-size:10px;color:var(--t3)">High Priority</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:10px"><div style="font-size:22px;font-weight:800;color:var(--warn)">' + TICKETS.filter(t=>t.pr==='Medium').length + '</div><div style="font-size:10px;color:var(--t3)">Medium</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:10px"><div style="font-size:22px;font-weight:800;color:var(--ok)">' + closedTk.length + '</div><div style="font-size:10px;color:var(--t3)">Resolved</div></div></div>';
  if (openTk.length) {
    html += '<div style="font-size:11px;font-weight:600;margin-bottom:8px;color:var(--t2)">Open Tickets:</div>';
    openTk.forEach(tk => {
      const pc = tk.pr === 'High' ? '#E17055' : tk.pr === 'Medium' ? '#FDCB6E' : '#00B894';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg2);border-radius:8px;margin-bottom:4px;font-size:11px">' +
        '<i class="fas ' + tk.icon + '" style="color:' + pc + '"></i><span style="flex:1">' + tk.t + '</span><span style="color:var(--t3)">' + tk.loc + '</span><span class="bs ' + (tk.pr==='High'?'b-err':tk.pr==='Medium'?'b-warn':'b-ok') + '" style="font-size:9px">' + tk.pr + '</span></div>';
    });
  }
  html += '</div>';

  // Expiring Contracts Alert
  if (expiringContracts.length) {
    html += '<div style="background:#E1705522;border:1px solid #E1705544;border-radius:14px;padding:18px;margin-bottom:16px">' +
      '<h4 style="font-size:14px;margin-bottom:10px;color:#E17055"><i class="fas fa-exclamation-triangle" style="margin-right:8px"></i>Contracts Expiring Soon (' + expiringContracts.length + ')</h4>';
    expiringContracts.forEach(c => {
      const days = Math.round((new Date(c.end) - now) / (1000*60*60*24));
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg2);border-radius:8px;margin-bottom:6px">' +
        '<div style="flex:1;font-size:12px"><strong>' + c.tenant + '</strong> &mdash; ' + c.prop + '</div>' +
        '<div style="font-size:11px;color:#E17055;font-weight:600">' + days + ' days left</div></div>';
    });
    html += '</div>';
  }

  // Property Occupancy
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:16px">' +
    '<h4 style="font-size:14px;margin-bottom:14px"><i class="fas fa-building" style="color:#00CEC9;margin-right:8px"></i>Occupancy Overview</h4>';
  PROPS.forEach(p => {
    const occ = Math.round(p.r * p.o / 100);
    const vac = p.r - occ;
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
      '<div style="width:24px;height:24px;border-radius:6px;background:' + p.c + '22;color:' + p.c + ';display:flex;align-items:center;justify-content:center;font-size:10px"><i class="fas ' + p.icon + '"></i></div>' +
      '<div style="width:90px;font-size:11px;font-weight:600">' + p.n + '</div>' +
      '<div style="flex:1;font-size:10px;color:var(--t3)">' + occ + ' / ' + p.r + ' rooms</div>' +
      '<div style="font-size:12px;font-weight:700;color:' + (p.o >= 90 ? 'var(--ok)' : p.o >= 80 ? 'var(--warn)' : 'var(--err)') + '">' + p.o + '%</div></div>';
  });
  html += '</div>';

  // Footer
  html += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--t3)">' +
    'This report was auto-generated by WeStay AI &bull; ' + now.toLocaleDateString('en-MY') + ' ' + now.toLocaleTimeString('en-MY') +
    '<br>For questions, contact admin@westay.my</div>';

  html += '</div>';

  // Log
  AUTOMATIONS.autoReport.lastRun = now.toISOString();
  AUTOMATIONS.autoReport.log.push({ date: now.toISOString(), type: 'Monthly Report', status: 'Generated' });
  saveAutomationState();

  // Open in modal
  openModal('<i class="fas fa-chart-bar" style="color:#6C5CE7"></i> Auto-Generated Report', html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="downloadReportCSV()"><i class="fas fa-download"></i> Download CSV</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printReport()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');

  toast('Monthly report auto-generated!', 'success');
  pushNotif('fa-chart-bar', '#6C5CE7', 'Report Generated', month + ' ' + year + ' portfolio report ready');
}

function reportKPI(val, label, color) {
  return '<div style="text-align:center;padding:14px;background:var(--bg3);border-radius:12px;border-left:3px solid ' + color + '">' +
    '<div style="font-size:20px;font-weight:800;color:' + color + '">' + val + '</div>' +
    '<div style="font-size:10px;color:var(--t3);margin-top:2px">' + label + '</div></div>';
}

function downloadReportCSV() {
  const totalRev = PROPS.reduce((s,p) => s + p.rev, 0);
  const headers = ['Property','Rooms','Occupancy %','Revenue (RM)','Type'];
  const rows = PROPS.map(p => [p.n, p.r, p.o + '%', p.rev, p.type]);
  rows.push(['TOTAL', PROPS.reduce((s,p)=>s+p.r,0), Math.round(PROPS.reduce((s,p)=>s+Math.round(p.r*p.o/100),0)/PROPS.reduce((s,p)=>s+p.r,0)*100)+'%', totalRev, '']);
  exportCSV(headers, rows, 'westay-monthly-report-' + new Date().toISOString().slice(0,7) + '.csv');
}

function printReport() {
  const modalBody = document.querySelector('.modal-body');
  if (!modalBody) return;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  w.document.write('<html><head><title>WeStay Monthly Report</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#1a1929;color:#e2e0f0;padding:30px;max-width:750px;margin:0 auto}*{box-sizing:border-box}</style></head><body>' + modalBody.innerHTML + '</body></html>');
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

// ============================================================
// 2. AUTO-GENERATE TENANCY AGREEMENT
// ============================================================
function autoGenerateTA(tenantName) {
  // Find tenant and their contract
  const tenant = tenantName ? TENANTS.find(t => t.n === tenantName) : null;
  let contract = tenant ? CONTRACTS.find(c => c.tenant === tenant.n) : null;

  if (!tenant && !tenantName) {
    // Show selection modal
    const tenantOpts = TENANTS.map(t => '<option value="' + t.n + '">' + t.n + ' — ' + t.p + '</option>').join('');
    openModal('<i class="fas fa-file-contract" style="color:#6C5CE7"></i> Generate Tenancy Agreement',
      '<div class="form-group"><label>Select Tenant</label><select id="taSelTenant">' + tenantOpts + '</select></div>' +
      '<div class="form-group"><label>Or create for new tenant?</label>' +
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-ghost" style="flex:1" onclick="closeModal();autoGenerateTA(document.getElementById(\'taSelTenant\').value)">Use Selected</button>' +
      '<button class="btn btn-p" style="flex:1" onclick="closeModal();addTenantModal()">New Tenant First</button></div></div>',
      '', 'sm');
    return;
  }

  if (!tenant) { toast('Tenant not found', 'error'); return; }

  // Auto fill data
  const now = new Date();
  const prop = tenant.p.split(' ')[0];
  const room = tenant.p;
  const rent = tenant.r;
  const dep = tenant.dep || 'RM ' + (parseInt(rent.replace(/[^\d]/g,''))*2);
  const startDate = contract ? contract.start : now.toISOString().slice(0,10);
  const endDate = contract ? contract.end : tenant.e || new Date(now.getTime() + 365*24*60*60*1000).toISOString().slice(0,10);
  const taId = 'TA-' + now.getFullYear() + '-' + String(CONTRACTS.length + 48 + Math.floor(Math.random()*10)).padStart(3,'0');

  let html = '<div style="max-width:660px;margin:0 auto">';

  // TA Header
  html += '<div style="background:linear-gradient(135deg,#6C5CE7,#A29BFE);padding:28px;border-radius:16px;text-align:center;margin-bottom:20px">' +
    '<div style="font-size:30px;margin-bottom:4px">📜</div>' +
    '<h2 style="color:#fff;font-size:18px;margin-bottom:4px">TENANCY AGREEMENT</h2>' +
    '<div style="color:rgba(255,255,255,.8);font-size:12px">' + taId + '</div>' +
    '<div style="color:rgba(255,255,255,.5);font-size:10px;margin-top:4px">Auto-generated by WeStay System</div></div>';

  // Parties
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:14px">' +
    '<h4 style="font-size:13px;margin-bottom:12px"><i class="fas fa-users" style="color:#6C5CE7;margin-right:8px"></i>Parties</h4>' +
    '<div class="dep-card">' +
    depRow('Landlord', findLandlordForProp(prop)) +
    depRow('Tenant', tenant.n) +
    depRow('IC / Passport', 'To be provided') +
    depRow('Contact', tenant.phone || 'N/A') +
    '</div></div>';

  // Property Details
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:14px">' +
    '<h4 style="font-size:13px;margin-bottom:12px"><i class="fas fa-building" style="color:#00CEC9;margin-right:8px"></i>Premises</h4>' +
    '<div class="dep-card">' +
    depRow('Property', prop) +
    depRow('Unit / Room', room) +
    depRow('Address', (PROPS.find(p=>p.n===prop)||{}).addr || 'Kampar, Perak') +
    depRow('Furnishing', 'Fully Furnished') +
    '</div></div>';

  // Tenancy Terms
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:14px">' +
    '<h4 style="font-size:13px;margin-bottom:12px"><i class="fas fa-calendar-alt" style="color:#00B894;margin-right:8px"></i>Tenancy Terms</h4>' +
    '<div class="dep-card">' +
    depRow('Commencement', startDate) +
    depRow('Expiry', endDate) +
    depRow('Duration', calcDuration(startDate, endDate)) +
    depRow('Monthly Rent', rent) +
    depRow('Security Deposit', dep) +
    depRow('Utility Deposit', 'RM 100') +
    depRow('Payment Due', '1st of every month') +
    depRow('Late Payment Fee', 'RM 10/day after 7 days') +
    '</div></div>';

  // Terms & Conditions
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:14px">' +
    '<h4 style="font-size:13px;margin-bottom:12px"><i class="fas fa-gavel" style="color:#FDCB6E;margin-right:8px"></i>Key Terms & Conditions</h4>' +
    '<div style="font-size:11px;color:var(--t2);line-height:1.8">' +
    '<div style="margin-bottom:8px"><strong>1. Rent Payment:</strong> Payable on or before the 1st of each month. Late payment beyond 7 days will incur a penalty of RM 10 per day and may result in electric sub-meter disconnection.</div>' +
    '<div style="margin-bottom:8px"><strong>2. Security Deposit:</strong> Refundable upon satisfactory inspection at end of tenancy, subject to deductions for damages.</div>' +
    '<div style="margin-bottom:8px"><strong>3. Maintenance:</strong> Tenant shall report all maintenance issues via the WeStay platform. Landlord is responsible for structural repairs.</div>' +
    '<div style="margin-bottom:8px"><strong>4. Smart Lock Access:</strong> Digital fingerprint access will be automatically provisioned upon agreement signing and disabled upon tenancy expiry.</div>' +
    '<div style="margin-bottom:8px"><strong>5. Utilities:</strong> Electric sub-meter readings will be monitored via IoT. Usage charges are billed separately.</div>' +
    '<div style="margin-bottom:8px"><strong>6. Termination:</strong> Either party may terminate with 30 days written notice. Early termination forfeits the security deposit.</div>' +
    '<div style="margin-bottom:8px"><strong>7. House Rules:</strong> Tenant agrees to abide by community guidelines. Quiet hours: 11 PM — 7 AM.</div>' +
    '<div><strong>8. Governing Law:</strong> This agreement is governed by the laws of Malaysia.</div></div></div>';

  // Signature Section
  html += '<div style="background:var(--bg3);border-radius:14px;padding:18px;margin-bottom:14px">' +
    '<h4 style="font-size:13px;margin-bottom:16px"><i class="fas fa-pen-nib" style="color:#FD79A8;margin-right:8px"></i>Signatures</h4>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
    '<div style="text-align:center"><div style="height:60px;border-bottom:2px dashed var(--brd);margin-bottom:8px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;font-size:10px;color:var(--t3)">[Digital Signature]</div><div style="font-size:11px;font-weight:600">Landlord</div><div style="font-size:10px;color:var(--t3)">' + findLandlordForProp(prop) + '</div></div>' +
    '<div style="text-align:center"><div style="height:60px;border-bottom:2px dashed var(--brd);margin-bottom:8px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;font-size:10px;color:var(--t3)">[Digital Signature]</div><div style="font-size:11px;font-weight:600">Tenant</div><div style="font-size:10px;color:var(--t3)">' + tenant.n + '</div></div></div></div>';

  html += '<div style="text-align:center;padding:10px;font-size:9px;color:var(--t3)">Document auto-generated by WeStay System &bull; ' + now.toLocaleDateString('en-MY') + '</div>';
  html += '</div>';

  // Add to contracts if not exists
  if (!contract) {
    CONTRACTS.push({ id: taId, tenant: tenant.n, prop: room, start: startDate, end: endDate, rent: rent, s: 'Pending Signature', dep: dep });
    saveData();
  }

  // Log
  AUTOMATIONS.autoTA.lastRun = now.toISOString();
  AUTOMATIONS.autoTA.log.push({ date: now.toISOString(), tenant: tenant.n, taId: taId, status: 'Generated' });
  saveAutomationState();

  openModal('<i class="fas fa-file-contract" style="color:#6C5CE7"></i> Tenancy Agreement — ' + tenant.n, html,
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-p" onclick="signTA(\'' + (contract ? contract.id : taId) + '\',\'' + tenant.n.replace(/'/g,"\\'") + '\')"><i class="fas fa-pen-nib"></i> E-Sign</button>' +
    '<button class="btn" style="background:#00B894;color:#fff" onclick="printTA()"><i class="fas fa-print"></i> Print / PDF</button>', 'lg');

  toast('Tenancy Agreement generated for ' + tenant.n, 'success');
  pushNotif('fa-file-contract', '#6C5CE7', 'TA Generated', tenant.n + ' — ' + taId);
}

function findLandlordForProp(propName) {
  const ll = LANDLORDS.find(l => l.props.some(p => propName.includes(p)));
  return ll ? ll.n : 'WeStay Management';
}

function calcDuration(start, end) {
  if (!start || !end) return '12 months';
  const s = new Date(start), e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return months + ' months';
}

function signTA(taId, tenantName) {
  const c = CONTRACTS.find(x => x.id === taId);
  if (c) {
    c.s = 'Active';
    saveData();
  }
  closeModal();
  toast('Tenancy Agreement ' + taId + ' signed by ' + tenantName + '!', 'success');
  pushNotif('fa-check-circle', '#00B894', 'TA Signed', tenantName + ' signed ' + taId);
  navigateTo(currentPage);
}

function printTA() {
  const modalBody = document.querySelector('.modal-body');
  if (!modalBody) return;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  w.document.write('<html><head><title>Tenancy Agreement</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#1a1929;color:#e2e0f0;padding:30px;max-width:700px;margin:0 auto}*{box-sizing:border-box}</style></head><body>' + modalBody.innerHTML + '</body></html>');
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

// Check for expiring contracts that need auto-TA
function checkAutoTA() {
  if (!AUTOMATIONS.autoTA.enabled) return;
  const now = new Date();
  CONTRACTS.forEach(c => {
    if (!c.end || c.s === 'Expired') return;
    const diff = (new Date(c.end) - now) / (1000*60*60*24);
    if (diff > 0 && diff <= 30 && c.s !== 'Pending Renewal') {
      // Mark as needing renewal
      c.s = 'Expiring Soon';
      saveData();
    }
  });
}

// ============================================================
// 3. SMART LOCK FINGERPRINT AUTO-DISABLE
// ============================================================
const SMART_LOCK_REGISTRY = [
  { tenant: 'Sarah Lim', unit: 'Cambridge A201', fingerprints: 2, status: 'Active', leaseEnd: '2026-08-31' },
  { tenant: 'Wei Jun', unit: 'Tsing Hua A302', fingerprints: 2, status: 'Active', leaseEnd: '2026-12-15' },
  { tenant: 'Priya Devi', unit: 'Imperial C108', fingerprints: 1, status: 'Active', leaseEnd: '2026-06-30' },
  { tenant: 'James Wong', unit: 'Harvard B210', fingerprints: 2, status: 'Active', leaseEnd: '2026-07-15' },
  { tenant: 'Nurul Ain', unit: 'Beijing A105', fingerprints: 1, status: 'Active', leaseEnd: '2027-01-31' },
  { tenant: 'Raj Kumar', unit: 'Manchester D302', fingerprints: 2, status: 'Active', leaseEnd: '2026-09-30' },
  { tenant: 'Chen Mei Ling', unit: 'Westlake V101', fingerprints: 1, status: 'Active', leaseEnd: '2026-11-15' },
  { tenant: 'Ahmad Rizal', unit: 'Oxford B105', fingerprints: 0, status: 'Pending Setup', leaseEnd: '2027-04-14' }
];

function checkSmartLockExpiry() {
  if (!AUTOMATIONS.smartLockExpiry.enabled) return;
  const now = new Date();
  let disabled = 0;
  SMART_LOCK_REGISTRY.forEach(lock => {
    if (lock.status === 'Active' && lock.leaseEnd) {
      const end = new Date(lock.leaseEnd);
      if (now >= end) {
        lock.status = 'Disabled — Lease Expired';
        lock.fingerprints = 0;
        disabled++;
        AUTOMATIONS.smartLockExpiry.log.push({ date: now.toISOString(), tenant: lock.tenant, unit: lock.unit, action: 'Fingerprint disabled' });
        pushNotif('fa-fingerprint', '#E17055', 'Fingerprint Disabled', lock.tenant + ' — ' + lock.unit + ' (lease expired)');
      }
    }
  });
  if (disabled) {
    AUTOMATIONS.smartLockExpiry.lastRun = now.toISOString();
    saveAutomationState();
    toast(disabled + ' fingerprint(s) auto-disabled (lease expired)', 'warning');
  }
}

function showSmartLockManager() {
  const now = new Date();
  let html = '<div style="margin-bottom:14px;font-size:11px;color:var(--t2)">Fingerprint access is automatically disabled when a tenancy period ends. The system checks daily.</div>';

  html += '<table><thead><tr><th>Tenant</th><th>Unit</th><th>Fingerprints</th><th>Lease End</th><th>Status</th><th></th></tr></thead><tbody>';
  SMART_LOCK_REGISTRY.forEach(lock => {
    const end = new Date(lock.leaseEnd);
    const diff = Math.round((end - now) / (1000*60*60*24));
    const isExpired = now >= end;
    const isWarning = !isExpired && diff <= 30;
    const cls = lock.status === 'Active' ? 'b-ok' : lock.status.includes('Disabled') ? 'b-err' : 'b-warn';
    const daysLabel = isExpired ? '<span style="color:var(--err);font-weight:600">Expired</span>' :
      isWarning ? '<span style="color:var(--warn)">' + diff + 'd left</span>' :
      '<span style="color:var(--t3)">' + diff + 'd left</span>';
    const esc = lock.tenant.replace(/'/g, "\\'");

    html += '<tr><td>' + lock.tenant + '</td><td>' + lock.unit + '</td>' +
      '<td>' + lock.fingerprints + ' <i class="fas fa-fingerprint" style="color:' + (lock.fingerprints ? 'var(--p)' : 'var(--t3)') + ';font-size:10px"></i></td>' +
      '<td>' + lock.leaseEnd + '<br>' + daysLabel + '</td>' +
      '<td><span class="bs ' + cls + '">' + lock.status + '</span></td>' +
      '<td>';
    if (lock.status === 'Active') {
      html += '<button class="btn-s" style="font-size:9px" onclick="manualDisableLock(\'' + esc + '\')"><i class="fas fa-ban"></i> Disable</button>';
    } else if (lock.status.includes('Disabled')) {
      html += '<button class="btn-s" style="font-size:9px" onclick="reEnableLock(\'' + esc + '\')"><i class="fas fa-redo"></i> Re-enable</button>';
    }
    html += '</td></tr>';
  });
  html += '</tbody></table>';

  // Run check button
  html += '<div style="margin-top:14px;display:flex;gap:8px">' +
    '<button class="btn btn-p" onclick="closeModal();checkSmartLockExpiry();showSmartLockManager()"><i class="fas fa-sync"></i> Run Expiry Check Now</button>' +
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button></div>';

  openModal('<i class="fas fa-fingerprint" style="color:#6C5CE7"></i> Smart Lock Fingerprint Manager', html, '', 'lg');
}

function manualDisableLock(tenantName) {
  const lock = SMART_LOCK_REGISTRY.find(l => l.tenant === tenantName);
  if (!lock) return;
  confirmDialog('Disable Fingerprint?', 'Disable all fingerprint access for ' + tenantName + ' at ' + lock.unit + '?', function() {
    lock.status = 'Disabled — Manual';
    lock.fingerprints = 0;
    AUTOMATIONS.smartLockExpiry.log.push({ date: new Date().toISOString(), tenant: tenantName, unit: lock.unit, action: 'Manual disable' });
    saveAutomationState();
    toast('Fingerprint disabled for ' + tenantName, 'warning');
    pushNotif('fa-fingerprint', '#E17055', 'Fingerprint Disabled', tenantName + ' — manual override');
    showSmartLockManager();
  }, 'danger');
}

function reEnableLock(tenantName) {
  const lock = SMART_LOCK_REGISTRY.find(l => l.tenant === tenantName);
  if (!lock) return;
  confirmDialog('Re-enable Fingerprint?', 'Restore fingerprint access for ' + tenantName + '?', function() {
    lock.status = 'Active';
    lock.fingerprints = 2;
    AUTOMATIONS.smartLockExpiry.log.push({ date: new Date().toISOString(), tenant: tenantName, unit: lock.unit, action: 'Re-enabled' });
    saveAutomationState();
    toast('Fingerprint re-enabled for ' + tenantName, 'success');
    pushNotif('fa-fingerprint', '#00B894', 'Fingerprint Re-enabled', tenantName);
    showSmartLockManager();
  }, 'success');
}

// ============================================================
// 4. LATE PAYMENT AUTO CUT ELECTRIC SUB-METER
// ============================================================
// Per-ROOM sub-meters — every room within a unit has its own meter
// The "unit" field is the property/block, "room" is the specific room
const ELECTRIC_METERS = [
  // Cambridge Unit A2 — 4 rooms, each has its own sub-meter
  { tenant: 'Sarah Lim', unit: 'Cambridge', room: 'A201', meterId: 'EM-CAM-A201', status: 'Connected', kwh: 42.5, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Cambridge', room: 'A202', meterId: 'EM-CAM-A202', status: 'Connected', kwh: 18.2, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Cambridge', room: 'A203', meterId: 'EM-CAM-A203', status: 'Connected', kwh: 22.8, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Cambridge', room: 'A204', meterId: 'EM-CAM-A204', status: 'Connected', kwh: 15.0, lastRead: '2026-04-01' },

  // Oxford Unit B1 — 3 rooms
  { tenant: 'Ahmad Rizal', unit: 'Oxford', room: 'B105', meterId: 'EM-OXF-B105', status: 'Connected', kwh: 28.3, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Oxford', room: 'B106', meterId: 'EM-OXF-B106', status: 'Connected', kwh: 12.1, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Oxford', room: 'B107', meterId: 'EM-OXF-B107', status: 'Connected', kwh: 9.6, lastRead: '2026-04-01' },

  // Tsing Hua Unit A3 — 4 rooms
  { tenant: 'Wei Jun', unit: 'Tsing Hua', room: 'A302', meterId: 'EM-TSH-A302', status: 'Connected', kwh: 55.1, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Tsing Hua', room: 'A303', meterId: 'EM-TSH-A303', status: 'Connected', kwh: 30.4, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Tsing Hua', room: 'A304', meterId: 'EM-TSH-A304', status: 'Connected', kwh: 25.7, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Tsing Hua', room: 'A305', meterId: 'EM-TSH-A305', status: 'Connected', kwh: 19.3, lastRead: '2026-04-01' },

  // Imperial Unit C1 — 3 rooms
  { tenant: 'Priya Devi', unit: 'Imperial', room: 'C108', meterId: 'EM-IMP-C108', status: 'Connected', kwh: 33.7, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Imperial', room: 'C109', meterId: 'EM-IMP-C109', status: 'Connected', kwh: 20.5, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Imperial', room: 'C110', meterId: 'EM-IMP-C110', status: 'Connected', kwh: 14.2, lastRead: '2026-04-01' },

  // Harvard Unit B2 — 3 rooms
  { tenant: 'James Wong', unit: 'Harvard', room: 'B210', meterId: 'EM-HAR-B210', status: 'Connected', kwh: 19.8, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Harvard', room: 'B211', meterId: 'EM-HAR-B211', status: 'Connected', kwh: 16.3, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Harvard', room: 'B212', meterId: 'EM-HAR-B212', status: 'Connected', kwh: 11.9, lastRead: '2026-04-01' },

  // Beijing Unit A1 — 3 rooms
  { tenant: 'Nurul Ain', unit: 'Beijing', room: 'A105', meterId: 'EM-BEJ-A105', status: 'Connected', kwh: 31.2, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Beijing', room: 'A106', meterId: 'EM-BEJ-A106', status: 'Connected', kwh: 17.8, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Beijing', room: 'A107', meterId: 'EM-BEJ-A107', status: 'Connected', kwh: 21.4, lastRead: '2026-04-01' },

  // Manchester Unit D3 — 3 rooms
  { tenant: 'Raj Kumar', unit: 'Manchester', room: 'D302', meterId: 'EM-MAN-D302', status: 'Connected', kwh: 48.6, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Manchester', room: 'D303', meterId: 'EM-MAN-D303', status: 'Connected', kwh: 22.1, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Manchester', room: 'D304', meterId: 'EM-MAN-D304', status: 'Connected', kwh: 18.7, lastRead: '2026-04-01' },

  // Westlake Unit V1 — 3 rooms
  { tenant: 'Chen Mei Ling', unit: 'Westlake Villa', room: 'V101', meterId: 'EM-WLK-V101', status: 'Connected', kwh: 37.4, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Westlake Villa', room: 'V102', meterId: 'EM-WLK-V102', status: 'Connected', kwh: 24.6, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Westlake Villa', room: 'V103', meterId: 'EM-WLK-V103', status: 'Connected', kwh: 19.8, lastRead: '2026-04-01' }
];

// --- Auto-cut: targets only the specific ROOM meter for the overdue tenant ---
function checkLatePmtElectric() {
  if (!AUTOMATIONS.latePmtElectric.enabled) return;
  const now = new Date();
  let cut = 0;
  BILLS.forEach(b => {
    if (b.s !== 'Overdue') return;
    // Only cut the specific ROOM meter for this tenant, not the whole unit
    const meter = ELECTRIC_METERS.find(m => m.tenant === b.t && m.status === 'Connected');
    if (meter) {
      meter.status = 'Disconnected \u2014 Overdue Payment';
      cut++;
      AUTOMATIONS.latePmtElectric.log.push({ date: now.toISOString(), tenant: b.t, unit: meter.unit, room: meter.room, meterId: meter.meterId, bill: b.id, action: 'Auto-disconnected Room ' + meter.room + ' only' });
      pushNotif('fa-bolt', '#E17055', 'Electric Cut \u2014 Room ' + meter.room, b.t + ' @ ' + meter.unit + ' Room ' + meter.room + ' (overdue ' + b.id + ')');
    }
  });
  if (cut) {
    AUTOMATIONS.latePmtElectric.lastRun = now.toISOString();
    saveAutomationState();
    toast(cut + ' room sub-meter(s) auto-disconnected (late payment)', 'error');
  }
  return cut;
}

// --- Electric Sub-Meter Manager UI (grouped by unit, per-room) ---
function showElectricMeterManager() {
  let html = '<div style="margin-bottom:14px;font-size:11px;color:var(--t2)">' +
    '<i class="fas fa-info-circle" style="color:var(--p);margin-right:4px"></i> ' +
    'Each <strong>room</strong> has its own sub-meter. Auto-cut targets only the specific room of an overdue tenant \u2014 other rooms in the same unit are unaffected. ' +
    'You can also <strong>manually cut off</strong> any room for special cases.</div>';

  // Summary stats
  const connected = ELECTRIC_METERS.filter(m => m.status === 'Connected').length;
  const disconnected = ELECTRIC_METERS.filter(m => m.status !== 'Connected').length;
  const totalKwh = ELECTRIC_METERS.reduce((s,m) => s + m.kwh, 0).toFixed(1);
  const totalRooms = ELECTRIC_METERS.length;
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--p)">' + totalRooms + '</div><div style="font-size:10px;color:var(--t3)">Total Room Meters</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--ok)">' + connected + '</div><div style="font-size:10px;color:var(--t3)">Connected</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--err)">' + disconnected + '</div><div style="font-size:10px;color:var(--t3)">Disconnected</div></div>' +
    '<div style="text-align:center;padding:12px;background:var(--bg3);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--warn)">' + totalKwh + '</div><div style="font-size:10px;color:var(--t3)">Total kWh</div></div></div>';

  // Group meters by unit
  const units = {};
  ELECTRIC_METERS.forEach(m => {
    if (!units[m.unit]) units[m.unit] = [];
    units[m.unit].push(m);
  });

  Object.keys(units).forEach(unitName => {
    const meters = units[unitName];
    const prop = PROPS.find(p => unitName.includes(p.n));
    const unitColor = prop ? prop.c : '#6C5CE7';
    const unitConnected = meters.filter(m => m.status === 'Connected').length;
    const unitDisc = meters.filter(m => m.status !== 'Connected').length;

    html += '<div style="background:var(--bg3);border-radius:14px;padding:14px;margin-bottom:12px;border-left:3px solid ' + unitColor + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<i class="fas fa-building" style="color:' + unitColor + ';font-size:14px"></i>' +
      '<div><div style="font-size:13px;font-weight:700">' + unitName + '</div>' +
      '<div style="font-size:10px;color:var(--t3)">' + meters.length + ' rooms &bull; ' + unitConnected + ' connected' + (unitDisc ? ' &bull; <span style="color:var(--err)">' + unitDisc + ' disconnected</span>' : '') + '</div></div></div>' +
      '<button class="btn-s" style="font-size:9px;color:var(--err)" onclick="manualCutUnit(\'' + unitName.replace(/'/g, "\\'") + '\')"><i class="fas fa-power-off"></i> Cut All Rooms</button>' +
      '</div>';

    html += '<table style="margin:0"><thead><tr><th>Room</th><th>Tenant</th><th>Meter ID</th><th>Usage</th><th>Status</th><th style="width:130px"></th></tr></thead><tbody>';
    meters.forEach(meter => {
      const isDisc = meter.status !== 'Connected';
      const cls = isDisc ? 'b-err' : 'b-ok';
      const escId = meter.meterId.replace(/'/g, "\\'");
      const tenantLabel = meter.tenant || '<span style="color:var(--t3);font-style:italic">Vacant</span>';
      const bill = meter.tenant ? BILLS.find(b => b.t === meter.tenant && b.s === 'Overdue') : null;

      html += '<tr><td style="font-weight:600">' + meter.room + '</td>' +
        '<td>' + tenantLabel + (bill ? ' <i class="fas fa-exclamation-circle" style="color:var(--err);font-size:9px" title="Overdue: ' + bill.id + '"></i>' : '') + '</td>' +
        '<td style="font-family:monospace;font-size:11px">' + meter.meterId + '</td>' +
        '<td>' + meter.kwh + ' kWh</td>' +
        '<td><span class="bs ' + cls + '" style="font-size:9px">' + (isDisc ? 'Disconnected' : 'Connected') + '</span></td>' +
        '<td style="text-align:right">';

      if (isDisc) {
        html += '<button class="btn-s" style="font-size:9px" onclick="reconnectMeterById(\'' + escId + '\')"><i class="fas fa-plug"></i> Reconnect</button>';
      } else {
        // Manual cut button available for ANY connected room — special case handling
        html += '<button class="btn-s" style="font-size:9px;color:var(--err)" onclick="manualCutMeterById(\'' + escId + '\')"><i class="fas fa-power-off"></i> Cut</button>';
      }
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';
  });

  // Actions
  html += '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="btn btn-p" onclick="closeModal();var c=checkLatePmtElectric();if(!c)toast(\'No overdue meters to disconnect\',\'info\');setTimeout(showElectricMeterManager,300)"><i class="fas fa-sync"></i> Run Late Payment Check</button>' +
    '<button class="btn" style="background:#E17055;color:#fff" onclick="manualCutPrompt()"><i class="fas fa-power-off"></i> Manual Cut Room</button>' +
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button></div>';

  openModal('<i class="fas fa-bolt" style="color:#FDCB6E"></i> Electric Sub-Meter Manager (Per-Room)', html, '', 'lg');
}

// Manual cut by meter ID — works for ANY room (special case support)
function manualCutMeterById(meterId) {
  const meter = ELECTRIC_METERS.find(m => m.meterId === meterId);
  if (!meter) return;
  const label = meter.tenant ? meter.tenant + ' @ ' : '';
  confirmDialog('Cut Electric Supply?', 'Disconnect sub-meter <strong>' + meter.meterId + '</strong> for <strong>Room ' + meter.room + '</strong> in ' + meter.unit + '?<br><br>' +
    (meter.tenant ? '<span style="color:var(--warn)">Tenant ' + meter.tenant + ' will be notified.</span>' : '<span style="color:var(--t3)">This room is currently vacant.</span>') +
    '<br><br><em style="font-size:10px;color:var(--t3)">Only this room will be affected. Other rooms in the same unit stay connected.</em>', function() {
    meter.status = 'Disconnected \u2014 Manual';
    AUTOMATIONS.latePmtElectric.log.push({ date: new Date().toISOString(), tenant: meter.tenant || 'Vacant', unit: meter.unit, room: meter.room, meterId: meter.meterId, action: 'Manual cut — Room ' + meter.room });
    saveAutomationState();
    toast('Electric disconnected for Room ' + meter.room + ' (' + meter.unit + ')', 'error');
    pushNotif('fa-bolt', '#E17055', 'Electric Cut — Room ' + meter.room, label + meter.unit + ' (manual)');
    closeModal();
    setTimeout(showElectricMeterManager, 200);
  }, 'danger');
}

// Manual cut all rooms in a unit
function manualCutUnit(unitName) {
  const meters = ELECTRIC_METERS.filter(m => m.unit === unitName && m.status === 'Connected');
  if (!meters.length) { toast('No connected meters in ' + unitName, 'info'); return; }
  confirmDialog('Cut ALL Rooms in ' + unitName + '?',
    'This will disconnect <strong>' + meters.length + ' room sub-meter(s)</strong> in ' + unitName + '.<br>' +
    meters.map(m => '<div style="font-size:10px;margin-top:4px">\u2022 Room ' + m.room + ' (' + m.meterId + ')' + (m.tenant ? ' — ' + m.tenant : ' — Vacant') + '</div>').join('') +
    '<br><em style="font-size:10px;color:var(--t3)">Each room will be cut individually.</em>', function() {
    meters.forEach(m => {
      m.status = 'Disconnected \u2014 Manual';
      AUTOMATIONS.latePmtElectric.log.push({ date: new Date().toISOString(), tenant: m.tenant || 'Vacant', unit: m.unit, room: m.room, meterId: m.meterId, action: 'Manual cut (unit-wide) — Room ' + m.room });
    });
    saveAutomationState();
    toast(meters.length + ' meters disconnected in ' + unitName, 'error');
    pushNotif('fa-bolt', '#E17055', 'Unit Cut — ' + unitName, meters.length + ' rooms disconnected (manual)');
    closeModal();
    setTimeout(showElectricMeterManager, 200);
  }, 'danger');
}

// Manual cut prompt — select a specific room
function manualCutPrompt() {
  const connectedMeters = ELECTRIC_METERS.filter(m => m.status === 'Connected');
  if (!connectedMeters.length) { toast('All meters already disconnected', 'info'); return; }
  const opts = connectedMeters.map(m =>
    '<option value="' + m.meterId + '">' + m.unit + ' — Room ' + m.room + (m.tenant ? ' (' + m.tenant + ')' : ' (Vacant)') + '</option>'
  ).join('');
  closeModal();
  setTimeout(function() {
    openModal('<i class="fas fa-power-off" style="color:#E17055"></i> Manual Cut — Select Room',
      '<div style="font-size:12px;color:var(--t2);margin-bottom:14px">Select a specific room to manually disconnect its electric sub-meter. This is for special cases (e.g., maintenance, safety, tenant issues).</div>' +
      '<div class="form-group"><label>Select Room</label><select id="manualCutSelect">' + opts + '</select></div>' +
      '<div class="form-group"><label>Reason (optional)</label><input type="text" id="manualCutReason" placeholder="e.g., Maintenance work, Safety issue, etc." /></div>',
      '<button class="btn btn-ghost" onclick="closeModal();setTimeout(showElectricMeterManager,200)">Cancel</button>' +
      '<button class="btn" style="background:#E17055;color:#fff" onclick="doManualCutFromPrompt()"><i class="fas fa-power-off"></i> Confirm Cut</button>', 'sm');
  }, 200);
}

function doManualCutFromPrompt() {
  const meterId = document.getElementById('manualCutSelect').value;
  const reason = (document.getElementById('manualCutReason').value || '').trim() || 'Manual cut';
  const meter = ELECTRIC_METERS.find(m => m.meterId === meterId);
  if (!meter) return;
  meter.status = 'Disconnected \u2014 Manual';
  AUTOMATIONS.latePmtElectric.log.push({ date: new Date().toISOString(), tenant: meter.tenant || 'Vacant', unit: meter.unit, room: meter.room, meterId: meter.meterId, action: reason + ' — Room ' + meter.room });
  saveAutomationState();
  toast('Electric disconnected for Room ' + meter.room + ' (' + meter.unit + ')', 'error');
  pushNotif('fa-bolt', '#E17055', 'Electric Cut — Room ' + meter.room, (meter.tenant || 'Vacant') + ' @ ' + meter.unit + ' (' + reason + ')');
  closeModal();
  setTimeout(showElectricMeterManager, 200);
}

// Reconnect by meter ID
function reconnectMeterById(meterId) {
  const meter = ELECTRIC_METERS.find(m => m.meterId === meterId);
  if (!meter) return;
  // Check if tenant has overdue bill
  const bill = meter.tenant ? BILLS.find(b => b.t === meter.tenant && b.s === 'Overdue') : null;
  if (bill) {
    confirmDialog('Overdue Bill Exists', meter.tenant + ' still has overdue bill ' + bill.id + ' (' + bill.a + '). Reconnect Room ' + meter.room + ' anyway?', function() {
      doReconnect(meter);
    }, 'warn');
  } else {
    doReconnect(meter);
  }
}

// Legacy compatibility — find by tenant name
function manualCutMeter(tenantName) {
  const meter = ELECTRIC_METERS.find(m => m.tenant === tenantName);
  if (meter) manualCutMeterById(meter.meterId);
}
function reconnectMeter(tenantName) {
  const meter = ELECTRIC_METERS.find(m => m.tenant === tenantName);
  if (meter) reconnectMeterById(meter.meterId);
}

function doReconnect(meter) {
  meter.status = 'Connected';
  const label = meter.tenant || 'Vacant';
  AUTOMATIONS.latePmtElectric.log.push({ date: new Date().toISOString(), tenant: label, unit: meter.unit, room: meter.room, meterId: meter.meterId, action: 'Reconnected — Room ' + meter.room });
  saveAutomationState();
  toast('Electric reconnected for Room ' + meter.room + ' (' + meter.unit + ')', 'success');
  pushNotif('fa-plug', '#00B894', 'Reconnected — Room ' + meter.room, label + ' @ ' + meter.unit);
  closeModal();
  setTimeout(showElectricMeterManager, 200);
}

// Auto-reconnect when payment is made (hook into payBill)
const originalPayBill = typeof payBill === 'function' ? payBill : null;
function payBillWithAutoReconnect(id) {
  // Call original
  confirmDialog('Confirm Payment', 'Process payment for ' + id + '?', function() {
    const b = BILLS.find(x => x.id === id);
    if (!b) return;
    b.s = 'Paid';
    saveData();
    toast(id + ' paid!', 'success');
    pushNotif('fa-credit-card', '#00B894', 'Payment Processed', id + ' \u2014 ' + b.a);
    // Auto reconnect electric — only the tenant's specific room meter
    const meter = ELECTRIC_METERS.find(m => m.tenant === b.t && m.status !== 'Connected');
    if (meter) {
      meter.status = 'Connected';
      AUTOMATIONS.latePmtElectric.log.push({ date: new Date().toISOString(), tenant: b.t, unit: meter.unit, room: meter.room, meterId: meter.meterId, action: 'Auto-reconnected Room ' + meter.room + ' after payment' });
      saveAutomationState();
      toast('Electric auto-reconnected for Room ' + meter.room + ' (' + meter.unit + ')', 'success');
      pushNotif('fa-plug', '#00B894', 'Reconnected \u2014 Room ' + meter.room, b.t + ' @ ' + meter.unit + ' (auto after payment)');
    }
    // Auto re-enable fingerprint if was disabled due to late payment
    const lock = SMART_LOCK_REGISTRY.find(l => l.tenant === b.t);
    if (lock && lock.status.includes('Disabled') && !lock.status.includes('Lease Expired')) {
      lock.status = 'Active';
      lock.fingerprints = 2;
      toast('Smart lock re-enabled for ' + b.t, 'success');
    }
    navigateTo(currentPage);
  }, 'success');
}
// Override payBill
payBill = payBillWithAutoReconnect;

// ============================================================
// AUTOMATION DASHBOARD (for the AI / Settings page)
// ============================================================
function showAutomationDashboard() {
  const items = [
    { key: 'autoReport', icon: 'fa-chart-bar', c: '#6C5CE7', name: 'Auto-Generate Monthly Report', desc: 'Generates a comprehensive portfolio report on the 1st of every month', action: 'autoGenerateReport()', actionLabel: 'Generate Now' },
    { key: 'autoTA', icon: 'fa-file-contract', c: '#00CEC9', name: 'Auto-Generate Tenancy Agreement', desc: 'Auto-creates TA documents 30 days before lease expiry for renewal', action: 'autoGenerateTA()', actionLabel: 'Generate TA' },
    { key: 'smartLockExpiry', icon: 'fa-fingerprint', c: '#FD79A8', name: 'Smart Lock Fingerprint Auto-Disable', desc: 'Automatically disables fingerprint access when tenancy period ends', action: 'showSmartLockManager()', actionLabel: 'Manage' },
    { key: 'latePmtElectric', icon: 'fa-bolt', c: '#FDCB6E', name: 'Late Payment Auto-Cut Electric', desc: 'Disconnects only the overdue tenant\'s room sub-meter after 7 days. Other rooms in the same unit stay connected. Manual cut also available.', action: 'showElectricMeterManager()', actionLabel: 'Manage' }
  ];

  let html = '<div style="margin-bottom:16px;font-size:12px;color:var(--t2)">These automations run continuously to keep your properties managed efficiently. Toggle on/off or trigger manually.</div>';

  items.forEach(item => {
    const auto = AUTOMATIONS[item.key];
    const lastRun = auto.lastRun ? new Date(auto.lastRun).toLocaleString('en-MY') : 'Never';
    const logCount = auto.log.length;

    html += '<div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--bg3);border-radius:14px;margin-bottom:12px;border-left:3px solid ' + item.c + '">' +
      '<div style="width:44px;height:44px;border-radius:12px;background:' + item.c + '22;color:' + item.c + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fas ' + item.icon + '"></i></div>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;margin-bottom:2px">' + item.name + '</div>' +
      '<div style="font-size:10px;color:var(--t3);margin-bottom:4px">' + item.desc + '</div>' +
      '<div style="font-size:9px;color:var(--t3)"><i class="fas fa-clock"></i> Last run: ' + lastRun + ' &bull; ' + logCount + ' actions logged</div></div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<button class="btn btn-p" style="padding:6px 12px;font-size:10px" onclick="closeModal();' + item.action + '">' + item.actionLabel + '</button>' +
      '<div class="wf-toggle' + (auto.enabled ? '' : ' off') + '" onclick="toggleAutomation(\'' + item.key + '\',this)"></div>' +
      '</div></div>';
  });

  // Recent Activity Log
  const allLogs = [];
  Object.keys(AUTOMATIONS).forEach(key => {
    AUTOMATIONS[key].log.forEach(l => {
      allLogs.push(Object.assign({}, l, { type: key }));
    });
  });
  allLogs.sort((a,b) => new Date(b.date) - new Date(a.date));

  if (allLogs.length) {
    html += '<h4 style="font-size:13px;margin:20px 0 12px"><i class="fas fa-history" style="color:var(--p);margin-right:8px"></i>Recent Automation Activity</h4>';
    allLogs.slice(0, 10).forEach(log => {
      const icons = { autoReport: 'fa-chart-bar', autoTA: 'fa-file-contract', smartLockExpiry: 'fa-fingerprint', latePmtElectric: 'fa-bolt' };
      const colors = { autoReport: '#6C5CE7', autoTA: '#00CEC9', smartLockExpiry: '#FD79A8', latePmtElectric: '#FDCB6E' };
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg3);border-radius:8px;margin-bottom:4px">' +
        '<i class="fas ' + icons[log.type] + '" style="color:' + colors[log.type] + ';font-size:11px"></i>' +
        '<div style="flex:1;font-size:11px">' + (log.action || log.status || log.type) + (log.tenant ? ' — ' + log.tenant : '') + '</div>' +
        '<div style="font-size:9px;color:var(--t3)">' + new Date(log.date).toLocaleString('en-MY') + '</div></div>';
    });
  }

  openModal('<i class="fas fa-robot" style="color:var(--p)"></i> Automation Center', html, '<button class="btn btn-ghost" onclick="closeModal()">Close</button>', 'lg');
}

function toggleAutomation(key, el) {
  AUTOMATIONS[key].enabled = !AUTOMATIONS[key].enabled;
  saveAutomationState();
  if (el) el.classList.toggle('off');
  toast(key.replace(/([A-Z])/g,' $1') + (AUTOMATIONS[key].enabled ? ' enabled' : ' disabled'), AUTOMATIONS[key].enabled ? 'success' : 'info');
}

// ============================================================
// INITIAL AUTO-CHECKS ON LOAD
// ============================================================
(function runAutoChecks() {
  setTimeout(function() {
    checkAutoTA();
    // Don't auto-cut on first load — only when triggered
  }, 2000);
})();
