"""Application configuration with environment variable support."""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""

    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    APP_NAME = "EIDO Backend"
    APP_VERSION = "0.1.0"

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./eido.db")

    ALLOWED_ORIGINS = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000"
    ).split(",")

    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    SURGE_API_KEY = os.getenv("SURGE_API_KEY")
    SURGE_TESTNET = os.getenv("SURGE_TESTNET", "true").lower() == "true"
    REQUIRE_SURGE_API_KEY = os.getenv("REQUIRE_SURGE_API_KEY", "false").lower() == "true"

    MOLTBOOK_API_KEY = os.getenv("MOLTBOOK_API_KEY")
    HERENOW_API_KEY = os.getenv("HERENOW_API_KEY")

    EIDO_WEBHOOK_URL = os.getenv("EIDO_WEBHOOK_URL")
    EIDO_API_KEY = os.getenv("EIDO_API_KEY")

    E2B_API_KEY = os.getenv("E2B_API_KEY")

    MAX_AGENT_RETRIES = int(os.getenv("MAX_AGENT_RETRIES", "3"))
    AGENT_TIMEOUT_SECONDS = int(os.getenv("AGENT_TIMEOUT_SECONDS", "300"))

    MAX_STAGE_RETRIES = int(os.getenv("MAX_STAGE_RETRIES", "2"))
    MAX_LLM_RETRIES = int(os.getenv("MAX_LLM_RETRIES", "3"))
    MAX_TOOL_INVOCATIONS = int(os.getenv("MAX_TOOL_INVOCATIONS", "50"))
    MAX_TOTAL_RUNTIME = int(os.getenv("MAX_TOTAL_RUNTIME", "3600"))
    MAX_TOTAL_COST = float(os.getenv("MAX_TOTAL_COST", "10.0"))

    DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "llama-3.1-8b-instant")
    IDEATION_LLM_MODEL = os.getenv("IDEATION_LLM_MODEL", "llama-3.1-8b-instant")
    ARCHITECTURE_LLM_MODEL = os.getenv("ARCHITECTURE_LLM_MODEL", "llama-3.1-70b-versatile")
    BUILDING_LLM_MODEL = os.getenv("BUILDING_LLM_MODEL", "llama-3.3-70b-versatile")
    DEPLOYMENT_LLM_MODEL = os.getenv("DEPLOYMENT_LLM_MODEL", "gemma2-9b-it")
    TOKENIZATION_LLM_MODEL = os.getenv("TOKENIZATION_LLM_MODEL", "mixtral-8x7b-32768")
    SUMMARY_LLM_MODEL = os.getenv("SUMMARY_LLM_MODEL", "llama-3.1-8b-instant")

    AGENT_MODEL_MAPPING = {
        "analyst": os.getenv("ANALYST_LLM_MODEL", "ollama/glm-5:cloud"),
        "researcher": os.getenv("RESEARCHER_LLM_MODEL", "ollama/kimi-k2.5:cloud"),
        "social_manager": os.getenv("SOCIAL_MANAGER_LLM_MODEL", "llama-3.1-8b-instant"),
        "architect": os.getenv("ARCHITECT_LLM_MODEL", "ollama/glm-5:cloud"),
        "tech_lead": os.getenv("TECH_LEAD_LLM_MODEL", "ollama/minimax-m2.5:cloud"),
        "developer": os.getenv("DEVELOPER_LLM_MODEL", "ollama/codellama:latest"),
        "qa": os.getenv("QA_LLM_MODEL", "llama-3.1-8b-instant"),
        "devops": os.getenv("DEVOPS_LLM_MODEL", "ollama/minimax-m2.5:cloud"),
        "blockchain": os.getenv("BLOCKCHAIN_LLM_MODEL", "ollama/codellama:latest"),
    }

    AGENT_DELAY_SECONDS = float(os.getenv("AGENT_DELAY_SECONDS", "1.0"))

    GROQ_FALLBACK_MODELS = [
        m.strip()
        for m in os.getenv(
            "GROQ_FALLBACK_MODELS",
            "llama-3.1-8b-instant,llama-3.3-70b-versatile,mixtral-8x7b-32768,gemma2-9b-it",
        ).split(",")
        if m.strip()
    ]

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    OLLAMA_CLOUD_API_KEY = os.getenv("OLLAMA_CLOUD_API_KEY", "")

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    MAX_CONTEXT_TOKENS = int(os.getenv("MAX_CONTEXT_TOKENS", "8000"))
    MAX_PROMPT_SIZE = int(os.getenv("MAX_PROMPT_SIZE", "16000"))

    ALLOWED_TOOL_PATHS = os.getenv("ALLOWED_TOOL_PATHS", "/tmp/eido,./workspace").split(",")
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    TOOL_EXECUTION_TIMEOUT = int(os.getenv("TOOL_EXECUTION_TIMEOUT", "30"))
    ALLOWED_COMMANDS = os.getenv("ALLOWED_COMMANDS", "ls,cat,echo,mkdir,touch").split(",")

    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_STORAGE = os.getenv("RATE_LIMIT_STORAGE", "memory")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    MVP_CREATION_LIMIT = os.getenv("MVP_CREATION_LIMIT", "10/hour")
    MVP_LIST_LIMIT = os.getenv("MVP_LIST_LIMIT", "100/minute")
    MVP_GET_LIMIT = os.getenv("MVP_GET_LIMIT", "200/minute")
    GLOBAL_API_LIMIT = os.getenv("GLOBAL_API_LIMIT", "1000/minute")

    MAX_CONCURRENT_PIPELINES_PER_USER = int(os.getenv("MAX_CONCURRENT_PIPELINES_PER_USER", "3"))
    MAX_CONCURRENT_PIPELINES_GLOBAL = int(os.getenv("MAX_CONCURRENT_PIPELINES_GLOBAL", "50"))

    METRICS_ENABLED = os.getenv("METRICS_ENABLED", "true").lower() == "true"
    METRICS_PORT = int(os.getenv("METRICS_PORT", "9090"))
    METRICS_PATH = os.getenv("METRICS_PATH", "/metrics")

    HEALTH_CHECK_ENABLED = os.getenv("HEALTH_CHECK_ENABLED", "true").lower() == "true"
    HEALTH_CHECK_DEEP = os.getenv("HEALTH_CHECK_DEEP", "false").lower() == "true"

    ALERT_COST_THRESHOLD = float(os.getenv("ALERT_COST_THRESHOLD", "100.0"))
    ALERT_ERROR_RATE_THRESHOLD = float(os.getenv("ALERT_ERROR_RATE_THRESHOLD", "0.1"))
    ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL")

    BACKEND_JWT_SECRET = os.getenv("BACKEND_JWT_SECRET", "dev-backend-jwt-secret-change-me")
    SESSION_TOKEN_TTL_HOURS = int(os.getenv("SESSION_TOKEN_TTL_HOURS", "168"))
    ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

    @classmethod
    def validate(cls) -> None:
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL must be configured")
        if cls.ENVIRONMENT == "production" and cls.BACKEND_JWT_SECRET.startswith("dev-"):
            raise ValueError("BACKEND_JWT_SECRET must be set to a secure value in production")
        if cls.REQUIRE_SURGE_API_KEY and not cls.SURGE_API_KEY:
            raise ValueError("SURGE_API_KEY is required when REQUIRE_SURGE_API_KEY=true")


class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = "INFO"

    @classmethod
    def validate(cls) -> None:
        super().validate()
        if not cls.SURGE_API_KEY:
            raise ValueError("SURGE_API_KEY required in production")
        if not cls.MOLTBOOK_API_KEY:
            raise ValueError("MOLTBOOK_API_KEY required in production")
        if not cls.HERENOW_API_KEY:
            raise ValueError("HERENOW_API_KEY required in production")


if Config.ENVIRONMENT == "production":
    config = ProductionConfig()
else:
    config = DevelopmentConfig()

config.validate()
