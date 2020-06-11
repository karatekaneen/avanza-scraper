import Crawler from './Crawler'
import DataFetcher from './DataFetcher'
import { ScrapeSettings } from './interfaces'
import DatabaseWrapper from './DatabaseWrapper'
import { resolve } from 'path'

import { config } from 'dotenv'
config({ path: resolve(__dirname, '../.env') })

const x = async () => {
	const t = new Crawler()
	const df = new DataFetcher()
	const db = new DatabaseWrapper()

	const test = await t.crawl({ getStocks: true, getIndices: true })
	await db.saveSummaries({ securities: test.stocks, type: 'stock' })
	await db.saveSummaries({ securities: test.indices, type: 'index' })

	const indexResults = await df.scrapePrices({
		securities: test.indices,
		settings: {
			maxNumOfWorkers: 8,
			end: new Date(),
			start: new Date('1999-01-01T22:00:00.000Z'),
			type: 'index',
			replace: false,
		} as ScrapeSettings,
	})

	const stockResults = await df.scrapePrices({
		securities: test.stocks,
		settings: {
			maxNumOfWorkers: 8,
			end: new Date(),
			start: new Date('1999-01-01T22:00:00.000Z'),
			type: 'stock',
			replace: false,
		} as ScrapeSettings,
	})
}

x()
