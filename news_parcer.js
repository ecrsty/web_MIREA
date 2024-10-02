const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const csvWriter = require('csv-write-stream');
let writer;

// Функция для задержки между запросами
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let sources = {
    "cnn" : {
        site: "CNN",
        selectors: {
            header: "div.headline__wrapper",
            author: "div.byline__names",
            publish_date: "div.timestamp",
            reading_time: "div.headline__sub-description",
            category: "div.breadcrumb",
            text: "div.article__content-container p"
        },
        csvPath: "./cnn.csv"
    },
    "euronews" : {
        site: "Euronews",
        selectors: {
            header: "h1",
            author: "div.c-article-contributors",
            publish_date: "time",
            category: "#adb-article-breadcrumb a.active",
            summary: "p.c-article-summary",
            text: "div.c-article-content p"
        },
        csvPath: "./euronews.csv"
    },
    "foxnews" : {
        site: "FoxNews",
        selectors: {
            header: "h1.headline",
            subheader: "h2.sub-headline",
            author: "span.author",
            publish_date: "time",
            category: "div.eyebrow",
            text: "div.article-content p"
        },
        csvPath: "./foxnews.csv"
    },
    "reuters" : {
        site: "Reuters",
        selectors: {
            header: "h1",
            author: 'a[rel="author"]',
            author_with_editors: 'div[class*="article-body"] p[data-testid="Body"]',
            publish_date: 'time[data-testid="Body"]',
            category: 'a[aria-label*="category"]',
            text: 'div[class*="article-body__content"] div[data-testid*="paragraph"]'
        },
        csvPath: "./reuters.csv"
    },
    "metro" : {
        site: "METRO",
        selectors: {
            header: "h1.post-title",
            author: "span.author-container",
            publish_date: 'span.post-published',
            modif_date: 'span.post-modified',
            category: 'div.met-breadcrumb',
            text: 'div.article-body p'
        },
        csvPath: "./metro.csv"
    }
}

const urls = [
    "https://edition.cnn.com/2024/09/05/europe/munich-police-shoot-armed-suspect-intl",
    "https://www.euronews.com/business/2024/09/06/uk-house-prices-hit-two-year-high-after-positive-summer-for-market",
    "https://www.foxbusiness.com/technology/man-charged-using-bots-stream-ai-generated-songs-10m-royalties",
    "https://www.reuters.com/markets/us/new-us-etfs-being-launched-record-pace-2024-2024-08-22/",
    "https://metro.co.uk/2024/09/08/danger-life-warning-place-100mm-rain-forecast-uk-21565559/"
]

async function scrapeCNN(url, sources) {
    let html = await request(url);
    let $ = cheerio.load(html);
    console.log(html);

    let selectors = sources["CNN"];
    let data = {
        header: $(selectors.header).text().trim(),
        author: $(selectors.author).text().trim(),
        publish_date: $(selectors.publish_date).text().trim(),
        reading_time: $(selectors.reading_time).text().trim(),
        category: $(selectors.category).text().trim(),
        text: $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
    };
    return data;
}


