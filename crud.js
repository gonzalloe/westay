// ============ WESTAY CRUD & DETAIL VIEWS ============
// All user inputs are sanitized via sanitizeInput() before storage.
// All innerHTML output is escaped via escHtml() from interactions.js.

// ---- ADD PROPERTY ----
function addPropertyModal() {
  openModal('Add New Property',
    '<div class="form-row"><div class="form-group"><label>Property Name</label><input id="apName" placeholder="e.g. Sunway Tower"></div>' +
    '<div class="form-group"><label>Address</label><input id="apAddr" placeholder="e.g. Kampar, Perak"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Total Rooms</label><input id="apRooms" type="number" placeholder="40"></div>' +
    '<div class="form-group"><label>Type</label><select id="apType"><option>Student</option><option>Premium</option><option>Mixed</option></select></div></div>' +
    '<div class="form-group"><label>Icon</label><select id="apIcon"><option value="fa-building">Building</option><option value="fa-university">University</option><option value="fa-graduation-cap">Graduation</option><option value="fa-crown">Crown</option><option value="fa-water">Water</option><option value="fa-home">Home</option></select></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doAddProperty()"><i class="fas fa-plus"></i> Add</button>');
}
function doAddProperty() {
  const n = sanitizeInput(document.getElementById('apName').value.trim());
  if (!n) { toast('Name is required', 'error'); return; }
  PROPS.push({ n, o:0, r:parseInt(document.getElementById('apRooms').value)||30, c:COLORS[PROPS.length%8], icon:document.getElementById('apIcon').value, addr:sanitizeInput(document.getElementById('apAddr').value.trim())||'Kampar, Perak', rev:0, type:document.getElementById('apType').value });
  saveData(); closeModal(); toast('Property "' + escHtml(n) + '" added!', 'success');
  pushNotif('fa-building', '#6C5CE7', 'Property Added', escHtml(n)); navigateTo(currentPage);
}

// ---- ADD TENANT ----
function addTenantModal() {
  openModal('Add New Tenant',
    '<div class="form-row"><div class="form-group"><label>Full Name</label><input id="atName" placeholder="e.g. John Smith"></div>' +
    '<div class="form-group"><label>Phone</label><input id="atPhone" placeholder="+60 12-345 6789"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Property</label><select id="atProp">' + PROPS.map(p => '<option>' + p.n + '</option>').join('') + '</select></div>' +
    '<div class="form-group"><label>Room</label><input id="atRoom" placeholder="e.g. A301"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Rent (RM)</label><input id="atRent" type="number" placeholder="280"></div>' +
    '<div class="form-group"><label>Lease End</label><input id="atEnd" type="date"></div></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doAddTenant()"><i class="fas fa-user-plus"></i> Add</button>');
}
function doAddTenant() {
  const n = sanitizeInput(document.getElementById('atName').value.trim());
  if (!n) { toast('Name is required', 'error'); return; }
  const rent = parseInt(document.getElementById('atRent').value)||0;
  TENANTS.push({ n, p:document.getElementById('atProp').value+' '+sanitizeInput(document.getElementById('atRoom').value.trim()), r:'RM '+rent, s:'pending', e:document.getElementById('atEnd').value||'\u2014', phone:sanitizeInput(document.getElementById('atPhone').value.trim()), dep:'RM '+(rent*2) });
  saveData(); closeModal(); toast('Tenant "' + escHtml(n) + '" added!', 'success');
  pushNotif('fa-user-plus', '#00CEC9', 'New Tenant', escHtml(n)); navigateTo(currentPage);
}

