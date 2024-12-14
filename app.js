const sequelize = require('./database');
const {getSources} = require('./link_scraper');
const {scrapeAllWebsites} = require('./NewsScrapers');

// Соединение с БД, синхронизация, запуск сбора данных
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Соединение с БД успешно установлено.');

    // Синхронизируем модель с БД
    await sequelize.sync();
    console.log('Модели синхронизированы с БД.');

    getSources().then(sources => {
          scrapeAllWebsites(sources, 50); // Запуск scrapeAllWebsites с собранными ссылками
      });

  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
  }
})();
