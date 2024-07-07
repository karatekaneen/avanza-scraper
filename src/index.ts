import DataFetcher from './DataFetcher'
import { ScrapeSettings } from './interfaces'
import DatabaseWrapper from './DatabaseWrapper'
import { config } from 'dotenv'
import express from 'express'
import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { StockFetcher } from './StockFetcher'
import { IndexFetcher } from './IndexFetcher'

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
	const df = new DataFetcher()
	const db = new DatabaseWrapper()
	const stockFetcher = new StockFetcher()
	const indexFetcher = new IndexFetcher()

	const [indices, stocks] = await Promise.all([
		indexFetcher.fetchIndices(),
		stockFetcher.fetchStocks(),
	])
	await db.saveSummaries({ securities: stocks, type: 'stock' })
	await db.saveSummaries({ securities: indices, type: 'index' })

	await df.scrapePrices({
		securities: indices,
		settings: {
			maxNumOfWorkers: 8,
			end: new Date(),
			start: new Date('1999-01-01T22:00:00.000Z'),
			type: 'index',
			replace: false,
		} as ScrapeSettings,
	})

	await df.scrapePrices({
		securities: stocks,
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
