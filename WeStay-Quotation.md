# WeStay Co-Living Management Platform

## Software Development Quotation

---

**Prepared by:** Gonzallo Engineering  
**Prepared for:** [Client / Boss Name]  
**Date:** 4 April 2026  
**Quotation Ref:** WS-Q-2026-001  
**Valid Until:** 4 May 2026 (30 days)

---

## 1. Executive Summary

WeStay is a comprehensive co-living property management platform designed for operators managing multi-property student and premium housing portfolios in Malaysia. The platform serves **5 distinct user roles** — Operator, Tenant, Landlord, Vendor, and Agent — each with tailored dashboards, workflows, and data isolation.

The system currently manages **8 properties, 342 rooms**, and supports end-to-end operations from lead capture to tenancy, billing, IoT smart locks, utility metering, and automated reporting.

---

## 2. Feature Breakdown (Current Build)

### 2.1 Multi-Role Portal System

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Role-Based Login & Authentication** | 5 user roles with distinct dashboards, navigation, and data access permissions |
| 2 | **Responsive SPA Architecture** | Single-page application with dynamic routing, sidebar navigation, and mobile-responsive design |
| 3 | **Role Switching** | Seamless role switching for demo/admin purposes |

### 2.2 Operator Portal (Full Management)

| # | Feature | Description |
|---|---------|-------------|
| 4 | **Operator Dashboard** | Overview stats (occupancy, revenue, tenants, properties), quick-add menu, revenue chart, occupancy bars |
| 5 | **Property Management** | 8 properties with occupancy rates, room counts, revenue tracking, color-coded badges, add/view property detail |
| 6 | **Tenant Management** | Full tenant list with unit, rent, deposit, lease status, check-in/out evidence, contract links; tenant detail modal; CRUD operations (add/edit/delete) |
| 7 | **Landlord Management** | Landlord portfolio table with properties, units, occupancy, revenue, expenses, net payout, alerts; landlord detail modal; CSV export; portfolio report |
| 8 | **Contract & Tenancy Agreement** | Contract list with status tracking (Active, Pending Signature, Expiring Soon); auto-generate TA with full legal template; auto-renewal detection |
| 9 | **Billing & Invoices** | Invoice management with Pay/Overdue/Pending status; generate invoices; bill detail view; payment processing |
| 10 | **Maintenance & Work Orders** | Ticket management (Open → In Progress → Completed); work order assignment; vendor linking; photo attachments per ticket |
| 11 | **Vendor Management** | Vendor directory with type, job count, ratings; vendor detail; work order linking |
| 12 | **IoT & Smart Locks** | 5 clickable stat cards (total locks, low battery, unlocked, disabled fingerprint, disconnected meters); fingerprint manager with auto-disable on lease expiry; electric sub-meter manager with per-room cut/reconnect |
| 13 | **Leads & CRM** | Lead pipeline (New → Contacted → Viewing → Negotiating); add/edit leads; status tracking |
| 14 | **Community Feed** | Shared community posts and announcements |
| 15 | **AI Insights & Chatbot** | AI assistant with 13+ response categories (occupancy, revenue, overdue, maintenance, reports, contracts, smart locks, electric meters, utility bills, photos, check-in/out, automations) |
| 16 | **Automation Dashboard** | Toggle-based automation center with 6+ workflows: auto-report, auto-TA renewal, smart lock expiry, late payment electric cut, utility bill generation, owner report |
| 17 | **Reports & Analytics** | Auto-generated portfolio report with KPIs; downloadable CSV; printable reports |
| 18 | **Quick Add Menu** | Floating action button for rapid creation of properties, tenants, tickets, leads, vendors, contracts, invoices |

### 2.3 Tenant Portal

| # | Feature | Description |
|---|---------|-------------|
| 19 | **Tenant Dashboard** | 4 clickable stat cards (Rent Due, Days Remaining, Open Requests, Community Score); quick actions grid |
| 20 | **My Unit** | Unit details (property, room, floor, size, dates); deposit info; check-in/out evidence button |
| 21 | **My Bills** | Rent invoices with clickable detail view; utility bills section with per-item breakdown (electric, water, internet, sewerage) |
| 22 | **My Contract** | View active tenancy agreement details |
| 23 | **Maintenance Request** | Submit maintenance tickets with photo attachments |
| 24 | **Smart Access** | View smart lock status (Locked/Unlocked); battery, firmware info; access log (read-only for tenants) |
| 25 | **Utilities** | View utility meter readings and usage |
| 26 | **Community, Events & Marketplace** | Community feed, upcoming events calendar, peer marketplace |

### 2.4 Landlord Portal

