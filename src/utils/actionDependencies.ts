/**
 * Action Dependencies Utility
 *
 * Determines which previous action's context is needed for the current action
 * Supports domain-specific overrides for different Beckn protocol flows
 */

/**
 * Get required previous action context for the current action
 * Returns the previous action name needed for stateful responses
 *
 * @param currentAction - Current action being processed (e.g., "on_select")
 * @param domain - Beckn domain (e.g., "beckn.one:deg:ev-charging")
 * @returns Previous action name or null if no dependency
 */
export const getPreviousActionForContext = (currentAction: string, domain: string): string | null => {
  // Generic action dependencies (works for most domains)
  const dependencies: { [key: string]: string } = {
    "on_select": "on_discover",
    "on_init": "on_select",
    "on_confirm": "on_init",     // ev-charging uses select→init→confirm
    "on_status": "on_confirm",
    "on_cancel": "on_confirm",
    "on_update": "on_confirm",
    "on_rating": "on_confirm",
    "on_support": "on_confirm",
    "on_track": "on_confirm",
  };

  // Domain-specific overrides
  if (domain.includes("demand-flexibility")) {
    // Demand-flexibility: discover → confirm (activation) → status (monitoring/settlement)
    if (currentAction === "on_confirm") {
      return "on_discover";
    }
    if (currentAction === "on_status") {
      return "on_confirm";
    }
  }

  return dependencies[currentAction] || null;
};

