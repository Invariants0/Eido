"""CrewAI Service - manages CrewAI crew initialization and execution."""

import json
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from crewai import Agent, Task, Crew, Process

from ...config.settings import config
from ...logger import get_logger
from ...exceptions import EidoException
from ...agent.context_optimizer import ContextOptimizer
from .llm_router import LLMRouter, TaskType
from .skill_loader import SkillLoader
from .e2b_sandbox import E2BSandboxManager
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
        self.sandbox_manager: Optional[E2BSandboxManager] = None
        self.agents: Dict[str, Agent] = {}
        self.context_optimizer = ContextOptimizer()
        
        # Initialize integration clients (Disabled for now)
        # self.moltbook = MoltbookPublisher()
        # self.deployment_client = HereNowClient()
        # self.surge = SurgeTokenManager()
        
        # Tools
        self.moltbook_tools = []
        
    def set_sandbox_manager(self, manager: E2BSandboxManager):
        """Bind an active sandbox manager to the service."""
        self.sandbox_manager = manager
        # Clear agent cache to force tool re-binding if needed
        self.agents = {}

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
        """Agent factory for EIDO roles using dynamic skill loading."""
        if role_id in self.agents:
            return self.agents[role_id]
            
        # Load skill profile dynamically
        profile = self.skill_loader.get_skill(role_id)
        
        if not profile:
            logger.error(f"Failed to load skill profile for role: {role_id}. Falling back to basic agent.")
            # Basic fallback if skill is missing
            profile = {
                "role": role_id.replace("_", " ").title(),
                "goal": "Contribute to the startup pipeline.",
                "backstory": f"You are an expert {role_id} in the EIDO startup factory."
            }
        
        task_types = {
            "analyst": TaskType.IDEATION,
            "researcher": TaskType.IDEATION,
            "social_manager": TaskType.IDEATION,
            "social-manager": TaskType.IDEATION,
            "architect": TaskType.ARCHITECTURE,
            "tech_lead": TaskType.ARCHITECTURE,
            "tech-lead": TaskType.ARCHITECTURE,
            "developer": TaskType.BUILDING,
            "qa": TaskType.BUILDING,
            "devops": TaskType.DEPLOYMENT,
            "blockchain": TaskType.TOKENIZATION,
        }
        
        agent = self._create_agent(
            role=profile["role"],
            goal=profile["goal"],
            backstory=profile["backstory"],
            model_type=task_types.get(role_id, TaskType.IDEATION)
        )
        
        # Bind tools based on role
        from .openclaw_tools import (
            MoltbookPostTool, 
            TelegramNotifyTool, 
            WebSearchTool,
            SandboxWriteFileTool,
            SandboxReadFileTool,
            SandboxRunCommandTool
        )
        
        tools = []
        if role_id == "researcher":
            tools.extend([WebSearchTool(), MoltbookPostTool()])
        elif role_id in ["social_manager", "social-manager"]:
            tools.extend([MoltbookPostTool(), TelegramNotifyTool()])
        elif role_id == "developer":
            tools.extend([
                SandboxWriteFileTool(sandbox_manager=self.sandbox_manager),
                SandboxReadFileTool(sandbox_manager=self.sandbox_manager),
                SandboxRunCommandTool(sandbox_manager=self.sandbox_manager)
            ])
        elif role_id == "qa":
            tools.extend([
                SandboxReadFileTool(sandbox_manager=self.sandbox_manager),
                SandboxRunCommandTool(sandbox_manager=self.sandbox_manager)
            ])
        
        # Every agent should be able to notify the user of major blockers
        if role_id not in ["social_manager", "social-manager"]:
             tools.append(TelegramNotifyTool())
             
        agent.tools = tools
            
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
            max_build_retries = getattr(config, "MAX_AGENT_RETRIES", 3)
            current_attempt = 1
            current_spec = context.get('spec', 'Architecture Design')
            last_exit_code: Optional[int] = None
            
            while current_attempt <= max_build_retries:
                dev = self._get_agent("developer")
                qa = self._get_agent("qa")
                agents = [dev, qa]
                
                tasks = [
                    Task(description=f"Generate project files based on spec: {current_spec}", agent=dev, expected_output="Source code files."),
                    Task(description="Verify build logs and run basic health checks.", agent=qa, expected_output="Build validation report.")
                ]
                
                crew = Crew(
                    agents=agents,
                    tasks=tasks,
                    process=Process.sequential,
                    verbose=True,
                    memory=False
                )
                
                try:
                    import logging as _logging
                    for _name in ["LiteLLM", "litellm", "litellm.litellm_core_utils", 
                                  "litellm.proxy", "httpx", "httpcore"]:
                        _logging.getLogger(_name).setLevel(_logging.CRITICAL)
                        
                    result = await asyncio.to_thread(crew.kickoff)
                    
                    # Extract exit code from sandbox execution if available
                    # For now, we check the result string for error indicators
                    result_str = str(result).lower()
                    
                    # Try to extract actual exit code from result
                    build_failed = False
                    if "exit_code" in result_str:
                        import re
                        exit_match = re.search(r'exit_code["\s:]+(\d+)', result_str)
                        if exit_match:
                            last_exit_code = int(exit_match.group(1))
                            build_failed = last_exit_code != 0
                    else:
                        # Fallback: check for error indicators
                        build_failed = any(indicator in result_str for indicator in ['error', 'fail', 'stderr'])
                        last_exit_code = 1 if build_failed else 0
                    
                    # Deterministic Loop: Check exit code
                    if build_failed:
                        logger.warning(
                            f"Build attempt {current_attempt} failed with exit code {last_exit_code}",
                            extra={"attempt": current_attempt, "exit_code": last_exit_code}
                        )
                        
                        if current_attempt < max_build_retries:
                            # Use ContextOptimizer for TOON-based error summary
                            retry_context = {
                                "attempt": current_attempt,
                                "max_retries": max_build_retries,
                                "previous_spec": context.get('spec', 'Architecture Design')
                            }
                            
                            toon_summary = self.context_optimizer.summarize_for_fix(
                                stderr=str(result),
                                exit_code=last_exit_code,
                                context=retry_context
                            )
                            
                            logger.info(
                                "Triggering Developer self-correction loop with TOON summary",
                                extra={"attempt": current_attempt, "toon_enabled": self.context_optimizer.adapter.is_available()}
                            )
                            
                            current_spec = (
                                f"PREVIOUS BUILD FAILED (Attempt {current_attempt}/{max_build_retries}).\n\n"
                                f"{toon_summary}\n\n"
                                f"Please FIX the files in the workspace based on the error summary above. Be deterministic."
                            )
                            current_attempt += 1
                            continue
                        else:
                            logger.error(
                                "Max build retries exceeded. Falling through to report failure.",
                                extra={"attempts": current_attempt, "exit_code": last_exit_code}
                            )
                    
                    # Success! Log compression stats and break
                    stats = self.context_optimizer.get_stats()
                    logger.info(
                        f"Build succeeded on attempt {current_attempt}",
                        extra={"attempt": current_attempt, "toon_stats": stats}
                    )
                    break
                    
                except Exception as e:
                    if current_attempt < max_build_retries:
                        logger.warning(f"Exception during build attempt {current_attempt}: {e}")
                        current_attempt += 1
                        continue
                    raise StageExecutionError(stage_name, str(e))
            
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

        if stage_name != "building":
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
            except Exception as e:
                logger.error(f"Crew kickoff failed: {e}", extra={"mvp_id": self.mvp_id})
                raise StageExecutionError(stage_name, str(e))
                
        # Post-execution formatting
        output_data = {}
        try:
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
