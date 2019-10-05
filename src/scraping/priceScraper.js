exports.createPriceScraper = ({
	fetch = require('node-fetch'),
	parsePriceData = require('../data/dataParser').createParsePriceData({})
}) => {
	const priceScraper = async ({ orderbookId, start, end }) => {
		const requestBody = {
			orderbookId,
			chartType: 'CANDLESTICK',
			chartResolution: 'DAY',
			navigator: false,
			percentage: false,
			volume: true,
			owners: true,
			start,
			end,
			ta: [],
			compareIds: []
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
		const priceData = parsePriceData(await resp.json())

		console.log(priceData)
		return priceData
	}
	return priceScraper
}
