# DigitalOcean 部署修复指南

## 🎯 修复目标
解决前端 404 错误和配置问题

## 📋 步骤 1：设置环境变量（SECRETS）

在应用新配置之前，必须先设置这些环境变量：

### 进入设置页面
1. 登录 DigitalOcean：https://cloud.digitalocean.com/apps
2. 选择您的应用：`alphaselect-premier-f`
3. 点击 **Settings** 标签
4. 点击左侧 **App-Level Environment Variables**

### 需要设置的变量

#### 1. SECRET_KEY
```
Value: {h^XNq-)Dl+-kN0w:KB_/R"^<|A/Vrg:
Type: Secret
```

#### 2. MEXC_API_KEY
```
Value: [从您的 MEXC 账户获取]
Type: Secret
```

#### 3. MEXC_SECRET_KEY
```
Value: [从您的 MEXC 账户获取]
Type: Secret
```

#### 4. ADMIN_DATABASE_URL
从数据库连接信息获取（参考数据库截图）：
```
Value: postgresql://doadmin:[密码]@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/premier?sslmode=require
Type: Secret
```

**如何获取完整连接字符串：**
- 进入 Databases → premier → Overview
- 找到 "Connection Details"
- 复制完整的连接字符串
- **重要**：确认最后是 `/premier` 而不是 `/defaultdb`

#### 5. DB_APP_USER（可选）
如果您只用 doadmin，可以留空或设置：
```
Value: doadmin
Type: Secret
```

### 保存环境变量
点击 **Save** 保存所有变量

---

## 📋 步骤 2：更新 App Spec（修复配置）

### 进入 App Spec 编辑器
1. 在应用页面，点击 **Settings** → **App Spec**
2. 点击 **Edit** 按钮

### 应用新配置
1. 打开本地文件：`DIGITALOCEAN_APP_SPEC_FIXED.yaml`
2. **复制从 `name:` 开始到最后的所有内容**
3. 粘贴到 DigitalOcean 编辑器，**完全替换现有内容**
4. 点击 **Save**

### 验证配置变更
检查以下关键点是否正确：
- ✅ `ingress.rules[2].component.name` = `frontend`
- ✅ `ingress.rules[2].match.path.prefix` = `/`（不是 `/alphaselect-premier-f-frontend`）
- ✅ `databases[0].db_name` = `premier`
- ✅ 存在三个组件：`backend`、`frontend`、`celery-worker`
- ✅ Backend 没有 `run_command`
- ✅ Celery-worker 有 `run_command: "celery -A app.tasks.celery_app worker --loglevel=info"`

---

## 📋 步骤 3：部署应用

### 触发部署
1. 保存 App Spec 后，会自动返回应用概览页面
2. 点击页面顶部的蓝色 **Deploy** 按钮
3. 或者点击 **Actions** → **Force Rebuild and Deploy**

### 等待部署完成
部署过程大约需要 **5-10 分钟**，您会看到：
1. **Building** - 构建 Docker 镜像
2. **Deploying** - 部署到实例
3. **Running** - 服务上线

---

## 📋 步骤 4：验证部署

### 检查服务状态
在应用概览页面，确认所有组件状态为 **Running**：
- ✅ backend (1 instance)
- ✅ frontend (1 instance)
- ✅ celery-worker (1 instance)
- ✅ premier (database)
- ✅ redis (database)

### 测试端点

#### 1. 后端健康检查
```powershell
curl https://alpha-hjyhn.ondigitalocean.app/api/health
```
**预期结果：**
```json
{"status":"healthy","timestamp":"..."}
```

#### 2. 前端首页（修复后应该正常）
```powershell
curl -I https://alpha-hjyhn.ondigitalocean.app/
```
**预期结果：**
```
HTTP/1.1 200 OK
```

#### 3. API 文档
```powershell
curl -I https://alpha-hjyhn.ondigitalocean.app/api/docs
```
**预期结果：**
```
HTTP/1.1 200 OK
```

#### 4. 合约市场 API
```powershell
curl https://alpha-hjyhn.ondigitalocean.app/api/v1/contract/tickers
```
**预期结果：** 返回市场数据 JSON

---

## 🔍 查看日志（如果有问题）

### Backend 日志
1. 进入应用页面
2. 点击 **Components** → **backend**
3. 点击 **Runtime Logs** 标签
4. 查看是否有数据库连接错误或其他异常

### Frontend 日志
1. 点击 **Components** → **frontend**
2. 点击 **Runtime Logs** 标签
3. 查看 Next.js 启动日志

### Celery Worker 日志
1. 点击 **Components** → **celery-worker**
2. 点击 **Runtime Logs** 标签
3. 确认 Celery 正常启动

---

## 🔧 常见问题排查

### 问题 1：前端仍然 404
**检查：** Ingress 路由是否正确
```bash
# 在 App Spec 中搜索
prefix: /
# 应该指向 frontend，不是 backend
```

### 问题 2：数据库连接失败
**检查日志中的错误：**
```
FATAL:  database "defaultdb" does not exist
```
**解决：** 确认 `ADMIN_DATABASE_URL` 结尾是 `/premier`

### 问题 3：API 返回 500 错误
**检查：** Backend Runtime Logs
- 缺少 SECRET_KEY？
- 数据库表未创建？
- MEXC API 密钥错误？

---

## ✅ 成功标志

当以下所有条件满足时，部署成功：

1. ✅ 所有组件状态为 **Running (Healthy)**
2. ✅ `/` 返回 HTTP 200（前端页面）
3. ✅ `/api/health` 返回 `{"status":"healthy"}`
4. ✅ `/api/docs` 可访问
5. ✅ Backend 日志显示 "✅ Database tables created successfully!"
6. ✅ Celery 日志显示 "celery@xxx ready"

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. Backend Runtime Logs（最近 50 行）
2. Frontend Runtime Logs（最近 50 行）
3. 当前的 App Spec 配置（Settings → App Spec）
4. 错误截图或具体错误信息

---

**最后更新：** 2026年3月6日
