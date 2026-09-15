const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// Keep Render Web Service alive
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

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

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {

      // Request pairing ONLY after WhatsApp has initialized
      if (
        qr &&
        !state.creds.registered &&
        !pairingRequested
      ) {
        pairingRequested = true;

        const phoneNumber = process.env.BOT_NUMBER;

        if (!phoneNumber) {
          console.log("❌ BOT_NUMBER is not set.");
          return;
        }

        try {
          console.log("⏳ Requesting WhatsApp pairing code...");

          const code =
            await sock.requestPairingCode(phoneNumber);

          console.log("================================");
          console.log("🔗 JOSH-X ULTRA PAIRING CODE");
          console.log("👉", code);
          console.log("================================");
          console.log("📱 Enter this code in WhatsApp:");
          console.log("Settings → Linked Devices → Link a Device");
        } catch (error) {
          console.log("❌ Could not generate pairing code.");
          console.error(error);

          pairingRequested = false;
        }
      }

      if (connection === "open") {
        console.log("================================");
        console.log("🤖 JOSH-X ULTRA");
        console.log("✅ BOT ONLINE");
        console.log("================================");
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log("⚠️ WhatsApp connection closed.");

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");
          setTimeout(startBot, 3000);
        } else {
          console.log("❌ WhatsApp logged out.");
        }
      }
    }
  );

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message) return;

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
          "╭━━〔 🤖 JOSH-X ULTRA 〕━━╮\n" +
          "┃\n" +
          "┃ ⚡ GENERAL\n" +
          "┃ • ping\n" +
          "┃ • alive\n" +
          "┃ • menu\n" +
          "┃ • owner\n" +
          "┃\n" +
          "┃ 🚀 More coming soon...\n" +
          "╰━━━━━━━━━━━━━━━━━━━━╯"
      });
    }

    if (command === "owner") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "👑 *JOSH-X ULTRA OWNER*\n\n" +
          "Joshua"
      });
    }
  });
}

startBot();
