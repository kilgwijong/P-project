const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbid233',
    password: 'dbpass233',
    database: 'db24305'
});

connection.connect((err) => {
    if (err) {
        console.error('MariaDB 연결 실패:', err.message);
        return;
    }
    console.log('MariaDB 연결 성공');
});

// 테이블 생성 SQL 정의
const createTables = [
    `CREATE TABLE IF NOT EXISTS restaurant (
        rest_id INT AUTO_INCREMENT PRIMARY KEY,
        rest_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        description TEXT,
        image VARCHAR(255),
        contact VARCHAR(50)
    );`,
    
    `CREATE TABLE IF NOT EXISTS destinationReview (
        dest_rev_id INT AUTO_INCREMENT PRIMARY KEY,
        dest_id INT NOT NULL,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dest_id) REFERENCES destination(dest_id),
        FOREIGN KEY (user_id) REFERENCES user(user_id)
    );`,
    
    `CREATE TABLE IF NOT EXISTS restaurantReview (
        rest_rev_id INT AUTO_INCREMENT PRIMARY KEY,
        rest_id INT NOT NULL,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rest_id) REFERENCES restaurant(rest_id),
        FOREIGN KEY (user_id) REFERENCES user(user_id)
    );`,
    
    `CREATE TABLE IF NOT EXISTS category (
        category_id INT NOT NULL,
        keyword_id INT NOT NULL,
        keyword_name VARCHAR(255) NOT NULL,
        count INT DEFAULT 0,
        PRIMARY KEY (category_id, keyword_id)
    );`,
    
    `CREATE TABLE IF NOT EXISTS board (
        type_id INT NOT NULL,
        board_id INT AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        content TEXT,
        PRIMARY KEY (type_id, board_id),
        FOREIGN KEY (user_id) REFERENCES user(user_id)
    );`
];

// 테이블 생성 실행
createTables.forEach((query) => {
    connection.query(query, (err, results) => {
        if (err) {
            console.error('테이블 생성 실패:', err.message);
        } else {
            console.log('테이블 생성 성공:', results);
        }
    });
});

// 연결 종료
connection.end((err) => {
    if (err) {
        console.error('MariaDB 연결 종료 실패:', err.message);
        return;
    }
    console.log('MariaDB 연결 종료');
});
