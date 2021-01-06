const puppeteer = require('puppeteer');
const fs = require("fs");

(async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const secondPage = await browser.newPage()

    var pageUrl = 'https://mortesubita.net/'
    console.log(`acessando ${pageUrl}`)
    await page.goto(pageUrl)

    var menuSelector = "#site-header > div.header-inner.section-inner > div.header-navigation-wrapper > div > div.toggle-wrapper.nav-toggle-wrapper.has-expanded-menu > button > span > span.toggle-text"
    await page.$eval( menuSelector, menu => menu.click() )
    
    console.log('obtendo links das categorias...')
    const categories = await page.$$eval('.menu-item-object-category > div > a', links => links.map(a => a.href));
    
    for (const categoryUrl of categories) {

        console.log(`acessando categoria ${categoryUrl}`)
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' }).catch(error => {})

        var categoryTitle = await page.title()
        var categoryFolder = categoryTitle.split(' - ')[0]

        var oldmask = process.umask(0);
        fs.mkdir(`pdfs/${categoryFolder}`, '0777', error => {
            process.umask(oldmask);
        });

        console.log('obtendo links dos artigos...')
        var articles = await page.$$eval('.post > header > div > h2 > a', links => links.map(a => a.href));

        for (const article of articles) {

            await secondPage.goto(article, { waitUntil: 'domcontentloaded' }).catch(error => {})

            await secondPage.evaluate((sel) => document.querySelectorAll(sel).forEach((element) => element.parentNode.removeChild(element)), "#wpd-bubble-count")

            var articleTitle = await secondPage.title()
            var articlePdfName = articleTitle.split(' - ')[0].replace(/\//g, '-')
            
            var fullFilePath = `pdfs/${categoryFolder}/${articlePdfName}.pdf`

            await secondPage.pdf({ path: fullFilePath, format: 'A4', printBackground: true })
            console.log(`novo pdf! ${fullFilePath}`)
        }
    }

    await browser.close()
})()