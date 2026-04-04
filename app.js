// ============ WESTAY PLATFORM — MAIN APP CONTROLLER ============

let currentRole = null;
let currentPage = null;

// ---- PAGE ROUTER ----
const PAGE_MAP = {
  admin: {
    'dashboard': operatorDashboard,
    'properties': operatorProperties,
    'tenants': operatorTenants,
    'landlords': operatorLandlords,
    'contracts': operatorContracts,
    'billing': operatorBilling,
    'maintenance': operatorMaintenance,
    'vendors': operatorVendors,
    'iot': operatorIoT,
    'leads': operatorLeads,
    'community': operatorCommunity,
    'ai': operatorAI,
    'reports': operatorReports,
    'settings': adminSettings,
    'users': adminUsers,
    'audit': adminAudit
  },
  operator: {
    'dashboard': operatorDashboard,
    'properties': operatorProperties,
    'tenants': operatorTenants,
    'landlords': operatorLandlords,
    'contracts': operatorContracts,
    'billing': operatorBilling,
    'maintenance': operatorMaintenance,
    'vendors': operatorVendors,
    'iot': operatorIoT,
    'leads': operatorLeads,
    'community': operatorCommunity,
    'ai': operatorAI,
    'reports': operatorReports,
    'settings': operatorSettings
  },
  tenant: {
    'dashboard': tenantDashboard,
    'my-unit': tenantMyUnit,
    'my-bills': tenantMyBills,
    'my-contract': tenantMyContract,
    'maintenance': tenantMaintenance,
    'smart-access': tenantSmartAccess,
    'utilities': tenantUtilities,
    'community': tenantCommunity,
    'events': tenantEvents,
    'marketplace': tenantMarketplace
  },
  landlord: {
    'dashboard': landlordDashboard,
    'my-properties': landlordMyProperties,
    'financials': landlordFinancials,
    'tenancy-overview': landlordTenancyOverview,
    'maintenance-log': landlordMaintenanceLog,
    'payouts': landlordPayouts,
    'reports': landlordReports
  },
  vendor: {
    'dashboard': vendorDashboard,
    'work-orders': vendorWorkOrders,
    'schedule': vendorSchedule,
    'invoices': vendorInvoices,
    'payments': vendorPayments,
    'profile': vendorProfile,
    'ratings': vendorRatings
  },
  agent: {
    'dashboard': agentDashboard,
    'leads': agentLeadsPage,
    'listings': agentListings,
    'viewings': agentViewings,
    'applications': agentApplications,
    'commission': agentCommission,
    'contacts': agentContacts,
    'performance': agentPerformance
  }
};

