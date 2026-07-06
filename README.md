# AlphaMind &mdash; Advanced Stock Intelligence & Fundamental Scoring Platform

![AlphaMind Banner](https://img.shields.io/badge/AlphaMind-AI%20Stock%20Intelligence-4F46E5?style=for-the-badge&logo=trendmicro&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS v4](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)

AlphaMind is an AI-powered quantitative and fundamental stock analysis platform designed for institutional-grade equity research on **NSE (National Stock Exchange)** and global markets. Combining real-time financial data feeds with multi-tier mathematical derivation models, AlphaMind delivers instant technical indicators, fundamental health scores, AI-driven portfolio recommendations, and automated executive PDF reports.

---

## 🌟 Key Features

### 📈 1. Multi-Tier Fundamental Scoring & ROE Derivation Engine
To solve common issues with rate-limited or incomplete free financial API feeds (such as `0.0%` Return on Equity defaults), AlphaMind implements a **6-Tier Derivation Engine**:
* **Tier 1 (Direct API Feed)**: Real-time fundamental metrics parsed from Yahoo Finance (`yfinance`) and Finnhub.
* **Tier 2 (Static Benchmark Catalog)**: Pre-verified fundamental data for 60+ top Indian NSE blue-chip equities (TCS, HDFC Bank, Reliance, SBI, Zomato, Tata Motors, etc.).
* **Tier 3 (Valuation Derivation)**: Calculates ROE dynamically via Price-to-Book and P/E ratios: $\text{ROE} = \frac{\text{Price / Book}}{\text{Price / Earnings}} \times 100$.
* **Tier 4 (Per-Share Derivation)**: Computes profitability from Earnings Per Share (EPS) and Book Value per share.
* **Tier 5 (ROA Leverage Multiplier)**: Estimates equity return using Return on Assets (ROA) scaled by financial leverage $(1 + \text{Debt-to-Equity})$.
* **Tier 6 (Operating Margin Scaling)**: Realistic sector benchmark projections derived from net operating margins.

### ⚡ 2. Comprehensive Technical & Quantitative Analysis
* **RSI (Relative Strength Index)**: 14-period momentum evaluation with smooth inflection scoring.
* **Moving Average Convergence (SMA 50 vs. SMA 200)**: Automated Golden Cross and Death Cross detection.
* **Price Momentum & Volume Trends**: Normalizes 6-month price velocity and 20-day vs. 50-day volume breakout ratios.
* **Composite Ranking Labeler**: Weighted synthesis ($60\%$ Fundamental + $40\%$ Technical) producing clear executive recommendations (*Strong Buy*, *Buy*, *Hold*, *Weak*, *Avoid*).

### 🤖 3. AI Strategic Advisory & Portfolio Intelligence
* **Weekly Executive Investment Digests**: Automated macro market summaries (NIFTY 50 & NIFTY BANK levels), sentiment classification, and tailored AI strategic action items.
* **Watchlist Monitoring**: Real-time asset tracking with health scorecards and high-conviction buy alerts.

### 📄 4. Executive-Grade PDF Reporting Engine
Built with ReportLab using custom two-pass numbered canvases (`NumberedCanvas`), AlphaMind generates visually stunning, Fortune-500-grade PDF documents:
* **Weekly Investment Digests**: Features deep indigo header ribbons (`#4F46E5`), tinted title cards, colored percentage change badges, structured AI callout boxes, and automated `Page X of Y` footers.
* **Commercial Tax Invoices & Bills of Supply**: Two-column header cards, structured client metadata grids, clear itemized billing tables, highlighted Grand Total blocks, and automated cryptographic IT compliance notices without requiring handwritten signatures.

---

## 🛠️ Technology Stack

### Backend
* **Framework**: Python 3.11+, FastAPI, Uvicorn
* **Database & ORM**: SQLAlchemy, Alembic (Migrations), SQLite / PostgreSQL support
* **Data Processing**: Pandas, NumPy, ReportLab (PDF Engine)
* **Market Providers**: Yahoo Finance (`yfinance`), Finnhub API, Custom Fallback Catalogs
* **Security & Auth**: OAuth2 with Password Flow, JWT (`python-jose`), Passlib (Bcrypt)

### Frontend
* **Framework**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Custom Design System (HSL tokens, glassmorphism, micro-animations)
* **Icons & Components**: Lucide React, Custom Responsive UI Tokens
* **HTTP & Routing**: Axios with interceptors, React Router DOM

---

## 📁 Project Architecture

```text
alphamind-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # FastAPI route controllers (auth, stocks, digest, invoices, users)
│   │   ├── core/              # Config, database sessions, security dependencies
│   │   ├── models/            # SQLAlchemy database models (User, WeeklyDigest, SearchHistory, Invoice)
│   │   ├── providers/         # Market data providers (YahooFinance, Finnhub, CacheProvider)
│   │   ├── schemas/           # Pydantic data validation schemas
│   │   ├── services/          # Core analytical engines (Fundamental, Technical, Ranking, PDF Generators)
│   │   └── utils/             # Database seeders, ReportLab invoice PDF builders
│   ├── alembic/               # Database migration scripts
│   ├── digests/               # Generated executive weekly digest PDFs (gitignored)
│   ├── invoices/              # Generated commercial tax invoices (gitignored)
│   ├── requirements.txt       # Python package dependencies
│   └── alembic.ini            # Alembic configuration
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, StockLogo, MetricCards, SearchBars)
│   │   ├── context/           # React Context providers (AuthContext, ThemeContext)
│   │   ├── pages/             # Application views (Dashboard, Watchlist, StockAnalysis, Admin, Invoices)
│   │   ├── services/          # API client integrations (authService, stockService, invoiceService)
│   │   └── index.css          # Tailwind CSS v4 configuration & theme tokens
│   ├── package.json           # Node.js dependencies & scripts
│   └── vite.config.ts         # Vite bundler setup
├── .gitignore                 # Comprehensive exclusion rules for environments, builds, and logs
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python**: `3.11` or higher
* **Node.js**: `18.x` or higher
* **npm**: `9.x` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/ZE40xAditya-ITT/AlphaMind.git
cd AlphaMind
```

### 2. Backend Setup
Navigate to the `backend` directory, set up your virtual environment, and install dependencies:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

#### Seed Database & Run Migrations
Initialize the SQLite database with default administrator and test user accounts:
```bash
python -m app.utils.seed
```
* **Admin Account**: `email: admin@alphamind.com` | `password: admin123`
* **Demo User Account**: `email: user@alphamind.com` | `password: user123`

#### Start the Backend API Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```
The FastAPI documentation (Swagger UI) will be available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup
Open a new terminal window, navigate to the `frontend` directory, and start the development server:
```bash
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
The web application will be live at: `http://localhost:5173`

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` root directory if you wish to override default database or provider settings:
```ini
# Security
SECRET_KEY="your-secure-random-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL="sqlite:///./sql_app.db"
# For PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/alphamind"

# Optional External API Keys
FINNHUB_API_KEY="your_finnhub_api_key_here"
```

---

## 🧪 Testing & Verification

1. **Health Check Endpoint**: Verify server status by navigating to `http://localhost:8000/api/v1/health/`.
2. **Stock Analysis Engine**: Test multi-tier ROE fallback calculations directly via python terminal:
   ```bash
   python -c "from app.services import fundamental_analysis_service; print(fundamental_analysis_service.analyze({'symbol': 'TCS'}))"
   ```
3. **PDF Generation Verification**: Test executive PDF digest creation:
   ```bash
   python -c "from app.db.session import SessionLocal; from app.services.digest_service import DigestService; ds = DigestService(); print(ds.ensure_pdf(SessionLocal(), ds.get_latest_digest(SessionLocal(), 2)))"
   ```

---

## 🤝 Contributing & Code Quality
When contributing to AlphaMind, please ensure:
* All code adheres to clean, human-readable formatting without redundant debugging comments or trailing white spaces.
* New backend endpoints are properly registered with tags in `app/api/v1/router.py`.
* Any temporary or auto-generated files (PDFs, logs, databases) are excluded via `.gitignore`.

---

## 📜 License & Disclaimer
**License**: MIT License. See `LICENSE` for more information.

**Financial Disclaimer**: *AlphaMind AI is a quantitative research and analytics software platform. All stock scores, technical evaluations, AI recommendations, and weekly digests generated by this engine are for educational and informational purposes only and do not constitute registered financial advisory, investment counseling, or solicitation to buy or sell securities.*
