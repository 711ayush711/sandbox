/**
 * Update mapper for Flight domain
 * Generates on_update response based on incoming update request and previous on_confirm context
 * 
 * @param incomingMessage - Update request from BAP (contains order update details)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onUpdateMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const updateRequest = incomingMessage?.order;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;
  const confirmOrderItemAttributes = onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"] || {};

  // Merge passenger updates from request
  const updatedPassengers = updateRequest?.["beckn:orderAttributes"]?.["passengers"] || [];
  const existingPassengers = onConfirmResponse?.["beckn:orderAttributes"]?.["passengers"] || [];
  
  // Check if gate changed
  const oldGate = onConfirmResponse?.["beckn:orderAttributes"]?.["checkInDetails"]?.["gate"] || 
                  confirmOrderItemAttributes?.["flight:departureAirport"]?.["gate"];
  const newGate = updateRequest?.["beckn:orderAttributes"]?.["checkInDetails"]?.["gate"];
  const gateChanged = newGate && oldGate && newGate !== oldGate;
  
  const pnr = onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21";
  
  let mergedPassengers: any[] = [];
  if (existingPassengers.length > 0) {
    mergedPassengers = existingPassengers.map((existing: any) => {
      const update = updatedPassengers.find((upd: any) => 
        upd.passengerId === existing.id || 
        upd.id === existing.id || 
        upd.passengerId === `PAX${existing.id?.replace("pax-", "").toUpperCase()}` ||
        upd.id === `PAX${existing.id?.replace("pax-", "").toUpperCase()}` ||
        upd.passengerId === existing.id?.replace("pax-", "").toUpperCase()
      );
      if (update) {
        // Merge update with existing, preserving all existing fields (checkInStatus, checkInTime, boardingPass, etc.)
        // Only update specific fields from update request - do NOT include passengerId or updateReason in response
        const merged = { 
          ...existing, 
          // Only update specific fields from update request
          assignedSeat: update.assignedSeat || existing.assignedSeat,
          seatPreference: update.seatPreference || existing.seatPreference
        };
        
        // Remove passengerId and updateReason if they exist (these are request-only fields)
        delete merged.passengerId;
        delete merged.updateReason;
        
        // Ensure checkInStatus and checkInTime are present (static defaults if missing)
        if (!merged.checkInStatus) {
          merged.checkInStatus = "CHECKED_IN";
        }
        if (!merged.checkInTime) {
          merged.checkInTime = "2025-12-14T10:00:00-08:00";
        }
        
        // Ensure boardingPass is present (static defaults if missing)
        if (!merged.boardingPass) {
          const passengerId = merged.id?.replace("pax-", "").toUpperCase() || "PAX001";
          merged.boardingPass = {
            "url": `https://delta-airlines-platform.com/boardingpass/${pnr}-${passengerId}.pdf`,
            "mimeType": "application/pdf",
            "qrCode": `https://delta-airlines-platform.com/boardingpass/qr/${pnr}-${passengerId}.png`,
            "barcode": `M1${(merged.lastName || "BECKN").toUpperCase()}/${merged.firstName || "FIDE"}           E${pnr} SFOJFK 3551 ${merged.assignedSeat || "12A"}001D007B`
          };
        } else if (update.assignedSeat && update.assignedSeat !== existing.assignedSeat) {
          // Update boarding pass barcode if seat changed
          const depCode = confirmOrderItemAttributes?.["flight:departureAirport"]?.["code"] || "SFO";
          const arrCode = confirmOrderItemAttributes?.["flight:arrivalAirport"]?.["code"] || "JFK";
          const flightNum = confirmOrderItemAttributes?.["flight:flightNumber"] || "DL145";
          merged.boardingPass = {
            ...merged.boardingPass,
            "barcode": `M1${(merged.lastName || "BECKN").toUpperCase()}/${merged.firstName || "FIDE"}           E${pnr} ${depCode}${arrCode} ${flightNum} ${update.assignedSeat}001D014BB`
          };
        }
        return merged;
      }
      // Ensure existing passenger has all required fields
      const passengerWithDefaults: any = {
        ...existing,
        checkInStatus: existing.checkInStatus || "CHECKED_IN",
        checkInTime: existing.checkInTime || "2025-12-14T10:00:00-08:00",
        boardingPass: existing.boardingPass || {
          "url": `https://delta-airlines-platform.com/boardingpass/${pnr}-${existing.id?.replace("pax-", "").toUpperCase() || "PAX001"}.pdf`,
          "mimeType": "application/pdf",
          "qrCode": `https://delta-airlines-platform.com/boardingpass/qr/${pnr}-${existing.id?.replace("pax-", "").toUpperCase() || "PAX001"}.png`,
          "barcode": `M1${(existing.lastName || "BECKN").toUpperCase()}/${existing.firstName || "FIDE"}           E${pnr} SFOJFK 3551 ${existing.assignedSeat || "12A"}001D007B`
        }
      };
      // Remove passengerId and updateReason if they exist (these are request-only fields)
      delete passengerWithDefaults.passengerId;
      delete passengerWithDefaults.updateReason;
      return passengerWithDefaults;
    });
  } else if (updatedPassengers.length > 0) {
    mergedPassengers = updatedPassengers.map((upd: any) => {
      const passenger: any = {
        ...upd,
        checkInStatus: "CHECKED_IN",
        checkInTime: "2025-12-14T10:00:00-08:00",
        boardingPass: {
          "url": `https://delta-airlines-platform.com/boardingpass/${pnr}-PAX001.pdf`,
          "mimeType": "application/pdf",
          "qrCode": `https://delta-airlines-platform.com/boardingpass/qr/${pnr}-PAX001.png`,
          "barcode": `M1${(upd.lastName || "BECKN").toUpperCase()}/${upd.firstName || "FIDE"}           E${pnr} SFOJFK 3551 ${upd.assignedSeat || "12A"}001D007B`
        }
      };
      // Remove passengerId and updateReason if they exist (these are request-only fields)
      delete passenger.passengerId;
      delete passenger.updateReason;
      return passenger;
    });
  }

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || updateRequest?.["beckn:id"] || `order-flight-${Date.now()}`,
    "beckn:orderNumber": onConfirmResponse?.["beckn:orderNumber"] || `BK-${Date.now().toString().slice(-6)}`,
    "beckn:orderStatus": "IN_PROGRESS", // Always system-generated
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || updateRequest?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-delta-airlines"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": updateRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => {
      const confirmOrderItem = onConfirmResponse?.["beckn:orderItems"]?.[0];
      const confirmAcceptedOffer = confirmOrderItem?.["beckn:acceptedOffer"];
      const confirmOrderItemAttributes = confirmOrderItem?.["beckn:orderItemAttributes"] || {};
      
      // Update gate in departureAirport if provided
      const updatedGate = newGate || confirmOrderItemAttributes?.["flight:departureAirport"]?.["gate"] || 
                         onConfirmResponse?.["beckn:orderAttributes"]?.["checkInDetails"]?.["gate"];
      
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || confirmOrderItem?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || confirmOrderItem?.["beckn:orderedItem"],
        "beckn:quantity": item?.["beckn:quantity"] || confirmOrderItem?.["beckn:quantity"] || 1,
        "beckn:acceptedOffer": confirmAcceptedOffer || item?.["beckn:acceptedOffer"] || {},
        "beckn:price": confirmOrderItem?.["beckn:price"] || item?.["beckn:price"] || {},
        "beckn:orderItemAttributes": {
          ...confirmOrderItemAttributes,
          "flight:departureAirport": {
            ...confirmOrderItemAttributes?.["flight:departureAirport"],
            "gate": updatedGate
          },
          "flight:flightStatus": "BOARDING" // Always system-generated
        }
      };
    }),
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 392.70,
      "beckn:components": []
    }, // Always from previous context (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": updateRequest?.["beckn:fulfillment"]?.["beckn:id"] || onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "BOARDING", // Always system-generated
      "beckn:trackingAction": {
        "@type": "schema:TrackAction",
        "schema:target": {
          "@type": "schema:EntryPoint",
          "schema:url": `https://delta.com/track/${onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21"}`
        }
      }
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": updateRequest?.["beckn:payment"]?.["beckn:id"] || onConfirmResponse?.["beckn:payment"]?.["beckn:id"] || `payment-${Date.now()}`,
      "beckn:status": "PAID", // Always system-generated
      "beckn:amount": updateRequest?.["beckn:payment"]?.["beckn:amount"] || onConfirmResponse?.["beckn:payment"]?.["beckn:amount"] || {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 392.70
      },
      "beckn:txnRef": onConfirmResponse?.["beckn:payment"]?.["beckn:txnRef"] || `TXN-${Date.now()}`,
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": updateRequest?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || onConfirmResponse?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || ["Card"]
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "@context": onConfirmResponse?.["beckn:orderAttributes"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightBooking/v1/context.jsonld",
      "@type": onConfirmResponse?.["beckn:orderAttributes"]?.["@type"] || "FlightBooking",
      "pnr": onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || `DL${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      "bookingReference": onConfirmResponse?.["beckn:orderNumber"] || onConfirmResponse?.["beckn:orderAttributes"]?.["bookingReference"] || `BK-${Date.now().toString().slice(-6)}`,
      "passengers": mergedPassengers.length > 0 ? mergedPassengers : (onConfirmResponse?.["beckn:orderAttributes"]?.["passengers"] || []),
      "confirmationDocument": onConfirmResponse?.["beckn:orderAttributes"]?.["confirmationDocument"] || {
        "url": `https://delta-airlines-platform.com/documents/booking-${(onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21").toLowerCase()}-confirmation.pdf`,
        "mimeType": "application/pdf"
      },
      "eTicket": onConfirmResponse?.["beckn:orderAttributes"]?.["eTicket"] || {
        "url": `https://delta-airlines-platform.com/documents/eticket-${(onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21").toLowerCase()}.pdf`,
        "mimeType": "application/pdf"
      },
      "checkInDetails": (() => {
        const existingCheckIn = onConfirmResponse?.["beckn:orderAttributes"]?.["checkInDetails"] || {};
        const updateCheckIn = updateRequest?.["beckn:orderAttributes"]?.["checkInDetails"] || {};
        const finalGate = newGate || existingCheckIn.gate || 
                          confirmOrderItemAttributes?.["flight:departureAirport"]?.["gate"] || "D14B";
        const finalTerminal = updateCheckIn.terminal || existingCheckIn.terminal || 
                             confirmOrderItemAttributes?.["flight:departureAirport"]?.["terminal"] || "2";
        
        const checkInDetails: any = {
          "checkInOpenTime": existingCheckIn.checkInOpenTime || updateCheckIn.checkInOpenTime || "2025-12-14T09:30:00-08:00",
          "checkInCloseTime": existingCheckIn.checkInCloseTime || updateCheckIn.checkInCloseTime || "2025-12-15T08:30:00-08:00",
          "boardingTime": existingCheckIn.boardingTime || updateCheckIn.boardingTime || "2025-12-15T09:00:00-08:00",
          "gate": finalGate,
          "terminal": finalTerminal
        };
        
        // Add gateChangeNotification only if gate changed
        if (gateChanged) {
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          checkInDetails.gateChangeNotification = `Gate changed from ${oldGate} to ${newGate} at ${timeStr}`;
        }
        
        return checkInDetails;
      })(),
      "cancellationTerms": onConfirmResponse?.["beckn:orderAttributes"]?.["cancellationTerms"] || [
        {
          "condition": "More than 24 hours before departure",
          "cancellationFee": 200.00,
          "refundEligible": true,
          "refundPercentage": 35
        },
        {
          "condition": "Less than 24 hours before departure",
          "cancellationFee": 280.00,
          "refundEligible": false
        }
      ]
    }
  };
};

