const axios = require('axios');
const cheerio = require('cheerio');
const {scrapeAllWebsites} = require('./NewsScrapers')

let url = 'https://edition.cnn.com/style';

async function getCNNLinks(url) {
    try {
        // Загружаем HTML страницы
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Выбираем блок с новостями
        const newsBlock = $('div[data-editable="items"]');

        // Извлекаем все ссылки внутри этого блока
        const links = [];
        newsBlock.find('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                // Приводим относительные ссылки к абсолютному виду, если нужно
                const absoluteLink = link.startsWith('http') ? link : `https://edition.cnn.com${link}`;
                links.push(absoluteLink);
            }
        });

        return links;
    } catch (error) {
        console.error('Error fetching or parsing page:', error);
        return [];
    }
}

async function getSources(url, site) {
    try {
        let fGetLinks;
        let 
        switch (site.toLowerCase()) {
            case "cnn":
                fGetLinks = getCNNLinks;
                break;
            case "euronews":
                fGetLinks = getEuroLinks;
                break;
            case "foxnews":
                fGetLinks = getFoxLinks;
                break;
            case "metro":
                fGetLinks = getMetroLinks;
                break;
            case "thesun":
                fGetLinks = getSunLinks;
                break;
            default: 
                console.log("Веб-сайт не определен");
                return null;
        }
    }
    catch (error) {
        console.error(`Ошибка при парсинге ${url}:`, error.message);
      }
}

getCNNLinks().then((links) => console.log(links));



// getCNNLinks(url).then((cnn_links) => {
//     const sources = {
//         'cnn': cnn_links
//     };
    
//     scrapeAllWebsites(sources);
// });
