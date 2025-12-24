/**
 * Domain Configuration Types
 */

export interface DomainConfig {
  domain: string;
  matchPatterns: string[]; // Patterns to match domain strings (e.g., ["ev-charging", "energy:ev"])
  messageStructure: "order" | "tracking" | "feedback" | "support" | "custom";
  mappers: {
    [action: string]: (incomingMessage: any, incomingContext: any, storedContext: any) => any;
  };
}

