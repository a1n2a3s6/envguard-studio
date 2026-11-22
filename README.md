<div align="center">

# 🛡️ EnvGuard Studio

### 100% Local-First `.env` Secrets Auditor, Env Diff Checker & Type-Safe Schema Generator

*Catch leaked API keys, prevent `VITE_` / `NEXT_PUBLIC_` client-bundle exposures, diff `.env.local` vs `.env.production`, sanitize `.env.example`, and generate Zod & TypeScript env schemas — all offline in your browser.*

<p>
  <img src="https://img.shields.io/badge/365%20Days%20Challenge-Day%208%2F365-10B981?style=for-the-badge" alt="Day 8/365" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20Offline%20%2F%20Zero%20Backend-059669?style=for-the-badge" alt="100% Offline" />
</p>

<p>
  <a href="https://github.com/a1n2a3s6/envguard-studio/stargazers">
    <img src="https://img.shields.io/github/stars/a1n2a3s6/envguard-studio?style=for-the-badge&color=F59E0B&logo=github" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/a1n2a3s6/envguard-studio/network/members">
    <img src="https://img.shields.io/github/forks/a1n2a3s6/envguard-studio?style=for-the-badge&color=06B6D4&logo=github" alt="GitHub Forks" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-6366F1?style=for-the-badge" alt="MIT License" />
</p>

<p>
  <a href="https://envguard-studio.vercel.app/"><strong>🚀 Live Demo</strong></a> •
  <a href="#-the-problem-it-solves"><strong>🎯 Why EnvGuard</strong></a> •
  <a href="#-key-features"><strong>✨ Features</strong></a> •
  <a href="#-how-it-works"><strong>🏗️ Architecture</strong></a> •
  <a href="#-quick-start"><strong>⚡ Quick Start</strong></a>
</p>

</div>

---

## 🎯 The Problem It Solves

Every developer has been burned by `.env` files at least once:
- Accidentally shipping a `NEXT_PUBLIC_` or `VITE_` secret key straight into the public frontend bundle.
- Pushing to production and crashing the app because one key in `.env.local` was missing from `.env.production`.
- Spending 20 minutes manually scrubbing secrets out of `.env` to update `.env.example` or hand-writing Zod validation schemas.

**EnvGuard Studio** fixes all of these in seconds — with **zero servers, zero analytics, and zero network requests**, so your secrets never leave your device.

| Capability | 🛡️ EnvGuard Studio | Manual `.env` Management |
| :--- | :---: | :---: |
| **Detects Leaked AWS / Stripe / OpenAI / GitHub / DB Secrets** | ✅ Instant | ❌ Easy to miss |
| **Catches `VITE_` & `NEXT_PUBLIC_` Client Exposure Bugs** | ✅ Automatic | ❌ Silent leak |
| **Side-by-Side `.env.local` vs `.env.production` Diff** | ✅ Visual | ❌ Error-prone |
| **1-Click Safe `.env.example` Sanitizer (Keeps Comments)** | ✅ Instant | ❌ Manual scrubbing |
| **Auto-Generates Zod (`env.ts`) & TypeScript (`env.d.ts`)** | ✅ 1-Click | ❌ Tedious boilerplate |
| **100% Client-Side Offline Privacy** | ✅ Zero Network | ✅ Local |

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🚨 Deep Secret & Leak Auditor</h3>
      <p>Scans for real-world credential patterns (OpenAI, Stripe, AWS, GitHub, Slack, JWTs, DB connection strings with passwords) and flags critical <code>NEXT_PUBLIC_</code> / <code>VITE_</code> secret exposure risks with a 0–100 Health Score.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🔀 Multi-Environment Diff Engine</h3>
      <p>Compare <code>.env.local</code> against <code>.env.production</code> or <code>.env.example</code> to immediately spot missing production variables, empty keys, and shadowed duplicates before deploying.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🧼 Smart `.env.example` Sanitizer</h3>
      <p>Automatically strips sensitive values into clean descriptive placeholders while preserving all comments, section headers, and safe non-secret defaults like <code>PORT</code> or <code>NODE_ENV</code>.</p>
    </td>
    <td width="50%" valign="top">
      <h3>⚡ Type-Safe Code Generators</h3>
      <p>Infers variable types (URL, Port, Number, Boolean, Email, Secret) and exports ready-to-paste <b>Zod schemas</b>, <b>TypeScript <code>env.d.ts</code></b>, and <b>Docker Compose</b> env blocks.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>👁️ Screen-Share Secret Masking</h3>
      <p>Toggle <b>Mask Secrets</b> with one click to blur sensitive values in the editor — safe for live demos, pair programming, and screen recordings.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🔒 Zero-Network Guarantee</h3>
      <p>Runs 100% locally in your browser's JavaScript engine. You can disconnect from the internet and EnvGuard Studio continues working without missing a beat.</p>
    </td>
  </tr>
