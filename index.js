const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// Keep Render alive
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("JOSH-X ULTRA is running 🚀");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr && !state.creds.registered && !pairingRequested) {
      pairingRequested = true;
      const phoneNumber = process.env.BOT_NUMBER;

      if (!phoneNumber) {
        console.log("❌ BOT_NUMBER is not set!");
        return;
      }

      try {
        console.log("⏳ Requesting pairing code...");
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("================================");
        console.log("🔗 JOSH-X ULTRA PAIRING CODE");
        console.log("👉", code);
        console.log("================================");
      } catch (err) {
        console.log("❌ Pairing code error:", err.message);
        pairingRequested = false;
      }
    }

    if (connection === "open") {
      console.log("================================");
      console.log("🤖 JOSH-X ULTRA is ONLINE ✅");
      console.log("================================");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed");
      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        setTimeout(startBot, 3000);
      }
    }
  });

  // ====================== COMMANDS ======================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";
    const command = text.trim().toLowerCase();
    const from = msg.key.remoteJid;

    // ========== MAIN MENU ==========
    if (command === "menu" || command === "help") {
      await sock.sendMessage(from, {
        text: `┏━━❐◈  *JOSH-X ULTRA*  ◈
┃ ᴘʀᴇꜰɪx: [ none ]
┃ ᴏᴡɴᴇʀ: Joshua
┃ ᴍᴏᴅᴇ: 🔒 Private
┃ ᴘʟᴀᴛꜰᴏʀᴍ: ☁️ Render
┃ ᴠᴇʀꜱɪᴏɴ: v1.5.0
┗❐◈

┏━━❐◈  *GENERAL*  ◈
┃ • ping
┃ • alive
┃ • menu
┃ • owner
┗❐◈

┏━━❐◈  *BUG MENU*  ◈
┃ • bug
┃ • bug1
┃ • bug2
┃ • bug3
┃ • bug4
┃ • bug5
┗❐◈

┏━━❐◈  *RELIGION*  ◈
┃ • bible
┃ • quran
┃ • gita
┗❐◈

┏━━❐◈  *TOOLS*  ◈
┃ • info
┃ • runtime
┗❐◈

> JOSH-X ULTRA`
      });
    }

    // ========== GENERAL ==========
    if (command === "ping") {
      await sock.sendMessage(from, {
        text: "🏓 *Pong!*\n\n⚡ JOSH-X ULTRA is online!"
      });
    }

    if (command === "alive") {
      await sock.sendMessage(from, {
        text: `🤖 *JOSH-X ULTRA*\n\n✅ Status: Online\n⚡ Version: 1.5.0\n👑 Owner: Joshua`
      });
    }

    if (command === "owner") {
      await sock.sendMessage(from, {
        text: "👑 *Owner*\n\nJoshua\n\n_JOSH-X ULTRA_"
      });
    }

    // ========== BUG MENU ==========
    if (command === "bug" || command === "bugmenu") {
      await sock.sendMessage(from, {
        text: `┏━━❐◈  *😈 BUG MENU*  ◈
┃
┃ 🦠 *bug1* → Fake Virus
┃ 💀 *bug2* → System Crash
┃ 🔥 *bug3* → Self Destruct
┃ 👻 *bug4* → Ghost Mode
┃ ⚠️ *bug5* → Warning
┃
┗❐◈`
      });
    }

    if (command === "bug1") {
      await sock.sendMessage(from, {
        text: `⚠️ *VIRUS DETECTED!*\n\n🦠 Malware: JOSH-X.ULTRA.EXE\n📍 Device: Your phone\n\n_Just kidding 😈_\nYou're safe... for now.`
      });
    }

    if (command === "bug2") {
      await sock.sendMessage(from, {
        text: `💥 *SYSTEM CRASH*\n\nError: 0xJOSH-X\nStatus: Critical\n\n_Restarting..._\n\n✅ Just a prank 😈`
      });
    }

    if (command === "bug3") {
      await sock.sendMessage(from, {
        text: `🔥 *SELF DESTRUCT*\n\n10... 9... 8...\n\n_Nothing happened 😈_\nJust playing.`
      });
    }

    if (command === "bug4") {
      await sock.sendMessage(from, {
        text: `👻 *GHOST MODE ON*\n\nYou are now invisible...\n\n_Just kidding 😈_`
      });
    }

    if (command === "bug5") {
      await sock.sendMessage(from, {
        text: `⚠️ *WARNING*\n\nThis chat has been flagged by JOSH-X ULTRA.\nReason: Too much vibes 🔥\n\nStay safe 😈`
      });
    }

    // ========== RELIGION ==========
    if (command === "bible") {
      await sock.sendMessage(from, {
        text: `📖 *Bible Verse*\n\n"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."\n\n— Jeremiah 29:11`
      });
    }

    if (command === "quran") {
      await sock.sendMessage(from, {
        text: `🕌 *Quran Verse*\n\n"Indeed, with hardship comes ease."\n\n— Quran 94:6`
      });
    }

    if (command === "gita") {
      await sock.sendMessage(from, {
        text: `🕉️ *Bhagavad Gita*\n\n"You have the right to work, but never to the fruit of work."\n\n— Bhagavad Gita 2:47`
      });
    }

    // ========== TOOLS ==========
    if (command === "info") {
      await sock.sendMessage(from, {
        text: `🤖 *Bot Info*\n\nName: JOSH-X ULTRA\nVersion: 1.5.0\nPlatform: Render\nOwner: Joshua\nLibrary: Baileys`
      });
    }

    if (command === "runtime") {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      await sock.sendMessage(from, {
        text: `⏱️ *Runtime*\n\n${hours}h ${minutes}m ${seconds}s`
      });
    }
  });
}

startBot();
