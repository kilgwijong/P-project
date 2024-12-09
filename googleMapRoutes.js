const express = require('express');
const mysql = require('mysql');

const router = express.Router();

// MariaDB 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbid233',
    password: 'dbpass233',
    database: 'db24305'
});

// Google API Key
const GOOGLE_API_KEY = 'AIzaSyDFUbg4JXE-OhP4I04eliJmBUR8fsawsY4';

// 여행지 등록 API
router.post('/add-destination', (req, res) => {
    const { dest_name, location, address, description, image, keyword_id } = req.body;

    const query = `
        INSERT INTO destination (dest_name, location, address, description, image, keyword_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
        query,
        [dest_name, location, address, description, image, keyword_id],
        (err, results) => {
            if (err) {
                console.error('여행지 등록 실패:', err);
                return res.status(500).json({ error: '여행지 등록에 실패했습니다.' });
            }
            res.status(201).json({ message: '여행지가 성공적으로 등록되었습니다.', dest_id: results.insertId });
        }
    );
});

// 식당 등록 API
router.post('/add-restaurant', (req, res) => {
    const { rest_name, location, address, description, image, contact } = req.body;

    const query = `
        INSERT INTO restaurant (rest_name, location, address, description, image, contact)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
        query,
        [rest_name, location, address, description, image, contact],
        (err, results) => {
            if (err) {
                console.error('식당 등록 실패:', err);
                return res.status(500).json({ error: '식당 등록에 실패했습니다.' });
            }
            res.status(201).json({ message: '식당이 성공적으로 등록되었습니다.', rest_id: results.insertId });
        }
    );
});

// Google Maps API Key 노출 API
router.get('/google-api-key', (req, res) => {
    res.json({ apiKey: GOOGLE_API_KEY });
});

module.exports = router;
