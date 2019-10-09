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
 * Doing it this way prevents the search algo from going full O(N^2) and instead O(2N).
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

/**
 *	Executes an array of Promises with a maximum of simultaneous requests
 * @param {Array<Promise>} tasks Tasks to be performed. Must be promise-based.
 * @param {number} maxNumOfWorkers Default = 8. Maximum amount of simultaneous open requests
 */
exports.createQueue = (tasks, maxNumOfWorkers = 4) => {
	let numOfWorkers = 0
	let taskIndex = 0

	return new Promise(done => {
		const handleResult = index => result => {
			tasks[index] = result
			numOfWorkers--
			getNextTask()
		}
		const getNextTask = () => {
			console.log(
				`${((taskIndex / tasks.length) * 100).toFixed(1)}% - ${numOfWorkers} workers active`
			)
			if (numOfWorkers < maxNumOfWorkers && taskIndex < tasks.length) {
				tasks[taskIndex]()
					.then(handleResult(taskIndex))
					.catch(handleResult(taskIndex))
				taskIndex++
				numOfWorkers++
				getNextTask()
			} else if (numOfWorkers === 0 && taskIndex === tasks.length) {
				done(tasks)
			}
		}
		getNextTask()
	})
}
