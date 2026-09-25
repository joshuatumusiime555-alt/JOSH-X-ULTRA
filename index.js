const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  getContentType
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("OK");
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("JOSH-X ULTRA is running 🚀");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

const roastReplies = [
  "😭 That was your best shot? I almost felt something.",
  "😈 Bro came to a roast battle armed with a butter knife.",
  "😂 Keep going. You're accidentally making me look smarter.",
  "🔥 I would roast you harder, but I don't want to damage the Wi-Fi.",
  "💀 That comeback needs a software update.",
  "🤣 You're talking like your keyboard has no backspace.",
  "😏 Confidence at 100%, damage at 0%.",
  "😂 I've seen loading screens with better comebacks.",
  "😈 You brought jokes to a competition and forgot the funny part.",
  "💀 Even autocorrect wouldn't know how to save that one.",
  "🤣 Your roast arrived... unfortunately, the delivery was incomplete.",
  "🔥 That's cute. Now try again.",
  "😭 My calculator has more personality than that comeback.",
  "😈 You pressed send with confidence and zero evidence.",
  "💀 That roast needs a tutorial before it can enter the battle."
];

const jokes = [
  "😂 Why did the computer go to the doctor? It had a virus.",
  "🤣 My code works... I just don't know why.",
  "😭 Programmer's favorite place? The cache.",
  "😂 I told my bot to behave. It said: command not found.",
  "🤣 Why was the phone wearing glasses? It lost its contacts.",
  "😂 Debugging: removing the needles from the haystack.",
  "😭 My Wi-Fi and I have a complicated relationship."
];

const quotes = [
  "💫 Small progress is still progress.",
  "🔥 Keep learning. Keep building.",
  "🚀 Every expert started as a beginner.",
  "💡 Problems are part of the learning process.",
  "⚡ Build something today that makes tomorrow easier."
];

const facts = [
  "🧠 A group of flamingos is called a flamboyance.",
  "🌍 Earth is the only known planet with stable liquid water on its surface.",
  "🐙 Octopuses have three hearts.",
  "☀️ Sunlight takes about 8 minutes to reach Earth.",
  "🦒 Giraffes have seven neck vertebrae, the same number as humans."
];

const truths = [
  "👀 What's one thing you are secretly really good at?",
  "😂 What's the funniest thing you've ever done?",
  "😎 Who was your first crush?",
  "🤔 What's one thing you want to learn?",
  "🔥 What's the biggest mistake you've learned from?"
];

const dares = [
  "😂 Send the funniest emoji combination you can think of.",
  "🔥 Change your profile picture for 5 minutes.",
  "🤣 Send 'I am the legend' to the group.",
  "😎 Say something nice about the person above you.",
  "💀 Send your last-used emoji three times."
];

const eightBallAnswers = [
  "🎱 Definitely yes.",
  "🎱 Most likely.",
  "🎱 Absolutely.",
  "🎱 Ask again later.",
  "🎱 Hard to tell.",
  "🎱 Probably not.",
  "🎱 My answer is no.",
  "🎱 The future is uncertain."
];

