"""
Direct integration test for Moltbook and Surge — no LLM calls, no full pipeline.
Run with: python tests/test_integrations_direct.py
"""
import asyncio
import sys
import os

# Allow importing from backend/app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from app.moltbook.publisher import MoltbookPublisher
from app.integrations.surge import SurgeTokenManager


async def test_moltbook():
    print("\n" + "=" * 60)
    print("  MOLTBOOK INTEGRATION TEST")
    print("=" * 60)

    publisher = MoltbookPublisher()
    api_key_preview = (publisher.api_key or "")[:12] + "..." if publisher.api_key else "NOT SET"
    print(f"  API Key : {api_key_preview}")
    print(f"  Base URL: {publisher.base_url}")

    # 1. heartbeat / home
    print("\n[1] Heartbeat check...")
    hb = await publisher.heartbeat()
    print(f"    Result: {hb}")

    # 2. post
    print("\n[2] Posting MVP idea to lablab submolt...")
    post_id = await publisher.post(
        title="MVP Idea: AI-Powered Invoice Tracker",
        content=(
            "An autonomous SaaS that extracts, categorises, and reconciles invoices "
            "using GPT-4o vision. Targets freelancers and small agencies. "
            "Built by EIDO autonomous factory during the lablab.ai hackathon."
        ),
        tags=["eido", "lablab", "ai", "saas", "mvp"],
        submolt="lablab",
    )
    print(f"    Post ID: {post_id}")

    if post_id and "error" not in str(post_id) and "skipped" not in str(post_id):
        print("    [OK] Post created")

        # 3. fetch engagement
        print("\n[3] Fetching engagement...")
        eng = await publisher.fetch_engagement(post_id)
        print(f"    Engagement: {eng}")
    else:
        print("    [WARN] Post skipped or errored (check API key / network)")


async def test_surge():
    print("\n" + "=" * 60)
    print("  SURGE TOKENIZATION TEST")
    print("=" * 60)

    surge = SurgeTokenManager()
    api_key_preview = (surge.api_key or "")[:12] + "..." if surge.api_key else "NOT SET"
    print(f"  API Key : {api_key_preview}")
    print(f"  Base URL: {surge.BASE_URL}")

    print("\n[1] Creating SURGE token for MVP #42 (full launch flow)...")
    result = await surge.create_token(
        mvp_id=42,
        name="AI Invoice Tracker",
        symbol="AIT",
        description="Autonomous SaaS that extracts, categorises, and reconciles invoices using AI. Built during lablab.ai hackathon by EIDO.",
        category="ai",
    )
    print(f"    Result : {result}")

    status = result.get("status", "unknown")
    if status == "mocked":
        print("    [MOCKED] Token mocked (no SURGE_API_KEY) -- mock data returned correctly")
    elif status == "pending":
        print("    [PENDING] Wallet funded, launch pending (SURGE image proxy issue on their side)")
        print(f"    Token ID : {result.get('token_id')}")
        print(f"    Address  : {result.get('token_address')}")
        print(f"    SURGE URL: {result.get('surge_url')}")
        print(f"    Explorer : {result.get('explorer_url')}")
        print(f"    Wallet   : {result.get('wallet_id')}")
        print(f"    Error    : {result.get('error', '')[:80]}")
    elif status == "failed":
        print(f"    [FAIL] Token creation failed: {result.get('error')}")
    elif status == "live":
        token_addr = result.get("token_address") or result.get("contract_address")
        print("    [LIVE] Token LIVE on Base!")
        print(f"    Contract : {token_addr}")
        print(f"    SURGE URL: {result.get('surge_url')}")
        print(f"    Explorer : {result.get('explorer_url')}")
        print(f"    Summary  : {result.get('summary')}")
    else:
        print(f"    Result: {result}")


async def main():
    await test_moltbook()
    await test_surge()
    print("\n" + "=" * 60)
    print("  DONE")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
