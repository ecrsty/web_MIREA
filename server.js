const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./database');
const Article = require('./models/article'); // Модель статьи
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'website')));

// подключение промежуточных функций для разрешения запросов 
// с других доменов и метода обработки JSON-объектов
app.use(cors());
app.use(bodyParser.json());

app.get('/sources', async (req, res) => {
    const sources = ['cnn', 'euronews', 'foxnews', 'metro', 'thesun']; 
    res.json(sources);
  });

// получение всех статей
app.get('/articles', async (req, res) => {
  try {
    const articles = await Article.findAll();
    res.json(articles);
  } catch (error) {
    console.error('Ошибка при получении статей:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Получение статьи по ID
app.get('/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      res.json(article);
    } else {
      res.status(404).send('Статья не найдена');
    }
  } catch (error) {
    console.error('Ошибка при получении статьи:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Получение данных по источникам
app.get('/analytics', async (req, res) => {
  try {
    const articles = await Article.findAll();
    const analytics = articles.reduce((acc, article) => {
      if (!acc[article.source]) {
        acc[article.source] = { count: 0, updated: 0, notUpdated: 0 };
      }
      acc[article.source].count += 1;
      if (article.update_date) {
        acc[article.source].updated += 1;
      } else {
        acc[article.source].notUpdated += 1;
      }
      return acc;
    }, {});
    res.json(analytics);
  } catch (error) {
    console.error('Ошибка при получении аналитики:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Запуск сервера
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно установлено');
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
  }
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
