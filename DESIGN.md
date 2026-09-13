---
name: order_sys
description: A highly secure, realtime POS ordering system.
colors:
  primary: "#E5BDDF"
  background: "#1D1D1D"
  neutral-text: "#E2E8F0"
  muted-text: "#64748B"
  warning: "#FFB800"
  critical: "#FF1744"
  border: "#333333"
typography:
  sans:
    fontFamily: "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif"
  display:
    fontFamily: "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif"
  mono:
    fontFamily: "var(--font-plex-mono), ui-monospace, monospace"
rounded:
  none: "0px"
spacing:
  panel: "16px"
components:
  siem-panel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.none}"
---

# Design System: order_sys

## Overview

**Creative North Star: "The Cyber Security Operations Center (SOC)"**

A hyper-focused, tactical command center with high-contrast data visualization. The interface prioritizes immediate data legibility over unnecessary decorations. It strictly adheres to a dark, tactical aesthetic that feels solid and secure. 

**Key Characteristics:**
- Tactical and precise
- High-contrast, strictly functional
- Dark mode primary

## Colors

A highly contrasting palette emphasizing legibility and urgency against a jet-black background.

### Primary
- **Orchid** (#E5BDDF): Used for key accents, active states, and tactical holographic projections that draw immediate attention.

### Neutral
- **Jet Black** (#1D1D1D): The deep, flat, utilitarian background that grounds the entire application.
- **Silver** (#E2E8F0): The primary text color for data legibility.
- **Slate** (#64748B): Used for secondary text and disabled states.
- **Border** (#333333): Used to demarcate panels.

### System
- **Warning** (#FFB800): Used for alerts needing attention but not immediate action.
- **Critical** (#FF1744): Used for severe alerts (e.g., rate-limit triggers).

**The Tactical Contrast Rule.** Color is reserved for meaning. Large surfaces remain completely neutral; the Orchid accent is used sparingly to draw the eye to interactive or changing data.

## Typography

**Display Font:** IBM Plex Sans (with fallback)
**Body Font:** IBM Plex Sans (with fallback)
**Label/Mono Font:** IBM Plex Mono (with fallback)

**Character:** Technical, crisp, and highly legible. Monospace fonts are used for data and telemetry to emphasize precision.

### Hierarchy
- **Display**: For section headers and major counters. Uses IBM Plex Sans for a unified technical feel.
- **Body**: For general prose and interface text. Uses IBM Plex Sans for high legibility with a technical grounding.
- **Label / Data**: For logs, metrics, and technical readouts. Uses IBM Plex Mono.

**The Telemetry Rule.** Any changing numerical data, logs, or IDs must use the monospace font for tabular alignment and immediate tactical scanning.

## Elevation & Depth

Surfaces are mostly flat, using borders and glassmorphism for structure, while shadows are exclusively reserved for interactive glows.

### Shadow Vocabulary
- **Interactive Glow** (`box-shadow: 0 0 16px rgba(229, 189, 223, 0.15)`): Appears only on hover/focus to indicate interactivity.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, focus) in the form of neon glows.

## Components

### Tactical Panels (siem-panel)
- **Shape:** Square corners (0px radius) with sharp borders.
- **Background:** Semi-transparent glassmorphism over the Jet Black background.
- **Hover / Focus:** Interactive panels gain an Orchid glow and shifted border color on hover.

## Do's and Don'ts

### Do:
- **Do** use IBM Plex Mono for all changing metrics, IDs, and logs.
- **Do** apply the Orchid accent strictly to interactive or high-priority states.

### Don't:
- **Don't** use heavy drop shadows for structural depth.
- **Don't** use border radiuses on tactical panels.
