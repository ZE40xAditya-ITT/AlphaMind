# AlphaMind

Welcome to **AlphaMind** — an intelligent, full-stack financial analysis platform designed to help investors make data-driven decisions on the National Stock Exchange (NSE) of India. 

AlphaMind AI combines real-time market data with sophisticated algorithmic scoring to deliver instant, actionable insights. Whether you are building a watchlist, comparing equities head-to-head, or generating automated financial reports, AlphaMind provides a premium, responsive experience.

---

## Features

- **Real-Time Analysis**: Fetch and analyze up-to-the-minute stock data using `yfinance`.
- **Intelligent Scoring System**: Generates automated Technical Scores (RSI, Moving Averages, Momentum) and Fundamental Scores (ROE, Debt, Revenue Growth) to provide a final composite recommendation (Strong Buy, Buy, Hold, Weak, Sell).
- **Head-to-Head Comparison**: Compare any two stocks side-by-side with intuitive visual gauges and statistical breakdowns.
- **Personalized Watchlist**: Save your favorite equities and track their AI recommendations over time.
- **Secure Authentication**: Traditional Email/Password registration powered by JWT, alongside seamless Single Sign-On (SSO) with **Google OAuth**.
- **Admin & Billing Dashboard**: Role-based access control (RBAC) allows administrators to track platform usage, manage users, and generate/download PDF invoices for API usage.
- **Premium UI/UX**: A gorgeous, fully responsive React interface featuring dynamic Light/Dark modes, smooth micro-animations, glassmorphism effects, and highly accessible data visualizations.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** (Vite)
- **Tailwind CSS v4** (Advanced thematic styling & animations)
- **React Router** (Client-side routing)
- **Google Identity Services** (`@react-oauth/google`)
- **Lucide React** (Beautiful SVG iconography)

### Backend
- **FastAPI** (High-performance asynchronous Python web framework)
- **SQLAlchemy & Alembic** (ORM and database migrations)
- **PostgreSQL** (Relational database)
- **yFinance** (Live market data ingestion)
- **ReportLab** (Automated PDF invoice generation)
- **Passlib & Python-JOSE** (Secure password hashing and JWT token management)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (Running locally or via Docker)
- A Google Cloud Console project (for OAuth credentials)

### 1. Database Setup
Create a PostgreSQL database named `alphamind` and ensure your local postgres server is running.

### 2. Backend Installation
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
PROJECT_NAME="AlphaMind AI"
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/alphamind"
SECRET_KEY="your-super-secret-jwt-key"
ACCESS_TOKEN_EXPIRE_MINUTES=30
RATE_PER_SEARCH=20.0
INVOICE_DIR="./invoices"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```

### 3. Frontend Installation
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

Start the development server:
```bash
npm run dev
```

---

## Google OAuth Configuration
To enable the "Continue with Google" feature:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth 2.0 Client IDs under **Credentials**.
3. Set the **Authorized JavaScript origins** and **Authorized redirect URIs** to `http://localhost:5173`.
4. Copy the Client ID into your frontend and backend `.env` files.

---

## 🤝Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page if you want to contribute.

