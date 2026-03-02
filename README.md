# AlphaSelect Premier F - MEXC AI Trading Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![Next.js](https://img.shields.io/badge/next.js-15.2.9-black)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview






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

## 🚀 Quick Start

### ⚡ 最快方式（Windows）

```batch
# 運行快速入門向導
quick_start.bat
```

這個互動式向導將引導您：
- ✅ 了解項目結構
- ✅ 選擇使用方式（Docker 或本地開發）
- ✅ 快速啟動服務
- ✅ 解決常見問題

### Prerequisites
- Docker Desktop (for local development)
- Git
- MEXC API credentials (optional for testing)

### Local Development with Docker (Windows)

**一鍵啟動腳本** (推薦使用)

```batch
# 1. 配置 MEXC API（首次使用）
config_mexc.bat

# 2. 啟動所有服務
一鍵啟動腳本 start.bat

# 3. 停止服務
一鍵停止腳本 stop.bat
```

**手動步驟**:

1. **Clone the repository**
```bash
git clone https://github.com/JonazWong/AlphaSelect-Premier-F.git
cd AlphaSelect-Premier-F
```

2. **Set up environment variables**
```bash
# 使用配置向導（推薦）
config_mexc.bat

# 或手動設置
copy .env.example .env
# 編輯 .env 文件，設置 MEXC API 密鑰
```

3. **Start all services with Docker Compose**
```bash
# Windows: 使用批次腳本
一鍵啟動腳本 start.bat

# 或手動啟動
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

## 🛠️ 管理工具

### 啟動和停止

| 工具 | 功能 | 用途 |
|------|------|------|
| `一鍵啟動腳本 start.bat` | 啟動所有服務 | 啟動 Docker 容器並檢查服務狀態 |
| `一鍵停止腳本 stop.bat` | 停止所有服務 | 優雅地停止所有運行中的容器 |
| `restart_backend.bat` | 重啟後端 | 僅重啟後端服務（快速） |
| `rebuild_backend.bat` | 重建後端 | 重新構建後端鏡像（修復依賴問題） |

### MEXC API 管理

| 工具 | 功能 | 用途 |
|------|------|------|
| `config_mexc.bat` | 配置 MEXC API | 互動式設置 API 密鑰 |
| `test_mexc.bat` | 測試 MEXC API | 驗證 API 連接和配置 |
| `check_mexc_status.bat` | 檢查部署狀態 | 查看 MEXC API 集成狀態 |

### 診斷和測試

| 工具 | 功能 | 用途 |
|------|------|------|
| `diagnose_backend.bat` | 診斷後端問題 | 全面檢查後端狀態和錯誤 |
| `view_backend_logs.bat` | 查看後端日誌 | 快速查看最新日誌 |
| `test_backend.py` | 測試後端配置 | 驗證 Python 環境和導入 |
| `test_mexc_api.py` | 測試 MEXC 集成 | 測試 API 客戶端和端點 |

### 使用示例

```batch
# 首次設置
1. config_mexc.bat          # 配置 MEXC API
2. 一鍵啟動腳本 start.bat    # 啟動服務

# 日常使用
一鍵啟動腳本 start.bat      # 啟動
一鍵停止腳本 stop.bat        # 停止

# 問題診斷
diagnose_backend.bat        # 診斷問題
view_backend_logs.bat       # 查看日誌
test_mexc.bat              # 測試 MEXC API

# 重啟服務
restart_backend.bat         # 快速重啟後端
rebuild_backend.bat        # 重新構建後端
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

- [MEXC API 部署文檔](./MEXC_API_DEPLOYMENT.md) - MEXC API 完整集成指南
- [後端故障排除](./BACKEND_TROUBLESHOOTING.md) - 後端問題診斷和解決
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