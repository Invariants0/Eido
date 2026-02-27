"""CrewAI Service - manages CrewAI crew initialization and execution."""

import json
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from crewai import Agent, Task, Crew, Process

from ...config.settings import config
from ...logger import get_logger
from ...exceptions import EidoException
from .llm_router import LLMRouter, TaskType
from .skill_loader import SkillLoader
from ...integrations.deployment import HereNowClient
from ...integrations.surge import SurgeTokenManager

logger = get_logger(__name__)


class StageExecutionError(EidoException):
    """Raised when crew execution fails for a specific stage."""
    def __init__(self, stage: str, message: str):
        super().__init__(
            f"Stage '{stage}' failed: {message}", 
            code="STAGE_EXECUTION_ERROR", 
            status_code=500
        )


@dataclass
class CrewRunResult:
    """Result from a crew execution run."""
    output_json: Dict[str, Any] = field(default_factory=dict)
    agent_logs: List[str] = field(default_factory=list)
    token_usage: int = 0
    cost_estimate: float = 0.0
    model_used: str = "unknown"


class CrewAIService:
    """Manages CrewAI crew initialization and execution for startup stages."""
    
    def __init__(self, mvp_id: int, llm_router: Optional[LLMRouter] = None):
        self.mvp_id = mvp_id
        self.router = llm_router or LLMRouter()
        self.skill_loader = SkillLoader()
        self.agents: Dict[str, Agent] = {}
        
        # Initialize integration clients (Disabled for now)
        # self.moltbook = MoltbookPublisher()
        # self.deployment_client = HereNowClient()
        # self.surge = SurgeTokenManager()
        
        # Tools
        self.moltbook_tools = []
        
    def _get_crewai_llm(self, model: str):
        """Build a CrewAI-compatible LLM object with the correct provider prefix."""
        from crewai import LLM
        model_lower = model.lower()
        
        # litellm requires provider-prefixed model names
        
        # Ollama (local) — already prefixed as 'ollama/modelname'
        if model_lower.startswith("ollama/") or model_lower.startswith("ollama_"):
            return LLM(
                model=f"ollama/{model.replace('ollama/', '')}", 
                base_url=config.OLLAMA_BASE_URL
            )
        elif "llama" in model_lower or "mixtral" in model_lower or "gemma" in model_lower:
            # Route to Groq via litellm
            return LLM(model=f"groq/{model}", api_key=config.GROQ_API_KEY)
        elif "gemini" in model_lower:
            return LLM(model=f"gemini/{model}", api_key=config.GEMINI_API_KEY)
        elif "claude" in model_lower:
            return LLM(model=model, api_key=config.ANTHROPIC_API_KEY)
        else:
            # GPT models - use OpenAI
            return LLM(model=model, api_key=config.OPENAI_API_KEY)

    def _create_agent(self, role: str, goal: str, backstory: str, model_type: TaskType) -> Agent:
        """Create a CrewAI agent using EIDO's routed LLM."""
        model = self.router.get_model_for_task(model_type)
        crewai_llm = self._get_crewai_llm(model)
        
        return Agent(
            role=role,
            goal=goal,
            backstory=backstory,
            verbose=True,
            allow_delegation=False,
            memory=False,  # Memory requires OpenAI embeddings - disabled to use Groq
            llm=crewai_llm,
            tools=[] # To be populated by _get_agent
        )

    def _get_agent(self, role_id: str) -> Agent:
        """Agent factory for EIDO roles."""
        if role_id in self.agents:
            return self.agents[role_id]
            
        # Load skill profile dynamically
        profile = self.skill_loader.load_skill(role_id)
        
        task_types = {
            "analyst": TaskType.IDEATION,
            "researcher": TaskType.IDEATION,
            "social_manager": TaskType.IDEATION,
            "architect": TaskType.ARCHITECTURE,
            "tech_lead": TaskType.ARCHITECTURE,
            "developer": TaskType.BUILDING,
            "qa": TaskType.BUILDING,
            "devops": TaskType.DEPLOYMENT,
            "blockchain": TaskType.TOKENIZATION,
        }
        
        agent = self._create_agent(
            role=profile.name,
            goal=profile.goal,
            backstory=profile.description,
            model_type=task_types.get(role_id, TaskType.IDEATION)
        )
        
        # Maintain existing tool bindings for now
        if role_id in ["researcher", "social_manager"]:
            agent.tools = self.moltbook_tools
            
        self.agents[role_id] = agent
        return agent

    async def execute_crew(self, stage_name: str, context: Dict[str, Any]) -> CrewRunResult:
        """Execute a stage-specific crew."""
        logger.info(f"Setting up crew for stage: {stage_name}", extra={"mvp_id": self.mvp_id})
        
        agents = []
        tasks = []
        
        if stage_name == "ideation":
            researcher = self._get_agent("researcher")
            analyst = self._get_agent("analyst")
            agents = [researcher, analyst]
            tasks = [
                Task(description=f"Research market gaps for: {context.get('raw_idea', 'New Service')}", agent=researcher, expected_output="Market gap analysis report."),
                Task(description="Convert research into a structured MVP feature list and value proposition.", agent=analyst, expected_output="Structured JSON feature list.")
            ]
            
        elif stage_name == "architecture":
            architect = self._get_agent("architect")
            lead = self._get_agent("tech_lead")
            agents = [architect, lead]
            tasks = [
                Task(description=f"Design system architecture for features: {context.get('features', 'MVP Core')}", agent=architect, expected_output="System design blueprint."),
                Task(description="Define technical stack, database schema, and API contracts.", agent=lead, expected_output="Detailed technical specification.")
            ]
            
        elif stage_name == "building":
            dev = self._get_agent("developer")
            qa = self._get_agent("qa")
            agents = [dev, qa]
            tasks = [
                Task(description=f"Generate project files based on spec: {context.get('spec', 'Architecture Design')}", agent=dev, expected_output="Source code files."),
                Task(description="Verify build logs and run basic health checks.", agent=qa, expected_output="Build validation report.")
            ]
            
        elif stage_name == "deployment":
            devops = self._get_agent("devops")
            agents = [devops]
            tasks = [
                Task(description=f"Containerize and deploy the app: {context.get('build_path', '/app')}", agent=devops, expected_output="Deployment URL and status.")
            ]
            
        elif stage_name == "tokenization":
            chain = self._get_agent("blockchain")
            agents = [chain]
            tasks = [
                Task(description=f"Create SURGE token for MVP: {context.get('mvp_name', 'EIDO MVP')}", agent=chain, expected_output="Token metadata and contract address.")
            ]
        else:
            # Fallback for implementation period
            return CrewRunResult(
                output_json={"status": "stubbed", "stage": stage_name},
                agent_logs=["Stage logic used fallback stub"],
                model_used="stub-model"
            )

        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=Process.sequential,
            verbose=True,
            memory=False  # Memory requires OpenAI embeddings - disabled to use Groq
        )
        
        try:
            # Silence litellm internal proxy warnings at runtime
            import logging as _logging
            for _name in ["LiteLLM", "litellm", "litellm.litellm_core_utils", 
                          "litellm.proxy", "httpx", "httpcore"]:
                _logging.getLogger(_name).setLevel(_logging.CRITICAL)
            
            # Wrap synchronous kickoff in a thread to keep the event loop responsive
            result = await asyncio.to_thread(crew.kickoff)
            
            # Post-execution formatting
            # Note: CrewAI output needs careful parsing into final JSON
            # In stub mode or early development, result.raw might be a string.
            output_data = {}
            try:
                # Attempt to extract JSON from the final agent response
                raw_str = str(result)
                if "{" in raw_str:
                    import re
                    match = re.search(r'(\{.*\})', raw_str, re.DOTALL)
                    if match:
                        output_data = json.loads(match.group(1))
                    else:
                        output_data = {"raw_output": raw_str}
                else:
                    output_data = {"raw_output": raw_str}
            except:
                output_data = {"raw_output": str(result)}
            
            # --- PHASE 4: EXTERNAL SERVICE INTEGRATIONS (Disabled for now) ---
            """
            if stage_name == "ideation" and "raw_output" not in output_data:
                # Post the idea to Moltbook in the lablab submolt
                title = f"MVP Idea: {output_data.get('MVP_Name', 'New Venture')}"
                summary = str(output_data.get("Executive_Summary", "Exploring a new AI business opportunity."))
                post_id = await self.moltbook.post(title, summary, submolt="lablab")
                output_data["moltbook_post_id"] = post_id
                logger.info(f"Moltbook post created: {post_id}")

            elif stage_name == "deployment":
                # Actually perform the deployment
                mvp_name = context.get("mvp_name", f"MVP-{self.mvp_id}")
                image = await self.deployment_client.build_image("Dockerfile", "./")
                deploy_url = await self.deployment_client.deploy(image, mvp_name)
                output_data["deployment_url"] = deploy_url
                output_data["deployment_status"] = "LIVE"
                logger.info(f"Real deployment triggered: {deploy_url}")

            elif stage_name == "tokenization":
                # Actually create the token
                mvp_name = output_data.get("Token_Name", context.get("mvp_name", "EIDO MVP"))
                symbol = output_data.get("Token_Symbol", "MVP")
                token_result = await self.surge.create_token(self.mvp_id, mvp_name, symbol)
                output_data.update(token_result)
                logger.info(f"Real SURGE token created: {token_result.get('token_id')}")
            """

            # Construction of the result object
            # We add a tiny delay to ensure background litellm callbacks have finished updating global stats
            await asyncio.sleep(0.1)
            stats = self.router.get_usage_stats()
            
            return CrewRunResult(
                output_json=output_data,
                agent_logs=[f"Agent {stage_name} completed execution"],
                token_usage=stats.get("total_tokens_used", 0),
                cost_estimate=stats.get("total_cost", 0.0),
                model_used=self.router.get_model_for_task(TaskType.IDEATION if stage_name=="ideation" else TaskType.SUMMARY)
            )
            
        except Exception as e:
            logger.error(f"Crew kickoff failed: {e}", extra={"mvp_id": self.mvp_id})
            raise StageExecutionError(stage_name, str(e))
