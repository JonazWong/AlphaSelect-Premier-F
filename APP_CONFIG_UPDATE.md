# AlphaSelect Premier F - 应用配置更新记录

**更新时间:** 2026年3月14日

## 新应用配置

### DigitalOcean App Platform

| 配置项 | 新值 |
|--------|------|
| **App Name** | `alphaselect-premier` |
| **Region** | Singapore (`sgp`) |
| **Database Cluster** | `premier` |
| **Database Name** | `defaultdb` |
| **Database URL** | `postgresql://doadmin:[PASSWORD]@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require` |

### 更新内容

#### 1. `.do/app.yaml`
- ✅ App name: `alpha` → `alphaselect-premier`
- ✅ Database name: `defaultdb` (使用默認數據庫)

#### 2. 文档更新
- ✅ `DEPLOYMENT_CHECKLIST.md` - DATABASE_URL 示例更新
- ✅ `DIGITALOCEAN_SETUP.md` - DATABASE_URL 配置指南更新

### API Token 配置

| 配置 | 值 |
|------|-----|
| **Token** | 已配置 (通过 `doctl auth init` 设置) |
| **账户** | `LOOPER2@BIZNETVIGATOR.COM` |
| **团队** | `Looper-HQ` |
| **Context** | `default` |

### GitHub 集成

| 配置 | 值 |
|------|-----|
| **Repository** | `JonazWong/AlphaSelect-Premier-F` |
| **Branch** | `main` |
| **Deploy on Push** | ✅ Enabled |

### 组件配置

#### Backend Service
- **Name:** `alphaselect-premier-f-backend`
- **Port:** 8000
- **Instances:** 2
- **Size:** `apps-s-1vcpu-1gb`
- **Health Check:** `/health`

#### Frontend Service
- **Name:** `alphaselect-premier-f-frontend`
- **Port:** 3000
- **Instances:** 2
- **Size:** `apps-s-1vcpu-1gb`

#### Celery Worker
- **Name:** `celery-worker`
- **Instances:** 1
- **Size:** `apps-s-1vcpu-1gb`
- **Command:** `celery -A app.tasks.celery_app worker --loglevel=info`

### 必需环境变量

Backend 和 Celery Worker 需要：
- [x] `DATABASE_URL` - 連接到 `defaultdb` 數據庫（DigitalOcean 預設）
- [x] `REDIS_URL` - 自動注入 (來自 Redis managed database)
- [x] `SECRET_KEY` - JWT 签名密钥
- [x] `MEXC_API_KEY` - MEXC API 密钥
- [x] `MEXC_SECRET_KEY` - MEXC Secret 密钥
- [x] `ADMIN_DATABASE_URL` - 管理员数据库连接
- [x] `db_cluster_name` - premier

Frontend 需要：
- [x] `NEXT_PUBLIC_API_URL` - `${APP_URL}`
- [x] `NEXT_PUBLIC_WS_URL` - `${APP_URL}`

### 部署命令

使用更新后的配置部署：

```bash
# 验证 app.yaml 配置
doctl apps spec validate .do/app.yaml

# 创建新应用
doctl apps create --spec .do/app.yaml --wait

# 或更新现有应用（如果已存在）
doctl apps update <APP_ID> --spec .do/app.yaml --wait
```

### 后续步骤

1. ✅ 已更新 `.do/app.yaml` 配置
2. ✅ 已更新相关文档
3. ⏸️ 待执行：在 DigitalOcean 设置所有环境变量的实际值
4. ⏸️ 待执行：验证 GitHub 连接和自动部署
5. ⏸️ 待执行：测试应用部署和运行状态

### 注意事项

⚠️ **重要:** 
- 舊的 `alpha` 應用已刪除
- 數據庫名稱使用 DigitalOcean 預設的 `defaultdb`
- 確保所有環境變數中的 DATABASE_URL 使用正確的數據庫名稱
- API Token 已更新，請保管好新的 token

### 验证清单

部署后验证：
- [ ] Backend 健康检查通过: `curl https://<APP_URL>/health`
- [ ] Frontend 可访问: `https://<APP_URL>/`
- [ ] WebSocket 连接正常: `wss://<APP_URL>/ws`
- [ ] 数据库连接正常
- [ ] MEXC API 调用成功
- [ ] Celery worker 运行中

---

**文档更新完成!** 🎉
