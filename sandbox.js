const start = new Date('2009-12-30')
const end = new Date('2014-11-30')

let tempEnd = new Date(start)
let tempStart = new Date(start)
const output = []

while (tempEnd < end) {
	tempEnd.setFullYear(tempEnd.getFullYear() + 1)

	if (tempEnd >= end) {
		// periodSettings = this.getPeriodArguments({timePeriod, end, })
		output.push([tempStart.toISOString(), end.toISOString()])
	} else {
		output.push([tempStart.toISOString(), tempEnd.toISOString()])
		tempStart = new Date(tempEnd)
		tempStart.setDate(tempEnd.getDate() - 7)
		console.log(tempStart)
	}
}

console.log(output)
