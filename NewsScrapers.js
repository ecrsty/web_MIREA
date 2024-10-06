const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs')
const { createObjectCsvWriter } = require('csv-writer'); // забираем только нужный метод из модуля


// Функция для задержки между запросами
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const urls = [
    "https://edition.cnn.com/2024/09/23/tech/social-media-ai-data-opt-out",
    "https://www.euronews.com/business/2024/09/06/uk-house-prices-hit-two-year-high-after-positive-summer-for-market",
    "https://www.foxbusiness.com/technology/man-charged-using-bots-stream-ai-generated-songs-10m-royalties",
    "https://metro.co.uk/2024/09/08/danger-life-warning-place-100mm-rain-forecast-uk-21565559/",
    "https://www.thesun.co.uk/news/30829932/teenage-girl-killed-motorway-crash-m65-burnley/"
]

const sources = {
    'cnn' : [
        "https://edition.cnn.com/2024/09/05/europe/munich-police-shoot-armed-suspect-intl",
        "https://edition.cnn.com/style/cairo-forbes-international-tower-hydrogen-nac-spc/",
        "https://edition.cnn.com/2024/09/27/tech/proto-hologram-boxes-3d-video-spc/",
        "https://edition.cnn.com/2024/09/23/tech/new-emoji-2024",
        "https://edition.cnn.com/2024/09/23/tech/social-media-ai-data-opt-out",
        "https://edition.cnn.com/2024/09/23/tech/voiceitt-voice-recognition-speech-impairments-spc/",
        "https://edition.cnn.com/2024/08/29/style/south-korea-k-pop-idols-tv-show-intl-hnk/"
    ],
    'euronews' : [
         "https://www.euronews.com/business/2024/09/05/volvo-reverses-plan-to-sell-only-electric-cars-by-2030-as-demand-falls",
         "https://www.euronews.com/business/2024/09/06/uk-house-prices-hit-two-year-high-after-positive-summer-for-market",
         "https://www.euronews.com/green/2024/09/24/european-digital-twin-ocean",
         "https://www.euronews.com/green/2024/10/01/worth-its-salt-can-desalination-help-address-europes-freshwater-needs",
         "https://www.euronews.com/health/2024/10/03/one-million-people-in-england-who-never-regularly-smoked-are-now-vaping",
         "https://www.euronews.com/health/2024/10/02/bright-light-therapy-works-for-about-40-of-depression-patients-analysis-shows",
         "https://www.euronews.com/health/2024/09/30/over-75-of-3-and-4-year-olds-in-europe-get-too-much-screen-time-and-not-enough-sleep-and-e"
    ],
    'foxnews' : [
        "https://www.foxnews.com/world/ancient-painting-revealed-egypt-beneath-layers-bird-poop",
        "https://www.foxnews.com/lifestyle/creative-couples-halloween-costumes",
        "https://www.foxnews.com/world/archaeologists-discover-5000-year-old-ancient-community-morocco",
        "https://www.foxnews.com/world/thailand-school-bus-bursts-flames-outside-bangkok-feared-dead-officials-say",
        "https://www.foxnews.com/world/flooding-landslides-kill-200-nepal",
        "https://www.foxnews.com/lifestyle/light-options-to-brighten-your-home",
        "https://www.foxnews.com/lifestyle/kitchen-appliances-amazon-prime-big-deal-days"
    ],
    'metro' : [
        "https://metro.co.uk/2024/10/02/parents-brand-school-lunches-shocking-disgusting-21723214/",
        "https://metro.co.uk/2024/10/03/heinz-makes-cheeky-change-baked-beanz-solving-a-common-problem-21726646/",
        "https://metro.co.uk/2024/10/03/found-a-painting-dump-aged-11-just-sold-26-500-21692653/",
        "https://metro.co.uk/2024/10/03/role-applying-might-a-ghost-job-spot-warning-signs-21722354/",
        "https://metro.co.uk/2024/10/03/cutest-homeware-brand-prices-1-opens-new-spin-off-store-21726744/",
        "https://metro.co.uk/2024/10/03/inside-mesmerising-mcdonalds-restaurant-hosts-late-night-dj-sets-4am-21727934/",
        "https://metro.co.uk/2024/10/02/new-planet-discovered-orbiting-a-star-close-earth-21719284/",
        "https://metro.co.uk/2024/10/02/whatsapp-confirms-a-major-new-update-video-calls-happening-21721022/"

    ],
    'thesun' : [
        "https://www.thesun.co.uk/news/30829932/teenage-girl-killed-motorway-crash-m65-burnley/",
        "https://www.thesun.co.uk/news/30815467/inside-evil-corp-hacking-family-russia-maksim/",
        "https://www.thesun.co.uk/news/30842703/westminster-academy-acid-attack-arrest/",
        "https://www.thesun.co.uk/news/30831180/parents-kids-career-creative-industry/",
        "https://www.thesun.co.uk/sport/18922011/win-watch-7dp/",
        "https://www.thesun.co.uk/health/30791629/smoking-rates-record-low-uk-vaping-rise-millions/",
        "https://www.thesun.co.uk/tvandshowbiz/30832143/paul-ogrady-countryside-mansion-sale-neighbours-row/"
    ]
}

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

        data = await fScrape(url, site);
        // console.log(data);
        return data;
  
    } catch (error) {
      console.error(`Ошибка при парсинге ${url}:`, error.message);
    }
  }

