# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
1. **Customers**: Cafe patrons using their mobile devices to scan QR codes at their tables to place anonymous orders (guest sessions).
2. **Store Owner & Staff**: Cafe employees using mobile phones or tablets in a fast-paced environment to manage incoming orders, track table status, and update menu stock.
3. **Super Admin / Security Ops**: System administrators using a desktop interface to monitor security logs, manage stores, and oversee system telemetry.

## Product Purpose
A fast, secure QR code-based cafe and beverage ordering system. It enables customers to order seamlessly with Pay-now (VietQR) or Pay-later options, provides cafe staff with real-time order tracking and audio alerts, and gives administrators a secure, SOC/SIEM-styled dashboard for system monitoring.

## Positioning
A highly secure, realtime POS ordering system featuring a unique 2-layer defense mechanism against ghost ordering and replay attacks, coupled with a distinct SIEM/SOC-styled administrative interface and immediate audio/visual feedback for on-the-floor staff.

## Operating Context
- **Customers**: Sitting at cafe tables, using varied mobile devices and network conditions, expecting a zero-friction ordering process without needing to register.
- **Staff**: Operating in a busy, noisy cafe environment where they rely on clear visual cues (Kanban/Table map) and real-time audio alerts to avoid missing orders.
- **Admin**: Remote monitoring of system health, security events, and rate-limiting triggers.

## Capabilities and Constraints
- **Stack**: Next.js 15 App Router, TypeScript Strict Mode, Tailwind CSS, Shadcn UI, and Supabase (SSR & Realtime).
- **Functionality**: VietQR integration via SePay/Casso webhooks, dual-view staff dashboard (Kanban & Table Grid), Web Audio API for staff alerts.
- **Constraints**: 
  - Rate limiting enforced (e.g., max 2 orders/10 mins, order value caps).
  - Admin dashboard must strictly adhere to a specified SIEM/SOC color palette (e.g., `#0A0F1D`, `#00E5FF`) and typography (Rajdhani, JetBrains Mono, Inter).

## Brand Commitments
Specific brand assets (e.g., logos, brand name) and voice guidelines are pending and will be provided by the user later. Until then, the system will use placeholder branding that fits the established UI themes.

## Evidence on Hand
- `supabase/seed.sql` provides sample data including a cafe clone (Highlands/The Coffee House style), 8 tables, and 12 beverage items.
- No fabricated customer testimonials or unverified claims should be used.

## Product Principles
1. **Zero-Friction Access**: Customers must be able to order instantly via QR scan without account creation hurdles.
2. **Operational Certainty**: Staff must have immediate, undeniable feedback (realtime audio and UI updates) for every new order.
3. **Defense in Depth**: Security is visible and active, blocking abuse (ghost orders, rate abuse) while providing SIEM-grade visibility to admins.

## Accessibility & Inclusion
Standard web best practices are sufficient; no strict WCAG AA/AAA compliance is mandated.
