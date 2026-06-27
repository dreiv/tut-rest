import "./style.css";

interface Message {
  id: string;
  text: string;
}

const messageList = document.getElementById("message-list") as HTMLUListElement;
const statusContainer = document.getElementById(
  "status-container",
) as HTMLDivElement;

function renderStatus(message: string, isError = false) {
  if (!statusContainer) return;
  statusContainer.innerHTML = message
    ? `<p class="${isError ? "error-state" : "loading-state"}">${message}</p>`
    : "";
}

async function fetchAndRenderMessages() {
  if (messageList) messageList.innerHTML = "";
  renderStatus("Loading messages...");

  try {
    const response = await fetch("/api/messages");

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const messages: Message[] = await response.json();

    renderStatus("");

    if (messages.length === 0) {
      renderStatus("No messages available. Add some via your API!");
      return;
    }

    messages.forEach((msg) => {
      const li = document.createElement("li");
      li.className = "message-item";
      li.innerHTML = `
        <span class="msg-text">${msg.text}</span>
        <small class="msg-id">ID: ${msg.id}</small>
      `;
      messageList.appendChild(li);
    });
  } catch (error) {
    console.error("Fetch error:", error);
    renderStatus(
      "Failed to load messages. Please ensure the backend server is running.",
      true,
    );
  }
}

fetchAndRenderMessages();
