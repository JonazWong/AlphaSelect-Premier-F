import secrets
import string

def generate_secret_key(length=50):
    """生成安全的 SECRET_KEY"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(length))
    return secret_key

if __name__ == "__main__":
    key = generate_secret_key()
    print("=" * 60)
    print("🔑 您的 SECRET_KEY:")
    print("=" * 60)
    print(key)
    print("=" * 60)
    print("\n✅ 請複製上面的 KEY 到 docker-compose.yml 的 SECRET_KEY 欄位")