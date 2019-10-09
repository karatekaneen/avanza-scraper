/*
This is cleanup function for when the data gets fubar
const Firestore = require('@google-cloud/firestore')
const credentials = require('../../secrets.json')
// Create instance of db
const db = new Firestore(credentials)

db.collection('stocks')
	.get()
	.then(snapshot =>
		snapshot.forEach(doc => {
			db.collection('stocks')
				.doc(doc.id)
				.update({
					priceData: [],
					lastPricePoint: 0,
					mostRecentData: {}
				})
				.then(() => console.log(`cleaned ${doc.id}`))
		})
	)
*/
