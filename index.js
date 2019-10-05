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
const { createScraper } = require('./src/scraper')

const scraper = createScraper({})

scraper({}).then(stocks => {
	console.log('Scrape finished')

	stocks.forEach(s =>
		console.log(`Id: ${s.id}
	Name: ${s.name}
	List: ${s.list}
	linkName: ${s.linkName}
	
	`)
	)
})
