const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mysql = require('mysql');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json()); // JSON 요청 처리
app.use(passport.initialize());

app.use(cors()); // React와의 CORS 문제 해결
app.use(express.json()); // JSON 요청 처리


const corsOptions = {
    origin: 'http://localhost:3001', // React 앱이 실행 중인 포트
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용되는 HTTP 메서드
    allowedHeaders: ['Content-Type', 'Authorization'], // 허용되는 헤더
};
app.use(cors(corsOptions)); // CORS 옵션 적용

// 테스트 API
app.get('/api/test', (req, res) => {
    res.json({ message: '백엔드와 프론트엔드가 연결되었습니다!' });
});

// React 정적 파일 제공
app.use(express.static(path.join(__dirname, 'build')));

// React 라우트 핸들링
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Google API Key
const GOOGLE_API_KEY = 'AIzaSyDFUbg4JXE-OhP4I04eliJmBUR8fsawsY4';

// Flask 서버의 ngrok URL
const FLASK_SERVER_URL = 'https://9dfe-34-90-163-224.ngrok-free.app/recommend-travel';

// MariaDB 연결 설정
const connection = mysql.createConnection({
    host: '127.0.0.1', // MariaDB 서버 IP
    user: 'root',       // 사용자 이름
    password: 'root',   // 비밀번호8
    database: 'db24305', // 데이터베이스 이름
    port: 3306          // MariaDB 포트
});

// Node.js API 엔드포인트
app.post('/recommend-travel', async (req, res) => {
    try {
        // 요청 데이터 전달
        const requestData = req.body;

        // Flask 서버로 데이터 전송
        const response = await axios.post(FLASK_SERVER_URL, requestData);

        // Flask로부터 받은 데이터 반환
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Flask API 호출 오류:', error.message);
        res.status(500).json({ error: 'Flask API 호출 실패' });
    }
});

// 서버 시작 시 DB 연결
connection.connect((err) => {
    if (err) {
        console.error('MariaDB 연결 실패:', err);
        process.exit(1);
    }
    console.log('MariaDB 연결 성공!');
});

// 루트 경로
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Server!</h1><p>Google, Kakao, Naver 로그인을 지원합니다.</p>');
});

// Google OAuth 설정
passport.use(
    new GoogleStrategy(
        {
            clientID: '1030374015062-bl485qg5g9k09051hnup4u3hl0160m3c.apps.googleusercontent.com',
            clientSecret: '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',
            callbackURL: 'http://localhost:3000/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            const user_id = `google_${profile.id}`;
            const nickname = profile.displayName;
            const profile_image = profile.photos[0]?.value || null;

            try {
                const query = `
                    INSERT INTO user (user_id, nickname, profile_image)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE nickname = ?, profile_image = ?`;

                connection.query(
                    query,
                    [user_id, nickname, profile_image, nickname, profile_image],
                    (err, results) => {
                        if (err) {
                            console.error('DB 저장 실패:', err);
                            return done(err);
                        }
                        console.log('DB 저장 성공:', results);
                        return done(null, { user_id, nickname, profile_image });
                    }
                );
            } catch (error) {
                console.error('Google 인증 처리 중 오류:', error);
                return done(error);
            }
        }
    )
);

// Google 로그인 요청 라우트
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google 로그인 콜백 라우트
app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.send('Google 로그인 성공!');
    }
);

// Naver OAuth 설정
passport.use(
    new NaverStrategy(
        {
            clientID: 'VOMIx1FQmeskMexoT7v4',
            clientSecret: 'ikEGDQIzBe',
            callbackURL: 'http://localhost:3000/auth/naver/callback',
        },
        (accessToken, refreshToken, profile, done) => {
            const user_id = `naver_${profile.id}`;
            const nickname = profile.displayName;
            const profile_image = profile._json.profile_image || null;

            const query = `
                INSERT INTO user (user_id, nickname, profile_image)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE nickname = ?, profile_image = ?`;

            connection.query(
                query,
                [user_id, nickname, profile_image, nickname, profile_image],
                (err, results) => {
                    if (err) {
                        console.error('DB 저장 실패:', err);
                        return done(err);
                    }
                    console.log('DB 저장 성공:', results);
                    return done(null, { user_id, nickname, profile_image });
                }
            );
        }
    )
);

// Naver 로그인 요청 라우트
app.get('/auth/naver', passport.authenticate('naver'));

