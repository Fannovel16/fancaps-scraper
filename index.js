const { getSeriesData } = require("./handleSeries")
const { getEpisodeDataset } = require("./handleEpisode")
const divineArrEqually = require("./divineArrEqually")
const { downloadImage } = require("./handleImage")
const createAxios = require("./createAxios")
const fs = require("fs")
const { ArgumentParser } = require('argparse')
const { version } = require('./package.json')
const path = require("path")


async function main({ seriesUrl, saveDir, numOfPromises, skipNLastPages, writeMetadata, dontDownloadImages }) {
    if (numOfPromises < 1) throw new Error(`Invaild --numOfPromises=${numOfPromises}`)

    const { seriesTitle, episodes } = await getSeriesData(seriesUrl)
    const episodeDataset = await runPromises({
        task: "getEpisodeDataset",
        dataset: episodes,
        metadata: { seriesTitle, skipNLastPages },
        numOfPromises
    })

    if (writeMetadata) fs.writeFileSync("metadata.json", JSON.stringify(episodeDataset, null, 4))
    if (dontDownloadImages) return

    if (!saveDir) saveDir = `./fancaps-images/${seriesTitle}`
    for (const { episodeTitle } of episodeDataset) {
        const episodePath = path.resolve(saveDir, episodeTitle)
        if (!fs.existsSync(episodePath)) fs.mkdirSync(episodePath, { recursive: true })
    }
    let imageDataset = []
    for (const { episodeTitle, imageUrls } of episodeDataset) {
        imageDataset.push(...imageUrls.map(imageUrl => ({ episodeTitle, imageUrl })))
    }
    await runPromises({ task: "downloadImages", dataset: imageDataset, metadata: { saveDir }, numOfPromises })
}

function parseArg() {
    const parser = new ArgumentParser({
        description: "FanCaps-Scrapper"
    })

    parser.add_argument('-v', '--version', { action: 'version', version });
    parser.add_argument("--seriesUrl", {
        required: true,
        type: "str",
        help: "The url of the series you want to download images from, not the episode url (e.g. https://fancaps.net/anime/showimages.php?33224-Bocchi_the_Rock)"
    })
    parser.add_argument("--saveDir", {
        required: false,
        type: "str",
        help: "The location to save images, the default value is ./fancaps-images/title of series (e.g. ./fancaps-images/Bocchi The Rock)"
    })
    parser.add_argument("--numOfPromises", {
        required: false,
        type: "int",
        help: "The number of promise to use (imagine it is similar to multi-threading), should be <= 75 due to Cloudflare CDN's hidden rate limit I guess",
        default: 50
    })
    parser.add_argument("--skipNLastPages", {
        required: false,
        type: "int",
        help: "Skip n last pages so most of credit frames won't be downloaded",
        default: 2
    })

    parser.add_argument("--writeMetadata", {
        required: false,
        action: "store_true",
        help: "Write episodeDataset to metadata.json"
    })

    parser.add_argument("--dontDownloadImages", {
        required: false,
        action: "store_true"
    })
    return parser.parse_args()
}

async function runPromises({ task, dataset, numOfPromises, metadata }) {
    const workerDataset = divineArrEqually(dataset, numOfPromises)
    let workerPromises = []
    for (const workerData of workerDataset) {
        workerPromises.push((async () => {
            let re = []
            for (const data of workerData) {
                if (task === "getEpisodeDataset") re.push(await getEpisodeDataset(data, metadata))
                if (task === "downloadImages") {
                    const axios = createAxios()
                    re.push(await downloadImage(axios, data, metadata))
                }
            }
            return re
        })())
    }
    return (await Promise.all(workerPromises)).flat(2)
}


console.dir(parseArg())
try {
    main(parseArg())
} catch (e) {
    console.log(e.toString())
}
