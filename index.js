const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("╔══════════════════════════╗");
      console.log("║     JOSH-X ULTRA 🤖      ║");
      console.log("║      BOT ONLINE ✅       ║");
      console.log("╚══════════════════════════╝");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("Connection closed.");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    if (command === "ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!\n\n⚡ JOSH-X ULTRA is online!"
      });
    }

    if (command === "alive") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "🤖 *JOSH-X ULTRA*\n\n" +
          "✅ Bot is alive\n" +
          "⚡ Status: Online\n" +
          "🚀 Version: 1.0.0"
      });
    }

    if (command === "menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "╭━━━〔 🤖 JOSH-X ULTRA 〕━━━╮\n" +
          "┃\n" +
          "┃ 👋 Welcome!\n" +
          "┃\n" +
          "┃ ⚡ *GENERAL*\n" +
          "┃ • ping\n" +
          "┃ • alive\n" +
          "┃ • menu\n" +
          "┃ • owner\n" +
          "┃\n" +
          "┃ 🚀 More commands coming...\n" +
          "┃\n" +
          "╰━━━━━━━━━━━━━━━━━━━━╯"
      });
    }

    if (command === "owner") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👑 *JOSH-X ULTRA OWNER*\n\nJoshua"
      });
    }
  });
}

startBot();
