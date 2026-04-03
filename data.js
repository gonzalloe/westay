// ============ WESTAY PLATFORM DATA LAYER ============

const PROPS = [
  { n:'Tsing Hua', o:95, r:60, c:'#6C5CE7', icon:'fa-graduation-cap', addr:'Kampar, Perak', rev:16200, type:'Student' },
  { n:'Beijing', o:92, r:48, c:'#00CEC9', icon:'fa-landmark', addr:'Kampar, Perak', rev:12800, type:'Student' },
  { n:'Cambridge', o:88, r:52, c:'#FD79A8', icon:'fa-university', addr:'Kampar, Perak', rev:14600, type:'Student' },
  { n:'Imperial', o:94, r:44, c:'#00B894', icon:'fa-crown', addr:'Kampar, Perak', rev:11000, type:'Student' },
  { n:'Harvard', o:90, r:40, c:'#FDCB6E', icon:'fa-book', addr:'Kampar, Perak', rev:7600, type:'Student' },
  { n:'Oxford', o:85, r:36, c:'#E17055', icon:'fa-chess-rook', addr:'Kampar, Perak', rev:7920, type:'Student' },
  { n:'Westlake Villa', o:96, r:32, c:'#A29BFE', icon:'fa-water', addr:'Kampar, Perak', rev:10240, type:'Premium' },
  { n:'Manchester', o:88, r:30, c:'#74B9FF', icon:'fa-football', addr:'Kampar, Perak', rev:6000, type:'Student' }
];

const TENANTS = [
  { n:'Sarah Lim', p:'Cambridge A201', r:'RM 280', s:'active', e:'2026-08-31', phone:'+60 12-345 6789', dep:'RM 560' },
  { n:'Ahmad Rizal', p:'Oxford B105', r:'RM 220', s:'pending', e:'\u2014', phone:'+60 11-222 3333', dep:'RM 440' },
  { n:'Wei Jun', p:'Tsing Hua A302', r:'RM 340', s:'active', e:'2026-12-15', phone:'+60 16-789 0000', dep:'RM 680' },
  { n:'Priya Devi', p:'Imperial C108', r:'RM 250', s:'active', e:'2026-06-30', phone:'+60 17-456 7890', dep:'RM 500' },
  { n:'James Wong', p:'Harvard B210', r:'RM 190', s:'overdue', e:'2026-07-15', phone:'+60 13-111 2222', dep:'RM 380' },
  { n:'Nurul Ain', p:'Beijing A105', r:'RM 170', s:'active', e:'2027-01-31', phone:'+60 14-333 4444', dep:'RM 340' },
  { n:'Raj Kumar', p:'Manchester D302', r:'RM 200', s:'active', e:'2026-09-30', phone:'+60 19-555 6666', dep:'RM 400' },
  { n:'Chen Mei Ling', p:'Westlake V101', r:'RM 320', s:'active', e:'2026-11-15', phone:'+60 18-777 8888', dep:'RM 640' }
];

const TICKETS = [
  { id:'TK-001', t:'Water heater not working', loc:'Cambridge R203', pr:'High', icon:'fa-fire', c:'#E17055', time:'35 min ago', by:'Sarah Lim', s:'Open' },
  { id:'TK-002', t:'WiFi connectivity issues', loc:'Imperial C108', pr:'High', icon:'fa-wifi', c:'#E17055', time:'2h ago', by:'Priya Devi', s:'In Progress' },
  { id:'TK-003', t:'Door lock malfunction', loc:'Harvard B210', pr:'Medium', icon:'fa-lock', c:'#FDCB6E', time:'5h ago', by:'James Wong', s:'Open' },
  { id:'TK-004', t:'AC not cooling properly', loc:'Beijing A105', pr:'Medium', icon:'fa-snowflake', c:'#FDCB6E', time:'1d ago', by:'Nurul Ain', s:'Assigned' },
  { id:'TK-005', t:'Light bulb replacement', loc:'Oxford B105', pr:'Low', icon:'fa-lightbulb', c:'#00B894', time:'2d ago', by:'Ahmad Rizal', s:'Open' }
];

