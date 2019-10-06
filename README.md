<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [AvanzaScraper][1]
-   [Usage][2]
-   [createScrapeStocks][3]
    -   [Parameters][4]
-   [scrapeStocks][5]
    -   [Parameters][6]
-   [openListMenu][7]
-   [selectActiveLists][8]
    -   [Parameters][9]
-   [showMoreStocks][10]
-   [extractTableData][11]
-   [sleep][12]
    -   [Parameters][13]
-   [dateToKey][14]
    -   [Parameters][15]
-   [createQueue][16]
    -   [Parameters][17]
-   [createSaveStockList][18]
    -   [Parameters][19]
-   [createSavePricesToStock][20]
    -   [Parameters][21]
-   [saveStockList][22]
    -   [Parameters][23]
-   [savePricesToStock][24]
    -   [Parameters][25]
-   [priceScraper][26]
    -   [Parameters][27]
    -   [createFetchPriceData][28]
        -   [Parameters][29]
    -   [createPriceScraper][30]
        -   [Parameters][31]
-   [fetchPriceData][32]
    -   [Parameters][33]
-   [createParsePriceData][34]
    -   [Parameters][35]
-   [parsePriceData][36]
    -   [Parameters][37]

## AvanzaScraper

This app scrapes all the stocks from Avanzas page of stock lists. It extracts the `id` and `linkName` properties which are needed to fetch the price data later on. It also grabs the name and which list the stock belongs to.

## Usage

For basic usage and scrape the default lists it is only needed to run `index.js`.

## createScrapeStocks

Factory function for the scraper.

### Parameters

-   `deps` **[Object][38]** 
    -   `deps.puppeteer` **[Function][39]** The puppeteer library (optional, default `require('puppeteer')`)
    -   `deps.siteActions` **[Object][38]** Collection of helper functions to extract data from the page (optional, default `require('./siteActions')`)
    -   `deps.sleep` **[Function][39]** Sleep function (optional, default `require('./helpers').sleep`)

## scrapeStocks

This is the main scrapeStocks function.
It loads the page, selects what lists to take the stocks from and extracts the data from the table.

### Parameters

-   `params` **[Object][38]** 
    -   `params.listsToSave` **[Array][40]&lt;[String][41]>** The lists we want to save (optional, default `[]`)
    -   `params.url` **[String][41]** Url to the page we want to scrape (optional, default `'https://www.avanza.se/aktier/lista.html'`)
    -   `params.headless` **[Boolean][42]** Run the browser in headless mode or not (optional, default `true`)
    -   `params.sleepTime` **[Number][43]** The time to sleep inbetween trying to load more data. Increase this if all data isn't being loaded before moving forward. (optional, default `1000`)

Returns **[Array][40]&lt;[Object][38]>** Array with all the scraped data

## openListMenu

Opens the menu on top of the page to select what
lists of stocks that should be included in the table.

Returns **void** 

## selectActiveLists

Select what lists to scrape the data for and click the selector for that one.

### Parameters

-   `lists` **[Array][40]&lt;[String][41]>** The names of the lists we want to scrape. - **Case sensitive for now**

Returns **void** 

## showMoreStocks

Click the "show more" button to load the remaining stocks.
When there is no more stocks to load the display-property of the button is
changed to "none" so we check if it's still "inline-block" and if so click it.

Returns **void** 

## extractTableData

Extracts the data from the table of stocks.

Returns **[Array][40]&lt;[Object][38]>** all the stocks in the list

## sleep

Take a timeout to wait for content to load

### Parameters

-   `milliseconds` **[Number][43]** number of milliseconds to wait

Returns **[Promise][44]&lt;void>** 

## dateToKey

Takes a two-dimensional array that looks like:

```javascript
const dataArr = [
	[
		15151651351351, // Stringified date
		432143543 // Some data
	]
]
```

and returns an object:

```javascript
const output = {
	"15151651351351": {
		date: 15151651351351,
		data: 432143543
	}
}
```

Doing it this way prevents the search algo from going full O(N^2) and instead O(2N).

### Parameters

-   `dataArray`  
-   `dataArr` **[Array][40]&lt;[Array][40]>** 2D array

Returns **[Object][38]** Object with the date as key

## createQueue

Executes an array of Promises with a maximum of simultaneous requests

### Parameters

-   `tasks` **[Array][40]&lt;[Promise][44]>** Tasks to be performed. Must be promise-based.
-   `maxNumOfWorkers` **[number][43]** Default = 8. Maximum amount of simultaneous open requests (optional, default `4`)

## createSaveStockList

Factory function for saveStockList

### Parameters

-   `deps` **[Object][38]** 
    -   `deps.Firestore` **[Object][38]** The Firestore Lib (optional, default `require('@google-cloud/firestore')`)
    -   `deps.credentials` **[Object][38]** credentials for the database (optional, default `require('../../secrets.json')`)

Returns **[Function][39]** saveStockList

## createSavePricesToStock

Factory function for savePricesToStock.

### Parameters

-   `deps` **[Object][38]** 
    -   `deps.Firestore` **[Object][38]** The Firestore Lib (optional, default `require('@google-cloud/firestore')`)
    -   `deps.credentials` **[Object][38]** credentials for the database (optional, default `require('../../secrets.json')`)

