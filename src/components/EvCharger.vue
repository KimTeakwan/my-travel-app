<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { EV_KEY } from '../ApiConfig'; 

const chargers = ref([]);
const loading = ref(false);
const region = ref('11'); // 기본 서울

// 🗺️ 가이드 문서 zcode 기준 완벽 매핑! (강원 51, 전북 52 수정 완료) 
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
  { code: '51', name: '강원', lat: 37.8228, lng: 128.1555 }, // 🚨 51로 수정 
  { code: '52', name: '전북', lat: 35.8242, lng: 127.1479 }  // 🚨 52로 수정 
];

let map = null;
let markers = [];
let infoWindows = [];

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
    // 🚨 403 에러 완전 차단: Axios 파라미터 대신 URL에 직접 연결해서 인코딩 충돌 방지!
    // numOfRows 최대치인 9999로 설정 
    const url = `/api/B552584/EvCharger/getChargerInfo?serviceKey=${EV_KEY}&pageNo=1&numOfRows=9999&zcode=${region.value}&dataType=JSON`; 
    
    const response = await axios.get(url);
    
    // 환경부 JSON 구조 파싱 [cite: 39]
    let rawData = response.data?.items?.item || [];
    // 데이터가 1개일 경우 객체로 반환되는 것 방지
    if (rawData && !Array.isArray(rawData)) rawData = [rawData]; 
    
    if (rawData.length === 0) {
      alert("형! 이 지역은 데이터가 없거나, 공공데이터 포털 승인 대기 중이야! ⏳");
      chargers.value = [];
    } else {
      // 🎯 충전소 ID(statId) 기준으로 묶기 
      const grouped = {};
      rawData.forEach(charger => {
        const key = charger.statId; 
        if (!grouped[key]) {
          grouped[key] = {
            stnPlace: charger.statNm,
            stnAddr: charger.addr,
            lat: parseFloat(charger.lat), // 
            lng: parseFloat(charger.lng), // 
            rapidCnt: 0,
            slowCnt: 0
          };
        }
        // 02(AC완속), 07(AC3상) 등은 완속으로, 나머지는 급속으로 분류 
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
      map.setZoom(11);
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
    // 위경도 없으면 스킵
    if (!item.lat || !item.lng) return; 

    // 📍 네이버 Geocode 없이 바로 마커 꽂아버리기! 속도 미침!
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

onMounted(() => { initMap(); fetchChargers(); });
</script>

<template>
  <div class="container">
    <div class="header">
      <h2>⚡ 전국 전기차 충전소 (가이드 완벽 반영!)</h2>
      <div class="controls">
        <select v-model="region" class="select-box">
          <option v-for="r in regions" :key="r.code" :value="r.code">{{ r.name }}</option>
        </select>
        <button @click="fetchChargers" :disabled="loading" class="btn">조회 🔍</button>
      </div>
    </div>
    <div id="naver-map"></div>
    <div v-if="loading" class="status-bar">🚀 환경부 데이터 광속으로 불러오는 중...</div>
    
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
/* 디자인은 그대로 유지! */
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
</style>