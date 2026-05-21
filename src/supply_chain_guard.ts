export const SUPPLY_CHAIN_GUARD_NAME = 'ZarK/ai-supply-chain-guard';
export const SUPPLY_CHAIN_GUARD_URL = 'https://github.com/ZarK/ai-supply-chain-guard';
export const SUPPLY_CHAIN_GUARD_SKILL_PATH = '.agents/skills/supply-chain-guard/SKILL.md';

const guardedWorkPattern = /dependency|package-manager|CI|release|IDE|MCP|AI-agent/i;

export function hasCanonicalSupplyChainGuardInstruction(text: string): boolean {
  return text.includes(SUPPLY_CHAIN_GUARD_NAME) &&
    text.includes(SUPPLY_CHAIN_GUARD_URL) &&
    text.includes(SUPPLY_CHAIN_GUARD_SKILL_PATH) &&
    guardedWorkPattern.test(text);
}
