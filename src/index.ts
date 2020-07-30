import Crawler from './Crawler'
import DataFetcher from './DataFetcher'
import { ScrapeSettings } from './interfaces'
import DatabaseWrapper from './DatabaseWrapper'
import { config } from 'dotenv'
import * as express from 'express'
import { Request, Response } from 'express'
import * as bodyParser from 'body-parser'

config()

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 8080

app.post('/', async (req: Request, res: Response) => {
	console.log(req.body)
	if (!req.body) {
		const msg = 'no Pub/Sub message received'
		console.error(`error: ${msg}`)
		res.status(400).send(`Bad Request: ${msg}`)
		return
	}
	const t = new Crawler()
	const df = new DataFetcher()
	const db = new DatabaseWrapper()

	const test = await t.crawl({ getStocks: true, getIndices: true })
	await db.saveSummaries({ securities: test.stocks, type: 'stock' })
	await db.saveSummaries({ securities: test.indices, type: 'index' })

	await df.scrapePrices({
		securities: test.indices,
		settings: {
			maxNumOfWorkers: 8,
			end: new Date(),
			start: new Date('1999-01-01T22:00:00.000Z'),
			type: 'index',
			replace: false,
		} as ScrapeSettings,
	})

	await df.scrapePrices({
		securities: test.stocks,
		settings: {
			maxNumOfWorkers: 8,
			end: new Date(),
			start: new Date('1999-01-01T22:00:00.000Z'),
			type: 'stock',
			replace: false,
		} as ScrapeSettings,
	})

	res.status(204).send()
})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
