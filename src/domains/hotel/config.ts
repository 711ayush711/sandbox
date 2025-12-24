import { DomainConfig } from "../types";
import * as mappers from "./mappers";

/**
 * Hotel Domain Configuration
 */
export const hotelConfig: DomainConfig = {
  domain: "beckn.one:commerce:hospitality:1.0",
  matchPatterns: [
    "hospitality",
    "hotel",
    "commerce:hospitality",
    "beckn.one:commerce:hospitality",
    "beckn.one:commerce:hospitality:1.0",
    "accommodation"
  ],
  messageStructure: "order",
  mappers: {
    on_select: mappers.onSelectMapper,
    on_init: mappers.onInitMapper,
    on_confirm: mappers.onConfirmMapper,
    on_status: mappers.onStatusMapper,
    on_update: mappers.onUpdateMapper,
    on_cancel: mappers.onCancelMapper,
    on_rating: mappers.onRatingMapper,
    on_support: mappers.onSupportMapper,
  },
};

