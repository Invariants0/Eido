from datetime import datetime, timedelta

MOCK_MVPS = [
    {
        "id": 1,
        "name": "EcoTrack AI",
        "status": "deployed",
        "idea_summary": "Personal carbon footprint tracker using AI to suggest lifestyle changes.",
        "deployment_url": "https://ecotrack.eido.app",
        "token_id": "ECO-123",
        "retry_count": 0,
        "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
        "updated_at": (datetime.utcnow() - timedelta(days=4)).isoformat(),
    },
    {
        "id": 2,
        "name": "DevFlow Orchestrator",
        "status": "building",
        "idea_summary": "Autonomous project manager for software teams that assign tasks based on developer skills.",
        "deployment_url": None,
        "token_id": None,
        "retry_count": 1,
        "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
    {
        "id": 3,
        "name": "HealthSync",
        "status": "idea",
        "idea_summary": "Unified health data platform connecting wearables with medical records.",
        "deployment_url": None,
        "token_id": None,
        "retry_count": 0,
        "created_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
        "updated_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
    },
    {
        "id": 4,
        "name": "QuantumLeap Finance",
        "status": "failed",
        "idea_summary": "DeFi lending protocol using quantum-inspired risk assessment models.",
        "deployment_url": None,
        "token_id": None,
        "retry_count": 3,
        "created_at": (datetime.utcnow() - timedelta(days=10)).isoformat(),
        "updated_at": (datetime.utcnow() - timedelta(days=9)).isoformat(),
    }
]

MOCK_ACTIVITY = [
    {
        "id": "act-1",
        "type": "deploy",
        "message": "EcoTrack AI successfully deployed to production on here.now",
        "timestamp": (datetime.utcnow() - timedelta(days=4)).isoformat(),
    },
    {
        "id": "act-2",
        "type": "build",
        "message": "DevFlow Orchestrator building phase started: Step 4/12",
        "timestamp": datetime.utcnow().isoformat(),
    },
    {
        "id": "act-3",
        "type": "token",
        "message": "EcoTrack ($ECO) smart contract verified on Surge Protocol",
        "timestamp": (datetime.utcnow() - timedelta(days=4, hours=2)).isoformat(),
    },
    {
        "id": "act-4",
        "type": "error",
        "message": "QuantumLeap Finance: Deployment failed due to smart contract audit issues",
        "timestamp": (datetime.utcnow() - timedelta(days=9)).isoformat(),
    }
]

MOCK_DASHBOARD_SUMMARY = {
    "totalMvps": len(MOCK_MVPS),
    "activeBuilds": sum(1 for m in MOCK_MVPS if m["status"] == "building"),
    "deployedMvps": sum(1 for m in MOCK_MVPS if m["status"] == "deployed"),
    "tokensCreated": sum(1 for m in MOCK_MVPS if m["token_id"]),
}
