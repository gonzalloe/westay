// ============ WESTAY INTERACTION ENGINE ============
// Makes every button clickable and functional

// ============ SECURITY UTILITIES ============

// ---- XSS SANITIZER: Escape HTML entities to prevent injection ----
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---- RATE LIMITER: Prevent rapid-fire actions (DDoS / abuse protection) ----
const _rateLimits = {};
function rateLimited(key, cooldownMs) {
  const now = Date.now();
  if (_rateLimits[key] && now - _rateLimits[key] < cooldownMs) return true;
  _rateLimits[key] = now;
  return false;
}

// ---- DEBOUNCE: Prevent rapid repeated calls (search, input) ----
function debounce(fn, delay) {
  let timer;
  return function() {
    const ctx = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// ---- INPUT VALIDATION: Strip dangerous patterns ----
function sanitizeInput(val) {
  if (!val) return '';
  return String(val)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

// ---- SIMPLE DATA OBFUSCATION for localStorage ----
// Note: This is basic obfuscation for a demo. In production, use proper encryption.
function obfuscate(str) {
  try { return btoa(encodeURIComponent(str)); } catch(e) { return str; }
}
function deobfuscate(str) {
  try { return decodeURIComponent(atob(str)); } catch(e) { return str; }
}

// ---- CSP VIOLATION LOGGING ----
if (typeof document !== 'undefined') {
  document.addEventListener('securitypolicyviolation', function(e) {
    console.warn('[CSP Violation]', e.violatedDirective, e.blockedURI);
  });
}

// ============ END SECURITY UTILITIES ============

// ---- API CONFIG ----
const API_BASE = '/api';
let _useAPI = true; // Will be set to false if server is unreachable (GitHub Pages fallback)
let _authToken = null; // JWT token set after login
let _currentUser = null; // Current user profile from login response

// ---- TOKEN MANAGEMENT ----
function setAuthToken(token, user, remember) {
  _authToken = token;
  _currentUser = user;
  if (remember) {
    localStorage.setItem('westay_token', token);
    localStorage.setItem('westay_user', JSON.stringify(user));
  } else {
    sessionStorage.setItem('westay_token', token);
    sessionStorage.setItem('westay_user', JSON.stringify(user));
  }
}

function getAuthToken() {
  if (_authToken) return _authToken;
  _authToken = localStorage.getItem('westay_token') || sessionStorage.getItem('westay_token');
  return _authToken;
}

function getCurrentUser() {
  if (_currentUser) return _currentUser;
  try {
    const stored = localStorage.getItem('westay_user') || sessionStorage.getItem('westay_user');
    if (stored) _currentUser = JSON.parse(stored);
  } catch(e) {}
  return _currentUser;
}

function clearAuth() {
  _authToken = null;
  _currentUser = null;
  localStorage.removeItem('westay_token');
  localStorage.removeItem('westay_user');
  sessionStorage.removeItem('westay_token');
  sessionStorage.removeItem('westay_user');
}

// ---- API HELPER (with JWT auth) ----
async function apiFetch(path, opts) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(API_BASE + path, Object.assign({ headers }, opts));

    // Handle 401 — token expired or invalid
    if (res.status === 401 && path !== '/auth/login') {
      clearAuth();
      if (typeof doLogout === 'function') doLogout();
      return null;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'HTTP ' + res.status);
    }
    return await res.json();
  } catch(e) {
    console.warn('[API] ' + path + ' failed:', e.message);
    return null;
  }
}

// ---- PERSISTENCE (API-first with localStorage fallback) ----
function saveData() {
  // Always save to localStorage as backup
  try {
    const raw = JSON.stringify({ PROPS, TENANTS, TICKETS, BILLS, VENDORS, WORK_ORDERS, LEADS, LANDLORDS, CONTRACTS, UTILITY_BILLS, CHECKINOUT_RECORDS, TICKET_PHOTOS });
    localStorage.setItem('westay_data', obfuscate(raw));
  } catch(e) {}
  // Also sync to API (fire-and-forget, non-blocking)
  if (_useAPI) {
    apiFetch('/misc/save-data', {
      method: 'POST',
      body: JSON.stringify({ PROPS, TENANTS, TICKETS, BILLS, VENDORS, WORK_ORDERS, LEADS, LANDLORDS, CONTRACTS, UTILITY_BILLS, CHECKINOUT_RECORDS, TICKET_PHOTOS })
    }).catch(function() {});
  }
}