// ---- LOGIN (JWT Auth) ----
(function initLogin() {
  const loginBtn = document.getElementById('loginBtn');
  const passInput = document.getElementById('loginPass');

  // Auto-login if token is still valid
  const token = getAuthToken();
  const user = getCurrentUser();
  if (token && user) {
    if (token.startsWith('demo_')) {
      // Demo mode token — skip API verification, login directly
      _useAPI = false;
      _currentUser = user;
      loginAs(user.role);
    } else {
      // Real JWT — verify with backend
      apiFetch('/auth/me').then(function(me) {
        if (me) {
          _currentUser = me;
          loginAs(me.role);
        } else {
          clearAuth();
        }
      });
    }
  }

  loginBtn.addEventListener('click', doLogin);
  passInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  // Auto-fill password when switching demo accounts (convenience for testing)
  const usernameInput = document.getElementById('loginUsername');
  usernameInput.addEventListener('change', function() {
    const errDiv = document.getElementById('loginError');
    errDiv.style.display = 'none';
    const demo = DEMO_ACCOUNTS[this.value.trim().toLowerCase()];
    if (demo) {
      passInput.value = demo.password;
    } else {
      passInput.value = '';
    }
  });

  // Demo credentials for offline/GitHub Pages fallback (no backend)
  const DEMO_ACCOUNTS = {
    admin:    { password: 'admin123456', role: 'admin', name: 'System Admin', email: 'admin@westay.my' },
    operator: { password: 'op123456', role: 'operator', name: 'Site Operator', email: 'operator@westay.my' },
    sarah:    { password: 'tenant123', role: 'tenant', name: 'Sarah Lim', email: 'sarah@email.com' },
    landlord: { password: 'landlord123', role: 'landlord', name: 'Tan Sri Ahmad', email: 'tansri@email.com' },
    vendor:   { password: 'vendor123', role: 'vendor', name: 'QuickFix Plumbing', email: 'admin@quickfix.my' },
    agent:    { password: 'agent123', role: 'agent', name: 'Marcus Tan', email: 'marcus@realty.my' }
  };

  async function doLogin() {
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPass').value;
    const remember = document.getElementById('rememberMe').checked;
    const errDiv = document.getElementById('loginError');

    if (!username || !password) {
      errDiv.querySelector('span').textContent = 'Please enter username and password';
      errDiv.style.display = 'block';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    // Try backend API first — capture error details
    let apiError = null;
    let result = null;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = getAuthToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '/api') + '/auth/login', {
        method: 'POST', headers, body: JSON.stringify({ username, password })
      });
      // Check if response is JSON (from our API) vs HTML (from GitHub Pages / CDN)
      const ct = (res.headers.get('content-type') || '');
      const isJSON = ct.indexOf('application/json') !== -1;
      if (res.ok && isJSON) {
        result = await res.json();
      } else if (!res.ok && isJSON) {
        // Real API rejection (our server returned JSON error) — show it
        const body = await res.json().catch(function() { return {}; });
        apiError = body.error || 'Invalid credentials';
      } else {
        // Not our API (GitHub Pages returns 405/406 with HTML) — treat as server unavailable
        apiError = null;
        result = null;
      }
    } catch(e) {
      // Server unreachable — no error, just fall through to demo
      apiError = null;
      result = null;
    }

    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:6px"></i>Sign In';

    if (result && result.token) {
      // Backend available — use real JWT
      errDiv.style.display = 'none';
      setAuthToken(result.token, result.user, remember);
      loginAs(result.user.role);
      return;
    }

    // If API explicitly rejected (wrong password) — show error immediately, do NOT fallback to demo
    if (apiError) {
      errDiv.querySelector('span').textContent = apiError;
      errDiv.style.display = 'block';
      return;
    }

    // Backend unavailable — try offline demo mode fallback
    const demo = DEMO_ACCOUNTS[username];
    if (demo && demo.password === password) {
      const demoUser = { id: 'demo-' + username, username: username, role: demo.role, name: demo.name, email: demo.email };
      const demoToken = 'demo_' + btoa(JSON.stringify(demoUser));
      errDiv.style.display = 'none';
      _useAPI = false; // Switch to localStorage-only mode
      setAuthToken(demoToken, demoUser, remember);
      loginAs(demo.role);
      return;
    }

    // Both failed — show error
    errDiv.querySelector('span').textContent = 'Login failed. Check your username and password.';
    errDiv.style.display = 'block';
  }
})();

