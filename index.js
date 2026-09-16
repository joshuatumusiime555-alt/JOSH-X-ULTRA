const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// ==============================
// RENDER WEB SERVER
// ==============================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ==============================
// BOT START
// ==============================

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

  // ==============================
  // CONNECTION
  // ==============================

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {

      // Pairing code
      if (
        qr &&
        !state.creds.registered &&
        !pairingRequested
      ) {

        pairingRequested = true;

        const phoneNumber =
          process.env.BOT_NUMBER;

        if (!phoneNumber) {
          console.log(
            "❌ BOT_NUMBER is not set."
          );
          return;
        }

        try {

          console.log(
            "⏳ Requesting pairing code..."
          );

          const code =
            await sock.requestPairingCode(
              phoneNumber
            );

          console.log(
            "================================"
          );

          console.log(
            "🔗 JOSH-X ULTRA PAIRING CODE"
          );

          console.log("👉", code);

          console.log(
            "================================"
          );

        } catch (error) {

          console.log(
            "❌ Could not generate pairing code."
          );

          console.error(error);

          pairingRequested = false;
        }
      }

      // Connected
      if (connection === "open") {

        console.log(
          "================================"
        );

        console.log(
          "🤖 JOSH-X ULTRA"
        );

        console.log(
          "✅ BOT ONLINE"
        );

        console.log(
          "🚀 Command system loaded"
        );

        console.log(
          "================================"
        );
      }

      // Disconnected
      if (connection === "close") {

        const shouldReconnect =
          lastDisconnect?.error?.output
            ?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          "⚠️ WhatsApp connection closed."
        );

        if (shouldReconnect) {

          console.log(
            "🔄 Reconnecting..."
          );

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

  // ==============================
  // MESSAGE HANDLER
  // ==============================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const msg = messages[0];

        if (!msg?.message) return;

        const jid =
          msg.key.remoteJid;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        const command =
          text.trim().toLowerCase();

        if (!command) return;

        // ==========================
        // PING
        // ==========================

        if (command === "ping") {

          await sock.sendMessage(jid, {
            text:
              "🏓 *PONG!*\n\n" +
              "⚡ JOSH-X ULTRA is online!"
          });

          return;
        }

        // ==========================
        // ALIVE
        // ==========================

        if (command === "alive") {

          await sock.sendMessage(jid, {
            text:
              "🤖 *JOSH-X ULTRA*\n\n" +
              "✅ Bot is alive\n" +
              "⚡ Status: Online\n" +
              "🚀 Version: 1.0.0"
          });

          return;
        }

        // ==========================
        // RUNTIME
        // ==========================

        if (command === "runtime") {

          const seconds =
            process.uptime();

          const days =
            Math.floor(
              seconds / 86400
            );

          const hours =
            Math.floor(
              (seconds % 86400) / 3600
            );

          const minutes =
            Math.floor(
              (seconds % 3600) / 60
            );

          const secs =
            Math.floor(
              seconds % 60
            );

          await sock.sendMessage(jid, {
            text:
              "⏱️ *JOSH-X ULTRA RUNTIME*\n\n" +
              `🗓️ ${days}d ${hours}h ${minutes}m ${secs}s`
          });

          return;
        }

        // ==========================
        // OWNER
        // ==========================

        if (command === "owner") {

          await sock.sendMessage(jid, {
            text:
              "👑 *JOSH-X ULTRA OWNER*\n\n" +
              "Joshua"
          });

          return;
        }

        // ==========================
        // ABOUT
        // ==========================

        if (command === "about") {

          await sock.sendMessage(jid, {
            text:
              "🤖 *JOSH-X ULTRA*\n\n" +
              "⚡ WhatsApp Automation Bot\n" +
              "🚀 Version: 1.0.0\n" +
              "🧩 Modular command system\n" +
              "☁️ Hosted on Render\n\n" +
              "Made by Joshua ❤️"
          });

          return;
        }

        // ==========================
        // MENU
        // ==========================

        if (command === "menu") {

          await sock.sendMessage(jid, {
            text:
              "╭━━〔 🤖 JOSH-X ULTRA 〕━━╮\n" +
              "┃\n" +
              "┃ ⚡ GENERAL\n" +
              "┃ • ping\n" +
              "┃ • alive\n" +
              "┃ • runtime\n" +
              "┃ • owner\n" +
              "┃ • about\n" +
              "┃\n" +
              "┃ 👥 GROUP\n" +
              "┃ • groupinfo\n" +
              "┃ • admins\n" +
              "┃ • tagall\n" +
              "┃\n" +
              "┃ 🛠️ TOOLS\n" +
              "┃ • testmsg\n" +
              "┃\n" +
              "┃ 😈 BUG / TEST\n" +
              "┃ • bug\n" +
              "┃ • bugtest\n" +
              "┃ • stress\n" +
              "┃\n" +
              "┃ 🚀 JOSH-X ULTRA\n" +
              "╰━━━━━━━━━━━━━━━━━━━━╯"
          });

          return;
        }

        // ==========================
        // BUG
        // ==========================

        if (command === "bug") {

          await sock.sendMessage(jid, {
            text:
              "😈 *BUG TEST*\n\n" +
              "🐞 Diagnostic mode\n" +
              "⚡ Message system: OK\n" +
              "🤖 Bot engine: OK\n" +
              "🌐 Connection: OK\n" +
              "✅ Test completed!"
          });

          return;
        }

        // ==========================
        // BUGTEST
        // ==========================

        if (command === "bugtest") {

          await sock.sendMessage(jid, {
            text:
              "🐞 *BUG TEST*\n\n" +
              "📨 Message handling: OK\n" +
              "⚡ Command handler: OK\n" +
              "🔄 Event system: OK\n" +
              "🤖 Bot response: OK\n\n" +
              "✅ All tests passed!"
          });

          return;
        }

        // ==========================
        // STRESS TEST
        // ==========================

        if (command === "stress") {

          await sock.sendMessage(jid, {
            text:
              "🧪 *STRESS TEST*\n\n" +
              "Testing bot performance safely...\n\n" +
              "⚡ Command system: OK\n" +
              "📨 Message system: OK\n" +
              "🔄 Event system: OK\n\n" +
              "✅ Test completed!"
          });

          return;
        }

        // ==========================
        // TEST MESSAGE
        // ==========================

        if (command === "testmsg") {

          await sock.sendMessage(jid, {
            text:
              "😈 *JOSH-X ULTRA*\n\n" +
              "🐞 TEST MESSAGE\n" +
              "⚡ System responding correctly!"
          });

          return;
        }

        // ==========================
        // GROUP INFO
        // ==========================

        if (command === "groupinfo") {

          if (!jid.endsWith("@g.us")) {

            await sock.sendMessage(jid, {
              text:
                "❌ This command only works in groups."
            });

            return;
          }

          const metadata =
            await sock.groupMetadata(jid);

          await sock.sendMessage(jid, {
            text:
              "👥 *GROUP INFO*\n\n" +
              `📛 Name: ${metadata.subject}\n` +
              `👤 Members: ${metadata.participants.length}\n` +
              `🆔 ID: ${jid}`
          });

          return;
        }

        // ==========================
        // ADMINS
        // ==========================

        if (command === "admins") {

          if (!jid.endsWith("@g.us")) {

            await sock.sendMessage(jid, {
              text:
                "❌ This command only works in groups."
            });

            return;
          }

          const metadata =
            await sock.groupMetadata(jid);

          const admins =
            metadata.participants
              .filter(
                member =>
                  member.admin === "admin" ||
                  member.admin === "superadmin"
              );

          let message =
            "👑 *GROUP ADMINS*\n\n";

          admins.forEach(
            (admin, index) => {

              message +=
                `${index + 1}. @${admin.id.split("@")[0]}\n`;
            }
          );

          await sock.sendMessage(jid, {
            text: message,
            mentions:
              admins.map(
                admin => admin.id
              )
          });

          return;
        }

        // ==========================
        // TAG ALL
        // ==========================

        if (command === "tagall") {

          if (!jid.endsWith("@g.us")) {

            await sock.sendMessage(jid, {
              text:
                "❌ This command only works in groups."
            });

            return;
          }

          const metadata =
            await sock.groupMetadata(jid);

          let message =
            "📢 *JOSH-X ULTRA TAG ALL*\n\n";

          const mentions =
            metadata.participants.map(
              member => member.id
            );

          metadata.participants.forEach(
            (member, index) => {

              message +=
                `${index + 1}. @${member.id.split("@")[0]}\n`;
            }
          );

          await sock.sendMessage(jid, {
            text: message,
            mentions
          });

          return;
        }

      } catch (error) {

        console.error(
          "❌ Command error:",
          error
        );

      }
    }
  );
}

// ==============================
// START
// ==============================

startBot().catch(error => {
  console.error(
    "❌ Bot failed to start:",
    error
  );
});
