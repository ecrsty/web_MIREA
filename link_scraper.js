const axios = require('axios');
const cheerio = require('cheerio');
const {scrapeAllWebsites} = require('./NewsScrapers')

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
            if (link && !link.includes('/live-news/') && !link.includes('/video/') && !link.includes('/videos/')) {
                // Приводим относительные ссылки к абсолютному виду, если нужно
                const absoluteLink = link.startsWith('http') ? link : `https://edition.cnn.com${link}`;
                links.push(absoluteLink);
            }
        });

        // Убираем дубликаты
        const uniqueLinks = [...new Set(links)];

        return uniqueLinks;
    } catch (error) {
        console.error('Ошибка при получении ссылок:', error);
        return [];
    }
}    

async function getEuroLinks(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Блок, содержащий ссылки на статьи
        const links = [];

        // Извлекаем ссылки из блока #enw-main-content
        $('#enw-main-content').find('a.m-object__title__link').each((index, element) => {
            let link = $(element).attr('href');

            if (link && !link.includes('/video/')) {
                // Преобразуем относительные ссылки в абсолютные
                link = link.startsWith('/') ? `https://www.euronews.com${link}` : link;

                // Исключаем ссылки на прямые эфиры
                if (link.startsWith('https://www.euronews.com') && !link.includes('/live')) {
                    links.push(link);
                }
            }
        });

        // Убираем дубликаты
        const uniqueLinks = [...new Set(links)];

        return uniqueLinks;
    } catch (error) {
        console.error('Ошибка при получении ссылок:', error);
        return [];
    }
}

async function getFoxLinks(url) {
    try {
        // Загружаем HTML страницы
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Находим все секции, содержащие статьи
        const sections = [
            'main.main-content.main-content-primary',
            'main.main-content.main-content-secondary',
            'main.main-content-full.main-content-full-secondary',
            'div.section-bucket-container'
        ];

        let links = [];

        // Извлекаем ссылки из указанных секций
        sections.forEach((selector) => {
            $(selector).find('a').each((index, element) => {
                let link = $(element).attr('href');

                // Проверяем, чтобы ссылка была не на категорию
                if (link && !link.includes('/category/') && !link.includes('//www.outkick.com') && !link.includes('/video/')) {
                    // Преобразуем относительные ссылки в абсолютные
                    if (link.startsWith('/')) {
                        link = `https:${link}`;
                    }

                    // Проверяем, чтобы ссылка содержала как минимум два сегмента после домена
                    const pathSegments = new URL(link).pathname.split('/').filter(Boolean);

                    // Условие: Ссылка на статью должна иметь больше одного сегмента в пути
                    if (pathSegments.length > 1 && link.startsWith('https://www.foxnews.com')) {
                        links.push(link);
                    }
                }
            });
        });

        // Убираем дубликаты
        links = [...new Set(links)];

        return links;
    } catch (error) {
        console.error('Ошибка при получении ссылок:', error);
        return [];
    }
}

async function getMetroLinks(url) {
    try {
        // Загружаем HTML страницы
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Выбираем блок с новостями
        const newsBlock = $('div.pageBackground');

        // Извлекаем все ссылки внутри этого блока
        const links = [];
        newsBlock.find('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                // Приводим относительные ссылки к абсолютному виду, если нужно
                const absoluteLink = link.startsWith('http') ? link : `https://metro.co.uk/${link}`;

                // Проверяем, чтобы ссылка содержала как минимум два сегмента после домена
                const pathSegments = new URL(absoluteLink).pathname.split('/').filter(Boolean);

                // Условие: Ссылка на статью должна иметь больше одного сегмента в пути
                if (pathSegments.length > 3 && link.startsWith('https://metro.co.uk/')) {
                    links.push(absoluteLink);
                }
            }
        });

        // Убираем дубликаты
        const uniqueLinks = [...new Set(links)];

        return uniqueLinks;
    } catch (error) {
        console.error('Ошибка при получении ссылок:', error);
        return [];
    }
}  


async function getSunLinks(url) {
    try {
        // Загружаем HTML страницы
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Выбираем блок с новостями
        const newsBlock = $('div[class*="sun-customiser"]');

        // Извлекаем все ссылки внутри этого блока
        const links = [];
        newsBlock.find('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                // Приводим относительные ссылки к абсолютному виду, если нужно
                const absoluteLink = link.startsWith('http') ? link : `https://www.thesun.co.uk/${link}`;

                // Проверяем, чтобы ссылка содержала как минимум два сегмента после домена
                const pathSegments = new URL(absoluteLink).pathname.split('/').filter(Boolean);

                // Условие: Ссылка на статью должна иметь больше одного сегмента в пути
                if (pathSegments.length > 2 && link.startsWith('https://www.thesun.co.uk/')) {
                    links.push(absoluteLink);
                }
            }
        });

        // Убираем дубликаты
        const uniqueLinks = [...new Set(links)];

        return uniqueLinks;
    } catch (error) {
        console.error('Ошибка при получении ссылок:', error);
        return [];
    }
}

async function getSources() {
    const sites = [
        { name: 'cnn', url: 'https://edition.cnn.com/', fetchLinks: getCNNLinks },
        { name: 'euronews', url: 'https://www.euronews.com/', fetchLinks: getEuroLinks },
        { name: 'foxnews', url: 'https://www.foxnews.com/', fetchLinks: getFoxLinks },
        { name: 'metro', url: 'https://metro.co.uk/', fetchLinks: getMetroLinks },
        { name: 'thesun', url: 'https://www.thesun.co.uk/', fetchLinks: getSunLinks }
    ];

    try {
        // Запускаем все асинхронные запросы для получения ссылок
        const results = await Promise.all(sites.map(async ({ name, url, fetchLinks }) => {
            const links = await fetchLinks(url);
            return [name, links]; // Возвращаем массив [название сайта, массив ссылок]
        }));

        // Преобразуем массив результатов в объект
        const sources = Object.fromEntries(results);
        console.log("\n=== Все ссылки собраны ===");
        return sources;
    } catch (error) {
        console.error("Ошибка при сборе ссылок:", error);
        return {};
    }
}

// Вызов функции для передачи в scrapeAllWebsites
// getSources().then(sources => {
//     scrapeAllWebsites(sources, 50); // Запуск scrapeAllWebsites с собранными ссылками
// });

module.exports = {
    getSources
}