// ---- FORGOT PASSWORD ----
function showForgotPassword() {
  var html = '<div style="text-align:center;padding:20px">' +
    '<div style="width:56px;height:56px;border-radius:50%;background:var(--p)22;color:var(--p);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 14px"><i class="fas fa-lock"></i></div>' +
    '<h3 style="margin-bottom:4px">Reset Password</h3>' +
    '<p style="font-size:12px;color:var(--t3);margin-bottom:18px">Enter your username and registered email to reset your password</p>' +
    '<div id="fpError" style="display:none;color:#E17055;background:#fff5f5;padding:8px 12px;border-radius:8px;margin-bottom:12px;font-size:12px;border:1px solid #fecdd2"><i class="fas fa-exclamation-circle"></i> <span></span></div>' +
    '<div id="fpSuccess" style="display:none;color:#00B894;background:#f0fff4;padding:12px;border-radius:8px;margin-bottom:12px;font-size:12px;border:1px solid #c6f6d5"></div>' +
    '<div style="text-align:left;margin-bottom:12px">' +
    '<label style="font-size:12px;font-weight:600;color:var(--t2)">Username</label>' +
    '<input type="text" id="fpUsername" placeholder="e.g. sarah" style="width:100%;padding:10px 12px;border:1px solid var(--bd);border-radius:8px;margin-top:4px;font-size:13px;box-sizing:border-box">' +
    '</div>' +
    '<div style="text-align:left;margin-bottom:18px">' +
    '<label style="font-size:12px;font-weight:600;color:var(--t2)">Registered Email</label>' +
    '<input type="email" id="fpEmail" placeholder="e.g. sarah@westay.my" style="width:100%;padding:10px 12px;border:1px solid var(--bd);border-radius:8px;margin-top:4px;font-size:13px;box-sizing:border-box">' +
    '</div>' +
    '<button onclick="resetPassword()" id="fpBtn" style="width:100%;padding:12px;background:var(--p);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer"><i class="fas fa-paper-plane" style="margin-right:6px"></i>Reset Password</button>' +
    '<div style="margin-top:14px;font-size:11px;color:var(--t3)"><strong>Demo accounts:</strong> sarah@westay.my, operator@westay.my, admin@westay.my</div>' +
    '</div>';
  openModal('Forgot Password', html, '420px');
}

async function resetPassword() {
  var username = document.getElementById('fpUsername').value.trim();
  var email = document.getElementById('fpEmail').value.trim();
  var errDiv = document.getElementById('fpError');
  var successDiv = document.getElementById('fpSuccess');
  var btn = document.getElementById('fpBtn');

  errDiv.style.display = 'none';
  successDiv.style.display = 'none';

  if (!username || !email) {
    errDiv.querySelector('span').textContent = 'Please enter both username and email';
    errDiv.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

  try {
    var res = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '/api') + '/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, email: email })
    });
    var data = await res.json();

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:6px"></i>Reset Password';

    if (res.ok && data.success) {
      successDiv.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Password Reset Successful!</strong><br><br>' +
        'Your new temporary password is:<br>' +
        '<code style="display:inline-block;background:#1a1a2e;color:#00B894;padding:8px 16px;border-radius:6px;font-size:16px;font-weight:bold;margin:8px 0;letter-spacing:1px">' + escHtml(data.temp_password) + '</code><br><br>' +
        '<span style="color:var(--t3)">Please log in and change your password from Settings.</span>';
      successDiv.style.display = 'block';

      // Pre-fill login form
      document.getElementById('loginUsername').value = username;
      document.getElementById('loginPass').value = data.temp_password;
    } else {
      errDiv.querySelector('span').textContent = data.error || 'Reset failed';
      errDiv.style.display = 'block';
    }
  } catch(e) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:6px"></i>Reset Password';
    errDiv.querySelector('span').textContent = 'Server unavailable. Password reset requires the backend server.';
    errDiv.style.display = 'block';
  }
}

