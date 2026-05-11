# 🛡️ Agentic Insurance Workflow Orchestration
## Final Year Project (PFE) — Frontend Documentation

> Intelligent insurance workflow orchestration platform powered by AI agents, built with **Angular + TypeScript** on the frontend and **Spring AI / LangChain4j** on the backend.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Tech Stack & Dependencies](#4-tech-stack--dependencies)
5. [Functional Modules](#5-functional-modules)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Variables](#7-environment-variables)

---

## 1. Project Overview

This Final Year Project aims to design and develop an **agentic platform** capable of automatically orchestrating business workflows in the insurance domain, powered by AI agents built with **Spring AI** and **LangChain4j**.

The Angular frontend provides a modern user interface enabling:

- Monitoring and triggering insurance workflows (claims, policies, consultations, decisions)
- Interacting with the **InsurFlow** conversational AI agent
- Managing clients, experts, agents, and claims
- Visualizing real-time dashboards and statistics
- Reviewing and correcting AI decisions — **Human-in-the-loop**

---

## 2. Frontend Architecture

```
Client (Angular 17+ — SSR enabled)
│
├── core/auth            → JWT authentication service (auth.service.ts)
│
├── features/            → Business modules (lazy-loaded, feature-based)
│   ├── agents           → AI agent results (agent-result-list)
│   ├── ai-settings      → LLM model configuration (parametres-ia)
│   ├── assistant        → InsurFlow AI chat (insurflow-assistant)
│   ├── auth/login       → User authentication
│   ├── claims           → Claims management (files, reports, feedback)
│   ├── clients          → Client space and policyholder list
│   ├── dashboard        → KPI dashboard
│   ├── decisions        → AI consultation decisions
│   ├── experts          → Expert workspace and feedback forms
│   ├── home             → Insurance platform home
│   └── policies         → Insurance policy management
│
├── layout/              → Sidebar and Topbar (global navigation)
│
└── app.*                → Root component, routes, SSR config
```

---

## 3. Folder Structure

```
src/
├── app/
│   │
│   ├── core/
│   │   └── auth/                             # Central authentication layer
│   │       └── auth.service.ts               # JWT service: login, logout, token management
│   │
│   ├── features/
│   │   │
│   │   ├── agents/                           # Module: AI Agents
│   │   │   ├── data-access/                  # Agent API services & HTTP calls
│   │   │   ├── models/                       # TypeScript interfaces for agents
│   │   │   └── pages/
│   │   │       └── agent-result-list/        # Displays results produced by AI agents
│   │   │
│   │   ├── ai-settings/                      # Module: AI Settings
│   │   │   ├── data-access/                  # AI configuration API services
│   │   │   └── pages/
│   │   │       └── parametres-ia/            # LLM model configuration page
│   │   │
│   │   ├── assistant/                        # Module: AI Assistant (InsurFlow)
│   │   │   ├── data-access/                  # Services: send/receive AI messages
│   │   │   └── pages/
│   │   │       └── insurflow-assistant/      # Chat interface with LangChain4j agent
│   │   │
│   │   ├── auth/
│   │   │   └── login/                        # User login page
│   │   │
│   │   ├── claims/                           # Module: Claims Management
│   │   │   ├── claim-types/                  # Claim type enums & constants
│   │   │   ├── data-access/                  # Claims API services & HTTP calls
│   │   │   ├── models/                       # TypeScript interfaces for claims
│   │   │   └── pages/
│   │   │       ├── admin-claim-reports/      # Admin-side claims reports
│   │   │       ├── claim-report-page/        # Individual claim report page
│   │   │       ├── claims-home/              # Claims module home page
│   │   │       ├── dossier-sinistre/         # Full claim file detail view
│   │   │       └── feedback-claims-list/     # Feedback list for processed claims
│   │   │
│   │   ├── clients/                          # Module: Clients / Policyholders
│   │   │   ├── data-access/                  # Client API services & HTTP calls
│   │   │   └── pages/
│   │   │       ├── client-list/              # Paginated list of all clients
│   │   │       └── client-space/             # Personal space of a policyholder
│   │   │
│   │   ├── dashboard/                        # Module: Dashboard
│   │   │   ├── models/                       # TypeScript interfaces for KPIs & stats
│   │   │   └── pages/
│   │   │       └── dashboard/                # Main dashboard page
│   │   │
│   │   ├── decisions/                        # Module: AI Decisions
│   │   │   └── pages/
│   │   │       └── consultation-decisions/   # Review & validation of AI decisions
│   │   │
│   │   ├── experts/                          # Module: Experts
│   │   │   ├── data-access/                  # Expert API services & HTTP calls
│   │   │   ├── models/                       # TypeScript interfaces for experts
│   │   │   └── pages/
│   │   │       ├── expert-feedback-form/     # Expert feedback submission form
│   │   │       └── expert-space/             # Expert workspace
│   │   │
│   │   ├── home/                             # Module: Home
│   │   │   └── pages/
│   │   │       └── insurance-home/           # Insurance platform home page
│   │   │
│   │   └── policies/                         # Module: Insurance Policies
│   │       ├── data-access/                  # Policy API services & HTTP calls
│   │       └── pages/
│   │           ├── polices/                  # Policy detail & management
│   │           └── policy-list/              # Full list of insurance contracts
│   │
│   ├── layout/                               # Global layout components
│   │   ├── sidebar/                          # Main navigation sidebar
│   │   └── topbar/                           # Top bar (user profile, notifications)
│   │
│   ├── app.component.ts                      # Root Angular component
│   ├── app.component.html                    # Root HTML template
│   ├── app.component.css                     # Root component styles
│   ├── app.component.spec.ts                 # Root component unit tests
│   ├── app.config.ts                         # Main app configuration (providers, DI)
│   ├── app.config.server.ts                  # SSR configuration (Server-Side Rendering)
│   └── app.routes.ts                         # Application route definitions
│
├── assets/                                   # Static resources (images, icons, fonts)
├── favicon.ico                               # Application icon
├── index.html                                # Main HTML entry point
├── main.ts                                   # Angular bootstrap (client mode)
├── main.server.ts                            # Angular bootstrap (SSR mode)
└── styles.css                                # Global application styles
```

---

## 4. Tech Stack & Dependencies

| Technology | Version | Role |
|---|---|---|
| Angular | 17+ | Main frontend framework |
| TypeScript | 5.x | Development language |
| Angular Material | 17+ | UI component library |
| RxJS | 7.x | Reactive programming |
| Angular SSR | 17+ | Server-Side Rendering |
| CSS / SCSS | — | Component styling |
| Chart.js / ApexCharts | — | Dashboard charts & KPIs |
| HttpClient | Built-in | REST API calls to Spring Boot |
| JWT Interceptor | Custom | Automatic auth token injection |

---

## 5. Functional Modules

###  Core / Auth
`auth.service.ts`: central service handling login, logout, JWT token storage and renewal. Used by route guards and HTTP interceptors across the application.

###  Assistant — InsurFlow (`insurflow-assistant`)
Chat interface for interacting with the LangChain4j-orchestrated AI agent. Supports multi-turn conversations and displays the agent's chain-of-thought reasoning. The `data-access/` folder manages message sending and receiving through the API.

###  AI Settings — `parametres-ia`
Configuration page for LLM models: temperature, model selection, system prompts. API configuration calls are isolated in `data-access/`.

###  Dashboard
Real-time business KPIs: active claims, active policies, AI agent automated processing rate. Data interfaces are defined in `models/`.

###  Claims Management
Full-featured module with 5 pages: `claims-home` (entry point), `dossier-sinistre` (full claim detail), `admin-claim-reports` (admin reports), `claim-report-page` (individual report), `feedback-claims-list` (processed claim feedback). Includes `claim-types`, `models` and `data-access`.

###  Clients
`client-list`: paginated list of all policyholders. `client-space`: personal space for a client with full history of their policies and claims.

###  Agents
`agent-result-list`: displays the actions and outputs automatically produced by Spring AI agents following workflow orchestration.

###  Policies
`polices`: individual policy detail and management. `policy-list`: full list view of all insurance contracts. API calls are handled in `data-access/`.

###  Decisions — Consultation Decisions
`consultation-decisions`: interface for human review and validation of AI-automated decisions. Ensures regulatory compliance through a **Human-in-the-loop** mechanism.

### Experts
`expert-space`: expert workspace with assigned claim files. `expert-feedback-form`: form for submitting an expert evaluation report on a complex claim.

###  Home — Insurance Home
Platform home page: activity summary, quick access to modules, and notifications for ongoing workflows.

###  Layout — Sidebar & Topbar
`sidebar`: main navigation menu between modules. `topbar`: top bar with user profile management and notifications.

---

## 6. Installation & Setup

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | >= 18.x |
| npm | >= 9.x |
| Angular CLI | >= 17 |

```bash
npm install -g @angular/cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>/frontend

# Install project dependencies
npm install
```

### Development Server

```bash
ng serve
# Available at http://localhost:4200
```

### SSR Mode

```bash
npm run dev:ssr
# Available at http://localhost:4200
```

### Production Build

```bash
ng build --configuration production
# Output files in dist/
```

### Tests

```bash
ng test    # Unit tests
ng e2e     # End-to-end tests
```

---

## 7. Environment Variables

`src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  aiAgentUrl: 'http://localhost:8080/api/agent',
  wsUrl:      'ws://localhost:8080/ws',
};
```

`src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-domain.com/api',
  aiAgentUrl: 'https://your-domain.com/api/agent',
  wsUrl:      'wss://your-domain.com/ws',
};
```

---

*Final Year Project — Academic Year 2024/2025*
