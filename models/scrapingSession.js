const { DataTypes } = require('sequelize');
const sequelize = require('../database'); 

const ScrapingSession = sequelize.define('ScrapingSession', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'in_progress'
    },
    total_articles: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'ScrapingSessions',
    timestamps: false
});

module.exports = ScrapingSession;
