import Crawler from './Crawler'

const x = async () => {
	const t = new Crawler()
	const test = await t.crawl()
}

x()
