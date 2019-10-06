/**
 * Factory function for saveStockList
 * @param {Object} deps
 * @param {Object} deps.Firestore The Firestore Lib
 * @param {Object} deps.credentials credentials for the database
 * @returns {Function} saveStockList
 */
exports.createSaveStockList = ({
	Firestore = require('@google-cloud/firestore'),
	credentials = require('../../secrets.json')
}) => {
	// Create instance of db
	const db = new Firestore(credentials)

	/**
	 * This function takes an array and saves them to the database in batches.
	 * @param {Array<Object>} stocks Array of stocks to be saved in the database.
	 * @returns {Array<Object>} The original array of stocks
	 */
	const saveStockList = async stocks => {
		const batchArr = [db.batch()]
		let batchIndex = 0
		let opNumber = 0

		const dbCollection = await db.collection('stocks')

		console.log('Starting to write to database')
		stocks.forEach(stock => {
			// Batches are limited to 500 ops so
			if (opNumber === 498) {
				batchArr.push(db.batch())
				batchIndex++
				opNumber = 0
			}

			// Add the doc to the batch
			const docRef = dbCollection.doc(stock.id.toString())
			batchArr[batchIndex].set(docRef, stock)

			// Add op
			opNumber++
		})

		// Commit all the batches
		const promiseArr = batchArr.map(batch => batch.commit())
		await Promise.all(promiseArr)
		console.log('Stocks saved to database')
		return stocks
	}
	return saveStockList
}

/**
 * Factory function for savePricesToStock.
 *
 * @param {Object} deps
 * @param {Object} deps.Firestore The Firestore Lib
 * @param {Object} deps.credentials credentials for the database
 * @returns {Function} savePricesToStock
 */
exports.createSavePricesToStock = ({
	Firestore = require('@google-cloud/firestore'),
	credentials = require('../../secrets.json')
}) => {
	// Create instance of db
	const db = new Firestore(credentials)

	/**
	 * This function adds the price data to the stock document in the database.
	 * @param {Object} params
	 * @param {Number} params.id Id of the stock to update
	 * @param {Array<Object>} params.priceData The data to add to the document
	 * @param {String} params.name The name, only used for logging
	 * @returns {Object} Reference to the database document.
	 */
	const savePricesToStock = async ({ id, priceData, name }) => {
		const dbCollection = await db.collection('stocks')

		const docRef = dbCollection.doc(id.toString())
		const docData = await docRef.get()

		if (!docData.exists)
			throw new Error(`Stock ${name} with id: ${id} does not exist in database`)
		else {
			const objToSave = {
				priceData,
				lastPricePoint: priceData[priceData.length - 1].date,
				updatedAt: new Date()
			}

			await docRef.update(objToSave)
			console.log(`${name} price data saved to database`)
			return docRef
		}
	}
	return savePricesToStock
}
