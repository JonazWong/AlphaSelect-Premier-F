@echo off
chcp 65001 >nul
title 測試後端 API
color 0B

echo.
echo ═══════════════════════════════════════════════════════════
echo  測試 MEXC API 連接
echo ═══════════════════════════════════════════════════════════
echo.

echo 測試 1: 健康檢查
echo.
curl -s http://localhost:8000/api/v1/health
echo.
echo.

echo ═══════════════════════════════════════════════════════════
echo.
echo 測試 2: 獲取 BTC_USDT 行情
echo.
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo ═══════════════════════════════════════════════════════════
echo.
echo 測試 3: 獲取所有合約列表（前 5 個）
echo.
curl -s http://localhost:8000/api/v1/contract/tickers
echo.
echo.

echo ═══════════════════════════════════════════════════════════
echo.
pause
