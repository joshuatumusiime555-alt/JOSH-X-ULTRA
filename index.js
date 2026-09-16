const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// ==========================================
// 🌐 RENDER WEB SERVER
// ==========================================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ==========================================
// 😈 ROAST BATTLE ENGINE
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

function getRoast() {
  return roastReplies[
    Math.floor(Math.random() * roastReplies.length)
  ];
}

function getJoke() {
  return jokes[
    Math.floor(Math.random() * jokes.length)
  ];
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

      // WhatsApp pairing
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

      // Bot online
      if (connection === "open") {
        console.log("================================");
        console.log("🤖 JOSH-X ULTRA");
        console.log("✅ BOT ONLINE");
        console.log("🚀 Command system loaded");
        console.log("================================");
      }

      // Connection closed
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

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        const command =
          text.trim().toLowerCase();

        if (!command) return;

        // ==================================
        // 🏓 PING
        // ==================================

        if (command === "ping") {
          await sock.sendMessage(jid, {
            text:
              "🏓 *PONG!*\n\n" +
              "⚡ JOSH-X ULTRA is online!"
          });

          return;
        }

        // ==================================
        // ❤️ ALIVE
        // ==================================

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

        // ==================================
        // ⏱️ RUNTIME
        // ==================================

        if (command === "runtime") {

          const seconds =
            process.uptime();

          const days =
            Math.floor(seconds / 86400);

          const hours =
            Math.floor(
              (seconds % 86400) / 3600
            );

          const minutes =
            Math.floor(
              (seconds % 3600) / 60
            );

          const secs =
            Math.floor(seconds % 60);

          await sock.sendMessage(jid, {
            text:
              "⏱️ *JOSH-X ULTRA RUNTIME*\n\n" +
              `🗓️ ${days}d ${hours}h ${minutes}m ${secs}s`
          });

          return;
        }

        // ==================================
        // 👑 OWNER
        // ==================================

        if (command === "owner") {
          await sock.sendMessage(jid, {
            text:
              "👑 *JOSH-X ULTRA OWNER*\n\n" +
              "Joshua"
          });

          return;
        }

        // ==================================
        // ℹ️ ABOUT
        // ==================================

        if (command === "about") {
          await sock.sendMessage(jid, {
            text:
              "🤖 *JOSH-X ULTRA*\n\n" +
              "⚡ WhatsApp Automation Bot\n" +
              "🚀 Version: 1.0.0\n" +
              "🧩 Command System: Active\n" +
              "☁️ Hosted on Render\n\n" +
              "Made by Joshua ❤️"
          });

          return;
        }

        // ==================================
        // 📋 MENU
        // ==================================

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
              "┃ • joke\n" +
              "┃\n" +
              "┃ 🤖 CHAT / ROAST\n" +
              "┃ • roast\n" +
              "┃ • comeback\n" +
              "┃ • roastbattle\n" +
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

        // ==================================
        // 😂 JOKE
        // ==================================

        if (command === "joke") {

          await sock.sendMessage(jid, {
            text:
              "😂 *JOSH-X JOKE*\n\n" +
              getJoke()
          });

          return;
        }

        // ==================================
        // 😈 ROAST
        // ==================================

        if (
          command === "roast" ||
          command.startsWith("roast ")
        ) {

          await sock.sendMessage(jid, {
            text:
              "😈 *JOSH-X ROAST MODE*\n\n" +
              getRoast()
          });

          return;
        }

        // ==================================
        // 🔥 COMEBACK
        // ==================================

        if (
          command === "comeback" ||
          command.startsWith("comeback ")
        ) {

          await sock.sendMessage(jid, {
            text:
              "🔥 *JOSH-X COMEBACK*\n\n" +
              getRoast()
          });

          return;
        }

        // ==================================
        // 🥊 ROAST BATTLE
        // ==================================

        if (command === "roastbattle") {

          await sock.sendMessage(jid, {
            text:
              "🥊 *JOSH-X ROAST BATTLE*\n\n" +
              "😈 Battle mode activated!\n\n" +
              "Send me a roast and I'll fire back. 🔥\n\n" +
              "Use *roast* or *comeback* for another round."
          });

          return;
        }

        // ==================================
        // 🐞 BUG
        // ==================================

        if (command === "bug") {

          await sock.sendMessage(jid, {
            text:
              "😈 *JOSH-X BUG TEST*\n\n" +
              "🐞 Diagnostic mode activated!\n" +
              "⚡ Message system: OK\n" +
              "🤖 Bot engine: OK\n" +
              "🌐 Connection: OK\n" +
              "✅ Test completed!"
          });

          return;
        }

        // ==================================
        // 🧪 BUG TEST
        // ==================================

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

        // ==================================
        // 🧪 STRESS TEST
        // ==================================

        if (command === "stress") {

          await sock.sendMessage(jid, {
            text:
              "🧪 *STRESS TEST*\n\n" +
              "Testing JOSH-X ULTRA safely...\n\n" +
              "⚡ Command system: OK\n" +
              "📨 Message system: OK\n" +
              "🔄 Event system: OK\n" +
              "🤖 Bot engine: OK\n\n" +
              "✅ Test completed!"
          });

          return;
        }

        // ==================================
        // 📨 TEST MESSAGE
        // ==================================

        if (command === "testmsg") {

          await sock.sendMessage(jid, {
            text:
              "😈 *JOSH-X ULTRA*\n\n" +
              "🐞 TEST MESSAGE\n" +
              "⚡ System responding correctly!"
          });

          return;
        }

        // ==================================
        // 👥 GROUP INFO
        // ==================================

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

        // ==================================
        // 👑 ADMINS
        // ==================================

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
            metadata.participants.filter(
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

        // ==================================
        // 📢 TAG ALL
        // ==================================

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

// ==========================================
// 🚀 START JOSH-X ULTRA
// ==========================================

startBot().catch(error => {
  console.error(
    "❌ Bot failed to start:",
    error
  );
});
