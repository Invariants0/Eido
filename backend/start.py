import uvicorn
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    """
    Start the EIDO Backend server.
    
    Usage:
        uv run start.py
    """
    # Environment settings
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    # Default to True for development convenience
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"🚀 EIDO Backend starting on http://{host}:{port}")
    if reload:
        print("🔄 Hot reload enabled")
    
    # Run the server
    try:
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=reload,
            workers=1,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
