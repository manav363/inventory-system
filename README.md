# 📦 Inventory SyncPulse
### Modern Real-Time Inventory Management System

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7.13-CA4245?style=flat&logo=reactrouter&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat)
![Recharts](https://img.shields.io/badge/Recharts-3.7-8851C1?style=flat&logo=recharts&logoColor=white)

> A production-ready inventory management system for real-time tracking, analytics, and decision-making. Upload data from Excel, visualize metrics with interactive charts, and manage stock levels through an intuitive web dashboard.

---

## 🚀 Quick Start

### Installation & Setup
```bash
# Clone and install
git clone <repository-url>
cd inventory-system
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

---

## 🎯 What This System Does

Inventory management requires **real-time visibility** into stock levels, trends, and anomalies. This system provides exactly that.

- **Ingests** inventory data from Excel files (XLSX format)
- **Stores** data efficiently using React Context (in-memory state management)
- **Visualizes** metrics through interactive charts powered by Recharts
- **Tracks** inventory levels across categories
- **Provides** a responsive, modern UI with Tailwind CSS
- **Routes** between Dashboard, Inventory, and Settings pages
- **Persists** configurations through Settings page

---

## 🏗 System Architecture

```
Excel Upload (XLSX)
        ↓
    Data Parsing
(useInventory hook)
        ↓
  Context Storage
(InventoryContext)
        ↓
    Routing Layer
(React Router v7)
        ↓
   Three Page Views
├─ Dashboard (Metrics)
├─ Inventory (Data)
└─ Settings (Config)
        ↓
  Interactive Charts
  (Recharts)
        ↓
  Responsive UI
  (Tailwind CSS)
```

---

## 📐 Project Structure

```
inventory-system/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   └── UploadScreen.jsx         # Excel file upload interface
│   │
│   ├── context/
│   │   └── InventoryContext.jsx     # React Context for state
│   │
│   ├── hooks/
│   │   └── useInventory.js          # Custom inventory hook
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx            # Metrics & overview
│   │   ├── Inventory.jsx            # Item listing & management
│   │   └── Settings.jsx             # Configuration
│   │
│   ├── assets/                      # Static assets
│   ├── App.jsx                      # Main app with routing
│   ├── main.jsx                     # Entry point
│   ├── App.css                      # Component styles
│   └── index.css                    # Global styles
│
├── public/                          # Static files
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind setup
├── postcss.config.js                # PostCSS setup
├── eslint.config.js                 # Linting rules
├── package.json                     # Dependencies
└── README.md
```

---

## 💻 Feature Overview

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Real-time metrics, key KPIs, trend visualization |
| 📁 **Inventory Management** | Browse, search, organize, and manage stock items |
| 📤 **Excel Import** | One-click upload of XLSX inventory files |
| 📈 **Data Visualization** | Interactive charts and graphs using Recharts |
| ⚙️ **Settings** | Configurable application preferences |
| 🎨 **Responsive UI** | Mobile-friendly design with Tailwind CSS |
| ⚡ **Fast Performance** | Vite HMR for instant reload during development |

---

## 🛠 Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint on codebase |
| `npm run preview` | Preview production build locally |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 |
| **Build Tool** | Vite 7.3 |
| **Styling** | Tailwind CSS 4.1 |
| **Routing** | React Router v7 |
| **State Management** | React Context API |
| **Data Visualization** | Recharts 3.7 |
| **File Handling** | XLSX 0.18 |
| **Icons** | Lucide React |
| **Utilities** | clsx, tailwind-merge |
| **Linting** | ESLint 9 |
| **Package Manager** | npm |

---

## 📋 Data Flow

1. User clicks **upload button** on UploadScreen
2. Selects **XLSX file** and submits
3. Data is **parsed** using the `useInventory` hook
4. State is stored in **InventoryContext**
5. **Dashboard** renders metrics from context
6. **Inventory page** displays detailed item list
7. **Settings page** allows configuration updates

---

## 🎨 UI Components

### UploadScreen
- Drag-and-drop file upload
- Excel file validation
- Progress indication
- Error handling

### Sidebar
- Navigation menu
- Active page indicator
- Icon-based navigation

### Dashboard
- Key performance indicators (KPIs)
- Trend charts
- Summary statistics

### Inventory Page
- Sortable data table
- Search/filter functionality
- Item details view

### Settings
- Configuration options
- Preference storage
- System settings

---

## ⚙️ Configuration

Configuration is managed through React Context with optional localStorage persistence:

```javascript
// Example: useInventory hook usage
const { 
  items,
  categories,
  updateItem,
  addItem,
  removeItem,
  isLoaded 
} = useInventory();
```

---

## 📌 Known Limitations

- **In-memory storage** — Data is lost on refresh (no backend persistence)
- **Single source** — Excel-only import (no API integration)
- **No authentication** — Suitable for single-user/local use only
- **Browser-based** — No server-side processing or backup

These are intentional design simplifications for a lightweight system.

---

## 🔮 Roadmap

- [ ] Backend API with persistent database (MongoDB/PostgreSQL)
- [ ] User authentication & multi-user support
- [ ] Real-time data sync across multiple devices
- [ ] Advanced filtering and export capabilities
- [ ] Mobile app version (React Native)
- [ ] Cloud deployment (Vercel/Netlify)
- [ ] Email notifications & alerts
- [ ] CSV/PDF export functionality

---

## ⚠️ Disclaimer

This project is for **demonstration and educational purposes**. Use in production environments at your own discretion. Data is not persisted beyond browser sessions by default.

---

## 👤 Author & Credits

Built with React, Vite, and Tailwind CSS for modern web inventory management.

For questions or contributions, feel free to open an issue or submit a pull request.

