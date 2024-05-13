const mysql = require("mysql2/promise");

// Create a connection pool
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "password",
    database: "hotwax",
});

module.exports = pool;