export interface AgentPersona {
  id: string;
  label: string;
  description: string;
}

export const AGENTS: AgentPersona[] = [
  {
    id: "assistant",
    label: "Assistant",
    description: "General-purpose voice agent. Friendly and conversational.",
  },
  {
    id: "watcher",
    label: "Watcher",
    description: "Terse, fact-only. One sentence about what's on the feed right now.",
  },
  {
    id: "analyst",
    label: "Analyst",
    description: "Trends and patterns across the recent activity buffer.",
  },
  {
    id: "dispatcher",
    label: "Dispatcher",
    description: "Action-oriented. Recommends specific next steps.",
  },
];

export const DEFAULT_AGENT_ID = "assistant";

export function getAgent(id: string): AgentPersona {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}

export function parseAgentMention(text: string): {
  agentId: string | null;
  clean: string;
} {
  const match = text.match(/^@([\w-]+)\s+(.*)/);
  if (!match) return { agentId: null, clean: text };
  const tag = match[1].toLowerCase();
  const agent = AGENTS.find((a) => a.id === tag);
  if (!agent) return { agentId: null, clean: text };
  return { agentId: agent.id, clean: match[2].trim() };
}
