// ============ WESTAY PLATFORM — MAIN APP CONTROLLER ============

let currentRole = null;
let currentPage = null;

// ---- PAGE ROUTER ----
const PAGE_MAP = {
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
    'documents': landlordDocuments,
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

// ---- LOGIN ----
(function initLogin() {
  const roleGrid = document.getElementById('roleGrid');
  const loginBtn = document.getElementById('loginBtn');
  let selectedRole = 'operator';

  roleGrid.addEventListener('click', function(e) {
    const btn = e.target.closest('.role-btn');
    if (!btn) return;
    roleGrid.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRole = btn.dataset.role;
  });

  loginBtn.addEventListener('click', function() {
    loginAs(selectedRole);
  });
})();

function loginAs(role) {
  currentRole = role;
  const cfg = ROLE_CONFIG[role];

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

  // Build sidebar
  buildSidebar(cfg);

  // Navigate to dashboard
  navigateTo('dashboard');
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
  if (pageId === 'dashboard' && currentRole === 'operator') {
    renderRevChart();
    renderOccBars();
  }

  // AI Insights
  if (pageId === 'ai' && currentRole === 'operator') {
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

// ---- LOGOUT ----
function logout() {
  currentRole = null;
  currentPage = null;
  document.body.className = '';
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('sidebar').innerHTML = '';
  document.getElementById('mainContent').innerHTML = '';
}

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
