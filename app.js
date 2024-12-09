const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const googleMapRoutes = require('./googleMapRoutes');
const session = require('express-session'); // express-session 추가
const mysql = require('mysql');

const app = express();
app.use(bodyParser.json()); // JSON 요청 처리

// MariaDB 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbid233',
    password: 'dbpass233',
    database: 'db24305'
});

// express-session 설정
app.use(
    session({
        secret: 'your_secret_key', // 비밀 키 (아무 문자열이나 설정 가능)
        resave: false, // 세션이 변경되지 않아도 저장
        saveUninitialized: false // 초기화되지 않은 세션 저장 여부
    })
);

// Passport 초기화 및 세션 연결
app.use(passport.initialize());
app.use(passport.session());

// Passport 카카오톡 전략 설정
passport.use(
    new KakaoStrategy(
        {
            clientID: '7bb74d4c0ed160d7cdb605cf57bf971a', // 카카오 REST API 키
            callbackURL: 'http://localhost:3000/auth/kakao/callback' // 리디렉션 URI
        },
        (accessToken, refreshToken, profile, done) => {
            const user_id = `kakao_${profile.id}`; // 카카오 고유 ID
            const nickname = profile.displayName; // 닉네임
            const profile_image = profile._json.properties.profile_image || null; // 프로필 이미지 URL

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

// Passport 네이버 전략 설정
passport.use(
    new NaverStrategy(
        {
            clientID:'WKq_7ZKht2hkna9NfcSR',
            clientSecret: 'cLuTKp8Xyn',
            callbackURL: 'http://localhost:3000/auth/naver/callback'
        },
        (accessToken, refreshToken, profile, done) => {
            const user_id = 'naver_${profile.id}';
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
                    return done(null, { user_id, nickname, profile_image});
                }
            );
        }
    )
);

// 세션 사용자 정보 직렬화 및 역직렬화
passport.serializeUser((user, done) => {
    done(null, user.user_id); // 세션에 user_id 저장
});

passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM user WHERE user_id = ?';
    connection.query(query, [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]); // 사용자 정보 복원
    });
});

app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Server!</h1><p>Use /auth/kakao or /auth/naver for authentication.</p>');
});

// 카카오 로그인 요청
app.get('/auth/kakao', passport.authenticate('kakao'));

// 카카오 로그인 콜백
app.get(
    '/auth/kakao/callback',
    passport.authenticate('kakao', {
        failureRedirect: '/' // 로그인 실패 시 리디렉션 경로
    }),
    (req, res) => {
        res.send('카카오 로그인 성공! 이제 카테고리를 선택하세요.');
    }
);

//네이버 로그인 요청
app.get('/auth/naver', passport.authenticate('naver'));

//네이버 로그인 콜백
app.get(
    '/auth/naver/callback',
    passport.authenticate('naver', {
        failureRedirect: '/' // 로그인 실패 시 리디렉션 경로
    }),
    (req, res) => {
        res.send('네이버 로그인 성공!');
    }
);

app.use('/google-map', googleMapRoutes); //구글 맵 관련 라우터 추가

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});