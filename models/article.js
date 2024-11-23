const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const ScrapingSession = require('./scrapingSession');

const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    link: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    header: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    subheader: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    publish_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    update_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reading_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scraping_session_id: {
      type: DataTypes.INTEGER,
      references: {
          model: ScrapingSession,
          key: 'id'
      },
      allowNull: true
    },
  }, {
    tableName: 'Articles',
    timestamps: false,
  });
  
  Article.belongsTo(ScrapingSession, { foreignKey: 'scraping_session_id' }); // устанавливаем связь

  module.exports = Article;