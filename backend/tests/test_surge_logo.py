"""Find which image URL SURGE's backend can download."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
import httpx

API_KEY = os.getenv("SURGE_API_KEY")
BASE = "https://back.surge.xyz"

CANDIDATES = [
    "https://api.dicebear.com/7.x/initials/png?seed=EIDO&size=400",
    "https://picsum.photos/id/1/400/400.jpg",
    "https://i.imgur.com/jNNT4LE.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Artificial_Intelligence_Image.jpg/400px-Artificial_Intelligence_Image.jpg",
    "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=400&fit=crop&q=80",
    "https://raw.githubusercontent.com/github/explore/main/topics/artificial-intelligence/artificial-intelligence.png",
    "https://avatars.githubusercontent.com/u/9919195?s=400",
]

async def test_logo(client, url):
    """Try launching with this logo URL; returns True if not a logo-download error."""
    try:
        r = await client.post(
            f"{BASE}/openclaw/launch",
            headers={"X-API-Key": API_KEY},
            json={
                "name": "EIDO Test Logo",
                "ticker": "ETL",
                "description": "Logo URL test",
                "logoUrl": url,
                "chainId": "1",
                "walletId": "mjkc2u3jnwyrelbn8vq0qnj8",
                "ethAmount": "0.00005",
                "category": "ai",
            },
            timeout=45.0,
        )
        data = r.json()
        msg = data.get("message", "")
        if "download" in msg.lower() or "logo" in msg.lower():
            print(f"  LOGO FAIL  : {url[:70]}")
            print(f"             : {msg[:80]}")
            return False
        else:
            print(f"  PASS (non-logo error or success): {url[:70]}")
            print(f"             : {msg[:80]}")
            return True  # not a logo error — URL was accepted
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

async def main():
    async with httpx.AsyncClient() as client:
        for url in CANDIDATES:
            ok = await test_logo(client, url)
            if ok:
                print(f"\n  ✅ WORKING URL: {url}\n")
                break
            await asyncio.sleep(1)

asyncio.run(main())
