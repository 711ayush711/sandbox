import { logger } from "../utils/logger";
import { DomainConfig } from "./types";

// Import domain configs
import { evChargingConfig } from "./ev-charging/config";
import { flightConfig } from "./flight/config";
import { cabConfig } from "./cab/config";
import { hotelConfig } from "./hotel/config";

/**
 * Domain Registry
 * Centralized registry for all domain configurations
 */
class DomainRegistry {
  private static domains: Map<string, DomainConfig> = new Map();
  private static patterns: Map<string, DomainConfig> = new Map();

  /**
   * Register a domain configuration
   */
  static register(config: DomainConfig): void {
    // Register by domain ID
    this.domains.set(config.domain, config);
    logger.info("Domain registered", { domain: config.domain });

    // Register by patterns
    for (const pattern of config.matchPatterns) {
      this.patterns.set(pattern.toLowerCase(), config);
      logger.debug("Domain pattern registered", { pattern, domain: config.domain });
    }
  }

  /**
   * Find domain by domain string (matches patterns)
   */
  static findDomainConfig(domainString: string): DomainConfig | null {
    // Try exact match first
    const exactMatch = this.domains.get(domainString);
    if (exactMatch) {
      return exactMatch;
    }

    // Try pattern matching
    const patternMatch = this.patterns.get(domainString.toLowerCase());
    if (patternMatch) {
      return patternMatch;
    }

    // Try partial domain matching
    for (const [pattern, config] of this.patterns.entries()) {
      if (domainString.toLowerCase().includes(pattern)) {
        return config;
      }
    }

    logger.warn("Domain not found", { 
      domain: domainString, 
      availableDomains: Array.from(this.domains.keys()) 
    });
    return null;
  }

  /**
   * Check if domain is registered
   */
  static isDomainRegistered(domainString: string): boolean {
    return this.findDomainConfig(domainString) !== null;
  }

  /**
   * Get all registered domains
   */
  static getAllDomains(): string[] {
    return Array.from(this.domains.keys());
  }
}

/**
 * Initialize all domains
 * Called at application startup
 */
export function initializeDomains(): void {
  try {
    // Register EV Charging domain
    DomainRegistry.register(evChargingConfig);
    
    // Register Flight domain
    DomainRegistry.register(flightConfig);
    
    // Register Cab domain
    DomainRegistry.register(cabConfig);
    
    // Register Hotel domain
    DomainRegistry.register(hotelConfig);
    
    // Add more domains here as they are created
    // DomainRegistry.register(computeEnergyConfig);
    // DomainRegistry.register(demandFlexibilityConfig);
    
    logger.info("All domains initialized successfully", {
      domains: DomainRegistry.getAllDomains(),
    });
  } catch (error: any) {
    logger.error("Failed to initialize domains", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Export registry functions for use in other modules
export { DomainRegistry };
export const findDomainConfig = (domainString: string) => DomainRegistry.findDomainConfig(domainString);
export const isDomainRegistered = (domainString: string) => DomainRegistry.isDomainRegistered(domainString);

