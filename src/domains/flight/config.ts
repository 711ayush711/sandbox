import { DomainConfig } from "../types";
import * as mappers from "./mappers";

/**
 * Flight Domain Configuration
 */
export const flightConfig: DomainConfig = {
  domain: "beckn.one:commerce:aviation:1.0",
  matchPatterns: [
    "aviation",
    "flight",
    "commerce:aviation",
    "beckn.one:commerce:aviation",
    "beckn.one:commerce:aviation:1.0"
  ],
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

