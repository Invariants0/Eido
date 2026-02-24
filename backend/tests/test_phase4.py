import asyncio
import os
from app.moltbook.publisher import MoltbookPublisher
from app.integrations.deployment import HereNowClient
from app.integrations.surge import SurgeTokenManager
from app.logger import configure_logging

async def test_integrations():
    configure_logging("DEBUG")
    print("--- Testing Phase 4 Integrations ---")
    
    # 1. Moltbook
    print("\n[1/3] Moltbook Publisher test...")
    molt = MoltbookPublisher()
    post_id = await molt.post(
        title="Test MVP Launch",
        content="This is an automated test post from EIDO on Moltbook.",
        tags=["test", "eido"],
        submolt="lablab"
    )
    print(f"Post ID: {post_id}")
    
    # 2. here.now
    print("\n[2/3] here.now Deployment test...")
    deployer = HereNowClient()
    image = await deployer.build_image("Dockerfile", "./")
    url = await deployer.deploy(image, "EIDO Test MVP")
    print(f"Deployment URL: {url}")
    healthy = await deployer.health_check(url)
    print(f"Health Check: {'PASSED' if healthy else 'FAILED'}")
    
    # 3. SURGE
    print("\n[3/3] SURGE Tokenization test...")
    surge = SurgeTokenManager()
    token = await surge.create_token(mvp_id=999, name="EIDO Test Token", symbol="ETT")
    print(f"Token Info: {token}")

if __name__ == "__main__":
    asyncio.run(test_integrations())