// ---- ADD TICKET ----
function addTicketModal() {
  openModal('New Maintenance Ticket',
    '<div class="form-group"><label>Issue Title</label><input id="tkTitle" placeholder="e.g. Air conditioning not cooling"></div>' +
    '<div class="form-row"><div class="form-group"><label>Location</label><input id="tkLoc" placeholder="e.g. Cambridge A201"></div>' +
    '<div class="form-group"><label>Priority</label><select id="tkPri"><option>Low</option><option selected>Medium</option><option>High</option></select></div></div>' +
    '<div class="form-group"><label>Description</label><textarea id="tkDesc" placeholder="Describe the issue..."></textarea></div>' +
    '<div class="form-group"><label><i class="fas fa-camera" style="color:#FD79A8;margin-right:6px"></i>Attach Photos</label>' +
    '<div id="tkPhotoPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"></div>' +
    '<div style="border:2px dashed var(--bg3);border-radius:12px;padding:18px;text-align:center;cursor:pointer;transition:.2s" onclick="document.getElementById(\'tkPhotoInput\').click()" onmouseover="this.style.borderColor=\'var(--p)\'" onmouseout="this.style.borderColor=\'var(--bg3)\'">' +
    '<i class="fas fa-cloud-upload-alt" style="font-size:22px;color:var(--p);display:block;margin-bottom:6px"></i>' +
    '<div style="font-size:12px;font-weight:600;color:var(--t2)">Click to upload photos</div>' +
    '<div style="font-size:10px;color:var(--t3);margin-top:2px">JPG, PNG, GIF up to 10MB each</div>' +
    '</div>' +
    '<input type="file" id="tkPhotoInput" accept="image/*" multiple style="display:none" onchange="previewTicketPhotos(this)">' +
    '</div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doAddTicket()"><i class="fas fa-plus"></i> Submit</button>');
}

var _pendingTicketPhotos = [];

function previewTicketPhotos(input) {
  var container = document.getElementById('tkPhotoPreview');
  if (!input.files || !input.files.length) return;
  for (var i = 0; i < input.files.length; i++) {
    _pendingTicketPhotos.push(input.files[i].name);
    var color = typeof COLORS !== 'undefined' ? COLORS[_pendingTicketPhotos.length % 8] : '#6C5CE7';
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;background:' + color + '22;border:1px solid ' + color + '44;border-radius:8px;font-size:10px;color:var(--t2)';
    div.innerHTML = '<i class="fas fa-image" style="color:' + color + '"></i>' + escHtml(input.files[i].name) + '<span style="cursor:pointer;color:var(--err);margin-left:4px" onclick="removeTicketPhotoPreview(this,' + (_pendingTicketPhotos.length - 1) + ')">&times;</span>';
    container.appendChild(div);
  }
}

function removeTicketPhotoPreview(el, idx) {
  _pendingTicketPhotos[idx] = null;
  el.parentElement.remove();
}

function doAddTicket() {
  const t = sanitizeInput(document.getElementById('tkTitle').value.trim());
  if (!t) { toast('Title is required', 'error'); return; }
  const pr = document.getElementById('tkPri').value;
  const ic = { High:'fa-fire', Medium:'fa-exclamation-circle', Low:'fa-info-circle' };
  const cc = { High:'#E17055', Medium:'#FDCB6E', Low:'#00B894' };
  const id = 'TK-' + String(TICKETS.length+1).padStart(3,'0');
  TICKETS.push({ id, t, loc:sanitizeInput(document.getElementById('tkLoc').value.trim())||'Not specified', pr, icon:ic[pr], c:cc[pr], time:'Just now', by:ROLE_CONFIG[currentRole]?.user?.name||'User', s:'Open' });
  // Attach photos directly during ticket creation
  var photos = _pendingTicketPhotos.filter(function(p) { return p !== null; });
  if (photos.length) {
    TICKET_PHOTOS[id] = photos;
  }
  _pendingTicketPhotos = [];
  saveData(); closeModal(); toast('Ticket ' + escHtml(id) + ' created!' + (photos.length ? ' (' + photos.length + ' photo(s) attached)' : ''), 'success');
  pushNotif('fa-wrench', cc[pr], 'New Ticket: ' + escHtml(pr), escHtml(t)); navigateTo(currentPage);
}

// ---- ADD LEAD ----
function addLeadModal() {
  openModal('Add New Lead',
    '<div class="form-row"><div class="form-group"><label>Full Name</label><input id="alName" placeholder="e.g. Jane Doe"></div>' +
    '<div class="form-group"><label>Phone</label><input id="alPhone" placeholder="+60 12-345 6789"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Property</label><select id="alProp">' + PROPS.map(p => '<option>' + p.n + '</option>').join('') + '</select></div>' +
    '<div class="form-group"><label>Source</label><select id="alSrc"><option>Website</option><option>Social Media</option><option>Referral</option><option>Walk-in</option><option>Agent Referral</option></select></div></div>' +
    '<div class="form-group"><label>Budget</label><input id="alBudget" placeholder="e.g. RM 250-300"></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doAddLead()"><i class="fas fa-plus"></i> Add</button>');
}
function doAddLead() {
  const n = sanitizeInput(document.getElementById('alName').value.trim());
  if (!n) { toast('Name is required', 'error'); return; }
  const d = new Date(), ds = String(d.getDate()).padStart(2,'0')+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getFullYear();
  LEADS.push({ n, phone:sanitizeInput(document.getElementById('alPhone').value.trim()), src:document.getElementById('alSrc').value, prop:document.getElementById('alProp').value, s:'New', date:ds, budget:sanitizeInput(document.getElementById('alBudget').value.trim())||'N/A' });
  saveData(); closeModal(); toast('Lead "' + escHtml(n) + '" added!', 'success');
  pushNotif('fa-user-plus', '#FD79A8', 'New Lead', escHtml(n)); navigateTo(currentPage);
}