</table>

---

## 🏗️ How It Works

```mermaid
flowchart LR
    A["📄 Drop or Paste .env Files\n(100% In-Browser Memory)"] --> B["⚙️ Custom .env Parser\n(Quotes • Comments • Line Map)"]
    B --> C["🛡️ Security & Lint Auditor\n(Secret Regex • Client Prefix Check)"]
    B --> D["🔀 Multi-Env Diff Engine\n(.env.local vs .env.production)"]
    B --> E["⚡ Type-Inference Engine\n(URL • Port • Bool • Secret)"]
    E --> F["🧼 Safe .env.example"]
    E --> G["📘 Zod env.ts & TS env.d.ts"]
    E --> H["🐳 Docker Compose Env"]

📂 Project Structure
Plaintext
envguard-studio/
├── src/
│   ├── types/
│   │   └── env.ts              # Domain models for parsed lines, audits & diffs
│   ├── engine/
│   │   ├── parser.ts           # Line-accurate .env parser
│   │   ├── auditor.ts          # Secret detector, client-prefix guard & linter
│   │   ├── differ.ts           # Two-environment comparison engine
│   │   └── generators.ts       # .env.example, Zod, TS env.d.ts & Docker codegen
│   ├── components/
│   │   ├── Header.tsx          # Brand bar, Offline Privacy badge & Sample loader
│   │   ├── EnvEditor.tsx       # Drag-and-drop editor with Secret Masking toggle
│   │   ├── AuditPanel.tsx      # 0–100 Health Gauge & actionable issue cards
│   │   ├── DiffPanel.tsx       # Side-by-side missing/changed key inspector
│   │   └── ExportPanel.tsx     # Tabbed code output with Copy & Download
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
---
⚡ Quick Start (Local Development)
Bash
# 1. Clone the repository
git clone [https://github.com/a1n2a3s6/envguard-studio.git](https://github.com/a1n2a3s6/envguard-studio.git)

# 2. Navigate into the directory
cd envguard-studio

# 3. Install dependencies
npm install

# 4. Run locally
npm run dev
☁️ One-Click Deploy
Host your own private instance on Vercel in seconds:

🗺️ Roadmap
[x] Real-time secret leak detection (AWS, Stripe, OpenAI, GitHub, Slack, JWT, DB URLs)

[x] NEXT_PUBLIC_ / VITE_ / REACT_APP_ client-bundle leak guard

[x] Side-by-side multi-environment diff checker

[x] Safe .env.example, Zod, TypeScript env.d.ts, and Docker Compose generators

[ ] Shannon entropy scanner for unknown custom API tokens

[ ] Export to Vercel CLI & GitHub Actions Secrets format

[ ] Companion npx envguard check CLI package

📄 License
Distributed under the MIT License. Free to use, modify, and self-host.

👨‍💻 Author & Connect
Built with passion by Anas Alhelaly — Day 8 of my 365 Projects in 365 Days GitHub Challenge

⭐ If EnvGuard Studio saved you from a .env bug or leaked key, give the repo a Star! ⭐
