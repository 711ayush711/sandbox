import { DomainConfig } from "../types";
import * as mappers from "./mappers";

/**
 * EV Charging Domain Configuration
 */
export const evChargingConfig: DomainConfig = {
  domain: "beckn.one:energy:ev-charging",
  matchPatterns: ["ev-charging", "energy:ev", "EV-CHARGING", "beckn.one:deg:ev-charging"],
  messageStructure: "order",
  mappers: {
    on_select: mappers.onSelectMapper,
    on_init: mappers.onInitMapper,
    on_confirm: mappers.onConfirmMapper,
    on_status: mappers.onStatusMapper,
    on_track: mappers.onTrackMapper,
    on_update: mappers.onUpdateMapper,
    on_cancel: mappers.onCancelMapper,
    on_rating: mappers.onRatingMapper,
    on_support: mappers.onSupportMapper,
  },
};

