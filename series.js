const { JSDOM } = require("jsdom")
const axios = require("./createAxios")()

async function getSeriesData(seriesUrl) {
    seriesUrl = new URL(seriesUrl)
    let episodes = []
    let pageI = 0
    let seriesTitle
    while (true) {
        seriesUrl.searchParams.set('page', ++pageI)
        const { data: subPageHtml } = await axios(seriesUrl.toString())
        const { document } = (new JSDOM(subPageHtml)).window
        const currEpisodes = [...document.querySelectorAll("a[style='color:black;']")].map(el => ({
            episodeTitle: el.textContent.trim().replace("Images From ", ''),
            episodeUrl: new URL(el.href, "https://fancaps.net").toString()
        }))
        if (currEpisodes.length === 0) break
        episodes.push(...currEpisodes)

        if (!seriesTitle) {
            seriesTitle = document.querySelector("h1.post_title").textContent
                .replace("Viewing Popular Images From", '')
                .trim() //Get the only title
                .replace(': ', ' - ') //File system don't like colons which usually appear in shounen series' title
        }

    }

    seriesUrl.searchParams.delete("page")
    return { seriesTitle, episodes }
}

module.exports = { getSeriesData }