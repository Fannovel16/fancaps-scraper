const { JSDOM } = require("jsdom")
const axios = require("./createAxios")()

//I realised that image ids in a episdoe is not really continious lol
/*const FIRST_PAGE_TO_SEARCH = 18
async function getAllImageUrls(episodeUrl, skipNLastPages = 2) {
    console.log(episodeUrl)
    let lastPage = FIRST_PAGE_TO_SEARCH
    //A episode on FanCaps usully has more than 18 pages
    episodeUrl = new URL(episodeUrl)
    while (true) {
        episodeUrl.searchParams.set("page", lastPage)
        let imageUrls = await getCurrPageImageUrls(episodeUrl.toString())
        if (imageUrls.length === 0 && lastPage === FIRST_PAGE_TO_SEARCH) {
            lastPage--
        }
        if (imageUrls.length === 0 && lastPage > FIRST_PAGE_TO_SEARCH) {
            lastPage--
            break
        }
        if (imageUrls.length > 0 && lastPage >= FIRST_PAGE_TO_SEARCH) lastPage++
        if (imageUrls.length > 0 && lastPage < FIRST_PAGE_TO_SEARCH) {
            break
        }
    }
    if (skipNLastPages) lastPage -= skipNLastPages

    episodeUrl.searchParams.set("page", 1)
    const firstImageId = getImageId((await getCurrPageImageUrls(episodeUrl.toString()))[0])
    episodeUrl.searchParams.set("page", lastPage)
    const lastImageId = getImageId((await getCurrPageImageUrls(episodeUrl.toString())).at(-1))
    let imageUrls = []
    for (let i = firstImageId; i <= lastImageId; i++) {
        imageUrls.push(`https://ancdn.fancaps.net/${i}.jpg`)
    }
    return imageUrls
} */

const GET_EPISODE_PROMISE_AMOUNT = 5
async function getEpisodeDataset({ episodeTitle, episodeUrl }, { skipNLastPages = 2, seriesTitle }) {
    episodeUrl = new URL(episodeUrl)
    let i = 0
    let imageUrls2d = []
    while (true) {
        let currImageUrls2dPromises = []
        for (let j = 0; j < GET_EPISODE_PROMISE_AMOUNT; j++) {
            episodeUrl.searchParams.set("page", i)
            currImageUrls2dPromises.push(getCurrPageImageUrls(episodeUrl.toString()))
        }
        const currImageUrls2d = await Promise.all(currImageUrls2dPromises)
        imageUrls2d.push(...currImageUrls2d)
        if (currImageUrls2d.find(el => el.length === 0)) break
        i += GET_EPISODE_PROMISE_AMOUNT
    }
    if (skipNLastPages) imageUrls2d = imageUrls2d.slice(0, -skipNLastPages)
    episodeUrl.searchParams.delete("page")
    return {
        seriesTitle,
        episodeTitle,
        episodeUrl,
        imageUrls: imageUrls2d.flat()
    }
}

async function getCurrPageImageUrls(episodePageUrl) {
    const { data: pageHtml } = await axios(episodePageUrl)
    const { document } = (new JSDOM(pageHtml)).window
    const imagesContainerEl = document.evaluate(
        `//h3[contains(text(),"Episode Screencaps")]`,
        document.querySelector(".single_post_area"),
        null,
        0,
        0
    ).iterateNext().parentElement.parentElement.nextElementSibling.nextElementSibling
    return [...imagesContainerEl.querySelectorAll("img.imageFade")].map(el => `https://cdni.fancaps.net/file/fancaps-animeimages/${getImageId(el.src)}.jpg`)
}

function getImageId(imageUrl) {
    return new URL(imageUrl).pathname.match(/\d+/)
}

module.exports = { getEpisodeDataset, getCurrPageImageUrls, getImageId }