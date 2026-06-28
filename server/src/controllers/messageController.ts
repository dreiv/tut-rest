import {
  Controller,
  Route,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Body,
  SuccessResponse,
  Response,
} from "tsoa";
import { MessageModel } from "@/models/message.js";

// 1. Define your TypeScript types (tsoa auto-converts these into Swagger Schemas)
export interface Message {
  id: string;
  text: string;
}

export interface MessageCreateRequest {
  text: string;
}

export interface ErrorMessage {
  error: string;
}

@Route("api/v1/messages")
export class MessageController extends Controller {
  /**
   * Fetch all messages
   */
  @Get("")
  public async getMessages(): Promise<Message[]> {
    try {
      return MessageModel.getAll() as Message[];
    } catch (error) {
      this.setStatus(500);
      return { error: "Failed to fetch messages" } as any;
    }
  }

  /**
   * Fetch a single message by ID
   */
  @Get("{id}")
  @Response<ErrorMessage>(400, "Invalid ID format")
  @Response<ErrorMessage>(404, "Message not found")
  public async getMessageById(
    @Path() id: string,
  ): Promise<Message | ErrorMessage> {
    try {
      if (!id || typeof id !== "string") {
        this.setStatus(400);
        return { error: "Invalid ID format" };
      }

      const message = MessageModel.getById(id);
      if (!message) {
        this.setStatus(404);
        return { error: "Message not found" };
      }

      return message as Message;
    } catch (error) {
      this.setStatus(500);
      return { error: "Failed to fetch message" };
    }
  }

  /**
   * Create a new message
   */
  @Post("")
  @SuccessResponse("201", "Created")
  @Response<ErrorMessage>(400, "Invalid request body")
  public async createMessage(
    @Body() requestBody: MessageCreateRequest,
  ): Promise<Message | ErrorMessage> {
    try {
      const { text } = requestBody;
      if (!text || typeof text !== "string") {
        this.setStatus(400);
        return { error: "Text field is required and must be a string" };
      }

      const newMessage = MessageModel.create(text);
      this.setStatus(201);
      return newMessage as Message;
    } catch (error) {
      this.setStatus(500);
      return { error: "Failed to create message" };
    }
  }

  /**
   * Update message text
   */
  @Put("{id}")
  @Response<ErrorMessage>(400, "Invalid request body or ID format")
  @Response<ErrorMessage>(404, "Message not found to update")
  public async updateMessage(
    @Path() id: string,
    @Body() requestBody: MessageCreateRequest,
  ): Promise<Message | ErrorMessage> {
    try {
      if (!id || typeof id !== "string") {
        this.setStatus(400);
        return { error: "Invalid ID format" };
      }

      const { text } = requestBody;
      if (!text || typeof text !== "string") {
        this.setStatus(400);
        return { error: "Text field is required and must be a string" };
      }

      const wasUpdated = MessageModel.update(id, text);
      if (!wasUpdated) {
        this.setStatus(404);
        return { error: "Message not found to update" };
      }

      return { id, text } as Message;
    } catch (error) {
      this.setStatus(500);
      return { error: "Failed to update message" };
    }
  }

  /**
   * Remove a message
   */
  @Delete("{id}")
  @Response<ErrorMessage>(400, "Invalid ID format")
  @Response<ErrorMessage>(404, "Message not found to delete")
  public async deleteMessage(
    @Path() id: string,
  ): Promise<{ message: string } | ErrorMessage> {
    try {
      if (!id || typeof id !== "string") {
        this.setStatus(400);
        return { error: "Invalid ID format" };
      }

      const wasDeleted = MessageModel.delete(id);
      if (!wasDeleted) {
        this.setStatus(404);
        return { error: "Message not found to delete" };
      }

      return { message: "Message successfully deleted" };
    } catch (error) {
      this.setStatus(500);
      return { error: "Failed to delete message" };
    }
  }
}
