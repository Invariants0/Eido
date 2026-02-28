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
from ...moltbook.publisher import MoltbookPublisher

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
    
    def __init__(self, mvp_id: int, llm_router: Optional[LLMRouter] = None, verbose: bool = False):
        self.mvp_id = mvp_id
        self.router = llm_router or LLMRouter()
        self.verbose = verbose
        self.skill_loader = SkillLoader()
        self.sandbox_manager: Optional[E2BSandboxManager] = None
        self.agents: Dict[str, Agent] = {}
        self.context_optimizer = ContextOptimizer()
        
        # Initialize integration clients
        self.moltbook = MoltbookPublisher()
        self.deployment_client = HereNowClient()
        self.surge = SurgeTokenManager()
        
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
        elif model.startswith("groq/"):
            # Already prefixed Groq models (compound, compound-mini)
            return LLM(model=model, api_key=config.GROQ_API_KEY)
        elif model.startswith("meta-llama/") or model.startswith("qwen/") or model.startswith("allam"):
            # Groq-hosted models with org prefixes
            return LLM(model=f"groq/{model}", api_key=config.GROQ_API_KEY)
        elif "llama" in model_lower or "mixtral" in model_lower or "gemma" in model_lower:
            # Route standard Groq models
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
            verbose=self.verbose,
            allow_delegation=False,
            memory=False,  # Memory requires OpenAI embeddings - disabled to use Groq
            llm=crewai_llm,
            tools=[] # To be populated by _get_agent
        )

    def _create_agent_with_model(self, role: str, goal: str, backstory: str, model_name: str) -> Agent:
        """Create a CrewAI agent with a specific model name."""
        crewai_llm = self._get_crewai_llm_with_params(model_name, role)
        
        # Add Groq-specific function calling instructions
        enhanced_backstory = backstory
        if any(x in model_name.lower() for x in ["groq", "llama", "meta-llama", "qwen", "allam"]):
            enhanced_backstory += """\n\nIMPORTANT FUNCTION CALLING RULES:
- When using tools, use ONLY the exact function name and JSON parameters
- Format: search_web({"query": "example", "platform": "reddit"})
- Do NOT use XML-style tags like <function> or </function>
- Do NOT add extra formatting or markdown around function calls
- Use double quotes for all JSON string values"""
        
        return Agent(
            role=role,
            goal=goal,
            backstory=enhanced_backstory,
            verbose=self.verbose,
            allow_delegation=False,
            memory=False,  # Memory requires OpenAI embeddings - disabled to use Groq
            llm=crewai_llm,
            tools=[] # To be populated by _get_agent
        )

    def _get_crewai_llm_with_params(self, model: str, agent_role: str = "") -> Any:
        """Get CrewAI LLM with role-specific generation parameters to control speed/deliberation."""
        from crewai import LLM
        model_lower = model.lower()
        
        # Generation parameters for deliberate, methodical responses
        # Lower temperature = more focused, higher = more creative/exploratory
        base_params = {
            "temperature": 0.1,  # Very focused
            "max_tokens": 2048,  # Allow longer responses
        }
        
        # Role-specific parameters to control generation speed and deliberation
        if agent_role == "researcher":
            # Researcher needs to be methodical and use tools - balanced approach
            base_params.update({
                "temperature": 0.1,   # Focused but not extreme (was 0.05)
                "top_p": 0.9,        # More diverse responses for better tool usage
                "max_tokens": 6000,  # Higher limit for thorough research
                # Ensure proper JSON function calling format (not XML)
                "tool_choice": "auto",
                "parallel_tool_calls": True,
            })
        elif agent_role in ["analyst", "architect"]:
            # Analysis roles need balanced creativity and structure
            base_params.update({
                "temperature": 0.2,
                "top_p": 0.9,
            })
        
        # 🚀 MODEL ROUTING
        # Only special‑case local Ollama models; anything else is used as given.
        if model.startswith("ollama/") or model_lower.startswith("ollama"):
            model_name = model.replace("ollama/", "") if model.startswith("ollama/") else model

            # local Ollama (llama‑3.3 or codellama) - requires a running server
            if "llama-3.3" in model_name or "codellama" in model_name:
                provider = "🏠 Local Ollama"
                print(f"☑️  Agent '{agent_role or 'default'}' using {provider}: {model}")
                print(f"📊 Generation params: {base_params}")
                try:
                    return LLM(
                        model=model,
                        base_url=config.OLLAMA_BASE_URL,
                        **base_params
                    )
                except Exception as e:
                    # catch 404/conn errors
                    logger.warning("Local Ollama call failed (%s); falling back to Groq: %s", model, e)
                    return LLM(
                        model="llama-3.1-8b-instant",
                        api_key=config.GROQ_API_KEY,
                        **base_params
                    )

            # cloud Ollama models (e.g. glm-5:cloud) - send to cloud endpoint
            provider = "☁️ Ollama Cloud"
            print(f"☁️  Agent '{agent_role or 'default'}' using {provider}: {model}")
            print(f"📊 Generation params: {base_params}")
            # if no API key available, immediately fall back instead of attempting call
            if not config.OLLAMA_CLOUD_API_KEY:
                logger.warning("No Ollama cloud key; routing %s to Groq instead", model)
                return LLM(
                    model="llama-3.1-8b-instant",
                    api_key=config.GROQ_API_KEY,
                    **base_params
                )
            try:
                return LLM(
                    model=model,
                    api_key=config.OLLAMA_CLOUD_API_KEY,
                    base_url="https://api.ollama.com",
                    **base_params
                )
            except Exception as e:
                logger.warning("Cloud Ollama call failed (%s); falling back to Groq: %s", model, e)
                return LLM(
                    model="llama-3.1-8b-instant",
                    api_key=config.GROQ_API_KEY,
                    **base_params
                )

        # default: assume Groq for any unspecified model and prefix accordingly
        provider = "⚡ Groq (default)"
        groq_model = model if model.startswith("groq/") else f"groq/{model}"
        print(f"{provider} Agent '{agent_role or 'default'}': {groq_model}")
        print(f"📊 Generation params: {base_params}")
        return LLM(
            model=groq_model,
            api_key=config.GROQ_API_KEY,
            **base_params
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
            
        # Get specific model for this agent from config
        model_name = config.AGENT_MODEL_MAPPING.get(role_id, "llama-3.1-8b-instant")
            
        agent = self._create_agent_with_model(
            role=profile["role"],
            goal=profile["goal"],
            backstory=profile["backstory"],
            model_name=model_name
        )
        
        # Pass role_id to the LLM creation for role-specific parameters
        agent.llm = self._get_crewai_llm_with_params(model_name, role_id)
        
        # Bind tools based on role
        from .openclaw_tools import (
            MoltbookPostTool, 
            TelegramNotifyTool, 
            WebSearchTool,
            WebFetchTool,
            SandboxWriteFileTool,
            SandboxReadFileTool,
            SandboxRunCommandTool
        )
        
        tools = []
        if role_id == "researcher":
            # TEMPORARILY DISABLED: Tools cause OpenAI validation conflicts with Groq
            # TODO: Fix tool validation to work with Groq models
            # tools.extend([WebSearchTool(), WebFetchTool()])
            pass
        # elif role_id in ["social_manager", "social-manager"]:
        #     tools.extend([MoltbookPostTool(), TelegramNotifyTool()])
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
        # Disabled for stability on Groq (prevents hallucinated comma errors)
        # if role_id not in ["social_manager", "social-manager"]:
        #      tools.append(TelegramNotifyTool())
             
        agent.tools = tools
            
        self.agents[role_id] = agent
        logger.info(f"Agent {role_id} created with {len(tools)} tools using model {model_name}")
        return agent

    def _rotate_groq_models_for_agents(self, agents: List[Agent]) -> None:
        """Advance each agent's Groq model to the next entry in the fallback list.

        This is invoked when a rate limit is encountered so subsequent calls use
        a different Groq model. The mapping and cached agents are updated.
        """
        fallback_list = config.GROQ_FALLBACK_MODELS
        for agent in agents:
            role = agent.role.replace(" ", "_").lower()
            current = config.AGENT_MODEL_MAPPING.get(role, config.DEFAULT_LLM_MODEL)
            # only rotate Groq names (no ollama/local or other providers)
            if "groq/" in current or any(m in current for m in fallback_list):
                # strip possible prefix
                base = current.replace("groq/", "")
                try:
                    idx = fallback_list.index(base)
                    next_model = fallback_list[(idx + 1) % len(fallback_list)]
                except ValueError:
                    next_model = fallback_list[0]
                new_name = f"{next_model}" if next_model.startswith("groq/") else f"groq/{next_model}"
                config.AGENT_MODEL_MAPPING[role] = new_name
                # clear cached agent so new mapping applies
                self.agents.pop(role, None)
                logger.info("Rotated %s to %s due to rate limit", role, new_name)

    async def _kickoff_with_retry(self, crew: Crew, agents: List[Agent], stage_name: str):
        """Run crew.kickoff with rate-limit retries using GROQ_FALLBACK_MODELS."""
        max_retries = getattr(config, "MAX_STAGE_RETRIES", 2)
        attempt = 1
        while True:
            try:
                result = await asyncio.to_thread(crew.kickoff)
                await asyncio.sleep(config.AGENT_DELAY_SECONDS)
                return result
            except Exception as e:
                err_str = str(e).lower()
                if ("ratelimiterror" in err_str or "rate limit" in err_str) and attempt < max_retries:
                    logger.warning(
                        "Rate limit during stage %s attempt %d; rotating Groq models",
                        stage_name, attempt
                    )
                    self._rotate_groq_models_for_agents(agents)
                    attempt += 1
                    continue
                raise

    async def execute_crew(self, stage_name: str, context: Dict[str, Any]) -> CrewRunResult:
        """Execute a stage-specific crew."""
        logger.info("Setting up crew for stage: {}", stage_name, extra={"mvp_id": self.mvp_id})
        
        def _on_step(step):
            """Callback for each agent step to stream thoughts via SSE."""
            if hasattr(step, 'thought') and step.thought:
                logger.info("Thought: {}", step.thought, extra={"mvp_id": self.mvp_id, "stage": stage_name})
            elif hasattr(step, 'tool') and step.tool:
                 logger.info("Using tool {} with {}", step.tool, step.tool_input, extra={"mvp_id": self.mvp_id, "stage": stage_name})
        
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
                    verbose=self.verbose,
                    memory=False,
                    step_callback=_on_step
                )
                
                try:
                    import logging as _logging
                    for _name in ["LiteLLM", "litellm", "litellm.litellm_core_utils", 
                                  "litellm.proxy", "httpx", "httpcore"]:
                        _logging.getLogger(_name).setLevel(_logging.CRITICAL)
                        
                    result = await asyncio.to_thread(crew.kickoff)
                    # enforce delay before any next agent invocation
                    await asyncio.sleep(config.AGENT_DELAY_SECONDS)
                    
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
                    # Attempt to detect local Ollama connection/model errors and fall back
                    err_str = str(e).lower()
                    if "ollama" in err_str or "404" in err_str or "not found" in err_str:
                        logger.warning(
                            "Detected Ollama access error during build: {}. Falling back to Groq models.",
                            e
                        )
                        # update mapping so next iteration uses Groq
                        config.AGENT_MODEL_MAPPING["developer"] = "llama-3.1-8b-instant"
                        config.AGENT_MODEL_MAPPING["qa"] = "llama-3.1-8b-instant"
                        # clear cached agents so new model is picked up next loop
                        self.agents.pop("developer", None)
                        self.agents.pop("qa", None)
                        logger.info(
                            "AGENT_MODEL_MAPPING updated for developer/qa -> {}",
                            config.AGENT_MODEL_MAPPING["developer"]
                        )
                        if current_attempt < max_build_retries:
                            current_attempt += 1
                            continue
                    # If we hit a rate limit, rotate to the next fallback Groq model
                    if "ratelimiterror" in err_str or "rate limit" in err_str:
                        fallback_list = config.GROQ_FALLBACK_MODELS
                        current = config.AGENT_MODEL_MAPPING.get("developer", "llama-3.1-8b-instant")
                        try:
                            idx = fallback_list.index(current)
                            next_model = fallback_list[(idx + 1) % len(fallback_list)]
                        except ValueError:
                            next_model = fallback_list[0]
                        logger.warning("Rate limit detected during build; switching developer model to %s", next_model)
                        config.AGENT_MODEL_MAPPING["developer"] = next_model
                        config.AGENT_MODEL_MAPPING["qa"] = next_model
                        self.agents.pop("developer", None)
                        self.agents.pop("qa", None)
                        if current_attempt < max_build_retries:
                            current_attempt += 1
                            continue
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
                verbose=self.verbose,
                memory=False,  # Memory requires OpenAI embeddings - disabled to use Groq
                step_callback=_on_step
            )
            
            try:
                # Silence litellm internal proxy warnings at runtime
                import logging as _logging
                for _name in ["LiteLLM", "litellm", "litellm.litellm_core_utils", 
                              "litellm.proxy", "httpx", "httpcore"]:
                    _logging.getLogger(_name).setLevel(_logging.CRITICAL)
                
                # run with retry wrapper that handles Groq rate limits
                result = await self._kickoff_with_retry(crew, agents, stage_name)
            except Exception as e:
                logger.error("Crew kickoff failed for stage %s: %s", stage_name, e, extra={"mvp_id": self.mvp_id})
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
        
        # --- PHASE 4: EXTERNAL SERVICE INTEGRATIONS ---
        try:
            if stage_name == "ideation":
                # Post the idea to Moltbook in the lablab submolt
                # Use structured fields if available, otherwise fall back to raw_output
                mvp_name = output_data.get('MVP_Name') or output_data.get('name') or 'New Venture'
                exec_summary = (
                    output_data.get("Executive_Summary")
                    or output_data.get("summary")
                    or output_data.get("raw_output", "")[:500]
                    or "Autonomous MVP idea generated by EIDO."
                )
                title = f"MVP Idea: {mvp_name}"
                summary = str(exec_summary)
                post_id = await self.moltbook.post(title, summary, submolt="lablab")
                output_data["moltbook_post_id"] = post_id
                logger.info(f"Moltbook post created: {post_id}")

            elif stage_name == "deployment":
                mvp_name = context.get("mvp_name", f"mvp-{self.mvp_id}").lower().replace(" ", "-")
                # Use E2B public URL if sandbox is active, otherwise fall back to HereNow mock
                if self.sandbox_manager and not self.sandbox_manager.is_local and self.sandbox_manager.sandbox:
                    deploy_url = f"https://{self.sandbox_manager.get_hostname(3000)}"
                    logger.info(f"E2B deployment URL: {deploy_url}")
                else:
                    deploy_url = await self.deployment_client.deploy(None, mvp_name)
                    logger.info(f"HereNow deployment URL: {deploy_url}")
                output_data["deployment_url"] = deploy_url
                output_data["deployment_status"] = "LIVE"

            elif stage_name == "tokenization":
                mvp_name = output_data.get("Token_Name", context.get("mvp_name", "EIDO MVP"))
                symbol = output_data.get("Token_Symbol", "MVP")
                token_result = await self.surge.create_token(self.mvp_id, mvp_name, symbol)
                output_data.update(token_result)
                logger.info(f"SURGE token: {token_result.get('token_id')} status={token_result.get('status')}")
        except Exception as e:
            logger.warning(f"Phase 4 integration error in {stage_name}: {e} — continuing without it")

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