const test_data = {
    header: "‘Danger to life’ weather warning in place today with 100mm of rain forecast in UK",
    author: "Josh Milton",
    publish_date: "Published Sep 8, 2024, 5:45am",
    modif_date: "Updated Sep 8, 2024, 3:13pm",
    category: [
      "Home",
      "News",
      "UK",
    ],
    text: "With a yellow weather warning covering two-thirds of England and Wales in place, you can probably guess the weather won’t be great today. The warning for heavy and thundery rain started yesterday at 9pm and will end at 8pm today. While forecasters admit the outlook for today remains uncertain, they expect it to bucket it down in western England and southern Wales especially. Slow-moving showers and thunderstorms, meanwhile, will crawl across the east. How much rain you will see will vary wildly. Some might see only 10mm or so, while others in areas under the yellow weather warning might see up to 60mm. ‘There is a lower chance that a few spots within the warning area could see 80-100 mm of rain by the end of Sunday which may fall in a fairly small period of time,’ the warning says. ‘These higher totals are slightly more probable in the southern half of the warning area. ‘Given this region has also seen a lot of rain since Thursday, impacts may be more likely than would normally be expected for the time of year here.’ Weather officials issue a yellow weather warning when the weather is ‘likely’ to cause some upheaval. Power outages are possible today, as is flooding that could damage buildings, delay public transport and cut communities off due to flooded roads. Spray and flooding may make driving tricky. To get the latest news from the capital visit Metro.co.uk's London news hub. ‘There is a small chance of fast flowing or deep floodwater causing danger to life,’ the alert adds. Met Office Chief Meteorologist Matthew Lehnert said: ‘It’s a different story further north though, as high pressure brings warmer and sunnier conditions, with higher-than-average temperatures, particularly across parts of western Scotland. Major discount store with more than 800 shops nationwide to close branch Teenager compared to a 'burnt chip' urges younger generations not to use sunbeds London Underground 'ghost ride' that sees trains stop at the same station twice Protesters clash with police cordon after thousands march through central London ‘Eastern areas are likely to be cooler and at times, cloudier due to winds blowing off the North Sea.’ After several days of non-stop yellow weather warnings, however, next week doesn’t look so bad. None are currently in place for a start. But forecasters say things will remain ‘unsettled’ and even a tad cold on Tuesday as the wind direction changes. The north will be feeling the cold especially with showers or long spells of rain and blustery wind expected for most of the UK. Get in touch with our news team by emailing us at webnews@metro.co.uk. For more stories like this, check our news page. MORE : This is officially the unhappiest place to live in the UK MORE : 721 children treated by ‘rogue surgeon’ at Great Ormond Street MORE : Plane crashes into east London field with man in hospital Privacy Policy",
  }

// scrapeWebsite(urls[3], "metro")
// scrapeWebsite(urls[4], "thesun")

// const csvWriterCNN = createObjectCsvWriter({
//     path: './cnn.csv',
//     header: Object.keys(cnnSelectors).map(key => ({ id: key, title: key }))
//   });
//   await csvWriter.writeRecords([data]);

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

        await csvWriter.writeRecords([data]); // Пишем данные
        console.log("Данные успешно записаны в CSV.");
    } catch (error) {
        console.error("Ошибка при записи в CSV:", error.message);
    }
}


// Тестовая функция для проверки задержки
async function testDelayFunction() {
    for (const [site, links] of Object.entries(sources)) {
        console.log(`\n\n=== Проверка задержки для сайта: ${site} ===`);
        let save_path = `./${site}.csv`;
        console.log("Сохраняем в: "+save_path);

        for (const url of links) {
            console.log(`\nПроверяем задержку на ссылке: ${url}`);
            await writeToCSV(test_data, save_path)
            await delay(10000); // Задержка 10 секунд
        }

        console.log(`\nЗавершена проверка задержки для сайта: ${site}\n\n`);
    }
}

// Запуск тестовой функции
testDelayFunction();


// async function scrapeAllWebsites() {
//     for (const [site, links] of Object.entries(sources)) {
//         console.log(`\n\n=== Парсинг ссылок для сайта: ${site} ===`);
//         let save_path = `./${site}.csv`;

//         for (const url of links) {
//             console.log(`\nПарсим ссылку: ${url}`);
//             let data = await scrapeWebsite(url, site); // Парсим данные с текущей ссылки
//             await delay(20000); // Задержка 10 секунд между запросами
//         }

//         console.log(`\nЗавершен парсинг ссылок для сайта: ${site}\n\n`);
//     }
// }

// // Запуск функции парсинга всех сайтов
// scrapeAllWebsites();

