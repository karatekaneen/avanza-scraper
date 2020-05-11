-  URL: https://www.avanza.se/marknadsoversikt.html
-  CSS Selector: .roundCorners4

```
document.querySelector('.roundCorners4').children[0].label // "Världsindex"
document.querySelector('.roundCorners4').children[0].children[0].value // "123456" <-- Id som sträng
document.querySelector('.roundCorners4').children[0].children[0].innerText // "OMX Stockholm 30"
```

```
// logging in page.evaluate
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

await page.evaluate(() => console.log(`url is ${location.href}`));
```

## Sökning efter "stat " för att få svenska räntor. Bör göra på "SSV" också.

await fetch("https://www.avanza.se/ab/component/orderbook_search/?query=stat+&collection=INDEX&onlyTradable=false&pageType=index&orderTypeView=", {
"credentials": "include",
"headers": {
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
"Accept": "application/json, text/javascript, _/_; q=0.01",
"Accept-Language": "sv-SE,sv;q=0.8,en-US;q=0.5,en;q=0.3",
"X-Requested-With": "XMLHttpRequest",
"Pragma": "no-cache",
"Cache-Control": "no-cache"
},
"referrer": "https://www.avanza.se/index/om-indexet.html/1002998/sweden-government-bond-1y",
"method": "GET",
"mode": "cors"
});
