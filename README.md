# Guided Scoping & Estimation Tool

A React-based application for project scoping and development time estimation with pre-configured templates.

## Prerequisites

- Node.js (version 16 or higher)
- npm

## Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/guided-scoping.git
   cd guided-scoping
   npm install
   ```

2. **Configure environment (optional)**
   ```bash
   cp env.example .env.local
   # Edit .env.local to set VITE_APPS_SCRIPT_URL for Google Slides export
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser** to `http://localhost:5173`

## Build for Production

```bash
npm run build
npm run preview
```

## Usage

- **Users**: Select template → Choose profile size → Customize scope → Save project
- **Admins**: Use Admin Panel to create and manage project templates 