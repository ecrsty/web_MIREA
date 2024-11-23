const sequelize = require('./database');
const Article = require('./models/article');
const ScrapingSession = require('./models/scrapingSession');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Соединение с БД успешно установлено.');

    // Синхронизируем модель с БД
    await sequelize.sync();
    console.log('Модели синхронизированы с БД.');

  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
  }
})();
