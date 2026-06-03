// A2A spec canonicalises the agent card at /.well-known/agent-card.json
// (with -card.json suffix). Re-exports the same handler as agent.json so
// scanners + agents that follow the spec path land here.
export { GET, prerender } from '../agent.json/+server';
