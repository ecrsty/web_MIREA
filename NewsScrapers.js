const request = require('request-promise');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs')
const { createObjectCsvWriter } = require('csv-writer'); // забираем только нужный метод из модуля
const { parse, parseISO, format } = require('date-fns');
const saveArticle = require('./saveArticle');
const ScrapingSession = require('./models/scrapingSession');


// Функция для задержки между запросами
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function normalizeDate(stringdate, oldDateFormat, newDateFormat="yyyy-MM-dd HH:mm:ss") {
    let d = parse(stringdate, oldDateFormat, new Date());
    let newd = format(d, newDateFormat);
    return newd;
}

async function scrapeCNN(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    let rawDate = $("div.timestamp").text().replace('Published', '').replace('Updated', '').trim();
    if (rawDate) {
        let [timePart, datePart, yearPart] = rawDate.split(',').map(str => str.trim());
        let [time, amPm] = timePart.split(' ').slice(0, 2);
        let timeWithoutTZ = `${time} ${amPm}`;
        let dateWithoutDay = datePart.split(' ').slice(1).join(' ');

        // Объединяем строку для парсинга
        rawDate = `${dateWithoutDay} ${yearPart} ${timeWithoutTZ}`;
    }
        
    let data = {
        link: url,
        header: $("div.headline__wrapper").text().trim(),
        author: $("div.byline__names").text()
                                        .substring(6)
                                        .replace(/\s+and\s+/g, ', ')
                                        .replace(/,\s*CNN$/, '')
                                        .split(', ')
                                        .map(name => name.trim()),
        publish_date: rawDate ? normalizeDate(rawDate, "MMMM d yyyy h:mm a") : '',
        reading_time: $("div.headline__sub-description").text().replace('read', '').trim(),
        category: $("div.breadcrumb").text().split('/').map(cat => cat.trim()),
        text: $("div.article__content-container p").map((i, el) => $(el).text().trim()).get().join(' '),
    };

    return data;
}

async function scrapeEuronews(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36'
        }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    let oldDateFormat = "yyyy-MM-dd HH:mm xxx";

    // Проверка, существует ли блок swiper-slide-active
    let doc = $("div.swiper-slide-active").length ? $("div.swiper-slide-active") : $("body");

    // Получение дат публикации и обновления
    let rawPublishDate = doc.find("div.c-article-publication-date time").first().attr('datetime');
    let rawUpdateDate = doc.find("div.c-article-publication-date time").length > 1 
        ? doc.find("div.c-article-publication-date time").last().attr('datetime') 
        : '';

    // Обработка случаев, когда update дата имеет короткий формат (например, только время)
    if (rawUpdateDate && rawUpdateDate.length === 5) {
        let newUpdate = rawPublishDate.split(' ');
        newUpdate[1] = rawUpdateDate;
        rawUpdateDate = newUpdate.join(' ');
    }

    // Извлечение данных
    let data = {
        link: url,
        header: doc.find("h1").text().trim(),
        author: doc.find("div.c-article-contributors").text().trim().replace(/^By\s*/, ''),
        publish_date: rawPublishDate ? normalizeDate(rawPublishDate, oldDateFormat) : '',
        update_date: rawUpdateDate ? normalizeDate(rawUpdateDate, oldDateFormat) : '',
        category: doc.find("#adb-article-breadcrumb a.active").text().trim(),
        summary: doc.find("p.c-article-summary").text().trim(),
        text: doc.find("div.c-article-content p").map((i, el) => $(el).text().trim()).get().join(' '),
    };

    return data;
}


async function scrapeFoxnews(url) {
    let html = await request(url);
    let $ = cheerio.load(html);
    
    let rawPublishDate = $("time").text().split('EDT')[0].trim().replace(/\s[A-Z]{2,4}$/, '');

    let data = {
        link: url,
        header: $("h1.headline").text().trim(),
        subheader: $("h2.sub-headline").text().trim(),
        author: $("div.author-byline span span").text()
                                        .replace(/By\n\s*/, '')
                                        .trim(),
        publish_date: rawPublishDate ? normalizeDate(rawPublishDate.toString(), "MMMM d, yyyy h:mma") : '',
        category: $("span.eyebrow").text().trim(),
        text: $("div.article-content p").map((i, el) => $(el).text().trim()).get().join(' '),
    };
    
    return data;
}