function loadData() {
  // First try localStorage (synchronous, instant)
  try {
    const stored = localStorage.getItem('westay_data');
    if (stored) {
      let raw;
      try { raw = deobfuscate(stored); } catch(e) { raw = stored; }
      const d = JSON.parse(raw);
      if (d) {
        ['PROPS','TENANTS','TICKETS','BILLS','VENDORS','WORK_ORDERS','LEADS','LANDLORDS','CONTRACTS','UTILITY_BILLS','CHECKINOUT_RECORDS'].forEach(k => {
          if (d[k] && window[k]) { window[k].length = 0; d[k].forEach(x => window[k].push(x)); }
        });
        if (d.TICKET_PHOTOS) { Object.keys(TICKET_PHOTOS).forEach(k => delete TICKET_PHOTOS[k]); Object.assign(TICKET_PHOTOS, d.TICKET_PHOTOS); }
      }
    }
  } catch(e) {}

  // Then try API (async, will overwrite localStorage data if available)
  loadDataFromAPI();
}

async function loadDataFromAPI() {
  try {
    const d = await apiFetch('/misc/all-data');
    if (!d) { _useAPI = false; return; }
    _useAPI = true;
    // Merge all collections from server
    const arrayCollections = ['PROPS','TENANTS','TICKETS','BILLS','VENDORS','WORK_ORDERS','LEADS','LANDLORDS','CONTRACTS','UTILITY_BILLS','CHECKINOUT_RECORDS'];
    arrayCollections.forEach(k => {
      if (d[k] && window[k]) { window[k].length = 0; d[k].forEach(x => window[k].push(x)); }
    });
    // Merge TICKET_PHOTOS
    if (d.TICKET_PHOTOS) { Object.keys(TICKET_PHOTOS).forEach(k => delete TICKET_PHOTOS[k]); Object.assign(TICKET_PHOTOS, d.TICKET_PHOTOS); }
    // Merge additional data from API that frontend needs
    if (d.SMART_LOCK_REGISTRY && typeof SMART_LOCK_REGISTRY !== 'undefined') {
      SMART_LOCK_REGISTRY.length = 0; d.SMART_LOCK_REGISTRY.forEach(x => SMART_LOCK_REGISTRY.push(x));
    }
    if (d.ELECTRIC_METERS && typeof ELECTRIC_METERS !== 'undefined') {
      ELECTRIC_METERS.length = 0; d.ELECTRIC_METERS.forEach(x => ELECTRIC_METERS.push(x));
    }
    if (d.WATER_METERS && typeof WATER_METERS !== 'undefined') {
      WATER_METERS.length = 0; d.WATER_METERS.forEach(x => WATER_METERS.push(x));
    }
    if (d.IOT_LOCKS && typeof IOT_LOCKS !== 'undefined') {
      IOT_LOCKS.length = 0; d.IOT_LOCKS.forEach(x => IOT_LOCKS.push(x));
    }
    if (d.AUTOMATIONS && typeof AUTOMATIONS !== 'undefined') {
      Object.assign(AUTOMATIONS, d.AUTOMATIONS);
    }
    // NOTIFS
    if (d.NOTIFS) {
      NOTIFS.length = 0; d.NOTIFS.forEach(x => NOTIFS.push(x));
      if (typeof renderNotifPanel === 'function') renderNotifPanel();
    }
    // Re-render current page with fresh data
    if (typeof navigateTo === 'function' && typeof currentPage !== 'undefined') {
      navigateTo(currentPage);
    }
    console.log('[API] Data loaded from server');
  } catch(e) {
    _useAPI = false;
    console.warn('[API] Server not available, using localStorage only');
  }
}

loadData();

