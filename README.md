# FanCaps-Scrapper

A Node.js async CLI scrapper for anime screenshots on https://fancaps.net.
README template from https://www.makeareadme.com/

## Installation

```bash
git clone https://github.com/Fannovel16/fancaps-scraper
cd fancaps-scraper
npm install
```

## Usage

```bash
node . [-h] [-v] \ 
    --seriesUrl SERIESURL \
    [--saveDir SAVEDIR] \
    [--numOfPromises NUMOFPROMISES] \
    [--skipNLastPages SKIPNLASTPAGES] \
    [--writeMetadata] \
    [--dontDownloadImages]
```
Arguments:
  * -h, --help            show this help message and exit
  * -v, --version         show program's version number and exit
  * --seriesUrl SERIESURL The url of the series you want to download images from, not the episode url<br>(e.g. https://fancaps.net/anime/showimages.php?33224-Bocchi_the_Rock)
  * --saveDir SAVEDIR     The location to save images, the default value is ./fancaps-images/title of series<br>(e.g. ./fancaps-images/Bocchi The Rock)
  * --numOfPromises NUMOFPROMISES The number of promise to use (imagine it is similar to multi-threading), must be <= 50 due to Cloudflare CDN's hidden rate limit
  * --skipNLastPages SKIPNLASTPAGES Skip n last pages so most of credit frames won't be downloaded
  * --writeMetadata         Write episodeDataset to metadata.json
  * --dontDownloadImages


## Contributing

I'm an ameatur programmer so when you make a pull request, plz explain it at a way that is easy to understand. 
Also I'm needing someone to refactor my code.

## License

[MIT](https://choosealicense.com/licenses/mit/)