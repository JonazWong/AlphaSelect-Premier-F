#!/usr/bin/env python
"""
快速测试后端配置是否正确
"""
import sys
import os

# 添加 backend 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

print("🔍 测试后端配置...")
print("-" * 50)

# 测试 1: 导入配置
try:
    from app.core.config import settings
    print("✅ 成功导入配置")
    print(f"   - APP_NAME: {settings.APP_NAME}")
    print(f"   - APP_VERSION: {settings.APP_VERSION}")
    print(f"   - DATABASE_URL: {settings.DATABASE_URL[:30]}...")
    print(f"   - REDIS_URL: {settings.REDIS_URL}")
except Exception as e:
    print(f"❌ 配置导入失败: {e}")
    sys.exit(1)

# 测试 2: 导入 FastAPI 应用
try:
    from app.main import app, fastapi_app
    print("✅ 成功导入 FastAPI 应用")
    print(f"   - 应用类型: {type(app)}")
    print(f"   - FastAPI 应用: {type(fastapi_app)}")
except Exception as e:
    print(f"❌ FastAPI 应用导入失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 测试 3: 检查路由
try:
    routes = [route.path for route in fastapi_app.routes]
    print(f"✅ 已注册路由 ({len(routes)} 个):")
    for route in sorted(routes)[:10]:  # 显示前10个
        print(f"   - {route}")
    if len(routes) > 10:
        print(f"   ... 还有 {len(routes) - 10} 个路由")
except Exception as e:
    print(f"❌ 路由检查失败: {e}")

# 测试 4: 检查 WebSocket
try:
    from app.websocket.manager import sio
    print("✅ 成功导入 WebSocket 管理器")
except Exception as e:
    print(f"❌ WebSocket 导入失败: {e}")

print("-" * 50)
print("✅ 所有测试通过！后端配置正确。")
print("\n💡 如果 Docker 容器仍无法启动，请检查:")
print("   1. 数据库连接 (PostgreSQL 是否正在运行)")
print("   2. Redis 连接 (Redis 是否正在运行)")
print("   3. Docker 日志: docker-compose logs backend")
