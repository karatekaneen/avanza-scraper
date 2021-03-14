import { SiteSecurity } from './interfaces'
import cheerio from 'cheerio'
import axios from 'axios'

export class StockFetcher {
	constructor() {}

	public async fetchStocks(): Promise<SiteSecurity[]> {
		let start = 0
		const maxResults = 100
		const timestamp = Date.now()
		const securities: SiteSecurity[] = []

		while (true) {
			console.log(`Fetched: ${start} - Fetching ${maxResults} more`)
			const resp = await axios(
				`https://www.avanza.se/frontend/template.html/marketing/advanced-filter/advanced-filter-template?${timestamp}&widgets.marketCapitalInSek.filter.lower=&widgets.marketCapitalInSek.filter.upper=&widgets.marketCapitalInSek.active=true&widgets.stockLists.filter.list%5B0%5D=SE.LargeCap.SE&widgets.stockLists.filter.list%5B1%5D=DK.LargeCap.DK&widgets.stockLists.filter.list%5B2%5D=DK.MidCap.DK&widgets.stockLists.filter.list%5B3%5D=DK.SmallCap.DK&widgets.stockLists.filter.list%5B4%5D=DK.FNDK&widgets.stockLists.filter.list%5B5%5D=DK.XSAT&widgets.stockLists.filter.list%5B6%5D=NO.OB+Equity+Certificates&widgets.stockLists.filter.list%5B7%5D=NO.OB+Match&widgets.stockLists.filter.list%5B8%5D=NO.OB+Standard&widgets.stockLists.filter.list%5B9%5D=NO.OBX&widgets.stockLists.filter.list%5B10%5D=NO.MERK&widgets.stockLists.filter.list%5B11%5D=NO.XOAS&widgets.stockLists.filter.list%5B12%5D=SE.Inofficiella&widgets.stockLists.filter.list%5B13%5D=SE.MidCap.SE&widgets.stockLists.filter.list%5B14%5D=SE.SmallCap.SE&widgets.stockLists.filter.list%5B15%5D=SE.Xterna+listan&widgets.stockLists.filter.list%5B16%5D=SE.FNSE&widgets.stockLists.filter.list%5B17%5D=SE.XNGM&widgets.stockLists.filter.list%5B18%5D=SE.NSME&widgets.stockLists.filter.list%5B19%5D=SE.XSAT&widgets.stockLists.active=true&widgets.numberOfOwners.filter.lower=&widgets.numberOfOwners.filter.upper=&widgets.numberOfOwners.active=true&parameters.startIndex=${start}&parameters.maxResults=${maxResults}&parameters.selectedFields%5B0%5D=LATEST&parameters.selectedFields%5B1%5D=DEVELOPMENT_TODAY&parameters.selectedFields%5B2%5D=DEVELOPMENT_ONE_YEAR&parameters.selectedFields%5B3%5D=MARKET_CAPITAL_IN_SEK&parameters.selectedFields%5B4%5D=PRICE_PER_EARNINGS&parameters.selectedFields%5B5%5D=DIRECT_YIELD&parameters.selectedFields%5B6%5D=NBR_OF_OWNERS&parameters.selectedFields%5B7%5D=LIST`,
				{
					headers: {
						Accept: 'application/json, text/plain, */*',
					},
					method: 'GET',
				}
			)

			// No catch and stuff here, want to fail miserably so all alerts are triggered
			const found = this.extractStocks(resp.data)
			securities.push(...found)

			if (found.length < maxResults) {
				break
			} else {
				start += maxResults
			}
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
