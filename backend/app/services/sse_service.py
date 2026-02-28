import asyncio
import json
from typing import Dict, List, Any
from datetime import datetime

class SSEManager:
    """Manages Server-Sent Event (SSE) streams for real-time pipeline updates."""
    
    def __init__(self):
        # Dict of mvp_id -> list of queues for connected clients
        self.queues: Dict[int, List[asyncio.Queue]] = {}
        self.app_loop: Optional[asyncio.AbstractEventLoop] = None
        
    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """Store the main app loop for thread-safe broadcasts."""
        self.app_loop = loop

    async def subscribe(self, mvp_id: int) -> asyncio.Queue:
        """Subscribe a client to events for a specific MVP."""
        if mvp_id not in self.queues:
            self.queues[mvp_id] = []
        
        queue = asyncio.Queue()
        self.queues[mvp_id].append(queue)
        print(f"DEBUG: Client subscribed to MVP {mvp_id} events. Total listeners: {len(self.queues[mvp_id])}")
        return queue
        
    def unsubscribe(self, mvp_id: int, queue: asyncio.Queue):
        """Clean up a subscription when a client disconnects."""
        if mvp_id in self.queues:
            self.queues[mvp_id].remove(queue)
            if not self.queues[mvp_id]:
                del self.queues[mvp_id]
        print(f"DEBUG: Client unsubscribed from MVP {mvp_id}.")

    async def broadcast(self, mvp_id: Any, event_type: str, data: Any):
        """Send an event to all subscribers of an MVP."""
        # Check both int and string forms to be safe
        try:
            m_id = int(mvp_id)
        except (ValueError, TypeError):
            m_id = str(mvp_id)
            
        if m_id not in self.queues:
            # Try string fallback if int failed
            m_id = str(mvp_id)
            if m_id not in self.queues:
                return

        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": event_type,
            "data": data
        }
        
        # Format as SSE message
        sse_message = f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"
        
        # Push to all listeners
        for queue in self.queues[m_id]:
            await queue.put(sse_message)

# Global manager instance
sse_manager = SSEManager()