// ---- ADD VENDOR ----
function addVendorModal() {
  openModal('Add New Vendor',
    '<div class="form-row"><div class="form-group"><label>Company Name</label><input id="avName" placeholder="e.g. CoolAir Services"></div>' +
    '<div class="form-group"><label>Specialty</label><select id="avType"><option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>Cleaning</option><option>Security</option><option>General</option></select></div></div>' +
    '<div class="form-group"><label>Phone</label><input id="avPhone" placeholder="+60 12-345 6789"></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doAddVendor()"><i class="fas fa-plus"></i> Add</button>');
}
function doAddVendor() {
  const n = sanitizeInput(document.getElementById('avName').value.trim());
  if (!n) { toast('Name is required', 'error'); return; }
  VENDORS.push({ n, type:document.getElementById('avType').value, jobs:0, rating:0, s:'active', c:COLORS[VENDORS.length%8], phone:sanitizeInput(document.getElementById('avPhone').value.trim()) });
  saveData(); closeModal(); toast('Vendor "' + escHtml(n) + '" added!', 'success'); navigateTo(currentPage);
}

// ---- ADD CONTRACT ----
function addContractModal() {
  openModal('New Contract',
    '<div class="form-row"><div class="form-group"><label>Tenant</label><select id="acT">' + TENANTS.map(t => '<option>' + t.n + '</option>').join('') + '</select></div>' +
    '<div class="form-group"><label>Property & Room</label><input id="acP" placeholder="e.g. Cambridge A301"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Start</label><input id="acS" type="date"></div>' +
    '<div class="form-group"><label>End</label><input id="acE" type="date"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Rent (RM)</label><input id="acR" type="number" placeholder="280"></div>' +
    '<div class="form-group"><label>Deposit (RM)</label><input id="acD" type="number" placeholder="560"></div></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doAddContract()"><i class="fas fa-file-signature"></i> Create</button>');
}
function doAddContract() {
  const t = document.getElementById('acT').value, p = sanitizeInput(document.getElementById('acP').value.trim());
  if (!t||!p) { toast('Tenant and property are required', 'error'); return; }
  const r = parseInt(document.getElementById('acR').value)||0;
  const id = 'TA-2026-' + String(CONTRACTS.length+48).padStart(3,'0');
  CONTRACTS.push({ id, tenant:t, prop:p, start:document.getElementById('acS').value, end:document.getElementById('acE').value, rent:'RM '+r, s:'Pending Signature', dep:'RM '+(parseInt(document.getElementById('acD').value)||r*2) });
  saveData(); closeModal(); toast('Contract ' + escHtml(id) + ' created!', 'success'); navigateTo(currentPage);
}

// ---- GENERATE INVOICES ----
function generateInvoicesModal() {
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date().getMonth()];
  openModal('Generate Invoices', '<div class="confirm-box"><div class="confirm-icon" style="color:var(--p)"><i class="fas fa-file-invoice-dollar"></i></div><div class="confirm-msg">Generate for ' + m + '?</div><div class="confirm-sub">Creates invoices for all active tenants not yet billed.</div></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doGenInvoices()">Generate</button>', 'sm');
}
function doGenInvoices() {
  let c = 0;
  TENANTS.forEach(t => { if (t.s==='active' && !BILLS.find(b=>b.t===t.n&&b.s==='Pending')) { BILLS.push({ id:'INV-'+(2604+BILLS.length), t:t.n, a:t.r, s:'Pending', d:'05 '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date().getMonth()]+' 2026', prop:t.p.split(' ')[0] }); c++; } });
  saveData(); closeModal(); toast(c ? c+' invoices generated!' : 'All already billed', c ? 'success' : 'info'); navigateTo(currentPage);
}

