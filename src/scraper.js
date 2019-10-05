/* eslint-disable no-await-in-loop */
/**
 * Factory function for the scraper.
 * @param {Object} deps
 * @param {Function} deps.puppeteer The puppeteer library
 * @param {Object} deps.siteActions Collection of helper functions to extract data from the page
 * @param {Function} deps.sleep Sleep function
 */
exports.createScraper = ({
	puppeteer = require('puppeteer'),
	siteActions = require('./siteActions'),
	sleep = require('./helpers').sleep
}) => {
	/**
	 * This is the main scraper function.
	 * It loads the page, selects what lists to take the stocks from and extracts the data from the table.
	 *
	 * @param {Array<String>} listsToSave The lists we want to save
	 * @param {String} url Url to the page we want to scrape
	 * @param {Boolean} headless Run the browser in headless mode or not
	 * @returns {Array<Object>} Array with all the scraped data
	 */
	const scraper = async (
		listsToSave = ['Mid Cap Stockholm', 'Small Cap Stockholm'], // Large cap is chosen by default on the page
		url = 'https://www.avanza.se/aktier/lista.html',
		headless = true
	) => {
		// Destruct the site actions:
		const { openListMenu, selectActiveLists, showMoreStocks, extractTableData } = siteActions

		// Start the browser
		const browser = await puppeteer.launch({ headless })
		const page = await browser.newPage()
		await page.goto(url)
		console.log('Opening page')

		// Open the list menu:
		await page.evaluate(openListMenu)
		console.log('Opening list menu')

		// Select the lists we want
		await page.evaluate(selectActiveLists, listsToSave)
		console.log(`Selecting Large Cap Stockholm, ${listsToSave.join(', ')}`)

		// Click the "Show more" button as long as it exists
		let allStocksVisible = false
		while (!allStocksVisible) {
			// Click the button
			allStocksVisible = await page.evaluate(showMoreStocks)
			// Wait for the data to load. Didn't get `waitUntil: 'networkIdle0'` to work.
			await sleep(1000)
			console.log('Added more stocks - waiting')
		}
		console.log('All stocks loaded')

		// Extract table data:
		const stocks = await page.evaluate(extractTableData)
		console.log(`Found ${stocks.length} stocks`)

		await browser.close()
		return stocks
	}
	return scraper
}