function loginAs(role) {
  currentRole = role;
  const cfg = ROLE_CONFIG[role];
  const user = getCurrentUser();

  // Hide login, show app
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  // Set body class for theming
  document.body.className = 'role-' + role;

  // Set role tag
  const roleTag = document.getElementById('roleTag');
  roleTag.textContent = cfg.label;
  roleTag.style.background = cfg.bg;
  roleTag.style.color = cfg.color;

  // Override user info from JWT if available
  if (user) {
    cfg.user.name = user.name || cfg.user.name;
    cfg.user.initials = (user.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || cfg.user.initials;
  }

  // Build sidebar
  buildSidebar(cfg);

  // Navigate to dashboard
  navigateTo('dashboard');

  // Handle Stripe payment return URL
  _handlePaymentReturn();
}

function buildSidebar(cfg) {
  const sidebar = document.getElementById('sidebar');
  let html = '<div class="sb-brand"><div class="sb-logo">W</div><div><h2>WeStay</h2><small>' + cfg.label + ' Portal</small></div></div>';
  html += '<div class="sb-nav">';

  cfg.nav.forEach(section => {
    html += '<div class="sb-sec"><div class="sb-sec-t">' + section.section + '</div>';
    section.items.forEach(item => {
      html += '<div class="nav-i' + (item.id === 'dashboard' ? ' active' : '') + '" data-page="' + item.id + '">' +
        '<i class="fas ' + item.icon + '"></i> ' + item.label +
        (item.badge ? '<span class="badge">' + item.badge + '</span>' : '') + '</div>';
    });
    html += '</div>';
  });

  html += '</div>';
  html += '<div class="sb-footer"><div class="u-card"><div class="u-av">' + cfg.user.initials + '</div>' +
    '<div><div class="u-name">' + cfg.user.name + '</div><div class="u-role">' + cfg.label + '</div>' +
    '<div class="u-logout" id="logoutBtn">Sign Out</div></div></div></div>';

  sidebar.innerHTML = html;

  // Nav click handlers
  sidebar.querySelectorAll('.nav-i[data-page]').forEach(item => {
    item.addEventListener('click', function() {
      sidebar.querySelectorAll('.nav-i').forEach(n => n.classList.remove('active'));
      this.classList.add('active');
      navigateTo(this.dataset.page);
    });
  });

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function navigateTo(pageId) {
  currentPage = pageId;
  const main = document.getElementById('mainContent');
  const pages = PAGE_MAP[currentRole];

  if (pages && pages[pageId]) {
    main.innerHTML = '<div class="page active">' + pages[pageId]() + '</div>';
    afterRender(pageId);
  } else {
    main.innerHTML = '<div class="page active"><div class="placeholder"><i class="fas fa-hard-hat"></i><p>This page is under construction.</p></div></div>';
  }

  // Scroll to top
  main.scrollTop = 0;
}

// ---- POST-RENDER HOOKS (charts, dynamic content) ----
function afterRender(pageId) {
  // Revenue chart
  if (pageId === 'dashboard' && (currentRole === 'operator' || currentRole === 'admin')) {
    renderRevChart();
    renderOccBars();
  }

  // AI Insights
  if (pageId === 'ai' && (currentRole === 'operator' || currentRole === 'admin')) {
    renderPriceEngine();
    renderTenantScore();
    renderWorkflows();
  }

  // Community
  if (pageId === 'community' || pageId === 'events') {
    renderEvents();
    renderFeed();
  }
}

function renderRevChart() {
  const months = ['Nov','Dec','Jan','Feb','Mar','Apr'];
  const values = [62,68,71,75,78,82];
  const el = document.getElementById('revChart');
  if (!el) return;
  el.innerHTML = '';
  values.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = (v / 85 * 150) + 'px';
    bar.style.background = i === values.length - 1 ? 'linear-gradient(180deg,#6C5CE7,#00CEC9)' : '#6C5CE7';
    bar.style.opacity = i === values.length - 1 ? '1' : '0.5';
    bar.innerHTML = '<span>' + months[i] + '</span>';
    bar.title = 'RM ' + v + 'K';
    el.appendChild(bar);
  });
}

function renderOccBars() {
  const el = document.getElementById('occBars');
  if (!el) return;
  el.innerHTML = '';
  PROPS.forEach(p => {
    el.innerHTML += '<div class="occ-row"><div class="occ-name">' + escHtml(p.n) + '</div>' +
      '<div class="occ-track"><div class="occ-fill" style="width:' + p.o + '%;background:' + p.c + '"></div></div>' +
      '<div class="occ-pct" style="color:' + p.c + '">' + p.o + '%</div></div>';
  });
}

