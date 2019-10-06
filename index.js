/**
 * # Avanza Scraper
 *
 * ## Introduction
 * @description This app scrapes all the stocks from Avanzas page of stock lists. It extracts the `id` and `linkName` properties which are needed to fetch the price data later on. It also grabs the name and which list the stock belongs to.
 *
 * ## Usage
 *
 * For basic usage and scrape the default lists it is only needed to run `index.js`.
 *
 */
const AvanzaScraper = {}
const { createScrapeStocks } = require('./src/scraping/stockScraper')
const { createSaveStockList } = require('./src/data/dataSaver')
const { createPriceScraper } = require('./src/scraping/priceScraper')

const saveStockList = createSaveStockList({})

const priceScraper = createPriceScraper({})

const scrapeStocks = createScrapeStocks({})

scrapeStocks({})
	.then(stocks => {
		console.log(`Scrape finished - Found ${stocks.length} stocks`)
		return saveStockList(stocks)
	})
	.then(stocks => {
		priceScraper({
			stocks,
			settings: {
				maxNumOfWorkers: 4,
				start: new Date('2009-10-15T23:59:59.000Z'),
				end: new Date('2019-10-04T23:59:59.000Z')
			}
		})
	})
