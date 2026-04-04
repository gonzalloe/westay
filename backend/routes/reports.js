// ============ REPORT EXPORT API ============
// GET  /api/reports/owner/:name          — Owner report as JSON (existing)
// GET  /api/reports/owner/:name/csv      — Owner report as CSV download
// GET  /api/reports/portfolio            — Portfolio report (all properties)
// GET  /api/reports/portfolio/csv        — Portfolio report as CSV download
// GET  /api/reports/tenants/csv          — Tenants export as CSV
// GET  /api/reports/bills/csv            — Bills export as CSV
// GET  /api/reports/tickets/csv          — Tickets export as CSV

const express = require('express');
const router = express.Router();

module.exports = function (db) {

  // ---- HELPER: Generate CSV from headers + rows ----
  function toCSV(headers, rows, filename) {
    let csv = '\uFEFF' + headers.join(',') + '\n'; // BOM for Excel UTF-8
    for (const row of rows) {
      csv += row.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',') + '\n';
    }
    return { csv, filename };
  }

  function sendCSV(res, csv, filename) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.send(csv);
  }

  // ========== OWNER REPORT CSV ==========
  router.get('/owner/:name/csv', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const ll = await db.getById('landlords', name);
      if (!ll) return res.status(404).json({ error: 'Landlord not found' });

      const props = await db.getAll('props');
      const bills = await db.getAll('bills');
      const meters = await db.getAll('electric_meters');
      const waterMeters = await db.getAll('water_meters');
      const expenses = await db.getAllStore('property_expenses');
      const rates = await db.getAllStore('utility_rates');

      const llProps = props.filter(p => ll.props.some(lp => p.n.includes(lp)));

      // Summary section
      const headers = ['Property', 'Revenue', 'Occupancy %', 'Rooms', 'Electric (kWh)', 'Water (m3)',
        'Mgmt Fee', 'Maintenance', 'Internet', 'Cleaning', 'Insurance', 'Misc', 'Total Expenses', 'Net Income'];

      const rows = llProps.map(p => {
        const propBills = bills.filter(b => b.prop === p.n && b.s === 'Paid');
        const totalRevenue = propBills.reduce((s, b) => {
          const amt = parseFloat(String(b.a).replace(/[^0-9.]/g, '')) || 0;
          return s + amt;
        }, 0);

        const propMeters = meters.filter(m => m.unit === p.n);
        const propWater = waterMeters.filter(m => m.unit === p.n);
        const totalElectric = propMeters.reduce((s, m) => s + (m.kwh || 0), 0);
        const totalWaterM3 = propWater.reduce((s, m) => s + (m.m3 || 0), 0);

        const exp = expenses[p.n] || {};
        const mgmt = exp.mgmtFee || 0;
        const maint = exp.maintenance || 0;
        const inet = exp.internet || 0;
        const clean = exp.cleaning || 0;
        const ins = exp.insurance || 0;
        const misc = exp.misc || 0;
        const totalExp = mgmt + maint + inet + clean + ins + misc;

        return [
          p.n, 'RM ' + totalRevenue.toFixed(2), p.o, p.r,
          totalElectric.toFixed(1), totalWaterM3.toFixed(1),
          mgmt, maint, inet, clean, ins, misc, totalExp,
          'RM ' + (totalRevenue - totalExp).toFixed(2)
        ];
      });

      const { csv, filename } = toCSV(headers, rows, 'westay-owner-report-' + name.replace(/\s+/g, '_') + '.csv');
      sendCSV(res, csv, filename);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== OWNER REPORT JSON (enhanced) ==========
  router.get('/owner/:name', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const ll = await db.getById('landlords', name);
      if (!ll) return res.status(404).json({ error: 'Landlord not found' });

      const props = await db.getAll('props');
      const bills = await db.getAll('bills');
      const meters = await db.getAll('electric_meters');
      const waterMeters = await db.getAll('water_meters');
      const expenses = await db.getAllStore('property_expenses');
      const rates = await db.getAllStore('utility_rates');

      const llProps = props.filter(p => ll.props.some(lp => p.n.includes(lp)));

      const report = {
        landlord: ll,
        generatedAt: new Date().toISOString(),
        properties: llProps.map(p => {
          const propBills = bills.filter(b => b.prop === p.n);
          const propMeters = meters.filter(m => m.unit === p.n);
          const propWater = waterMeters.filter(m => m.unit === p.n);
          const propExpenses = expenses[p.n] || {};

          const totalElectricKwh = propMeters.reduce((s, m) => s + (m.kwh || 0), 0);
          const totalWaterM3 = propWater.reduce((s, m) => s + (m.m3 || 0), 0);

          const totalRevenue = propBills
            .filter(b => b.s === 'Paid')
            .reduce((s, b) => s + (parseFloat(String(b.a).replace(/[^0-9.]/g, '')) || 0), 0);

          const expTotal = Object.values(propExpenses).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);

          return {
            name: p.n,
            revenue: p.rev,
            collectedRevenue: totalRevenue,
            occupancy: p.o,
            rooms: p.r,
            bills: propBills,
            electricUsage: totalElectricKwh,
            waterUsage: totalWaterM3,
            expenses: propExpenses,
            totalExpenses: expTotal,
            netIncome: totalRevenue - expTotal
          };
        }),
        rates,
        summary: {}
      };

      // Summary totals
      report.summary = {
        totalProperties: report.properties.length,
        totalRooms: report.properties.reduce((s, p) => s + p.rooms, 0),
        avgOccupancy: report.properties.length
          ? Math.round(report.properties.reduce((s, p) => s + p.occupancy, 0) / report.properties.length)
          : 0,
        totalRevenue: report.properties.reduce((s, p) => s + p.collectedRevenue, 0),
        totalExpenses: report.properties.reduce((s, p) => s + p.totalExpenses, 0),
        netIncome: report.properties.reduce((s, p) => s + p.netIncome, 0)
      };

      res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== PORTFOLIO REPORT (all properties) ==========
  router.get('/portfolio', async (req, res) => {
    try {
      const props = await db.getAll('props');
      const bills = await db.getAll('bills');
      const tenants = await db.getAll('tenants');
      const tickets = await db.getAll('tickets');
      const meters = await db.getAll('electric_meters');
      const waterMeters = await db.getAll('water_meters');
      const expenses = await db.getAllStore('property_expenses');

      const report = {
        generatedAt: new Date().toISOString(),
        properties: props.map(p => {
          const propBills = bills.filter(b => b.prop === p.n);
          const propTenants = tenants.filter(t => t.p.startsWith(p.n));
          const propTickets = tickets.filter(t => t.loc.startsWith(p.n));
          const propMeters = meters.filter(m => m.unit === p.n);
          const propWater = waterMeters.filter(m => m.unit === p.n);
          const propExp = expenses[p.n] || {};

          return {
            name: p.n,
            type: p.type,
            address: p.addr,
            rooms: p.r,
            occupancy: p.o,
            revenue: p.rev,
            activeTenants: propTenants.filter(t => t.s === 'active').length,
            overdueBills: propBills.filter(b => b.s === 'Overdue').length,
            pendingBills: propBills.filter(b => b.s === 'Pending').length,
            openTickets: propTickets.filter(t => t.s === 'Open' || t.s === 'In Progress').length,
            electricUsage: propMeters.reduce((s, m) => s + (m.kwh || 0), 0),
            waterUsage: propWater.reduce((s, m) => s + (m.m3 || 0), 0),
            expenses: propExp
          };
        }),
        summary: {
          totalProperties: props.length,
          totalRooms: props.reduce((s, p) => s + p.r, 0),
          avgOccupancy: props.length
            ? Math.round(props.reduce((s, p) => s + p.o, 0) / props.length)
            : 0,
          totalRevenue: props.reduce((s, p) => s + p.rev, 0),
          activeTenants: tenants.filter(t => t.s === 'active').length,
          totalTenants: tenants.length,
          openTickets: tickets.filter(t => t.s === 'Open' || t.s === 'In Progress').length,
          overdueBills: bills.filter(b => b.s === 'Overdue').length
        }
      };

      res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== PORTFOLIO REPORT CSV ==========
  router.get('/portfolio/csv', async (req, res) => {
    try {
      const props = await db.getAll('props');
      const bills = await db.getAll('bills');
      const tenants = await db.getAll('tenants');
      const tickets = await db.getAll('tickets');

      const headers = ['Property', 'Type', 'Address', 'Rooms', 'Occupancy %', 'Revenue (RM)',
        'Active Tenants', 'Overdue Bills', 'Open Tickets'];

      const rows = props.map(p => {
        const propTenants = tenants.filter(t => t.p.startsWith(p.n));
        const propBills = bills.filter(b => b.prop === p.n);
        const propTickets = tickets.filter(t => t.loc.startsWith(p.n));
        return [
          p.n, p.type || '', p.addr || '', p.r, p.o, p.rev,
          propTenants.filter(t => t.s === 'active').length,
          propBills.filter(b => b.s === 'Overdue').length,
          propTickets.filter(t => t.s === 'Open' || t.s === 'In Progress').length
        ];
      });

      const { csv, filename } = toCSV(headers, rows, 'westay-portfolio-report.csv');
      sendCSV(res, csv, filename);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== TENANTS CSV EXPORT ==========
  router.get('/tenants/csv', async (req, res) => {
    try {
      const tenants = await db.getAll('tenants');
      const headers = ['Name', 'Unit', 'Rent', 'Status', 'Lease End', 'Phone', 'Deposit'];
      const rows = tenants.map(t => [t.n, t.p, t.r, t.s, t.e, t.phone || '', t.dep || '']);
      const { csv, filename } = toCSV(headers, rows, 'westay-tenants.csv');
      sendCSV(res, csv, filename);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== BILLS CSV EXPORT ==========
  router.get('/bills/csv', async (req, res) => {
    try {
      const bills = await db.getAll('bills');
      const headers = ['Invoice ID', 'Tenant', 'Amount', 'Status', 'Date', 'Property'];
      const rows = bills.map(b => [b.id, b.t, b.a, b.s, b.d, b.prop || '']);
      const { csv, filename } = toCSV(headers, rows, 'westay-bills.csv');
      sendCSV(res, csv, filename);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== TICKETS CSV EXPORT ==========
  router.get('/tickets/csv', async (req, res) => {
    try {
      const tickets = await db.getAll('tickets');
      const headers = ['Ticket ID', 'Issue', 'Location', 'Priority', 'Status', 'Reported By', 'Time'];
      const rows = tickets.map(t => [t.id, t.t, t.loc, t.pr, t.s, t.by || '', t.time || '']);
      const { csv, filename } = toCSV(headers, rows, 'westay-tickets.csv');
      sendCSV(res, csv, filename);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ========== WORK ORDERS CSV EXPORT ==========
  router.get('/work-orders/csv', async (req, res) => {
    try {
      const orders = await db.getAll('work_orders');
      const headers = ['Order ID', 'Description', 'Location', 'Vendor', 'Status', 'Priority', 'Amount', 'Date'];
      const rows = orders.map(o => [o.id, o.desc, o.loc, o.vendor, o.s, o.pr, o.amt, o.date]);
      const { csv, filename } = toCSV(headers, rows, 'westay-work-orders.csv');
      sendCSV(res, csv, filename);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
