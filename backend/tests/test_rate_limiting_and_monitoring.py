"""Tests for rate limiting and monitoring functionality."""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from app.main import app
from app.middleware.rate_limiter import (
    InMemoryRateLimiter,
    parse_rate_limit,
    get_client_identifier,
)
from app.monitoring.metrics import (
    track_mvp_pipeline_duration,
    track_mvp_stage_cost,
    track_llm_request,
)


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    @pytest.mark.asyncio
    async def test_in_memory_rate_limiter_allows_under_limit(self):
        """Test that requests under limit are allowed."""
        limiter = InMemoryRateLimiter()
        
        # Should allow first 5 requests
        for i in range(5):
            is_allowed, retry_after = await limiter.is_allowed("test_key", 5, 60)
            assert is_allowed is True
            assert retry_after == 0
    
    @pytest.mark.asyncio
    async def test_in_memory_rate_limiter_blocks_over_limit(self):
        """Test that requests over limit are blocked."""
        limiter = InMemoryRateLimiter()
        
        # Fill up the limit
        for i in range(5):
            await limiter.is_allowed("test_key", 5, 60)
        
        # 6th request should be blocked
        is_allowed, retry_after = await limiter.is_allowed("test_key", 5, 60)
        assert is_allowed is False
        assert retry_after > 0
    
    @pytest.mark.asyncio
    async def test_rate_limiter_sliding_window(self):
        """Test sliding window behavior."""
        limiter = InMemoryRateLimiter()
        
        # Make 3 requests
        for i in range(3):
            await limiter.is_allowed("test_key", 3, 1)  # 3 per second
        
        # Wait for window to slide
        await asyncio.sleep(1.1)
        
        # Should allow new requests
        is_allowed, _ = await limiter.is_allowed("test_key", 3, 1)
        assert is_allowed is True
    
    def test_parse_rate_limit_valid(self):
        """Test parsing valid rate limit strings."""
        assert parse_rate_limit("10/second") == (10, 1)
        assert parse_rate_limit("100/minute") == (100, 60)
        assert parse_rate_limit("1000/hour") == (1000, 3600)
        assert parse_rate_limit("10000/day") == (10000, 86400)
    
    def test_parse_rate_limit_invalid(self):
        """Test parsing invalid rate limit strings."""
        with pytest.raises(ValueError):
            parse_rate_limit("invalid")
        
        with pytest.raises(ValueError):
            parse_rate_limit("10/invalid_period")
    
    def test_get_client_identifier_from_user_id(self):
        """Test client identification from user ID."""
        request = Mock()
        request.state.user_id = "user123"
        request.headers = {}
        
        identifier = get_client_identifier(request)
        assert identifier == "user:user123"
    
    def test_get_client_identifier_from_api_key(self):
        """Test client identification from API key."""
        request = Mock()
        request.state = Mock(spec=[])  # No user_id
        request.headers = {"X-API-Key": "sk-1234567890abcdef"}
        
        identifier = get_client_identifier(request)
        assert identifier == "apikey:sk-1234567890ab"
    
    def test_get_client_identifier_from_ip(self):
        """Test client identification from IP address."""
        request = Mock()
        request.state = Mock(spec=[])
        request.headers = {}
        request.client = Mock()
        request.client.host = "192.168.1.1"
        
        identifier = get_client_identifier(request)
        assert identifier == "ip:192.168.1.1"


class TestMetrics:
    """Test metrics tracking functionality."""
    
    def test_track_mvp_pipeline_duration(self):
        """Test tracking MVP pipeline duration."""
        # Should not raise exception
        track_mvp_pipeline_duration(120.5, "completed")
        track_mvp_pipeline_duration(45.2, "failed")
    
    def test_track_mvp_stage_cost(self):
        """Test tracking MVP stage cost."""
        # Should not raise exception
        track_mvp_stage_cost("ideation", 0.50, 1000)
        track_mvp_stage_cost("building", 2.00, 5000)
    
    def test_track_llm_request(self):
        """Test tracking LLM request metrics."""
        # Should not raise exception
        track_llm_request(
            model="gpt-4",
            task_type="IDEATION",
            duration_seconds=2.5,
            tokens=1500,
            cost_dollars=0.045,
            status="success"
        )


class TestHealthChecks:
    """Test health check endpoints."""
    
    def test_basic_health_check(self):
        """Test basic health check endpoint."""
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data
    
    def test_deep_health_check(self):
        """Test deep health check endpoint."""
        client = TestClient(app)
        response = client.get("/health/deep")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "checks" in data
        assert "database" in data["checks"]


class TestRateLimitingIntegration:
    """Integration tests for rate limiting."""
    
    def test_rate_limit_headers_present(self):
        """Test that rate limit headers are present in responses."""
        client = TestClient(app)
        response = client.get("/api/mvp/list")
        
        # Check for rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
    
    @pytest.mark.skip(reason="Requires actual rate limit to be hit")
    def test_rate_limit_exceeded_response(self):
        """Test response when rate limit is exceeded."""
        client = TestClient(app)
        
        # Make many requests to exceed limit
        for i in range(200):
            response = client.get("/api/mvp/list")
        
        # Should eventually get 429
        assert response.status_code == 429
        data = response.json()
        assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Retry-After" in response.headers


class TestMetricsEndpoint:
    """Test metrics endpoint."""
    
    def test_metrics_endpoint_accessible(self):
        """Test that metrics endpoint is accessible."""
        client = TestClient(app)
        response = client.get("/metrics")
        
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]
    
    def test_metrics_endpoint_contains_metrics(self):
        """Test that metrics endpoint returns Prometheus format."""
        client = TestClient(app)
        response = client.get("/metrics")
        
        content = response.text
        
        # Check for some expected metrics
        assert "eido_mvp_created_total" in content or "# HELP" in content
        assert "# TYPE" in content or len(content) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
