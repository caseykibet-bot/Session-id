const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require('pino');
const {
  default: Brasho_Kish,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers
} = require('maher-zubair-baileys');

let router = express.Router();

// List of audio URLs to send randomly
const audioUrls = [
  "https://files.catbox.moe/hpwsi2.mp3",
  "https://files.catbox.moe/xci982.mp3",
  "https://files.catbox.moe/utbujd.mp3",
  "https://files.catbox.moe/w2j17k.m4a",
  "https://files.catbox.moe/851skv.m4a",
  "https://files.catbox.moe/qnhtbu.m4a",
  "https://files.catbox.moe/lb0x7w.mp3",
  "https://files.catbox.moe/efmcxm.mp3",
  "https://files.catbox.moe/gco5bq.mp3",
  "https://files.catbox.moe/26oeeh.mp3",
  "https://files.catbox.moe/a1sh4u.mp3",
  "https://files.catbox.moe/vuuvwn.m4a",
  "https://files.catbox.moe/wx8q6h.mp3",
  "https://files.catbox.moe/uj8fps.m4a",
  "https://files.catbox.moe/dc88bx.m4a",
  "https://files.catbox.moe/tn32z0.m4a",
  "https://files.catbox.moe/9fm6gi.mp3",
  "https://files.catbox.moe/9h8i2a.mp3",
  "https://files.catbox.moe/5pm55z.mp3",
  "https://files.catbox.moe/zjk77k.mp3",
  "https://files.catbox.moe/fe5lem.m4a",
  "https://files.catbox.moe/4b1ohl.mp3"
];

// Function to remove file if it exists
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
}

// Router endpoint
router.get('/', async (req, res) => {
  const id = makeid();
  let num = req.query.number;

  // Function to handle pairing code
  async function LEGACY_MD_PAIR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
    try {
      const Pair_Code_By_Brasho_Kish = Brasho_Kish({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: ["Chrome (Linux)", "", ""]
      });

      if (!Pair_Code_By_Brasho_Kish.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, '');
        const code = await Pair_Code_By_Brasho_Kish.requestPairingCode(num);
        if (!res.headersSent) {
          return res.send({ code });
        }
      }

      Pair_Code_By_Brasho_Kish.ev.on('creds.update', saveCreds);

      Pair_Code_By_Brasho_Kish.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;

        if (connection === "open") {
          await delay(5000);
          const data = fs.readFileSync(`./temp/${id}/creds.json`);
          await delay(800);
          const b64data = Buffer.from(data).toString('base64');
          const session = await Pair_Code_By_Brasho_Kish.sendMessage(Pair_Code_By_Brasho_Kish.user.id, { text: b64data });

          // Select a random audio URL
          const randomAudioUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];

          await Pair_Code_By_Brasho_Kish.sendMessage(Pair_Code_By_Brasho_Kish.user.id, { 
            audio: { url: randomAudioUrl },
            mimetype: 'audio/mpeg',
            ptt: true,
            waveform: [100, 0, 100, 0, 100, 0, 100], // Optional waveform pattern
            fileName: 'shizo',
            contextInfo: {
              mentionedJid: [Pair_Code_By_Brasho_Kish.user.id], // Mention the sender in the audio message
              externalAdReply: {
                title: 'Thanks for choosing Alpha Md happy deployment 💜',
                body: 'Regards Keithkeizzah',
                thumbnailUrl: 'https://i.imgur.com/vTs9acV.jpeg',
                sourceUrl: 'https://whatsapp.com/channel/0029Vaan9TF9Bb62l8wpoD47',
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });

          await delay(100);
          await Pair_Code_By_Brasho_Kish.ws.close();
          removeFile(`./temp/${id}`);
        } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
          await delay(1000);
          LEGACY_MD_PAIR_CODE();
        }
      });
    } catch (err) {
      console.error("Service restarted due to error: ", err);
      removeFile(`./temp/${id}`);
      if (!res.headersSent) {
        return res.send({ code: "Service Currently Unavailable" });
      }
    }
  }

  await LEGACY_MD_PAIR_CODE();
});

module.exports = router;

