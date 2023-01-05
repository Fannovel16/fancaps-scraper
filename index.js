const { getSeriesData } = require("./handleSeries")
const { getEpisodeDataset } = require("./handleEpisode")
const divineArrEqually = require("./divineArrEqually")
const { downloadImage } = require("./handleImage")
const createAxios = require("./createAxios")
const fs = require("fs")
const { ArgumentParser } = require('argparse')
const { version } = require('./package.json')
const path = require("path")
const NUM_OF_PROMISES_LIMIT = 75


async function main({ seriesUrl, saveDir, numOfPromises, forceUnlimitedPromises, skipNLastPages, writeMetadata, readMetadata, dontDownloadImages }) {
    if (numOfPromises < 1) throw new Error(`--numOfPromises=${numOfPromises} is invalid cuz you can't have negative number of workers lol`)
    if (numOfPromises > NUM_OF_PROMISES_LIMIT && !forceUnlimitedPromises) {
        throw new Error(`--numOfPromises=${numOfPromises} is too big lol. Cloudflare won't like traffic from your network. Use --forceUnlimitedPromises to bypass (e.g. when you are running this script on Google Colab).`)
    }

    let seriesTitle, episodes, episodeDataset
    if (readMetadata) {
        episodeDataset = JSON.parse(fs.readFileSync("metadata.json", "utf-8"))
        seriesTitle = episodeDataset[0].seriesTitle
    }
    else {
        ({ seriesTitle, episodes } = await getSeriesData(seriesUrl))
        episodeDataset = await runPromises({
            task: "getEpisodeDataset",
            dataset: episodes,
            metadata: { seriesTitle, skipNLastPages },
            numOfPromises
        })
    }

    if (!readMetadata && writeMetadata) fs.writeFileSync("metadata.json", JSON.stringify(episodeDataset, null, 4))
    if (dontDownloadImages) return

    if (!saveDir) saveDir = `./fancaps-images/${seriesTitle}`
    for (const { episodeTitle, imageUrls } of episodeDataset) {
        const episodePath = path.resolve(saveDir, episodeTitle)
        if (!fs.existsSync(episodePath)) fs.mkdirSync(episodePath, { recursive: true })
        await runPromises({ task: "downloadImages", dataset: imageUrls, metadata: { saveDir, episodeTitle }, numOfPromises })
    }
}

function parseArg() {
    const parser = new ArgumentParser({
        description: "FanCaps-Scrapper - A async scrapper for anime screenshots on fancaps.net"
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
        help: `The number of promises to use (imagine it is similar to multi-threading). A error will be thrown if it > ${NUM_OF_PROMISES_LIMIT} due to Cloudflare CDN's hidden rate limit unless --forceUnlimitedPromises is passed`,
        default: NUM_OF_PROMISES_LIMIT
    })
    parser.add_argument("--forceUnlimitedPromises", {
        required: false,
        action: "store_true",
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

    parser.add_argument("--readMetadata", {
        required: false,
        action: "store_true",
        help: "Read episodeDataset from metadata.json"
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