| # | Feature | Description |
|---|---------|-------------|
| 27 | **Portfolio Dashboard** | 5 clickable stat cards (Properties, Total Units, Occupancy, Monthly Revenue, Est. Payout) |
| 28 | **My Properties** | Property list with occupancy, revenue, tenant count; per-property breakdown |
| 29 | **Financials** | Revenue vs. expense breakdown by property; income/expense categorization |
| 30 | **Tenancy Overview** | Filtered tenant list for landlord's properties only; data isolation enforced |
| 31 | **Maintenance Log** | Filtered maintenance tickets for landlord's properties only |
| 32 | **Payouts** | Payout history and estimates |
| 33 | **Reports** | Owner monthly report (Homelette-style) with per-property income, expenses, net rental; revenue report; occupancy report; auto-generated monthly records (last 6 months) |

### 2.5 Vendor Portal

| # | Feature | Description |
|---|---------|-------------|
| 34 | **Vendor Dashboard** | Active jobs, pending invoices, schedule overview |
| 35 | **Work Orders** | Assigned work orders with status tracking |
| 36 | **Invoices & Payments** | Submit and track vendor invoices; payment history |
| 37 | **Company Profile & Reviews** | Profile management; star ratings and reviews |

### 2.6 Agent Portal

| # | Feature | Description |
|---|---------|-------------|
| 38 | **Agent Dashboard** | Lead pipeline overview, listings, viewing schedule |
| 39 | **Leads Management** | Personal lead list with status pipeline |
| 40 | **Available Listings** | Browse available rooms across properties |
| 41 | **Viewings & Applications** | Viewing scheduler; application tracking |
| 42 | **Commission & Performance** | Commission tracking; performance metrics |

### 2.7 Cross-Cutting Features

| # | Feature | Description |
|---|---------|-------------|
| 43 | **Utility Bill Engine** | Auto-generate bills from electric + water sub-meter readings; TNB tariff calculation; per-room billing |
| 44 | **Smart Lock Integration Layer** | Fingerprint auto-disable on lease end; lock/unlock control; battery monitoring; firmware tracking |
| 45 | **Electric Sub-Meter System** | Per-room meters with auto-disconnect 7 days after overdue; manual cut/reconnect; auto-reconnect on payment |
| 46 | **Water Sub-Meter System** | Per-room water meters with usage tracking |
| 47 | **Check-In/Check-Out System** | Photo evidence documentation for unit condition during tenant transitions; inspector assignment; notes |
| 48 | **Photo Attachment System** | Upload photos to maintenance tickets and check-in/out records; preview; remove |
| 49 | **Data Isolation** | Tenants see only their own data; landlords see only their properties; operators see everything |
| 50 | **Print & Export** | CSV export for tenants, landlords, bills; print-ready reports with proper formatting |
| 51 | **Modal System** | Full-featured modal framework (sm/default size) with headers, body, footers; toast notifications |
| 52 | **Responsive Design** | Mobile-friendly sidebar, mobile menu, responsive grids and tables |

---

## 3. Pricing

### 3.1 Initial Development Fee

| Item | Description | Amount (RM) |
|------|-------------|-------------|
| **Platform Architecture** | SPA framework, routing, role system, responsive design, modal/toast system | 4,000 |
| **Operator Portal** | Dashboard, property/tenant/landlord/contract/billing/maintenance/vendor/IoT/leads/community/AI/automation/reports/settings — 15 modules | 12,000 |
| **Tenant Portal** | Dashboard, My Unit, Bills, Contract, Maintenance, Smart Access, Utilities, Community/Events/Marketplace — 9 modules | 5,500 |
| **Landlord Portal** | Dashboard, Properties, Financials, Tenancy, Maintenance Log, Payouts, Reports — 7 modules | 5,000 |
| **Vendor Portal** | Dashboard, Work Orders, Schedule, Invoices, Payments, Profile, Reviews — 7 modules | 3,500 |
| **Agent Portal** | Dashboard, Leads, Listings, Viewings, Applications, Commission, Performance — 7 modules | 3,500 |
| **IoT & Smart Lock Integration** | Lock registry, fingerprint manager, auto-disable, battery monitoring, lock/unlock control | 3,000 |
| **Electric & Water Sub-Meter System** | Per-room metering, auto-generate bills, auto-disconnect/reconnect, TNB tariff calculation | 3,000 |
| **Utility Bill Engine** | Multi-type billing (electric, water, internet, sewerage), per-room breakdown, tenant view | 2,000 |
| **Automation Engine** | 6+ automated workflows (report, TA, smart lock, electric cut, utility bills, owner report) | 2,500 |
| **AI Chatbot / Insights** | 13+ response categories, natural language interface, contextual suggestions | 2,000 |
| **Check-In/Out & Photo System** | Photo evidence, inspector flow, per-record photo management | 1,500 |
| **Report Generator** | Auto portfolio report, owner report (Homelette-style), revenue/occupancy reports, CSV/print export | 2,000 |
| **Data Layer & CRUD** | Full data model, CRUD modals, validation, data isolation per role | 2,000 |
| **UI/UX Design & Styling** | Custom CSS design system, color theming, responsive layout, icon system | 2,000 |
| | | |
| **Subtotal (Development)** | | **RM 51,500** |
| | | |
| **Hosting Setup (1st Year Included)** | GitHub Pages (free static hosting), custom domain setup, SSL certificate | **Free** |
| | | |
| **Total Initial Fee** | | **RM 51,500** |