const BILLS = [
  { id:'INV-2604', t:'Sarah Lim', a:'RM 280', s:'Paid', d:'01 Mar 2026', prop:'Cambridge' },
  { id:'INV-2605', t:'Sarah Lim', a:'RM 280', s:'Pending', d:'01 Apr 2026', prop:'Cambridge' },
  { id:'INV-2603', t:'James Wong', a:'RM 190', s:'Overdue', d:'01 Apr 2026', prop:'Harvard' },
  { id:'INV-2602', t:'Priya Devi', a:'RM 250', s:'Paid', d:'01 Apr 2026', prop:'Imperial' },
  { id:'INV-2601', t:'Raj Kumar', a:'RM 200', s:'Pending', d:'05 Apr 2026', prop:'Manchester' },
  { id:'INV-2600', t:'Chen Mei Ling', a:'RM 320', s:'Paid', d:'01 Apr 2026', prop:'Westlake' },
  { id:'INV-2599', t:'Nurul Ain', a:'RM 170', s:'Paid', d:'01 Apr 2026', prop:'Beijing' },
  { id:'INV-2598', t:'Wei Jun', a:'RM 340', s:'Paid', d:'01 Apr 2026', prop:'Tsing Hua' },
  { id:'INV-2597', t:'Ahmad Rizal', a:'RM 220', s:'Pending', d:'05 Apr 2026', prop:'Oxford' }
];

const VENDORS = [
  { n:'AirCool Services', type:'HVAC', jobs:12, rating:4.8, s:'active', c:'#00CEC9', phone:'+60 12-800 1001' },
  { n:'QuickFix Plumbing', type:'Plumbing', jobs:8, rating:4.5, s:'active', c:'#6C5CE7', phone:'+60 12-800 1002' },
  { n:'BrightSpark Electric', type:'Electrical', jobs:15, rating:4.9, s:'active', c:'#FDCB6E', phone:'+60 12-800 1003' },
  { n:'CleanPro Services', type:'Cleaning', jobs:22, rating:4.3, s:'active', c:'#00B894', phone:'+60 12-800 1004' },
  { n:'SecureTech Locks', type:'Security', jobs:6, rating:4.7, s:'active', c:'#E17055', phone:'+60 12-800 1005' }
];

const WORK_ORDERS = [
  { id:'WO-101', desc:'Repair water heater unit', loc:'Cambridge R203', vendor:'QuickFix Plumbing', s:'Pending', pr:'High', amt:'RM 350', date:'02 Apr 2026' },
  { id:'WO-102', desc:'Fix WiFi router replacement', loc:'Imperial C108', vendor:'BrightSpark Electric', s:'In Progress', pr:'High', amt:'RM 180', date:'01 Apr 2026' },
  { id:'WO-103', desc:'Replace door lock mechanism', loc:'Harvard B210', vendor:'SecureTech Locks', s:'Pending', pr:'Medium', amt:'RM 220', date:'02 Apr 2026' },
  { id:'WO-104', desc:'AC servicing & gas top-up', loc:'Beijing A105', vendor:'AirCool Services', s:'In Progress', pr:'Medium', amt:'RM 150', date:'31 Mar 2026' },
  { id:'WO-105', desc:'Monthly deep cleaning', loc:'Tsing Hua Common Area', vendor:'CleanPro Services', s:'Completed', pr:'Low', amt:'RM 500', date:'28 Mar 2026' }
];

const LEADS = [
  { n:'Daniel Tan', phone:'+60 11-999 0001', src:'Website', prop:'Cambridge', s:'New', date:'02 Apr 2026', budget:'RM 250-300' },
  { n:'Siti Nurhaliza', phone:'+60 12-999 0002', src:'Social Media', prop:'Imperial', s:'Contacted', date:'01 Apr 2026', budget:'RM 200-250' },
  { n:'Kevin Lee', phone:'+60 16-999 0003', src:'Referral', prop:'Westlake', s:'Viewing Scheduled', date:'31 Mar 2026', budget:'RM 300-350' },
  { n:'Aisha Mohamed', phone:'+60 17-999 0004', src:'Walk-in', prop:'Oxford', s:'New', date:'02 Apr 2026', budget:'RM 180-220' },
  { n:'Ryan Chong', phone:'+60 13-999 0005', src:'Agent Referral', prop:'Tsing Hua', s:'Negotiating', date:'29 Mar 2026', budget:'RM 280-340' }
];

