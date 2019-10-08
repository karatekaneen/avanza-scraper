/**
 * Factory function for `fetchPriceData`
 * @param {Object} deps
 * @param {Function} deps.fetch node-fetch library
 * @param {Function} deps.parsePriceData
 * @returns {Function} fetchPriceData
 */
exports.createFetchPriceData = ({
	fetch = require('node-fetch'),
	parsePriceData = require('../data/dataParser').createParsePriceData({})
}) => {
	/**
	 * Function to fetch price, volume and owner data from Avanza.
	 *
	 * @param {Object} params
	 * @param {Number} params.orderbookId id of the stock to fetch
	 * @param {Date} params.start First date to fetch - **this day will be included**
	 * @param {Date} params.end Last date to fetch **this day will be included**
	 * @returns {Array<Object>} Price data for the given stock
	 */
	const fetchPriceData = async ({
		orderbookId,
		timePeriod,
		start = new Date('2019-01-01T22:00:00.000Z'),
		end = new Date()
	}) => {
		const requestBody = {
			orderbookId,
			chartType: 'CANDLESTICK',
			chartResolution: 'DAY',
			navigator: false,
			percentage: false,
			volume: true,
			owners: true,
			ta: [],
			compareIds: []
		}

		if (timePeriod) requestBody.timePeriod = timePeriod
		else {
			try {
				requestBody.start = start.toISOString()
				requestBody.end = end.toISOString()
			} catch (err) {
				console.log(err)
				requestBody.start = new Date('2019-01-01T22:00:00.000Z').toISOString()
				requestBody.end = new Date().toISOString()
			}
		}

		const resp = await fetch(
			'https://www.avanza.se/ab/component/highstockchart/getchart/orderbook',
			{
				credentials: 'include',
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
					Accept: '*/*',
					'Accept-Language': 'sv-SE,sv;q=0.8,en-US;q=0.5,en;q=0.3',
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache',
					'X-Requested-With': 'XMLHttpRequest',
					Pragma: 'no-cache'
				},
				body: JSON.stringify(requestBody),
				method: 'POST'
			}
		)
		const json = await resp.json()
		const priceData = parsePriceData(json)

		return priceData
	}
	return fetchPriceData
}

/**
 * Factory function for `priceScraper`
 * @param {Object} deps
 * @param {Function} deps.fetchPriceData Function to download data
 * @param {Function} deps.savePricesToStock Database handler
 * @param {Function} deps.createQueue Limiting the amount of open requests
 * @returns {Function} priceScraper
 */
exports.createPriceScraper = ({
	fetchPriceData = this.createFetchPriceData({}),
	savePricesToStock = require('../data/dataSaver').createSavePricesToStock({}),
	createQueue = require('./helpers').createQueue
}) => {
	/**
	 * This is the main function that handles the workflow of fetching the price data and
	 * save it to the stock in the db.
	 *
	 * TODO Error handling
	 *
	 * @param {Object} params
	 * @param {Array<Object>} params.stocks Array of stocks to fetch price data about
	 * @param {Object} params.settings Settings about the data fetching
	 * @param {Date} params.settings.start First date to include in the data
	 * @param {Date} params.settings.end Last date to include in the data
	 * @param {Object} params.settings.maxNumOfWorkers Max of simultaneous open requests
	 * @returns {void}
	 */
	const priceScraper = async ({ stocks, settings }) => {
		// Loop over the stocks to create the tasks
		const queueArr = stocks.map(({ id, name, lastPricePoint }) => {
			let start = settings.start

			if (lastPricePoint) start = new Date(lastPricePoint)
			// The things needed for a valid request
			const request = {
				start,
				end: settings.end,
				orderbookId: id
			}
			// Return a function that returns a function call that is promise based. This is to be able to control the number of simultaneous open requests.
			return async () => {
				console.log(`${name} - Downloading data`)
				const priceData = await fetchPriceData(request)

				console.log(`${name} - Download complete`)
				return savePricesToStock({ priceData, id, name })
			}
		})

		// Work through the queue
		const taskResults = await createQueue(queueArr, settings.maxNumOfWorkers)

		// Find errors
		const errors = taskResults.filter(task => task instanceof Error)
		console.log(
			`Processing complete - ${taskResults.length - errors.length} successful - ${
				errors.length
			} failures`
		)

		errors.forEach(err => console.log(err))
	}
	return priceScraper
}

exports.createUpdateStockPrices = ({
	fetchPriceData = this.createFetchPriceData({}),
	getAllStocks = require('../data/dataFetcher').createGetAllStocks({}),
	savePricesToStock = require('../data/dataSaver').createSavePricesToStock({}),
	createQueue = require('./helpers').createQueue
}) => {
	const updateStockPrices = async ({ settings }) => {
		const stocks = []

		console.log('Fetches all stocks')
		const docRefs = await getAllStocks()
		docRefs.forEach(doc => stocks.push(doc.data()))
		console.log('All stocks fetched')

		const queueArr = stocks.map(({ id, name, lastPricePoint, priceData }) => {
			const start = new Date(lastPricePoint)

			// The things needed for a valid request
			const request = {
				timePeriod: 'month',
				orderbookId: id
			}

			// Return a function that returns a function call that is promise based. This is to be able to control the number of simultaneous open requests.
			const output = async () => {
				// Fetch data and filter out the one that are older than last input
				const newPriceData = (await fetchPriceData(request)).filter(x => {
					return new Date(x.date) > start
				})

				if (newPriceData.length > 0) {
					console.log(`${name} - Found ${newPriceData.length} new datapoints`)

					// Filter all data so we don't have any corrupt OHLCV data
					const cleanedData = [...priceData, ...newPriceData].filter(
						d => d.close && d.open && d.high && d.low && d.volume
					)

					// Save to DB
					return savePricesToStock({ priceData: cleanedData, id, name })
				} else {
					console.log(`${name} - Found no new data ${priceData.length}`)
					return Promise.resolve(true)
				}
			}
			return output
		})

		// Work through the queue
		const taskResults = await createQueue(queueArr, settings.maxNumOfWorkers)
		// Find errors
		const errors = taskResults.filter(task => task instanceof Error)
		console.log(
			`Processing complete - ${taskResults.length - errors.length} successful - ${
				errors.length
			} failures`
		)

		errors.forEach(err => console.log(err))
	}
	return updateStockPrices
}
