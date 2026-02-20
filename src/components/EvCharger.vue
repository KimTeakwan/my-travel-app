<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { EV_KEY } from '../ApiConfig';

const chargers = ref([]);
const loading = ref(false);
const region = ref('11');

// 🗺️ 전국 17개 지역 고정 좌표 (환경부 zcode 기준 찰떡 호환!)
const regions = [
  { code: '11', name: '서울', lat: 37.5665, lng: 126.9780 },
  { code: '26', name: '부산', lat: 35.1795, lng: 129.0756 },
  { code: '27', name: '대구', lat: 35.8714, lng: 128.6014 },
  { code: '28', name: '인천', lat: 37.4562, lng: 126.7052 },
  { code: '29', name: '광주', lat: 35.1595, lng: 126.8526 },
  { code: '30', name: '대전', lat: 36.3504, lng: 127.3845 },
  { code: '31', name: '울산', lat: 35.5383, lng: 129.3113 },
  { code: '36', name: '세종', lat: 36.4800, lng: 127.2890 },
  { code: '41', name: '경기', lat: 37.2749, lng: 127.0086 },
  { code: '43', name: '충북', lat: 36.6356, lng: 127.4913 },
  { code: '44', name: '충남', lat: 36.6588, lng: 126.6728 },
  { code: '46', name: '전남', lat: 34.8159, lng: 126.4629 },
  { code: '47', name: '경북', lat: 36.5759, lng: 128.5056 },
  { code: '48', name: '경남', lat: 35.2382, lng: 128.6924 },
  { code: '50', name: '제주', lat: 33.4890, lng: 126.4983 },
  { code: '51', name: '강원', lat: 37.8228, lng: 128.1555 }, 
  { code: '52', name: '전북', lat: 35.8242, lng: 127.1479 }  
];

let map = null;
let markers = [];
let infoWindows = [];
let myLocationMarker = null; // 🚨 내 위치 빨간 마커 저장할 변수 하나 추가했음!

const initMap = () => {
  if (!window.naver || !window.naver.maps) return;
  map = new window.naver.maps.Map('naver-map', {
    center: new window.naver.maps.LatLng(37.5665, 126.9780),
    zoom: 11
  });
};

const fetchChargers = async () => {
  loading.value = true;
  try {
    const url = `/api/B552584/EvCharger/getChargerInfo?serviceKey=${EV_KEY}&pageNo=1&numOfRows=9999&zcode=${region.value}&dataType=JSON`; 
    
    const response = await axios.get(url);
    
    let rawData = response.data?.items?.item || [];
    if (rawData && !Array.isArray(rawData)) rawData = [rawData]; 
    
    if (rawData.length === 0) {
      alert("형! 이 지역은 데이터가 없거나, 공공데이터 포털 승인 대기 중이야! ⏳");
      chargers.value = [];
    } else {
      const grouped = {};
      rawData.forEach(charger => {
        const key = charger.statId; 
        if (!grouped[key]) {
          grouped[key] = {
            stnPlace: charger.statNm,
            stnAddr: charger.addr,
            lat: parseFloat(charger.lat),
            lng: parseFloat(charger.lng),
            rapidCnt: 0,
            slowCnt: 0
          };
        }
        if (charger.chgerType === '02' || charger.chgerType === '07' || charger.chgerType === '08') {
          grouped[key].slowCnt++;
        } else {
          grouped[key].rapidCnt++;
        }
      });
      chargers.value = Object.values(grouped);
    }

    const selectedRegion = regions.find(r => r.code === region.value);
    if (map && selectedRegion) {
      map.setCenter(new window.naver.maps.LatLng(selectedRegion.lat, selectedRegion.lng));
      map.setZoom(11); // 전체 조회할 땐 넓게 보기!
    }

    drawMarkers();
  } catch (e) { 
    console.error("데이터 로드 실패:", e); 
    alert("환경부 서버 통신 실패! API 키 승인이 덜 됐거나 URL 설정 문제일 수 있음~");
  } finally { 
    loading.value = false; 
  }
};

