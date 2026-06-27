import { Request, Response } from "express";
import { messages } from "@/models/message.js";

export const getMessages = (_: Request, res: Response) => {
  res.json(messages);
};
