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

  if (req.url === "/health") {
    return res.end("OK");
  }

  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ==========================================
// 🤖 JOSH-X ULTRA
// ==========================================

const VERSION = "2.1.0";

// ==========================================
// 😂 ROASTS
// ==========================================

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

function getRoast() {
  return roasts[Math.floor(Math.random() * roasts.length)];
}

// ==========================================
// 😂 JOKES
// ==========================================

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

function getJoke() {
  return jokes[Math.floor(Math.random() * jokes.length)];
}

// ==========================================
// ⏱️ BOT START TIME
// ==========================================

const startTime = Date.now();

function getRuntime() {
  const seconds = Math.floor(
    (Date.now() - startTime) / 1000
  );

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

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
    browser: [
      "JOSH-X ULTRA",
      "Chrome",
      "1.0.0"
    ],
    printQRInTerminal: false
  });

  // ==========================================
  // 💾 SAVE LOGIN DATA
  // ==========================================

  sock.ev.on("creds.update", saveCreds);

  // ==========================================
  // 🔑 PAIRING CODE
  // ==========================================

  let pairingRequested = false;

  sock.ev.on("connection.update", async (update) => {

    const {
      connection,
      lastDisconnect,
      qr
    } = update;

    // ------------------------------------------
    // PAIRING CODE
    // ------------------------------------------

    if (
      qr &&
      !state.creds.registered &&
      !pairingRequested
    ) {

      pairingRequested = true;

      try {

        const phoneNumber =
          process.env.PHONE_NUMBER;

        if (!phoneNumber) {

          console.log(
            "⚠️ PHONE_NUMBER environment variable is missing."
          );

        } else {

          const cleanNumber =
            phoneNumber.replace(/\D/g, "");

          console.log(
            "🔑 Requesting WhatsApp pairing code..."
          );

          const code =
            await sock.requestPairingCode(
              cleanNumber
            );

          console.log(
            `🔑 PAIRING CODE: ${code}`
          );

          console.log(
            "📱 Enter this code in WhatsApp > Linked Devices."
          );
        }

      } catch (error) {

        pairingRequested = false;

        console.error(
          "❌ Pairing code error:",
          error.message
        );
      }
    }

    // ------------------------------------------
    // CONNECTED
    // ------------------------------------------

    if (connection === "open") {

      console.log("");
      console.log(
        "===================================="
      );
      console.log(
        "🚀 JOSH-X ULTRA IS ONLINE!"
      );
      console.log(
        "===================================="
      );
      console.log(
        `📦 Version: ${VERSION}`
      );
      console.log(
        "🤖 WhatsApp connection established."
      );
      console.log("");
    }

    // ------------------------------------------
    // CONNECTION CLOSED
    // ------------------------------------------

    if (connection === "close") {

      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      const loggedOut =
        statusCode === DisconnectReason.loggedOut;

      console.log(
        "❌ WhatsApp connection closed."
      );

      console.log(
        "Status:",
        statusCode
      );

      if (loggedOut) {

        console.log(
          "🚪 WhatsApp logged out."
        );

        console.log(
          "⚠️ Delete the auth folder and pair again."
        );

      } else {

        console.log(
          "🔄 Reconnecting in 3 seconds..."
        );

        setTimeout(() => {
          startBot();
        }, 3000);
      }
    }
  });

  // ==========================================
  // 💬 MESSAGE HANDLER
  // ==========================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const msg = messages[0];

        if (!msg || !msg.message) {
          return;
        }

        const jid = msg.key.remoteJid;

        if (!jid) {
          return;
        }

        // Ignore status updates
        if (jid === "status@broadcast") {
          return;
        }

        // ======================================
        // 📝 GET MESSAGE TEXT
        // ======================================

        const message =
          msg.message;

        let text = "";

        if (message.conversation) {

          text = message.conversation;

        } else if (
          message.extendedTextMessage
        ) {

          text =
            message.extendedTextMessage.text;

        } else if (
          message.imageMessage?.caption
        ) {

          text =
            message.imageMessage.caption;

        } else if (
          message.videoMessage?.caption
        ) {

          text =
            message.videoMessage.caption;
        }

        if (!text) {
          return;
        }

        text = text.trim();

        // ======================================
        // 🎯 COMMAND
        // ======================================

        const command =
          text
            .split(" ")[0]
            .toLowerCase();

        const args =
          text
            .split(" ")
            .slice(1);

        const query =
          args.join(" ");

        // ======================================
        // 🏓 PING
        // ======================================

        if (command === "ping") {

          const start = Date.now();

          await sock.sendMessage(jid, {
            text: "🏓 Pinging..."
          });

          const speed =
            Date.now() - start;

          await sock.sendMessage(jid, {
            text:
              `🏓 *PONG!*\n\n` +
              `⚡ Speed: ${speed}ms`
          });

          return;
        }

        // ======================================
        // ❤️ ALIVE
        // ======================================

        if (command === "alive") {

          await sock.sendMessage(jid, {
            text:
              `╭━━━〔 🤖 JOSH-X ULTRA 〕━━━╮\n` +
              `┃\n` +
              `┃ 🟢 Status: ONLINE\n` +
              `┃ 📦 Version: ${VERSION}\n` +
              `┃ ⚡ Runtime: ${getRuntime()}\n` +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━╯`
          });

          return;
        }

        // ======================================
        // ⏱️ RUNTIME
        // ======================================

        if (
          command === "runtime" ||
          command === "uptime"
        ) {

          await sock.sendMessage(jid, {
            text:
              `⏱️ *JOSH-X ULTRA RUNTIME*\n\n` +
              `${getRuntime()}`
          });

          return;
        }

        // ======================================
        // 👑 OWNER
        // ======================================

        if (command === "owner") {

          await sock.sendMessage(jid, {
            text:
              `👑 *JOSH-X ULTRA OWNER*\n\n` +
              `Developer: Joshua\n` +
              `Bot: JOSH-X ULTRA\n` +
              `Version: ${VERSION}`
          });

          return;
        }

        // ======================================
        // ℹ️ ABOUT
        // ======================================

        if (command === "about") {

          await sock.sendMessage(jid, {
            text:
              `🤖 *JOSH-X ULTRA*\n\n` +
              `A WhatsApp automation bot.\n\n` +
              `⚡ Fast\n` +
              `🛠️ Powerful\n` +
              `🚀 Always improving\n\n` +
              `Version: ${VERSION}`
          });

          return;
        }

        // ======================================
        // 📋 MENU
        // ======================================

        if (
          command === "menu" ||
          command === "help"
        ) {

          await sock.sendMessage(jid, {
            text:
              `╭━━━〔 🤖 JOSH-X ULTRA 〕━━━╮\n` +
              `┃\n` +
              `┃ 👋 *WELCOME!*\n` +
              `┃\n` +
              `┃ 📌 *GENERAL*\n` +
              `┃ • ping\n` +
              `┃ • alive\n` +
              `┃ • runtime\n` +
              `┃ • owner\n` +
              `┃ • about\n` +
              `┃ • botinfo\n` +
              `┃ • status\n` +
              `┃\n` +
              `┃ 🖼️ *PROFILE*\n` +
              `┃ • getpp\n` +
              `┃ • getpp @user\n` +
              `┃\n` +
              `┃ 👥 *GROUP*\n` +
              `┃ • groupinfo\n` +
              `┃ • groupid\n` +
              `┃ • admins\n` +
              `┃ • listmembers\n` +
              `┃ • tagall\n` +
              `┃\n` +
              `┃ 🛠️ *TOOLS*\n` +
              `┃ • echo <text>\n` +
              `┃ • say <text>\n` +
              `┃ • quote\n` +
              `┃ • fact\n` +
              `┃\n` +
              `┃ 😂 *FUN*\n` +
              `┃ • joke\n` +
              `┃ • roast\n` +
              `┃ • comeback\n` +
              `┃ • roastbattle\n` +
              `┃ • 8ball <question>\n` +
              `┃ • truth\n` +
              `┃ • dare\n` +
              `┃\n` +
              `┃ 🧪 *TEST*\n` +
              `┃ • testmsg\n` +
              `┃ • bug\n` +
              `┃ • bugtest\n` +
              `┃ • stress\n` +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━╯`
          });

          return;
        }

        // ======================================
        // 📊 STATUS
        // ======================================

        if (command === "status") {

          await sock.sendMessage(jid, {
            text:
              `📊 *BOT STATUS*\n\n` +
              `🟢 WhatsApp: Connected\n` +
              `🟢 Render: Running\n` +
              `🟢 Bot: Online\n` +
              `📦 Version: ${VERSION}\n` +
              `⏱️ Runtime: ${getRuntime()}`
          });

          return;
        }

        // ======================================
        // 🤖 BOT INFO
        // ======================================

        if (command === "botinfo") {

          await sock.sendMessage(jid, {
            text:
              `🤖 *JOSH-X ULTRA INFO*\n\n` +
              `📦 Name: JOSH-X ULTRA\n` +
              `🔢 Version: ${VERSION}\n` +
              `⚙️ Engine: Baileys\n` +
              `🌐 Server: Render\n` +
              `🟢 Status: Online`
          });

          return;
        }

        // ======================================
        // 🗣️ ECHO
        // ======================================

        if (command === "echo") {

          if (!query) {

            await sock.sendMessage(jid, {
              text: "❌ Usage: echo <text>"
            });

            return;
          }

          await sock.sendMessage(jid, {
            text: query
          });

          return;
        }

        // ======================================
        // 🗣️ SAY
        // ======================================

        if (command === "say") {

          if (!query) {

            await sock.sendMessage(jid, {
              text: "❌ Usage: say <text>"
            });

            return;
          }

          await sock.sendMessage(jid, {
            text:
              `🗣️ ${query}`
          });

          return;
        }

        // ======================================
        // 🖼️ GET PROFILE PICTURE
        // ======================================

        if (command === "getpp") {

          try {

            let targetJid = jid;

            // If command is used in a group,
            // default to the person who sent it.
            if (jid.endsWith("@g.us")) {

              targetJid =
                msg.key.participant || jid;
            }

            // Check for mentioned user
            const mentioned =
              message.extendedTextMessage
                ?.contextInfo
                ?.mentionedJid;

            if (
              mentioned &&
              mentioned.length > 0
            ) {

              targetJid =
                mentioned[0];
            }

            console.log(
              `🖼️ Getting profile picture for ${targetJid}`
            );

            const ppUrl =
              await sock.profilePictureUrl(
                targetJid,
                "image"
              );

            if (!ppUrl) {

              await sock.sendMessage(jid, {
                text:
                  "❌ This user doesn't have a profile picture."
              });

              return;
            }

            await sock.sendMessage(jid, {
              image: {
                url: ppUrl
              },
              caption:
                `🖼️ *JOSH-X GETPP*\n\n` +
                `✅ Profile picture retrieved!`
            });

          } catch (error) {

            console.error(
              "❌ GETPP ERROR:",
              error.message
            );

            await sock.sendMessage(jid, {
              text:
                "❌ Unable to retrieve the profile picture.\n\n" +
                "The user may have restricted their profile picture privacy."
            });
          }

          return;
        }

        // ======================================
        // 😂 JOKE
        // ======================================

        if (command === "joke") {

          await sock.sendMessage(jid, {
            text: getJoke()
          });

          return;
        }

        // ======================================
        // 🔥 ROAST
        // ======================================

        if (command === "roast") {

          await sock.sendMessage(jid, {
            text: getRoast()
          });

          return;
        }

        // ======================================
        // 💥 COMEBACK
        // ======================================

        if (command === "comeback") {

          const comebacks = [
            "😂 That's the best you got?",
            "🔥 Try again when your brain reconnects.",
            "💀 Bro really thought that was a comeback.",
            "🤣 Nice attempt. Almost impressive.",
            "😎 I would respond seriously, but you already lost."
          ];

          const reply =
            comebacks[
              Math.floor(
                Math.random() *
                comebacks.length
              )
            ];

          await sock.sendMessage(jid, {
            text: reply
          });

          return;
        }

        // ======================================
        // ⚔️ ROAST BATTLE
        // ======================================

        if (command === "roastbattle") {

          const battle = [
            "🔥 Round 1: Your confidence is stronger than your WiFi.",
            "💀 Round 2: Even autocorrect gives up on you.",
            "😂 Round 3: Your brain needs a software update.",
            "🤣 Final Round: Bro has been defeated by his own logic."
          ];

          await sock.sendMessage(jid, {
            text:
              `⚔️ *ROAST BATTLE*\n\n` +
              battle.join("\n")
          });

          return;
        }

        // ======================================
        // 🎱 8 BALL
        // ======================================

        if (command === "8ball") {

          if (!query) {

            await sock.sendMessage(jid, {
              text:
                "🎱 Ask me a question.\n\nExample:\n8ball Will I become rich?"
            });

            return;
          }

          const answers = [
            "🎱 Definitely.",
            "🎱 Yes.",
            "🎱 Most likely.",
            "🎱 Ask again later.",
            "🎱 Maybe.",
            "🎱 Don't count on it.",
            "🎱 Probably not.",
            "🎱 No."
          ];

          const answer =
            answers[
              Math.floor(
                Math.random() *
                answers.length
              )
            ];

          await sock.sendMessage(jid, {
            text:
              `🎱 *QUESTION*\n${query}\n\n` +
              `🔮 *ANSWER*\n${answer}`
          });

          return;
        }

        // ======================================
        // 🎯 TRUTH
        // ======================================

        if (command === "truth") {

          const truths = [
            "😏 What's the most embarrassing thing you've done?",
            "😂 Who was your first crush?",
            "👀 What's your biggest secret?",
            "🤣 What's the funniest lie you've told?",
            "😎 What's something nobody knows about you?"
          ];

          await sock.sendMessage(jid, {
            text:
              truths[
                Math.floor(
                  Math.random() *
                  truths.length
                )
              ]
          });

          return;
        }

        // ======================================
        // 🔥 DARE
        // ======================================

        if (command === "dare") {

          const dares = [
            "🔥 Send your funniest selfie.",
            "😂 Change your status to something funny.",
            "🤣 Send the last emoji you used 10 times.",
            "😎 Tell someone 'You are awesome.'",
            "💀 Send a completely random GIF."
          ];

          await sock.sendMessage(jid, {
            text:
              dares[
                Math.floor(
                  Math.random() *
                  dares.length
                )
              ]
          });

          return;
        }

        // ======================================
        // 💬 QUOTE
        // ======================================

        if (command === "quote") {

          const quotes = [
            "💡 Great things take time.",
            "🔥 Stay focused and keep building.",
            "🚀 Every expert was once a beginner.",
            "💪 Don't stop learning.",
            "😎 Build something you're proud of."
          ];

          await sock.sendMessage(jid, {
            text:
              quotes[
                Math.floor(
                  Math.random() *
                  quotes.length
                )
              ]
          });

          return;
        }

        // ======================================
        // 🧠 FACT
        // ======================================

        if (command === "fact") {

          const facts = [
            "🧠 Honey never spoils when properly stored.",
            "🌍 Earth is the third planet from the Sun.",
            "💻 The first computer mouse was made of wood.",
            "🐙 Octopuses have three hearts.",
            "⚡ Lightning is hotter than the surface of the Sun."
          ];

          await sock.sendMessage(jid, {
            text:
              facts[
                Math.floor(
                  Math.random() *
                  facts.length
                )
              ]
          });

          return;
        }

        // ======================================
        // 👥 GROUP INFO
        // ======================================

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
              `👥 *GROUP INFO*\n\n` +
              `📛 Name: ${metadata.subject}\n` +
              `👤 Members: ${metadata.participants.length}\n` +
              `🆔 ID: ${jid}`
          });

          return;
        }

        // ======================================
        // 🆔 GROUP ID
        // ======================================

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
              `🆔 *GROUP ID*\n\n${jid}`
          });

          return;
        }

        // ======================================
        // 👑 ADMINS
        // ======================================

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
                participant =>
                  participant.admin
              );

          if (admins.length === 0) {

            await sock.sendMessage(jid, {
              text:
                "❌ No admins found."
            });

            return;
          }

          let adminText =
            "👑 *GROUP ADMINS*\n\n";

          for (const admin of admins) {

            adminText +=
              `• @${admin.id.split("@")[0]}\n`;
          }

          await sock.sendMessage(jid, {
            text: adminText,
            mentions:
              admins.map(
                admin => admin.id
              )
          });

          return;
        }

        // ======================================
        // 👥 LIST MEMBERS
        // ======================================

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

          let memberText =
            `👥 *GROUP MEMBERS*\n\n`;

          const mentions = [];

          metadata.participants.forEach(
            (member, index) => {

              memberText +=
                `${index + 1}. @${member.id.split("@")[0]}\n`;

              mentions.push(member.id);
            }
          );

          await sock.sendMessage(jid, {
            text: memberText,
            mentions
          });

          return;
        }

        // ======================================
        // 📢 TAG ALL
        // ======================================

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

          let messageText =
            "📢 *JOSH-X TAGALL*\n\n";

          const mentions = [];

          for (
            const participant
            of metadata.participants
          ) {

            messageText +=
              `@${participant.id.split("@")[0]} `;

            mentions.push(
              participant.id
            );
          }

          await sock.sendMessage(jid, {
            text: messageText,
            mentions
          });

          return;
        }

        // ======================================
        // 🧪 TEST MESSAGE
        // ======================================

        if (command === "testmsg") {

          await sock.sendMessage(jid, {
            text:
              `🧪 *TEST MESSAGE*\n\n` +
              `✅ Message system working.\n` +
              `⚡ JOSH-X ULTRA is responding.`
          });

          return;
        }

        // ======================================
        // 🐛 BUG
        // ======================================

        if (command === "bug") {

          await sock.sendMessage(jid, {
            text:
              `🐛 *BUG TEST*\n\n` +
              `✅ Command received.\n` +
              `✅ Message handler working.\n` +
              `✅ Bot is online.`
          });

          return;
        }

        // ======================================
        // 🧪 BUG TEST
        // ======================================

        if (command === "bugtest") {

          await sock.sendMessage(jid, {
            text:
              `🧪 *BUGTEST*\n\n` +
              `Status: ✅ PASS\n` +
              `Connection: ✅ ACTIVE\n` +
              `Handler: ✅ ACTIVE`
          });

          return;
        }

        // ======================================
        // ⚡ STRESS TEST
        // ======================================

        if (command === "stress") {

          await sock.sendMessage(jid, {
            text:
              `⚡ *STRESS TEST*\n\n` +
              `1️⃣ Message system: ✅\n` +
              `2️⃣ Command system: ✅\n` +
              `3️⃣ Connection: ✅\n` +
              `4️⃣ Runtime: ${getRuntime()}\n\n` +
              `🚀 Test complete.`
          });

          return;
        }

      } catch (error) {

        console.error(
          "❌ MESSAGE HANDLER ERROR:",
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
