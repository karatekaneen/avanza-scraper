import { IndexFetcher } from '../IndexFetcher'
import fs from 'fs'

describe('Stock Fetcher', () => {
	let fetcher: IndexFetcher, raw: any

	beforeAll(async () => {
		fetcher = new IndexFetcher()

		raw = JSON.parse(
			(await fs.promises.readFile('./src/__tests__/overview.json')).toString('utf8')
		)
	})

	describe('Extract stocks', () => {
		it('should return an array', () => {
			const resp = fetcher.extractIndices(raw)
			expect(resp).toBeInstanceOf(Array)
			expect(resp.length).toBe(17)
		})

		it('should extract stocks from test data', () => {
			for (const security of fetcher.extractIndices(raw)) {
				expect(security.country).toBeTruthy()
				expect(security.id).toBeGreaterThan(0)
				expect(security.linkName).toBeTruthy()
				expect(security.name.length).toBeGreaterThan(0)
			}
		})
	})
})
