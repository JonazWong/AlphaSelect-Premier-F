# TA-Lib 安裝說明

## 為什麼暫時移除 TA-Lib？

TA-Lib (Technical Analysis Library) 是一個用於技術分析的強大工具，但它：
- ❌ **編譯時間長**：需要 10-15 分鐘編譯 C 語言庫
- ❌ **容易失敗**：編譯過程複雜，容易出錯
- ✅ **非核心功能**：只用於計算技術指標，不影響平台主要功能

## 當前狀態

目前使用 `requirements-quick.txt`，**已註釋掉 TA-Lib**：
```python
# ta-lib==0.4.28  # Commented out - requires C library compilation
```

## 平台能做什麼（沒有 TA-Lib）

✅ **可以正常使用的功能**：
- MEXC API 連接
- 市場數據獲取
- 數據存儲（PostgreSQL + TimescaleDB）
- WebSocket 實時更新
- 大部分 AI/ML 功能（TensorFlow、XGBoost、sklearn）
- 基本數據分析（pandas、numpy）

⚠️ **受影響的功能**：
- RSI、MACD、布林帶等技術指標需要手動計算
- 某些預設的 AI 特徵工程可能需要調整

## 稍後如何添加 TA-Lib

### 方法 1：使用完整版 Dockerfile（推薦）

1. 編輯 `backend/Dockerfile`：
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including TA-Lib
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install TA-Lib C library
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib/ && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

2. 取消註釋 `requirements.txt` 中的 TA-Lib：
```
ta-lib==0.4.28  # 移除註釋符號
```

3. 重新構建：
```batch
docker compose down
docker compose build --no-cache backend celery-worker
docker compose up -d
```

⏱️ **預計時間**：10-15 分鐘

### 方法 2：使用預編譯輪子（更快）

在某些平台上可以使用預編譯的 wheel 文件，但可能需要找到兼容的版本。

## 建議

🚀 **先讓平台跑起來**，確認基本功能正常後再決定是否需要 TA-Lib。

**大多數交易策略可以通過以下方式計算技術指標**：
- 使用 pandas 手動計算
- 使用替代庫（如 `pandas-ta`）
- 直接從 API 獲取帶指標的數據

## 需要幫助？

如果確實需要 TA-Lib，請：
1. 確保 Docker Desktop 有足夠資源（至少 4GB RAM）
2. 保持網絡連接穩定
3. 耐心等待編譯完成（10-15 分鐘）
4. 如果失敗，可以檢查 Docker 日誌：`docker compose logs backend`
