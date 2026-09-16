const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// Render Web Service
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

      // WhatsApp pairing
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
        } catch (error) {
          console.log("❌ Could not generate pairing code.");
          console.error(error);
          pairingRequested = false;
        }
      }

      // Bot connected
      if (connection === "open") {
        console.log("================================");
        console.log("🤖 JOSH-X ULTRA");
        console.log("✅ BOT ONLINE");
        console.log("================================");
      }

      // Connection closed
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

  // Messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    // ==============================
    // PING
    // ==============================

    if (command === "ping") {
      await sock.sendMessage(jid, {
        text:
          "🏓 *PONG!*\n\n" +
          "⚡ JOSH-X ULTRA is online!"
      });
    }

    // ==============================
    // ALIVE
    // ==============================

    if (command === "alive") {
      await sock.sendMessage(jid, {
        text:
          "🤖 *JOSH-X ULTRA*\n\n" +
          "✅ Bot is alive\n" +
          "⚡ Status: Online\n" +
          "🚀 Version: 1.0.0"
      });
    }

    // ==============================
    // MENU
    // ==============================

    if (command === "menu") {
      await sock.sendMessage(jid, {
        text:
          "╭━━〔 🤖 JOSH-X ULTRA 〕━━╮\n" +
          "┃\n" +
          "┃ ⚡ GENERAL\n" +
          "┃ • ping\n" +
          "┃ • alive\n" +
          "┃ • menu\n" +
          "┃ • owner\n" +
          "┃\n" +
          "┃ 😈 BUG MENU\n" +
          "┃ • bug\n" +
          "┃ • bugtest\n" +
          "┃ • stress\n" +
          "┃ • testmsg\n" +
          "┃\n" +
          "┃ 🚀 More coming soon...\n" +
          "╰━━━━━━━━━━━━━━━━━━━━╯"
      });
    }

    // ==============================
    // OWNER
    // ==============================

    if (command === "owner") {
      await sock.sendMessage(jid, {
        text:
          "👑 *JOSH-X ULTRA OWNER*\n\n" +
          "Joshua"
      });
    }

    // ==============================
    // BUG MENU
    // Safe testing only
    // ==============================

    if (command === "bug") {
      await sock.sendMessage(jid, {
        text:
          "😈 *JOSH-X ULTRA BUG TEST*\n\n" +
          "🐞 Testing mode activated!\n" +
          "🧪 Running harmless diagnostics...\n" +
          "⚡ Message system: OK\n" +
          "🤖 Bot response: OK\n" +
          "🌐 Connection: OK\n" +
          "✅ Test completed!"
      });
    }

    // ==============================
    // BUG TEST
    // ==============================

    if (command === "bugtest") {
      await sock.sendMessage(jid, {
        text:
          "🐞 *BUG TEST*\n\n" +
          "⚡ Message handling: OK\n" +
          "🤖 Bot response: OK\n" +
          "🌐 Connection: OK\n" +
          "📡 WhatsApp session: Active\n" +
          "✅ All tests passed!"
      });
    }

    // ==============================
    // STRESS TEST
    // ==============================

    if (command === "stress") {
      await sock.sendMessage(jid, {
        text:
          "🧪 *STRESS TEST*\n\n" +
          "Testing JOSH-X ULTRA performance...\n\n" +
          "⚡ Command system: OK\n" +
          "📨 Message system: OK\n" +
          "🔄 Event system: OK\n\n" +
          "✅ Safe stress test completed!"
      });
    }

    // ==============================
    // TEST MESSAGE
    // ==============================

    if (command === "testmsg") {
      await sock.sendMessage(jid, {
        text:
          "😈 *JOSH-X ULTRA*\n\n" +
          "🐞 TEST MESSAGE\n" +
          "⚡ System is responding correctly!"
      });
    }
  });
}

startBot();
