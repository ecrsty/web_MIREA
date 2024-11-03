const { DataTypes } = require('sequelize');
const sequelize = require('../database');

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
  }, {
    timestamps: false,
  });
  
  module.exports = Article;