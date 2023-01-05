const { default: axios } = require("axios")
const randomUseragent = require('random-useragent')
const { default: axiosRetry } = require('axios-retry')

module.exports = () => {
    let re = axios.create({
        headers: {
            "User-Agent": randomUseragent.getRandom(ua => ["Chrome", "Firefox", "Safari"].includes(ua.browserName))
        }
    })
    axiosRetry(axios, { retries: 5, retryDelay: 500 })
    return re
}