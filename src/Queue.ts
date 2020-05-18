/**
 *	Executes an array of Promises with a maximum of simultaneous requests
 * @param {Array<Promise>} tasks Tasks to be performed. Must be promise-based.
 * @param {number} maxNumOfWorkers Default = 8. Maximum amount of simultaneous open requests
 */
export const createQueue = (
	tasks: Function[],
	maxNumOfWorkers: number = 8
): Promise<any | Error> => {
	let numOfWorkers = 0
	let taskIndex = 0

	return new Promise((done) => {
		const handleResult = (index: number) => (result: any) => {
			tasks[index] = result
			numOfWorkers--
			getNextTask()
		}

		const getNextTask = () => {
			console.log(
				`${((taskIndex / tasks.length) * 100).toFixed(1)}% - ${numOfWorkers} workers active`
			)

			if (numOfWorkers < maxNumOfWorkers && taskIndex < tasks.length) {
				tasks[taskIndex]().then(handleResult(taskIndex)).catch(handleResult(taskIndex))

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
