const request = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Функция для задержки между запросами
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const urls = [
    "https://edition.cnn.com/2024/09/23/tech/social-media-ai-data-opt-out",
    "https://www.euronews.com/business/2024/09/06/uk-house-prices-hit-two-year-high-after-positive-summer-for-market",
    "https://www.foxbusiness.com/technology/man-charged-using-bots-stream-ai-generated-songs-10m-royalties",
    "https://metro.co.uk/2024/09/08/danger-life-warning-place-100mm-rain-forecast-uk-21565559/",
    "https://www.thesun.co.uk/news/30829932/teenage-girl-killed-motorway-crash-m65-burnley/"
]

async function scrapeCNN(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    let data = {
        header: $("div.headline__wrapper").text().trim(),
        author: $("div.byline__names").text()
                                        .substring(6)
                                        .replace(/\s+and\s+/g, ', ')
                                        .replace(/,\s*CNN$/, '')
                                        .split(', ')
                                        .map(name => name.trim()),
        publish_date: $("div.timestamp").text().replace('Published', '').replace('Updated', '').trim(),
        reading_time: $("div.headline__sub-description").text().replace('read', '').trim(),
        category: $("div.breadcrumb").text().split('/').map(cat => cat.trim()),
        text: $("div.article__content-container p").map((i, el) => $(el).text().trim()).get().join(' '),
    };

    return data;
}

async function scrapeEuronews(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    // Выбор активного документа
    let doc = $("div.swiper-slide-active"); // Это уже объект Cheerio

    // Извлечение данных
    let data = {
        header: doc.find("h1").text().trim(), // Исправляем: используем .find вместо doc()
        author: doc.find("div.c-article-contributors").text().trim().substring(3),
        publish_date: doc.find("time").text().split(' - ').map(t => t.trim()),
        category: doc.find("#adb-article-breadcrumb a.active").text().trim(),
        summary: doc.find("p.c-article-summary").text().trim(),
        text: doc.find("div.c-article-content p").map((i, el) => $(el).text().trim()).get().join(' '),
    };

    return data;
}

async function scrapeFoxnews(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    let data = {
        header: $("h1.headline").text().trim(),
        subheader: $("h2.sub-headline").text().trim(),
        author: $("span.author").text().trim(),
        publish_date: $("time").text().trim(),
        category: $("div.eyebrow").text().trim(),
        text: $("div.article-content p").map((i, el) => $(el).text().trim()).get().join(' '),
    };

    return data;
}


async function scrapeMetro(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    let data = {
        header: $("h1.post-title").text().trim(),
        author: $("span.author-container").text().trim(),
        publish_date: $('span.post-published').text().trim(),
        modif_date: $('span.post-modified').text().replace('|', ' ').trim(),
        category: $('div.met-breadcrumb').text().split('›').map(cat => cat.trim()),
        text: $('div.article-body p').map((i, el) => $(el).text().trim()).get().join(' '),
    }

    return data;
}

async function scrapeSun(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    let data = {
        header: $("h1").text().trim(),
        subheader: $("div.article__subdeck").text().trim(),
        author: $("div.article__author").text().trim(),
        publish_date: $("li.article__published").text().trim().replace('Published: ', ''),
        update: $("li.article__updated").text().trim().replace('Updated: ', ''),
        // category: $("ul.breadcrumbs").text().trim(),
        category: $('ul.breadcrumbs li a').map((i, el) => $(el).text().trim()).get(),
        text: $('div.article__content p').map((i, el) => $(el).text().trim()).get().join(' '),
    };

    return data;
}


async function scrapeWebsite(url, site) {
    try {  
        let data;
        switch (site.toLowerCase()) {
            case "cnn":
                data = await scrapeCNN(url);
                console.log(data);
                break;
            case "euronews":
                data = await scrapeEuronews(url);
                console.log(data);
                break;
            case "foxnews":
                data = await scrapeFoxnews(url);
                console.log(data);
                break;
            case "metro":
                data = await scrapeMetro(url);
                console.log(data);
                break;
            case "sun":
                data = await scrapeSun(url);
                console.log(data);
                break;
            default: 
                console.log("Веб-сайт не определен");
        }
  
    } catch (error) {
      console.error(`Ошибка при парсинге ${url}:`, error.message);
    }
  }

scrapeWebsite(urls[0], "cnn")
