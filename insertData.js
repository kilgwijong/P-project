const mysql = require('mysql');
const xlsx = require('xlsx');
const fs = require('fs');

const xlsxFilePath = './csv/category.xlsx'; // 엑셀 파일 경로

// 파일 존재 여부 확인
if (!fs.existsSync(xlsxFilePath)) {
    console.error(`파일을 찾을 수 없습니다: ${xlsxFilePath}`);
    process.exit(1);
}

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbid233',
    password: 'dbpass233',
    database: 'db24305'
});

// 엑셀 파일 읽기
const workbook = xlsx.readFile(xlsxFilePath);
const sheetName = workbook.SheetNames[0];
const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

connection.connect((err) => {
    if (err) {
        console.error('MariaDB 연결 실패:', err);
        return;
    }
    console.log('MariaDB 연결 성공!');

    sheetData.forEach((row) => {
        const { category_id, keyword_id, keyword_name, count } = row;
        connection.query(
            'INSERT INTO category (category_id, keyword_id, keyword_name, count) VALUES (?, ?, ?, ?)',
            [category_id, keyword_id, keyword_name, count || 0],
            (err, results) => {
                if (err) {
                    console.error('데이터 삽입 실패:', err);
                } else {
                    console.log('데이터 삽입 성공:', results);
                }
            }
        );
    });

    connection.end(() => {
        console.log('MariaDB 연결 종료!');
    });
});