import { Request, Response } from "express";
import logger from "../utils/logger";

export const onSelect = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  logger.info("Received BAP on_select webhook", {
    context: context?.transaction_id,
    action: "on_select",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onInit = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  logger.info("Received BAP on_init webhook", {
    context: context?.transaction_id,
    action: "on_init",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onConfirm = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  logger.info("Received BAP on_confirm webhook", {
    context: context?.transaction_id,
    action: "on_confirm",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onStatus = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  logger.info("Received BAP on_status webhook", {
    context: context?.transaction_id,
    action: "on_status",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onUpdate = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  logger.info("Received BAP on_update webhook", {
    context: context?.transaction_id,
    action: "on_update",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};
export const onRating = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;
  
  logger.info("Received BAP on_rating webhook", {
    context: context?.transaction_id,
    action: "on_rating",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onSupport = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  logger.info("Received BAP on_support webhook", {
    context: context?.transaction_id,
    action: "on_support",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });

  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onTrack = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  logger.info("Received BAP on_track webhook", {
    context: context?.transaction_id,
    action: "on_track",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};

export const onCancel = (req: Request, res: Response) => {
  const { context, message }: { context: any; message: any } = req.body;

  logger.info("Received BAP on_cancel webhook", {
    context: context?.transaction_id,
    action: "on_cancel",
    message: JSON.stringify(message, null, 2),
    context_data: JSON.stringify(context, null, 2),
  });
  
  return res.status(200).json({message: {ack: {status: "ACK"}}});
};
