const cheerio = require('cheerio');
const fetch = require('node-fetch');
var fs = require('fs');

const BASE_URL = 'https://www.ssga.com';

/**
 * Takes etf basic info, and uses a callback to generate
 * extra details about the etf
 *
 * @param {Object} etf info {name, ticker, detailsPath}
 * @param {Function} callback parse the html data
 */
function fetchData(etfBasicInfo, callback) {
  return fetch(`${BASE_URL}${etfBasicInfo.detailsPath}`)
    .then(response => {
      return response.text();
    })
    .then(response => {
      return callback(etfBasicInfo, response);
    });
}

/**
 * Parse HTML data using cheerio, and scrap top 10 holdings
 * and sector weights from html body and generates Object
 * that merge with the etf initial data
 *
 * @param { Object } etfInitData that includes {name, ticker, detailsPath}
 * @param { Text } htmlBody that will be parsed
 */
function parseHTML(etfInitData, htmlBody) {
  let holdings = [];
  let sectors = [];
  let $ = cheerio.load(htmlBody);

  //cheerio select appropriate section to parse
  let scrapHoldings = $('tr', '.fund-top-holdings');
  let scrapSectorWeights = $('tr', '.fund-sector-breakdown');

  /** Scrap top 10 holdings*/
  scrapHoldings.each((i, elem) => {
    if (i == 0) return;
    let holdingDetails = {
      name: $(elem)
        .find('td.label')
        .text(),
      weight: $(elem)
        .find('td.weight')
        .text(),
    };
    holdings[i - 1] = holdingDetails;
  });
  /** Scrap sector weights */
  scrapSectorWeights.each((i, elem) => {
    //skip headings
    if (i == 0) return;
    let sectorDetails = {
      sector: $(elem)
        .find('td.label')
        .text(),
      weight: $(elem)
        .find('td.data')
        .text(),
    };
    //considers skipped index
    sectors[i - 1] = sectorDetails;
  });
  let extras = {
    topHoldings: holdings,
    sectorWeights: sectors,
  };

  return { ...etfInitData, ...extras };
}

/**
 * Write data to a json object to a filepath
 *
 * @param {JSON} data written to a file
 * @param { String } path where file stored
 */
function writeToFile(data, path) {
  try {
    const json = JSON.stringify(data, null);
    fs.writeFile(path, json, () => {
      console.log('writing complete');
    });
  } catch (error) {
    console.log(error);
  }
}

export { parseHTML, fetchData, writeToFile };
