require("../bootstrap");

module.exports = {
  development: {
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin"
    },
    options: { 
      requestTimeout: 600000, 
      encrypt: false 
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 100
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    dialect: process.env.DB_DIALECT || "postgres",
    timezone: 'America/Sao_Paulo',
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: process.env.NODE_ENV === "development" ? console.log : false
  },
  test: {
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin"
    },
    options: { 
      requestTimeout: 600000, 
      encrypt: false 
    },
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    },
    dialect: "postgres",
    timezone: 'America/Sao_Paulo',
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    database: process.env.DB_NAME + "_test",
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: false
  },
  production: {
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin"
    },
    options: { 
      requestTimeout: 600000, 
      encrypt: process.env.NODE_ENV === "production" 
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 100
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 15,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    dialect: process.env.DB_DIALECT || "postgres",
    timezone: 'America/Sao_Paulo',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || "5432",
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: false
  }
};