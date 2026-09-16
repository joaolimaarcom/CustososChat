(() => {
  const ROOM_PREFIX = "custosochat-";

  const nameInput = document.getElementById("name-input");
  const tabCreate = document.getElementById("tab-create");
  const tabJoin = document.getElementById("tab-join");
  const panelCreate = document.getElementById("panel-create");
  const panelJoin = document.getElementById("panel-join");

  const createBtn = document.getElementById("create-btn");
  const roomCodeBox = document.getElementById("room-code-box");
  const roomCodeDisplay = document.getElementById("room-code-display");
  const copyCodeBtn = document.getElementById("copy-code-btn");
  const createStatus = document.getElementById("create-status");

  const joinCodeInput = document.getElementById("join-code-input");
  const joinBtn = document.getElementById("join-btn");
  const joinStatus = document.getElementById("join-status");

  const setupScreen = document.getElementById("setup-screen");
  const chatScreen = document.getElementById("chat-screen");
  const roomTitle = document.getElementById("room-title");
  const connectionStatus = document.getElementById("connection-status");
  const messagesEl = document.getElementById("messages");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const leaveBtn = document.getElementById("leave-btn");

  let peer = null;
  let conn = null;
  let myName = localStorage.getItem("custosochat-name") || "";
  let roomCode = "";

  nameInput.value = myName;

  // ---- Tabs ----
  tabCreate.addEventListener("click", () => switchTab("create"));
  tabJoin.addEventListener("click", () => switchTab("join"));

  function switchTab(which) {
    const isCreate = which === "create";
    tabCreate.classList.toggle("active", isCreate);
    tabJoin.classList.toggle("active", !isCreate);
    panelCreate.classList.toggle("hidden", !isCreate);
    panelJoin.classList.toggle("hidden", isCreate);
  }

  function getName() {
    const value = nameInput.value.trim();
    return value || "Anônimo";
  }

  function saveName() {
    localStorage.setItem("custosochat-name", getName());
  }

  function randomCode() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // ---- Create room ----
  createBtn.addEventListener("click", () => {
    saveName();
    createBtn.disabled = true;
    createStatus.textContent = "Gerando sala...";
    startAsHost();
  });

  function startAsHost(attempt = 0) {
    const code = randomCode();
    const peerId = ROOM_PREFIX + code;
    const p = new Peer(peerId, { debug: 0 });

    p.on("open", () => {
      peer = p;
      roomCode = code;
      roomCodeDisplay.textContent = code;
      roomCodeBox.classList.remove("hidden");
      createStatus.textContent = "Aguardando seu amigo entrar...";

      p.on("connection", (incomingConn) => {
        conn = incomingConn;
        setupConnection(code);
      });
    });

    p.on("error", (err) => {
      if (err.type === "unavailable-id" && attempt < 5) {
        p.destroy();
        startAsHost(attempt + 1);
        return;
      }
      createStatus.textContent = "Não foi possível criar a sala. Tente novamente.";
      createBtn.disabled = false;
    });
  }

  copyCodeBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      copyCodeBtn.textContent = "Copiado!";
      setTimeout(() => (copyCodeBtn.textContent = "Copiar"), 1500);
    } catch (e) {
      // clipboard API unavailable — user can select the text manually
    }
  });

  // ---- Join room ----
  joinBtn.addEventListener("click", () => {
    const code = joinCodeInput.value.trim().toLowerCase();
    if (!code) {
      joinStatus.textContent = "Digite o código da sala.";
      return;
    }
    saveName();
    joinBtn.disabled = true;
    joinStatus.textContent = "Conectando...";

    const p = new Peer(undefined, { debug: 0 });

    p.on("open", () => {
      peer = p;
      const outgoingConn = p.connect(ROOM_PREFIX + code, { reliable: true });
      conn = outgoingConn;

      conn.on("open", () => {
        setupConnection(code);
      });

      conn.on("error", () => {
        joinStatus.textContent = "Sala não encontrada. Confira o código.";
        joinBtn.disabled = false;
      });
    });

    p.on("error", (err) => {
      joinStatus.textContent = "Não foi possível conectar. Tente novamente.";
      joinBtn.disabled = false;
    });
  });

  // ---- Shared connection setup ----
  function setupConnection(code) {
    roomCode = code;
    setupScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    roomTitle.textContent = "Sala: " + code;
    setOnline(true);
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
    addSystemMessage("Conectado! Diga oi 👋");

    conn.on("data", (data) => {
      if (data && data.type === "message") {
        addBubble(data.name, data.text, false);
      }
    });

    conn.on("close", () => {
      setOnline(false);
      addSystemMessage("Seu amigo saiu da sala.");
    });

    conn.on("error", () => {
      setOnline(false);
      addSystemMessage("A conexão caiu.");
    });
  }

  function setOnline(isOnline) {
    connectionStatus.textContent = isOnline ? "conectado" : "desconectado";
    connectionStatus.classList.toggle("online", isOnline);
    connectionStatus.classList.toggle("offline", !isOnline);
    messageInput.disabled = !isOnline;
    sendBtn.disabled = !isOnline;
  }

  // ---- Sending messages ----
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !conn || !conn.open) return;

    conn.send({ type: "message", name: getName(), text });
    addBubble(getName(), text, true);
    messageInput.value = "";
  });

  function addBubble(name, text, isMe) {
    const row = document.createElement("div");
    row.className = "bubble-row " + (isMe ? "me" : "other");

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const textEl = document.createElement("div");
    textEl.textContent = isMe ? text : `${name}: ${text}`;
    bubble.appendChild(textEl);

    const time = document.createElement("span");
    time.className = "bubble-time";
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    bubble.appendChild(time);

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addSystemMessage(text) {
    const el = document.createElement("div");
    el.className = "system-message";
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ---- Leave room ----
  leaveBtn.addEventListener("click", () => {
    if (confirm("Sair da sala?")) {
      window.location.reload();
    }
  });
})();
