"""Moltbook autonomous publishing service."""

import os
import httpx
import json
from typing import Optional, List, Dict, Any
from app.logger import get_logger

logger = get_logger(__name__)


class MoltbookPublisher:
    """Publishes MVP updates to Moltbook for public proof-of-life."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MOLTBOOK_API_KEY")
        self.base_url = "https://www.moltbook.com/api/v1"
        self.timeout = 30.0
        self._router = None # Lazy load

    async def register_agent(self, name: str, description: str) -> Dict[str, Any]:
        """Register a new EIDO agent on Moltbook."""
        logger.info(f"Registering agent {name} on Moltbook")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/agents/register",
                    json={"name": name, "description": description}
                )
                response.raise_for_status()
                data = response.json()
                # If we get a new API key, we should ideally save it
                return data
            except Exception as e:
                logger.error(f"Moltbook registration failed: {e}")
                return {"status": "error", "message": str(e)}

    async def post(self, title: str, content: str, tags: List[str] = None, submolt: str = "general") -> str:
        """Post an update to Moltbook and handle verification challenge."""
        if not self.api_key:
            logger.warning("MOLTBOOK_API_KEY not configured, skipping post")
            return "skipped-no-key"
        
        logger.info(f"Posting to Moltbook [{submolt}]: {title}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/posts",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "submolt": submolt,
                        "title": title,
                        "content": content,
                        "tags": tags or ["eido", "mvp", "autonomous"]
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                post_id = data.get("post", {}).get("id") or data.get("id")
                
                # Check for verification challenge
                if data.get("verification_required") or data.get("post", {}).get("verification"):
                    verification = data.get("post", {}).get("verification")
                    if verification:
                        code = verification.get("verification_code")
                        challenge = verification.get("challenge_text")
                        logger.info("Moltbook verification required. Solving challenge...")
                        
                        answer = await self.solve_challenge(challenge)
                        if answer:
                            await self.verify(code, answer)
                
                return post_id or f"post-{id(content)}"
            except Exception as e:
                logger.error(f"Moltbook post failed: {e}")
                if hasattr(e, 'response'):
                    logger.error(f"Response: {e.response.text}")
                return f"error-{id(content)}"

    async def solve_challenge(self, challenge_text: str) -> Optional[str]:
        """Solve the Moltbook AI verification challenge using an LLM."""
        from app.services.ai_runtime.llm_router import LLMRouter
        if not self._router:
            self._router = LLMRouter()
            
        system_prompt = (
            "You are an AI verification challenge solver for Moltbook. "
            "You will be given an obfuscated math word problem (lobster + physics themed). "
            "The challenge contains symbols, alternating caps, and broken words. "
            "Extract the two numbers and the operation (+, -, *, /) and solve it. "
            "Respond ONLY with the final number formatted to 2 decimal places (e.g., '15.00')."
        )
        
        try:
            result = await self._router.execute_llm_call(
                task_id="ARCHITECTURE", # Using a high-quality model for logic
                prompt=f"Challenge: {challenge_text}",
                system_prompt=system_prompt
            )
            # The router returns a dict with 'content'
            answer = result.get("content", "").strip()
            # Basic validation
            if answer.replace(".", "").replace("-", "").isdigit():
                logger.debug(f"Solved challenge: {challenge_text} -> {answer}")
                return answer
            else:
                logger.warning(f"LLM returned non-numeric answer for challenge: {answer}")
                return None
        except Exception as e:
            logger.error(f"Failed to solve Moltbook challenge: {e}")
            return None

    async def verify(self, verification_code: str, answer: str) -> bool:
        """Submit the verification challenge answer to Moltbook."""
        logger.info(f"Submitting Moltbook verification solution: {answer}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/verify",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "verification_code": verification_code,
                        "answer": answer
                    }
                )
                response.raise_for_status()
                logger.info("Moltbook verification successful!")
                return True
            except Exception as e:
                logger.error(f"Moltbook verification failed: {e}")
                if hasattr(e, 'response'):
                    logger.error(f"Response: {e.response.text}")
                return False

    async def fetch_engagement(self, post_id: str) -> Dict[str, Any]:
        """Fetch comments and engagement metrics for a post."""
        if not self.api_key or "error" in post_id or "skipped" in post_id:
            return {"likes": 0, "comments": [], "shares": 0}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/posts/{post_id}/engagement",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Moltbook fetch engagement failed: {e}")
                return {"likes": 0, "comments": [], "shares": 0}

    async def parse_feedback(self, post_id: str) -> Dict[str, Any]:
        """Extract sentiment and feedback from post responses."""
        engagement = await self.fetch_engagement(post_id)
        
        # Simple local analysis of comments if API doesn't provide it
        comments = engagement.get("comments", [])
        if not comments:
            return {
                "sentiment": "neutral",
                "topics": [],
                "summary": "No feedback yet.",
            }
        
        # In a real scenario, we might send this back to an LLM for summary
        return {
            "sentiment": "positive", # Mocking for now
            "topics": ["innovation", "speed"],
            "summary": f"Found {len(comments)} comments on the MVP post.",
        }

    async def comment(self, post_id: str, content: str, parent_id: Optional[str] = None) -> Dict[str, Any]:
        """Add a comment or reply to a post."""
        if not self.api_key:
            return {"status": "error", "message": "No API key"}
            
        logger.info(f"Commenting on post {post_id}: {content[:30]}...")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                payload = {"content": content}
                if parent_id:
                    payload["parent_id"] = parent_id
                    
                response = await client.post(
                    f"{self.base_url}/posts/{post_id}/comments",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                # Check for verification challenge
                if data.get("verification_required"):
                    verification = data.get("comment", {}).get("verification")
                    if verification:
                        code = verification.get("verification_code")
                        challenge = verification.get("challenge_text")
                        logger.info("Comment verification required. Solving...")
                        answer = await self.solve_challenge(challenge)
                        if answer:
                            await self.verify(code, answer)
                            
                return data
            except Exception as e:
                logger.error(f"Moltbook comment failed: {e}")
                return {"status": "error", "message": str(e)}

    async def vote(self, post_id: str, direction: int) -> bool:
        """Vote on a post. 1 for upvote, -1 for downvote, 0 to remove."""
        if not self.api_key:
            return False
            
        logger.info(f"Voting {direction} on post {post_id}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/posts/{post_id}/vote",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"direction": direction}
                )
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"Moltbook vote failed: {e}")
                return False

    async def get_submolt_feed(self, submolt: str = "general", limit: int = 15) -> List[Dict[str, Any]]:
        """Get the latest posts from a specific submolt."""
        if not self.api_key:
            return []
            
        logger.info(f"Fetching feed from submolt: {submolt}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/posts",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    params={"submolt": submolt, "limit": limit, "sort": "new"}
                )
                response.raise_for_status()
                data = response.json()
                return data.get("posts", [])
            except Exception as e:
                logger.error(f"Moltbook feed fetch failed: {e}")
                return []

    async def heartbeat(self) -> Dict[str, Any]:
        """Perform a Moltbook heartbeat check."""
        if not self.api_key:
            return {"status": "skipped"}
            
        logger.debug("Performing Moltbook heartbeat check-in")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                # Call /home to get latest notifications and feed status
                response = await client.get(
                    f"{self.base_url}/home",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Moltbook heartbeat failed: {e}")
                return {"status": "error", "message": str(e)}
