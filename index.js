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
const { createPriceScraper, createUpdateStockPrices } = require('./src/scraping/priceScraper')

const MODE = 'update'

if (MODE === 'initiate') {
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
					maxNumOfWorkers: 1,
					start: new Date('2019-09-15T23:59:59.000Z'),
					end: new Date('2019-09-30T23:59:59.000Z')
				}
			})
		})
		.catch(err => console.log(err))
} else if (MODE === 'update') {
	const updateStockPrices = createUpdateStockPrices({})
	updateStockPrices({ settings: { maxNumOfWorkers: 2 } })
}
