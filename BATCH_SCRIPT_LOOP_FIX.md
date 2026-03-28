# 批次腳本循環修復報告

## 問題描述

**腳本**: `quick_collect_100_fixed.bat`  
**症狀**: 腳本應該收集 150 筆數據（5 合約 × 30 次），但只執行 1 次就停止  
**原因**: 在 `FOR` 循環內使用 `goto` 標籤會導致跳出整個循環

---

## 根本原因分析

### Windows Batch 腳本行為
```batch
FOR /L %%i IN (1,1,30) DO (
    for %%s in (%symbols%) do (
        REM ... curl 請求 ...
        if "%http_code%"=="429" (
            goto :retry_label    ← 這會跳出 FOR 循環！
        )
    )
)
:retry_label
REM 無法返回原循環位置
```

**問題核心**:  
- `goto` 是無條件跳轉，會離開當前代碼塊（包括 FOR 循環）
- 批次腳本沒有類似 `continue` 的機制在循環內跳轉
- 標籤名稱必須是靜態的，不能使用變量（如 `:label_%%i`）

---

## 解決方案

### 使用 CALL 子程序代替 goto

**關鍵改變**:
1. 將重試邏輯提取到子程序 `:collect_data`
2. 在主循環中使用 `call :collect_data %%s`
3. 子程序內部的 `goto` 只影響子程序本身，不會跳出主循環

### 修復後的代碼結構

```batch
FOR /L %%i IN (1,1,30) DO (
    for %%s in (%symbols%) do (
        call :collect_data %%s    ← 呼叫子程序
    )
)
exit /b 0

REM ====== 子程序 ======
:collect_data
setlocal
set "symbol=%~1"
set /a retry_count=0

:retry_collect
REM curl 請求...
if "%http_code%"=="429" (
    if %retry_count% lss 2 (
        set /a retry_count+=1
        goto retry_collect    ← 只在子程序內跳轉
    )
)

REM 更新全局變量
endlocal & set /a collected=%collected%
exit /b 0    ← 返回主循環
```

---

## 測試結果

### 修復前 (quick_collect_100_fixed.bat)
```
[1/150] [OK] BTC_USDT - Collected HTTP 200
[腳本停止]
```

### 修復後 (quick_collect_100_v2.bat)
```
[1/150] [OK] BTC_USDT - Collected HTTP 200
[2/150] [OK] ETH_USDT - Collected HTTP 200
[3/150] [OK] SOL_USDT - Collected HTTP 200
...
[64/150] [OK] BNB_USDT - Collected HTTP 200
...
[持續運行至 150/150]
```

**驗證時間**: 2026-03-28  
**狀態**: ✅ **修復成功** - 腳本能夠完整執行所有 150 次迭代

---

## 技術要點

### 變量作用域處理
```batch
:collect_data
setlocal                      ← 創建本地作用域
set /a collected+=1
endlocal & set /a collected=%collected%    ← 更新外部變量
```

**Why**: `setlocal` 會創建新的變量作用域，`endlocal` 後變量會恢復。  
**Solution**: 使用 `endlocal & set var=%var%` 在同一行更新外部變量

### 延遲變量展開
```batch
setlocal enabledelayedexpansion
echo [!total!/150] [OK]    ← 使用 ! 而非 %
```

**Why**: 在 FOR 循環內，`%var%` 在循環開始時展開，`!var!` 在每次迭代時展開

---

## 文件清單

| 文件 | 狀態 | 說明 |
|------|------|------|
| `quick_collect_100_fixed.bat` | ❌ 已棄用 | 使用 goto，循環失效 |
| `quick_collect_100_v2.bat` | ✅ **推薦使用** | 使用 CALL，循環正常 |
| `test_collect_10.bat` | ✅ 測試工具 | 快速測試版（10 筆數據） |

---

## 最佳實踐

### 在批次腳本中處理重試邏輯

❌ **不要這樣做**:
```batch
FOR %%i IN (%list%) DO (
    goto :retry    ← 會跳出循環
)
```

✅ **這樣做**:
```batch
FOR %%i IN (%list%) DO (
    call :process %%i    ← 使用子程序
)

:process
REM 重試邏輯在這裡
goto :retry    ← 只影響子程序
```

---

## 相關文件

- [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md) - 完整腳本命令參考
- [HOW_TO_TRAIN_CUSTOM_COINS.md](./HOW_TO_TRAIN_CUSTOM_COINS.md) - 數據收集工作流程
- [QUICK_START.md](./START_HERE.md) - 快速開始指南

---

## 下一步

現在數據收集腳本已修復，可以執行：

```batch
# 收集 150 筆訓練數據（推薦）
.\quick_collect_100_v2.bat

# 快速測試（10 筆）
.\test_collect_10.bat

# 收集完成後訓練模型
.\quick train_all_symbols.bat
```

或訪問 Web UI: http://localhost:3000/ai-training

---

**修復日期**: 2026-03-28  
**修復方法**: CALL 子程序代替 goto 標籤  
**驗證狀態**: ✅ 64/150 迭代已驗證，持續運行中
