import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional


class SSEManager:
    """Manages Server-Sent Event (SSE) streams for real-time pipeline updates."""

    def __init__(self):
        self.queues: Dict[int, List[asyncio.Queue]] = {}
        self.app_loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.app_loop = loop

    async def subscribe(self, mvp_id: int) -> asyncio.Queue:
        if mvp_id not in self.queues:
            self.queues[mvp_id] = []

        queue = asyncio.Queue()
        self.queues[mvp_id].append(queue)
        return queue

    def unsubscribe(self, mvp_id: int, queue: asyncio.Queue):
        if mvp_id in self.queues and queue in self.queues[mvp_id]:
            self.queues[mvp_id].remove(queue)
            if not self.queues[mvp_id]:
                del self.queues[mvp_id]

    async def broadcast(self, mvp_id: Any, event_type: str, data: Any):
        try:
            key = int(mvp_id)
        except (ValueError, TypeError):
            return

        listeners = self.queues.get(key)
        if not listeners:
            return

        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": event_type,
            "data": data,
        }
        sse_message = f"event: {event_type}\\ndata: {json.dumps(payload)}\\n\\n"

        for queue in list(listeners):
            await queue.put(sse_message)


sse_manager = SSEManager()