const LANDLORDS = [
  { n:'Tan Sri Ahmad', props:['Tsing Hua','Beijing'], units:108, occ:93, rev:'RM 29,000', payout:'RM 23,200' },
  { n:'Dato Lee Wei', props:['Cambridge','Imperial'], units:96, occ:91, rev:'RM 25,600', payout:'RM 20,480' },
  { n:'Mdm Wong Mei', props:['Harvard','Oxford'], units:76, occ:87, rev:'RM 15,520', payout:'RM 12,416' },
  { n:'En. Razak', props:['Westlake Villa'], units:32, occ:96, rev:'RM 10,240', payout:'RM 8,192' },
  { n:'Mr. Raj Singh', props:['Manchester'], units:30, occ:88, rev:'RM 6,000', payout:'RM 4,800' }
];

const CONTRACTS = [
  { id:'TA-2026-048', tenant:'Sarah Lim', prop:'Cambridge A201', start:'2025-09-01', end:'2026-08-31', rent:'RM 280', s:'Active', dep:'RM 560' },
  { id:'TA-2026-049', tenant:'Wei Jun', prop:'Tsing Hua A302', start:'2025-12-16', end:'2026-12-15', rent:'RM 340', s:'Active', dep:'RM 680' },
  { id:'TA-2026-050', tenant:'Priya Devi', prop:'Imperial C108', start:'2025-07-01', end:'2026-06-30', rent:'RM 250', s:'Expiring Soon', dep:'RM 500' },
  { id:'TA-2026-051', tenant:'Ahmad Rizal', prop:'Oxford B105', start:'2026-04-15', end:'2027-04-14', rent:'RM 220', s:'Pending Signature', dep:'RM 440' }
];

// ============ UTILITY RATES & CONFIG ============
const UTILITY_RATES = {
  electric: { rate: 0.218, unit: 'kWh', name: 'Electricity', icon: 'fa-bolt', color: '#FDCB6E' },  // TNB domestic tariff
  water: { rate: 0.57, unit: 'm³', name: 'Water', icon: 'fa-tint', color: '#74B9FF' },
  internet: { rate: 30, unit: 'month', name: 'Internet', icon: 'fa-wifi', color: '#6C5CE7' },  // flat rate per room
  sewerage: { rate: 8, unit: 'month', name: 'Sewerage', icon: 'fa-shower', color: '#A29BFE' }
};