function renderPriceEngine() {
  const el = document.getElementById('priceEngine');
  if (!el) return;
  const data = [
    { room:'Imperial Single', cur:220, sug:240, reason:'Demand up 23%', dir:'up' },
    { room:'Oxford Double', cur:280, sug:260, reason:'Occupancy at 85%', dir:'down' },
    { room:'Westlake Master', cur:340, sug:360, reason:'Premium demand high', dir:'up' },
    { room:'Harvard Single', cur:190, sug:190, reason:'Market rate aligned', dir:'flat' }
  ];
  data.forEach(d => {
    const color = d.dir === 'up' ? '#00B894' : d.dir === 'down' ? '#E17055' : '#A7A5C6';
    const arrow = d.dir === 'up' ? '\u2191' : d.dir === 'down' ? '\u2193' : '\u2192';
    el.innerHTML += '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#232136;border-radius:8px;margin-bottom:8px">' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + d.room + '</div>' +
      '<div style="font-size:10px;color:#A7A5C6">' + d.reason + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:11px;color:#6B6990">RM ' + d.cur + '</div>' +
      '<div style="font-size:14px;font-weight:700;color:' + color + '">' + arrow + ' RM ' + d.sug + '</div></div></div>';
  });
}

function renderTenantScore() {
  const el = document.getElementById('tenantScore');
  if (!el) return;
  const data = [
    { n:'Sarah Lim', score:95, risk:'Low', c:'#00B894' },
    { n:'Wei Jun', score:88, risk:'Low', c:'#00B894' },
    { n:'Priya Devi', score:72, risk:'Medium', c:'#FDCB6E' },
    { n:'James Wong', score:45, risk:'High', c:'#E17055' }
  ];
  data.forEach(d => {
    el.innerHTML += '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#232136;border-radius:8px;margin-bottom:8px">' +
      '<div style="width:28px;height:28px;border-radius:7px;background:' + d.c + '22;color:' + d.c +
      ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">' + d.score + '</div>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:600">' + d.n + '</div>' +
      '<div style="font-size:10px;color:#A7A5C6">Churn risk: ' + d.risk + '</div></div>' +
      '<span class="bs" style="background:' + d.c + '22;color:' + d.c + '">' + d.risk + '</span></div>';
  });
}

function renderWorkflows() {
  const el = document.getElementById('wfList');
  if (!el) return;
  const wfs = [
    { n:'Auto-Generate Monthly Report', d:'Generates comprehensive portfolio report on 1st of month', icon:'fa-chart-bar', c:'#6C5CE7', key:'autoReport', action:'autoGenerateReport()' },
    { n:'Auto-Generate Tenancy Agreement', d:'Creates TA documents 30 days before lease expiry', icon:'fa-file-contract', c:'#00CEC9', key:'autoTA', action:'autoGenerateTA()' },
    { n:'Smart Lock Fingerprint Auto-Disable', d:'Disables fingerprint access when tenancy ends', icon:'fa-fingerprint', c:'#FD79A8', key:'smartLockExpiry', action:'showSmartLockManager()' },
    { n:'Late Payment Auto Electric Cut', d:'Cuts only overdue tenant\'s room meter (per-room). Manual cut also available.', icon:'fa-bolt', c:'#FDCB6E', key:'latePmtElectric', action:'showElectricMeterManager()' },
    { n:'Payment Reminders', d:'WhatsApp reminders for overdue payments', icon:'fa-bell', c:'#E17055', key:null, on:true },
    { n:'Move-in Onboarding', d:'Welcome email + key collection scheduling', icon:'fa-door-open', c:'#00B894', key:null, on:true }
  ];
  wfs.forEach(w => {
    const isAuto = !!w.key;
    const isOn = isAuto ? AUTOMATIONS[w.key].enabled : (w.on !== false);
    el.innerHTML += '<div class="wf">' +
      '<div class="wf-ic" style="background:' + w.c + '22;color:' + w.c + '"><i class="fas ' + w.icon + '"></i></div>' +
      '<div class="wf-info"><h5>' + w.n + '</h5><p>' + w.d + '</p></div>' +
      (isAuto ? '<button class="btn-s" style="font-size:9px;margin-right:6px" onclick="' + w.action + '"><i class="fas fa-play"></i></button>' : '') +
      '<div class="wf-toggle' + (isOn ? '' : ' off') + '"' + (isAuto ? ' onclick="toggleAutomation(\'' + w.key + '\',this)"' : '') + '></div></div>';
  });
}

