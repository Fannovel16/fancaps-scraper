const path = require('path')
const fs = require("fs")

/* //Sauce: https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
async function downloadImage(axios, imageUrl, saveDir = `${__dirname}/images`) {
    const writer = fs.createWriteStream(Path.resolve(saveDir, imageUrl.split('/').slice(-1)[0]))
    const response = await axios(imageUrl, { responseType: 'stream' })
    response.data.pipe(writer)
    await new Promise(re => setTimeout(re, 100))
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
} */
async function downloadImage(axios, { imageUrl, episodeTitle }, { saveDir, episodeTitle }) {
    const response = await axios(imageUrl, { responseType: "arraybuffer" })
    fs.writeFileSync(path.resolve(saveDir, episodeTitle, imageUrl.split('/').slice(-1)[0]), response.data)
}

module.exports = { downloadImage }