Returns **[Function][39]** savePricesToStock

## saveStockList

This function takes an array and saves them to the database in batches.

### Parameters

-   `stocks` **[Array][40]&lt;[Object][38]>** Array of stocks to be saved in the database.

Returns **[Array][40]&lt;[Object][38]>** The original array of stocks

## savePricesToStock

This function adds the price data to the stock document in the database.

### Parameters

-   `params` **[Object][38]** 
    -   `params.id` **[Number][43]** Id of the stock to update
    -   `params.priceData` **[Array][40]&lt;[Object][38]>** The data to add to the document
    -   `params.name` **[String][41]** The name, only used for logging

Returns **[Object][38]** Reference to the database document.

## priceScraper

This is the main function that handles the workflow of fetching the price data and
save it to the stock in the db.

TODO Error handling

### Parameters

-   `params` **[Object][38]** 
    -   `params.stocks` **[Array][40]&lt;[Object][38]>** Array of stocks to fetch price data about
    -   `params.settings` **[Object][38]** Settings about the data fetching
        -   `params.settings.start` **[Date][45]** First date to include in the data
        -   `params.settings.end` **[Date][45]** Last date to include in the data
        -   `params.settings.maxNumOfWorkers` **[Object][38]** Max of simultaneous open requests

Returns **void** 

### createFetchPriceData

Factory function for `fetchPriceData`

#### Parameters

-   `deps` **[Object][38]** 
    -   `deps.fetch` **[Function][39]** node-fetch library (optional, default `require('node-fetch')`)
    -   `deps.parsePriceData` **[Function][39]**  (optional, default `require('../data/dataParser').createParsePriceData({})`)

Returns **[Function][39]** fetchPriceData

### createPriceScraper

Factory function for `priceScraper`

#### Parameters

-   `deps` **[Object][38]** 
    -   `deps.fetchPriceData` **[Function][39]** Function to download data (optional, default `this.createFetchPriceData({})`)
    -   `deps.savePricesToStock` **[Function][39]** Database handler (optional, default `require('../data/dataSaver').createSavePricesToStock({})`)
    -   `deps.createQueue` **[Function][39]** Limiting the amount of open requests (optional, default `require('./helpers').createQueue`)

Returns **[Function][39]** priceScraper

## fetchPriceData

Function to fetch price, volume and owner data from Avanza.

### Parameters

-   `params` **[Object][38]** 
    -   `params.orderbookId` **[Number][43]** id of the stock to fetch
    -   `params.start` **[Date][45]** First date to fetch - **this day will be included** (optional, default `new Date('2019-01-01T22:00:00.000Z')`)
    -   `params.end` **[Date][45]** Last date to fetch **this day will be included** (optional, default `new Date()`)

Returns **[Array][40]&lt;[Object][38]>** Price data for the given stock

## createParsePriceData

Factory function for `parcePriceData`

### Parameters

-   `deps` **[Object][38]** 
    -   `deps.dateToKey` **[Function][39]** Assings the date as the object key to avoid O(N^2) and instead get O(N\*2) (optional, default `require('../scraping/helpers').dateToKey`)

Returns **[Function][39]** parsePriceData

## parsePriceData

This parses the data from the Avanza API to proper objects.
Output object looks like:

```javascript
const output = [
	{
		open: 123,
		high: 125,
		low: 121,
		close: 123,
		volume: 374298, // # Stocks traded
		owners: 4200 // # owners on Avanza
	}
]
```

### Parameters

-   `json` **[Object][38]** The price data from the API response
    -   `json.dataPoints` **[Array][40]&lt;[Array][40]>** The array of price data originally provided,
    -   `json.volumePoints` **[Array][40]&lt;[Array][40]>** Array of date and volume traded on that day
    -   `json.ownersPoints` **[Array][40]&lt;[Array][40]>** Array of date and number of owners on Avanza on that date

Returns **[Array][40]&lt;[Object][38]>** The parsed price data.

[1]: #avanzascraper

[2]: #usage

[3]: #createscrapestocks

[4]: #parameters

[5]: #scrapestocks

[6]: #parameters-1

[7]: #openlistmenu

[8]: #selectactivelists

[9]: #parameters-2

[10]: #showmorestocks

[11]: #extracttabledata

[12]: #sleep

[13]: #parameters-3

[14]: #datetokey

[15]: #parameters-4

[16]: #createqueue

[17]: #parameters-5

[18]: #createsavestocklist

[19]: #parameters-6

[20]: #createsavepricestostock

[21]: #parameters-7

[22]: #savestocklist

[23]: #parameters-8

[24]: #savepricestostock

[25]: #parameters-9

[26]: #pricescraper

[27]: #parameters-10

[28]: #createfetchpricedata

[29]: #parameters-11

[30]: #createpricescraper

[31]: #parameters-12

[32]: #fetchpricedata

[33]: #parameters-13

[34]: #createparsepricedata

[35]: #parameters-14

[36]: #parsepricedata

[37]: #parameters-15

[38]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[39]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[40]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[41]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[42]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[43]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[44]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise

[45]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date
