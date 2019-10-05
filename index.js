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
const secretData = require('./secrets.json')
const { createScrapeStocks } = require('./src/scraping/stockScraper')
const { createSaveStockList } = require('./src/data/dataSaver')
const { createPriceScraper } = require('./src/scraping/priceScraper')

const saveStockList = createSaveStockList({ credentials: secretData })

const priceScraper = createPriceScraper({})

const scrapeStocks = createScrapeStocks({})

// scrapeStocks({})
// 	.then(stocks => {
// 		console.log(`Scrape finished - Found ${stocks.length} stocks`)

// 		/*
// 	stocks.forEach(s =>
// 		console.log(`Id: ${s.id}
// 	Name: ${s.name}
// 	List: ${s.list}
// 	linkName: ${s.linkName}

// 	`)
// 	)
// 	*/
// 		return saveStockList(stocks)
// 	})
// 	.then(x => {
// 		console.log('Processing complete')
// 	})
priceScraper({
	start: '2019-09-05T22:00:00.000Z',
	end: '2019-10-03T20:59:00.000Z',
	orderbookId: 26268
})
