import {
  Controller,
  Route,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Body,
  Query,
  Response,
} from "tsoa";
import { MessageService } from "@/services/messageService.js";
import { Message } from "@/models/message.js";

export interface PaginatedMessagesResponse {
  data: Message[];
  meta: {
    totalRecords: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}
export interface MessageCreateRequest {
  text: string;
}

export interface ErrorMessage {
  error: string;
}

@Route("api/v1/messages")
export class MessageController extends Controller {
  private messageService = new MessageService();

  /**
   * Fetch messages with support for search, filters, sorting, and offset pagination
   */
  @Get("")
  public async getMessages(
    @Query() search?: string,
    @Query() category?: "system" | "user" | "billing",
    @Query() minPriority?: number,
    @Query() isRead?: boolean,
    @Query() sortBy?: "createdAt" | "priority",
    @Query() order?: "asc" | "desc",
    @Query() page?: number,
    @Query() limit?: number,
  ): Promise<PaginatedMessagesResponse> {
    return this.messageService.getAll({
      search,
      category,
      minPriority,
      isRead,
      sortBy,
      order,
      page,
      limit,
    });
  }

  /**
   * Fetch a single message by ID
   */
  @Get("{id}")
  @Response<ErrorMessage>(404, "Message not found")
  public async getMessageById(
    @Path() id: string,
  ): Promise<Message | ErrorMessage> {
    const message = await this.messageService.getById(id);
    if (!message) {
      this.setStatus(404);
      return { error: "Message not found" };
    }
    return message;
  }

  /**
   * Create a new message
   */
  @Post("")
  async createMessage(
    @Body() requestBody: MessageCreateRequest,
  ): Promise<Message> {
    this.setStatus(201);
    return this.messageService.create(requestBody.text);
  }

  /**
   * Update an existing message text description
   */
  @Put("{id}")
  @Response<ErrorMessage>(404, "Message not found to update")
  public async updateMessage(
    @Path() id: string,
    @Body() requestBody: MessageCreateRequest,
  ): Promise<Message | ErrorMessage> {
    const wasUpdated = await this.messageService.update(id, requestBody.text);
    if (!wasUpdated) {
      this.setStatus(404);
      return { error: "Message not found to update" };
    }
    return { id, text: requestBody.text } as Message;
  }

  /**
   * Remove a message
   */
  @Delete("{id}")
  @Response<ErrorMessage>(404, "Message not found to delete")
  public async deleteMessage(
    @Path() id: string,
  ): Promise<{ message: string } | ErrorMessage> {
    const wasDeleted = await this.messageService.delete(id);
    if (!wasDeleted) {
      this.setStatus(404);
      return { error: "Message not found to delete" };
    }
    return { message: "Message deleted successfully" };
  }
}
