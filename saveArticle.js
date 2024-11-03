const Article = require('./models/article');

async function saveArticle(articleData) {
  try {
    // Преобразуем массивы в строки, если нужно
    if (Array.isArray(articleData.category)) {
        articleData.category = articleData.category.join(', ');
      }
    if (Array.isArray(articleData.author)) {
        articleData.author = articleData.author.join(', ');
      }
  
      // Проверка формата даты
    if (isNaN(new Date(articleData.publish_date)) || articleData.publish_date === '') {
        articleData.publish_date = null;
      }
    if (isNaN(new Date(articleData.update_date)) || articleData.update_date === '') {
        articleData.update_date = null;
      }
    const existingArticle = await Article.findOne({ where: { link: articleData.link } });

    if (existingArticle) {
      // Обновляем существующую запись
      await existingArticle.update(articleData);
      console.log(`Запись обновлена: ${articleData.link}`);
    } else {
      // Создаем новую запись
      await Article.create(articleData);
      console.log(`Запись добавлена: ${articleData.link}`);
    }
  } catch (error) {
    console.error(`Ошибка сохранения статьи:  ${articleData.link}`, error);
  }
}

module.exports = saveArticle;
