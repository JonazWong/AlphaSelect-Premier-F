# AlphaSelect Premier F - MEXC AI Trading Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![Next.js](https://img.shields.io/badge/next.js-14.1-black)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

**AlphaSelect Premier F** is an AI-driven cryptocurrency analysis monitoring platform specifically designed for MEXC contract trading pairs. It integrates deep learning prediction models (LSTM, XGBoost, Random Forest, ARIMA, Linear Regression, and Ensemble) with professional technical analysis to provide real-time trading insights.

## ✨ Features

### Core Features
- 🔍 **Contract Trading Radar**: Real-time MEXC contract analysis with AI-powered long/short signals
- 🤖 **AI Training Center**: Train multiple AI models (LSTM, XGBoost, Random Forest, ARIMA, Linear Regression, Ensemble)
- 📊 **AI Predictions Panel**: View price forecasts with confidence scores
- 📈 **Pattern Detection**: Identify chart patterns and technical signals
- 🔎 **Market Screener**: Filter and screen trading opportunities

### Technical Features
- ⚡ Real-time market data updates
- 📉 20+ technical indicators (RSI, MACD, Bollinger Bands, etc.)
- 💹 Funding rate and open interest tracking
- 🎨 Cyberpunk Futurism themed UI
- 🌐 Multi-language support (zh-TW, en-US)
- 🔒 Rate limiting and circuit breaker protection

## 🏗️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 16 + TimescaleDB
- **Cache**: Redis 7
- **Task Queue**: Celery + Redis
- **WebSocket**: Socket.IO
- **ORM**: SQLAlchemy 2.0

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: TradingView Lightweight Charts
- **State Management**: Zustand
- **i18n**: react-i18next

### AI/ML
- **Deep Learning**: TensorFlow 2.x (LSTM)
- **ML**: XGBoost, scikit-learn
- **Time Series**: statsmodels (ARIMA)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Production**: DigitalOcean App Platform
- **Database**: DigitalOcean Managed PostgreSQL 16
- **Cache**: DigitalOcean Redis

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (for local development)
- Git
- MEXC API credentials (optional for testing)

### Local Development with Docker

1. **Clone the repository**
```bash
git clone https://github.com/JonazWong/AlphaSelect-Premier-F.git
cd AlphaSelect-Premier-F
```

2. **Set up environment variables**
```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your configuration
# At minimum, set a secure DB_PASSWORD
```

3. **Start all services with Docker Compose**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL 16 + TimescaleDB on port 5432
- Redis 7 on port 6379
- FastAPI backend on port 8000
- Celery worker
- Next.js frontend on port 3000

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Manual Installation (without Docker)

#### Backend Setup
```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python -m app.db.init_db

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

## 📖 API Documentation

### Contract Market Endpoints

#### Get Contract Ticker
```bash
GET /api/v1/contract/ticker/{symbol}
```

#### Get All Contract Tickers
```bash
GET /api/v1/contract/tickers
```

#### Get K-line Data
```bash
GET /api/v1/contract/klines/{symbol}?interval=Min60&limit=100
```

#### Get Funding Rate
```bash
GET /api/v1/contract/funding-rate/{symbol}
```

#### Get Open Interest
```bash
GET /api/v1/contract/open-interest/{symbol}
```

For complete API documentation, visit http://localhost:8000/docs when running the backend.

## 🎨 UI/UX Design

The platform features a **Cyberpunk Futurism** theme with:
- **Primary Color**: Cyan (#00D9FF)
- **Secondary Color**: Purple (#B24BF3)
- **Accent Color**: Neon Green (#00FFB3)
- **Background**: Deep Blue-Black (#0A1628)
- Glass morphism effects
- Neon glow effects
- Smooth transitions and animations

## 🔐 Security Features

- Environment variables for sensitive data
- Rate limiting (100 requests per 10 seconds)
- Circuit breaker pattern (trips after 5 failures, recovers in 60s)
- SQL injection protection via ORM
- CORS configuration
- API key authentication for MEXC

## 📊 Database Models

### ContractMarket
Stores real-time contract market data including prices, funding rates, and open interest.

### FundingRateHistory
Historical funding rate data for analysis.

### OpenInterestHistory
Historical open interest data for trend analysis.

### AIModel
Metadata and metrics for trained AI models.

### Prediction
AI model predictions with confidence scores.

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📚 Additional Documentation

- [MEXC API Setup Guide](./MEXC_API_GUIDE.md) - Setting up MEXC API credentials
- [AI Training Guide](./AI_TRAINING_GUIDE.md) - Training AI models
- [Deployment Guide](./DEPLOYMENT.md) - Deploying to DigitalOcean
- [Architecture](./ARCHITECTURE.md) - System architecture details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This platform is for educational and research purposes only. Cryptocurrency trading carries risk. Always do your own research and never invest more than you can afford to lose.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for the crypto community**