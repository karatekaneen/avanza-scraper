import { PriceData, SiteSecurity } from './interfaces'
import { Firestore } from '@google-cloud/firestore'

class DatabaseWrapper {
	#db: Firestore

	constructor({ _Firestore = Firestore } = {}) {
		this.#db = new _Firestore()
	}

	public async updatePricedata(
		{
			priceData,
			id,
			name,
			replace,
			type,
		}: {
			priceData: PriceData[]
			id: number
			name: string
			replace: boolean
			type: string
		},
		{ db = this.#db } = {}
	): Promise<FirebaseFirestore.WriteResult> {
		let newDays: number

		const doc = db.collection('prices').doc(id.toString())
		const docRef = await doc.get()

		if (!docRef.exists) {
			console.warn(`Stock ${name} with id: ${id} does not exist in database`)
		}

		const objToSave = docRef.exists ? docRef.data() : {}

		objToSave.updatedAt = new Date()
		objToSave.type = type

		if (replace) {
			newDays = priceData.length
			objToSave.priceData = priceData
		} else {
			const mergedData = this.mergePriceData(objToSave.priceData, priceData)
			newDays = mergedData.newDays
			objToSave.priceData = mergedData.priceData
		}

		objToSave.lastPricePoint = objToSave.priceData[priceData.length - 1].date

		const writePromise = docRef.exists ? doc.update(objToSave) : doc.set(objToSave)
		const response = await writePromise

		console.log(`${name} - Found ${newDays} datapoints.`)
		return response
	}

	private mergePriceData(
		existingData: PriceData[] = [],
		newData: PriceData[]
	): { priceData: PriceData[]; newDays: number } {
		const priceMap = new Map(
			existingData.map((x) => {
				const date = typeof x.date === 'string' ? x.date : new Date(x.date).toISOString() // Convert the date to an ISO string if it isn't a string already (used to be numbers in database)

				return [date, { ...x, date }]
			})
		)

		let newDays = 0

		newData.forEach((day) => {
			if (!priceMap.has(day.date)) {
				newDays++
			}

			priceMap.set(day.date, day)
		})

		return { priceData: [...priceMap.values()], newDays }
	}

	public async saveSummaries(
		{ securities, type }: { securities: SiteSecurity[]; type: string },
		{ db = this.#db } = {}
	): Promise<FirebaseFirestore.WriteResult[]> {
		const dbCollection = db.collection('securities')

		const writeResults = Promise.all(
			securities.map((sec) => dbCollection.doc(sec.id.toString()).set({ ...sec, type }))
		)

		return writeResults
	}

	public async wipeDatabase(): Promise<void> {
		const resp = await this.#db.collection('index-prices').listDocuments()
		const resp2 = await this.#db.collection('stocks').listDocuments()
		const resp3 = await this.#db.collection('indices').listDocuments()
		const resp4 = await this.#db.collection('stock-prices').listDocuments()
		const resp5 = await this.#db.collection('stock-helpers').listDocuments()
		await Promise.all(resp.map((doc) => doc.delete()))
		console.log(1)
		await Promise.all(resp2.map((doc) => doc.delete()))
		console.log(2)
		await Promise.all(resp3.map((doc) => doc.delete()))
		console.log(3)
		await Promise.all(resp4.map((doc) => doc.delete()))
		console.log(4)
		await Promise.all(resp5.map((doc) => doc.delete()))
		console.log(5)
		console.log('deleted')
	}
}

export default DatabaseWrapper