async function scrapeMetro(url) {
    let html = await request(url);
    let $ = cheerio.load(html);
    
    let oldDateFormat = "MMM d, yyyy, h:mma";
    let rawPublishDate = $('span.post-published').text().trim().replace('Published', '').trim();
    let rawUpdateDate = $('span.post-modified').text().replace('|', ' ').replace('Updated', '').trim();

    let data = {
        link: url,
        header: $("h1.post-title").text().trim(),
        author: $("span.author-container").text().trim(),
        publish_date: rawPublishDate ? normalizeDate(rawPublishDate, oldDateFormat) : '',
        update_date: rawUpdateDate ? normalizeDate(rawUpdateDate, oldDateFormat) : '',
        category: $('div.met-breadcrumb').text().split('›').map(cat => cat.trim()),
        text: $('div.article-body p').map((i, el) => $(el).text().trim()).get().join(' '),
    }

    return data;
}

async function scrapeSun(url) {
    let html = await request(url);
    let $ = cheerio.load(html);

    let data = {
        link: url,
        header: $("h1").text().trim(),
        subheader: $("div.article__subdeck").text().trim(),
        author: $("div.article__author").text().trim(),
        publish_date: parseISO($("li.article__published").find('time').attr('datetime')),
        update_date: parseISO($("li.article__updated").find('time').attr('datetime')),
        category: $('ul.breadcrumbs li a').map((i, el) => $(el).text().trim()).get(),
        text: $('div.article__content p').map((i, el) => $(el).text().trim()).get().join(' '),
    };
    
    return data;
}

async function scrapeWebsite(url, site) {
    try {  
        let fScrape;
        let data;
        switch (site.toLowerCase()) {
            case "cnn":
                fScrape = scrapeCNN;
                break;
            case "euronews":
                fScrape = scrapeEuronews;
                break;
            case "foxnews":
                fScrape = scrapeFoxnews;
                break;
            case "metro":
                fScrape = scrapeMetro;
                break;
            case "thesun":
                fScrape = scrapeSun;
                break;
            default: 
                console.log("Веб-сайт не определен");
                return null;
        }

        data = await fScrape(url);
        return data;
  
    } catch (error) {
      console.error(`Ошибка при парсинге ${url}:`, error.message);
    }
  }

async function writeToCSV(data, save_path) {
    try {
        // Проверяем, существует ли файл
        const fileExists = fs.existsSync(save_path);
        
        // Генерация заголовков на основе ключей объекта
        const headers = Object.keys(data).map(key => ({ id: key, title: key }));
        
        // Создаем CSV Writer с этими заголовками
        const csvWriter = createObjectCsvWriter({
            path: save_path,
            header: headers,
            append: fileExists // true для добавления данных по мере их поступления, false для записи с заголовками
        });

        await csvWriter.writeRecords([data]); 
        console.log("Данные успешно записаны в CSV.");

    } catch (error) {
        console.error("Ошибка при записи в CSV:", error.message);
    }
}

// Добавление данных о начале и конце парсинга
async function startScraping() {
    const session = await ScrapingSession.create({
        start_time: new Date()
    });

    const sessionId = session.id;

    console.log(`Началась сессия сбора данных. ID: ${sessionId}`);

    return sessionId;
}

async function endScraping(sessionId, totalArticles) {
    try {
        await ScrapingSession.update(
            {
                end_time: new Date(),
                status: 'completed',
                total_articles: totalArticles
            },
            {
                where: { id: sessionId }
            }
        );
        console.log(`Сессия ${sessionId} завершена. Всего статей: ${totalArticles}`);
    } catch (error) {
        console.error(`Ошибка завершения сессии ${sessionId}`, error);
    }
}

async function scrapeAllWebsites(sources, n=sources.length) {
    const sessionId = await startScraping(); // Запуск сессии сбора данных
    let totalArticles = 0;

    // Создаем массив промисов для каждого сайта
    const sitePromises = Object.entries(sources).map(async ([site, links]) => {
        console.log(`\n\n=== Начинаем парсинг первых ${n} ссылок для сайта: ${site} ===`);
        let save_path = `./${site}.csv`;

        // Ограничиваем количество ссылок до n и запускаем последовательную обработку с задержкой
        for (const url of links.slice(0, n)) {
            console.log(`\nПарсим ссылку: ${url}`);
            let data = await scrapeWebsite(url, site);
            await writeToCSV(data, save_path);
            if (data) {
                data.source = site;
                const isSaved = await saveArticle(data, sessionId);
                if (isSaved) {
                    totalArticles++;
                }
            }
            await delay(20000); // Задержка 20 секунд между запросами для одного сайта
        }

        console.log(`\nЗавершен парсинг ссылок для сайта: ${site}\n\n`);
    });

    // Запускаем парсинг для всех сайтов одновременно
    await Promise.all(sitePromises);
    console.log(`\n=== Парсинг завершен для всех сайтов ===`);

    // Завершаем сессию
    await endScraping(sessionId, totalArticles);
}


module.exports = {
    scrapeAllWebsites
}