async function scrapeWebsite(url, site, selectors, csvWriter) {
    try {
        // const requestOptions = {
        //     uri: url,
        //     headers: {
        //         "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        //         "Accept-Encoding": "gzip, deflate",
        //         "Accept-Language": "ru,en;q=0.9",
        //         "Cache-Control": "max-age=0",
        //         "Upgrade-Insecure-Requests": "1",
        //         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 YaBrowser/24.7.0.0 Safari/537.36",
        //         "X-Amzn-Trace-Id": "Root=1-66fd8545-3750b7205c7eef2a408972de"
        //       }
        //   };  
        const html = await request(url);
        const $ = cheerio.load(html);
        // console.log(html)
  
        let data;
        switch (site) {
            case "CNN":
                data = {
                    header: $(selectors.header).text().trim(),
                    author: $(selectors.author).text().trim(),
                    publish_date: $(selectors.publish_date).text().trim(),
                    reading_time: $(selectors.reading_time).text().trim(),
                    category: $(selectors.category).text().trim(),
                    text: $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
                };
                console.log(data);
                break;
            case "Euronews":
                const doc = $("div.swiper-slide-active")
                data = {
                    header: doc(selectors.header).text().trim(),
                    author: doc(selectors.author).text().trim(),
                    publish_date: doc(selectors.publish_date).text().trim(),
                    category: doc(selectors.category).text().trim(),
                    summary: doc(selectors.summary).text().trim(),
                    text: doc(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
                };
                console.log(data);
                break;
            case "FoxNews":
                data = {
                    header: $(selectors.header).text().trim(),
                    subheader: $(selectors.subheader).text().trim(),
                    author: $(selectors.author).text().trim(),
                    publish_date: $(selectors.publish_date).text().trim(),
                    category: $(selectors.category).text().trim(),
                    text: $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
                }
                console.log(data);
                break;
            case "Reuters":
                data = {
                    header: $(selectors.header).text().trim(),
                    author: $(selectors.author).text().trim(),
                    author_with_editors: $(selectors.author_with_editors).text().trim(),
                    publish_date: $(selectors.publish_date).text().trim(),
                    category: $(selectors.category).text().trim(),
                    text: $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
                }
                console.log(data);
                break;
            case "METRO":
                data = {
                    header: $(selectors.header).text().trim(),
                    author: $(selectors.author).text().trim(),
                    publish_date: $(selectors.publish_date).text().trim(),
                    modif_date: $(selectors.modif_date).text().trim(),
                    category: $(selectors.category).text().trim(),
                    text: $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
                }
                console.log(data);
                break;
            default: 
                console.log("Веб-сайт не определен");
        }
    
        await csvWriter.writeRecords([data]);
        console.log(`Данные сохранены для: ${url}`);
  
    } catch (error) {
      console.error(`Ошибка при парсинге ${url}:`, error.message);
    }
  }




scrapeWebsite(urls[0], sources["cnn"].site, sources["cnn"].selectors, csvWriter)

// не идет парсинг euronews (needs vpn) and reuters (geo-captcha) 




// Функция для создания CSV-файла с заголовками, если файл еще не существует
// function createCSVFile(filePath) {
//     if (!fs.existsSync(filePath)) {
//         // Если файл не существует, создаем его и записываем заголовки
//         writer = csvWriter({ sendHeaders: true }); // Включаем заголовки
//         writer.pipe(fs.createWriteStream(filePath));
//         writer.write({
//             title: 'Title',
//             author: 'Author',
//             date: 'Date',
//             readingTime: 'Reading Time',
//             category: 'Category',
//             text: 'Text'
//         });
//         writer.end();
//         console.log('Создан новый файл с заголовками.');
//     } else {
//         // Если файл уже существует, не пишем заголовки
//         writer = csvWriter({ sendHeaders: false });
//         writer.pipe(fs.createWriteStream(filePath, { flags: 'a' })); // Дозаписываем в существующий файл
//     }
// }





// Функция для извлечения данных
// async function scrapeData(url, selectors) {
//     try {
//         // Получение HtML кода страницы
//         const html = await request(url);
//         // Преобразование в объект для парсинга
//         const $ = cheerio.load(html);
        
//         const title = $(selectors.title).text().trim();
//         const author = $(selectors.author).text().trim();
//         const date = $(selectors.date).text().trim();
//         const readingTime = $(selectors.readingTime).text().trim();
//         const category = $(selectors.category).text().split('/').map(s => s.trim()).join(', ');
//         const text = $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' ');

//         // const data = {
//         //     title: $(selectors.title).text().trim(),
//         //     author: $(selectors.author).text().trim(),
//         //     date: $(selectors.date).text().trim(),
//         //     category: $(selectors.category).text().trim(),
//         //     text: $(selectors.text).map((i, el) => $(el).text().trim()).get().join(' '),
//         //   };

//         // Добавляем данные в CSV
//         writer.pipe(fs.createWriteStream(filePath, {flags: 'a'})); // Добавляем данные в конец файла
//         writer.write({title, author, date, readingTime, category, text});
//         writer.end();

//         console.log(`Данные с ${url} успешно сохранены.`);
//     } catch (error) {
//         console.error(`Ошибка при обработке ${url}:`, error.message);
//     }
// }