function renderEvents() {
  const el = document.getElementById('eventList');
  if (!el) return;
  el.innerHTML = eventsHtml();
}

function renderFeed() {
  const el = document.getElementById('feedList');
  if (!el) return;
  el.innerHTML = feedHtml();
}

// ---- STRIPE PAYMENT RETURN HANDLER ----
function _handlePaymentReturn() {
  var params = new URLSearchParams(window.location.search);
  var billId = params.get('payment_success');
  var sessionId = params.get('session_id');
  var cancelled = params.get('payment_cancelled');

  // Clean URL (remove query params without reload)
  if (billId || cancelled) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (cancelled) {
    toast('Payment cancelled for ' + cancelled, 'info');
    return;
  }

  if (billId) {
    // Verify payment with backend if possible
    if (_useAPI && sessionId) {
      apiFetch('/payments/verify-session/' + sessionId).then(function(result) {
        if (result && result.paid) {
          // Update local state
          _updateLocalBillStatus(result.billId, result.billType);
          var methodNames = { fpx: 'FPX Online Banking', card: 'Credit/Debit Card', grabpay: 'GrabPay' };
          showPaymentReceipt(result.billType || 'rent', result.billId, result.paymentMethod || 'card', methodNames);
          toast('Payment confirmed! Bill ' + result.billId + ' is now paid.', 'success');
          pushNotif('fa-check-circle', '#00B894', 'Payment Successful', result.billId + ' paid via Stripe');
        } else if (result && !result.paid) {
          toast('Payment is still processing. We\'ll update you when confirmed.', 'info');
        } else {
          // Verification failed but payment might still be OK (webhook will handle)
          toast('Payment submitted for ' + billId + '. Verifying...', 'info');
          _updateLocalBillStatus(billId, 'rent');
        }
      });
    } else {
      // No backend or no session ID — optimistically mark as paid
      _updateLocalBillStatus(billId, 'rent');
      toast('Payment completed for ' + billId + '!', 'success');
      pushNotif('fa-check-circle', '#00B894', 'Payment Successful', billId + ' paid');
    }
  }
}

function _updateLocalBillStatus(billId, billType) {
  if (billType === 'utility') {
    var ubill = UTILITY_BILLS.find(function(b) { return b.id === billId; });
    if (ubill) ubill.status = 'Paid';
  } else {
    var bill = BILLS.find(function(b) { return b.id === billId; });
    if (bill) {
      bill.s = 'Paid';
      if (typeof payBillWithAutoReconnect === 'function') payBillWithAutoReconnect(billId);
    }
  }
  saveData();
}

// ---- LOGOUT ----
function logout() {
  clearAuth();
  currentRole = null;
  currentPage = null;
  document.body.className = '';
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('sidebar').innerHTML = '';
  document.getElementById('mainContent').innerHTML = '';
}

// Alias for auto-logout on 401
function doLogout() { logout(); }

// ---- WORKFLOW TOGGLES ----
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('wf-toggle')) {
    e.target.classList.toggle('off');
  }
  // Close search dropdown when clicking outside
  const sd = document.getElementById('searchDropdown');
  if (sd && !e.target.closest('.h-search') && !e.target.closest('.search-dropdown')) sd.classList.remove('open');
  // Close notif panel when clicking outside
  const np = document.getElementById('notifPanel');
  if (np && !e.target.closest('.notif-panel') && !e.target.closest('.h-btn')) np.classList.remove('open');
});

// ---- KEYBOARD SHORTCUTS ----
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const search = document.getElementById('globalSearch');
    if (search) search.focus();
  }
  if (e.key === 'Escape') {
    closeModal();
    closeSidePanel();
    closeMobileMenu();
    document.getElementById('searchDropdown')?.classList.remove('open');
    document.getElementById('notifPanel')?.classList.remove('open');
    document.getElementById('aiBox')?.classList.remove('open');
  }
});

