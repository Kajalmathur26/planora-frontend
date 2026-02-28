# Planora — Digital Planner & Journal

> A modern, intelligent digital planner and journaling app powered by React + Gemini AI

## 🌟 Project Description

Planora is a full-featured personal productivity platform that combines task management, calendar, journaling, goal tracking, habit building, and mood logging into one beautiful dark-themed interface. Powered by Google Gemini AI for smart insights and suggestions.

## ✨ Features

- 📅 **Interactive Calendar** — Monthly view, create/delete events, color-coded scheduling
- ✅ **Task Management** — Kanban board (To Do / In Progress / Done), categories, priorities, due dates
- 📓 **Daily Journal** — Rich text writing, AI-generated prompts, mood tagging, date filtering
- 🎯 **Goal Tracking** — Visual progress bars, milestones, AI goal suggestions
- 🔥 **Habit Tracker** — Daily check-ins, streak tracking, 7-day visual calendar
- 💙 **Mood Tracker** — 1-10 scoring, emotion tags, 30-day trend charts
- 🤖 **AI Assistant (Plora)** — Gemini-powered chat, productivity analysis, journal prompts
- 📊 **Dashboard** — Unified overview of all your data with charts
- 🎨 **Theme Customizer** — Dark/Light mode, accent color selection

## 🛠️ Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS** — Styling
- **ShadCN UI** — Component primitives (Radix UI)
- **Axios** — API communication
- **React Router DOM** — Navigation
- **Recharts** — Data visualization
- **date-fns** — Date utilities
- **react-hot-toast** — Notifications

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       └── Layout.jsx
├── pages/
│   ├── DashboardPage.jsx
│   ├── TasksPage.jsx
│   ├── JournalPage.jsx
│   ├── CalendarPage.jsx
│   ├── GoalsPage.jsx
│   ├── HabitsPage.jsx
│   ├── MoodPage.jsx
│   ├── AIAssistantPage.jsx
│   ├── SettingsPage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── context/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── services/
│   ├── api.js
│   └── index.js
└── App.jsx
```

## 🚀 Installation

```bash
# Clone the repository
git clone <your-frontend-repo-url>
cd planora-frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your backend API URL to VITE_API_URL

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Environment Variables

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_APP_NAME=Planora
```

## 🔑 Demo Credentials

```
Email: demo@planora.app
Password: demo1234
```

## 🔗 Links

- **Live Demo**: [https://planora-app.netlify.app](https://planora-app.netlify.app)
- **Backend API**: [https://planora-api.onrender.com](https://planora-api.onrender.com)
- **Video Walkthrough**: [YouTube Link]

## ☁️ Deployment (Netlify)

1. Push code to GitHub
2. Connect repo to [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_URL` in Netlify dashboard
6. Add `_redirects` file: `/* /index.html 200`
7. Deploy!
