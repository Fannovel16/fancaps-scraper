const { JSDOM } = require("jsdom")
const { getImageId } = require("./image")
const axios = require("./createAxios")()

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

const GET_EPISODE_PROMISE_AMOUNT = 20
async function getEpisodeDataset({ episodeTitle, episodeUrl }, { skipNLastPages = 2, seriesTitle }) {
    episodeUrl = new URL(episodeUrl)
    let i = 0
    let imageUrls2d = []
    while (true) {
        let currImageUrls2dPromises = []
        for (let j = 0; j < GET_EPISODE_PROMISE_AMOUNT; j++) {
            episodeUrl.searchParams.set("page", i + j)
            currImageUrls2dPromises.push(getCurrPageImageUrls(episodeUrl.toString()))
        }
        const currImageUrls2d = await Promise.all(currImageUrls2dPromises)
        imageUrls2d.push(...currImageUrls2d.filter(el => el.length))
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


module.exports = { getEpisodeDataset }