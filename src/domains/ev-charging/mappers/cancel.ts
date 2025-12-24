/**
 * Cancel mapper for EV charging domain
 * Generates on_cancel response based on incoming cancel request and previous on_confirm context
 * 
 * @param incomingMessage - Cancel request from BAP (contains cancellation details)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onCancelMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const cancelRequest = incomingMessage?.order;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || `order-bpp-${Date.now()}`,
    "beckn:orderStatus": "CANCELLED", // Always system-generated
    "beckn:orderNumber": onConfirmResponse?.["beckn:orderNumber"] || `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || "ecopower-charging",
    "beckn:buyer": cancelRequest?.["beckn:buyer"]?.[0] || cancelRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"],
    "beckn:orderItems": (cancelRequest?.["beckn:orderItems"]?.[0]?.["beckn:orderItems"] || cancelRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
    })),
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "INR",
      "schema:price": 128.64,
      "beckn:components": []
    }, // Always from previous context (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-001`,
      "beckn:mode": "RESERVATION",
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/EvChargingSession/v1/context.jsonld",
        "@type": "ChargingSession",
        "connectorType": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.connectorType || "CCS2",
        "maxPowerKW": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.maxPowerKW || 50,
        "authorizationMode": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.authorizationMode || "OTP",
        "authorizationOtpHint": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.authorizationOtpHint || "OTP will be shared to the user's registered number to confirm order",
        "vehicleMake": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleMake,
        "vehicleModel": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleModel
      }
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": onConfirmResponse?.["beckn:payment"]?.["beckn:id"] || `payment-123e4567-e89b-12d3-a456-${Date.now().toString().slice(-12)}`,
      "beckn:amount": {
        currency: onConfirmResponse?.["beckn:orderValue"]?.["currency"] || "INR",
        value: onConfirmResponse?.["beckn:orderValue"]?.["value"] || 128.64
      },
      "beckn:paymentURL": onConfirmResponse?.["beckn:payment"]?.["beckn:paymentURL"] || "https://payments.bluechargenet-aggregator.io/pay?transaction_id=$transaction_id&amount=$amount",
      "beckn:txnRef": onConfirmResponse?.["beckn:payment"]?.["beckn:txnRef"] || `TXN-${Date.now()}`,
      "beckn:paidAt": onConfirmResponse?.["beckn:payment"]?.["beckn:paidAt"] || new Date().toISOString(),
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": onConfirmResponse?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || [
        "BANK_TRANSFER",
        "UPI",
        "WALLET"
      ],
      "beckn:paymentStatus": "COMPLETED"
    }
  };
};

