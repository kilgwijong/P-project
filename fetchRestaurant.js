const axios = require('axios');
const mysql = require('mysql');

// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbid233',
    password: 'dbpass233',
    database: 'db24305'
});

// Google Places API 키
const GOOGLE_API_KEY = 'AIzaSyDFUbg4JXE-OhP4I04eliJmBUR8fsawsY4';

// 특정 위치의 밥집 데이터 가져오기
async function fetchRestaurants(lat, lng, radius = 1000) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`;
    try {
        const response = await axios.get(url);
        return response.data.results; // 장소 데이터
    } catch (error) {
        console.error('Google Places API 요청 실패:', error);
        return [];
    }
}

// 데이터베이스에 데이터 저장
function saveRestaurantToDB(restaurant) {
    const { name, vicinity, geometry, place_id } = restaurant;
    const location = `${geometry.location.lat}, ${geometry.location.lng}`;

    const query = `
        INSERT INTO restaurant (name, address, location, place_id)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = ?, address = ?
    `;

    connection.query(
        query,
        [name, vicinity, location, place_id, name, vicinity],
        (err, results) => {
            if (err) {
                console.error('데이터 삽입 실패:', err);
            } else {
                console.log('데이터 삽입 성공:', results);
            }
        }
    );
}

// 메인 함수
async function main() {
    const lat = 37.5665; // 서울 중심의 위도
    const lng = 126.9780; // 서울 중심의 경도
    const radius = 1000; // 1km 반경

    connection.connect((err) => {
        if (err) {
            console.error('MariaDB 연결 실패:', err);
            return;
        }
        console.log('MariaDB 연결 성공!');
    });

    const restaurants = await fetchRestaurants(lat, lng, radius);
    console.log(`가져온 밥집 수: ${restaurants.length}`);

    restaurants.forEach((restaurant) => saveRestaurantToDB(restaurant));

    connection.end(() => {
        console.log('MariaDB 연결 종료!');
    });
}

main();