// Naver 로그인 콜백 라우트
app.get(
    '/auth/naver/callback',
    passport.authenticate('naver', { failureRedirect: '/' }),
    (req, res) => {
        res.send('Naver 로그인 성공!');
    }
);

// Kakao 로그인 요청 라우트
app.get('/auth/kakao', (req, res) => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=7bb74d4c0ed160d7cdb605cf57bf971a&redirect_uri=http://localhost:3000/auth/kakao/callback&response_type=code`;
    res.redirect(kakaoAuthUrl);
});

// Kakao 로그인 콜백 라우트
app.get('/auth/kakao/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code가 없습니다.' });
    }

    try {
        const tokenResponse = await axios.post(
            'https://kauth.kakao.com/oauth/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    client_id: '7bb74d4c0ed160d7cdb605cf57bf971a',
                    redirect_uri: 'http://localhost:3000/auth/kakao/callback',
                    code,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const { id, properties } = userResponse.data;
        const user_id = `kakao_${id}`;
        const nickname = properties?.nickname || '알 수 없음';
        const profile_image = properties?.profile_image || null;

        const query = `
            INSERT INTO user (user_id, nickname, profile_image)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE nickname = ?, profile_image = ?`;

        connection.query(
            query,
            [user_id, nickname, profile_image, nickname, profile_image],
            (err, results) => {
                if (err) {
                    console.error('DB 저장 실패:', err);
                    return res.status(500).json({ error: 'DB 저장 실패' });
                }
                console.log('DB 저장 성공:', results);
                res.status(201).json({ message: '로그인 성공', user_id, nickname, profile_image });
            }
        );
    } catch (error) {
        console.error('Kakao 인증 요청 실패:', error);
        res.status(500).json({ error: 'Kakao 인증 요청 실패' });
    }
});

// 여행지 등록 API
app.post('/add-destination', async (req, res) => {
    const { query, lat, lng } = req.body; // 사용자 입력: 장소 이름, 위도(lat), 경도(lng)
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${query}&key=${GOOGLE_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.results.length === 0) {
            return res.status(404).json({ error: '검색 결과가 없습니다.' });
        }

        const place = response.data.results[0]; // 첫 번째 검색 결과 가져오기
        const { name, vicinity, geometry } = place; // 장소 정보 추출
        const location = `${geometry.location.lat}, ${geometry.location.lng}`;

        const queryStr = `
            INSERT INTO destination (dest_name, location, address, description, image)
            VALUES (?, ?, ?, ?, ?)
        `;
        connection.query(queryStr, [name, location, vicinity, '자동 등록', null], (err, results) => {
            if (err) {
                console.error('여행지 등록 실패:', err);
                return res.status(500).json({ error: '데이터베이스 오류' });
            }
            res.status(201).json({ message: '여행지 등록 성공', id: results.insertId });
        });
    } catch (error) {
        console.error('Google Places API 요청 실패:', error);
        res.status(500).json({ error: 'Google Places API 오류' });
    }
});

app.get('/add-destination', (req, res) => {
    res.status(405).json({
        error: 'This endpoint only supports POST requests. Please send a POST request.',
    });
});


// 맛집 등록 API
app.post('/add-restaurant', async (req, res) => {
    const { query, lat, lng } = req.body; // 사용자 입력: 장소 이름, 위도(lat), 경도(lng)
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&keyword=${query}&key=${GOOGLE_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.results.length === 0) {
            return res.status(404).json({ error: '검색 결과가 없습니다.' });
        }

        const place = response.data.results[0]; // 첫 번째 검색 결과 가져오기
        const { name, vicinity, geometry } = place; // 장소 정보 추출
        const location = `${geometry.location.lat}, ${geometry.location.lng}`;

        const queryStr = `
            INSERT INTO restaurant (rest_name, location, address, description, image, contact)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        connection.query(queryStr, [name, location, vicinity, '자동 등록', null, ''], (err, results) => {
            if (err) {
                console.error('맛집 등록 실패:', err);
                return res.status(500).json({ error: '데이터베이스 오류' });
            }
            res.status(201).json({ message: '맛집 등록 성공', id: results.insertId });
        });
    } catch (error) {
        console.error('Google Places API 요청 실패:', error);
        res.status(500).json({ error: 'Google Places API 오류' });
    }
});


const data = {
  inputs: [[5, 5]] // 입력 데이터
};

axios.post('http://127.0.0.1:5000/predict', data)
  .then(response => {
    console.log('예측 결과:', response.data.predictions);
  })
  .catch(error => {
    console.error('오류 발생:', error.message);
  });



// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

