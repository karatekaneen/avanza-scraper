export interface SiteSecurity {
	id: number
	/**
	 * The URL-safe name
	 */
	linkName: string
	/**
	 * country where the security is listed
	 */
	country: string
	/**
	 * The list that the security belongs to
	 */
	list?: string
	/**
	 * The correct name of the security
	 */
	name: string
	lastPricePoint?: string
}

export interface PriceData {
	date: string
	open: number
	high: number
	low: number
	close: number
	volume: number
	owners: number
}

export interface ScrapeSettings {
	type: string
	start?: Date
	end?: Date
	maxNumOfWorkers: number
	replace: boolean
}