const chatbotReplies = [
  "Hey! How can I help you today? 😊",
  "I'm listening... what's up?",
  "Tell me more 🔥",
  "Interesting... go on.",
  "Haha okay, and then what?",
  "I'm here for you 💪",
  "That sounds wild 😂",
  "Need a joke, fact, or roast?",
  "JOSH-X is online and ready.",
  "Say *menu* to see everything I can do."
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRuntime() {
  const seconds = Math.floor(process.uptime());
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

const features = {
  antiDelete: true,
  autoViewStatus: true,
  autoRead: true,
  alwaysOnline: true,
  autoReact: false,
  autoLikeStatus: false,
  chatbot: false,
  autoSaveContacts: false,
  antiBan: true
};

const rateLimit = new Map();
const RATE_LIMIT_MS = 1200;

function canReply(jid) {
  if (!features.antiBan) return true;
  const now = Date.now();
  const last = rateLimit.get(jid) || 0;
  if (now - last < RATE_LIMIT_MS) return false;
  rateLimit.set(jid, now);
  return true;
}

const messageCache = new Map();
const MAX_CACHE = 250;

function cacheMessage(msg) {
  try {
    if (!msg?.key?.id) return;
    messageCache.set(msg.key.id, {
      key: msg.key,
      message: msg.message,
      pushName: msg.pushName,
      messageTimestamp: msg.messageTimestamp
    });
    if (messageCache.size > MAX_CACHE) {
      const firstKey = messageCache.keys().next().value;
      messageCache.delete(firstKey);
    }
  } catch (e) {}
}

function getCachedMessage(id) {
  return messageCache.get(id) || null;
}

const savedContacts = new Set();

function getQuotedMessage(msg) {
  const context =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo ||
    msg.message?.documentMessage?.contextInfo ||
    msg.message?.audioMessage?.contextInfo ||
    msg.message?.stickerMessage?.contextInfo;
  return context?.quotedMessage || null;
}

function unwrapViewOnce(content) {
  if (!content) return null;
  return (
    content.viewOnceMessage?.message ||
    content.viewOnceMessageV2?.message ||
    content.viewOnceMessageV2Extension?.message ||
    content
  );
}

function getMediaType(content) {
  if (!content) return null;
  if (content.imageMessage) return "image";
  if (content.videoMessage) return "video";
  if (content.audioMessage) return "audio";
  if (content.documentMessage) return "document";
  if (content.stickerMessage) return "sticker";
  return null;
}

async function downloadAndSendMedia(sock, jid, originalMsg, caption = "") {
  try {
    const buffer = await downloadMediaMessage(
      originalMsg,
      "buffer",
      {},
      {
        logger: P({ level: "silent" }),
        reuploadRequest: sock.updateMediaMessage
      }
    );
    const type = getContentType(originalMsg.message);
    const mediaContent = originalMsg.message[type];
    if (type === "imageMessage") {
      await sock.sendMessage(jid, { image: buffer, caption: caption || mediaContent?.caption || "" });
    } else if (type === "videoMessage") {
      await sock.sendMessage(jid, { video: buffer, caption: caption || mediaContent?.caption || "" });
    } else if (type === "audioMessage") {
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: mediaContent?.mimetype || "audio/ogg; codecs=opus",
        ptt: mediaContent?.ptt || false
      });
    } else if (type === "documentMessage") {
      await sock.sendMessage(jid, {
        document: buffer,
        mimetype: mediaContent?.mimetype || "application/octet-stream",
        fileName: mediaContent?.fileName || "file"
      });
    } else if (type === "stickerMessage") {
      await sock.sendMessage(jid, { sticker: buffer });
    } else {
      await sock.sendMessage(jid, { text: "❌ Unsupported media type." });
    }
  } catch (err) {
    console.error("Media download error:", err?.message || err);
    await sock.sendMessage(jid, { text: "❌ Failed to download media. It may have expired." });
  }
}

