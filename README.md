# FanCaps-Scrapper

A Node.js async CLI scrapper for anime screenshots on https://fancaps.net.
README template from https://www.makeareadme.com/

## Installation

```bash
git clone https://github.com/Fannovel16/fancaps-scraper
cd fancaps-scraper
npm install
cd ..
```

## Usage
### CLI syntax
```bash
node fancaps-scraper [-h] [-v] \ 
    --seriesUrl SERIESURL \
    [--saveDir SAVEDIR] \
    [--numOfPromises NUMOFPROMISES] \
    [--forceUnlimitedPromises] \
    [--skipNLastPages SKIPNLASTPAGES] \
    [--writeMetadata] \
    [--readMetadata] \
    [--dontDownloadImages] \
```
Arguments:
  * -h, --help:            show this help message and exit
  * -v, --version:         show program's version number and exit
  * `--url URL`: The url of the series or movie you want to download images from, not the episode url.<br>Any kind of url that starts with `https://fancaps.net/movies/MovieImages.php` or `https://fancaps.net/anime/showimages.php` will be accepted e.g.:
  ** https://fancaps.net/anime/showimages.php?33224-Bocchi_the_Rock
  ** https://fancaps.net/movies/MovieImages.php?name=Fate_Stay_Night_Heaven_s_Feel_I_Presage_Flower_2017&movieid=2666
  ** https://fancaps.net/movies/MovieImages.php?movieid=2666
  * `--saveDir SAVEDIR`:     The location to save images, the default value is ./fancaps-images/title of series<br>(e.g. ./fancaps-images/Bocchi The Rock)
  * `--numOfPromises NUMOFPROMISES`: The number of promises to use (imagine it is similar to multi-threading).<br>A error will be thrown if it > 75 due to Cloudflare CDN's hidden rate limit unless --forceUnlimitedPromises is passed
  * `--forceUnlimitedPromises`
  * `--skipNLastPages SKIPNLASTPAGES`: Skip n last pages so most of credit frames won't be downloaded
  * `--writeMetadata`:       Write episodeDataset to metadata.json
  * `--readMetadata`:        Read episodeDataset from metadata.json
  * --dontDownloadImages
  * --colab: Add line break to the progress bar if the env is Colab

### Result folder architecture
#### Episode
```
$saveDir
├── Episode 1
│   ├── intId.jpg
│   ├── anotherIntId.jpg
│   ├── ...
├── Episode 2
│   ├── intId.jpg
│   ├── anotherIntId.jpg
│   ├── ...
├── Episode ...
```
For example: 
```bash
node fancaps-scraper --seriesUrl="https://fancaps.net/anime/showimages.php?33224-Bocchi_the_Rock"
```
Should give the following result:
```
./fancaps-images/Bocchi the Rock!
├───Episode 1
│   ├── 22361835.jpg
│   ├── 22361837.jpg
│   ├── 22361838.jpg
│   ├── ...
│   ├── 22362709.jpg
├───Episode 2
│   ├──22363017.jpg
│   ├──22363020.jpg
│   ├──22363022.jpg
│   ├── ...
│   ├── ...
│   ├── 22364001.jpg
├───Episode 3
├───Episode 4
├───Episode 5
├───Episode 6
├───Episode 7
├───Episode 8
├───Episode 9
├───Episode 10
├───Episode 11
└───Episode 12
```
#### Movie
```
$saveDir
├── intId.jpg
├── anotherIntId.jpg
├── ...
```

## Contributing

I'm an ameatur programmer so when you make a pull request, plz explain it at a way that is easy to understand. 
Also I'm needing someone to refactor my code.

## License

[MIT](https://choosealicense.com/licenses/mit/)