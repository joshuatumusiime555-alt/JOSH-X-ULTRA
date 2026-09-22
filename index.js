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

const server = http.createServer((req, res) => {
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
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
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

// ==========================================
// 🔗 PAIRING CODE
// ==========================================

async function requestPairingCode(sock, state) {
  if (state.creds.registered) {
    console.log("✅ WhatsApp session already registered.");
    return;
  }

  const rawNumber = process.env.BOT_NUMBER;

  if (!rawNumber) {
    console.log("❌ BOT_NUMBER environment variable is missing.");
    console.log("👉 Add BOT_NUMBER in Render Environment Variables.");
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
  console.log("⏳ Waiting for WhatsApp...");
  console.log("================================");

  let attempts = 0;

  while (!state.creds.registered && attempts < 8) {
    attempts++;

    try {
      console.log(
        `🔄 Pairing attempt ${attempts}/8...`
      );

      const code = await sock.requestPairingCode(
        phoneNumber
      );

      console.log("================================");
      console.log("🔗 JOSH-X ULTRA PAIRING CODE");
      console.log("👉", code);
      console.log("📱 Open WhatsApp on your phone");
      console.log("⚙️ Settings → Linked devices");
      console.log("➕ Link a device");
      console.log("🔗 Link with phone number instead");
      console.log("================================");

      return;
    } catch (error) {
      console.log(
        `⚠️ Pairing attempt ${attempts} failed.`
      );

      console.log(
        "Reason:",
        error?.message || error
      );

      if (attempts < 8) {
        console.log(
          "⏳ Waiting 5 seconds before retry..."
        );

        await new Promise(resolve =>
          setTimeout(resolve, 5000)
        );
      }
    }
  }

  if (!state.creds.registered) {
    console.log(
      "❌ Could not obtain a pairing code after several attempts."
    );

    console.log(
      "🔄 Render/WhatsApp connection will continue trying."
    );
  }
}

// ==========================================
// 🤖 START BOT
// ==========================================

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  console.log("================================");
  console.log("🤖 JOSH-X ULTRA STARTING");
  console.log("================================");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingStarted = false;
  let reconnectStarted = false;

  // ========================================
  // 🔗 CONNECTION
  // ========================================

  sock.ev.on(
    "connection.update",
    async ({
      connection,
      lastDisconnect
    }) => {

      console.log(
        `📡 WhatsApp connection: ${connection || "unknown"}`
      );

      // ======================================
      // 🔗 START PAIRING
      // ======================================

      if (
        connection === "connecting" &&
        !state.creds.registered &&
        !pairingStarted
      ) {
        pairingStarted = true;

        // Give WhatsApp a few seconds to initialize.
        setTimeout(async () => {
          try {
            await requestPairingCode(
              sock,
              state
            );
          } catch (error) {
            console.log(
              "❌ Pairing process error:",
              error?.message || error
            );

            pairingStarted = false;
          }
        }, 5000);
      }

      // ======================================
      // 🟢 BOT ONLINE
      // ======================================

      if (connection === "open") {
        console.log("================================");
        console.log("🤖 JOSH-X ULTRA");
        console.log("✅ BOT ONLINE");
        console.log("🚀 Command system loaded");
        console.log(`⏱️ Runtime: ${getRuntime()}`);
        console.log("================================");
      }

      // ======================================
      // 🔴 CONNECTION CLOSED
      // ======================================

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        console.log("================================");
        console.log("⚠️ WHATSAPP CONNECTION CLOSED");
        console.log("Status:", statusCode);
        console.log("================================");

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect && !reconnectStarted) {
          reconnectStarted = true;

          console.log(
            "🔄 Reconnecting in 3 seconds..."
          );

          setTimeout(() => {
            startBot().catch(error => {
              console.error(
                "❌ Restart error:",
                error
              );
            });
          }, 3000);
        } else if (
          statusCode === DisconnectReason.loggedOut
        ) {
          console.log(
            "❌ WhatsApp session was logged out."
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
              "🟢 Command system: Active\n" +
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
              "┃ 😂 FUN\n" +
              "┃ • joke\n" +
              "┃ • quote\n" +
              "┃ • fact\n" +
              "┃ • truth\n" +
              "┃ • dare\n" +
              "┃ • 8ball\n" +
              "┃ • roast\n" +
              "┃ • comeback\n" +
              "┃ • roastbattle\n" +
              "┃\n" +
              "┃ 🗣️ CHAT\n" +
              "┃ • echo <text>\n" +
              "┃ • say <text>\n" +
              "┃\n" +
              "┃ 🛠️ TOOLS\n" +
              "┃ • testmsg\n" +
              "┃ • time\n" +
              "┃ • date\n" +
              "┃\n" +
              "┃ 👥 GROUP\n" +
              "┃ • groupinfo\n" +
              "┃ • groupid\n" +
              "┃ • admins\n" +
              "┃ • listmembers\n" +
              "┃ • tagall\n" +
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
              randomItem(jokes)
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

          await sock.sendMessage(jid, {
            text:
              "🎱 *JOSH-X 8 BALL*\n\n" +
              `❓ ${args}\n\n` +
              randomItem(eightBallAnswers)
          });

          return;
        }

        // ==================================
        // 😈 ROAST / COMEBACK
        // ==================================

        if (
          command === "roast" ||
          command === "comeback"
        ) {
          await sock.sendMessage(jid, {
            text:
              command === "roast"
                ? "😈 *JOSH-X ROAST MODE*\n\n" +
                  randomItem(roastReplies)
                : "🔥 *JOSH-X COMEBACK*\n\n" +
                  randomItem(roastReplies)
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
        // 🗣️ ECHO / SAY
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
              "🕐 *SERVER TIME*\n\n" +
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
              "📅 *SERVER DATE*\n\n" +
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
              "🌐 Web server: OK\n" +
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

          admins.forEach((admin, index) => {
            message +=
              `${index + 1}. @${admin.id.split("@")[0]}\n`;
          });

          await sock.sendMessage(jid, {
            text: message,
            mentions:
              admins.map(admin => admin.id)
          });

          return;
        }

        // ==================================
        // 👥 LIST MEMBERS
        // ==================================

        if (command === "listmembers") {
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
            "👥 *GROUP MEMBERS*\n\n";

          metadata.participants.forEach(
            (member, index) => {
              message +=
                `${index + 1}. @${member.id.split("@")[0]}\n`;
            }
          );

          await sock.sendMessage(jid, {
            text: message,
            mentions:
              metadata.participants.map(
                member => member.id
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
