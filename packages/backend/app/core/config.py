from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://verify:verify@localhost:5432/verify"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "verify-evidence"

    # Application
    frontend_url: str = "http://localhost:3000"
    api_v1_prefix: str = "/api/v1"

    # Cache TTLs (seconds)
    gradient_cache_ttl: int = 300  # 5 minutes
    reputation_cache_ttl: int = 600  # 10 minutes
    search_cache_ttl: int = 120  # 2 minutes
    hot_claims_cache_ttl: int = 60  # 1 minute
    leaderboard_cache_ttl: int = 300  # 5 minutes
    notification_count_cache_ttl: int = 60  # 1 minute

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
