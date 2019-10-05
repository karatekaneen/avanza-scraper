exports.createSaveStockList = ({ Firestore = require('@google-cloud/firestore'), credentials }) => {
	// Create instance of db
	const db = new Firestore(credentials)

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
			const docRef = dbCollection.doc(stock.id)
			batchArr[batchIndex].set(docRef, stock)

			// Add op
			opNumber++
		})

		// Commit all the batches
		const promiseArr = batchArr.map(batch => batch.commit())
		await Promise.all(promiseArr)
		console.log('Stocks saved to database')
	}
	return saveStockList
}
