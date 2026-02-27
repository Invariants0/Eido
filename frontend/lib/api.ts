// -----------------------------------------
// EIDO – Modular API Wrapper (Forwarder)
// -----------------------------------------

import { MvpAPI } from './api/mvp.api';
import { DashboardAPI } from './api/dashboard.api';
import { AgentAPI } from './api/agent.api';
import { TokenAPI } from './api/token.api';
import { SystemAPI } from './api/system.api';

// --- MVP API Wrappers ---
export const startMVP = MvpAPI.start;
export const listMVPs = MvpAPI.getListParams;
export const getMVP = MvpAPI.getById;
export const getMVPRuns = MvpAPI.getRuns;
export const pollMVPUntilComplete = MvpAPI.pollUntilComplete;
export const getAgentStatus = MvpAPI.getStatus;
export const getAgentLogs = MvpAPI.getLogs;
export const getDeploymentStatus = MvpAPI.getDeploymentStatus;
export const getAgentReasoning = MvpAPI.getReasoning;
export const getMoltbookPost = MvpAPI.getMoltbookPost;
export const triggerRetryBuild = MvpAPI.triggerRetryBuild;
export const advanceStage = MvpAPI.advanceStage;
export const getMVPList = MvpAPI.getList;

// --- Dashboard API Wrappers ---
export const getDashboardSummary = DashboardAPI.getSummary;
export const getRecentActivity = DashboardAPI.getRecentActivity;

// --- System API Wrappers ---
export const getSystemStatus = SystemAPI.getStatus;
export const getHealth = SystemAPI.getHealth;
export const getDeepHealth = SystemAPI.getDeepHealth;
export const getMetrics = SystemAPI.getMetrics;

// --- Agent API Wrappers ---
export const getAgentTimeline = AgentAPI.getTimeline;
export const getAgentMemory = AgentAPI.getMemory;
export const getReflectionNotes = AgentAPI.getReflectionNotes;

// --- Token API Wrappers ---
export const getToken = TokenAPI.getDetail;
export const getTokenDetail = TokenAPI.getDetail;
export const getTokenActivity = TokenAPI.getActivity;
export const getTokenOwnership = TokenAPI.getOwnership;
export const getTokenUtilities = TokenAPI.getUtilities;
export const getPortfolio = TokenAPI.getPortfolio;
export const getTokenList = TokenAPI.getList;
