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
  Middlewares,
} from "tsoa";
import { MessageService } from "@/services/messageService.js";
import { Message } from "@/models/schema.js";
import { idempotencyInterceptor } from "@/middlewares/idempotencyMiddleware.js";
import { rateLimiter } from "@/middlewares/rateLimiterMiddleware.js";

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

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

@Route("api/v1/messages")
export class MessageController extends Controller {
  private messageService = new MessageService();

  /**
   * Fetch messages with support for search, filters, sorting, and offset pagination
   */
  @Get("")
  @Middlewares(rateLimiter())
  @Response<ProblemDetails>(400, "Bad Request")
  @Response<ProblemDetails>(429, "Too Many Requests")
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
  @Response<ProblemDetails>(404, "Message Not Found")
  public async getMessageById(@Path() id: string): Promise<Message> {
    const message = await this.messageService.getById(id);
    if (!message) {
      throw {
        status: 404,
        message: `The message log with ID '${id}' could not be located.`,
      };
    }
    return message;
  }

  /**
   * Create a new message protected against duplicate submissions and payload bursts
   */
  @Post("")
  @Middlewares(idempotencyInterceptor, rateLimiter(5))
  @Response<ProblemDetails>(400, "Bad Request")
  @Response<ProblemDetails>(429, "Too Many Requests")
  public async createMessage(
    @Body() requestBody: MessageCreateRequest,
  ): Promise<Message> {
    this.setStatus(201);
    return this.messageService.create(requestBody.text, {
      category: "user",
      priority: 3,
    });
  }

  /**
   * Update an existing message text description
   */
  @Put("{id}")
  @Response<ProblemDetails>(400, "Bad Request")
  @Response<ProblemDetails>(404, "Message Not Found")
  public async updateMessage(
    @Path() id: string,
    @Body() requestBody: MessageCreateRequest,
  ): Promise<Message> {
    const wasUpdated = await this.messageService.update(id, requestBody.text);
    if (!wasUpdated) {
      throw {
        status: 404,
        message: `Failed to modify target message entry: ID '${id}' not found.`,
      };
    }
    return { id, text: requestBody.text } as Message;
  }

  /**
   * Remove a message
   */
  @Delete("{id}")
  @Response<ProblemDetails>(404, "Message Not Found")
  public async deleteMessage(@Path() id: string): Promise<{ message: string }> {
    const wasDeleted = await this.messageService.delete(id);
    if (!wasDeleted) {
      throw {
        status: 404,
        message: `Failed to remove requested message item: ID '${id}' not found.`,
      };
    }
    return { message: "Message deleted successfully" };
  }
}
