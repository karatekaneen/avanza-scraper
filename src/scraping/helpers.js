/**
 * Take a timeout to wait for content to load
 * @param {Number} milliseconds number of milliseconds to wait
 * @returns {Promise<void>}
 */
exports.sleep = milliseconds => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/**
 * Takes a two-dimensional array that looks like:
 * ```javascript
 * const dataArr = [
 * 	[
 * 		15151651351351, // Stringified date
 * 		432143543 // Some data
 * 	]
 * ]
 * ```
 *
 * and returns an object:
 * ```javascript
 * const output = {
 * 	"15151651351351": {
 * 		date: 15151651351351,
 * 		data: 432143543
 * 	}
 * }
 * ```
 *
 * @param {Array<Array>} dataArr 2D array
 * @returns {Object} Object with the date as key
 */
exports.dateToKey = dataArray => {
	return dataArray.reduce((acc, [date, data]) => {
		acc[date] = { date, data }
		return acc
	}, {})
}
