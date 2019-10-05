exports.createParsePriceData = ({ dateToKey = require('../scraping/helpers').dateToKey }) => {
	const parsePriceData = json => {
		const { dataPoints, volumePoints, ownersPoints } = json
		const volume = dateToKey(volumePoints)
		const owners = dateToKey(ownersPoints)

		const priceData = dataPoints.map(([date, open, high, low, close]) => {
			return {
				date,
				open,
				high,
				low,
				close,
				volume: volume[date].data,
				owners: owners[date].data
			}
		})
		return priceData
	}
	return parsePriceData
}
