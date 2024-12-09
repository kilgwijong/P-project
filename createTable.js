const mysql = require('mysql');

// MariaDB 연결 설정
const connection = mysql.createConnection({
    host: 'localhost', // 학교 서버에서 실행되므로 localhost 사용
    user: 'dbid233',    // 제공받은 사용자 이름
    password: 'dbpass233', // 제공받은 비밀번호
    database: 'db24305',        // 제공받은 데이터베이스 이름
    multipleStatements: true // 다중 SQL 문 실행 활성화
});

// 연결 확인
connection.connect((err) => {
    if (err) {
        console.error('MariaDB 연결 실패:', err);
        return;
    }
    console.log('MariaDB 연결 성공!');
});

// 테이블 생성 SQL 명령어
const createTables = `
-- 1. category 테이블 (참조 대상 테이블)
CREATE TABLE IF NOT EXISTS category (
    category_id VARCHAR(20),
    keyword_id VARCHAR(20),
    keyword_name VARCHAR(100),
    count INT DEFAULT 0,
    PRIMARY KEY (category_id, keyword_id)
);

-- 2. user 테이블 (category를 참조)
CREATE TABLE IF NOT EXISTS user (
    user_id VARCHAR(255) PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    profile_image VARCHAR(255),
    keyword_id VARCHAR(20),
    FOREIGN KEY (keyword_id) REFERENCES category(keyword_id)
);

-- 3. destination 테이블 (category를 참조)
CREATE TABLE IF NOT EXISTS destination (
    dest_id VARCHAR(20) PRIMARY KEY,
    dest_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    address VARCHAR(200),
    description TEXT,
    keyword_id VARCHAR(20),
    image VARCHAR(255),
    FOREIGN KEY (keyword_id) REFERENCES category(keyword_id)
);

-- 4. restaurant 테이블 (외래 키 없음)
CREATE TABLE IF NOT EXISTS restaurant (
    rest_id VARCHAR(20) PRIMARY KEY,
    rest_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    address VARCHAR(200),
    description TEXT,
    image VARCHAR(255),
    contact VARCHAR(50)
);

-- 5. wishList 테이블 (user를 참조)
CREATE TABLE IF NOT EXISTS wishList (
    user_id VARCHAR(255),
    dest_list JSON,
    rest_list JSON,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);

-- 6. recommendation 테이블 (user와 destination을 참조)
CREATE TABLE IF NOT EXISTS recommendation (
    recommend_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    dest_id VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (dest_id) REFERENCES destination(dest_id)
);

-- 7. destinationReview 테이블 (destination과 user를 참조)
CREATE TABLE IF NOT EXISTS destinationReview (
    dest_rev_id INT AUTO_INCREMENT PRIMARY KEY,
    dest_id VARCHAR(20),
    user_id VARCHAR(255),
    date DATE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dest_id) REFERENCES destination(dest_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);

-- 8. restaurantReview 테이블 (restaurant와 user를 참조)
CREATE TABLE IF NOT EXISTS restaurantReview (
    rest_rev_id INT AUTO_INCREMENT PRIMARY KEY,
    rest_id VARCHAR(20),
    user_id VARCHAR(255),
    date DATE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rest_id) REFERENCES restaurant(rest_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);

-- 9. board 테이블 (user를 참조)
CREATE TABLE IF NOT EXISTS board (
    type_id VARCHAR(20),
    board_id VARCHAR(20),
    user_id VARCHAR(255),
    title VARCHAR(200),
    date DATE,
    content TEXT,
    PRIMARY KEY (type_id, board_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
`;

// 테이블 생성 실행
connection.query(createTables, (err, results) => {
    if (err) {
        console.error('테이블 생성 실패:', err);
        connection.end();
        return;
    }
    console.log('모든 테이블이 성공적으로 생성되었습니다!');
    connection.end();
});