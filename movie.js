const axios = require("./createAxios")()
const { JSDOM } = require("jsdom")
const { getImageId } = require("./image")

async function getMovieData(movieUrl, { skipNLastPages }) {
    movieUrl = new URL(movieUrl)
    let i = 1
    let imageUrls2d = []
    while (true) {
        movieUrl.searchParams.set("page", i)
        let currImageUrls = await getCurrPageImageUrls(movieUrl.toString())
        if (currImageUrls[0] === imageUrls2d.slice(0, -1)[0][0]) break
        imageUrls2d.push(currImageUrls)
        i++
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