> **Note:** Current deployment uses GitHub Pages (free hosting). If a backend server with database is required in the future (e.g., Node.js + PostgreSQL on cloud), hosting costs will be quoted separately (estimated RM 100–300/month depending on provider and scale).

---

### 3.2 Monthly Maintenance Fee

| Tier | Scope | Monthly Fee (RM) |
|------|-------|-----------------|
| **Basic** | Bug fixes, security patches, minor UI adjustments, server monitoring | **RM 800** |
| **Standard** | Basic + performance optimization, data backup, monthly health report, 2 minor feature tweaks | **RM 1,500** |
| **Premium** | Standard + priority support (24h response), analytics review, unlimited minor tweaks, 1 consultation call/month | **RM 2,500** |

> Maintenance contract is billed monthly with 30-day cancellation notice.

---

### 3.3 Feature Addition / Enhancement Fee

| Category | Estimated Timeframe | Fee (RM) |
|----------|-------------------|----------|
| **Minor Enhancement** (UI tweak, button change, text update, style adjustment) | 1–2 hours | **RM 200 – 500** |
| **Small Feature** (new modal, new data field, new filter/sort, new export format) | 2–8 hours | **RM 500 – 1,500** |
| **Medium Feature** (new page/module, new role capability, new integration point, new report type) | 1–3 days | **RM 1,500 – 4,000** |
| **Large Feature** (new portal/role, backend API integration, payment gateway, SMS/email notifications, external API) | 3–10 days | **RM 4,000 – 12,000** |
| **Major Module** (mobile app, full backend with database, third-party IoT hardware integration, multi-language support) | 2–6 weeks | **RM 12,000 – 35,000** |

> All feature additions will receive a specific quotation with fixed price after requirement discussion. Hourly rate for ad-hoc work: **RM 150/hour**.

---

## 4. Project Timeline (Completed)

| Phase | Duration | Status |
|-------|----------|--------|
| Architecture & Role System | Week 1 | ✅ Complete |
| Operator Portal (Core) | Week 1–2 | ✅ Complete |
| Tenant & Landlord Portals | Week 2–3 | ✅ Complete |
| Vendor & Agent Portals | Week 3 | ✅ Complete |
| IoT, Metering & Automation | Week 3–4 | ✅ Complete |
| AI Insights & Reports | Week 4 | ✅ Complete |
| UI Polish & Testing | Ongoing | ✅ Current |

---

## 5. Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| Styling | Custom CSS Design System with CSS Variables |
| Icons | Font Awesome 6 |
| Charts | Chart.js |
| Hosting | GitHub Pages (static) |
| Version Control | Git + GitHub |
| Server (Dev) | Node.js (Express) — localhost:3456 |

---

## 6. Deliverables

- ✅ Fully functional 5-role co-living management platform
- ✅ 52+ features across Operator, Tenant, Landlord, Vendor, and Agent portals
- ✅ Responsive design (desktop + mobile)
- ✅ AI-powered chatbot with 13+ knowledge categories
- ✅ 6+ automated workflows
- ✅ IoT smart lock and electric/water sub-meter management
- ✅ Auto-generated reports (portfolio, owner, revenue, occupancy)
- ✅ Source code on GitHub
- ✅ Live deployment on GitHub Pages

---

## 7. Terms & Conditions

1. **Payment Terms:** 50% upfront upon acceptance, 50% upon delivery and sign-off.
2. **Revision Rounds:** Up to 3 rounds of revisions included in the initial development fee.
3. **Intellectual Property:** Full ownership of source code transfers to client upon final payment.
4. **Warranty:** 30-day bug-fix warranty after delivery at no extra cost.
5. **Confidentiality:** All project data and business logic treated as confidential.
6. **Hosting:** Client is responsible for ongoing hosting costs (if migrating from free GitHub Pages to paid cloud hosting in the future).

---

## 8. Acceptance

| | |
|---|---|
| **Client Signature:** | _________________________ |
| **Name:** | _________________________ |
| **Date:** | _________________________ |
| | |
| **Developer Signature:** | _________________________ |
| **Name:** | _________________________ |
| **Date:** | _________________________ |

---

*This quotation is confidential and intended solely for the recipient. Pricing is valid for 30 days from the issue date.*