// ---- QUICK ADD (+ button in header) ----
function quickAdd() {
  if (!currentRole) return;
  const opts = {
    admin: [
      { icon:'fa-building', label:'Add Property', fn:'addPropertyModal()' },
      { icon:'fa-user-plus', label:'Add Tenant', fn:'addTenantModal()' },
      { icon:'fa-wrench', label:'New Ticket', fn:'addTicketModal()' },
      { icon:'fa-file-signature', label:'New Contract', fn:'addContractModal()' },
      { icon:'fa-user-tie', label:'Add Vendor', fn:'addVendorModal()' },
      { icon:'fa-funnel-dollar', label:'Add Lead', fn:'addLeadModal()' },
      { icon:'fa-users-cog', label:'User Management', fn:'navigateTo(\\\'users\\\')' },
      { icon:'fa-robot', label:'Automation Center', fn:'showAutomationDashboard()' },
      { icon:'fa-chart-bar', label:'Generate Report', fn:'autoGenerateReport()' },
      { icon:'fa-file-contract', label:'Generate TA', fn:'autoGenerateTA()' },
      { icon:'fa-file-alt', label:'Owner Report', fn:'generateOwnerReport()' },
      { icon:'fa-bolt', label:'Utility Bills', fn:'showUtilityBillList()' },
      { icon:'fa-clipboard-check', label:'Check-In/Out', fn:'showCheckInOutList()' }
    ],
    operator: [
      { icon:'fa-building', label:'Add Property', fn:'addPropertyModal()' },
      { icon:'fa-user-plus', label:'Add Tenant', fn:'addTenantModal()' },
      { icon:'fa-wrench', label:'New Ticket', fn:'addTicketModal()' },
      { icon:'fa-file-signature', label:'New Contract', fn:'addContractModal()' },
      { icon:'fa-user-tie', label:'Add Vendor', fn:'addVendorModal()' },
      { icon:'fa-funnel-dollar', label:'Add Lead', fn:'addLeadModal()' },
      { icon:'fa-robot', label:'Automation Center', fn:'showAutomationDashboard()' },
      { icon:'fa-chart-bar', label:'Generate Report', fn:'autoGenerateReport()' },
      { icon:'fa-file-contract', label:'Generate TA', fn:'autoGenerateTA()' },
      { icon:'fa-file-alt', label:'Owner Report', fn:'generateOwnerReport()' },
      { icon:'fa-bolt', label:'Utility Bills', fn:'showUtilityBillList()' },
      { icon:'fa-clipboard-check', label:'Check-In/Out', fn:'showCheckInOutList()' }
    ],
    tenant: [
      { icon:'fa-wrench', label:'New Request', fn:'addTicketModal()' },
      { icon:'fa-credit-card', label:'Pay Rent', fn:'payMyRent()' },
      { icon:'fa-bolt', label:'Utility Bills', fn:'tenantViewUtilityBills()' },
      { icon:'fa-clipboard-check', label:'My Check-In/Out Photos', fn:'showMyCheckInOutList()' }
    ],
    landlord: [
      { icon:'fa-file-alt', label:'My Owner Report', fn:'generateOwnerReport(ROLE_CONFIG.landlord.user.name)' }
    ],
    vendor: [
      { icon:'fa-file-invoice-dollar', label:'Submit Invoice', fn:'submitVendorInvoiceModal()' }
    ],
    agent: [
      { icon:'fa-user-plus', label:'Add Lead', fn:'addLeadModal()' }
    ]
  };
  const items = opts[currentRole] || [];
  if (!items.length) { toast('No quick actions for this role', 'info'); return; }
  let body = '<div style="display:grid;gap:8px">';
  items.forEach(it => {
    body += '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--bg3);border-radius:12px;cursor:pointer;transition:.2s" onclick="closeModal();' + it.fn + '" onmouseover="this.style.background=\'var(--card)\'" onmouseout="this.style.background=\'var(--bg3)\'">' +
      '<div style="width:38px;height:38px;border-radius:10px;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center"><i class="fas ' + it.icon + '"></i></div>' +
      '<div style="font-size:13px;font-weight:600">' + it.label + '</div></div>';
  });
  body += '</div>';
  openModal('Quick Add', body, '', 'sm');
}

