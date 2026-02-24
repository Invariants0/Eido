from crewai.tools import tool
import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://www.moltbook.com/api/v1"
API_KEY = os.getenv("MOLTBOOK_API_KEY")

@tool("post_to_moltbook")
def post_to_moltbook(title: str, content: str, submolt: str = "lablab") -> str:
    """
    Post a new update to Moltbook. 
    Use this to share progress, announce new features, or launch MVPs.
    Defaults to the 'lablab' submolt for hackathon updates.
    Arguments:
    - title: The title of the post
    - content: The main body text of the post
    - submolt: The community to post to (default: 'lablab')
    """
    if not API_KEY:
        return "Error: MOLTBOOK_API_KEY not set."
        
    with httpx.Client(timeout=30.0) as client:
        try:
            # 1. Post content
            resp = client.post(
                f"{BASE_URL}/posts",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={
                    "submolt": submolt,
                    "title": title,
                    "content": content
                }
            )
            resp.raise_for_status()
            data = resp.json()
            
            # 2. Check for challenge
            if data.get("verification_required"):
                verification = data.get("post", {}).get("verification")
                if verification:
                    code = verification.get("verification_code")
                    challenge = verification.get("challenge_text")
                    
                    from app.services.ai_runtime.llm_router import LLMRouter
                    router = LLMRouter()
                    try:
                        loop = asyncio.get_event_loop()
                    except RuntimeError:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        
                    answer_data = loop.run_until_complete(
                        router.execute_llm_call(
                            task_id="IDEATION",
                            prompt=f"Solve this math challenge and return ONLY the number (exactly 2 decimals): {challenge}"
                        )
                    )
                    answer = answer_data.get("content", "").strip()
                    
                    # Verify
                    client.post(
                        f"{BASE_URL}/verify",
                        headers={"Authorization": f"Bearer {API_KEY}"},
                        json={"verification_code": code, "answer": answer}
                    )
            return f"Successfully posted to m/{submolt}"
        except Exception as e:
            return f"Error posting to Moltbook: {str(e)}"

@tool("get_moltbook_feed")
def get_moltbook_feed(submolt: str = "lablab") -> str:
    """
    Get the latest posts from a submolt to see what others are doing.
    Arguments:
    - submolt: The community to read from (default: 'lablab')
    """
    if not API_KEY:
        return "Error: MOLTBOOK_API_KEY not set."

    with httpx.Client(timeout=30.0) as client:
        try:
            resp = client.get(
                f"{BASE_URL}/posts",
                headers={"Authorization": f"Bearer {API_KEY}"},
                params={"submolt": submolt, "limit": 5, "sort": "new"}
            )
            resp.raise_for_status()
            posts = resp.json().get("posts", [])
            if not posts: return "No posts found."
            return "\n".join([f"- [{p.get('id')}] {p.get('title')} by {p.get('agent', {}).get('name')}" for p in posts])
        except Exception as e:
            return f"Error fetching feed: {str(e)}"

@tool("comment_on_moltbook_post")
def comment_on_moltbook_post(post_id: str, content: str) -> str:
    """
    Add a comment to a post.
    Arguments:
    - post_id: The ID of the post to comment on
    - content: The text of your comment
    """
    if not API_KEY:
        return "Error: MOLTBOOK_API_KEY not set."

    with httpx.Client(timeout=30.0) as client:
        try:
            resp = client.post(
                f"{BASE_URL}/posts/{post_id}/comments",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={"content": content}
            )
            resp.raise_for_status()
            return "Successfully commented."
        except Exception as e:
            return f"Error commenting: {str(e)}"
