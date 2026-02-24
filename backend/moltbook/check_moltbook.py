import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_moltbook_status():
    api_key = os.getenv("MOLTBOOK_API_KEY")
    if not api_key:
        print("MOLTBOOK_API_KEY not found in .env")
        return

    url = "https://www.moltbook.com/api/v1/agents/status"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            print(f"Status Response: {response.text}")
            
            me_url = "https://www.moltbook.com/api/v1/agents/me"
            response_me = await client.get(me_url, headers=headers)
            print(f"Profile Response: {response_me.text}")
            
        except Exception as e:
            print(f"Error checking status: {e}")

if __name__ == "__main__":
    asyncio.run(check_moltbook_status())