// ---- AI CHATBOT ----
(function() {
  const fab = document.getElementById('aiFab');
  const box = document.getElementById('aiBox');
  const close = document.getElementById('aiX');
  const input = document.getElementById('aiIn');
  const send = document.getElementById('aiSnd');
  const msgs = document.getElementById('aiMsgs');

  fab.addEventListener('click', () => box.classList.toggle('open'));
  close.addEventListener('click', () => box.classList.remove('open'));

  function addMsg(text, type) {
    const div = document.createElement('div');
    div.className = 'ai-m ' + type;
    // Escape user input first, then apply safe formatting for bot messages
    const safe = escHtml(text);
    div.innerHTML = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function getResponse(q) {
    const lower = q.toLowerCase();
    if (lower.includes('occupancy') || lower.includes('vacancy') || lower.includes('room'))
      return AI_RESPONSES.occupancy;
    if (lower.includes('revenue') || lower.includes('money') || lower.includes('income'))
      return AI_RESPONSES.revenue;
    if (lower.includes('overdue') || lower.includes('paid') || lower.includes('payment'))
      return AI_RESPONSES.overdue;
    if (lower.includes('maintenance') || lower.includes('ticket') || lower.includes('repair'))
      return AI_RESPONSES.maintenance;
    if (lower.includes('owner report') || lower.includes('landlord report') || lower.includes('property report') || lower.includes('owner monthly'))
      return AI_RESPONSES.report;
    if (lower.includes('report') || lower.includes('analytics') || lower.includes('generate report'))
      return AI_RESPONSES.report;
    if (lower.includes('contract') || lower.includes('tenancy agreement') || lower.includes('ta ') || lower.includes('lease'))
      return AI_RESPONSES.contract;
    if (lower.includes('smart lock') || lower.includes('fingerprint') || lower.includes('lock') || lower.includes('access'))
      return AI_RESPONSES.smartlock;
    if (lower.includes('electric') || lower.includes('meter') || lower.includes('power') || lower.includes('disconnect'))
      return AI_RESPONSES.electric;
    if (lower.includes('utility') || lower.includes('water bill') || lower.includes('electric bill') || lower.includes('utility bill'))
      return AI_RESPONSES.utility;
    if (lower.includes('photo') || lower.includes('picture') || lower.includes('image') || lower.includes('attach'))
      return AI_RESPONSES.photo;
    if (lower.includes('check-in') || lower.includes('check-out') || lower.includes('checkin') || lower.includes('checkout') || lower.includes('move-in') || lower.includes('move-out') || lower.includes('inspection'))
      return AI_RESPONSES.checkinout;
    if (lower.includes('automat') || lower.includes('workflow') || lower.includes('auto'))
      return AI_RESPONSES.automation;
    return AI_RESPONSES['default'];
  }

  function handleSend() {
    const q = input.value.trim();
    if (!q) return;
    if (rateLimited('aiChat', 1000)) return;
    const sanitized = sanitizeInput(q).slice(0, 500);
    addMsg(sanitized, 'user');
    input.value = '';
    const typing = addMsg('Thinking...', 'bot typing');
    setTimeout(() => {
      typing.remove();
      addMsg(getResponse(sanitized), 'bot');
    }, 800 + Math.random() * 600);
  }

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });
})();

// ---- MOBILE HAMBURGER MENU ----
function openMobileMenu() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('open');
}
function closeMobileMenu() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}
// Auto-close mobile menu when navigating
const origNavigateTo = navigateTo;
navigateTo = function(pageId) {
  closeMobileMenu();
  origNavigateTo(pageId);
};
