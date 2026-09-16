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
              "🚀 Version: 2.0.0"
          });

          return;
        }

        // ==================================
        // ⏱️ RUNTIME
        // ==================================

        if (
          command === "runtime" ||
          command === "uptime"
        ) {

          await sock.sendMessage(jid, {
            text:
              "⏱️ *JOSH-X ULTRA RUNTIME*\n\n" +
              `🗓️ ${getRuntime()}`
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
              "🚀 Version: 2.0.0\n" +
              "🧩 Command System: Active\n" +
              "☁️ Hosted on Render\n\n" +
              "Made by Joshua ❤️"
          });

          return;
        }

        // ==================================
        // 📊 STATUS
        // ==================================

        if (command === "status") {

          await sock.sendMessage(jid, {
            text:
              "📊 *JOSH-X ULTRA STATUS*\n\n" +
              "🟢 Bot: Online\n" +
              "🟢 WhatsApp: Connected\n" +
              "🟢 Commands: Active\n" +
              "🟢 Render: Running\n" +
              `⏱️ Uptime: ${getRuntime()}`
          });

          return;
        }

        // ==================================
        // 🤖 BOT INFO
        // ==================================

        if (command === "botinfo") {

          await sock.sendMessage(jid, {
            text:
              "🤖 *JOSH-X ULTRA INFO*\n\n" +
              "👑 Owner: Joshua\n" +
              "⚡ Version: 2.0.0\n" +
              "🟢 Status: Online\n" +
              "☁️ Platform: Render\n" +
              "🟢 Engine: Node.js\n" +
              "🧩 Baileys: Active"
          });

          return;
        }

        // ==================================
        // 📋 MENU / HELP
        // ==================================

        if (
          command === "menu" ||
          command === "help"
        ) {

          await sock.sendMessage(jid, {
            text:
              "╭━━〔 🤖 JOSH-X ULTRA 〕━━╮\n" +
              "┃\n" +
              "┃ ⚡ GENERAL\n" +
              "┃ • ping\n" +
              "┃ • alive\n" +
              "┃ • runtime\n" +
              "┃ • uptime\n" +
              "┃ • status\n" +
              "┃ • owner\n" +
              "┃ • about\n" +
              "┃ • botinfo\n" +
              "┃\n" +
              "┃ 👥 GROUP\n" +
              "┃ • groupinfo\n" +
              "┃ • groupid\n" +
              "┃ • admins\n" +
              "┃ • listmembers\n" +
              "┃ • tagall\n" +
              "┃\n" +
              "┃ 🛠️ TOOLS\n" +
              "┃ • testmsg\n" +
              "┃ • joke\n" +
              "┃ • quote\n" +
              "┃ • fact\n" +
              "┃ • time\n" +
              "┃ • date\n" +
              "┃\n" +
              "┃ 🤖 CHAT\n" +
              "┃ • echo <text>\n" +
              "┃ • say <text>\n" +
              "┃ • 8ball <question>\n" +
              "┃\n" +
              "┃ 😂 FUN\n" +
              "┃ • truth\n" +
              "┃ • dare\n" +
              "┃ • roast\n" +
              "┃ • comeback\n" +
              "┃ • roastbattle\n" +
              "┃\n" +
              "┃ 🧪 TEST\n" +
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
        // 💫 QUOTE
        // ==================================

        if (command === "quote") {

          await sock.sendMessage(jid, {
            text:
              "💫 *JOSH-X QUOTE*\n\n" +
              randomItem(quotes)
          });

          return;
        }

        // ==================================
        // 🧠 FACT
        // ==================================

        if (command === "fact") {

          await sock.sendMessage(jid, {
            text:
              "🧠 *JOSH-X FACT*\n\n" +
              randomItem(facts)
          });

          return;
        }

        // ==================================
        // 🎱 8 BALL
        // ==================================

        if (command === "8ball") {

          if (!args) {
            await sock.sendMessage(jid, {
              text:
                "🎱 Ask me a question.\n\n" +
                "Example:\n" +
                "*8ball will I become successful?*"
            });

            return;
          }

          const answers = [
            "🎱 Definitely yes.",
            "🎱 Most likely.",
            "🎱 Absolutely.",
            "🎱 Ask again later.",
            "🎱 Hard to tell.",
            "🎱 Probably not.",
            "🎱 My answer is no.",
            "🎱 The future is uncertain."
          ];

          await sock.sendMessage(jid, {
            text:
              "🎱 *JOSH-X 8 BALL*\n\n" +
              `❓ ${args}\n\n` +
              randomItem(answers)
          });

          return;
        }

        // ==================================
        // 😈 ROAST
        // ==================================

        if (
          command === "roast" ||
          command === "comeback"
        ) {

          await sock.sendMessage(jid, {
            text:
              command === "roast"
                ? "😈 *JOSH-X ROAST MODE*\n\n" +
                  getRoast()
                : "🔥 *JOSH-X COMEBACK*\n\n" +
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
        // 🎯 TRUTH
        // ==================================

        if (command === "truth") {

          await sock.sendMessage(jid, {
            text:
              "🎯 *TRUTH*\n\n" +
              randomItem(truths)
          });

          return;
        }

        // ==================================
        // 😈 DARE
        // ==================================

        if (command === "dare") {

          await sock.sendMessage(jid, {
            text:
              "😈 *DARE*\n\n" +
              randomItem(dares)
          });

          return;
        }

        // ==================================
        // 🗣️ ECHO
        // ==================================

        if (
          command === "echo" ||
          command === "say"
        ) {

          if (!args) {
            await sock.sendMessage(jid, {
              text:
                `🗣️ Usage: *${command} your text*`
            });

            return;
          }

          await sock.sendMessage(jid, {
            text:
              `🗣️ ${args}`
          });

          return;
        }

        // ==================================
        // 🕐 TIME
        // ==================================

        if (command === "time") {

          const now = new Date();

          await sock.sendMessage(jid, {
            text:
              "🕐 *CURRENT SERVER TIME*\n\n" +
              now.toLocaleTimeString()
          });

          return;
        }

        // ==================================
        // 📅 DATE
        // ==================================

        if (command === "date") {

          const now = new Date();

          await sock.sendMessage(jid, {
            text:
              "📅 *CURRENT DATE*\n\n" +
              now.toLocaleDateString()
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
        // 🆔 GROUP ID
        // ==================================

        if (command === "groupid") {

          if (!jid.endsWith("@g.us")) {

            await sock.sendMessage(jid, {
              text:
                "❌ This command only works in groups."
            });

            return;
          }

          await sock.sendMessage(jid, {
            text:
              "🆔 *GROUP ID*\n\n" +
              jid
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

        
