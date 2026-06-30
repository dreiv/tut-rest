import "./style.css";
import { api } from "./api.js";
import type { Message, MessageQueryParams } from "./api.js";

// DOM Node Element Selectors
const messageList = document.getElementById("message-list") as HTMLUListElement;
const statusContainer = document.getElementById(
  "status-container",
) as HTMLDivElement;
const messageForm = document.getElementById("message-form") as HTMLFormElement;
const newMessageInput = document.getElementById(
  "new-message-text",
) as HTMLInputElement;

const filterForm = document.getElementById("filter-form") as HTMLFormElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const categoryFilter = document.getElementById(
  "category-filter",
) as HTMLSelectElement;
const priorityFilter = document.getElementById(
  "priority-filter",
) as HTMLSelectElement;
const sortBySelect = document.getElementById("sort-by") as HTMLSelectElement;
const sortOrderSelect = document.getElementById(
  "sort-order",
) as HTMLSelectElement;

const prevPageBtn = document.getElementById(
  "prev-page-btn",
) as HTMLButtonElement;
const nextPageBtn = document.getElementById(
  "next-page-btn",
) as HTMLButtonElement;
const pageIndicator = document.getElementById(
  "page-indicator",
) as HTMLSpanElement;

const editDialog = document.getElementById("edit-dialog") as HTMLDialogElement;
const editDialogForm = document.getElementById(
  "edit-dialog-form",
) as HTMLFormElement;
const editMessageInput = document.getElementById(
  "edit-message-text",
) as HTMLInputElement;
const cancelEditBtn = document.getElementById(
  "cancel-edit-btn",
) as HTMLButtonElement;

// Centralized Reactive Client Application State Store
const state = {
  messages: [] as Message[],
  meta: {
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  },
  filters: {
    search: "",
    category: undefined,
    minPriority: undefined,
    sortBy: "createdAt",
    order: "desc",
  } as {
    search: string;
    category: "system" | "user" | "billing" | undefined;
    minPriority: number | undefined;
    sortBy: "createdAt" | "priority";
    order: "asc" | "desc";
  },
};

let currentlyEditingId: string | null = null;

function renderStatus(message: string, isError = false) {
  if (!statusContainer) return;
  statusContainer.innerHTML = message
    ? `<p class="${isError ? "error-state" : "loading-state"}">${message}</p>`
    : "";
}

/**
 * Fetch messages orchestrator combining state configurations into URL query attributes
 */
async function loadMessages() {
  renderStatus("Loading matched messages feed...");
  try {
    const queryParams: MessageQueryParams = {
      page: state.meta.currentPage,
      limit: state.meta.limit,
      sortBy: state.filters.sortBy,
      order: state.filters.order,
    };

    if (state.filters.search) queryParams.search = state.filters.search;
    if (state.filters.category) queryParams.category = state.filters.category;
    if (state.filters.minPriority !== undefined)
      queryParams.minPriority = state.filters.minPriority;

    const response = await api.getMessages(queryParams);

    state.messages = response.data;
    state.meta = response.meta;

    renderStatus("");
    renderMessages();
    renderPaginationControls();
  } catch (error) {
    console.error("Fetch error cycle captured:", error);
    renderStatus(
      "Failed to synchronize with messaging service feed parameters.",
      true,
    );
  }
}

function renderMessages() {
  if (!messageList) return;
  messageList.innerHTML = "";

  if (state.messages.length === 0) {
    renderStatus("No messages found matching your active filter options.");
    return;
  }

  state.messages.forEach((msg) => {
    const li = document.createElement("li");
    li.className = "message-item";

    li.innerHTML = `
      <span class="msg-text">${msg.text}</span>
      <div class="action-buttons">
        <button class="edit-btn" data-id="${msg.id}" aria-label="Edit" title="Edit">✏️</button>
        <button class="delete-btn" data-id="${msg.id}" aria-label="Delete" title="Delete">🗑️</button>
      </div>
    `;
    messageList.appendChild(li);
  });

  messageList.querySelectorAll(".edit-btn").forEach((btn) => {
    const button = btn as HTMLButtonElement;
    button.addEventListener("click", () => handleEdit(button.dataset.id || ""));
  });

  messageList.querySelectorAll(".delete-btn").forEach((btn) => {
    const button = btn as HTMLButtonElement;
    button.addEventListener("click", () =>
      handleDelete(button.dataset.id || ""),
    );
  });
}