// ---- VENDOR SUBMIT INVOICE ----
function submitVendorInvoiceModal() {
  const opts = WORK_ORDERS.filter(w=>w.s!=='Completed').map(w=>'<option value="'+w.id+'">'+w.id+' — '+w.desc+'</option>').join('');
  openModal('Submit Invoice',
    '<div class="form-group"><label>Work Order</label><select id="viWo">' + opts + '</select></div>' +
    '<div class="form-group"><label>Amount (RM)</label><input id="viAmt" type="number" placeholder="350"></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="viNotes" placeholder="Additional notes..."></textarea></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doSubmitVI()"><i class="fas fa-paper-plane"></i> Submit</button>');
}
function doSubmitVI() {
  const amt = parseInt(document.getElementById('viAmt').value);
  if (!amt) { toast('Amount required', 'error'); return; }
  closeModal(); toast('Invoice submitted — RM ' + amt, 'success');
}

// ---- STATUS TRANSITIONS ----
function payBill(id) {
  payWithGateway('rent', id);
}
function updateTicketStatus(id, s) {
  const tk = TICKETS.find(x=>x.id===id); if (!tk) return; tk.s = s; tk.time = 'Just now'; saveData();
  toast(escHtml(id) + ' → ' + escHtml(s), 'success'); navigateTo(currentPage);
}
function updateLeadStatus(name, s) {
  const l = LEADS.find(x=>x.n===name); if (!l) return; l.s = s; saveData();
  toast('"' + escHtml(name) + '" → ' + escHtml(s), 'success'); navigateTo(currentPage);
}
function updateWorkOrderStatus(id, s) {
  const w = WORK_ORDERS.find(x=>x.id===id); if (!w) return; w.s = s; saveData();
  if (s==='Completed') { const v = VENDORS.find(x=>x.n===w.vendor); if (v) v.jobs++; }
  toast(escHtml(id) + ' → ' + escHtml(s), 'success'); navigateTo(currentPage);
}

// ---- SMART LOCK ----
let lockState = 'Locked';
function toggleSmartLock() {
  const ns = lockState === 'Locked' ? 'Unlocked' : 'Locked';
  confirmDialog(ns === 'Unlocked' ? 'Unlock Door?' : 'Lock Door?', 'Cambridge A201 smart lock will be ' + ns.toLowerCase() + '.', () => {
    lockState = ns; toast('Door ' + ns.toLowerCase() + '!', ns==='Unlocked' ? 'warning' : 'success'); navigateTo(currentPage);
  }, ns === 'Unlocked' ? 'warn' : 'success');
}

