const puppeteer = require('puppeteer');
const { selectLists } = require('./src/siteActions');

console.log(selectLists);

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://www.avanza.se/aktier/lista.html');

	await page.waitForSelector(
		'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.category > div > div:nth-child(10) > div.widgetWrapper.u-clearFix > div > div:nth-child(2) > button',
		{
			visible: true
		}
	);

	const dimensions = await page.evaluate(async () => {
		// Open the menu to choose lists
		const listMenu = document.querySelector(
			'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.category > div > div:nth-child(10) > div.widgetWrapper.u-clearFix > div > div:nth-child(2) > button'
		);
		listMenu.click();

		const listOfLists = document.querySelector(
			'#main > div > div > div.lgOffsetRight-0.smOffsetLeft-0.mdOffsetTop-0.xsOffsetLeft-0.mdOffsetRight-0.section.smOffsetBottom-12.lgOffsetLeft-0.xsOffsetRight-0.smOffsetRight-0.lg-12.sm-12.lgOffsetTop-0.smOffsetTop-0.md-12.lgOffsetBottom-12.mdOffsetBottom-12.xs-12.mdOffsetLeft-0.advanced-filter.xsOffsetTop-0.xsOffsetBottom-3 > div > div.category > div > div.component.widget.category1.has-focus > div.widgetWrapper.u-clearFix > div > div:nth-child(2) > ul > li > ul'
		);

		const listItems = [...listOfLists.children];
		return {};
	});

	await page.pdf({ path: 'hn.pdf', format: 'A4' });
	console.log('Dimensions:', dimensions);

	await browser.close();
})();
