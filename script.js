(() => {
  const ROOM_PREFIX = "custosochat-";
  const MAX_RECORDING_MS = 120000;

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
  const messagesEl = document.getElementById("messages");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const leaveBtn = document.getElementById("leave-btn");

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

  const imageBtn = document.getElementById("image-btn");
  const imageInput = document.getElementById("image-input");

  const micBtn = document.getElementById("mic-btn");
  const recordingIndicator = document.getElementById("recording-indicator");
  const recordingTimerEl = document.getElementById("recording-timer");
  const recordingCancelBtn = document.getElementById("recording-cancel-btn");

  let peer = null;
  let conn = null;
  let roomCode = "";
  let peerProfile = null;
  let pendingMediaMeta = null;
  let pendingAvatarDataUrl = null;
  let editPendingAvatarDataUrl = null;

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
  }

  function setOnline(isOnline) {
    connectionStatus.textContent = isOnline ? "conectado" : "desconectado";
    connectionStatus.classList.toggle("online", isOnline);
    connectionStatus.classList.toggle("offline", !isOnline);
    [messageInput, sendBtn, emojiToggleBtn, stickerToggleBtn, imageBtn, micBtn].forEach((el) => {
      el.disabled = !isOnline;
    });
  }

  // ---- Incoming data ----
  function handleIncomingData(data) {
    if (pendingMediaMeta) {
      const meta = pendingMediaMeta;
      pendingMediaMeta = null;
      const blob = new Blob([data], { type: meta.mime });
      const url = URL.createObjectURL(blob);
      if (meta.kind === "image") {
        addImageBubble(peerProfile, url, false, meta.ts);
      } else {
        addAudioBubble(peerProfile, url, false, meta.ts);
      }
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
        addTextBubble(peerProfile, data.text, false, data.ts);
        break;
      case "sticker":
        addStickerBubble(peerProfile, data.sticker, false, data.ts);
        break;
      case "media-meta":
        pendingMediaMeta = data;
        break;
    }
  }

  // ---- Sending text ----
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !conn || !conn.open) return;
    const ts = Date.now();
    conn.send({ type: "message", text, ts });
    addTextBubble(myProfile, text, true, ts);
    messageInput.value = "";
  });

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
    const ts = Date.now();
    conn.send({ type: "sticker", sticker, ts });
    addStickerBubble(myProfile, sticker, true, ts);
  }

  // ---- Images ----
  imageBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];
    imageInput.value = "";
    if (!file || !conn || !conn.open) return;
    try {
      const { buffer, mime } = await resizeImageForChat(file);
      sendMedia("image", buffer, mime);
      const blob = new Blob([buffer], { type: mime });
      addImageBubble(myProfile, URL.createObjectURL(blob), true, Date.now());
    } catch (e) {
      addSystemMessage("Não foi possível enviar a foto.");
    }
  });

  function sendMedia(kind, buffer, mime) {
    if (!conn || !conn.open) return;
    conn.send({ type: "media-meta", kind, mime, ts: Date.now() });
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
      sendMedia("audio", buffer, mime);
      addAudioBubble(myProfile, URL.createObjectURL(blob), true, Date.now());
    }
    recordedChunks = [];
    mediaRecorder = null;
  }

  // ---- Rendering ----
  function renderRow(profile, isMe, bubbleEl, isSticker) {
    const row = document.createElement("div");
    row.className = "bubble-row " + (isMe ? "me" : "other") + (isSticker ? " sticker-row" : "");
    const avatar = document.createElement("img");
    avatar.className = "row-avatar";
    avatar.alt = "";
    avatar.src = (profile && profile.avatar) || generateInitialsAvatar((profile && profile.name) || "?");
    if (isMe) {
      row.appendChild(bubbleEl);
      row.appendChild(avatar);
    } else {
      row.appendChild(avatar);
      row.appendChild(bubbleEl);
    }
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function makeTimeEl(ts) {
    const time = document.createElement("span");
    time.className = "bubble-time";
    time.textContent = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return time;
  }

  function addTextBubble(profile, text, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const textEl = document.createElement("div");
    textEl.textContent = text;
    bubble.appendChild(textEl);
    bubble.appendChild(makeTimeEl(ts));
    renderRow(profile, isMe, bubble, false);
  }

  function addStickerBubble(profile, sticker, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const glyph = document.createElement("span");
    glyph.className = "sticker-glyph";
    glyph.textContent = sticker;
    bubble.appendChild(glyph);
    renderRow(profile, isMe, bubble, true);
  }

  function addImageBubble(profile, url, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const img = document.createElement("img");
    img.className = "bubble-image";
    img.src = url;
    img.alt = "Foto enviada";
    img.addEventListener("click", () => window.open(url, "_blank"));
    bubble.appendChild(img);
    bubble.appendChild(makeTimeEl(ts));
    renderRow(profile, isMe, bubble, false);
  }

  function addAudioBubble(profile, url, isMe, ts) {
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-audio";
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = url;
    bubble.appendChild(audio);
    bubble.appendChild(makeTimeEl(ts));
    renderRow(profile, isMe, bubble, false);
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
