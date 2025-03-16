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

type OHLCV = {
	timestamp: number
	open: number
	close: number
	low: number
	high: number
	totalVolumeTraded: number
}

interface AvanzaOrderbookResponse {
	ohlc: OHLCV[]
}

interface AvanzaRequestBody {
	orderbookId: number
	chartResolution: 'day'
	/**
	 * Start date as an ISO date
	 */
	start: string
	/**
	 * End date as an ISO date
	 */
	end: string
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
			chartResolution: 'day',
		} as AvanzaRequestBody
		const requests: Promise<PriceData[]>[] = []

		let tempEnd = new Date(start)
		let tempStart = new Date(start)

		while (tempEnd < end) {
			tempEnd.setFullYear(tempEnd.getFullYear() + 4) // Fetching maximum of 4 years history in one request

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
		start = new Date('1999-01-01T22:00:00.000Z'),
		end = new Date(),
	}: PeriodSettings): AvanzaPeriodSettings {
		const output = {} as AvanzaPeriodSettings

		output.start = start.toISOString().split('T')[0]
		output.end = end.toISOString().split('T')[0]

		return output
	}

	private async makeRequest(
		requestBody: AvanzaRequestBody,
		baseURL = 'https://www.avanza.se/_api/price-chart/stock',
		method = 'GET'
	): Promise<PriceData[]> {
		const url = `${baseURL}/${requestBody.orderbookId}?from=${requestBody.start}&to=${requestBody.end}&resolution=${requestBody.chartResolution}`

		const resp = await this.#fetch(url, {
			// credentials: 'include',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
				Accept: '*/*',
				'Accept-Language': 'sv-SE,sv;q=0.8,en-US;q=0.5,en;q=0.3',
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
			},
			method,
		})

		if (resp.status === 204) {
			return []
		}

		const jsonResponse = (await resp.json()) as AvanzaOrderbookResponse
		const priceData = this.parsePriceData(jsonResponse)
		return priceData
	}

	private parsePriceData({ ohlc }: AvanzaOrderbookResponse): PriceData[] {
		// Add the data to the object
		const priceData: PriceData[] = (ohlc || []).map((datapoint) => {
			return {
				date: new Date(datapoint.timestamp).toISOString(),
				open: datapoint.open,
				high: datapoint.high,
				low: datapoint.low,
				close: datapoint.close,
				volume: datapoint.totalVolumeTraded || null,
				owners: null,
			} as PriceData
		})

		return priceData
	}
}

export default DataFetcher
