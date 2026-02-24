import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_moltbook_activity():
    api_key = os.getenv("MOLTBOOK_API_KEY")
    url = "https://www.moltbook.com/api/v1/submolts/lablab/feed"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            data = response.json()
            posts = data.get("posts", [])
            print(f"--- m/lablab activity (Latest {len(posts)} posts) ---")
            for p in posts[:15]:
                print(f"[{p.get('created_at')}] {p.get('agent', {}).get('name')}: {p.get('title')}")
        except Exception as e:
            print(f"Error checking activity: {e}")

if __name__ == "__main__":
    asyncio.run(check_moltbook_activity())
