//@ts-check

import { Image, decode, GIF, Frame, TextLayout } from 'imagescript';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import { parse as twemojiParser } from 'twemoji-parser'
import fsButBad from 'fs';
//import fs from 'fs/promises';
const app = express();
const backgroundURL = `https://cdn.discordapp.com/attachments/742867591147683870/907078222045405214/360_F_200312294_v6Goq0112lTHA34ocz1h5a5zxNsAx5ni.png`
const circulo = new Image(100, 100).drawCircle(50, 50, 50, 0xAE7912ff);
const font = fsButBad.readFileSync(path.join('assets', 'font.ttf'));
const router = express.Router();
router.post('/start', async (req, res) => {
    console.log(req.body);
    const image = await generateImage(req.body);
    return res.end(await image.encode().then(Buffer.from));
});
app.listen(8080, () => console.log('Listening', 8080));
app.use(express.json());
app.use('/render', router);

/**
 * @param {string} url
 * @returns {Promise<Image|Frame>}
 */
async function decodeImage(url) {
    const x = await fetch(url);
    const x_1 = await x.arrayBuffer();
    //@ts-ignore
    const d = await decode(x_1, true);
    if (d instanceof GIF)
        return d[0];
    return d;
}

/**
 * 
 * @param {{users: {emoji: string; name: string}[]}} data 
 * @returns 
 */
async function generateImage(data = { users: [] }) {
    const { users } = data || { users: [] };
    const background = await decodeImage(backgroundURL);
    /**@type {{image: Image; text: Image}[]} */
    let loaded = [];
    if (users?.length) loaded = await Promise.all(users.map(resolveUser));
    background.resize(1200, 600);
    for (let i = 0; i < 8; i++) {
        const x = i % 4;
        const y = Math.floor(i / 4);
        background.composite(loaded[i]?.image || circulo, (x * 150) + 325, (y * 150) + 170);
        if (loaded[i]) background.composite(loaded[i].text, (x * 150) + 325, (y * 150) + 270);
    }
    return background;
}
/**
 * 
 * @param {{emoji: string; name: string; check?: boolean}} user
 */
async function resolveUser(user) {

    const mark = await fetch(twemojiParser(user.check ? '✅' : '❓')[0].url)
        .then(x => x.text())
        .then(x => Image.renderSVG(x, 30, Image.SVG_MODE_WIDTH))

    const layout = new TextLayout({ maxWidth: 130 });

    const image = await fetch(twemojiParser(user.emoji)[0].url)
        .then(x => x.text())
        .then(async x => {
            const img = new Image(100, 100);
            img.composite(await Image.renderSVG(x, 100, Image.SVG_MODE_WIDTH));
            img.composite(mark, 70, 70);
            return img;
        });

    const text = await Image.renderText(font, 20, user.name, 0x000000ff, layout);

    return { image, text }

};