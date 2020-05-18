import { SiteSecurity, ScrapeSettings, PriceData } from './interfaces'
import fetch from 'node-fetch'
import { createQueue } from './Queue'
import DatabaseWrapper from './DatabaseWrapper'

interface PeriodSettings {
	timePeriod?: string
	start?: Date
	end?: Date
}

interface AvanzaPeriodSettings {
	timePeriod?: string
	start?: string
	end?: string
}

interface AvanzaOrderbookResponse {
	dataPoints: number[][]
	volumePoints: Array<[number, number]>
	ownersPoints: Array<[number, number]>
}

interface AvanzaRequestBody {
	orderbookId: number
	/**
	 * What kind of chart? i.e. candlestick, line etc
	 */
	chartType: string
	/**
	 * What resolution of each datapoint
	 */
	chartResolution: string
	navigator: boolean
	percentage: boolean
	/**
	 * Include volume data?
	 */
	volume: boolean
	/**
	 * Include owner data?
	 */
	owners: boolean
	ta: any[]
	compareIds: string[]
	/**
	 * Start date as an ISO-string
	 */
	start?: string
	/**
	 * End date as an ISO-string
	 */
	end?: string
	/**
	 * Shorthand to decide on how much data to get instead of using start/end. Usually "month" is used.
	 */
	timePeriod?: string
}

class DataFetcher {
	#fetch: typeof fetch
	#queue: typeof createQueue
	#db: DatabaseWrapper

	constructor({ _fetch = fetch, queue = createQueue, _DatabaseWrapper = DatabaseWrapper } = {}) {
		this.#fetch = _fetch
		this.#queue = queue
		this.#db = new _DatabaseWrapper()
	}

	public async scrapePrices({
		securities,
		settings,
	}: {
		securities: SiteSecurity[]
		settings: ScrapeSettings
	}): Promise<void> {
		{
			const tasks = this.createTasks({ securities, settings })

			// Work through the queue
			const taskResults = await this.#queue(tasks, settings.maxNumOfWorkers)

			// Find errors
			const errors: Error[] = taskResults.filter((task: any | Error) => task instanceof Error)
			console.log(
				`Processing complete - ${taskResults.length - errors.length} successful - ${
					errors.length
				} failures`
			)

			errors.forEach((err) => console.log(err))
		}
	}

	private createTasks({
		securities,
		settings,
	}: {
		securities: SiteSecurity[]
		settings: ScrapeSettings
	}): any[] {
		return securities.map((sec) => {
			let start = settings.start

			if (sec.lastPricePoint) {
				const temp = new Date(sec.lastPricePoint)
				temp.setDate(temp.getDate() - 7) // Adding some overlap
				start = temp
			}

			// Return a function that returns a function call that is promise based. This is to be able to control the number of simultaneous open requests.
			return async () => {
				const priceData = await this.fetchPriceData({
					start,
					end: settings.end,
					orderbookId: sec.id,
				})

				console.log(`${sec.name} - Download complete`)
				return this.#db.updatePricedata({ priceData, ...sec, ...settings })
			}
		})
	}

	private async fetchPriceData({
		orderbookId,
		timePeriod,
		start,
		end,
	}: {
		orderbookId: number
		timePeriod?: string
		start?: Date
		end?: Date
		url?: string
		method?: string
	}): Promise<PriceData[]> {
		const requestBody = {
			orderbookId,
			chartType: 'CANDLESTICK',
			chartResolution: 'DAY',
			navigator: false,
			percentage: false,
			volume: true,
			owners: true,
			ta: [],
			compareIds: [],
		} as AvanzaRequestBody
		const requests: Promise<PriceData[]>[] = []

		let tempEnd = new Date(start)
		let tempStart = new Date(start)

		while (tempEnd < end) {
			tempEnd.setFullYear(tempEnd.getFullYear() + 9) // Fetching maximum of 9 years history in one request

			let periodSettings: AvanzaPeriodSettings

			if (tempEnd >= end) {
				periodSettings = this.getPeriodArguments({ timePeriod, end, start: tempStart })
			} else {
				periodSettings = this.getPeriodArguments({ timePeriod, end: tempEnd, start: tempStart })

				tempStart = new Date(tempEnd)
				tempStart.setDate(tempEnd.getDate() - 7) // Adding a week of overlap to avoid missing data. Not sure of Avanza's logic
			}

			requests.push(this.makeRequest({ ...requestBody, ...periodSettings }))
		}

		const output: Map<string, PriceData> = new Map()

		const responses = await Promise.all(requests)
		responses.forEach((response) => {
			response
				.filter((day) => day.close) // Only close is required
				.forEach((day) => {
					output.set(day.date, day)
				})
		})

		return [...output.values()]
	}

	private getPeriodArguments({
		timePeriod,
		start = new Date('1999-01-01T22:00:00.000Z'),
		end = new Date(),
	}: PeriodSettings): AvanzaPeriodSettings {
		const output = {} as AvanzaPeriodSettings

		const dayDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24)

		if (timePeriod) {
			output.timePeriod = timePeriod
		} else if (dayDiff < 30) {
			output.timePeriod = 'month'
		} else {
			output.start = start.toISOString()
			output.end = end.toISOString()
		}

		return output
	}

	private async makeRequest(
		requestBody: AvanzaRequestBody,
		url = 'https://www.avanza.se/ab/component/highstockchart/getchart/orderbook',
		method = 'POST'
	): Promise<PriceData[]> {
		const resp = await this.#fetch(url, {
			// credentials: 'include',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
				Accept: '*/*',
				'Accept-Language': 'sv-SE,sv;q=0.8,en-US;q=0.5,en;q=0.3',
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache',
				'X-Requested-With': 'XMLHttpRequest',
				Pragma: 'no-cache',
			},
			body: JSON.stringify(requestBody),
			method,
		})

		if (resp.status === 204) {
			return []
		}

		const jsonResponse = (await resp.json()) as AvanzaOrderbookResponse
		const priceData = this.parsePriceData(jsonResponse)
		return priceData
	}

	/**
	 * This parses the data from the Avanza API to proper objects.
	 * Output object looks like:
	 *
	 * ```javascript
	 * const output = [
	 * 	{
	 * 		date: '1999-01-01T22:00:00.000Z'
	 * 		open: 123,
	 * 		high: 125,
	 * 		low: 121,
	 * 		close: 123,
	 * 		volume: 374298, // # Stocks traded
	 * 		owners: 4200 // # owners on Avanza
	 * 	}
	 * ]
	 * ```
	 *
	 * @param json The price data from the API response
	 * @param json.dataPoints The array of price data originally provided,
	 * @param json.volumePoints Array of date and volume traded on that day
	 * @param json.ownersPoints Array of date and number of owners on Avanza on that date
	 * @returns The parsed price data.
	 */
	private parsePriceData({
		dataPoints,
		volumePoints,
		ownersPoints,
	}: AvanzaOrderbookResponse): PriceData[] {
		const volumeData = new Map(volumePoints)
		const ownersData = new Map(ownersPoints)

		// Add the data to the object
		const priceData: PriceData[] = dataPoints.map(([date, open, high, low, close]) => {
			return {
				date: new Date(date).toISOString(),
				open,
				high,
				low,
				close,
				volume: volumeData.get(date) || null,
				owners: ownersData.get(date) || null,
			}
		})

		return priceData
	}
}

export default DataFetcher