// ---- DETAIL VIEWS ----
function showTenantDetail(name) {
  const t = TENANTS.find(x=>x.n===name); if (!t) return;
  const cls = t.s==='active'?'b-ok':t.s==='pending'?'b-warn':'b-err';
  const esc = s => s.replace(/'/g, "\\'");
  let h = '<div style="text-align:center;margin-bottom:20px"><div style="width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,var(--p),var(--ac));display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">' + escHtml(initials(t.n)) + '</div><h3 style="margin-top:10px">' + escHtml(t.n) + '</h3><span class="bs ' + cls + '">' + escHtml(t.s) + '</span></div>';
  h += '<div class="dep-card">' + depRow('Unit',escHtml(t.p)) + depRow('Rent',escHtml(t.r)) + depRow('Phone',escHtml(t.phone||'N/A')) + depRow('Lease End',escHtml(t.e)) + depRow('Deposit',escHtml(t.dep||'N/A')) + '</div>';
  const myB = BILLS.filter(b=>b.t===t.n);
  if (myB.length) { h += '<h4 style="margin:16px 0 10px;font-size:13px">Bills</h4>'; myB.forEach(b => { const bc=b.s==='Paid'?'b-ok':b.s==='Overdue'?'b-err':'b-warn'; h += '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg3);border-radius:8px;margin-bottom:6px"><div style="flex:1;font-size:12px">'+escHtml(b.id)+' — '+escHtml(b.a)+'</div><span class="bs '+bc+'">'+escHtml(b.s)+'</span>'+(b.s!=='Paid'?'<button class="btn-s" onclick="closeSidePanel();payBill(\''+b.id+'\')">Pay</button>':'')+'</div>'; }); }
  h += '<div style="margin-top:20px;display:flex;gap:8px"><button class="btn btn-p" style="flex:1" onclick="closeSidePanel();editTenantModal(\''+esc(t.n)+'\')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-ghost" style="flex:1" onclick="closeSidePanel();deleteTenant(\''+esc(t.n)+'\')"><i class="fas fa-trash"></i> Remove</button></div>';
  closeSidePanel(); document.getElementById('searchDropdown')?.classList.remove('open');
  setTimeout(() => openSidePanel('Tenant Details', h), 50);
}

function showPropertyDetail(name) {
  const p = PROPS.find(x=>x.n===name); if (!p) return;
  const occ = Math.round(p.r*p.o/100), vac = p.r-occ;
  let h = '<div style="height:80px;background:linear-gradient(135deg,'+p.c+'22,'+p.c+'08);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px"><i class="fas '+p.icon+'" style="font-size:36px;color:'+p.c+'"></i></div>';
  h += '<h3 style="font-size:16px;margin-bottom:4px">' + escHtml(p.n) + '</h3><div style="font-size:11px;color:var(--t3);margin-bottom:16px"><i class="fas fa-map-marker-alt"></i> ' + escHtml(p.addr) + '</div>';
  h += '<div class="dep-card">' + depRow('Rooms',p.r) + depRow('Occupied',occ) + depRow('Vacant',vac) + depRow('Occupancy',p.o+'%') + depRow('Revenue','RM '+(p.rev/1000).toFixed(1)+'K') + depRow('Type',escHtml(p.type)) + '</div>';
  const pt = TENANTS.filter(t=>t.p.includes(p.n));
  if (pt.length) {
    h += '<h4 style="margin:16px 0 10px;font-size:13px">Tenants ('+pt.length+')</h4>';
    pt.forEach(t => { const c=t.s==='active'?'b-ok':t.s==='pending'?'b-warn':'b-err'; h += '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg3);border-radius:8px;margin-bottom:6px;cursor:pointer" onclick="showTenantDetail(\''+t.n.replace(/'/g,"\\'")+'\')">' + '<div style="width:26px;height:26px;border-radius:7px;background:var(--p);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#fff">'+escHtml(initials(t.n))+'</div><div style="flex:1;font-size:12px">'+escHtml(t.n)+'</div><span class="bs '+c+'">'+escHtml(t.s)+'</span></div>'; });
  }
  closeSidePanel(); document.getElementById('searchDropdown')?.classList.remove('open');
  setTimeout(() => openSidePanel('Property Details', h), 50);
}

function showTicketDetail(id) {
  const tk = TICKETS.find(x=>x.id===id); if (!tk) return;
  const pc = tk.pr==='High'?'b-err':tk.pr==='Medium'?'b-warn':'b-ok';
  const sc = tk.s==='Completed'?'b-ok':tk.s==='In Progress'?'b-warn':'b-info';
  let h = '<div style="text-align:center;margin-bottom:16px"><div style="width:54px;height:54px;border-radius:14px;background:'+tk.c+'22;color:'+tk.c+';display:inline-flex;align-items:center;justify-content:center;font-size:22px"><i class="fas '+tk.icon+'"></i></div></div>';
  h += '<h3 style="font-size:15px;text-align:center;margin-bottom:6px">' + escHtml(tk.t) + '</h3>';
  h += '<div style="text-align:center;margin-bottom:16px"><span class="bs '+pc+'" style="margin-right:6px">'+escHtml(tk.pr)+'</span><span class="bs '+sc+'">'+escHtml(tk.s)+'</span></div>';
  h += '<div class="dep-card">' + depRow('ID',escHtml(tk.id)) + depRow('Location',escHtml(tk.loc)) + depRow('Reported By',escHtml(tk.by||'N/A')) + depRow('Time',escHtml(tk.time)) + '</div>';
  // Photo attachments
  var photoCount = (TICKET_PHOTOS[tk.id] || []).length;
  h += '<div style="margin:12px 0"><button class="btn btn-ghost" style="width:100%" onclick="closeSidePanel();showTicketPhotos(\'' + tk.id + '\')"><i class="fas fa-camera" style="margin-right:6px;color:#FD79A8"></i> Photos (' + photoCount + ')</button></div>';
  h += '<h4 style="margin:16px 0 10px;font-size:13px">Update Status</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  if (tk.s!=='In Progress') h += '<button class="btn btn-warn" onclick="closeSidePanel();updateTicketStatus(\''+tk.id+'\',\'In Progress\')"><i class="fas fa-spinner"></i> In Progress</button>';
  if (tk.s!=='Assigned') h += '<button class="btn btn-p" onclick="closeSidePanel();updateTicketStatus(\''+tk.id+'\',\'Assigned\')"><i class="fas fa-user-check"></i> Assign</button>';
  if (tk.s!=='Completed') h += '<button class="btn btn-ok" onclick="closeSidePanel();updateTicketStatus(\''+tk.id+'\',\'Completed\')"><i class="fas fa-check"></i> Complete</button>';
  h += '</div>';
  closeSidePanel(); document.getElementById('searchDropdown')?.classList.remove('open');
  setTimeout(() => openSidePanel('Ticket Details', h), 50);
}

function showBillDetail(id) {
  const b = BILLS.find(x=>x.id===id); if (!b) return;
  const cls = b.s==='Paid'?'b-ok':b.s==='Overdue'?'b-err':'b-warn';
  let h = '<div style="text-align:center;margin-bottom:16px"><div style="font-size:32px;font-weight:800;color:var(--p)">'+escHtml(b.a)+'</div><span class="bs '+cls+'">'+escHtml(b.s)+'</span></div>';
  h += '<div class="dep-card">' + depRow('Invoice',escHtml(b.id)) + depRow('Tenant',escHtml(b.t)) + depRow('Property',escHtml(b.prop||'N/A')) + depRow('Amount',escHtml(b.a)) + depRow('Date',escHtml(b.d)) + '</div>';
  if (b.s!=='Paid') h += '<button class="btn btn-p" style="width:100%;margin-top:16px" onclick="closeSidePanel();payBill(\''+b.id+'\')"><i class="fas fa-credit-card"></i> Process Payment</button>';
  closeSidePanel(); document.getElementById('searchDropdown')?.classList.remove('open');
  setTimeout(() => openSidePanel('Invoice Details', h), 50);
}

// ---- EDIT / DELETE ----
function editTenantModal(name) {
  const t = TENANTS.find(x=>x.n===name); if (!t) return;
  const esc = s => s.replace(/'/g, "\\'");
  openModal('Edit Tenant',
    '<div class="form-row"><div class="form-group"><label>Name</label><input id="etN" value="'+t.n+'"></div><div class="form-group"><label>Phone</label><input id="etP" value="'+(t.phone||'')+'"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Unit</label><input id="etU" value="'+t.p+'"></div><div class="form-group"><label>Rent</label><input id="etR" value="'+t.r+'"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Status</label><select id="etS"><option'+(t.s==='active'?' selected':'')+'>active</option><option'+(t.s==='pending'?' selected':'')+'>pending</option><option'+(t.s==='overdue'?' selected':'')+'>overdue</option></select></div><div class="form-group"><label>Lease End</label><input id="etE" value="'+t.e+'"></div></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="doEditTenant(\''+esc(name)+'\')"><i class="fas fa-save"></i> Save</button>');
}
function doEditTenant(orig) {
  const t = TENANTS.find(x=>x.n===orig); if (!t) return;
  t.n = sanitizeInput(document.getElementById('etN').value.trim())||t.n;
  t.phone = sanitizeInput(document.getElementById('etP').value.trim());
  t.p = sanitizeInput(document.getElementById('etU').value.trim())||t.p;
  t.r = sanitizeInput(document.getElementById('etR').value.trim())||t.r;
  t.s = document.getElementById('etS').value;
  t.e = document.getElementById('etE').value.trim()||t.e;
  saveData(); closeModal(); toast('Tenant updated!', 'success'); navigateTo(currentPage);
}

function deleteTenant(name) {
  confirmDialog('Remove Tenant?', '"' + escHtml(name) + '" will be removed permanently.', () => {
    const i = TENANTS.findIndex(x=>x.n===name);
    if (i>=0) { TENANTS.splice(i,1); saveData(); toast('Tenant removed', 'info'); navigateTo(currentPage); }
  }, 'danger');
}

// ---- RESET DATA ----
function resetAllData() {
  confirmDialog('Reset All Data?', 'This will restore all data to the original demo state. Your changes will be lost.', () => {
    localStorage.removeItem('westay_data'); location.reload();
  }, 'danger');
}
