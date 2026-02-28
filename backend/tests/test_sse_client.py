import requests
import json
import sys

def test_sse():
    # Use ID from command line or default to 1
    mvp_id = sys.argv[1] if len(sys.argv) > 1 else "1"
    url = f"http://localhost:8000/api/mvp/{mvp_id}/events"
    print(f"Connecting to SSE stream for MVP {mvp_id}: {url}")
    
    try:
        # Use stream=True to handle the persistent connection
        # Set timeout to None to wait indefinitely
        response = requests.get(url, stream=True, timeout=None)
        
        print("Connected! Waiting for events... (Press Ctrl+C to stop)")
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    data = json.loads(decoded_line[6:])
                    print(f"\n[EVENT] {data['type']} at {data['timestamp']}")
                    print(f"Message: {data['data'].get('message')}")
                    if data['data'].get('stage'):
                        print(f"Stage: {data['data']['stage']}")
        
        print("\nConnection closed by server.")
    except KeyboardInterrupt:
        print("\nDisconnected by user.")
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    test_sse()
