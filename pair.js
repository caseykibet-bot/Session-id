const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require('pino');
const {
    default: Brasho_Kish,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
} = require('maher-zubair-baileys');

const router = express.Router();

const audioUrls = [
    "https://files.catbox.moe/hpwsi2.mp3", "https://files.catbox.moe/xci982.mp3", 
    "https://files.catbox.moe/utbujd.mp3", "https://files.catbox.moe/w2j17k.m4a", 
    "https://files.catbox.moe/851skv.m4a", "https://files.catbox.moe/qnhtbu.m4a", 
    "https://files.catbox.moe/lb0x7w.mp3", "https://files.catbox.moe/efmcxm.mp3", 
    "https://files.catbox.moe/gco5bq.mp3", "https://files.catbox.moe/26oeeh.mp3", 
    "https://files.catbox.moe/a1sh4u.mp3", "https://files.catbox.moe/vuuvwn.m4a", 
    "https://files.catbox.moe/wx8q6h.mp3", "https://files.catbox.moe/uj8fps.m4a", 
    "https://files.catbox.moe/dc88bx.m4a", "https://files.catbox.moe/tn32z0.m4a", 
    "https://files.catbox.moe/9fm6gi.mp3", "https://files.catbox.moe/9h8i2a.mp3", 
    "https://files.catbox.moe/5pm55z.mp3", "https://files.catbox.moe/zjk77k.mp3", 
    "https://files.catbox.moe/fe5lem.m4a", "https://files.catbox.moe/4b1ohl.mp3"
];

// Helper function to remove files
function removeFile(filePath) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
}

// Route handler
router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number?.replace(/[^0-9]/g, '');

    if (!num) return res.status(400).send({ error: 'Invalid phone number provided' });

    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        const Pair_Code_By_Brasho_Kish = Brasho_Kish({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
            },
            printQRInTerminal: false,
            logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
            browser: ['Chrome (Linux)', '', ''],
        });

        if (!Pair_Code_By_Brasho_Kish.authState.creds.registered) {
            const code = await Pair_Code_By_Brasho_Kish.requestPairingCode(num);
            return res.send({ code });
        }

        Pair_Code_By_Brasho_Kish.ev.on('creds.update', saveCreds);
        Pair_Code_By_Brasho_Kish.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                // Wait for a short delay before proceeding
                await new Promise(resolve => setTimeout(resolve, 5000));

                const data = fs.readFileSync(`./temp/${id}/creds.json`);
                const b64data = Buffer.from(data).toString('base64');

                // Send session and random audio message
                const session = await Pair_Code_By_Brasho_Kish.sendMessage(Pair_Code_By_Brasho_Kish.user.id, { text: b64data });
                const randomAudioUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];
                await Pair_Code_By_Brasho_Kish.sendMessage(Pair_Code_By_Brasho_Kish.user.id, {
                    audio: { url: randomAudioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: true,
                    waveform: [100, 0, 100, 0, 100, 0, 100], // Optional waveform pattern
                    fileName: 'shizo',
                    contextInfo: {
                        mentionedJid: [Pair_Code_By_Brasho_Kish.user.id],
                        externalAdReply: {
                            title: 'Thanks for choosing Alpha Md happy deployment 💜',
                            body: 'Regards Keithkeizzah',
                            thumbnailUrl: 'https://i.imgur.com/vTs9acV.jpeg',
                            sourceUrl: 'https://whatsapp.com/channel/0029Vaan9TF9Bb62l8wpoD47',
                            mediaType: 1,
                            renderLargerThumbnail: true,
                        },
                    },
                }, { quoted: session });

                // Clean up after a short delay
                await new Promise(resolve => setTimeout(resolve, 100));
                await Pair_Code_By_Brasho_Kish.ws.close();
                removeFile(`./temp/${id}`);
            } else if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== 401) {
                // Handle disconnects with retry
                await new Promise(resolve => setTimeout(resolve, 10000));
                await router.get(); // Retry logic
            }
        });
    } catch (err) {
        console.error('Error occurred:', err);
        removeFile(`./temp/${id}`);
        if (!res.headersSent) {
            res.status(500).send({ error: 'Service Currently Unavailable' });
        }
    }
});

module.exports = router;
