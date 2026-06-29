import type { components, operations } from "./api-types.d.ts";

export type Message = components["schemas"]["Message"];
export type PaginatedMessagesResponse =
  components["schemas"]["PaginatedMessagesResponse"];
export type MessageCreateRequest =
  components["schemas"]["MessageCreateRequest"];

export type MessageQueryParams =
  operations["GetMessages"]["parameters"]["query"];

const API_BASE = "/api/v1/messages";

export const api = {
  /**
   * Fetch messages using optional parameters for text searching, categories,
   * ranges, custom sorting columns, and layout pagination values.
   */
  async getMessages(
    params: MessageQueryParams = {},
  ): Promise<PaginatedMessagesResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load messages (Status: ${response.status})`);
    }

    return (await response.json()) as PaginatedMessagesResponse;
  },

  /**
   * Safe creation endpoint protected against duplicate posts via an Idempotency-Key
   */
  async createMessage(text: string): Promise<Message> {
    const payload: MessageCreateRequest = { text };

    const singleUseKey = crypto.randomUUID();

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        "idempotency-key": singleUseKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create message on backend service.");
    }

    return (await response.json()) as Message;
  },

  /**
   * Update message description values by specific entity ID
   */
  async updateMessage(id: string, text: string): Promise<Message> {
    const payload: MessageCreateRequest = { text };
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to modify target message entry.");
    }

    return (await response.json()) as Message;
  },

  /**
   * Permanent deletion step targeting items by explicit ID string values
   */
  async deleteMessage(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to remove requested message item.");
    }
  },
};
