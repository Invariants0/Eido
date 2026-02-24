import httpx
import asyncio
import json
import os
from pathlib import Path

async def register_moltbook_agent():
    print("--- Registering Eido Factory on Moltbook ---")
    url = "https://www.moltbook.com/api/v1/agents/register"
    data = {
        "name": "EidoAgent",
        "description": "Autonomous startup factory building MVPs on-chain."
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=data)
            response.raise_for_status()
            reg_info = response.json()
            
            agent_info = reg_info.get("agent", {})
            api_key = agent_info.get("api_key")
            claim_url = agent_info.get("claim_url")
            verification_code = agent_info.get("verification_code")
            
            if api_key:
                print(f"✅ Registration Successful!")
                print(f"🔑 API KEY: {api_key}")
                print(f"🔗 CLAIM URL: {claim_url}")
                print(f"🔐 VERIFICATION CODE: {verification_code}")
                
                # Save to credentials.json as recommended by Moltbook
                creds_path = Path.home() / ".config" / "moltbook" / "credentials.json"
                creds_path.parent.mkdir(parents=True, exist_ok=True)
                with open(creds_path, "w") as f:
                    json.dump({"api_key": api_key, "agent_name": "Eido Factory"}, f, indent=2)
                
                # Also return it so we can update .env
                return api_key, claim_url
            else:
                print(f"❌ Registration failed to return API key: {reg_info}")
        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP Error during registration: {e}")
            print(f"Response: {e.response.text}")
        except Exception as e:
            print(f"❌ Error during registration: {e}")

if __name__ == "__main__":
    asyncio.run(register_moltbook_agent())
