Here's the full context from our conversation, that generated the base_designs:

---

# NeoCom — Website Planning Context

## Startup Identity
- **Name:** NeoCom
- **Domain:** neocom.cloud
- **Tagline concept:** "Inovacao em comunicacoes"
- **Category:** Communications / Tech startup

## Design Direction
- **Style inspiration:** Netflix early days — futuristic, minimalist, practical, addictive
- **Hero element:** Floating icon (gentle up/down animation)
- **Hero text:** Morphing/typewriter style, cycling through words
- **Layout sketch:** Icon → headline → projects/mission/values below → bottom nav-style cards

## Visual Identity
- **Logo asset:** `NeoCom_Icon_Final_v1.svg` — a cyan-teal cloud with circuit board lines and a glowing drop shadow. SVG with gradients from `#00F0F3` → `#037494`, border stroke `#06CFE3` → `#035E79`
- **Color palette:**
  - Dark theme: deep navy `#060a10`, accent cyan `#06cfe3`
  - Light theme: white `#ffffff`, surface `#f5f7fa`, accent petrol `#037494`
- **Themes:** Two — dark (primary) and light (secondary), toggle TBD

## Morphing Text Phrases
Cycles through: *comunicações, privacidade, sustentabilidade, comunidade, tecnologia ética, confiança digital*

## Core Values / Pillars
- Privacidade
- Segurança
- Confiabilidade
- Comprovabilidade
- Comunidade
*(others TBD)*

## Projects

### NeoRecicla
- **Color:** Green
- **Focus:** Sustainability
- **Description:** Automatic waste collection machines in universities, rewarding users with recycling points, with all transactions verified on blockchain

### DevRecord
- **Color:** Cyan
- **Focus:** Technology / Developer identity
- **Description:** Immutable source of truth for developer production history, independent of centralized code hosting platforms

### Neo Health
- **Color:** Amber
- **Status:** Concept
- **Focus:** Personal health / tracking
- **Description:** Personal health information tracker to centralize history, metrics, and important data under user control

## Target Audience
- All of the above (investors, developers, B2B, B2C) — no single defined audience yet, product is broadly innovative

## Site Functionality
- Static multi-page site
- Landing page plus project detail subpages
- Blog / updates navigation hidden until real content exists
- No login or user area yet

## Mission Statement (draft)
> "A NeoCom nasceu da crenca de que tecnologia so tem valor quando serve as pessoas, com transparencia, etica e respeito a privacidade. Cada projeto e uma resposta direta a um problema real, construida com a comunidade, para a comunidade."

## Current Delivery Decisions
- Vite + React multi-page static build
- GitHub Pages for hosting with custom domain on neocom.cloud
- pt-BR and en locales at launch
- Root route auto-redirect based on browser locale with manual override
- Dedicated contact surface via contato@neocom.cloud
