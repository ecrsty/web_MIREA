const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./database');
const Article = require('./models/article'); 
const path = require('path');
const os = require('os');
const { format } = require('date-fns');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'website')));

// Подключение промежуточных функций для разрешения запросов 
// с других доменов и метода обработки JSON-объектов
app.use(cors());
app.use(bodyParser.json());


app.get('/server-info', (req, res) => {
  try {
    const serverInfo = {
      Platform: os.platform(),
      Architecture: os.arch(),
      Hostname: os.hostname(),
      "Total Memory": `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
      "Free Memory": `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
      CPUs: os.cpus().length,
      "Uptime (hours)": (os.uptime() / 3600).toFixed(2),
    };
    res.json(serverInfo);
  } catch (error) {
    console.error('Ошибка получения информации о сервере:', error);
    res.status(500).json({ error: 'Failed to fetch server info' });
  }
});


app.get('/sources', async (req, res) => {
    const sources = ['cnn', 'euronews', 'foxnews', 'metro', 'thesun']; 
    res.json(sources);
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

// Аналитика по источнику
app.get('/analytics/:source', async (req, res) => {
  try {
    const source = req.params.source;

    // Получение всех статей для источника
    const articles = await Article.findAll({
      where: { source },
    });

    if (!articles.length) {
      return res.status(404).json({ error: 'No articles found for this source' });
    }

    // Аналитика:
    const articlesByTime = {};
    const tagsDistribution = {};
    let updatedCount = 0;
    let notUpdatedCount = 0;

    articles.forEach((article) => {
      // Количество статей по дате публикации
      const publishDate = article.publish_date
        ? new Date(article.publish_date).toISOString().split('T')[0]
        : 'Unknown';
      articlesByTime[publishDate] = (articlesByTime[publishDate] || 0) + 1;

      // Распределение по тегам (категориям)
      if (article.category) {
        const categories = article.category.split(',').map((cat) => cat.trim());
        categories.forEach((category) => {
          tagsDistribution[category] = (tagsDistribution[category] || 0) + 1;
        });
      }

      // Обновлено или нет
      if (article.update_date) {
        updatedCount++;
      } else {
        notUpdatedCount++;
      }
    });

    // Сортируем и готовим данные для диаграмм
    const tagsArray = Object.entries(tagsDistribution).map(([tag, count]) => ({ tag, count }));
    tagsArray.sort((a, b) => b.count - a.count);

    // Данные для ответа
    const analytics = {
      articlesByTime: Object.entries(articlesByTime).map(([time, count]) => ({ time, count })),
      tagsDistribution: tagsArray,
      updatedCount,
      notUpdatedCount,
      articles: articles.map((article) => ({
        id: article.id,
        header: article.header,
      })),
    };

    res.json(analytics);
  } catch (error) {
    console.error('Ошибка при сборе аналитики:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Получение всех статей
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


app.delete('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await article.destroy();
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Ошибка при удалении статьи:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Проверка и установка даты обновления, если она пустая
    if (updatedData.update_date === '') {
      updatedData.update_date = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    }

    // Проверка корректности переданной пользователем даты
    const updateDate = new Date(updatedData.update_date);
    if (isNaN(updateDate.getTime())) {
      return res.status(400).json({ error: 'Invalid update date format' });
    }

    const publicationDate = new Date(updatedData.publish_date);
    if (updateDate < publicationDate || updateDate > new Date()) {
      return res.status(400).json({ error: 'Update date must be greater than the publication date' });
    }

    await article.update(updatedData);
    res.json({ message: 'Article updated successfully' });
    
  } catch (error) {
    console.error('Ошибка при обновлении статьи:', error);
    res.status(500).json({ error: 'Internal server error' });
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
