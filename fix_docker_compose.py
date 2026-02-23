import yaml
import sys

def fix_docker_compose():
    """自動修正 docker-compose.yml 常見問題"""
    
    try:
        # 讀取 docker-compose.yml
        with open('docker-compose.yml', 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        print("🔍 檢查 docker-compose.yml...")
        
        fixes = []
        
        # 修正 1: 確保 version 存在（可選，Docker Compose v2 不需要）
        if 'version' not in config:
            print("⚠️  缺少 version 欄位（Docker Compose v2+ 不需要）")
        
        # 修正 2: 檢查 services
        if 'services' not in config:
            print("❌ 缺少 services 欄位")
            return False
        
        # 修正 3: 檢查每個服務的必要欄位
        for service_name, service in config['services'].items():
            print(f"\n檢查服務: {service_name}")
            
            # 檢查 build 或 image
            if 'build' not in service and 'image' not in service:
                print(f"  ⚠️  {service_name} 缺少 build 或 image")
                fixes.append(f"{service_name}: 需要 build 或 image")
            
            # ���查環境變數格式
            if 'environment' in service:
                env = service['environment']
                if isinstance(env, dict):
                    for key, value in env.items():
                        if value == '':
                            print(f"  ⚠️  {service_name}.{key} 為空值")
                            fixes.append(f"{service_name}.{key}: 環境變數為空")
        
        # 修正 4: 檢查網絡（可選）
        if 'networks' in config:
            print("\n✅ 自定義網絡配置存在")
        
        # 修正 5: 檢查卷
        if 'volumes' in config:
            print("\n✅ 卷配置存在:")
            for volume in config['volumes']:
                print(f"  - {volume}")
        
        # 報告結果
        print("\n" + "=" * 50)
        if fixes:
            print("⚠️  發現以下問題:")
            for fix in fixes:
                print(f"  - {fix}")
            print("\n建議手動修正這些問題")
        else:
            print("✅ docker-compose.yml 語法檢查通過！")
        print("=" * 50)
        
        return len(fixes) == 0
        
    except yaml.YAMLError as e:
        print(f"❌ YAML 語法錯誤: {e}")
        return False
    except FileNotFoundError:
        print("❌ 找不到 docker-compose.yml 文件")
        return False
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        return False

if __name__ == "__main__":
    success = fix_docker_compose()
    sys.exit(0 if success else 1)