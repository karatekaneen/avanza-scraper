/**
 * Take a timeout to wait for content to load
 * @param {Number} milliseconds number of milliseconds to wait
 * @returns {Promise<void>}
 */
exports.sleep = milliseconds => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}
