const fs = require('fs');
const csv = require('csv-parser');

function countRecords(filePath) {
    return new Promise((resolve, reject) => {
        let count = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', () => count++)
            .on('end', () => resolve(count))
            .on('error', reject);
    });
}

function countUniqueWords(filePath) {
    return new Promise((resolve, reject) => {
        let wordsSet = new Set();

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                let words = row.text.toLowerCase().match(/\w+/g);
                words.forEach(word => wordsSet.add(word));
            })
            .on('end', () => resolve(wordsSet.size))
            .on('error', reject);
    });
}

function getWordStats(filePath) {
    return new Promise((resolve, reject) => {
        let wordCounts = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                let wordCount = row.text.match(/\w+/g)?.length || 0;
                wordCounts.push(wordCount);
            })
            .on('end', () => {
                const min = Math.min(...wordCounts);
                const max = Math.max(...wordCounts);
                const sum = wordCounts.reduce((a, b) => a + b, 0);
                const avg = sum / wordCounts.length;
                
                wordCounts.sort((a, b) => a - b);
                const mid = Math.floor(wordCounts.length / 2);
                const median = wordCounts.length % 2 === 0 
                    ? (wordCounts[mid - 1] + wordCounts[mid]) / 2 
                    : wordCounts[mid];

                resolve({ min, max, avg, median });
            })
            .on('error', reject);
    });
}


function getDateRange(filePath) {
    return new Promise((resolve, reject) => {
        let dates = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                let date = new Date(row.publish_date);
                if (!isNaN(date)) dates.push(date);
            })
            .on('end', () => {
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));
                resolve({ minDate, maxDate });
            })
            .on('error', reject);
    });
}

function getMissingValues(filePath) {
    return new Promise((resolve, reject) => {
        let totals = {};
        let missing = {};
        let rowCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                rowCount++;
                Object.keys(row).forEach(key => {
                    if (!totals[key]) totals[key] = 0;
                    if (!missing[key]) missing[key] = 0;

                    totals[key]++;
                    if (!row[key].trim()) missing[key]++;
                });
            })
            .on('end', () => {
                let missingPercentages = {};
                Object.keys(totals).forEach(key => {
                    missingPercentages[key] = (missing[key] / rowCount) * 100;
                });
                resolve(missingPercentages);
            })
            .on('error', reject);
    });
}


async function analyzeCSV(filePath) {
    const recordCount = await countRecords(filePath);
    const uniqueWords = await countUniqueWords(filePath);
    const wordStats = await getWordStats(filePath);
    const dateRange = await getDateRange(filePath);
    const missingValues = await getMissingValues(filePath);

    console.log(`Количество записей: ${recordCount}`);
    console.log(`Количество уникальных слов: ${uniqueWords}`);
    console.log(`Минимальное количество слов: ${wordStats.min}`);
    console.log(`Максимальное количество слов: ${wordStats.max}`);
    console.log(`Среднее количество слов: ${wordStats.avg}`);
    console.log(`Медианное количество слов: ${wordStats.median}`);
    console.log(`Диапазон дат: от ${dateRange.minDate} до ${dateRange.maxDate}`);
    console.log(`Доля пропусков:`, missingValues);
}

// Пример вызова функции анализа CSV
analyzeCSV('./foxnews.csv');
