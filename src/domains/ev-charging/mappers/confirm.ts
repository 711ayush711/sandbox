/**
 * Confirm mapper for EV charging domain
 * Generates on_confirm response based on incoming confirm request and previous on_init context
 * 
 * @param incomingMessage - Confirm request from BAP (contains order confirmation details)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_init response (order initialization details)
 */
export const onConfirmMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const confirmRequest = incomingMessage?.order;
  const onInitResponse = storedContext?.previousResponse?.message?.order;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onInitResponse?.["beckn:id"] || confirmRequest?.["beckn:id"] || `order-${Date.now()}`,
    "beckn:orderStatus": "CONFIRMED",
    "beckn:orderNumber": onInitResponse?.["beckn:orderNumber"] || confirmRequest?.["beckn:orderNumber"] || `ORD-${Date.now()}`,
    "beckn:seller": onInitResponse?.["beckn:seller"] || confirmRequest?.["beckn:seller"] || "ecopower-charging",
    "beckn:buyer": confirmRequest?.["beckn:buyer"] || onInitResponse?.["beckn:buyer"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Buyer",
      "beckn:id": `buyer-${Date.now()}`,
      "beckn:role": "BUYER",
    },
    "beckn:orderItems": (confirmRequest?.["beckn:orderItems"] || onInitResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
    })),
    "beckn:orderValue": onInitResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "INR",
      "schema:price": 128.64,
      "beckn:components": []
    }, // Always from previous on_init (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": confirmRequest?.["beckn:fulfillment"]?.["beckn:id"] || onInitResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/EvChargingSession/v1/context.jsonld",
        "@type": "ChargingSession",
        "connectorType": onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.connectorType || "CCS2",
        "maxPowerKW": onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.maxPowerKW || 50,
        "vehicleMake": confirmRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleMake || onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleMake,
        "vehicleModel": confirmRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleModel || onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.vehicleModel,
        "sessionStatus": "PENDING"
      }
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": confirmRequest?.["beckn:payment"]?.["beckn:id"] || onInitResponse?.["beckn:payment"]?.["beckn:id"] || `payment-${Date.now()}`,
      "beckn:amount": confirmRequest?.["beckn:payment"]?.["beckn:amount"] || onInitResponse?.["beckn:payment"]?.["beckn:amount"] || {
        currency: "INR",
        value: 128.64
      },
      "beckn:paymentURL": confirmRequest?.["beckn:payment"]?.["beckn:paymentURL"] || onInitResponse?.["beckn:payment"]?.["beckn:paymentURL"] || "https://payments.bluechargenet-aggregator.io/pay?transaction_id=$transaction_id&amount=$amount",
      "beckn:txnRef": `TXN-${Date.now()}`,
      "beckn:paidAt": new Date().toISOString(),
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": confirmRequest?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || onInitResponse?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || [
        "BANK_TRANSFER",
        "UPI",
        "WALLET"
      ],
      "beckn:paymentStatus": "COMPLETED"
    },
    "beckn:orderAttributes": confirmRequest?.["beckn:orderAttributes"] || onInitResponse?.["beckn:orderAttributes"] || {
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
      },
      authorizationMode: "OTP",
      authorizationOtpHint: "OTP will be shared to the user's registered number to confirm order",
      sessionStatus: "PENDING"
    }
  };
};

