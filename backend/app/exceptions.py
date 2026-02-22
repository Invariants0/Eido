"""Custom exception classes for unified error handling."""


class EidoException(Exception):
    """Base exception for all EIDO errors."""

    def __init__(self, message: str, code: str = "EIDO_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


class ValidationError(EidoException):
    """Raised when input validation fails."""

    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR", status_code=422)


class NotFoundError(EidoException):
    """Raised when a resource is not found."""

    def __init__(self, resource: str, resource_id):
        message = f"{resource} not found: {resource_id}"
        super().__init__(message, code="NOT_FOUND", status_code=404)


class ConflictError(EidoException):
    """Raised when there's a conflict (e.g., duplicate entry)."""

    def __init__(self, message: str):
        super().__init__(message, code="CONFLICT", status_code=409)


class AgentError(EidoException):
    """Raised when agent execution fails."""

    def __init__(self, message: str, stage: str = "unknown"):
        super().__init__(f"Agent error at {stage}: {message}", code="AGENT_ERROR", status_code=500)


class DeploymentError(EidoException):
    """Raised when deployment fails."""

    def __init__(self, message: str):
        super().__init__(message, code="DEPLOYMENT_ERROR", status_code=500)


class IntegrationError(EidoException):
    """Raised when external integration (SURGE, Moltbook, here.now) fails."""

    def __init__(self, service: str, message: str):
        super().__init__(f"{service} integration error: {message}", code="INTEGRATION_ERROR", status_code=502)
