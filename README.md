# 🌌 AetherRise: The AI-Powered Academic Research Engine

![CI](https://github.com/Priom-Das/AetherRise/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

**AetherRise** is a professional-grade AI-native research ecosystem designed for scholars, developers, and students. It bridges the gap between raw data collection and structured academic insight by treating research notes like version-controlled code.

🔗 **Live Demo:** https://aether-rise.vercel.app

---

## ✨ Core Features

### 🧠 Semantic AI Analysis
Beyond simple chat — AetherRise uses specialized prompts to analyze complex research queries, generating structured Markdown-ready insights via Gemini AI.

### 📷 Intelligent OCR Scanner
Integrated document scanning that allows users to capture physical text from books or handwritten notes and instantly convert them into digital research assets.

### 🎙️ Semantic Voice-to-Text
Hands-free research capture using a semantic-aware speech recognition interface, optimized for academic terminology.

### 📱 Enterprise PWA Experience
Fully installable on iOS, Android, and Desktop. Includes Service Worker integration for offline access to the Research Vault.

### 🔐 Multi-Modal Authentication
Secure access via **Google OAuth 2.0** and traditional Email/Password systems, managed by Supabase.

### 🐙 GitHub Sync
Every insight generated can be automatically pushed to a dedicated GitHub repository as a `.md` file, creating a permanent, version-controlled academic portfolio.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Frontend | React 19 + Tailwind CSS v4 + Framer Motion |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | Google Gemini AI |
| PWA | Serwist (Service Workers) |
| GitHub API | Octokit |

---

## 🛠 Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/Priom-Das/AetherRise.git
cd AetherRise
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GITHUB_PAT=your_github_personal_access_token
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺 Roadmap

### 🛠 Phase 1: Collaborative Research (Q3 2026)
- **Shared Vaults:** Multiple researchers contributing to the same project stream
- **Real-time Peer Review:** AI-driven critique before notes are committed to GitHub

### 📑 Phase 2: Citation & Reference Management (Q4 2026)
- **Auto-Citation:** Automatic IEEE, APA, and MLA citation generation
- **Zotero/Mendeley Integration:** One-click sync with reference managers

### 🧪 Phase 3: Aether Edge (2027)
- **Local LLM Support:** Optional Ollama integration for 100% data privacy
- **PDF Intelligence:** Direct "Chat with PDF" for uploaded research papers

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a PR.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.