const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const P = require("pino");
const http = require("http");

// ==========================================
// 🌐 CONFIGURATION & UTILS
// ==========================================

const PORT = process.env.PORT || 10000;
const VERSION = "2.1.0";
const START_TIME = Date.now();

const roasts = [
  "🔥 Bro, even Google couldn't find your talent.",
  "😂 Your WiFi has more connection than your brain.",
  "💀 You're not useless... you can still serve as a bad example.",
  "🤣 Your confidence is impressive considering the evidence.",
  "🔥 Bro entered the chat and lowered the IQ.",
  "💀 If stupidity was electricity, you'd power a city.",
  "😂 Even your shadow leaves you sometimes.",
  "🤣 You're proof that loading screens can become people.",
  "🔥 Your brain is on airplane mode.",
  "💀 Bro is running on 1% common sense."
];

const jokes = [
  "😂 Why did the computer go to the doctor? It had a virus.",
  "🤣 Why was the phone wearing glasses? It lost its contacts.",
  "😆 Why did the developer go broke? Because he used up all his cache.",
  "😂 Why don't programmers like nature? It has too many bugs.",
  "🤣 What do you call a sleeping computer? A nap-top.",
  "😎 I told my computer I needed a break... now it won't stop sending me KitKat ads.",
  "😂 Why did the JavaScript developer wear glasses? Because he couldn't C#.",
  "🤣 Why was the smartphone cold? It left its Windows open."
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getRuntime() {
  const seconds = Math.floor((Date.now() - START_TIME) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Extract message extraction logic away from the main loop
function extractMessageText(message) {
  if (!message) return "";
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ""
  ).trim();
}

// Helper to quickly verify group context
async function checkGroupContext(sock, jid) {
  if (!jid.endsWith("@g.us")) {
    await sock.sendMessage(jid, { text: "❌ This command only works in groups." });
    return false;
  }
  return true;
}

// ==========================================
// 🌐 RENDER WEB SERVER
// ==========================================

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  if (req.url === "/health") return res.end("OK");
  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ==========================================
// 🤖 START BOT
// ==========================================

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["JOSH-X ULTRA", "Chrome", "1.0.0"],
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 🔑 PAIRING CODE HANDLING
    if (qr && !state.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (!phoneNumber) {
          console.log("⚠️ PHONE_NUMBER environment variable is missing.");
        } else {
          console.log("🔑 Requesting WhatsApp pairing code...");
          const code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ""));
          console.log(`🔑 PAIRING CODE: ${code}\n📱 Enter this code in WhatsApp > Linked Devices.`);
        }
      } catch (error) {
        pairingRequested = false;
        console.error("❌ Pairing code error:", error.message);
      }
    }

    // 🟢 CONNECTED
    if (connection === "open") {
      console.log("\n====================================\n🚀 JOSH-X ULTRA IS ONLINE!\n====================================\n" +
                  `📦 Version: ${VERSION}\n🤖 WhatsApp connection established.\n`);
    }

    // ❌ CONNECTION CLOSED
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ WhatsApp connection closed. Status: ${statusCode}`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log("🚪 WhatsApp logged out.\n⚠️ Delete the auth folder and pair again.");
      } else {
        console.log("🔄 Reconnecting in 3 seconds...");
        setTimeout(startBot, 3000);
      }
    }
  });

  // ==========================================
  // 💬 MESSAGE HANDLER
  // ==========================================

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg?.message) return;

      const jid = msg.key.remoteJid;
      if (!jid || jid === "status@broadcast") return;

      const text = extractMessageText(msg.message);
      if (!text) return;

      const tokens = text.split(" ");
      const command = tokens[0].toLowerCase();
      const query = tokens.slice(1).join(" ");

      // ======================================
      // 🎯 UTILITY & INFO COMMANDS
      // ======================================

      if (command === "ping") {
        const start = Date.now();
        await sock.sendMessage(jid, { text: "🏓 Pinging..." });
        await sock.sendMessage(jid, { text: `🏓 *PONG!*\n\n⚡ Speed: ${Date.now() - start}ms` });
        return;
      }

      if (command === "alive") {
        return sock.sendMessage(jid, {
          text: `╭━━━〔 🤖 JOSH-X ULTRA 〕━━━╮\n┃\n┃ 🟢 Status: ONLINE\n┃ 📦 Version: ${VERSION}\n┃ ⚡ Runtime: ${getRuntime()}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
        });
      }

      if (command === "runtime" || command === "uptime") {
        return sock.sendMessage(jid, { text: `⏱️ *JOSH-X ULTRA RUNTIME*\n\n${getRuntime()}` });
      }

      if (command === "owner") {
        return sock.sendMessage(jid, { text: `👑 *JOSH-X ULTRA OWNER*\n\nDeveloper: Joshua\nBot: JOSH-X ULTRA\nVersion: ${VERSION}` });
      }

      if (command === "about") {
        return sock.sendMessage(jid, { text: `🤖 *JOSH-X ULTRA*\n\nA WhatsApp automation bot.\n\n⚡ Fast\n🛠️ Powerful\n🚀 Always improving\n\nVersion: ${VERSION}` });
      }

      if (command === "status") {
        return sock.sendMessage(jid, { text: `📊 *BOT STATUS*\n\n🟢 WhatsApp: Connected\n🟢 Render: Running\n🟢 Bot: Online\n📦 Version: ${VERSION}\n⏱️ Runtime: ${getRuntime()}` });
      }

      if (command === "botinfo") {
        return sock.sendMessage(jid, { text: `🤖 *JOSH-X ULTRA INFO*\n\n📦 Name: JOSH-X ULTRA\n🔢 Version: ${VERSION}\n⚙️ Engine: Baileys\n🌐 Server: Render\n🟢 Status: Online` });
      }

      if (command === "menu" || command === "help") {
        return sock.sendMessage(jid, {
          text: `╭━━━〔 🤖 JOSH-X ULTRA 〕━━━╮\n┃\n┃ 👋 *WELCOME!*\n┃\n┃ 📌 *GENERAL*\n┃ • ping\n┃ • alive\n┃ • runtime\n┃ • owner\n┃ • about\n┃ • botinfo\n┃ • status\n┃\n┃ 🖼️ *PROFILE*\n┃ • getpp\n┃ • getpp @user\n┃\n┃ 👥 *GROUP*\n┃ • groupinfo\n┃ • groupid\n┃ • admins\n┃ • listmembers\n┃ • tagall\n┃\n┃ 🛠️ *TOOLS*\n┃ • echo <text>\n┃ • say <text>\n┃ • quote\n┃ • fact\n┃\n┃ 😂 *FUN*\n┃ • joke\n┃ • roast\n┃ • comeback\n┃ • roastbattle\n┃ • 8ball <question>\n┃ • truth\n┃ • dare\n┃\n┃ 🧪 *TEST*\n┃ • testmsg\n┃ • bug\n┃ • bugtest\n┃ • stress\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
        });
      }

      // ======================================
      // 🛠️ TOOLS & TEXT COMMANDS
      // ======================================

      if (command === "echo" || command === "say") {
        if (!query) return sock.sendMessage(jid, { text: `❌ Usage: ${command} <text>` });
        return sock.sendMessage(jid, { text: command === "say" ? `🗣️ ${query}` : query });
      }

      if (command === "getpp") {
        try {
          let targetJid = jid.endsWith("@g.us") ? (msg.key.participant || jid) : jid;
          const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
          if (mentioned?.length > 0) targetJid = mentioned[0];

          console.log(`🖼️ Getting profile picture for ${targetJid}`);
          const ppUrl = await sock.profilePictureUrl(targetJid, "image");

          if (!ppUrl) return sock.sendMessage(jid, { text: "❌ This user doesn't have a profile picture." });

          return sock.sendMessage(jid, {
            image: { url: ppUrl },
            caption: `🖼️ *JOSH-X GETPP*\n\n✅ Profile picture retrieved!`
          });
        } catch (error) {
          console.error("❌ GETPP ERROR:", error.message);
          return sock.sendMessage(jid, { text: "❌ Unable to retrieve the profile picture.\n\nThe user may have restricted their privacy settings." });
        }
      }

      // ======================================
      // 😂 FUN COMMANDS
      // ======================================

      if (command === "joke") return sock.sendMessage(jid, { text: getRandomItem(jokes) });
      if (command === "roast") return sock.sendMessage(jid, { text: getRandomItem(roasts) });

      if (command === "comeback") {
        const comebacks = [
          "😂 That's the best you got?", "🔥 Try again when your brain reconnects.",
          "💀 Bro really thought that was a comeback.", "🤣 Nice attempt. Almost impressive.",
          "😎 I would respond seriously, but you already lost."
        ];
        return sock.sendMessage(jid, { text: getRandomItem(comebacks) });
      }

      if (command === "roastbattle") {
        const battle = [
