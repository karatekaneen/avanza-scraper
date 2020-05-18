import { PriceData, SiteSecurity } from './interfaces'
import { Firestore } from '@google-cloud/firestore'

class DatabaseWrapper {
	#db: Firestore

	constructor({ _Firestore = Firestore } = {}) {
		this.#db = new _Firestore({
			projectId: process.env.PROJECT_ID,
			keyFilename: process.env.CREDENTIALS_PATH,
		})
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

		const doc = db.collection(this.getPriceCollectionName(type)).doc(id.toString())
		const docRef = await doc.get()

		if (!docRef.exists) {
			console.warn(`Stock ${name} with id: ${id} does not exist in database`)
		}

		const objToSave = docRef.exists ? docRef.data() : {}

		objToSave.updatedAt = new Date()

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

	private getPriceCollectionName(type: string): string {
		if (type === 'index') {
			return 'index-prices'
		} else if (type === 'stock') {
			return 'stock-prices'
		} else {
			throw new Error('unknown type')
		}
	}

	public async saveSummaries(
		{ securities, type }: { securities: SiteSecurity[]; type: string },
		{ db = this.#db } = {}
	): Promise<FirebaseFirestore.WriteResult[]> {
		const dbCollection = db.collection(this.getSummaryCollectionName(type))

		const writeResults = Promise.all(
			securities.map((sec) => dbCollection.doc(sec.id.toString()).set(sec))
		)

		return writeResults
	}

	private getSummaryCollectionName(type: string): string {
		if (type === 'index') {
			return 'indices'
		} else if (type === 'stock') {
			return 'stocks'
		} else {
			throw new Error('unknown type')
		}
	}

	public async wipeDatabase(): Promise<void> {
		const resp = await this.#db.collection('index-prices').listDocuments()
		const resp2 = await this.#db.collection('stocks').listDocuments()
		await Promise.all(resp.map((doc) => doc.delete()))
		await Promise.all(resp2.map((doc) => doc.delete()))
		console.log('deleted')
	}
}

export default DatabaseWrapper
