const { default: axios } = require("axios")
const randomUseragent = require('random-useragent')
const { default: axiosRetry } = require('axios-retry')

module.exports = () => {
    let re = axios.create({
        headers: {
            "User-Agent": randomUseragent.getRandom(ua => ["Chrome", "Firefox", "Safari"].includes(ua.browserName) && ua.osName === "Windows" && ua.osVersion === "10")
        }
    })
    axiosRetry(re, { retries: 10, retryDelay: 1000 })
    return re
}