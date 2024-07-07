const axios = require('axios')
const fs = require('fs')

listsToFetch = [
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

async function run() {
	const resp = await axios('https://www.avanza.se/_api/market-overview/overviews', {
		headers: {
			Accept: 'application/json, text/plain, */*',
		},
	})

	console.log(resp.data)

fs.writeFileSync('overview.json', JSON.stringify(resp.data))
}

run()
