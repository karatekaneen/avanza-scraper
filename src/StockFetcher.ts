import { SiteSecurity } from './interfaces'
import cheerio from 'cheerio'
import axios from 'axios'

export class StockFetcher {
	constructor() {}

	listsToFetch = [
		'SE.FNSE',
		'SE.LargeCap.SE',
		'DK.LargeCap.DK',
		'DK.MidCap.DK',
		'DK.SmallCap.DK',
		'DK.FNDK',
		'DK.XSAT',
		'NO.OB Equity Certificates',
		'NO.OB Match',
		'NO.OB Standard',
		'NO.OBX',
		'NO.MERK',
		'NO.XOAS',
		'SE.Inofficiella',
		'SE.MidCap.SE',
		'SE.SmallCap.SE',
		'SE.Xterna listan',
		'SE.XNGM',
		'SE.NSME',
		'SE.XSAT',
	]

	public async fetchStocks(): Promise<SiteSecurity[]> {
		let start = 0
		const maxResults = 400
		const timestamp = Date.now()
		const securities: SiteSecurity[] = []

		for (const listName of this.listsToFetch) {
			console.log('Starting fetch of: ', listName)
			const base = `https://www.avanza.se/frontend/template.html/marketing/advanced-filter/advanced-filter-template?${timestamp}&widgets.marketCapitalInSek.filter.lower=&widgets.marketCapitalInSek.filter.upper=&widgets.marketCapitalInSek.active=true&widgets.stockLists.filter.list%5B0%5D=${listName}&widgets.stockLists.active=true&widgets.numberOfOwners.filter.lower=&widgets.numberOfOwners.filter.upper=&widgets.numberOfOwners.active=true&parameters.startIndex=${start}&parameters.maxResults=${maxResults}&parameters.selectedFields%5B0%5D=DEVELOPMENT_TODAY&parameters.selectedFields%5B1%5D=CHANGE_IN_VALUE&parameters.selectedFields%5B2%5D=BUY&parameters.selectedFields%5B3%5D=SELL&parameters.selectedFields%5B4%5D=LATEST&parameters.selectedFields%5B5%5D=HIGHEST_TODAY&parameters.selectedFields%5B6%5D=LOWEST_TODAY&parameters.selectedFields%5B7%5D=VALUE_TRADED&parameters.selectedFields%5B8%5D=VOLUME_WEIGHTED_AVERAGE_PRICE&parameters.selectedFields%5B9%5D=TIME_OF_LATEST_QUOTE&parameters.selectedFields%5B10%5D=LIST`
			// const base = `https://www.avanza.se/frontend/template.html/marketing/advanced-filter/advanced-filter-template?${timestamp}&widgets.marketCapitalInSek.filter.lower=&widgets.marketCapitalInSek.filter.upper=&widgets.marketCapitalInSek.active=true&widgets.stockLists.filter.list%5B0%5D=${listName}&widgets.stockLists.active=true&widgets.numberOfOwners.filter.lower=&widgets.numberOfOwners.filter.upper=&widgets.numberOfOwners.active=true&parameters.startIndex=${start}&parameters.maxResults=${maxResults}&parameters.selectedFields%5B0%5D=LATEST&parameters.selectedFields%5B1%5D=DEVELOPMENT_TODAY&parameters.selectedFields%5B2%5D=DEVELOPMENT_ONE_YEAR&parameters.selectedFields%5B3%5D=MARKET_CAPITAL_IN_SEK&parameters.selectedFields%5B4%5D=PRICE_PER_EARNINGS&parameters.selectedFields%5B5%5D=DIRECT_YIELD&parameters.selectedFields%5B6%5D=NBR_OF_OWNERS&parameters.selectedFields%5B7%5D=LIST`
			const resp = await axios(base, {
				headers: {
					Accept: 'application/json, text/plain, */*',
				},
				method: 'GET',
			})

			// No catch and stuff here, want to fail miserably so all alerts are triggered
			const found = this.extractStocks(resp.data)
			console.log(`Found ${found.length} in ${listName}`)
			securities.push(...found)
		}

		return securities
	}

	public extractStocks(html: string): SiteSecurity[] {
		const $ = cheerio.load(html, { decodeEntities: true })

		const securities: SiteSecurity[] = $('td.orderbookName')
			.find('a')
			.toArray()
			.map((element) => {
				const href = $(element).attr().href
				const hrefArr = href.split('/')

				// This is the classes of the flag icon:
				const classes = $(element).find('span').attr().class.split(' ')

				const country = classes[classes.length - 1]
				const id = parseInt(hrefArr[hrefArr.length - 2])
				const linkName = hrefArr[hrefArr.length - 1]

				return {
					name: $(element).text().trim(),
					id,
					linkName,
					country,
				}
			})

		const lists = $('.tableScrollContainer')
			.find('tbody > tr')
			.toArray()
			.map((el) => $(el).find('td').last().text().trim())

		return securities.map((security, index) => {
			security.list = lists[index]
			return security
		})
	}
}
