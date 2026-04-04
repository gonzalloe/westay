// ============ SEED DATA ============
// Migrated from data.js + automations.js — all demo data in one place.
// This runs once on server start to populate the in-memory DB.

module.exports = async function seed(db) {

  // ---- Properties ----
  await db.replaceAll('props', [
    { n:'Tsing Hua', o:95, r:60, c:'#6C5CE7', icon:'fa-graduation-cap', addr:'Kampar, Perak', rev:16200, type:'Student' },
    { n:'Beijing', o:92, r:48, c:'#00CEC9', icon:'fa-landmark', addr:'Kampar, Perak', rev:12800, type:'Student' },
    { n:'Cambridge', o:88, r:52, c:'#FD79A8', icon:'fa-university', addr:'Kampar, Perak', rev:14600, type:'Student' },
    { n:'Imperial', o:94, r:44, c:'#00B894', icon:'fa-crown', addr:'Kampar, Perak', rev:11000, type:'Student' },
    { n:'Harvard', o:90, r:40, c:'#FDCB6E', icon:'fa-book', addr:'Kampar, Perak', rev:7600, type:'Student' },
    { n:'Oxford', o:85, r:36, c:'#E17055', icon:'fa-chess-rook', addr:'Kampar, Perak', rev:7920, type:'Student' },
    { n:'Westlake Villa', o:96, r:32, c:'#A29BFE', icon:'fa-water', addr:'Kampar, Perak', rev:10240, type:'Premium' },
    { n:'Manchester', o:88, r:30, c:'#74B9FF', icon:'fa-football', addr:'Kampar, Perak', rev:6000, type:'Student' }
  ]);

  // ---- Tenants ----
  await db.replaceAll('tenants', [
    { n:'Sarah Lim', p:'Cambridge A201', r:'RM 280', s:'active', e:'2026-08-31', phone:'+60 12-345 6789', dep:'RM 560' },
    { n:'Ahmad Rizal', p:'Oxford B105', r:'RM 220', s:'pending', e:'\u2014', phone:'+60 11-222 3333', dep:'RM 440' },
    { n:'Wei Jun', p:'Tsing Hua A302', r:'RM 340', s:'active', e:'2026-12-15', phone:'+60 16-789 0000', dep:'RM 680' },
    { n:'Priya Devi', p:'Imperial C108', r:'RM 250', s:'active', e:'2026-06-30', phone:'+60 17-456 7890', dep:'RM 500' },
    { n:'James Wong', p:'Harvard B210', r:'RM 190', s:'overdue', e:'2026-07-15', phone:'+60 13-111 2222', dep:'RM 380' },
    { n:'Nurul Ain', p:'Beijing A105', r:'RM 170', s:'active', e:'2027-01-31', phone:'+60 14-333 4444', dep:'RM 340' },
    { n:'Raj Kumar', p:'Manchester D302', r:'RM 200', s:'active', e:'2026-09-30', phone:'+60 19-555 6666', dep:'RM 400' },
    { n:'Chen Mei Ling', p:'Westlake V101', r:'RM 320', s:'active', e:'2026-11-15', phone:'+60 18-777 8888', dep:'RM 640' }
  ]);

  // ---- Tickets ----
  await db.replaceAll('tickets', [
    { id:'TK-001', t:'Water heater not working', loc:'Cambridge R203', pr:'High', icon:'fa-fire', c:'#E17055', time:'35 min ago', by:'Sarah Lim', s:'Open' },
    { id:'TK-002', t:'WiFi connectivity issues', loc:'Imperial C108', pr:'High', icon:'fa-wifi', c:'#E17055', time:'2h ago', by:'Priya Devi', s:'In Progress' },
    { id:'TK-003', t:'Door lock malfunction', loc:'Harvard B210', pr:'Medium', icon:'fa-lock', c:'#FDCB6E', time:'5h ago', by:'James Wong', s:'Open' },
    { id:'TK-004', t:'AC not cooling properly', loc:'Beijing A105', pr:'Medium', icon:'fa-snowflake', c:'#FDCB6E', time:'1d ago', by:'Nurul Ain', s:'Assigned' },
    { id:'TK-005', t:'Light bulb replacement', loc:'Oxford B105', pr:'Low', icon:'fa-lightbulb', c:'#00B894', time:'2d ago', by:'Ahmad Rizal', s:'Open' }
  ]);

  // ---- Bills ----
  await db.replaceAll('bills', [
    { id:'INV-2604', t:'Sarah Lim', a:'RM 280', s:'Paid', d:'01 Mar 2026', prop:'Cambridge' },
    { id:'INV-2605', t:'Sarah Lim', a:'RM 280', s:'Pending', d:'01 Apr 2026', prop:'Cambridge' },
    { id:'INV-2603', t:'James Wong', a:'RM 190', s:'Overdue', d:'01 Apr 2026', prop:'Harvard' },
    { id:'INV-2602', t:'Priya Devi', a:'RM 250', s:'Paid', d:'01 Apr 2026', prop:'Imperial' },
    { id:'INV-2601', t:'Raj Kumar', a:'RM 200', s:'Pending', d:'05 Apr 2026', prop:'Manchester' },
    { id:'INV-2600', t:'Chen Mei Ling', a:'RM 320', s:'Paid', d:'01 Apr 2026', prop:'Westlake' },
    { id:'INV-2599', t:'Nurul Ain', a:'RM 170', s:'Paid', d:'01 Apr 2026', prop:'Beijing' },
    { id:'INV-2598', t:'Wei Jun', a:'RM 340', s:'Paid', d:'01 Apr 2026', prop:'Tsing Hua' },
    { id:'INV-2597', t:'Ahmad Rizal', a:'RM 220', s:'Pending', d:'05 Apr 2026', prop:'Oxford' }
  ]);

  // ---- Vendors ----
  await db.replaceAll('vendors', [
    { n:'AirCool Services', type:'HVAC', jobs:12, rating:4.8, s:'active', c:'#00CEC9', phone:'+60 12-800 1001' },
    { n:'QuickFix Plumbing', type:'Plumbing', jobs:8, rating:4.5, s:'active', c:'#6C5CE7', phone:'+60 12-800 1002' },
    { n:'BrightSpark Electric', type:'Electrical', jobs:15, rating:4.9, s:'active', c:'#FDCB6E', phone:'+60 12-800 1003' },
    { n:'CleanPro Services', type:'Cleaning', jobs:22, rating:4.3, s:'active', c:'#00B894', phone:'+60 12-800 1004' },
    { n:'SecureTech Locks', type:'Security', jobs:6, rating:4.7, s:'active', c:'#E17055', phone:'+60 12-800 1005' }
  ]);

  // ---- Work Orders ----
  await db.replaceAll('work_orders', [
    { id:'WO-101', desc:'Repair water heater unit', loc:'Cambridge R203', vendor:'QuickFix Plumbing', s:'Pending', pr:'High', amt:'RM 350', date:'02 Apr 2026' },
    { id:'WO-102', desc:'Fix WiFi router replacement', loc:'Imperial C108', vendor:'BrightSpark Electric', s:'In Progress', pr:'High', amt:'RM 180', date:'01 Apr 2026' },
    { id:'WO-103', desc:'Replace door lock mechanism', loc:'Harvard B210', vendor:'SecureTech Locks', s:'Pending', pr:'Medium', amt:'RM 220', date:'02 Apr 2026' },
    { id:'WO-104', desc:'AC servicing & gas top-up', loc:'Beijing A105', vendor:'AirCool Services', s:'In Progress', pr:'Medium', amt:'RM 150', date:'31 Mar 2026' },
    { id:'WO-105', desc:'Monthly deep cleaning', loc:'Tsing Hua Common Area', vendor:'CleanPro Services', s:'Completed', pr:'Low', amt:'RM 500', date:'28 Mar 2026' }
  ]);

  // ---- Leads ----
  await db.replaceAll('leads', [
    { n:'Daniel Tan', phone:'+60 11-999 0001', src:'Website', prop:'Cambridge', s:'New', date:'02 Apr 2026', budget:'RM 250-300' },
    { n:'Siti Nurhaliza', phone:'+60 12-999 0002', src:'Social Media', prop:'Imperial', s:'Contacted', date:'01 Apr 2026', budget:'RM 200-250' },
    { n:'Kevin Lee', phone:'+60 16-999 0003', src:'Referral', prop:'Westlake', s:'Viewing Scheduled', date:'31 Mar 2026', budget:'RM 300-350' },
    { n:'Aisha Mohamed', phone:'+60 17-999 0004', src:'Walk-in', prop:'Oxford', s:'New', date:'02 Apr 2026', budget:'RM 180-220' },
    { n:'Ryan Chong', phone:'+60 13-999 0005', src:'Agent Referral', prop:'Tsing Hua', s:'Negotiating', date:'29 Mar 2026', budget:'RM 280-340' }
  ]);

  // ---- Landlords ----
  await db.replaceAll('landlords', [
    { n:'Tan Sri Ahmad', props:['Tsing Hua','Beijing'], units:108, occ:93, rev:'RM 29,000', payout:'RM 23,200' },
    { n:'Dato Lee Wei', props:['Cambridge','Imperial'], units:96, occ:91, rev:'RM 25,600', payout:'RM 20,480' },
    { n:'Mdm Wong Mei', props:['Harvard','Oxford'], units:76, occ:87, rev:'RM 15,520', payout:'RM 12,416' },
    { n:'En. Razak', props:['Westlake Villa'], units:32, occ:96, rev:'RM 10,240', payout:'RM 8,192' },
    { n:'Mr. Raj Singh', props:['Manchester'], units:30, occ:88, rev:'RM 6,000', payout:'RM 4,800' }
  ]);

  // ---- Contracts ----
  await db.replaceAll('contracts', [
    { id:'TA-2026-048', tenant:'Sarah Lim', prop:'Cambridge A201', start:'2025-09-01', end:'2026-08-31', rent:'RM 280', s:'Active', dep:'RM 560' },
    { id:'TA-2026-049', tenant:'Wei Jun', prop:'Tsing Hua A302', start:'2025-12-16', end:'2026-12-15', rent:'RM 340', s:'Active', dep:'RM 680' },
    { id:'TA-2026-050', tenant:'Priya Devi', prop:'Imperial C108', start:'2025-07-01', end:'2026-06-30', rent:'RM 250', s:'Expiring Soon', dep:'RM 500' },
    { id:'TA-2026-051', tenant:'Ahmad Rizal', prop:'Oxford B105', start:'2026-04-15', end:'2027-04-14', rent:'RM 220', s:'Pending Signature', dep:'RM 440' }
  ]);

  // ---- Utility Bills ----
  await db.replaceAll('utility_bills', [
    { id:'UTL-2604-01', tenant:'Sarah Lim', unit:'Cambridge', room:'A201', period:'Apr 2026',
      electric:{ kwh:145, amount:31.61 }, water:{ m3:3.2, amount:1.82 }, internet:30, sewerage:8,
      total:71.43, status:'Pending', generated:'2026-04-01', due:'2026-04-15' },
    { id:'UTL-2603-01', tenant:'Sarah Lim', unit:'Cambridge', room:'A201', period:'Mar 2026',
      electric:{ kwh:132, amount:28.78 }, water:{ m3:2.8, amount:1.60 }, internet:30, sewerage:8,
      total:68.38, status:'Paid', generated:'2026-03-01', due:'2026-03-15' }
  ]);

  // ---- Check-In/Out Records ----
  await db.replaceAll('checkinout_records', [
    { id:'CIO-001', tenant:'Sarah Lim', unit:'Cambridge A201', type:'check-in', date:'2025-09-01', inspector:'Admin Operator', status:'Completed', notes:'All items in good condition', photos:['checkin_sarah_room.jpg','checkin_sarah_bathroom.jpg'] },
    { id:'CIO-002', tenant:'Wei Jun', unit:'Tsing Hua A302', type:'check-in', date:'2025-12-16', inspector:'Admin Operator', status:'Completed', notes:'Minor scratch on desk noted', photos:['checkin_weijun_desk.jpg'] }
  ]);

  // ---- Smart Lock Registry ----
  await db.replaceAll('smart_lock_registry', [
    { tenant:'Sarah Lim', unit:'Cambridge A201', fingerprints:2, status:'Active', leaseEnd:'2026-08-31' },
    { tenant:'Wei Jun', unit:'Tsing Hua A302', fingerprints:2, status:'Active', leaseEnd:'2026-12-15' },
    { tenant:'Priya Devi', unit:'Imperial C108', fingerprints:1, status:'Active', leaseEnd:'2026-06-30' },
    { tenant:'James Wong', unit:'Harvard B210', fingerprints:2, status:'Active', leaseEnd:'2026-07-15' },
    { tenant:'Nurul Ain', unit:'Beijing A105', fingerprints:1, status:'Active', leaseEnd:'2027-01-31' },
    { tenant:'Raj Kumar', unit:'Manchester D302', fingerprints:2, status:'Active', leaseEnd:'2026-09-30' },
    { tenant:'Chen Mei Ling', unit:'Westlake V101', fingerprints:1, status:'Active', leaseEnd:'2026-11-15' },
    { tenant:'Ahmad Rizal', unit:'Oxford B105', fingerprints:0, status:'Pending Setup', leaseEnd:'2027-04-14' }
  ]);

  // ---- Electric Meters (per-room) ----
  await db.replaceAll('electric_meters', [
    { tenant:'Sarah Lim', unit:'Cambridge', room:'A201', meterId:'EM-CAM-A201', status:'Connected', kwh:42.5, lastRead:'2026-04-01' },
    { tenant:null, unit:'Cambridge', room:'A202', meterId:'EM-CAM-A202', status:'Connected', kwh:18.2, lastRead:'2026-04-01' },
    { tenant:null, unit:'Cambridge', room:'A203', meterId:'EM-CAM-A203', status:'Connected', kwh:22.8, lastRead:'2026-04-01' },
    { tenant:null, unit:'Cambridge', room:'A204', meterId:'EM-CAM-A204', status:'Connected', kwh:15.0, lastRead:'2026-04-01' },
    { tenant:'Ahmad Rizal', unit:'Oxford', room:'B105', meterId:'EM-OXF-B105', status:'Connected', kwh:28.3, lastRead:'2026-04-01' },
    { tenant:null, unit:'Oxford', room:'B106', meterId:'EM-OXF-B106', status:'Connected', kwh:12.1, lastRead:'2026-04-01' },
    { tenant:null, unit:'Oxford', room:'B107', meterId:'EM-OXF-B107', status:'Connected', kwh:9.6, lastRead:'2026-04-01' },
    { tenant:'Wei Jun', unit:'Tsing Hua', room:'A302', meterId:'EM-TSH-A302', status:'Connected', kwh:55.1, lastRead:'2026-04-01' },
    { tenant:null, unit:'Tsing Hua', room:'A303', meterId:'EM-TSH-A303', status:'Connected', kwh:30.4, lastRead:'2026-04-01' },
    { tenant:null, unit:'Tsing Hua', room:'A304', meterId:'EM-TSH-A304', status:'Connected', kwh:25.7, lastRead:'2026-04-01' },
    { tenant:null, unit:'Tsing Hua', room:'A305', meterId:'EM-TSH-A305', status:'Connected', kwh:19.3, lastRead:'2026-04-01' },
    { tenant:'Priya Devi', unit:'Imperial', room:'C108', meterId:'EM-IMP-C108', status:'Connected', kwh:33.7, lastRead:'2026-04-01' },
    { tenant:null, unit:'Imperial', room:'C109', meterId:'EM-IMP-C109', status:'Connected', kwh:20.5, lastRead:'2026-04-01' },
    { tenant:null, unit:'Imperial', room:'C110', meterId:'EM-IMP-C110', status:'Connected', kwh:14.2, lastRead:'2026-04-01' },
    { tenant:'James Wong', unit:'Harvard', room:'B210', meterId:'EM-HAR-B210', status:'Connected', kwh:19.8, lastRead:'2026-04-01' },
    { tenant:null, unit:'Harvard', room:'B211', meterId:'EM-HAR-B211', status:'Connected', kwh:16.3, lastRead:'2026-04-01' },
    { tenant:null, unit:'Harvard', room:'B212', meterId:'EM-HAR-B212', status:'Connected', kwh:11.9, lastRead:'2026-04-01' },
    { tenant:'Nurul Ain', unit:'Beijing', room:'A105', meterId:'EM-BEJ-A105', status:'Connected', kwh:31.2, lastRead:'2026-04-01' },
    { tenant:null, unit:'Beijing', room:'A106', meterId:'EM-BEJ-A106', status:'Connected', kwh:17.8, lastRead:'2026-04-01' },
    { tenant:null, unit:'Beijing', room:'A107', meterId:'EM-BEJ-A107', status:'Connected', kwh:21.4, lastRead:'2026-04-01' },
    { tenant:'Raj Kumar', unit:'Manchester', room:'D302', meterId:'EM-MAN-D302', status:'Connected', kwh:48.6, lastRead:'2026-04-01' },
    { tenant:null, unit:'Manchester', room:'D303', meterId:'EM-MAN-D303', status:'Connected', kwh:22.1, lastRead:'2026-04-01' },
    { tenant:null, unit:'Manchester', room:'D304', meterId:'EM-MAN-D304', status:'Connected', kwh:18.7, lastRead:'2026-04-01' },
    { tenant:'Chen Mei Ling', unit:'Westlake Villa', room:'V101', meterId:'EM-WLK-V101', status:'Connected', kwh:37.4, lastRead:'2026-04-01' },
    { tenant:null, unit:'Westlake Villa', room:'V102', meterId:'EM-WLK-V102', status:'Connected', kwh:24.6, lastRead:'2026-04-01' },
    { tenant:null, unit:'Westlake Villa', room:'V103', meterId:'EM-WLK-V103', status:'Connected', kwh:19.8, lastRead:'2026-04-01' }
  ]);

  // ---- Water Meters (per-room) ----
  await db.replaceAll('water_meters', [
    { tenant:'Sarah Lim', unit:'Cambridge', room:'A201', meterId:'WM-CAM-A201', m3:3.2, lastRead:'2026-04-01' },
    { tenant:null, unit:'Cambridge', room:'A202', meterId:'WM-CAM-A202', m3:1.8, lastRead:'2026-04-01' },
    { tenant:null, unit:'Cambridge', room:'A203', meterId:'WM-CAM-A203', m3:2.1, lastRead:'2026-04-01' },
    { tenant:null, unit:'Cambridge', room:'A204', meterId:'WM-CAM-A204', m3:1.5, lastRead:'2026-04-01' },
    { tenant:'Ahmad Rizal', unit:'Oxford', room:'B105', meterId:'WM-OXF-B105', m3:2.8, lastRead:'2026-04-01' },
    { tenant:null, unit:'Oxford', room:'B106', meterId:'WM-OXF-B106', m3:1.2, lastRead:'2026-04-01' },
    { tenant:null, unit:'Oxford', room:'B107', meterId:'WM-OXF-B107', m3:1.0, lastRead:'2026-04-01' },
    { tenant:'Wei Jun', unit:'Tsing Hua', room:'A302', meterId:'WM-TSH-A302', m3:4.5, lastRead:'2026-04-01' },
    { tenant:null, unit:'Tsing Hua', room:'A303', meterId:'WM-TSH-A303', m3:2.9, lastRead:'2026-04-01' },
    { tenant:null, unit:'Tsing Hua', room:'A304', meterId:'WM-TSH-A304', m3:2.3, lastRead:'2026-04-01' },
    { tenant:null, unit:'Tsing Hua', room:'A305', meterId:'WM-TSH-A305', m3:1.9, lastRead:'2026-04-01' },
    { tenant:'Priya Devi', unit:'Imperial', room:'C108', meterId:'WM-IMP-C108', m3:3.4, lastRead:'2026-04-01' },
    { tenant:null, unit:'Imperial', room:'C109', meterId:'WM-IMP-C109', m3:2.0, lastRead:'2026-04-01' },
    { tenant:null, unit:'Imperial', room:'C110', meterId:'WM-IMP-C110', m3:1.4, lastRead:'2026-04-01' },
    { tenant:'James Wong', unit:'Harvard', room:'B210', meterId:'WM-HAR-B210', m3:2.0, lastRead:'2026-04-01' },
    { tenant:null, unit:'Harvard', room:'B211', meterId:'WM-HAR-B211', m3:1.6, lastRead:'2026-04-01' },
    { tenant:null, unit:'Harvard', room:'B212', meterId:'WM-HAR-B212', m3:1.2, lastRead:'2026-04-01' },
    { tenant:'Nurul Ain', unit:'Beijing', room:'A105', meterId:'WM-BEJ-A105', m3:3.1, lastRead:'2026-04-01' },
    { tenant:null, unit:'Beijing', room:'A106', meterId:'WM-BEJ-A106', m3:1.7, lastRead:'2026-04-01' },
    { tenant:null, unit:'Beijing', room:'A107', meterId:'WM-BEJ-A107', m3:2.1, lastRead:'2026-04-01' },
    { tenant:'Raj Kumar', unit:'Manchester', room:'D302', meterId:'WM-MAN-D302', m3:3.8, lastRead:'2026-04-01' },
    { tenant:null, unit:'Manchester', room:'D303', meterId:'WM-MAN-D303', m3:2.2, lastRead:'2026-04-01' },
    { tenant:null, unit:'Manchester', room:'D304', meterId:'WM-MAN-D304', m3:1.9, lastRead:'2026-04-01' },
    { tenant:'Chen Mei Ling', unit:'Westlake Villa', room:'V101', meterId:'WM-WLK-V101', m3:3.5, lastRead:'2026-04-01' },
    { tenant:null, unit:'Westlake Villa', room:'V102', meterId:'WM-WLK-V102', m3:2.4, lastRead:'2026-04-01' },
    { tenant:null, unit:'Westlake Villa', room:'V103', meterId:'WM-WLK-V103', m3:1.8, lastRead:'2026-04-01' }
  ]);

  // ---- IoT Locks (from pages-operator.js) ----
  await db.replaceAll('iot_locks', [
    { id:'LK-001', prop:'Cambridge', room:'A201', type:'Smart Lock Pro', battery:92, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-02 08:15', tenant:'Sarah Lim' },
    { id:'LK-002', prop:'Cambridge', room:'A202', type:'Smart Lock Pro', battery:15, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-01 22:30', tenant:null },
    { id:'LK-003', prop:'Cambridge', room:'A203', type:'Smart Lock Lite', battery:67, status:'Unlocked', firmware:'v2.8.0', lastAccess:'2026-04-02 09:00', tenant:null },
    { id:'LK-004', prop:'Cambridge', room:'A204', type:'Smart Lock Pro', battery:88, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-01 18:45', tenant:null },
    { id:'LK-005', prop:'Oxford', room:'B105', type:'Smart Lock Lite', battery:45, status:'Locked', firmware:'v2.8.0', lastAccess:'2026-04-02 07:30', tenant:'Ahmad Rizal' },
    { id:'LK-006', prop:'Oxford', room:'B106', type:'Smart Lock Lite', battery:8, status:'Locked', firmware:'v2.7.5', lastAccess:'2026-03-30 14:00', tenant:null },
    { id:'LK-007', prop:'Tsing Hua', room:'A302', type:'Smart Lock Pro', battery:95, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-02 08:45', tenant:'Wei Jun' },
    { id:'LK-008', prop:'Tsing Hua', room:'A303', type:'Smart Lock Pro', battery:78, status:'Locked', firmware:'v3.1.0', lastAccess:'2026-04-01 20:15', tenant:null },
    { id:'LK-009', prop:'Imperial', room:'C108', type:'Smart Lock Pro', battery:82, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-02 09:10', tenant:'Priya Devi' },
    { id:'LK-010', prop:'Imperial', room:'C109', type:'Smart Lock Lite', battery:55, status:'Unlocked', firmware:'v2.8.0', lastAccess:'2026-04-02 06:00', tenant:null },
    { id:'LK-011', prop:'Harvard', room:'B210', type:'Smart Lock Pro', battery:71, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-02 07:00', tenant:'James Wong' },
    { id:'LK-012', prop:'Harvard', room:'B211', type:'Smart Lock Lite', battery:33, status:'Locked', firmware:'v2.7.5', lastAccess:'2026-04-01 16:30', tenant:null },
    { id:'LK-013', prop:'Beijing', room:'A105', type:'Smart Lock Pro', battery:89, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-02 08:00', tenant:'Nurul Ain' },
    { id:'LK-014', prop:'Manchester', room:'D302', type:'Smart Lock Lite', battery:62, status:'Locked', firmware:'v2.8.0', lastAccess:'2026-04-02 07:45', tenant:'Raj Kumar' },
    { id:'LK-015', prop:'Westlake Villa', room:'V101', type:'Smart Lock Pro', battery:96, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-02 09:30', tenant:'Chen Mei Ling' },
    { id:'LK-016', prop:'Westlake Villa', room:'V102', type:'Smart Lock Pro', battery:84, status:'Locked', firmware:'v3.2.1', lastAccess:'2026-04-01 21:00', tenant:null }
  ]);

  // ---- Notifications ----
  await db.replaceAll('notifs', [
    { id:1, icon:'fa-credit-card', c:'#00B894', title:'Payment Received', desc:'Sarah Lim paid RM 280 for April rent', time:'35 min ago', read:false },
    { id:2, icon:'fa-wrench', c:'#E17055', title:'New Ticket: High Priority', desc:'Water heater not working - Cambridge R203', time:'40 min ago', read:false },
    { id:3, icon:'fa-file-signature', c:'#6C5CE7', title:'Contract Signed', desc:'Ahmad Rizal signed lease agreement', time:'2h ago', read:false },
    { id:4, icon:'fa-user-plus', c:'#FD79A8', title:'New Lead', desc:'Daniel Tan via Website - interested in Cambridge', time:'5h ago', read:true },
    { id:5, icon:'fa-tools', c:'#FDCB6E', title:'Vendor Assigned', desc:'QuickFix Plumbing assigned to WO-101', time:'5h ago', read:true }
  ]);

  // ---- Key-Value Stores ----

  // Ticket Photos
  await db.setStore('ticket_photos', 'TK-001', ['waterheater_broken.jpg', 'waterheater_label.jpg']);
  await db.setStore('ticket_photos', 'TK-002', ['wifi_router_light.jpg']);
  await db.setStore('ticket_photos', 'TK-003', ['doorlock_damage.jpg', 'doorlock_front.jpg']);

  // Property Expenses
  await db.setStore('property_expenses', 'Tsing Hua', { mgmtFee:3240, maintenance:850, internet:1800, cleaning:500, insurance:200, misc:150 });
  await db.setStore('property_expenses', 'Beijing', { mgmtFee:2560, maintenance:620, internet:1440, cleaning:400, insurance:180, misc:120 });
  await db.setStore('property_expenses', 'Cambridge', { mgmtFee:2920, maintenance:780, internet:1560, cleaning:450, insurance:190, misc:130 });
  await db.setStore('property_expenses', 'Imperial', { mgmtFee:2200, maintenance:550, internet:1320, cleaning:380, insurance:160, misc:100 });
  await db.setStore('property_expenses', 'Harvard', { mgmtFee:1520, maintenance:420, internet:1200, cleaning:320, insurance:140, misc:90 });
  await db.setStore('property_expenses', 'Oxford', { mgmtFee:1584, maintenance:480, internet:1080, cleaning:300, insurance:130, misc:80 });
  await db.setStore('property_expenses', 'Westlake Villa', { mgmtFee:2048, maintenance:650, internet:960, cleaning:350, insurance:170, misc:110 });
  await db.setStore('property_expenses', 'Manchester', { mgmtFee:1200, maintenance:380, internet:900, cleaning:280, insurance:120, misc:70 });

  // Utility Rates
  await db.setStore('utility_rates', 'electric', { rate:0.218, unit:'kWh', name:'Electricity', icon:'fa-bolt', color:'#FDCB6E' });
  await db.setStore('utility_rates', 'water', { rate:0.57, unit:'m\u00B3', name:'Water', icon:'fa-tint', color:'#74B9FF' });
  await db.setStore('utility_rates', 'internet', { rate:30, unit:'month', name:'Internet', icon:'fa-wifi', color:'#6C5CE7' });
  await db.setStore('utility_rates', 'sewerage', { rate:8, unit:'month', name:'Sewerage', icon:'fa-shower', color:'#A29BFE' });

  // Automation State
  await db.setStore('automations', 'autoReport', { enabled:true, lastRun:null, schedule:'1st of every month', log:[] });
  await db.setStore('automations', 'autoTA', { enabled:true, lastRun:null, schedule:'30 days before expiry', log:[] });
  await db.setStore('automations', 'smartLockExpiry', { enabled:true, lastRun:null, schedule:'On lease end date', log:[] });
  await db.setStore('automations', 'latePmtElectric', { enabled:true, lastRun:null, schedule:'7 days after due date', log:[] });

  // Colors
  await db.setStore('config', 'colors', ['#6C5CE7','#00CEC9','#FD79A8','#00B894','#FDCB6E','#E17055','#A29BFE','#74B9FF']);

  // AI Responses
  await db.setStore('config', 'ai_responses', {
    occupancy:'Current overall occupancy is **91%** across 8 properties.',
    revenue:'April revenue is on track at **RM 82.4K**, up 12% from March.',
    default:'I can help with occupancy, revenue, maintenance, and more.'
  });

  console.log('[Seed] Database seeded with demo data');
};
