/* eslint-disable no-await-in-loop */
/**
 * Factory function for the scraper.
 * @param {Object} deps
 * @param {Function} deps.puppeteer The puppeteer library
 * @param {Object} deps.siteActions Collection of helper functions to extract data from the page
 * @param {Function} deps.sleep Sleep function
 */
exports.createScrapeStocks = ({}) => {
	return scrapeStocks
}
