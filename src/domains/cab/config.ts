import { DomainConfig } from "../types";
import * as mappers from "./mappers";

export const cabConfig: DomainConfig = {
  domain: "beckn.one:mobility:ride-hailing:1.0",
  matchPatterns: ["ride-hailing", "cab", "mobility:ride-hailing", "taxi"],
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

