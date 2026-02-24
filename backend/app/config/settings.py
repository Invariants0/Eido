"""Application configuration with environment variable support."""

import os
from dotenv import load_dotenv
from typing import Optional

# Load .env file
load_dotenv()


class Config:
    """Base configuration."""
    
    # App
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    APP_NAME = "EIDO Backend"
    APP_VERSION = "0.1.0"
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./eido.db")
    
    # CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # External Services
    SURGE_API_KEY = os.getenv("SURGE_API_KEY")
    SURGE_TESTNET = os.getenv("SURGE_TESTNET", "true").lower() == "true"
    
    MOLTBOOK_API_KEY = os.getenv("MOLTBOOK_API_KEY")
    
    HERENOW_API_KEY = os.getenv("HERENOW_API_KEY")
    
    # Agent Settings
    MAX_AGENT_RETRIES = int(os.getenv("MAX_AGENT_RETRIES", "3"))
    AGENT_TIMEOUT_SECONDS = int(os.getenv("AGENT_TIMEOUT_SECONDS", "300"))
    
    # AI Runtime Settings
    MAX_STAGE_RETRIES = int(os.getenv("MAX_STAGE_RETRIES", "2"))
    MAX_LLM_RETRIES = int(os.getenv("MAX_LLM_RETRIES", "3"))
    MAX_TOOL_INVOCATIONS = int(os.getenv("MAX_TOOL_INVOCATIONS", "50"))
    MAX_TOTAL_RUNTIME = int(os.getenv("MAX_TOTAL_RUNTIME", "3600"))  # seconds
    MAX_TOTAL_COST = float(os.getenv("MAX_TOTAL_COST", "10.0"))  # USD
    
    # LLM Configuration
    DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "llama-3.3-70b-versatile")
    IDEATION_LLM_MODEL = os.getenv("IDEATION_LLM_MODEL", "llama-3.3-70b-versatile")
    ARCHITECTURE_LLM_MODEL = os.getenv("ARCHITECTURE_LLM_MODEL", "llama-3.3-70b-versatile")
    BUILDING_LLM_MODEL = os.getenv("BUILDING_LLM_MODEL", "llama-3.3-70b-versatile")
    DEPLOYMENT_LLM_MODEL = os.getenv("DEPLOYMENT_LLM_MODEL", "llama-3.3-70b-versatile")
    TOKENIZATION_LLM_MODEL = os.getenv("TOKENIZATION_LLM_MODEL", "llama-3.3-70b-versatile")
    SUMMARY_LLM_MODEL = os.getenv("SUMMARY_LLM_MODEL", "llama-3.3-70b-versatile")
    
    # LLM API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")  # For local LLMs or proxies
    
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Ollama (Local LLM) — no API key needed, just the URL
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    
    # Context Management
    MAX_CONTEXT_TOKENS = int(os.getenv("MAX_CONTEXT_TOKENS", "8000"))
    MAX_PROMPT_SIZE = int(os.getenv("MAX_PROMPT_SIZE", "16000"))
    
    # Tool Sandbox Settings
    ALLOWED_TOOL_PATHS = os.getenv("ALLOWED_TOOL_PATHS", "/tmp/eido,./workspace").split(",")
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    TOOL_EXECUTION_TIMEOUT = int(os.getenv("TOOL_EXECUTION_TIMEOUT", "30"))
    ALLOWED_COMMANDS = os.getenv("ALLOWED_COMMANDS", "ls,cat,echo,mkdir,touch").split(",")
    
    @classmethod
    def validate(cls) -> None:
        """Validate critical configuration."""
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL must be configured")


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    LOG_LEVEL = "INFO"
    
    @classmethod
    def validate(cls) -> None:
        """Validate production-only settings."""
        super().validate()
        if not cls.SURGE_API_KEY:
            raise ValueError("SURGE_API_KEY required in production")
        if not cls.MOLTBOOK_API_KEY:
            raise ValueError("MOLTBOOK_API_KEY required in production")
        if not cls.HERENOW_API_KEY:
            raise ValueError("HERENOW_API_KEY required in production")


# Select config based on environment
if Config.ENVIRONMENT == "production":
    config = ProductionConfig()
else:
    config = DevelopmentConfig()

# Validate on startup
config.validate()
