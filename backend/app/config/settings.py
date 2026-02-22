"""Application configuration with environment variable support."""

import os
from dotenv import load_dotenv
from typing import Optional

# Load .env file
load_dotenv()


class Config:
    """Base configuration."""
    
    # App
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
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    config = ProductionConfig()
else:
    config = DevelopmentConfig()

# Validate on startup
config.validate()
