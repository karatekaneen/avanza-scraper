import * as Puppeteer from 'puppeteer'
import { SiteSecurity } from './interfaces'
class Crawler {
	#puppeteer: typeof Puppeteer

	constructor({ _puppeteer = Puppeteer } = {}) {
		this.#puppeteer = _puppeteer
	}

	/**
	 * Base method for all the crawling
	 * @param params
	 * @param params.headless Run the browser in headless mode or not
	 * @param params.getStocks If stocks should be crawled
	 * @param params.getIndices If indices should be crawled
	 * @param params.puppeteer Puppeteer instance
	 */
	public async crawl({
		headless = true,
		getStocks = false,
		getIndices = true,
		puppeteer = this.#puppeteer,
	} = {}): Promise<{ stocks?: SiteSecurity[]; indices?: SiteSecurity[] }> {
		// Start the browser
		const browser = await puppeteer.launch({
			headless,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})

		const stocksPromise = getStocks ? this.crawlForStocks(browser) : null
		const indicesPromise = getIndices ? this.crawlForIndices(browser) : null

		const [stocks, indices] = await Promise.all([stocksPromise, indicesPromise])

		await browser.close()
		console.log({ indices })
		return { stocks, indices }
	}

	/**
	 * This function crawls the list of stocks on the Avanza page.
	 * It loads the page, selects what lists to take the stocks from and extracts the data from the table.
	 * @param Browser Puppeteer instance
	 * @param params
	 * @param params.listsToSave The lists we want to save
	 * @param params.url Url to the page we want to scrape
	 * @param params.sleepTime The time to sleep inbetween trying to load more data. Increase this if all data isn't being loaded before moving forward.
	 * @returns All the stocks found
	 */
	private async crawlForStocks(
		browser: Puppeteer.Browser,
		{
			listsToSave = ['Alla Sverige'],
			url = 'https://www.avanza.se/aktier/lista.html',
			sleepTime = 2000,
		} = {}
	): Promise<SiteSecurity[]> {
		const page = await browser.newPage()
		await page.goto(url)
		console.log('Opening stock list page')

		await page.evaluate(this.clickCookieConsent)

		// Open the list menu:
		await page.evaluate(this.openListMenu)
		console.log('Opening list menu')

		// Select the lists we want
		await page.evaluate(this.selectActiveLists, listsToSave)
		console.log(`Selecting Large Cap Stockholm, ${listsToSave.join(', ')}`)

		// Click the "Show more" button as long as it exists
		let allStocksVisible = false
		let timesAdded = 0
		while (!allStocksVisible && timesAdded < 10) {
			// Click the button
			allStocksVisible = await page.evaluate(this.showMoreStocks)
			// Wait for the data to load. Didn't get `waitUntil: 'networkIdle0'` to work.
			await this.sleep(sleepTime)
			timesAdded++
			console.log('Added more stocks - waiting')
		}

		console.log('All stocks loaded')
		// Extract table data:
		const stocks = await page.evaluate(this.extractTableData)
		console.log(`Found ${stocks.length} stocks`)

		return stocks
	}

	/**
	 * This function crawls the list of indices on the Avanza page.
	 * It loads the page, selects what lists to take the indices from and extracts the data from the table.
	 * @param browser Puppeteer instance
	 * @param params
	 * @param params.url Url to the page we want to scrape
	 * @param params.sleepTime The time to sleep inbetween trying to load more data. Increase this if all data isn't being loaded before moving forward.
	 * @returns All the indices found
	 */
	private async crawlForIndices(
		browser: Puppeteer.Browser,
		{ url = 'https://www.avanza.se/marknadsoversikt.html' } = {}
	): Promise<SiteSecurity[]> {
		const page = await browser.newPage()
		await page.goto(url)
		console.log('Opening indices page')

		// Open the list menu:
		console.log('Extracting indices')
		await page.evaluate(this.clickCookieConsent)
		const indices = await page.evaluate(this.extractIndices)

		return indices
	}

	private extractIndices(): SiteSecurity[] {
		const indexElements = [...(document.querySelector('.roundCorners4').children as any)].find(
			(x) => x.label === 'Världsindex'
		)

		const indices = [...indexElements.children].map((index) => {
			const name = (index.innerText as string).replace(/\n\t\s*/g, '')
			return {
				name,
				id: parseInt(index.value),
				linkName: name,
				list: 'index',
			} as SiteSecurity
		})
		return indices
	}

	/**
	 * Opens the menu on top of the page to select what
	 * lists of stocks that should be included in the table.
	 * @returns {void}
	 */
	private openListMenu(): void {
		// Open the menu to choose lists
		const listMenu = document.querySelector(
			'div.multiSelect:nth-child(2) > button:nth-child(1)'
		) as HTMLElement

		listMenu.click()
	}

	private clickCookieConsent(): void {
		const cookieBtn = document.querySelector('.cookie-consent-btn') as HTMLElement

		if (cookieBtn) {
			cookieBtn.click()
		}
	}

	/**
	 * Select what lists to scrape the data for and click the selector for that one.
	 * @param lists The names of the lists we want to scrape. - **Case sensitive for now**
	 */
	private selectActiveLists(lists: string[]): void {
		// The <ul> of stock-lists
		const listOfLists = document.querySelector('.landLabel > ul:nth-child(3)') as HTMLElement

		// The individual items in the list:
		;[...(listOfLists.children as any)].forEach((x) => {
			// If the item is one of the list we want to include - click it
			if (lists.includes(x.innerText)) {
				x.click()
			}
		})
	}

	/**
	 * Click the "show more" button to load the remaining stocks.
	 * When there is no more stocks to load the display-property of the button is
	 * changed to "none" so we check if it's still "inline-block" and if so click it.
	 * @returns {void}
	 */
	private showMoreStocks(): boolean {
		const button = document.querySelector(
			'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.orderbookListTable.component > div.u-tCenter > button'
		) as any

		const display = button.currentStyle
			? button.currentStyle.display
			: getComputedStyle(button, null).display

		// If no button is found we return that all stocks are visible
		if (!button || display !== 'inline-block') {
			return true
		} else {
			// We click "show more" and return that there may be more stocks to load
			button.click()
			return false
		}
	}

	/**
	 * Take a timeout to wait for content to load
	 * @param milliseconds number of milliseconds to wait
	 */
	private sleep(milliseconds: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, milliseconds))
	}

	/**
	 * Extracts the data from the table of stocks.
	 * @returns {Array<Object>} all the stocks in the list
	 */
	private extractTableData(): SiteSecurity[] {
		const nameColumn = document.querySelector(
			'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.orderbookListTable.component > div.orderbookListWrapper > div > table:nth-child(1) > tbody'
		)
		const dataColumns = document.querySelector(
			'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.orderbookListTable.component > div.orderbookListWrapper > div > div > table > tbody'
		)

		// Extract the list
		const dataCells = [...(dataColumns.children as any)].map(
			(row) => row.lastElementChild.innerText
		)

		// Extract name & id
		const stocks = [...(nameColumn.children as any)].map((row, index) => {
			const data = row.getElementsByClassName('orderbookName')[0]
			const [id, linkName] = data
				.getElementsByTagName('a')[0]
				.href.replace('https://www.avanza.se/aktier/om-aktien.html/', '')
				.split('/')

			return {
				name: data.innerText,
				id: parseInt(id),
				linkName,
				list: dataCells[index],
			} as SiteSecurity
		})

		return stocks
	}
}

export default Crawler
