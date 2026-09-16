const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// ==========================================
// 🌐 RENDER WEB SERVER + HEALTH CHECK
// ==========================================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    return res.end("OK");
  }

  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ==========================================
// 😈 ROAST ENGINE
// ==========================================

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
  "🦒 Giraffes have the same number of neck vertebrae as humans: seven."
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

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRoast() {
  return randomItem(roastReplies);
}

function getJoke() {
  return randomItem(jokes);
}

function getRuntime() {
  const seconds = Math.floor(process.uptime());

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// ==========================================
// 🤖 START BOT
// ==========================================

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  // ========================================
  // 🔗 CONNECTION
  // ========================================

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {

      if (
        qr &&
        !state.creds.registered &&
        !pairingRequested
      ) {
        pairingRequested = true;

        const phoneNumber =
          process.env.BOT_NUMBER;

        if (!phoneNumber) {
          console.log("❌ BOT_NUMBER is not set.");
          return;
        }

        try {
          console.log(
            "⏳ Requesting WhatsApp pairing code..."
          );

          const code =
            await sock.requestPairingCode(
              phoneNumber
            );

          console.log("================================");
          console.log("🔗 JOSH-X ULTRA PAIRING CODE");
          console.log("👉", code);
          console.log("================================");

        } catch (error) {
          console.log(
            "❌ Could not generate pairing code."
          );

          console.error(error);

          pairingRequested = false;
        }
      }

      // ======================================
      // 🟢 BOT ONLINE
      // ======================================

      if (connection === "open") {
        console.log("================================");
        console.log("🤖 JOSH-X ULTRA");
        console.log("✅ BOT ONLINE");
        console.log("🚀 Command system loaded");
        console.log("================================");
      }

      // ======================================
      // 🔄 CONNECTION CLOSED
      // ======================================

      if (connection === "close") {

        const shouldReconnect =
          lastDisconnect?.error?.output
            ?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          "⚠️ WhatsApp connection closed."
        );

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");

          setTimeout(
            startBot,
            3000
          );

        } else {
          console.log(
            "❌ WhatsApp logged out."
          );
        }
      }
    }
  );

  // ========================================
  // 📨 MESSAGE HANDLER
  // ========================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const msg = messages[0];

        if (!msg?.message) return;

        const jid = msg.key.remoteJid;

        if (!jid) return;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        const cleanText = text.trim();

        if (!cleanText) return;

        const parts = cleanText.split(/\s+/);

        const command =
          parts[0].toLowerCase();

        const args =
          parts.slice(1).join(" ").trim();

        // ==================================
        // 🏓 PING
        // ==================================

        if (command === "ping") {

          await sock.sendMessage(jid, {
            text:
             
