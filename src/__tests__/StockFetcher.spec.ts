import { StockFetcher } from '../StockFetcher'
import fs from 'fs'

describe('Stock Fetcher', () => {
	let sf: StockFetcher, html: string

	beforeAll(async () => {
		sf = new StockFetcher()

		html = (await fs.promises.readFile('./src/__tests__/sample.txt')).toString('utf8')
	})

	it('has a working constructor', () => {
		expect(sf).toBeInstanceOf(StockFetcher)
	})

	describe('Extract stocks', () => {
		it('should return an array', () => {
			expect(sf.extractStocks(html)).toBeInstanceOf(Array)
		})

		it('should extract stocks from test data', () => {
			for (const security of sf.extractStocks(html)) {
				expect(security.country).toBeTruthy()
				expect(security.id).toBeGreaterThan(0)
				expect(security.linkName).toBeTruthy()
				expect(security.name.length).toBeGreaterThan(0)
			}
		})

		it.todo('')
	})
})
