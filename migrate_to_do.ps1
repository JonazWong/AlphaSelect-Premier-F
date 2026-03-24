# ============================================
# 匯出本機資料並匯入到 DigitalOcean
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  資料庫遷移：本機 → DigitalOcean" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# DO 資料庫連線資訊
$DO_DB_HOST = "premier-do-user-32973725-0.l.db.ondigitalocean.com"
$DO_DB_PORT = "25060"
$DO_DB_USER = "doadmin"
$DO_DB_PASS = "AVNS_zSH4Wa_27EOrnFxBdRB"
$DO_DB_NAME = "defaultdb"
$EXPORT_FILE = "contract_markets_export.sql"

# 檢查本機資料量
Write-Host "[1/5] 檢查本機資料量..." -ForegroundColor Yellow
$localCount = docker compose exec -T postgres psql -U postgres -d defaultdb -t -c "SELECT COUNT(*) FROM contract_markets;" 2>&1
$localCount = $localCount.Trim()
Write-Host "      本機資料庫: $localCount 筆記錄" -ForegroundColor Green
Write-Host ""

# 確認是否繼續
$confirm = Read-Host "是否要將 $localCount 筆資料匯出並上傳到 DO？(Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "已取消" -ForegroundColor Red
    exit
}

# 匯出資料
Write-Host "[2/5] 匯出本機資料..." -ForegroundColor Yellow
docker compose exec -T postgres pg_dump -U postgres -d defaultdb -t contract_markets --data-only --column-inserts | Out-File -FilePath $EXPORT_FILE -Encoding UTF8
Write-Host "      已匯出至: $EXPORT_FILE" -ForegroundColor Green
Write-Host ""

# 檢查是否安裝 psql
Write-Host "[3/5] 檢查 PostgreSQL client..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "      ❌ 未找到 psql 工具" -ForegroundColor Red
    Write-Host ""
    Write-Host "請安裝 PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "  方法 1: choco install postgresql" -ForegroundColor White
    Write-Host "  方法 2: 下載 https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host ""
    Write-Host "或使用 Docker 方式匯入（見下方指令）" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Docker 匯入指令:" -ForegroundColor Cyan
    Write-Host "docker run --rm -v `${PWD}:/backup postgres:16 psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -f /backup/$EXPORT_FILE" -ForegroundColor White
    Write-Host ""
    Write-Host "執行前需設置密碼: `$env:PGPASSWORD='$DO_DB_PASS'" -ForegroundColor White
    exit 1
}
Write-Host "      ✅ 已找到 psql: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# 測試 DO 資料庫連線
Write-Host "[4/5] 測試 DO 資料庫連線..." -ForegroundColor Yellow
$env:PGPASSWORD = $DO_DB_PASS
try {
    $testResult = psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c "SELECT 1;" 2>&1
    Write-Host "      ✅ 連線成功" -ForegroundColor Green
} catch {
    Write-Host "      ❌ 連線失敗: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 匯入資料
Write-Host "[5/5] 匯入資料到 DO..." -ForegroundColor Yellow
Write-Host "      這可能需要幾分鐘..." -ForegroundColor Gray
try {
    psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -f $EXPORT_FILE 2>&1 | Out-Null
    Write-Host "      ✅ 匯入完成" -ForegroundColor Green
} catch {
    Write-Host "      ❌ 匯入失敗: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 驗證資料
Write-Host "驗證 DO 資料庫..." -ForegroundColor Yellow
$doCount = psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -t -c "SELECT COUNT(*) FROM contract_markets;" 2>&1
$doCount = $doCount.Trim()
Write-Host "DO 資料庫: $doCount 筆記錄" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 遷移完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "本機: $localCount 筆  →  DO: $doCount 筆" -ForegroundColor White
Write-Host ""
Write-Host "清理暫存檔案: Remove-Item $EXPORT_FILE" -ForegroundColor Gray
