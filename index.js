const { getSeriesData } = require("./series")
const { getMovieData } = require("./movie")
const { getEpisodeDataset } = require("./episode")
const divineArrEqually = require("./divineArrEqually")
const { downloadImage } = require("./image")
const createAxios = require("./createAxios")
const fs = require("fs")
const { ArgumentParser } = require('argparse')
const { version } = require('./package.json')
const path = require("path")
const NUM_OF_PROMISES_LIMIT = 75
const cliProgress = require('cli-progress')
const colors = require('ansi-colors')
const glob = require("glob")
const { createSpinner } = require("nanospinner")

function progressBarInterval(saveDir, imageDataset) {
    const bar = new cliProgress.SingleBar({
        format: `{percentage}%|${colors.cyan('{bar}')}| {value}/{total} [{duration_formatted}<{eta_formatted}, {speed} img/s]`,
        barCompleteChar: '█',
        barIncompleteChar: ' ',
        hideCursor: true
    })

    bar.start(imageDataset.length, 0, {
        speed: 0
    })
    
    let prevProgess = 0
    const interval = setInterval(async () => {
        const jpgFiles = await new Promise(re => glob(`${saveDir}/**/*.jpg`, (err, matches) => re(matches)))
        bar.update(jpgFiles.length, {
            speed: (jpgFiles.length - prevProgess) / 0.5
        })
        prevProgess = jpgFiles.length
        if (jpgFiles.length === imageDataset.length) {
            bar.stop()
            clearInterval(interval)
        }
    }, 500)
    return interval
}

async function main({ url, saveDir, numOfPromises, forceUnlimitedPromises, skipNLastPages, writeMetadata, readMetadata, dontDownloadImages }) {
    if (numOfPromises < 1) throw new Error(`--numOfPromises=${numOfPromises} is invalid cuz you can't have negative number of workers lol`)
    if (numOfPromises > NUM_OF_PROMISES_LIMIT && !forceUnlimitedPromises) {
        throw new Error(`--numOfPromises=${numOfPromises} is too big lol. Cloudflare won't like traffic from your network. Use --forceUnlimitedPromises to bypass (e.g. when you are running this script on Google Colab).`)
    }
    if (url.includes("https://fancaps.net/movies/MovieImages.php")) {
        return await handleMovie({ url, saveDir, numOfPromises, forceUnlimitedPromises, skipNLastPages, writeMetadata, readMetadata, dontDownloadImages })
    }
    if (url.includes("https://fancaps.net/anime/showimages.php")) {
        return await handleSeries({ url, saveDir, numOfPromises, forceUnlimitedPromises, skipNLastPages, writeMetadata, readMetadata, dontDownloadImages })
    }
    throw new Error(`${url} isn't url of series or movie on https://fancaps.net`)
}

async function handleSeries({ url, saveDir, numOfPromises, skipNLastPages, writeMetadata, readMetadata, dontDownloadImages }) {
    let spinner
    let seriesTitle, episodes, episodeDataset
    if (readMetadata) {
        episodeDataset = JSON.parse(fs.readFileSync("metadata.json", "utf-8"))
        seriesTitle = episodeDataset[0].seriesTitle
    }
    else {
        spinner = createSpinner("Get series data").start();
        ({ seriesTitle, episodes } = await getSeriesData(url))
        spinner.success()
        spinner = createSpinner("Get episode dataset").start()
        episodeDataset = await runPromises({
            task: "getEpisodeDataset",
            dataset: episodes,
            metadata: { seriesTitle, skipNLastPages },
            numOfPromises
        })
        spinner.success()
    }

    if (!readMetadata && writeMetadata) fs.writeFileSync("metadata.json", JSON.stringify(episodeDataset, null, 4))
    if (dontDownloadImages) return

    if (!saveDir) saveDir = `./fancaps-images/${seriesTitle}`
    for (const { episodeTitle } of episodeDataset) {
        const episodePath = path.resolve(saveDir, episodeTitle)
        if (!fs.existsSync(episodePath)) fs.mkdirSync(episodePath, { recursive: true })
    }
    let imageDataset = []
    for (const { episodeTitle, imageUrls } of episodeDataset) {
        for (const imageUrl of imageUrls) {
            imageDataset.push({
                imageUrl, title: episodeTitle
            })
        }
    }
    console.log("Download images...")
    progressBarInterval(saveDir, imageDataset)
    await runPromises({ task: "downloadImages", dataset: imageDataset, metadata: { saveDir }, numOfPromises })
}

async function handleMovie({ url, saveDir, numOfPromises, skipNLastPages }) {
    let spinner = createSpinner("Get movie data")
    const { movieTitle, imageUrls } = await getMovieData(url, { numOfPromises, skipNLastPages })
    spinner.success()
    if (!saveDir) saveDir = `./fancaps-images/${movieTitle}`
    if (!fs.existsSync(movieTitle)) fs.mkdirSync(saveDir, { recursive: true })
    let imageDataset = []
    for (const imageUrl of imageUrls) {
        imageDataset.push({
            imageUrl, title: ''
        })
    }
    console.log("Download images...")
    progressBarInterval(saveDir, imageDataset)
    await runPromises({ task: "downloadImages", dataset: imageDataset, metadata: { saveDir }, numOfPromises })
}

function parseArg() {
    const parser = new ArgumentParser({
        description: "FanCaps-Scrapper - A async scrapper for anime screenshots on fancaps.net"
    })

    parser.add_argument('-v', '--version', { action: 'version', version });
    parser.add_argument("--url", {
        required: true,
        type: "str",
        help: "The url of the series or movie you want to download images from, not the episode url (e.g. https://fancaps.net/anime/showimages.php?33224-Bocchi_the_Rock)"
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

console.log("Inputed arguments:")
console.dir(parseArg())
try {
    main(parseArg())
} catch (e) {
    console.log(e.toString())
}
