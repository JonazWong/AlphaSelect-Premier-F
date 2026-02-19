# AlphaSelect Premier F - MEXC AI Trading Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![Next.js](https://img.shields.io/badge/next.js-15.2.9-black)
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
- **Framework**: Next.js 15.2.9 (App Router)
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

## 🎁 新手友好工具

**完全不懂代碼？沒問題！** 我們為您準備了超級簡單的一鍵工具：

### Windows 用戶（雙擊即可使用）

| 工具 | 說明 | 使用方式 |
|------|------|----------|
| **📖 QUICKSTART.md** | 超詳細新手設置指南 | 按步驟操作，包含圖文說明 |
| **✅ CONFIG_CHECKLIST.md** | 配置檢查清單 | 確保所有設置都正確 |
| **🚀 start.bat** | 一鍵啟動平台 | 雙擊啟動所有服務 |
| **🛑 stop.bat** | 一鍵停止平台 | 雙擊停止所有服務 |
| **🔍 check-config.bat** | 配置自動檢查 | 雙擊自動檢查配置狀態 |
| **🔌 check-ports.bat** | 端口占用檢查 | 查看哪些程式占用了端口 |
| **🔒 DOCKER_SAFETY.md** | Docker 安全說明 | **重要！** 說明不會影響其他專案 |

### 推薦新手使用流程

1. **閱讀** [QUICKSTART.md](QUICKSTART.md) - 了解如何安裝 Docker 和設置環境
2. **閱讀** [DOCKER_SAFETY.md](DOCKER_SAFETY.md) - **重要！** 了解為什麼不會影響其他專案
3. **雙擊** `check-ports.bat` - 檢查端口是否被占用
4. **雙擊** `start.bat` - 自動啟動整個平台
5. **雙擊** `check-config.bat` - 檢查所有配置是否正確
6. **打開瀏覽器** 訪問 http://localhost:3000 開始使用！

**完全不需要輸入任何命令！** 🎉

⚠️ **擔心影響其他專案？** 請先閱讀 [DOCKER_SAFETY.md](DOCKER_SAFETY.md)，保證100%安全！

## 🚀 Quick Start

### 方法一：超級簡單（推薦新手）

**只需3步！**

1. **安裝 Docker Desktop**
   - 下載：https://www.docker.com/products/docker-desktop/
   - 安裝並重啟電腦

2. **雙擊啟動**
   - 找到 `start.bat` 文件
   - 雙擊運行
   - 等待自動啟動完成

3. **開始使用**
   - 瀏覽器會自動打開 http://localhost:3000
   - 開始探索功能！

**詳細圖文教學請看** → [QUICKSTART.md](QUICKSTART.md)

### 方法二：傳統方式（進階用戶）

#### Prerequisites
- Docker Desktop (for local development)
- Git
- MEXC API credentials (optional for testing)

#### Local Development with Docker

1. **Clone the repository**
```bash
git clone https://github.com/JonazWong/AlphaSelect-Premier-F.git
cd AlphaSelect-Premier-F
```

2. **Set up environment variables**

**後端配置：**
```bash
# 複製示例配置文件
cp backend/.env.example backend/.env

# 編輯 backend/.env 並修改以下內容：
# - SECRET_KEY（必須修改成複雜的隨機字串）
# - DB_PASSWORD（建議修改）
# - MEXC_API_KEY 和 MEXC_SECRET_KEY（如果要連接真實數據）
```

**前端配置：**
```bash
# 複製示例配置文件（注意是 .env.local）
cp frontend/.env.example frontend/.env.local

# 本地開發通常不需要修改
```

3. **Start all services with Docker Compose**
```bash
docker compose up -d
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

5. **Stop services**
```bash
# 僅停止服務（保留數據）
docker compose down

# 停止並刪除所有數據
docker compose down -v
```

#### 其他有用的命令

```bash
# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f

# 查看特定服務的日誌
docker compose logs backend
docker compose logs frontend

# 重啟服務
docker compose restart

# 重新建置並啟動
docker compose up -d --build

# 進入容器內部（調試用）
docker compose exec backend bash
```

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

### 🎓 新手指南（完全不懂代碼也能用）

- **[🚀 QUICKSTART.md](./QUICKSTART.md)** - 超詳細新手設置指南（圖文並茂）
- **[✅ CONFIG_CHECKLIST.md](./CONFIG_CHECKLIST.md)** - 配置檢查清單
- **🔧 一鍵工具**：`start.bat`、`stop.bat`、`check-config.bat`（Windows 雙擊即可）

### 📖 進階文檔

- **[MEXC API Setup Guide](./MEXC_API_GUIDE.md)** - Setting up MEXC API credentials
- **[AI Training Guide](./AI_TRAINING_GUIDE.md)** - Training AI models  
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploying to DigitalOcean
- **[Architecture](./ARCHITECTURE.md)** - System architecture details
- **[Security](./SECURITY.md)** - Security vulnerability tracking and best practices

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