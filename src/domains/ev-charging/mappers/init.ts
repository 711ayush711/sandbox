/**
 * Init mapper for EV charging domain
 * Generates on_init response based on incoming init request and previous on_select context
 * 
 * @param incomingMessage - Init request from BAP (contains buyer details, payment, fulfillment)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_select response (order items with details)
 */
export const onInitMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const initRequest = incomingMessage?.order;
  const onSelectResponse = storedContext?.previousResponse?.message?.order;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onSelectResponse?.["beckn:id"] || initRequest?.["beckn:id"] || `order-${Date.now()}`,
    "beckn:orderStatus": "PENDING",
    "beckn:orderNumber": `ORD-${Date.now()}`,
    "beckn:seller": onSelectResponse?.["beckn:seller"] || initRequest?.["beckn:seller"] || "ecopower-charging",
    "beckn:buyer": initRequest?.["beckn:buyer"] || onSelectResponse?.["beckn:buyer"], // From request first, then previous
    "beckn:orderItems": (initRequest?.["beckn:orderItems"] || onSelectResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
    })),
    "beckn:orderValue": onSelectResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "INR",
      "schema:price": 128.64,
      "beckn:components": []
    }, // Always from previous on_select (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": initRequest?.["beckn:fulfillment"]?.["beckn:id"] || onSelectResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/EvChargingSession/v1/context.jsonld",
        "@type": "ChargingSession",
        "connectorType": onSelectResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.connectorType || "CCS2",
        "maxPowerKW": onSelectResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.maxPowerKW || 50,
        "authorizationMode": "OTP", // Always system-generated
        "vehicleMake": initRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleMake,
        "vehicleModel": initRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleModel,
        "sessionStatus": "PENDING"
      }
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": initRequest?.["beckn:payment"]?.["beckn:id"] || `payment-${Date.now()}`,
      "beckn:amount": initRequest?.["beckn:payment"]?.["beckn:amount"] || onSelectResponse?.["beckn:payment"]?.["beckn:amount"] || {
        currency: "INR",
        value: 128.64
      },
      "beckn:paymentURL": initRequest?.["beckn:payment"]?.["beckn:paymentURL"] || onSelectResponse?.["beckn:payment"]?.["beckn:paymentURL"] || "https://payments.bluechargenet-aggregator.io/pay?transaction_id=$transaction_id&amount=$amount",
      "beckn:txnRef": `TXN-${Date.now()}`,
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": initRequest?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || [
        "BANK_TRANSFER",
        "UPI",
        "WALLET"
      ],
      "beckn:paymentStatus": "INITIATED"
    },
    "beckn:orderAttributes": {
      ...(initRequest?.["beckn:orderAttributes"] || onSelectResponse?.["beckn:orderAttributes"] || {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/EvChargingSession/v1/context.jsonld",
        "@type": "ChargingSession",
        sessionPreferences: {
          preferredStartTime: new Date().toISOString(),
          preferredEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          notificationPreferences: {
            email: true,
            sms: true,
            push: false
          }
        }
      }),
      sessionStatus: "PENDING"
    }
  };
};

