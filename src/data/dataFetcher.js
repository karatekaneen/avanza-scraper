exports.createGetAllStocks = ({
	Firestore = require('@google-cloud/firestore'),
	credentials = require('../../secrets.json')
}) => {
	// Create instance of db
	const db = new Firestore(credentials)

	const getAllStocks = async () => {
		const stocks = await db.collection('stocks').get()
		return stocks
	}
	return getAllStocks
}