// ---- TOAST SYSTEM ----
(function() {
  const c = document.createElement('div'); c.className = 'toast-container'; c.id = 'toastContainer'; document.body.appendChild(c);
})();
function toast(msg, type) {
  if (rateLimited('toast', 500)) return; // Prevent toast spam
  type = type || 'success';
  const icons = { success:'fa-check-circle', error:'fa-times-circle', info:'fa-info-circle', warning:'fa-exclamation-triangle' };
  const el = document.createElement('div'); el.className = 'toast ' + type;
  el.innerHTML = '<i class="fas ' + (icons[type]||'fa-info-circle') + '"></i><span>' + escHtml(msg) + '</span>';
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.classList.add('show'), 30);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3500);
  el.onclick = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); };
}

// ---- MODAL SYSTEM ----
let modalOverlay;
(function() {
  modalOverlay = document.createElement('div'); modalOverlay.className = 'modal-overlay'; modalOverlay.id = 'modalOverlay';
  modalOverlay.innerHTML = '<div class="modal" id="modalBox"></div>';
  document.body.appendChild(modalOverlay);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
})();
function openModal(title, bodyHtml, footerHtml, size) {
  const box = document.getElementById('modalBox');
  box.className = 'modal' + (size ? ' modal-' + size : '');
  box.innerHTML = '<div class="modal-hdr"><h3>' + title + '</h3><div class="modal-x" onclick="closeModal()"><i class="fas fa-times"></i></div></div>' +
    '<div class="modal-body">' + bodyHtml + '</div>' + (footerHtml ? '<div class="modal-footer">' + footerHtml + '</div>' : '');
  modalOverlay.classList.add('open');
}
function closeModal() { modalOverlay.classList.remove('open'); }
function confirmDialog(title, msg, onConfirm, type) {
  type = type || 'warn';
  const C = { warn:'var(--warn)', danger:'var(--err)', info:'var(--p)', success:'var(--ok)' };
  const I = { warn:'fa-exclamation-triangle', danger:'fa-trash-alt', info:'fa-question-circle', success:'fa-check-circle' };
  openModal(title, '<div class="confirm-box"><div class="confirm-icon" style="color:' + C[type] + '"><i class="fas ' + I[type] + '"></i></div><div class="confirm-msg">' + title + '</div><div class="confirm-sub">' + msg + '</div></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-p" id="confirmOk">Confirm</button>', 'sm');
  document.getElementById('confirmOk').onclick = () => { closeModal(); onConfirm(); };
}

// ---- SIDE PANEL ----
(function() {
  const ov = document.createElement('div'); ov.className = 'side-panel-overlay'; ov.id = 'sidePanelOverlay'; document.body.appendChild(ov);
  const sp = document.createElement('div'); sp.className = 'side-panel'; sp.id = 'sidePanel'; document.body.appendChild(sp);
  ov.onclick = closeSidePanel;
})();
function openSidePanel(title, bodyHtml) {
  const sp = document.getElementById('sidePanel');
  sp.innerHTML = '<div class="side-panel-hdr"><h3>' + title + '</h3><div class="modal-x" onclick="closeSidePanel()"><i class="fas fa-times"></i></div></div><div class="side-panel-body">' + bodyHtml + '</div>';
  sp.classList.add('open'); document.getElementById('sidePanelOverlay').classList.add('open');
}
function closeSidePanel() {
  document.getElementById('sidePanel').classList.remove('open');
  document.getElementById('sidePanelOverlay').classList.remove('open');
}