function renderPaginationControls() {
  if (!pageIndicator || !prevPageBtn || !nextPageBtn) return;

  pageIndicator.textContent = `Page ${state.meta.currentPage} of ${state.meta.totalPages || 1} (Total: ${state.meta.totalRecords} logs)`;

  prevPageBtn.disabled = state.meta.currentPage <= 1;
  nextPageBtn.disabled = state.meta.currentPage >= state.meta.totalPages;
}

filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  state.filters.search = searchInput.value.trim();
  state.filters.category = (categoryFilter.value || undefined) as any;
  state.filters.minPriority = priorityFilter.value
    ? Number(priorityFilter.value)
    : undefined;
  state.filters.sortBy = sortBySelect.value as any;
  state.filters.order = sortOrderSelect.value as any;

  state.meta.currentPage = 1;
  loadMessages();
});

prevPageBtn?.addEventListener("click", () => {
  if (state.meta.currentPage > 1) {
    state.meta.currentPage--;
    loadMessages();
  }
});

nextPageBtn?.addEventListener("click", () => {
  if (state.meta.currentPage < state.meta.totalPages) {
    state.meta.currentPage++;
    loadMessages();
  }
});

async function handleCreateMessage(e: SubmitEvent) {
  e.preventDefault();
  const text = newMessageInput.value.trim();
  if (!text) return;

  const tempId = `temp-${Date.now()}`;
  const optimisticMessage: Message = {
    id: tempId,
    text: text,
    category: "user",
    isRead: false,
    priority: 1,
    createdAt: new Date().toISOString(),
  };

  state.messages = [optimisticMessage, ...state.messages];
  renderMessages();
  newMessageInput.value = "";

  try {
    const savedMessage = await api.createMessage(text);

    state.messages = state.messages.map((m: Message) =>
      m.id === tempId ? savedMessage : m,
    );
  } catch (error) {
    console.error("Creation error:", error);
    state.messages = state.messages.filter((m: Message) => m.id !== tempId);
    renderStatus("Failed to save message. Please try again.", true);
  } finally {
    renderMessages();
  }
}

async function handleDelete(id: string) {
  if (
    !id ||
    !confirm("Are you sure you want to permanently delete this log record?")
  )
    return;

  const previousMessages = [...state.messages];

  state.messages = state.messages.filter((m) => m.id !== id);
  renderMessages();
  renderStatus("Removing record...");

  try {
    await api.deleteMessage(id);

    state.meta.totalRecords -= 1;
    renderStatus("");
    renderPaginationControls();
  } catch (error) {
    console.error("Deletion failed, rolling back:", error);
    state.messages = previousMessages;
    renderMessages();
    renderStatus(
      "Failed to delete message. Please check your connection.",
      true,
    );
  }
}

function handleEdit(id: string) {
  if (!id) return;
  const msg = state.messages.find((m) => String(m.id) === id);
  if (!msg) return;

  currentlyEditingId = id;
  editMessageInput.value = msg.text;
  editDialog.showModal();
}

editDialogForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentlyEditingId) return;

  const newText = editMessageInput.value.trim();
  if (!newText) return;

  const targetId = currentlyEditingId;
  editDialog.close();

  renderStatus("Saving updated descriptions...");
  try {
    await api.updateMessage(targetId, newText);
    loadMessages();
  } catch (error) {
    console.error("Mutation update anomaly captured:", error);
    renderStatus("Failed to persist changes into data context.", true);
  } finally {
    currentlyEditingId = null;
  }
});

cancelEditBtn?.addEventListener("click", () => {
  editDialog.close();
  currentlyEditingId = null;
});

messageForm?.addEventListener("submit", handleCreateMessage);

loadMessages();
