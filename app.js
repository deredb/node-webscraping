const puppeteer = require('puppeteer');
var path = require('path');
var detailsScraper = require('./detailsScraper');

const BASE_URL = 'https://www.ssga.com';
const ETF_PATH = 'us/en/individual/etfs/fund-finder';
const OUTFILE = path.join(__dirname, 'out.txt');
const etfsURL = path.join(BASE_URL, ETF_PATH);

/**
 * Use Puppeteer to scarp the etfs page, for basic info
 * i.e {name, ticker, detailsPath } . `detailsPath` provide a path
 * to the details page for each Etf
 *
 * @param { String } url to a list of ETFs page
 */
let getEtfs = async url => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitForSelector('td');
  const scrapResult = await page.evaluate(() => {
    let tempDataStore = [];
    let table = document.getElementsByTagName('tbody')[0];

    let rows = table.getElementsByTagName('tr');
    for (let row of rows) {
      let name = row.querySelector('.fundname a').textContent;
      let ticker = row.querySelector('.fundticker a').textContent;
      let detailsPath = row
        .querySelector('.fundname a')
        .getAttribute('href');

      tempDataStore.push({
        name,
        ticker,
        detailsPath,
      });
    }
    return tempDataStore;
  });

  await browser.close();
  return scrapResult;
};

/**
 * Helper:IIFE
 *
 * Iterate each etfs response objects and fetch their respective
 * details pages, and scrap each etf details info (top holidngs, sector weights)
 * Output the final response in a JSON to a file 'out.txt'
 *
 */
(function scrapToFile() {
  getEtfs(etfsURL).then(response => {
    var result = response.map(response => {
      return detailsScraper
        .fetchData(response, detailsScraper.parseHTML)
        .then(resolve => resolve)
        .then(out => out);
    });
    Promise.all(result).then(resolve =>
      detailsScraper.writeToFile(resolve, OUTFILE),
    );
  });
})();
