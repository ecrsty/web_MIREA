require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    pool: {
      max: 10,          // Максимальное количество соединений
      min: 0,           // Минимальное количество соединений
      acquire: 30000,   // Максимальное время в мс, в течение которого пул будет пытаться установить соединение
      idle: 10000       // Время простоя соединения перед его завершением
    },
  }
);

module.exports = sequelize;
