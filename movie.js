const axios = require("./createAxios")()
const { JSDOM } = require("jsdom")
const { getImageId } = require("./image")

async function getMovieData(movieUrl, { numOfPromises, skipNLastPages }) {
    movieUrl = new URL(movieUrl)
    let imageUrls2d = []
    let i = 0
    while (true) {
        movieUrl.searchParams.set("page", ++i)
        const currImageUrls = await getCurrPageImageUrls(movieUrl.toString())
        if (currImageUrls.find(el => el.length === 0)) break
        imageUrls2d.push(currImageUrls)
    }
    if (skipNLastPages) imageUrls2d = imageUrls2d.slice(0, -skipNLastPages)

    movieUrl.searchParams.delete("page")
    return {
        movieTitle: new JSDOM((await axios(movieUrl.toString())).data)
            .window.document
            .querySelector(".post_title ").textContent //Cringe css selector lol
            .trim()
            .replace("Images from ", '')
            .replace(': ', ' - ') //File system don't like colons which usually appear in movies' title
            .replace('/', '-'), //F*** you Fate series
        movieUrl,
        imageUrls: imageUrls2d.flat()
    }

}

async function getCurrPageImageUrls(movieUrl) {
    const { data: pageHtml } = await axios(movieUrl)
    const { document } = (new JSDOM(pageHtml)).window
    const imagesContainerEl = document.querySelector(".post_title ").nextElementSibling
    return [...imagesContainerEl.querySelectorAll("img.imageFade")].map(el => `https://cdni.fancaps.net/file/fancaps-movieimages/${getImageId(el.src)}.jpg`)
}

module.exports = { getMovieData, getCurrPageImageUrls }