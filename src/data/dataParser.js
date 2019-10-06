/**
 * Factory function for `parcePriceData`
 *
 * @param {Object} deps
 * @param {Function} deps.dateToKey Assings the date as the object key to avoid O(N^2) and instead get O(N*2)
 * @returns {Function} parsePriceData
 */
exports.createParsePriceData = ({ dateToKey = require('../scraping/helpers').dateToKey }) => {
	/**
	 * This parses the data from the Avanza API to proper objects.
	 * Output object looks like:
	 *
	 * ```javascript
	 * const output = [
	 * 	{
	 * 		open: 123,
	 * 		high: 125,
	 * 		low: 121,
	 * 		close: 123,
	 * 		volume: 374298, // # Stocks traded
	 * 		owners: 4200 // # owners on Avanza
	 * 	}
	 * ]
	 * ```
	 *
	 * @param {Object} json The price data from the API response
	 * @param {Array<Array>} json.dataPoints The array of price data originally provided,
	 * @param {Array<Array>} json.volumePoints Array of date and volume traded on that day
	 * @param {Array<Array>} json.ownersPoints Array of date and number of owners on Avanza on that date
	 * @returns {Array<Object>} The parsed price data.
	 */
	const parsePriceData = json => {
		const { dataPoints, volumePoints, ownersPoints } = json

		// Set the date as key in an object
		const volumeData = dateToKey(volumePoints)
		const ownersData = dateToKey(ownersPoints)

		// Add the data to the object
		const priceData = dataPoints.map(([date, open, high, low, close]) => {
			let volume = null
			let owners = null

			if (volumeData[date]) volume = volumeData[date].data
			if (ownersData[date]) owners = ownersData[date].data

			return {
				date,
				open,
				high,
				low,
				close,
				volume,
				owners
			}
		})
		return priceData
	}
	return parsePriceData
}
