(() => {
  const ROOM_PREFIX = "custosochat-";
  const MAX_RECORDING_MS = 120000;
  const MAX_GIF_BYTES = 6 * 1024 * 1024;

  const EMOJIS = [
    "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😜", "🤔", "😎",
    "😢", "😭", "😡", "😱", "🥳", "🤩", "😴", "🤗", "🙄", "😇",
    "👍", "👎", "👏", "🙌", "🙏", "💪", "👋", "✌️", "🤝", "❤️",
    "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💯", "🔥", "✨",
    "🎉", "🎂", "🍕", "🍔", "☕", "🍺", "⚽", "🏆", "🎮", "📸",
    "🎵", "🌟", "🌈", "☀️", "🌙", "🐶", "🐱", "🚀"
  ];

  const STICKERS = [
    "😂", "🔥", "❤️", "👍", "🎉", "😍", "😢", "😡",
    "🤔", "🙌", "🥳", "😎", "🤝", "👏", "🙏", "💯",
    "✨", "🎂", "🍕", "🏆", "🌟", "💤", "🤯", "😴"
  ];

  const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const FESTIVE_STICKERS = ["🎉", "🥳", "🎊"];
  const CONFETTI_COLORS = ["#6366f1", "#a855f7", "#f43f5e", "#f59e0b", "#10b981", "#0ea5e9"];
  const CONFETTI_KEYWORDS = ["parabens", "feliz aniversario", "aniversario"];
  const HEARTS_KEYWORDS = ["te amo", "amo voce", "amo vc"];
  const STREAK_STORAGE = "custosochat-streak";
  const NOTIF_STORAGE = "custosochat-notif";

  // ---- DOM refs ----
  const nameInput = document.getElementById("name-input");
  const avatarPickBtn = document.getElementById("avatar-pick-btn");
  const avatarInput = document.getElementById("avatar-input");
  const avatarPreviewImg = document.getElementById("avatar-preview-img");
  const avatarPlaceholder = document.getElementById("avatar-placeholder");

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
  const peerNameEl = document.getElementById("peer-name");
  const peerAvatarImg = document.getElementById("peer-avatar-img");
  const connectionStatus = document.getElementById("connection-status");
  const typingIndicator = document.getElementById("typing-indicator");
  const confettiLayer = document.getElementById("confetti-layer");
  const messagesEl = document.getElementById("messages");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const leaveBtn = document.getElementById("leave-btn");

  const streakBadge = document.getElementById("streak-badge");
  const notifToggleBtn = document.getElementById("notif-toggle-btn");

  const myAvatarBtn = document.getElementById("my-avatar-btn");
  const myAvatarImg = document.getElementById("my-avatar-img");
  const profileEditPanel = document.getElementById("profile-edit-panel");
  const editAvatarPickBtn = document.getElementById("edit-avatar-pick-btn");
  const editAvatarInput = document.getElementById("edit-avatar-input");
  const editAvatarPreviewImg = document.getElementById("edit-avatar-preview-img");
  const editAvatarPlaceholder = document.getElementById("edit-avatar-placeholder");
  const editNameInput = document.getElementById("edit-name-input");
  const editCancelBtn = document.getElementById("edit-cancel-btn");
  const editSaveBtn = document.getElementById("edit-save-btn");

  const emojiToggleBtn = document.getElementById("emoji-toggle-btn");
  const stickerToggleBtn = document.getElementById("sticker-toggle-btn");
  const emojiPanel = document.getElementById("emoji-panel");
  const stickerPanel = document.getElementById("sticker-panel");

  const gameToggleBtn = document.getElementById("game-toggle-btn");
  const gameModal = document.getElementById("game-modal");
  const gameCloseBtn = document.getElementById("game-close-btn");
  const gameRestartBtn = document.getElementById("game-restart-btn");
  const gameStatus = document.getElementById("game-status");
  const gameBoard = document.getElementById("game-board");

  const imageBtn = document.getElementById("image-btn");
  const imageInput = document.getElementById("image-input");

  const micBtn = document.getElementById("mic-btn");
  const recordingIndicator = document.getElementById("recording-indicator");
  const recordingTimerEl = document.getElementById("recording-timer");
  const recordingCancelBtn = document.getElementById("recording-cancel-btn");

  const editingBar = document.getElementById("editing-bar");
  const editingCancelBtn = document.getElementById("editing-cancel-btn");

  let peer = null;
  let conn = null;
  let roomCode = "";
  let amHost = false;
  let peerProfile = null;
  let game = null;
  let pendingMediaMeta = null;
  let pendingAvatarDataUrl = null;
  let editPendingAvatarDataUrl = null;
  let editingMessageId = null;
  let currentActionBar = null;
  let typingHideTimeout = null;
  let lastTypingSentAt = 0;
  let notifEnabled = localStorage.getItem(NOTIF_STORAGE) !== "off";

  const messageRegistry = new Map();

  const myProfile = {
    name: localStorage.getItem("custosochat-name") || "",
    avatar: localStorage.getItem("custosochat-avatar") || ""
  };

  nameInput.value = myProfile.name;
  if (myProfile.avatar) showAvatarPreview(avatarPreviewImg, avatarPlaceholder, myProfile.avatar);

  buildPickerPanel(emojiPanel, EMOJIS, (emoji) => insertAtCursor(messageInput, emoji));
  buildPickerPanel(stickerPanel, STICKERS, (sticker) => {
    sendSticker(sticker);
    stickerPanel.classList.add("hidden");
  });
  stickerPanel.classList.add("stickers");

  updateNotifBtn();
  notifToggleBtn.addEventListener("click", () => {
    notifEnabled = !notifEnabled;
    localStorage.setItem(NOTIF_STORAGE, notifEnabled ? "on" : "off");
    if (notifEnabled && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    updateNotifBtn();
  });

  function updateNotifBtn() {
    notifToggleBtn.textContent = notifEnabled ? "🔔" : "🔕";
    notifToggleBtn.title = notifEnabled
      ? "Notificações ativadas (clique pra silenciar)"
      : "Notificações silenciadas (clique pra ativar)";
  }

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // ---- Avatar helpers ----

  function showAvatarPreview(imgEl, placeholderEl, dataUrl) {
    imgEl.src = dataUrl;
    imgEl.classList.remove("hidden");
    placeholderEl.classList.add("hidden");
  }

  function resizeImageToAvatar(file, size = 128, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          const srcSize = Math.min(img.width, img.height);
          const sx = (img.width - srcSize) / 2;
          const sy = (img.height - srcSize) / 2;
          ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resizeImageForChat(file, maxDim = 1280, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round(height * (maxDim / width));
              width = maxDim;
            } else {
              width = Math.round(width * (maxDim / height));
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("toBlob failed"));
            const buffer = await blob.arrayBuffer();
            resolve({ buffer, mime: blob.type || "image/jpeg" });
          }, "image/jpeg", quality);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function generateInitialsAvatar(name, size = 128) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const colors = ["#4f46e5", "#0ea5e9", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#db2777", "#0891b2"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.round(size * 0.45)}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initial = (name.trim()[0] || "?").toUpperCase();
    ctx.fillText(initial, size / 2, size / 2 + size * 0.03);
    return canvas.toDataURL("image/png");
  }

  avatarPickBtn.addEventListener("click", () => avatarInput.click());
  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (!file) return;
    try {
      pendingAvatarDataUrl = await resizeImageToAvatar(file);
      showAvatarPreview(avatarPreviewImg, avatarPlaceholder, pendingAvatarDataUrl);
    } catch (e) {
      // ignore invalid image
    }
  });

  function saveProfile() {
    myProfile.name = nameInput.value.trim() || "Anônimo";
    if (pendingAvatarDataUrl) {
      myProfile.avatar = pendingAvatarDataUrl;
    } else if (!myProfile.avatar) {
      myProfile.avatar = generateInitialsAvatar(myProfile.name);
    }
    localStorage.setItem("custosochat-name", myProfile.name);
    localStorage.setItem("custosochat-avatar", myProfile.avatar);
    myAvatarImg.src = myProfile.avatar;
  }

  // ---- Profile edit popover (from chat screen) ----

  myAvatarBtn.addEventListener("click", () => {
    editNameInput.value = myProfile.name;
    editPendingAvatarDataUrl = null;
    if (myProfile.avatar) {
      showAvatarPreview(editAvatarPreviewImg, editAvatarPlaceholder, myProfile.avatar);
    } else {
      editAvatarPreviewImg.classList.add("hidden");
      editAvatarPlaceholder.classList.remove("hidden");
    }
    profileEditPanel.classList.remove("hidden");
  });

  editCancelBtn.addEventListener("click", () => profileEditPanel.classList.add("hidden"));

  editAvatarPickBtn.addEventListener("click", () => editAvatarInput.click());
  editAvatarInput.addEventListener("change", async () => {
    const file = editAvatarInput.files[0];
    if (!file) return;
    try {
      editPendingAvatarDataUrl = await resizeImageToAvatar(file);
      showAvatarPreview(editAvatarPreviewImg, editAvatarPlaceholder, editPendingAvatarDataUrl);
    } catch (e) {
      // ignore invalid image
    }
  });

  editSaveBtn.addEventListener("click", () => {
    myProfile.name = editNameInput.value.trim() || myProfile.name;
    if (editPendingAvatarDataUrl) myProfile.avatar = editPendingAvatarDataUrl;
    localStorage.setItem("custosochat-name", myProfile.name);
    localStorage.setItem("custosochat-avatar", myProfile.avatar);
    myAvatarImg.src = myProfile.avatar;
    editPendingAvatarDataUrl = null;
    profileEditPanel.classList.add("hidden");
    if (conn && conn.open) {
      conn.send({ type: "profile", name: myProfile.name, avatar: myProfile.avatar });
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !profileEditPanel.classList.contains("hidden") &&
      !profileEditPanel.contains(e.target) &&
      e.target !== myAvatarBtn &&
      !myAvatarBtn.contains(e.target)
    ) {
      profileEditPanel.classList.add("hidden");
    }
    if (
      !emojiPanel.classList.contains("hidden") &&
      !emojiPanel.contains(e.target) &&
      e.target !== emojiToggleBtn
    ) {
      emojiPanel.classList.add("hidden");
    }
    if (
      !stickerPanel.classList.contains("hidden") &&
      !stickerPanel.contains(e.target) &&
      e.target !== stickerToggleBtn
    ) {
      stickerPanel.classList.add("hidden");
    }
    if (
      currentActionBar &&
      !currentActionBar.contains(e.target) &&
      !e.target.classList.contains("kebab-btn")
    ) {
      closeActionMenu();
    }
  });

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
    saveProfile();
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
      amHost = true;
      roomCode = code;
      roomCodeDisplay.textContent = code;
      roomCodeBox.classList.remove("hidden");
      createStatus.textContent = "Aguardando seu amigo entrar...";

      p.on("connection", (incomingConn) => {
        conn = incomingConn;
        wireConnectionEvents();
        conn.on("open", () => setupConnection(code));
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
    saveProfile();
    joinBtn.disabled = true;
    joinStatus.textContent = "Conectando...";

    const p = new Peer(undefined, { debug: 0 });

    p.on("open", () => {
      peer = p;
      conn = p.connect(ROOM_PREFIX + code, { reliable: true });
      wireConnectionEvents();
      conn.on("open", () => setupConnection(code));
    });

    p.on("error", () => {
      joinStatus.textContent = "Não foi possível conectar. Tente novamente.";
      joinBtn.disabled = false;
    });
  });

  // ---- Shared connection setup ----
  function wireConnectionEvents() {
    conn.on("data", handleIncomingData);
    conn.on("close", () => {
      setOnline(false);
      addSystemMessage("Seu amigo saiu da sala.");
    });
    conn.on("error", () => {
      if (chatScreen.classList.contains("hidden")) {
        joinStatus.textContent = "Sala não encontrada. Confira o código.";
        joinBtn.disabled = false;
      } else {
        setOnline(false);
        addSystemMessage("A conexão caiu.");
      }
    });
  }

  function setupConnection(code) {
    roomCode = code;
    setupScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    peerNameEl.textContent = "Sala: " + code;
    myAvatarImg.src = myProfile.avatar;
    setOnline(true);
    messageInput.focus();
    addSystemMessage("Conectado! Diga oi 👋");
    conn.send({ type: "profile", name: myProfile.name, avatar: myProfile.avatar });
    updateStreakBadge();
  }

  function setOnline(online) {
    connectionStatus.textContent = online ? "conectado" : "desconectado";
    connectionStatus.classList.toggle("online", online);
    connectionStatus.classList.toggle("offline", !online);
    if (!online) {
      clearTimeout(typingHideTimeout);
      typingIndicator.classList.add("hidden");
    }
    [messageInput, sendBtn, emojiToggleBtn, stickerToggleBtn, gameToggleBtn, imageBtn, micBtn].forEach((el) => {
      el.disabled = !online;
    });
    if (!online) {
      gameModal.classList.add("hidden");
    }
  }

  // ---- Incoming data ----
  function handleIncomingData(data) {
    if (pendingMediaMeta) {
      const meta = pendingMediaMeta;
      pendingMediaMeta = null;
      const blob = new Blob([data], { type: meta.mime });
      const url = URL.createObjectURL(blob);
      if (meta.kind === "image") {
        addImageBubble(meta.id, peerProfile, url, false, meta.ts);
        notifyIncoming("enviou uma foto");
      } else {
        addAudioBubble(meta.id, peerProfile, url, false, meta.ts);
        notifyIncoming("enviou um áudio");
      }
      const entry = messageRegistry.get(meta.id);
      if (entry) entry.mediaUrl = url;
      return;
    }

    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case "profile":
        peerProfile = { name: data.name, avatar: data.avatar };
        peerNameEl.textContent = peerProfile.name;
        peerAvatarImg.src = peerProfile.avatar || generateInitialsAvatar(peerProfile.name);
        break;
      case "message":
        addTextBubble(data.id, peerProfile, data.text, false, data.ts);
        checkMessageEffects(data.text);
        notifyIncoming(data.text);
        break;
      case "sticker":
        addStickerBubble(data.id, peerProfile, data.sticker, false, data.ts);
        if (FESTIVE_STICKERS.includes(data.sticker)) triggerConfetti();
        notifyIncoming("enviou uma figurinha " + data.sticker);
        break;
      case "edit":
        applyEdit(data.id, data.text);
        break;
      case "delete":
        markDeleted(data.id);
        break;
      case "reaction":
        {
          const entry = messageRegistry.get(data.id);
          if (entry) {
            entry.reactions.peer = data.emoji;
            renderReactionBadge(entry);
          }
        }
        break;
      case "typing":
        showTypingIndicator();
        break;
      case "media-meta":
        pendingMediaMeta = data;
        break;
      case "game-start":
        startGame(false);
        break;
      case "game-move":
        playMove(data.index, false);
        break;
    }
  }

  function showTypingIndicator() {
    typingIndicator.classList.remove("hidden");
    clearTimeout(typingHideTimeout);
    typingHideTimeout = setTimeout(() => {
      typingIndicator.classList.add("hidden");
    }, 2500);
  }

  messageInput.addEventListener("input", () => {
    if (!conn || !conn.open) return;
    const now = Date.now();
    if (now - lastTypingSentAt > 1500) {
      lastTypingSentAt = now;
      conn.send({ type: "typing" });
    }
  });

  // ---- Sending / editing text ----
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !conn || !conn.open) return;

    if (editingMessageId) {
      const id = editingMessageId;
      conn.send({ type: "edit", id, text });
      applyEdit(id, text);
      cancelEditing();
      return;
    }

    const id = uid();
    const ts = Date.now();
    conn.send({ type: "message", id, text, ts });
    addTextBubble(id, myProfile, text, true, ts);
    checkMessageEffects(text);
    messageInput.value = "";
  });

  function startEditing(id) {
    const entry = messageRegistry.get(id);
    if (!entry || entry.type !== "text" || entry.deleted) return;
    editingMessageId = id;
    messageInput.value = entry.text;
    messageInput.focus();
    editingBar.classList.remove("hidden");
    closeActionMenu();
  }

  function cancelEditing() {
    editingMessageId = null;
    messageInput.value = "";
    editingBar.classList.add("hidden");
  }

  editingCancelBtn.addEventListener("click", cancelEditing);

  function applyEdit(id, newText) {
    const entry = messageRegistry.get(id);
    if (!entry || entry.type !== "text" || entry.deleted) return;
    entry.text = newText;
    entry.mainSpan.textContent = newText;
    if (!entry.editedTag) {
      const tag = document.createElement("span");
      tag.className = "edited-tag";
      tag.textContent = " (editado)";
      entry.textEl.appendChild(tag);
      entry.editedTag = tag;
    }
  }

  // ---- Deleting messages ----
  function markDeleted(id) {
    const entry = messageRegistry.get(id);
    if (!entry || entry.deleted) return;
    entry.deleted = true;
    if (entry.mediaUrl) {
      URL.revokeObjectURL(entry.mediaUrl);
      entry.mediaUrl = null;
    }
    entry.row.classList.remove("sticker-row");
    entry.bubbleEl.innerHTML = "";
    entry.bubbleEl.classList.add("deleted-bubble");
    entry.reactionBadge = null;
    const placeholder = document.createElement("div");
    placeholder.className = "deleted-placeholder";
    placeholder.textContent = "Mensagem apagada";
    entry.bubbleEl.appendChild(placeholder);
    const kebab = entry.row.querySelector(".kebab-btn");
    if (kebab) kebab.remove();
  }

  function deleteForEveryone(id) {
    if (conn && conn.open) conn.send({ type: "delete", id });
    markDeleted(id);
    closeActionMenu();
  }

  function deleteForMe(id) {
    const entry = messageRegistry.get(id);
    if (!entry) return;
    if (entry.mediaUrl) URL.revokeObjectURL(entry.mediaUrl);
    entry.row.remove();
    messageRegistry.delete(id);
    closeActionMenu();
  }

  // ---- Reactions ----
  function toggleReaction(id, emoji) {
    const entry = messageRegistry.get(id);
    if (!entry || entry.deleted) return;
    entry.reactions.mine = entry.reactions.mine === emoji ? null : emoji;
    if (conn && conn.open) conn.send({ type: "reaction", id, emoji: entry.reactions.mine });
    renderReactionBadge(entry);
  }

  function renderReactionBadge(entry) {
    const unique = [...new Set([entry.reactions.mine, entry.reactions.peer].filter(Boolean))];
    if (unique.length === 0) {
      if (entry.reactionBadge) {
        entry.reactionBadge.remove();
        entry.reactionBadge = null;
      }
      return;
    }
    if (!entry.reactionBadge) {
      entry.reactionBadge = document.createElement("div");
      entry.reactionBadge.className = "reaction-badge";
      entry.bubbleEl.appendChild(entry.reactionBadge);
    }
    entry.reactionBadge.textContent = unique.join("");
  }

  // ---- Per-message action menu ----
  function closeActionMenu() {
    if (currentActionBar) {
      currentActionBar.remove();
      currentActionBar = null;
    }
  }

  function mkActionBtn(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function openActionMenu(row, id, type, isMe) {
    const entry = messageRegistry.get(id);
    if (!entry || entry.deleted) return;
    if (currentActionBar && currentActionBar.dataset.forId === id) {
      closeActionMenu();
      return;
    }
    closeActionMenu();

    const bar = document.createElement("div");
    bar.className = "msg-actions " + (isMe ? "me" : "other");
    bar.dataset.forId = id;

    bar.appendChild(mkActionBtn("😀 Reagir", () => openReactionPicker(row, id, isMe)));
    if (isMe && type === "text") {
      bar.appendChild(mkActionBtn("Editar", () => startEditing(id)));
    }
    bar.appendChild(
      mkActionBtn(isMe ? "Apagar" : "Apagar para mim", () => {
        if (isMe) deleteForEveryone(id);
        else deleteForMe(id);
      })
    );

    row.after(bar);
    currentActionBar = bar;
  }

  function openReactionPicker(row, id, isMe) {
    closeActionMenu();
    const bar = document.createElement("div");
    bar.className = "msg-actions reaction-picker " + (isMe ? "me" : "other");
    bar.dataset.forId = id;
    REACTIONS.forEach((emoji) => {
      bar.appendChild(
        mkActionBtn(emoji, () => {
          toggleReaction(id, emoji);
          closeActionMenu();
        })
      );
    });
    row.after(bar);
    currentActionBar = bar;
  }

  // ---- Emoji / sticker panels ----
  function buildPickerPanel(panelEl, items, onPick) {
    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item;
      btn.addEventListener("click", () => onPick(item));
      panelEl.appendChild(btn);
    });
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const pos = start + text.length;
    input.setSelectionRange(pos, pos);
    input.focus();
  }

  emojiToggleBtn.addEventListener("click", () => {
    stickerPanel.classList.add("hidden");
    emojiPanel.classList.toggle("hidden");
  });
  stickerToggleBtn.addEventListener("click", () => {
    emojiPanel.classList.add("hidden");
    stickerPanel.classList.toggle("hidden");
  });

  function sendSticker(sticker) {
    if (!conn || !conn.open) return;
    const id = uid();
    const ts = Date.now();
    conn.send({ type: "sticker", id, sticker, ts });
    addStickerBubble(id, myProfile, sticker, true, ts);
    if (FESTIVE_STICKERS.includes(sticker)) triggerConfetti();
  }

  // ---- Confetti ----
  function triggerConfetti() {
    const count = 40;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.animationDuration = (1.8 + Math.random() * 1.2) + "s";
      piece.style.animationDelay = (Math.random() * 0.3) + "s";
      piece.style.animationName = "confetti-fall";
      confettiLayer.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  function triggerHearts() {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "heart-piece";
      piece.textContent = "❤️";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.fontSize = 16 + Math.random() * 16 + "px";
      piece.style.animationDuration = (2 + Math.random() * 1.5) + "s";
      piece.style.animationDelay = (Math.random() * 0.4) + "s";
      confettiLayer.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function checkMessageEffects(text) {
    const normalized = normalizeText(text);
    if (CONFETTI_KEYWORDS.some((k) => normalized.includes(k))) {
      triggerConfetti();
    } else if (HEARTS_KEYWORDS.some((k) => normalized.includes(k))) {
      triggerHearts();
    }
  }

  // ---- Streak ----
  function bumpStreak() {
    const today = new Date().toISOString().slice(0, 10);
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STREAK_STORAGE)) || {};
    } catch (e) {
      data = {};
    }
    if (data.lastActiveDate === today) {
      return data.streak || 1;
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.streak = data.lastActiveDate === yesterday ? (data.streak || 1) + 1 : 1;
    data.lastActiveDate = today;
    localStorage.setItem(STREAK_STORAGE, JSON.stringify(data));
    return data.streak;
  }

  function updateStreakBadge() {
    const streak = bumpStreak();
    if (streak > 1) {
      streakBadge.textContent = "🔥 " + streak;
      streakBadge.title = "Vocês trocaram mensagem em " + streak + " dias seguidos";
      streakBadge.classList.remove("hidden");
    } else {
      streakBadge.classList.add("hidden");
    }
  }

  // ---- Notifications ----
  function playPing() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      osc.onended = () => ctx.close();
    } catch (e) {
      // Web Audio unavailable — skip the sound
    }
  }

  function showBrowserNotification(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const n = new Notification(title, { body, icon: peerProfile ? peerProfile.avatar : undefined });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      // Notification constructor unsupported in this context — skip
    }
  }

  function notifyIncoming(preview) {
    if (!notifEnabled) return;
    playPing();
    if (document.hidden || !document.hasFocus()) {
      showBrowserNotification(peerProfile ? peerProfile.name : "Nova mensagem", preview);
    }
  }

  // ---- Jogo da velha (tic-tac-toe) ----
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const gameCells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "game-cell";
    cell.addEventListener("click", () => onCellClick(i));
    gameBoard.appendChild(cell);
    gameCells.push(cell);
  }

  function checkWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every((c) => c) ? "draw" : null;
  }

  function startGame(sendToPeer) {
    game = {
      board: Array(9).fill(null),
      mySymbol: amHost ? "X" : "O",
      turn: "X"
    };
    gameModal.classList.remove("hidden");
    renderGame();
    if (sendToPeer && conn && conn.open) conn.send({ type: "game-start" });
  }

  function onCellClick(index) {
    if (!game || game.turn !== game.mySymbol) return;
    playMove(index, true);
  }

  function playMove(index, sendToPeer) {
    if (!game || game.board[index]) return;
    game.board[index] = game.turn;
    game.turn = game.turn === "X" ? "O" : "X";
    renderGame();
    if (sendToPeer && conn && conn.open) conn.send({ type: "game-move", index });
  }

  function renderGame() {
    const winner = checkWinner(game.board);
    gameCells.forEach((cell, i) => {
      cell.textContent = game.board[i] || "";
      cell.disabled = !!game.board[i] || !!winner || game.turn !== game.mySymbol;
    });
    const peerLabel = peerProfile ? peerProfile.name : "Seu amigo";
    if (winner === "draw") {
      gameStatus.textContent = "Empate!";
    } else if (winner) {
      if (winner === game.mySymbol) {
        gameStatus.textContent = "Você venceu! 🎉";
        triggerConfetti();
      } else {
        gameStatus.textContent = peerLabel + " venceu!";
      }
    } else {
      gameStatus.textContent = game.turn === game.mySymbol ? "Sua vez" : peerLabel + " está jogando...";
    }
  }

  gameToggleBtn.addEventListener("click", () => startGame(true));
  gameRestartBtn.addEventListener("click", () => startGame(true));
  gameCloseBtn.addEventListener("click", () => gameModal.classList.add("hidden"));

  // ---- Images (photos and GIFs picked from the device) ----
  imageBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];
    imageInput.value = "";
    if (!file || !conn || !conn.open) return;
    try {
      let buffer;
      let mime;
      if (file.type === "image/gif") {
        if (file.size > MAX_GIF_BYTES) {
          addSystemMessage("Esse GIF é muito grande (máximo 6 MB).");
          return;
        }
        buffer = await file.arrayBuffer();
        mime = "image/gif";
      } else {
        const resized = await resizeImageForChat(file);
        buffer = resized.buffer;
        mime = resized.mime;
      }
      const id = uid();
      const ts = Date.now();
      sendMedia("image", id, buffer, mime, ts);
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      addImageBubble(id, myProfile, url, true, ts);
      messageRegistry.get(id).mediaUrl = url;
    } catch (e) {
      addSystemMessage("Não foi possível enviar a imagem.");
    }
  });

  function sendMedia(kind, id, buffer, mime, ts) {
    if (!conn || !conn.open) return;
    conn.send({ type: "media-meta", kind, id, mime, ts });
    conn.send(buffer);
  }

  // ---- Audio recording ----
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStream = null;
  let recordingStartTime = 0;
  let recordingTimerInterval = null;
  let autoStopTimeout = null;
  let shouldSendRecording = true;

  micBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording(true);
    } else {
      startRecording();
    }
  });

  recordingCancelBtn.addEventListener("click", () => stopRecording(false));

  async function startRecording() {
    if (!conn || !conn.open) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      addSystemMessage("Não foi possível acessar o microfone.");
      return;
    }
    recordingStream = stream;
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    const mimeType = candidates.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
    recordedChunks = [];
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    });
    mediaRecorder.addEventListener("stop", onRecordingStop);
    mediaRecorder.start();
    recordingStartTime = Date.now();
    micBtn.classList.add("recording");
    micBtn.textContent = "⏹";
    recordingIndicator.classList.remove("hidden");
    recordingTimerInterval = setInterval(updateRecordingTimer, 250);
    autoStopTimeout = setTimeout(() => stopRecording(true), MAX_RECORDING_MS);
  }

  function updateRecordingTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = String(elapsed % 60).padStart(2, "0");
    recordingTimerEl.textContent = `${mins}:${secs}`;
  }

  function stopRecording(shouldSend) {
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;
    shouldSendRecording = shouldSend;
    mediaRecorder.stop();
  }

  async function onRecordingStop() {
    clearInterval(recordingTimerInterval);
    clearTimeout(autoStopTimeout);
    recordingIndicator.classList.add("hidden");
    micBtn.classList.remove("recording");
    micBtn.textContent = "🎤";
    recordingTimerEl.textContent = "0:00";

    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop());
      recordingStream = null;
    }

    if (shouldSendRecording && recordedChunks.length > 0 && conn && conn.open) {
      const mime = mediaRecorder.mimeType || "audio/webm";
      const blob = new Blob(recordedChunks, { type: mime });
      const buffer = await blob.arrayBuffer();
      const id = uid();
      const ts = Date.now();
      sendMedia("audio", id, buffer, mime, ts);
      const url = URL.createObjectURL(blob);
      addAudioBubble(id, myProfile, url, true, ts);
      messageRegistry.get(id).mediaUrl = url;
    }
    recordedChunks = [];
    mediaRecorder = null;
  }

  // ---- Rendering ----
  function renderRow(id, type, profile, isMe, bubbleEl) {
    const row = document.createElement("div");
    row.className = "bubble-row " + (isMe ? "me" : "other") + (type === "sticker" ? " sticker-row" : "");
    row.dataset.id = id;

    const avatar = document.createElement("img");
    avatar.className = "row-avatar";
    avatar.alt = "";
    avatar.src = (profile && profile.avatar) || generateInitialsAvatar((profile && profile.name) || "?");

    const kebab = document.createElement("button");
    kebab.type = "button";
    kebab.className = "kebab-btn";
    kebab.textContent = "⋯";
    kebab.title = "Opções";
    kebab.addEventListener("click", (e) => {
      e.stopPropagation();
      openActionMenu(row, id, type, isMe);
    });

    if (isMe) {
      row.appendChild(kebab);
      row.appendChild(bubbleEl);
      row.appendChild(avatar);
    } else {
      row.appendChild(avatar);
      row.appendChild(bubbleEl);
      row.appendChild(kebab);
    }

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    messageRegistry.set(id, {
      row,
      bubbleEl,
      type,
      isMe,
      profile,
      mediaUrl: null,
      deleted: false,
      reactions: { mine: null, peer: null },
      reactionBadge: null
    });
    return row;
  }

  function makeTimeEl(ts) {
    const time = document.createElement("span");
    time.className = "bubble-time";
    time.textContent = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return time;
  }

  function addTextBubble(id, profile, text, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const textEl = document.createElement("div");
    textEl.className = "bubble-text";
    const mainSpan = document.createElement("span");
    mainSpan.textContent = text;
    textEl.appendChild(mainSpan);
    bubble.appendChild(textEl);
    bubble.appendChild(makeTimeEl(ts));
    renderRow(id, "text", profile, isMe, bubble);
    const entry = messageRegistry.get(id);
    entry.text = text;
    entry.textEl = textEl;
    entry.mainSpan = mainSpan;
  }

  function addStickerBubble(id, profile, sticker, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const glyph = document.createElement("span");
    glyph.className = "sticker-glyph";
    glyph.textContent = sticker;
    bubble.appendChild(glyph);
    renderRow(id, "sticker", profile, isMe, bubble);
  }

  function addImageBubble(id, profile, url, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const img = document.createElement("img");
    img.className = "bubble-image";
    img.src = url;
    img.alt = "Imagem enviada";
    img.addEventListener("click", () => window.open(url, "_blank"));
    bubble.appendChild(img);
    bubble.appendChild(makeTimeEl(ts));
    renderRow(id, "image", profile, isMe, bubble);
  }

  function addAudioBubble(id, profile, url, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-audio";
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = url;
    bubble.appendChild(audio);
    bubble.appendChild(makeTimeEl(ts));
    renderRow(id, "audio", profile, isMe, bubble);
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