async function requestPairingCode(sock, state) {
  if (state.creds.registered) {
    console.log("✅ WhatsApp session already registered.");
    return;
  }
  const rawNumber = process.env.BOT_NUMBER;
  if (!rawNumber) {
    console.log("❌ BOT_NUMBER environment variable is missing.");
    return;
  }
  const phoneNumber = rawNumber.replace(/\D/g, "");
  if (!phoneNumber) {
    console.log("❌ BOT_NUMBER is invalid.");
    return;
  }
  console.log("================================");
  console.log("🔗 PAIRING MODE");
  console.log("📱 Number:", phoneNumber);
  console.log("================================");
  let attempts = 0;
  while (!state.creds.registered && attempts < 8) {
    attempts++;
    try {
      console.log(`🔄 Pairing attempt ${attempts}/8...`);
      const code = await sock.requestPairingCode(phoneNumber);
      console.log("================================");
      console.log("🔗 JOSH-X ULTRA PAIRING CODE");
      console.log("👉", code);
      console.log("📱 Open WhatsApp → Linked devices → Link with phone number");
      console.log("================================");
      return;
    } catch (error) {
      console.log(`⚠️ Pairing attempt ${attempts} failed:`, error?.message || error);
      if (attempts < 8) await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  console.log("================================");
  console.log("🤖 JOSH-X ULTRA STARTING");
  console.log("================================");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    markOnlineOnConnect: features.alwaysOnline
  });

  sock.ev.on("creds.update", saveCreds);
  let pairingStarted = false;
  let reconnectStarted = false;

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    console.log(`📡 WhatsApp connection: ${connection || "unknown"}`);
    if (connection === "connecting" && !state.creds.registered && !pairingStarted) {
      pairingStarted = true;
      setTimeout(async () => {
        try { await requestPairingCode(sock, state); }
        catch (error) {
          console.log("❌ Pairing error:", error?.message || error);
          pairingStarted = false;
        }
      }, 5000);
    }
    if (connection === "open") {
      console.log("================================");
      console.log("🤖 JOSH-X ULTRA ONLINE");
      console.log(`🛡️ Anti-Delete: ${features.antiDelete ? "ON" : "OFF"}`);
      console.log(`👁️ Auto-View Status: ${features.autoViewStatus ? "ON" : "OFF"}`);
      console.log(`🟢 Always Online: ${features.alwaysOnline ? "ON" : "OFF"}`);
      console.log(`🛡️ Anti-Ban: ${features.antiBan ? "ON" : "OFF"}`);
      console.log("================================");
      if (features.alwaysOnline) {
        setInterval(async () => {
          try { await sock.sendPresenceUpdate("available"); } catch (e) {}
        }, 25000);
      }
    }
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log("⚠️ Connection closed. Status:", statusCode);
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect && !reconnectStarted) {
        reconnectStarted = true;
        console.log("🔄 Reconnecting in 3s...");
        setTimeout(() => {
          startBot().catch(err => console.error("Restart error:", err));
        }, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    try {
      const msg = messages[0];
      if (!msg?.message) return;
      const jid = msg.key.remoteJid;
      if (!jid) return;
      const isStatus = jid === "status@broadcast";
      const fromMe = msg.key.fromMe;

      if (!fromMe) cacheMessage(msg);

      if (isStatus && features.autoViewStatus && !fromMe) {
        try {
          await sock.readMessages([msg.key]);
          if (features.autoLikeStatus) {
            try {
              await sock.sendMessage(jid, { react: { text: "❤️", key: msg.key } });
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (features.autoRead && !fromMe && !isStatus) {
        try { await sock.readMessages([msg.key]); } catch (e) {}
      }

      if (features.autoReact && !fromMe && !isStatus && type === "notify") {
        try {
          const reacts = ["👍", "❤️", "😂", "🔥", "😮", "👏"];
          await sock.sendMessage(jid, { react: { text: randomItem(reacts), key: msg.key } });
        } catch (e) {}
      }

      if (features.autoSaveContacts && !fromMe && !isStatus) {
        const participant = msg.key.participant || jid;
        if (participant && !savedContacts.has(participant)) savedContacts.add(participant);
      }

      const protocol = msg.message?.protocolMessage;
      if (features.antiDelete && protocol && (protocol.type === 0 || protocol.type === "REVOKE")) {
        const deletedKey = protocol.key;
        if (deletedKey?.id) {
          const cached = getCachedMessage(deletedKey.id);
          if (cached?.message) {
            const deletedBy = msg.key.participant || msg.key.remoteJid;
            const originalSender = cached.key.participant || cached.key.remoteJid;
            let recoveredText = "[Media / Unknown]";
            const content = cached.message;
            if (content.conversation) recoveredText = content.conversation;
            else if (content.extendedTextMessage?.text) recoveredText = content.extendedTextMessage.text;
            else if (content.imageMessage) recoveredText = "[Image]" + (content.imageMessage.caption ? "\n" + content.imageMessage.caption : "");
            else if (content.videoMessage) recoveredText = "[Video]" + (content.videoMessage.caption ? "\n" + content.videoMessage.caption : "");
            else if (content.stickerMessage) recoveredText = "[Sticker]";
            else if (content.audioMessage) recoveredText = "[Audio]";
            else if (content.documentMessage) recoveredText = "[Document] " + (content.documentMessage.fileName || "");

            const antiMsg =
              "🛡️ *ANTI-DELETE*\n\n" +
              `🗑️ Message deleted\n` +
              `👤 By: @${(deletedBy || "").split("@")[0]}\n` +
              `📝 From: @${(originalSender || "").split("@")[0]}\n\n` +
              `💬 Content:\n${recoveredText}`;

            if (canReply(jid)) {
              await sock.sendMessage(jid, {
                text: antiMsg,
                mentions: [deletedBy, originalSender].filter(Boolean)
              });
            }
            if (content.imageMessage || content.videoMessage || content.stickerMessage || content.audioMessage || content.documentMessage) {
              try {
                const fakeMsg = { key: cached.key, message: content };
                await downloadAndSendMedia(sock, jid, fakeMsg, "🛡️ Recovered deleted media");
              } catch (e) {}
            }
          }
        }
        return;
      }

      if (isStatus) return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";
      const cleanText = text.trim();
      if (!cleanText) return;

      if (features.chatbot && !fromMe && !cleanText.match(/^[.!/#]/)) {
        if (canReply(jid)) await sock.sendMessage(jid, { text: randomItem(chatbotReplies) });
        return;
      }

      const parts = cleanText.split(/\\s+/);
      const command = parts[0].toLowerCase().replace(/^[.!/#]/, "");
      const args = parts.slice(1).join(" ").trim();
      const sender = msg.key.participant || msg.key.remoteJid;
      const quotedMsg = getQuotedMessage(msg);

      if (!canReply(jid) && !["ping", "alive", "menu", "features"].includes(command)) return;

      if (command === "ping") {
        await sock.sendMessage(jid, { text: "🏓 *PONG!*\n\n⚡ JOSH-X ULTRA is online!" });
        return;
      }
      if (command === "alive") {
        await sock.sendMessage(jid, {
          text: "🤖 *JOSH-X ULTRA*\n\n✅ Bot is alive\n⚡ Status: Online\n🚀 Version: 3.0.0 (All Features)\n🛡️ Anti-Delete: " + (features.antiDelete ? "ON" : "OFF")
        });
        return;
      }
      if (command === "runtime" || command === "uptime") {
        await sock.sendMessage(jid, { text: "⏱️ *RUNTIME*\n\n" + getRuntime() });
        return;
      }
      if (command === "owner") {
        await sock.sendMessage(jid, { text: "👑 *OWNER*\n\nJoshua" });
        return;
      }
      if (command === "about") {
        await sock.sendMessage(jid, {
          text: "🤖 *JOSH-X ULTRA*\n\n⚡ Full Feature WhatsApp Bot\n🚀 Version: 3.0.0\n🛡️ Anti-Delete + Status tools\n☁️ Hosted on Render\n\nMade by Joshua ❤️"
        });
        return;
      }
      if (command === "status" || command === "botstatus") {
        await sock.sendMessage(jid, {
          text:
            "📊 *JOSH-X STATUS*\n\n" +
            `🟢 Online\n` +
            `🛡️ Anti-Delete: ${features.antiDelete ? "ON" : "OFF"}\n` +
            `👁️ Auto-View Status: ${features.autoViewStatus ? "ON" : "OFF"}\n` +
            `👁️ Auto-Read: ${features.autoRead ? "ON" : "OFF"}\n` +
            `🟢 Always Online: ${features.alwaysOnline ? "ON" : "OFF"}\n` +
            `❤️ Auto-React: ${features.autoReact ? "ON" : "OFF"}\n` +
            `💬 Chatbot: ${features.chatbot ? "ON" : "OFF"}\n` +
            `🛡️ Anti-Ban: ${features.antiBan ? "ON" : "OFF"}\n` +
            `⏱️ Uptime: ${getRuntime()}`
        });
        return;
      }
      if (command === "botinfo") {
        await sock.sendMessage(jid, {
          text: "🤖 *JOSH-X ULTRA INFO*\n\n👑 Owner: Joshua\n⚡ Version: 3.0.0\n🟢 Status: Online\n☁️ Platform: Render\n🧩 Baileys Engine\n🛡️ Full feature pack"
        });
        return;
      }

      if (command === "menu" || command === "help") {
        await sock.sendMessage(jid, {
          text:
            "╭━━〔 🤖 JOSH-X ULTRA v3 〕━━╮\n" +
            "┃\n" +
            "┃ ⚡ GENERAL\n" +
            "┃ • ping | alive | runtime\n" +
            "┃ • status | owner | about\n" +
            "┃\n" +
            "┃ 😂 FUN\n" +
            "┃ • joke | quote | fact\n" +
            "┃ • truth | dare | 8ball\n" +
            "┃ • roast | comeback\n" +
            "┃\n" +
            "┃ 📥 MEDIA\n" +
            "┃ • getpp\n" +
            "┃ • vv          (view once)\n" +
            "┃ • download    (any media)\n" +
            "┃\n" +
            "┃ 🛡️ FEATURES (ON/OFF)\n" +
            "┃ • antidelete on/off\n" +
            "┃ • autoviewstatus on/off\n" +
            "┃ • autoread on/off\n" +
            "┃ • alwaysonline on/off\n" +
            "┃ • autoreact on/off\n" +
            "┃ • chatbot on/off\n" +
            "┃ • antiban on/off\n" +
            "┃ • features\n" +
            "┃\n" +
            "┃ 🎭 PRESENCE\n" +
            "┃ • typing\n" +
            "┃ • recording\n" +
            "┃ • available\n" +
            "┃\n" +
            "┃ 👥 GROUP\n" +
            "┃ • groupinfo | groupid\n" +
            "┃ • admins | listmembers\n" +
            "┃ • tagall\n" +
            "┃\n" +
            "┃ 🚀 JOSH-X ULTRA\n" +
            "╰━━━━━━━━━━━━━━━━━━━━╯"
        });
        return;
      }

      if (command === "joke") {
        await sock.sendMessage(jid, { text: "😂 *JOKE*\n\n" + randomItem(jokes) });
        return;
      }
      if (command === "quote") {
        await sock.sendMessage(jid, { text: "💫 *QUOTE*\n\n" + randomItem(quotes) });
        return;
      }
      if (command === "fact") {
        await sock.sendMessage(jid, { text: "🧠 *FACT*\n\n" + randomItem(facts) });
        return;
      }
      if (command === "8ball") {
        if (!args) {
          await sock.sendMessage(jid, { text: "🎱 Ask a question.\nExample: *8ball will I succeed?*" });
          return;
        }
        await sock.sendMessage(jid, {
          text: "🎱 *8 BALL*\n\n" + `❓ ${args}\n\n` + randomItem(eightBallAnswers)
        });
        return;
      }
      if (command === "roast" || command === "comeback") {
        await sock.sendMessage(jid, {
          text: (command === "roast" ? "😈 *ROAST*\n\n" : "🔥 *COMEBACK*\n\n") + randomItem(roastReplies)
        });
        return;
      }
      if (command === "roastbattle") {
        await sock.sendMessage(jid, {
          text: "🥊 *ROAST BATTLE*\n\nSend a roast and I'll fire back. Use *roast* or *comeback*."
        });
        return;
      }
      if (command === "truth") {
        await sock.sendMessage(jid, { text: "🎯 *TRUTH*\n\n" + randomItem(truths) });
        return;
      }
      if (command === "dare") {
        await sock.sendMessage(jid, { text: "😈 *DARE*\n\n" + randomItem(dares) });
        return;
      }
      if (command === "echo" || command === "say") {
        if (!args) {
          await sock.sendMessage(jid, { text: `🗣️ Usage: *${command} your text*` });
          return;
        }
        await sock.sendMessage(jid, { text: `🗣️ ${args}` });
        return;
      }
      if (command === "time") {
        await sock.sendMessage(jid, { text: "🕐 *TIME*\n\n" + new Date().toLocaleTimeString() });
        return;
      }
      if (command === "date") {
        await sock.sendMessage(jid, { text: "📅 *DATE*\n\n" + new Date().toLocaleDateString() });
        return;
      }

      if (command === "groupinfo") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, { text: "❌ Groups only." });
          return;
        }
        const metadata = await sock.groupMetadata(jid);
        await sock.sendMessage(jid, {
          text: `👥 *GROUP INFO*\n\n📛 ${metadata.subject}\n👤 Members: ${metadata.participants.length}\n🆔 ${jid}`
        });
        return;
      }
      if (command === "groupid") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, { text: "❌ Groups only." });
          return;
        }
        await sock.sendMessage(jid, { text: "🆔 *GROUP ID*\n\n" + jid });
        return;
      }
      if (command === "admins") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, { text: "❌ Groups only." });
          return;
        }
        const metadata = await sock.groupMetadata(jid);
        const admins = metadata.participants.filter(m => m.admin === "admin" || m.admin === "superadmin");
        let message = "👑 *ADMINS*\n\n";
        admins.forEach((a, i) => { message += `${i + 1}. @${a.id.split("@")[0]}\n`; });
        await sock.sendMessage(jid, { text: message, mentions: admins.map(a => a.id) });
        return;
      }
      if (command === "listmembers") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, { text: "❌ Groups only." });
          return;
        }
        const metadata = await sock.groupMetadata(jid);
        let message = "👥 *MEMBERS*\n\n";
        metadata.participants.forEach((m, i) => { message += `${i + 1}. @${m.id.split("@")[0]}\n`; });
        await sock.sendMessage(jid, {
          text: message,
          mentions: metadata.participants.map(m => m.id)
        });
        return;
      }
      if (command === "tagall") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, { text: "❌ Groups only." });
          return;
        }
        const metadata = await sock.groupMetadata(jid);
        let message = "📢 *TAG ALL*\n\n";
        const mentions = metadata.participants.map(m => m.id);
        metadata.participants.forEach((m, i) => { message += `${i + 1}. @${m.id.split("@")[0]}\n`; });
        await sock.sendMessage(jid, { text: message, mentions });
        return;
      }

      if (command === "getpp") {
        let targetJid = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
          targetJid = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
          targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args) {
          const number = args.replace(/\\D/g, "");
          if (number.length >= 8) targetJid = number + "@s.whatsapp.net";
        } else {
          targetJid = sender;
        }
        if (!targetJid) {
          await sock.sendMessage(jid, {
            text: "🖼️ *GETPP*\n\n• getpp\n• getpp @user\n• getpp 2547xxxxxxxx\n• Reply + getpp"
          });
          return;
        }
        try {
          const ppUrl = await sock.profilePictureUrl(targetJid, "image");
          if (!ppUrl) {
            await sock.sendMessage(jid, { text: "❌ No profile picture or hidden." });
            return;
          }
          await sock.sendMessage(jid, {
            image: { url: ppUrl },
            caption: `🖼️ Profile Picture\n👤 @${targetJid.split("@")[0]}`,
            mentions: [targetJid]
          });
        } catch (err) {
          await sock.sendMessage(jid, { text: "❌ Could not fetch profile picture." });
        }
        return;
      }

      if (command === "vv" || command === "viewonce" || command === "reveal") {
        if (!quotedMsg) {
          await sock.sendMessage(jid, {
            text: "👁️ *VIEW ONCE*\n\nReply to a View Once photo/video with *vv*"
          });
          return;
        }
        const unwrapped = unwrapViewOnce(quotedMsg);
        const mediaType = getMediaType(unwrapped);
        if (!mediaType) {
          await sock.sendMessage(jid, { text: "❌ Not a View Once media. Reply to one." });
          return;
        }
        try {
          const fakeMsg = { key: msg.key, message: unwrapped };
          const buffer = await downloadMediaMessage(fakeMsg, "buffer", {}, {
            logger: P({ level: "silent" }),
            reuploadRequest: sock.updateMediaMessage
          });
          const caption = unwrapped.imageMessage?.caption || unwrapped.videoMessage?.caption || "👁️ Opened by JOSH-X";
          if (mediaType === "image") {
            await sock.sendMessage(jid, { image: buffer, caption });
          } else if (mediaType === "video") {
            await sock.sendMessage(jid, { video: buffer, caption });
          } else if (mediaType === "audio") {
            await sock.sendMessage(jid, {
              audio: buffer,
              mimetype: unwrapped.audioMessage?.mimetype || "audio/ogg; codecs=opus",
              ptt: unwrapped.audioMessage?.ptt || false
            });
          }
        } catch (err) {
          await sock.sendMessage(jid, { text: "❌ Failed to open View Once (may be expired)." });
        }
        return;
      }

      if (command === "download" || command === "dl" || command === "save") {
        if (!quotedMsg) {
          await sock.sendMessage(jid, {
            text: "📥 *DOWNLOAD*\n\nReply to any media (photo/video/audio/doc/sticker) with *download*"
          });
          return;
        }
        let content = quotedMsg;
        let mediaType = getMediaType(content);
        if (!mediaType) {
          content = unwrapViewOnce(quotedMsg);
          mediaType = getMediaType(content);
        }
        if (!mediaType) {
          await sock.sendMessage(jid, { text: "❌ No downloadable media in the quoted message." });
          return;
        }
        try {
          const fakeMsg = { key: msg.key, message: content };
          await downloadAndSendMedia(sock, jid, fakeMsg, "📥 Downloaded by JOSH-X ULTRA");
        } catch (err) {
          await sock.sendMessage(jid, { text: "❌ Download failed. Media may have expired." });
        }
        return;
      }

      if (command === "typing" || command === "faketype") {
        try {
          await sock.sendPresenceUpdate("composing", jid);
          await sock.sendMessage(jid, { text: "⌨️ *Fake Typing* sent for a few seconds..." });
          setTimeout(async () => {
            try { await sock.sendPresenceUpdate("paused", jid); } catch (e) {}
          }, 5000);
        } catch (e) {
          await sock.sendMessage(jid, { text: "❌ Could not send typing presence." });
        }
        return;
      }
      if (command === "recording" || command === "fakerecord") {
        try {
          await sock.sendPresenceUpdate("recording", jid);
          await sock.sendMessage(jid, { text: "🎙️ *Fake Recording* sent for a few seconds..." });
          setTimeout(async () => {
            try { await sock.sendPresenceUpdate("paused", jid); } catch (e) {}
          }, 5000);
        } catch (e) {
          await sock.sendMessage(jid, { text: "❌ Could not send recording presence." });
        }
        return;
      }
      if (command === "available" || command === "online") {
        try {
          await sock.sendPresenceUpdate("available");
          await sock.sendMessage(jid, { text: "🟢 Presence set to *Available*" });
        } catch (e) {}
        return;
      }

      const toggleMap = {
        antidelete: "antiDelete",
        autoviewstatus: "autoViewStatus",
        autoread: "autoRead",
        alwaysonline: "alwaysOnline",
        autoreact: "autoReact",
        chatbot: "chatbot",
        antiban: "antiBan",
        autolikestatus: "autoLikeStatus",
        autosavecontacts: "autoSaveContacts"
      };
      if (toggleMap[command]) {
        const key = toggleMap[command];
        if (args === "on") {
          features[key] = true;
          await sock.sendMessage(jid, { text: `✅ *${command}* turned *ON*` });
        } else if (args === "off") {
          features[key] = false;
          await sock.sendMessage(jid, { text: `❌ *${command}* turned *OFF*` });
        } else {
          await sock.sendMessage(jid, {
            text: `⚙️ *${command}* is currently *${features[key] ? "ON" : "OFF"}*\n\nUse:\n• ${command} on\n• ${command} off`
          });
        }
        return;
      }

      if (command === "features") {
        await sock.sendMessage(jid, {
          text:
            "⚙️ *ALL FEATURES*\n\n" +
            `1. Auto-View Status: ${features.autoViewStatus ? "✅" : "❌"}\n` +
            `2. Anti-Delete: ${features.antiDelete ? "✅" : "❌"}\n` +
            `6. Always Online: ${features.alwaysOnline ? "✅" : "❌"}\n` +
            `8. Auto-Like Status: ${features.autoLikeStatus ? "✅" : "❌"}\n` +
            `14. Chatbot: ${features.chatbot ? "✅" : "❌"}\n` +
            `15. Auto-React: ${features.autoReact ? "✅" : "❌"}\n` +
            `16. Auto-Read: ${features.autoRead ? "✅" : "❌"}\n` +
            `17. Auto-Save Contacts: ${features.autoSaveContacts ? "✅" : "❌"}\n` +
            `18. Anti-Ban Mode: ${features.antiBan ? "✅" : "❌"}\n\n` +
            "Toggle any with:\n" +
            "`antidelete on/off`\n" +
            "`autoviewstatus on/off`\n" +
            "`autoread on/off`\n" +
            "`alwaysonline on/off`\n" +
            "`autoreact on/off`\n" +
            "`chatbot on/off`\n" +
            "`antiban on/off`"
        });
        return;
      }

      if (command === "bug" || command === "bugtest" || command === "stress" || command === "testmsg") {
        await sock.sendMessage(jid, {
          text: "🧪 *TEST*\n\n✅ Message system OK\n✅ Command handler OK\n✅ Bot responding correctly"
        });
        return;
      }

    } catch (error) {
      console.error("❌ Handler error:", error?.message || error);
    }
  });
}

startBot().catch(error => {
  console.error("❌ Bot failed to start:", error);
});