const drawMarkers = () => {
  if (!window.naver.maps) return;

  markers.forEach(m => m.setMap(null));
  infoWindows.forEach(iw => iw.close());
  markers = [];
  infoWindows = [];

  chargers.value.forEach((item) => {
    if (!item.lat || !item.lng) return; 

    const coords = new window.naver.maps.LatLng(item.lat, item.lng);

    const marker = new window.naver.maps.Marker({
      position: coords,
      map: map,
      icon: {
          content: `<div style="background:#42b883; color:white; padding:5px; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 2px 5px rgba(0,0,0,0.3);">⚡</div>`,
          anchor: new window.naver.maps.Point(12, 12)
      }
    });

    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding:15px; width:220px; background: white; border-radius:12px; border: 1px solid #ddd;">
          <h4 style="margin:0 0 5px 0; font-size:15px; color:#333;">${item.stnPlace}</h4>
          <p style="margin:0; font-size:12px; color:#666;">📍 ${item.stnAddr}</p>
          <div style="display:flex; gap:8px; margin-top:10px;">
              <div style="flex:1; background:#fff3e0; padding:8px; border-radius:8px; text-align:center;">
                  <span style="font-size:10px; color:#ef6c00;">급속</span>
                  <strong style="display:block; font-size:14px; color:#ef6c00;">${item.rapidCnt}</strong>
              </div>
              <div style="flex:1; background:#e3f2fd; padding:8px; border-radius:8px; text-align:center;">
                  <span style="font-size:10px; color:#1976d2;">완속</span>
                  <strong style="display:block; font-size:14px; color:#1976d2;">${item.slowCnt}</strong>
              </div>
          </div>
        </div>
      `,
      backgroundColor: "white",
      borderWidth: 0,
      disableAnchor: false
    });

    window.naver.maps.Event.addListener(marker, 'click', () => {
      if (infoWindow.getMap()) {
        infoWindow.close();
      } else {
        infoWindows.forEach(iw => iw.close()); 
        infoWindow.open(map, marker);
      }
    });

    markers.push(marker);
    infoWindows.push(infoWindow);
  });
};

// 🚀 GPS 연동: 내 위치로 슝 날아가는 마법의 함수!
const moveToMyLocation = () => {
  if (!navigator.geolocation) {
    alert("형 브라우저가 GPS를 지원 안 한대! ㅠㅠ");
    return;
  }

  loading.value = true;
  
  // 맥북 GPS한테 "내 위치 좀 알려줘!" 하고 요청함
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const myCoords = new window.naver.maps.LatLng(lat, lng);

      // 1. 지도를 내 위치로 확 땡겨옴! (줌 14로 가까이서 보게 세팅)
      if (map) {
        map.setCenter(myCoords);
        map.setZoom(14);
      }

      // 2. 기존 내 위치 마커가 있으면 깔끔하게 지워줌
      if (myLocationMarker) {
        myLocationMarker.setMap(null);
      }

      // 3. 내 위치에 눈에 확 띄는 빨간색 자동차 마커 뽝! 🚗
      myLocationMarker = new window.naver.maps.Marker({
        position: myCoords,
        map: map,
        icon: {
          content: `<div style="background:#ff3b30; color:white; padding:6px 12px; border-radius:20px; font-weight:bold; font-size:13px; box-shadow:0 3px 6px rgba(0,0,0,0.3); border: 2px solid white;">🚗 내 위치</div>`,
          anchor: new window.naver.maps.Point(40, 15)
        }
      });

      loading.value = false;
    },
    (error) => {
      console.error("GPS 에러:", error);
      alert("형! 맥북에서 위치 권한 허용해 줘야 쓸 수 있음~ 브라우저 팝업 뜨면 '허용' 뽝 눌러줘! 🥺");
      loading.value = false;
    }
  );
};

onMounted(() => { initMap(); fetchChargers(); });
</script>

<template>
  <div class="container">
    <div class="header">
      <h2>⚡ 전국 전기차 충전소 (GPS 연동 완료!)</h2>
      <div class="controls">
        <select v-model="region" class="select-box">
          <option v-for="r in regions" :key="r.code" :value="r.code">{{ r.name }}</option>
        </select>
        <button @click="fetchChargers" :disabled="loading" class="btn">조회 🔍</button>
        <button @click="moveToMyLocation" class="btn gps-btn">📍 내 위치</button>
      </div>
    </div>
    <div id="naver-map"></div>
    <div v-if="loading" class="status-bar">🚀 데이터랑 위성 통신 중...</div>
    
    <div class="card-grid">
      <div v-for="(item, index) in chargers" :key="index" class="charger-card">
        <h4 class="stn-name">{{ item.stnPlace }}</h4>
        <p class="stn-addr">📍 {{ item.stnAddr }}</p>
        <div class="info-row">
            <span class="badge rapid">급속 {{ item.rapidCnt }}</span>
            <span class="badge slow">완속 {{ item.slowCnt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 20px; max-width: 1200px; margin: 0 auto; font-family: 'Pretendard', sans-serif; }
.header { display: flex; justify-content: space-between; margin-bottom: 20px; }
#naver-map { width: 100%; height: 500px; border-radius: 20px; border: 1px solid #ddd; margin-bottom: 30px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
.charger-card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #eee; text-align: left; }
.stn-name { margin: 0; font-size: 16px; color: #333; }
.stn-addr { font-size: 13px; color: #888; margin: 8px 0; }
.info-row { display: flex; gap: 8px; }
.badge { font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 5px; }
.rapid { background: #fff3e0; color: #ef6c00; }
.slow { background: #e3f2fd; color: #1976d2; }
.btn { padding: 10px 20px; background: #42b883; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
.select-box { padding: 10px; border-radius: 10px; border: 1px solid #ddd; margin-right: 10px; }
.status-bar { margin-top: 10px; color: #42b883; font-weight: bold; }

/* 🚨 내 위치 버튼 전용 스타일! 눈에 띄게 파란색 줬음! */
.gps-btn {
  background: #007aff;
  margin-left: 10px;
}
.gps-btn:hover {
  background: #0056b3;
}
</style>