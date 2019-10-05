/**
 * Opens the menu on top of the page to select what
 * lists of stocks that should be included in the table.
 * @returns {void}
 */
exports.openListMenu = async () => {
	// Open the menu to choose lists
	const listMenu = document.querySelector(
		'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.category > div > div:nth-child(10) > div.widgetWrapper.u-clearFix > div > div:nth-child(2) > button'
	)
	listMenu.click()
}

/**
 * Select what lists to scrape the data for and click the selector for that one.
 * @param {Array<String>} lists The names of the lists we want to scrape. - **Case sensitive for now**
 * @returns {void}
 */
exports.selectActiveLists = async lists => {
	// The <ul> of stock-lists
	const listOfLists = document.querySelector(
		'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.category > div > div.component.widget.category1.has-focus > div.widgetWrapper.u-clearFix > div > div:nth-child(2) > ul > li > ul'
	)

	// The individual items in the list:
	;[...listOfLists.children].forEach(x => {
		// If the item is one of the list we want to include - click it
		if (lists.includes(x.innerText)) x.click()
	})
}

/**
 * Click the "show more" button to load the remaining stocks.
 * When there is no more stocks to load the display-property of the button is
 * changed to "none" so we check if it's still "inline-block" and if so click it.
 * @returns {void}
 */
exports.showMoreStocks = async () => {
	const button = document.querySelector(
		'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.orderbookListTable.component > div.u-tCenter > button'
	)

	const display = button.currentStyle
		? button.currentStyle.display
		: getComputedStyle(button, null).display

	// If no button is found we return that all stocks are visible
	if (!button || display !== 'inline-block') return true
	else {
		// We click "show more" and return that there may be more stocks to load
		button.click()

		return false
	}
}

/**
 * Extracts the data from the table of stocks.
 * @returns {Array<Object>} all the stocks in the list
 */
exports.extractTableData = async () => {
	const nameColumn = document.querySelector(
		'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.orderbookListTable.component > div.orderbookListWrapper > div > table:nth-child(1) > tbody'
	)
	const dataColumns = document.querySelector(
		'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.orderbookListTable.component > div.orderbookListWrapper > div > div > table > tbody'
	)

	// Extract the list
	const dataCells = [...dataColumns.children].map(row => row.lastElementChild.innerText)

	// Extract name & id
	const stocks = [...nameColumn.children].map((row, index) => {
		const data = row.getElementsByClassName('orderbookName')[0]
		const [id, linkName] = data
			.getElementsByTagName('a')[0]
			.href.replace('https://www.avanza.se/aktier/om-aktien.html/', '')
			.split('/')

		return { name: data.innerText, id: parseInt(id), linkName, list: dataCells[index] }
	})

	return stocks
}
