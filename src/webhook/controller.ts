import { Request, Response } from "express";
import axios from "axios";
import { logger } from "../utils/logger";
import on_select_response from "./jsons/beckn.one:energy:ev-charging/response/on_select.json";
import on_init_response from "./jsons/beckn.one:energy:ev-charging/response/on_init.json";
import on_confirm_response from "./jsons/beckn.one:energy:ev-charging/response/on_confirm.json";
import on_status_response from "./jsons/beckn.one:energy:ev-charging/response/on_status.json";
import on_track_response from "./jsons/beckn.one:energy:ev-charging/response/on_track.json";
import on_cancel_response from "./jsons/beckn.one:energy:ev-charging/response/on_cancel.json";
import on_update_response from "./jsons/beckn.one:energy:ev-charging/response/on_update.json";
import on_rating_response from "./jsons/beckn.one:energy:ev-charging/response/on_rating.json";
import on_support_response from "./jsons/beckn.one:energy:ev-charging/response/on_support.json";

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_select request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_select",
  });

  // on_select_response.context = { ...context, action: "on_select" };
  (async () => {
    try {
      on_select_response.context = { ...context, action: "on_select" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_select`;
      logger.info("Triggering On Select response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const select_data = await axios.post(targetUrl, on_select_response);
      
      logger.info("On Select api call successful", {
        url: targetUrl,
        status: select_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(select_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Select api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_select`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onInit = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_init request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_init",
  });

  // on_init_response.context = { ...context, action: "on_init" };
  (async () => {
    try {
      on_init_response.context = { ...context, action: "on_init" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_init`;
      logger.info("Triggering On Init response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const init_data = await axios.post(targetUrl, on_init_response);
      
      logger.info("On Init api call successful", {
        url: targetUrl,
        status: init_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(init_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Init api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_init`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onConfirm = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_confirm request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_confirm",
  });

  // on_confirm_response.context = { ...context, action: "on_confirm" };
  (async () => {
    try {
      on_confirm_response.context = { ...context, action: "on_confirm" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_confirm`;
      logger.info("Triggering On Confirm response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const confirm_data = await axios.post(targetUrl, on_confirm_response);
      
      logger.info("On Confirm api call successful", {
        url: targetUrl,
        status: confirm_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(confirm_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Confirm api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_confirm`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_status request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_status",
  });

  // on_status_response.context = { ...context, action: "on_status" };
  (async () => {
    try {
      on_status_response.context = { ...context, action: "on_status" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_status`;
      logger.info("Triggering On Status response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const status_data = await axios.post(targetUrl, on_status_response);
      
      logger.info("On Status api call successful", {
        url: targetUrl,
        status: status_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(status_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Status api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_status`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_update request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_update",
  });

  // on_update_response.context = { ...context, action: "on_update" };
  (async () => {
    try {
      on_update_response.context = { ...context, action: "on_update" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_update`;
      logger.info("Triggering On Update response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const update_data = await axios.post(targetUrl, on_update_response);
      
      logger.info("On Update api call successful", {
        url: targetUrl,
        status: update_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(update_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Update api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_update`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_rating request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_rating",
  });

  // on_rating_response.context = { ...context, action: "on_rating" };
  (async () => {
    try {
      on_rating_response.context = { ...context, action: "on_rating" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_rating`;
      logger.info("Triggering On Rating response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const rating_data = await axios.post(targetUrl, on_rating_response);
      
      logger.info("On Rating api call successful", {
        url: targetUrl,
        status: rating_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(rating_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Rating api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_rating`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_support request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_support",
  });

  // on_support_response.context = { ...context, action: "on_support" };
  (async () => {
    try {
      on_support_response.context = { ...context, action: "on_support" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_support`;
      logger.info("Triggering On Support response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const support_data = await axios.post(targetUrl, on_support_response);
      
      logger.info("On Support api call successful", {
        url: targetUrl,
        status: support_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(support_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Support api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_support`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_track request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_track",
  });

  // on_track_response.context = { ...context, action: "on_track" };
  (async () => {
    try {
      on_track_response.context = { ...context, action: "on_track" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_track`;
      logger.info("Triggering On Track response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const track_data = await axios.post(targetUrl, on_track_response);
      
      logger.info("On Track api call successful", {
        url: targetUrl,
        status: track_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(track_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Track api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_track`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received on_cancel request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "on_cancel",
  });

  // on_cancel_response.context = { ...context, action: "on_cancel" };
  (async () => {
    try {
      on_cancel_response.context = { ...context, action: "on_cancel" };
      const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_cancel`;
      logger.info("Triggering On Cancel response", {
        url: targetUrl,
        context: context?.transaction_id,
      });
      
      const cancel_data = await axios.post(targetUrl, on_cancel_response);
      
      logger.info("On Cancel api call successful", {
        url: targetUrl,
        status: cancel_data.status,
        context: context?.transaction_id,
        response: JSON.stringify(cancel_data.data, null, 2),
      });
    } catch (error: any) {
      logger.error("On Cancel api call failed", {
        url: `${full_bpp_url.origin}/bpp/caller/on_cancel`,
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
    } finally {
      return;
    }
  })();
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const triggerOnStatus = async (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);

  logger.info("Received trigger on_status request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "trigger_on_status",
  });

  try {
    const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_status`;
    logger.info("Triggering On Status response", {
      url: targetUrl,
      context: context?.transaction_id,
    });
    
    const status_data = await axios.post(targetUrl, { context, message });
    
    logger.info("Trigger On Status api call successful", {
      url: targetUrl,
      status: status_data.status,
      context: context?.transaction_id,
      response: JSON.stringify(status_data.data, null, 2),
    });
  } catch (error: any) {
    logger.error("Trigger On Status api call failed", {
      url: `${full_bpp_url.origin}/bpp/caller/on_status`,
      context: context?.transaction_id,
      error: error.message,
      stack: error.stack,
      response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
    });
  }

  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const triggerOnUpdate = async (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);
  
  logger.info("Received trigger on_update request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "trigger_on_update",
  });

  try {
    const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_update`;
    logger.info("Triggering On Update response", {
      url: targetUrl,
      context: context?.transaction_id,
    });
    
    const update_data = await axios.post(targetUrl, { context, message });
    
    logger.info("Trigger On Update api call successful", {
      url: targetUrl,
      status: update_data.status,
      context: context?.transaction_id,
      response: JSON.stringify(update_data.data, null, 2),
    });
  } catch (error: any) {
    logger.error("Trigger On Update api call failed", {
      url: `${full_bpp_url.origin}/bpp/caller/on_update`,
      context: context?.transaction_id,
      error: error.message,
      stack: error.stack,
      response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
    });
  }
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const triggerOnCancel = async (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  const full_bpp_url = new URL(context.bpp_uri);

  logger.info("Received trigger on_cancel request", {
    context: context?.transaction_id,
    bpp_uri: context?.bpp_uri,
    action: "trigger_on_cancel",
  });

  try {
    const targetUrl = `${full_bpp_url.origin}/bpp/caller/on_cancel`;
    logger.info("Triggering On Cancel response", {
      url: targetUrl,
      context: context?.transaction_id,
    });
    
    const cancel_data = await axios.post(targetUrl, { context, message });
    
    logger.info("Trigger On Cancel api call successful", {
      url: targetUrl,
      status: cancel_data.status,
      context: context?.transaction_id,
      response: JSON.stringify(cancel_data.data, null, 2),
    });
  } catch (error: any) {
    logger.error("Trigger On Cancel api call failed", {
      url: `${full_bpp_url.origin}/bpp/caller/on_cancel`,
      context: context?.transaction_id,
      error: error.message,
      stack: error.stack,
      response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
    });
  }
  return res.status(200).json({ message: { ack: { status: "ACK" } } });
};

export const onDiscover = async (req: Request, res: Response) => {
  const discoverPayload = req.body;
  const { context } = discoverPayload;
  
  logger.info("Received discover request", {
    context: context?.transaction_id,
    action: "discover",
  });

  try {
    // Step 1: Call BPP directly (bypassing adapter)
    const bppUrl = `${process.env.CDS_ENDOINT}/beckn/discover`;
    logger.info("Calling BPP discover endpoint", {
      url: bppUrl,
      context: context?.transaction_id,
    });

    const discoverResponse = await axios.post(bppUrl, discoverPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    logger.info("BPP discover call successful", {
      url: bppUrl,
      status: discoverResponse.status,
      context: context?.transaction_id,
      response: JSON.stringify(discoverResponse.data, null, 2),
    });

    // Send response to client immediately after successful BPP call
    res.status(200).json({
      context,
      message: {
        ack: {
          status: "ACK",
        },
      },
    });

    // Forward to adapter (fire and forget - don't block on this)
    const adapterUrl = `${process.env.ONIX_ADAPTOR}/bap/receiver/on_discover`;
    logger.info("Forwarding discover response to adapter", {
      url: adapterUrl,
      context: context?.transaction_id,
    });

    // Use fire-and-forget pattern to avoid blocking
    axios.post(adapterUrl, discoverResponse.data)
      .then(() => {
        logger.info("Discover response forwarded successfully", {
          url: adapterUrl,
          context: context?.transaction_id,
        });
      })
      .catch((adapterError: any) => {
        logger.error("Failed to forward discover response to adapter", {
          url: adapterUrl,
          context: context?.transaction_id,
          error: adapterError.message,
          stack: adapterError.stack,
          response: adapterError.response?.data ? JSON.stringify(adapterError.response.data, null, 2) : undefined,
        });
      });

    return;
  } catch (error: any) {
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      logger.error("Error in discover flow (BPP call failed)", {
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
        url: error.config?.url,
      });
      return res.status(500).json({
        context,
        message: {
          ack: {
            status: "NACK",
          },
        },
      });
    } else {
      // If response was already sent, just log the error
      logger.error("Error in discover flow (after response sent)", {
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
        url: error.config?.url,
      });
    }
  }
};