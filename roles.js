// ============ ROLE CONFIGURATION ============

const ROLE_CONFIG = {
  operator: {
    label: 'Operator',
    color: '#6C5CE7',
    bg: 'rgba(108,92,231,.12)',
    icon: 'fa-cogs',
    user: { name: 'Admin Operator', email: 'admin@westay.my', initials: 'AO' },
    nav: [
      { section: 'MAIN', items: [
        { id:'dashboard', icon:'fa-th-large', label:'Dashboard', badge:null },
        { id:'properties', icon:'fa-building', label:'Properties', badge:null },
        { id:'tenants', icon:'fa-users', label:'Tenants', badge:'342' },
        { id:'contracts', icon:'fa-file-contract', label:'Contracts', badge:'4' }
      ]},
      { section: 'OPERATIONS', items: [
        { id:'billing', icon:'fa-file-invoice-dollar', label:'Billing & Invoices', badge:'30' },
        { id:'maintenance', icon:'fa-wrench', label:'Maintenance', badge:'5' },
        { id:'vendors', icon:'fa-tools', label:'Vendors', badge:null },
        { id:'iot', icon:'fa-microchip', label:'IoT & Smart Locks', badge:null }
      ]},
      { section: 'GROWTH', items: [
        { id:'leads', icon:'fa-funnel-dollar', label:'Leads & CRM', badge:'5' },
        { id:'community', icon:'fa-comments', label:'Community', badge:null },
        { id:'ai', icon:'fa-brain', label:'AI Insights', badge:null }
      ]},
      { section: 'REPORTS', items: [
        { id:'reports', icon:'fa-chart-bar', label:'Reports & Analytics', badge:null },
        { id:'settings', icon:'fa-cog', label:'Settings', badge:null }
      ]}
    ]
  },
  tenant: {
    label: 'Tenant',
    color: '#00CEC9',
    bg: 'rgba(0,206,201,.12)',
    icon: 'fa-user',
    user: { name: 'Sarah Lim', email: 'sarah@email.com', initials: 'SL' },
    nav: [
      { section: 'MY HOME', items: [
        { id:'dashboard', icon:'fa-th-large', label:'My Dashboard', badge:null },
        { id:'my-unit', icon:'fa-door-open', label:'My Unit', badge:null },
        { id:'my-bills', icon:'fa-receipt', label:'My Bills', badge:'1' },
        { id:'my-contract', icon:'fa-file-contract', label:'My Contract', badge:null }
      ]},
      { section: 'SERVICES', items: [
        { id:'maintenance', icon:'fa-wrench', label:'Maintenance Request', badge:null },
        { id:'smart-access', icon:'fa-key', label:'Smart Access', badge:null },
        { id:'utilities', icon:'fa-bolt', label:'Utilities', badge:null }
      ]},
      { section: 'COMMUNITY', items: [
        { id:'community', icon:'fa-comments', label:'Community Feed', badge:'3' },
        { id:'events', icon:'fa-calendar-alt', label:'Events', badge:'2' },
        { id:'marketplace', icon:'fa-store', label:'Marketplace', badge:null }
      ]}
    ]
  },
  landlord: {
    label: 'Landlord',
    color: '#FD79A8',
    bg: 'rgba(253,121,168,.12)',
    icon: 'fa-home',
    user: { name: 'Tan Sri Ahmad', email: 'tansri@email.com', initials: 'TA' },
    nav: [
      { section: 'OVERVIEW', items: [
        { id:'dashboard', icon:'fa-th-large', label:'Portfolio Dashboard', badge:null },
        { id:'my-properties', icon:'fa-building', label:'My Properties', badge:null },
        { id:'financials', icon:'fa-chart-line', label:'Financials', badge:null }
      ]},
      { section: 'DETAILS', items: [
        { id:'tenancy-overview', icon:'fa-users', label:'Tenancy Overview', badge:null },
        { id:'maintenance-log', icon:'fa-wrench', label:'Maintenance Log', badge:'3' },
        { id:'payouts', icon:'fa-money-bill-wave', label:'Payouts', badge:null }
      ]},
      { section: 'OTHER', items: [
        { id:'documents', icon:'fa-folder-open', label:'Documents', badge:null },
        { id:'reports', icon:'fa-chart-bar', label:'Reports', badge:null }
      ]}
    ]
  },
  vendor: {
    label: 'Vendor',
    color: '#00B894',
    bg: 'rgba(0,184,148,.12)',
    icon: 'fa-tools',
    user: { name: 'QuickFix Plumbing', email: 'admin@quickfix.my', initials: 'QF' },
    nav: [
      { section: 'WORK', items: [
        { id:'dashboard', icon:'fa-th-large', label:'Dashboard', badge:null },
        { id:'work-orders', icon:'fa-clipboard-list', label:'Work Orders', badge:'3' },
        { id:'schedule', icon:'fa-calendar-check', label:'Schedule', badge:null }
      ]},
      { section: 'FINANCE', items: [
        { id:'invoices', icon:'fa-file-invoice-dollar', label:'My Invoices', badge:'2' },
        { id:'payments', icon:'fa-money-check-alt', label:'Payments', badge:null }
      ]},
      { section: 'OTHER', items: [
        { id:'profile', icon:'fa-user-cog', label:'Company Profile', badge:null },
        { id:'ratings', icon:'fa-star', label:'Reviews & Ratings', badge:null }
      ]}
    ]
  },
  agent: {
    label: 'Agent',
    color: '#FDCB6E',
    bg: 'rgba(253,203,110,.12)',
    icon: 'fa-user-tie',
    user: { name: 'Marcus Tan', email: 'marcus@realty.my', initials: 'MT' },
    nav: [
      { section: 'SALES', items: [
        { id:'dashboard', icon:'fa-th-large', label:'Dashboard', badge:null },
        { id:'leads', icon:'fa-funnel-dollar', label:'My Leads', badge:'5' },
        { id:'listings', icon:'fa-list-alt', label:'Available Listings', badge:null },
        { id:'viewings', icon:'fa-eye', label:'Viewings', badge:'3' }
      ]},
      { section: 'PIPELINE', items: [
        { id:'applications', icon:'fa-file-alt', label:'Applications', badge:'2' },
        { id:'commission', icon:'fa-coins', label:'Commission', badge:null }
      ]},
      { section: 'OTHER', items: [
        { id:'contacts', icon:'fa-address-book', label:'Contacts', badge:null },
        { id:'performance', icon:'fa-trophy', label:'Performance', badge:null }
      ]}
    ]
  }
};