// ============ WATER SUB-METERS (per-room, parallels ELECTRIC_METERS) ============
const WATER_METERS = [
  { tenant: 'Sarah Lim', unit: 'Cambridge', room: 'A201', meterId: 'WM-CAM-A201', m3: 3.2, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Cambridge', room: 'A202', meterId: 'WM-CAM-A202', m3: 1.8, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Cambridge', room: 'A203', meterId: 'WM-CAM-A203', m3: 2.1, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Cambridge', room: 'A204', meterId: 'WM-CAM-A204', m3: 1.5, lastRead: '2026-04-01' },
  { tenant: 'Ahmad Rizal', unit: 'Oxford', room: 'B105', meterId: 'WM-OXF-B105', m3: 2.8, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Oxford', room: 'B106', meterId: 'WM-OXF-B106', m3: 1.2, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Oxford', room: 'B107', meterId: 'WM-OXF-B107', m3: 1.0, lastRead: '2026-04-01' },
  { tenant: 'Wei Jun', unit: 'Tsing Hua', room: 'A302', meterId: 'WM-TSH-A302', m3: 4.5, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Tsing Hua', room: 'A303', meterId: 'WM-TSH-A303', m3: 2.9, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Tsing Hua', room: 'A304', meterId: 'WM-TSH-A304', m3: 2.3, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Tsing Hua', room: 'A305', meterId: 'WM-TSH-A305', m3: 1.9, lastRead: '2026-04-01' },
  { tenant: 'Priya Devi', unit: 'Imperial', room: 'C108', meterId: 'WM-IMP-C108', m3: 3.4, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Imperial', room: 'C109', meterId: 'WM-IMP-C109', m3: 2.0, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Imperial', room: 'C110', meterId: 'WM-IMP-C110', m3: 1.4, lastRead: '2026-04-01' },
  { tenant: 'James Wong', unit: 'Harvard', room: 'B210', meterId: 'WM-HAR-B210', m3: 2.0, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Harvard', room: 'B211', meterId: 'WM-HAR-B211', m3: 1.6, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Harvard', room: 'B212', meterId: 'WM-HAR-B212', m3: 1.2, lastRead: '2026-04-01' },
  { tenant: 'Nurul Ain', unit: 'Beijing', room: 'A105', meterId: 'WM-BEJ-A105', m3: 3.1, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Beijing', room: 'A106', meterId: 'WM-BEJ-A106', m3: 1.7, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Beijing', room: 'A107', meterId: 'WM-BEJ-A107', m3: 2.1, lastRead: '2026-04-01' },
  { tenant: 'Raj Kumar', unit: 'Manchester', room: 'D302', meterId: 'WM-MAN-D302', m3: 3.8, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Manchester', room: 'D303', meterId: 'WM-MAN-D303', m3: 2.2, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Manchester', room: 'D304', meterId: 'WM-MAN-D304', m3: 1.9, lastRead: '2026-04-01' },
  { tenant: 'Chen Mei Ling', unit: 'Westlake Villa', room: 'V101', meterId: 'WM-WLK-V101', m3: 3.5, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Westlake Villa', room: 'V102', meterId: 'WM-WLK-V102', m3: 2.4, lastRead: '2026-04-01' },
  { tenant: null, unit: 'Westlake Villa', room: 'V103', meterId: 'WM-WLK-V103', m3: 1.8, lastRead: '2026-04-01' }
];

// ============ LANDLORD EXPENSES (per property, monthly) ============
const PROPERTY_EXPENSES = {
  'Tsing Hua': { mgmtFee: 3240, maintenance: 850, internet: 1800, cleaning: 500, insurance: 200, misc: 150 },
  'Beijing': { mgmtFee: 2560, maintenance: 620, internet: 1440, cleaning: 400, insurance: 180, misc: 120 },
  'Cambridge': { mgmtFee: 2920, maintenance: 780, internet: 1560, cleaning: 450, insurance: 190, misc: 130 },
  'Imperial': { mgmtFee: 2200, maintenance: 550, internet: 1320, cleaning: 380, insurance: 160, misc: 100 },
  'Harvard': { mgmtFee: 1520, maintenance: 420, internet: 1200, cleaning: 320, insurance: 140, misc: 90 },
  'Oxford': { mgmtFee: 1584, maintenance: 480, internet: 1080, cleaning: 300, insurance: 130, misc: 80 },
  'Westlake Villa': { mgmtFee: 2048, maintenance: 650, internet: 960, cleaning: 350, insurance: 170, misc: 110 },
  'Manchester': { mgmtFee: 1200, maintenance: 380, internet: 900, cleaning: 280, insurance: 120, misc: 70 }
};

// ============ TENANT UTILITY BILLS (generated) ============
const UTILITY_BILLS = [
  { id:'UTL-2604-01', tenant:'Sarah Lim', unit:'Cambridge', room:'A201', period:'Apr 2026',
    electric:{ kwh:145, amount:31.61 }, water:{ m3:3.2, amount:1.82 }, internet:30, sewerage:8,
    total:71.43, status:'Pending', generated:'2026-04-01', due:'2026-04-15' },
  { id:'UTL-2603-01', tenant:'Sarah Lim', unit:'Cambridge', room:'A201', period:'Mar 2026',
    electric:{ kwh:132, amount:28.78 }, water:{ m3:2.8, amount:1.60 }, internet:30, sewerage:8,
    total:68.38, status:'Paid', generated:'2026-03-01', due:'2026-03-15' }
];

// ============ CHECK-IN/CHECK-OUT RECORDS ============
const CHECKINOUT_RECORDS = [
  { id: 'CIO-001', tenant: 'Sarah Lim', unit: 'Cambridge A201', type: 'check-in', date: '2025-09-01', inspector: 'Admin Operator', status: 'Completed', notes: 'All items in good condition', photos: ['checkin_sarah_room.jpg', 'checkin_sarah_bathroom.jpg'] },
  { id: 'CIO-002', tenant: 'Wei Jun', unit: 'Tsing Hua A302', type: 'check-in', date: '2025-12-16', inspector: 'Admin Operator', status: 'Completed', notes: 'Minor scratch on desk noted', photos: ['checkin_weijun_desk.jpg'] }
];

// ============ TICKET PHOTOS (maps ticket ID to photo arrays) ============
const TICKET_PHOTOS = {
  'TK-001': ['waterheater_broken.jpg', 'waterheater_label.jpg'],
  'TK-002': ['wifi_router_light.jpg'],
  'TK-003': ['doorlock_damage.jpg', 'doorlock_front.jpg']
};

const COLORS = ['#6C5CE7','#00CEC9','#FD79A8','#00B894','#FDCB6E','#E17055','#A29BFE','#74B9FF'];

const AI_RESPONSES = {
  occupancy:'Current overall occupancy is **91%** across 8 properties. Westlake Villa leads at 96%, while Oxford is lowest at 85%. I recommend a targeted promotion for Oxford rooms\u2014shall I draft one?',
  revenue:'April revenue is on track at **RM 82.4K**, up 12% from March. Top contributor: Tsing Hua (RM 16.2K). 30 invoices are still outstanding totaling RM 8,120.',
  overdue:'There are **overdue invoices** totaling RM 8,120. The system will automatically disconnect the overdue tenant\'s **room** sub-meter (not the whole unit) 7 days after the due date. You can also manually cut any room from the Electric Sub-Meter Manager in IoT.',
  maintenance:'5 open tickets: 2 high priority (water heater, WiFi), 2 medium (door lock, AC), 1 low (light bulb). Average response time: 1.8 hours. You can **attach photos** to any ticket for documentation.',
  report:'I can generate two types of reports:\n\u2022 **Portfolio Report** \u2014 Overall operator report with all properties. Go to Reports > "Auto-Generate Report"\n\u2022 **Owner Report** \u2014 Per-landlord report with income, expenses, and net rental breakdown (Homelette style). Go to Reports > "Owner Report"',
  contract:'I can **auto-generate Tenancy Agreements** for any tenant! The system also auto-creates renewal TAs 30 days before lease expiry. Go to Contracts page and click "Auto-Generate TA".',
  smartlock:'Smart lock fingerprints are **automatically disabled** when a tenancy period ends. You can manage this from IoT > Fingerprint Manager. Locks can also be manually disabled or re-enabled.',
  electric:'Electric sub-meters work on a **per-room** basis \u2014 each room has its own independent meter. When rent is overdue beyond 7 days, only that tenant\'s **room** is auto-disconnected (other rooms in the same unit stay connected). You can also **manually cut off** any room for special cases from IoT > Electric Sub-Meters. When the tenant pays, the meter auto-reconnects.',
  utility:'WeStay can **auto-generate utility bills** from sub-meter readings! Electric, water, internet, and sewerage charges are calculated per-room using the latest meter data. Go to Billing > "Utility Bills" or the Operator Quick Add menu.',
  photo:'You can **attach photos** to maintenance tickets and check-in/check-out inspections. Click any ticket > "Photos" button to add images. For move-in/move-out, go to IoT > "Check-In/Out" to create an inspection with photos.',
  checkinout:'The **Check-In/Check-Out** system lets you document unit conditions with photos during tenant transitions. Create an inspection from IoT > Check-In/Out, attach photos, and mark complete. Great for damage disputes!',
  automation:'WeStay has **4+ automation workflows**:\n\u2022 **Auto Report** \u2014 Monthly portfolio report generation\n\u2022 **Owner Report** \u2014 Per-landlord income/expense/net rental breakdown\n\u2022 **Auto TA** \u2014 Tenancy agreement generation on renewal\n\u2022 **Smart Lock** \u2014 Fingerprint auto-disable on lease end\n\u2022 **Electric Cut** \u2014 Sub-meter off after 7 days overdue\n\u2022 **Utility Bills** \u2014 Auto-generate from meter readings\n\nAccess them from AI Insights > Automation Center.',
  default:'I can help with:\n\u2022 **Occupancy** \u2014 "How\'s occupancy?"\n\u2022 **Revenue** \u2014 "Revenue this month?"\n\u2022 **Overdue** \u2014 "Who hasn\'t paid?"\n\u2022 **Maintenance** \u2014 "Open tickets?"\n\u2022 **Report** \u2014 "Generate a report"\n\u2022 **Owner Report** \u2014 "Landlord property report"\n\u2022 **Utility Bills** \u2014 "Generate utility bills"\n\u2022 **Contract** \u2014 "Generate tenancy agreement"\n\u2022 **Smart Lock** \u2014 "How do smart locks work?"\n\u2022 **Electric** \u2014 "Auto-cut electric?"\n\u2022 **Photos** \u2014 "How to attach photos?"\n\u2022 **Check-In/Out** \u2014 "How does check-in work?"\n\u2022 **Automations** \u2014 "What automations exist?"\n\nJust ask naturally!'
};
