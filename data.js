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
  { id:'INV-2604', t:'Sarah Lim', a:'RM 280', s:'Paid', d:'01 Apr 2026', prop:'Cambridge' },
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

const COLORS = ['#6C5CE7','#00CEC9','#FD79A8','#00B894','#FDCB6E','#E17055','#A29BFE','#74B9FF'];

const AI_RESPONSES = {
  occupancy:'Current overall occupancy is **91%** across 8 properties. Westlake Villa leads at 96%, while Oxford is lowest at 85%. I recommend a targeted promotion for Oxford rooms\u2014shall I draft one?',
  revenue:'April revenue is on track at **RM 82.4K**, up 12% from March. Top contributor: Tsing Hua (RM 16.2K). 30 invoices are still outstanding totaling RM 8,120.',
  overdue:'There are **overdue invoices** totaling RM 8,120. The system will automatically disconnect the overdue tenant\'s **room** sub-meter (not the whole unit) 7 days after the due date. You can also manually cut any room from the Electric Sub-Meter Manager in IoT.',
  maintenance:'5 open tickets: 2 high priority (water heater, WiFi), 2 medium (door lock, AC), 1 low (light bulb). Average response time: 1.8 hours.',
  report:'I can **auto-generate** a comprehensive monthly portfolio report! It includes revenue breakdown, billing summary, maintenance status, and occupancy overview. Go to Reports & Analytics and click "Auto-Generate Report".',
  contract:'I can **auto-generate Tenancy Agreements** for any tenant! The system also auto-creates renewal TAs 30 days before lease expiry. Go to Contracts page and click "Auto-Generate TA".',
  smartlock:'Smart lock fingerprints are **automatically disabled** when a tenancy period ends. You can manage this from IoT > Fingerprint Manager. Locks can also be manually disabled or re-enabled.',
  electric:'Electric sub-meters work on a **per-room** basis \u2014 each room has its own independent meter. When rent is overdue beyond 7 days, only that tenant\'s **room** is auto-disconnected (other rooms in the same unit stay connected). You can also **manually cut off** any room for special cases from IoT > Electric Sub-Meters. When the tenant pays, the meter auto-reconnects.',
  automation:'WeStay has **4 automation workflows**:\n\u2022 **Auto Report** \u2014 Monthly portfolio report generation\n\u2022 **Auto TA** \u2014 Tenancy agreement generation on renewal\n\u2022 **Smart Lock** \u2014 Fingerprint auto-disable on lease end\n\u2022 **Electric Cut** \u2014 Sub-meter off after 7 days overdue\n\nAccess them from AI Insights > Automation Center.',
  default:'I can help with:\n\u2022 **Occupancy** \u2014 "How\'s occupancy?"\n\u2022 **Revenue** \u2014 "Revenue this month?"\n\u2022 **Overdue** \u2014 "Who hasn\'t paid?"\n\u2022 **Maintenance** \u2014 "Open tickets?"\n\u2022 **Report** \u2014 "Generate a report"\n\u2022 **Contract** \u2014 "Generate tenancy agreement"\n\u2022 **Smart Lock** \u2014 "How do smart locks work?"\n\u2022 **Electric** \u2014 "Auto-cut electric?"\n\u2022 **Automations** \u2014 "What automations exist?"\n\nJust ask naturally!'
};
