import { Request, Response } from "express";
import { MessageModel } from "@/models/message.js";

export const getMessages = (_: Request, res: Response) => {
  try {
    const messages = MessageModel.getAll();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const getMessageById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = MessageModel.getById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch message" });
  }
};

export const createMessage = (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "Text field is required and must be a string" });
    }

    const newMessage = MessageModel.create(text);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to create message" });
  }
};

export const updateMessage = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "Text field is required and must be a string" });
    }

    const wasUpdated = MessageModel.update(id, text);
    if (!wasUpdated) {
      return res.status(404).json({ error: "Message not found to update" });
    }

    res.json({ id, text });
  } catch (error) {
    res.status(500).json({ error: "Failed to update message" });
  }
};

export const deleteMessage = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const wasDeleted = MessageModel.delete(id);

    if (!wasDeleted) {
      return res.status(404).json({ error: "Message not found to delete" });
    }

    res.status(200).json({ message: "Message successfully deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
};
