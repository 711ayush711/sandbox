/**
 * Track mapper for EV charging domain
 * Generates on_track response based on incoming track request and previous on_confirm context
 * 
 * @param incomingMessage - Track request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onTrackMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const trackRequest = incomingMessage?.order;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  // Generate charging telemetry dynamically (system-generated)
  const now = new Date();
  const telemetry1 = {
    eventTime: now.toISOString(),
    metrics: [
      { name: "STATE_OF_CHARGE", value: 62.5, unitCode: "PERCENTAGE" },
      { name: "POWER", value: 18.4, unitCode: "KWH" },
      { name: "ENERGY", value: 10.2, unitCode: "KW" },
      { name: "VOLTAGE", value: 392, unitCode: "VLT" },
      { name: "CURRENT", value: 47.0, unitCode: "AMP" }
    ]
  };
  const telemetry2 = {
    eventTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    metrics: [
      { name: "STATE_OF_CHARGE", value: 65.0, unitCode: "PERCENTAGE" },
      { name: "POWER", value: 17.1, unitCode: "KWH" },
      { name: "ENERGY", value: 11.1, unitCode: "KW" },
      { name: "VOLTAGE", value: 388, unitCode: "VLT" },
      { name: "CURRENT", value: 44.2, unitCode: "AMP" }
    ]
  };

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || trackRequest?.["beckn:id"] || `order-bpp-${Date.now()}`,
    "beckn:orderStatus": "INPROGRESS", // Always system-generated
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || trackRequest?.["beckn:seller"] || "ecopower-charging",
    "beckn:buyer": trackRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"],
    "beckn:orderItems": (trackRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      "beckn:lineId": item["beckn:lineId"],
      "beckn:orderedItem": item["beckn:orderedItem"],
      "beckn:quantity": item["beckn:quantity"]
    })),
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-001`,
      "beckn:mode": "RESERVATION",
      "trackingAction": {
        "@type": "schema:TrackAction",
        "target": {
          "@type": "schema:EntryPoint",
          "url": `https://track.bluechargenet-aggregator.io/session/SESSION-${Date.now().toString().slice(-10)}`
        },
        "deliveryMethod": "RESERVATION",
        "reservationId": `TRACK-SESSION-${Date.now().toString().slice(-10)}`
      },
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/EvChargingService/v1/context.jsonld",
        "@type": "ChargingSession",
        "chargingTelemetry": [telemetry1, telemetry2] // Always system-generated
      }
    }
  };
};