// ---- NOTIFICATION PANEL ----
const NOTIFS = [
  { id:1, icon:'fa-credit-card', c:'#00B894', title:'Payment Received', desc:'Sarah Lim paid RM 280 for April rent', time:'35 min ago', read:false },
  { id:2, icon:'fa-wrench', c:'#E17055', title:'New Ticket: High Priority', desc:'Water heater not working — Cambridge R203', time:'40 min ago', read:false },
  { id:3, icon:'fa-file-signature', c:'#6C5CE7', title:'Contract Signed', desc:'Ahmad Rizal signed lease agreement', time:'2h ago', read:false },
  { id:4, icon:'fa-user-plus', c:'#FD79A8', title:'New Lead', desc:'Daniel Tan via Website — interested in Cambridge', time:'5h ago', read:true },
  { id:5, icon:'fa-tools', c:'#FDCB6E', title:'Vendor Assigned', desc:'QuickFix Plumbing assigned to WO-101', time:'5h ago', read:true }
];
(function() {
  const p = document.createElement('div'); p.className = 'notif-panel'; p.id = 'notifPanel'; document.body.appendChild(p); renderNotifPanel();
})();
function renderNotifPanel() {
  const panel = document.getElementById('notifPanel');
  const unread = NOTIFS.filter(n => !n.read).length;
  let h = '<div class="notif-panel-h"><h4>Notifications' + (unread ? ' <span style="font-size:11px;color:var(--p)">(' + unread + ')</span>' : '') + '</h4><button class="btn-s" onclick="markAllRead()">Mark all read</button></div><div class="notif-list">';
  NOTIFS.forEach(n => {
    h += '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="readNotif(' + n.id + ')"><div class="notif-ic" style="background:' + n.c + '22;color:' + n.c + '"><i class="fas ' + n.icon + '"></i></div><div class="notif-body"><div class="n-title">' + n.title + '</div><div class="n-desc">' + n.desc + '</div><div class="n-time">' + n.time + '</div></div></div>';
  });
  panel.innerHTML = h + '</div>';
  const dot = document.querySelector('.notif-dot'); if (dot) dot.style.display = unread ? 'block' : 'none';
}
function toggleNotifPanel() { document.getElementById('notifPanel').classList.toggle('open'); }
function readNotif(id) { const n = NOTIFS.find(x => x.id === id); if (n) n.read = true; renderNotifPanel(); }
function markAllRead() { NOTIFS.forEach(n => n.read = true); renderNotifPanel(); toast('All notifications marked as read', 'info'); }
function pushNotif(icon, c, title, desc) {
  NOTIFS.unshift({ id: Date.now(), icon, c, title, desc, time: 'Just now', read: false });
  renderNotifPanel();
}

// ---- SEARCH (with debounce + XSS protection + rate limiting) ----
(function() {
  const dd = document.createElement('div'); dd.className = 'search-dropdown'; dd.id = 'searchDropdown'; document.body.appendChild(dd);
})();
const _doSearchImpl = function(q) {
  const dd = document.getElementById('searchDropdown');
  q = sanitizeInput(q).toLowerCase().trim();
  if (!q || q.length > 100) { dd.classList.remove('open'); return; } // max query length
  if (rateLimited('search', 150)) return; // Rate limit: 150ms between searches
  let h = '';
  const esc = s => String(s).replace(/'/g, "\\'");
  TENANTS.filter(t => t.n.toLowerCase().includes(q) || t.p.toLowerCase().includes(q)).forEach((t, i) => {
    if (!i) h += '<div class="search-cat">Tenants</div>';
    h += '<div class="search-item" onclick="showTenantDetail(\'' + esc(t.n) + '\')"><div class="s-ic" style="background:var(--ac);color:#fff">' + escHtml(initials(t.n)) + '</div><div><div class="s-title">' + escHtml(t.n) + '</div><div class="s-sub">' + escHtml(t.p) + '</div></div></div>';
  });
  PROPS.filter(p => p.n.toLowerCase().includes(q)).forEach((p, i) => {
    if (!i) h += '<div class="search-cat">Properties</div>';
    h += '<div class="search-item" onclick="showPropertyDetail(\'' + esc(p.n) + '\')"><div class="s-ic" style="background:' + p.c + '22;color:' + p.c + '"><i class="fas ' + p.icon + '"></i></div><div><div class="s-title">' + escHtml(p.n) + '</div><div class="s-sub">' + escHtml(p.addr) + '</div></div></div>';
  });
  TICKETS.filter(t => t.t.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)).forEach((t, i) => {
    if (!i) h += '<div class="search-cat">Tickets</div>';
    h += '<div class="search-item" onclick="showTicketDetail(\'' + t.id + '\')"><div class="s-ic" style="background:' + t.c + '22;color:' + t.c + '"><i class="fas ' + t.icon + '"></i></div><div><div class="s-title">' + escHtml(t.t) + '</div><div class="s-sub">' + escHtml(t.loc) + '</div></div></div>';
  });
  BILLS.filter(b => b.t.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)).forEach((b, i) => {
    if (!i) h += '<div class="search-cat">Bills</div>';
    h += '<div class="search-item" onclick="showBillDetail(\'' + b.id + '\')"><div class="s-ic" style="background:var(--p);color:#fff"><i class="fas fa-receipt"></i></div><div><div class="s-title">' + escHtml(b.id) + ' — ' + escHtml(b.t) + '</div><div class="s-sub">' + escHtml(b.a) + ' • ' + escHtml(b.s) + '</div></div></div>';
  });
  if (!h) h = '<div style="padding:20px;text-align:center;color:var(--t3);font-size:12px">No results for "' + escHtml(q) + '"</div>';
  dd.innerHTML = h; dd.classList.add('open');
};
const doSearch = debounce(_doSearchImpl, 200); // 200ms debounce on search

