import requests
import json

def trigger_mvp():
    url = "http://localhost:8000/api/mvp/start"
    payload = {
        "name": "SSE Test MVP",
        "idea_summary": "An AI-powered automated grocery list that syncs with smart fridges."
    }
    
    print(f"Triggering MVP pipeline via API: {url}")
    response = requests.post(url, json=payload)
    
    if response.status_code == 202:
        mvp = response.json()
        print(f"SUCCESS! MVP Scheduled with ID: {mvp['id']}")
        print(f"Now watch your SSE Terminal for events for MVP {mvp['id']}!")
    else:
        print(f"FAILED: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    trigger_mvp()
