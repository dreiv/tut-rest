import "./style.css";

interface Message {
  id: string;
  text: string;
}

// Existing DOM Elements
const messageList = document.getElementById("message-list") as HTMLUListElement;
const statusContainer = document.getElementById(
  "status-container",
) as HTMLDivElement;
const messageForm = document.getElementById("message-form") as HTMLFormElement;
const newMessageInput = document.getElementById(
  "new-message-text",
) as HTMLInputElement;

// New Dialog DOM Elements
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

let messages: Message[] = [];
let currentlyEditingId: string | null = null;

function renderStatus(message: string, isError = false) {
  if (!statusContainer) return;
  statusContainer.innerHTML = message
    ? `<p class="${isError ? "error-state" : "loading-state"}">${message}</p>`
    : "";
}

async function fetchMessages() {
  renderStatus("Loading messages...");
  try {
    const response = await fetch("/api/v1/messages");
    if (!response.ok)
      throw new Error(`Server responded with status: ${response.status}`);
    messages = await response.json();
    renderStatus("");
    renderMessages();
  } catch (error) {
    console.error("Fetch error:", error);
    renderStatus(
      "Failed to load messages. Please ensure the backend server is running.",
      true,
    );
  }
}

function renderMessages() {
  if (!messageList) return;
  messageList.innerHTML = "";

  if (messages.length === 0) {
    renderStatus("No messages available. Add some via your API!");
    return;
  }

  messages.forEach((msg) => {
    const li = document.createElement("li");
    li.className = "message-item";

    // Removed ID text and updated buttons to use emojis
    li.innerHTML = `
      <span class="msg-text">${msg.text}</span>
      <div class="action-buttons">
        <button class="edit-btn" data-id="${msg.id}" aria-label="Edit" title="Edit">✏️</button>
        <button class="delete-btn" data-id="${msg.id}" aria-label="Delete" title="Delete">🗑️</button>
      </div>
    `;
    messageList.appendChild(li);
  });

  // Attach event listeners to buttons
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

async function handleCreateMessage(e: SubmitEvent) {
  e.preventDefault();
  const text = newMessageInput.value;
  if (!text) return;

  renderStatus("Creating message...");
  try {
    const response = await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error("Failed to create message");

    const newMessage = await response.json();
    messages.push(newMessage);
    renderMessages();
    renderStatus("");
    newMessageInput.value = "";
  } catch (error) {
    console.error("Create error:", error);
    renderStatus("Failed to create message.", true);
  }
}

async function handleDelete(id: string) {
  if (!id) return;

  if (!confirm("Are you sure you want to delete this message?")) return;

  renderStatus("Deleting message...");
  try {
    const response = await fetch(`/api/v1/messages/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete message");

    messages = messages.filter((m) => String(m.id) !== id);
    renderMessages();
    renderStatus("");
  } catch (error) {
    console.error("Delete error:", error);
    renderStatus("Failed to delete message.", true);
  }
}

function handleEdit(id: string) {
  if (!id) return;

  const msg = messages.find((m) => String(m.id) === id);
  if (!msg) return;

  currentlyEditingId = id;
  editMessageInput.value = msg.text;
  editDialog.showModal(); // Safely triggers modal window overlay
}

// Event handler for submitting the Edit Modal
editDialogForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentlyEditingId) return;

  const newText = editMessageInput.value;
  if (!newText) return;

  const id = currentlyEditingId;
  editDialog.close();

  renderStatus("Updating message...");
  try {
    const response = await fetch(`/api/v1/messages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });

    if (!response.ok) throw new Error("Failed to update message");

    const updatedMsg = await response.json();

    // Maps list ensuring strict ID type evaluation doesn't break update
    messages = messages.map((m) => (String(m.id) === id ? updatedMsg : m));
    renderMessages();
    renderStatus("");
  } catch (error) {
    console.error("Update error:", error);
    renderStatus("Failed to update message.", true);
  } finally {
    currentlyEditingId = null;
  }
});

// Event handler for cancelling out of the Edit Modal
cancelEditBtn?.addEventListener("click", () => {
  editDialog.close();
  currentlyEditingId = null;
});

messageForm?.addEventListener("submit", handleCreateMessage);

fetchMessages();