// ---- FILTER ----
let activeFilters = {};
function showFilterModal(entity) {
  let b = '';
  if (entity === 'tenants') b = '<div class="form-group"><label>Status</label><select id="fStatus"><option value="">All</option><option value="active">Active</option><option value="pending">Pending</option><option value="overdue">Overdue</option></select></div><div class="form-group"><label>Property</label><select id="fProp"><option value="">All</option>' + PROPS.map(p => '<option value="' + p.n + '">' + p.n + '</option>').join('') + '</select></div>';
  else if (entity === 'bills') b = '<div class="form-group"><label>Status</label><select id="fStatus"><option value="">All</option><option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Overdue">Overdue</option></select></div>';
  else if (entity === 'tickets') b = '<div class="form-group"><label>Priority</label><select id="fPriority"><option value="">All</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div><div class="form-group"><label>Status</label><select id="fStatus"><option value="">All</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Assigned">Assigned</option><option value="Completed">Completed</option></select></div>';
  openModal('Filter ' + entity.charAt(0).toUpperCase() + entity.slice(1), b,
    '<button class="btn btn-ghost" onclick="closeModal();activeFilters={};navigateTo(currentPage)">Clear</button><button class="btn btn-p" onclick="applyFilter(\'' + entity + '\')">Apply</button>', 'sm');
}
function applyFilter(entity) {
  activeFilters = {};
  ['fStatus','fProp','fPriority'].forEach(id => { const el = document.getElementById(id); if (el && el.value) activeFilters[id.replace('f','')] = el.value; });
  closeModal(); navigateTo(currentPage);
  if (Object.keys(activeFilters).length) toast('Filter applied', 'info');
}

// ---- EXPORT CSV ----
function exportCSV(headers, rows, filename) {
  let csv = headers.join(',') + '\n';
  rows.forEach(r => csv += r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',') + '\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = filename; a.click();
  toast('Exported ' + rows.length + ' records', 'success');
}
function exportTenants() { exportCSV(['Name','Unit','Rent','Status','Lease End','Phone'], TENANTS.map(t => [t.n,t.p,t.r,t.s,t.e,t.phone||'']), 'westay-tenants.csv'); }
function exportBills() { exportCSV(['Invoice','Tenant','Amount','Status','Date'], BILLS.map(b => [b.id,b.t,b.a,b.s,b.d]), 'westay-invoices.csv'); }
function exportTickets() { exportCSV(['ID','Issue','Location','Priority','Status'], TICKETS.map(t => [t.id,t.t,t.loc,t.pr,t.s]), 'westay-tickets.csv'); }
function exportLeads() { exportCSV(['Name','Phone','Source','Property','Budget','Status'], LEADS.map(l => [l.n,l.phone,l.src,l.prop,l.budget,l.s]), 'westay-leads.csv'); }
