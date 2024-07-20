import { SiteSecurity } from './interfaces'
import axios from 'axios'

export interface Overview {
	id: any
	title: string
	active: boolean
	widgets: Widget[]
	generation: number
}

export interface Widget {
	type: string
	configuration?: Configuration
	data?: Data
	settings: any
	name: string
}

export interface Configuration {
	categories: Category[]
}

export interface Category {
	name: string
	orderbooks: Orderbook[]
}

export interface Orderbook {
	orderbookId: string
	name: string
	shortName: string
	countryCode: string
}

export interface Data {
	orderbooks: Orderbook2[]
}

export interface Orderbook2 {
	orderbookId: string
	name: string
	countryCode: string
	instrumentType: string
	closingPrice: number
	priceThreeMonthsAgo?: number
	priceStartOfYear?: number
	lastPrice: number
	updated: number
}

export class IndexFetcher {
	constructor() {}

	wantedWidgets = new Set(['NORDIC_INDICES', 'WORLD_INDICES', 'EUROPE_INDICES'])

	public async fetchIndices(): Promise<SiteSecurity[]> {
		const resp = await axios('https://www.avanza.se/_api/market-overview/overviews', {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
				Accept: 'application/json, text/plain, */*',
				'Accept-Language': 'sv-SE,sv;q=0.8,en-US;q=0.5,en;q=0.3',
			},
			method: 'GET',
		})

		return this.extractIndices(resp.data)
	}

	public extractIndices(overview: Overview[]): SiteSecurity[] {
		return overview[0].widgets
			.filter((widget) => this.wantedWidgets.has(widget.type))
			.flatMap((widget) =>
				widget.data.orderbooks.map((orderBookItem) => {
					return {
						id: parseInt(orderBookItem.orderbookId),
						country: orderBookItem.countryCode,
						name: orderBookItem.name,
						linkName: orderBookItem.name,
					} as SiteSecurity
				})
			)
	}
}
