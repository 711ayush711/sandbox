/**
 * Status mapper for EV charging domain
 * Generates on_status response based on incoming status request and previous on_confirm context
 * 
 * @param incomingMessage - Status request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onStatusMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const statusRequest = incomingMessage;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || `order-${Date.now()}`,
    "beckn:orderStatus": "INPROGRESS", // Always system-generated
    "beckn:orderNumber": onConfirmResponse?.["beckn:orderNumber"] || `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || "ecopower-charging",
    "beckn:buyer": onConfirmResponse?.["beckn:buyer"],
    "beckn:orderItems": onConfirmResponse?.["beckn:orderItems"] || [],
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "INR",
      "schema:price": 128.64,
      "beckn:components": []
    }, // Always from previous context (preserves context URL from previous)
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
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/EvChargingSession/v1/context.jsonld",
        "@type": "ChargingSession",
        "sessionStatus": "INTERRUPTED", // Always system-generated
        "connectorType": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.connectorType || "CCS2",
        "maxPowerKW": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.maxPowerKW || 50,
        "authorizationMode": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.authorizationMode || "OTP",
        "authorizationOtpHint": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.authorizationOtpHint || "OTP will be shared to the user's registered number to confirm order",
        "vehicleMake": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleMake,
        "vehicleModel": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleModel
      }
    },
    "beckn:payment": onConfirmResponse?.["beckn:payment"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": `payment-123e4567-e89b-12d3-a456-${Date.now().toString().slice(-12)}`,
      "beckn:amount": {
        currency: "INR",
        value: 128.64
      },
      "beckn:paymentURL": "https://payments.bluechargenet-aggregator.io/pay?transaction_id=$transaction_id&amount=$amount",
      "beckn:txnRef": `TXN-${Date.now()}`,
      "beckn:paidAt": onConfirmResponse?.["beckn:payment"]?.["beckn:paidAt"] || new Date().toISOString(),
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": [
        "BANK_TRANSFER",
        "UPI",
        "WALLET"
      ],
      "beckn:paymentStatus": "COMPLETED"
    }
  };
};

