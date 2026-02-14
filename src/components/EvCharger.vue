<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { EV_KEY } from '../ApiConfig';

// 🗺️ 대한민국 전 지역 데이터베이스 (하나도 빠짐없이 싹 다 넣었음!)
const NATIONWIDE_REGIONS = {
  "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  "대구광역시": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구", "군위군"],
  "인천광역시": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
  "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
  "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
  "울산광역시": ["남구", "동구", "북구", "울주군", "중구"],
  "세종특별자치시": ["세종특별자치시"],
  "경기도": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
  "강원특별자치도": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
  "충청북도": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
  "충청남도": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
  "전라북도": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
  "전라남도": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  "경상북도": ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
  "경상남도": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
  "제주특별자치도": ["제주시", "서귀포시"]
};

const selectedSido = ref('서울특별시');
const selectedSigungu = ref('양천구');
const dongInput = ref(''); 

const chargers = ref([]);
const loading = ref(false);

const sigunguList = computed(() => NATIONWIDE_REGIONS[selectedSido.value] || []);

const fetchChargers = async () => {
  const combinedAddr = `${selectedSido.value} ${selectedSigungu.value} ${dongInput.value}`.trim();
  loading.value = true;
  chargers.value = [];
  try {
    const url = `/kepco/openapi/v1/EVchargeManage.do`; //
    const response = await axios.get(url, {
      params: { apiKey: EV_KEY, addr: combinedAddr, returnType: 'json' } //
    });
    const items = response.data?.data; //
    if (items) chargers.value = items;
  } catch (e) { console.error(e); } finally { loading.value = false; }
};

watch(selectedSido, (newVal) => { selectedSigungu.value = NATIONWIDE_REGIONS[newVal][0]; fetchChargers(); });
watch(selectedSigungu, () => fetchChargers());

const getStatus = (code) => {
  switch(code) {
    case '1': return { text: '충전 가능', color: 'green' };
    case '2': return { text: '충전 중', color: 'blue' };
    case '3': return { text: '고장/점검', color: 'red' };
    default: return { text: '상태 불명', color: 'gray' };
  }
};

fetchChargers();
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>⚡ 대한민국 충전 지성소</h1>
      <p>전국 어디서나, 실시간 전기차 충전 현황</p>
    </header>

    <div class="search-section">
      <div class="combo-search-bar">
        <select v-model="selectedSido" class="select-box">
          <option v-for="sido in Object.keys(NATIONWIDE_REGIONS)" :key="sido" :value="sido">{{ sido }}</option>
        </select>
        <select v-model="selectedSigungu" class="select-box">
          <option v-for="gu in sigunguList" :key="gu" :value="gu">{{ gu }}</option>
        </select>
        <input v-model="dongInput" placeholder="동/읍/면 입력 (예: 신정동)" @keyup.enter="fetchChargers" class="input-box" />
        <button @click="fetchChargers" class="search-btn">🔍 검색</button>
      </div>
    </div>

    <div v-if="loading" class="msg-loading">
      <div class="spinner"></div>
      <p>전국 데이터를 싹싹 긁어오는 중...</p>
    </div>
    <div v-else-if="chargers.length === 0" class="msg-empty">
      데이터가 없습니다. 지역명을 더 정확하게 입력해 보세요! 😢
    </div>
    
    <div v-else class="charger-grid">
      <div v-for="(item, index) in chargers" :key="index" class="charger-card">
        <div class="card-header">
          <span class="status-badge" :class="getStatus(item.cpStat).color">
            {{ getStatus(item.cpStat).text }}
          </span>
          <span class="type-badge">{{ item.chargeTp === '2' ? '급속' : '완속' }}</span>
        </div>
        
        <h3>{{ item.csNm }}</h3>
        <p class="addr">📍 {{ item.addr }}</p>
        
        <div class="card-footer">
          <span>🔌 {{ item.cpNm }}</span>
          <span>🕒 {{ item.statUpdateDatetime?.slice(5, 16) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 디자인 핵심: 카드 UI + 반응형 */
.app-container { max-width: 1000px; margin: 0 auto; padding: 20px; background: #fcfcfc; min-height: 100vh; }
.app-header { text-align: center; margin-bottom: 40px; }
.app-header h1 { font-size: 32px; color: #1a73e8; font-weight: 800; }

.search-section { background: #fff; padding: 25px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); margin-bottom: 40px; }
.combo-search-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.select-box, .input-box { padding: 14px; border: 1px solid #e0e0e0; border-radius: 14px; font-size: 15px; background: #f9f9f9; outline: none; }
.select-box { flex: 1; min-width: 140px; }
.input-box { flex: 2; min-width: 220px; }
.search-btn { background: #1a73e8; color: white; border: none; padding: 14px 30px; border-radius: 14px; font-weight: bold; cursor: pointer; }

.charger-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.charger-card { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #eee; transition: all 0.3s; }
.charger-card:hover { transform: translateY(-8px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }

.card-header { display: flex; justify-content: space-between; margin-bottom: 18px; }
.status-badge { padding: 6px 14px; border-radius: 10px; font-weight: bold; font-size: 13px; }
.status-badge.green { background: #e6f7ed; color: #2ecc71; }
.status-badge.blue { background: #eef5ff; color: #3498db; }
.status-badge.red { background: #fff1f0; color: #e74c3c; }

.charger-card h3 { font-size: 20px; margin-bottom: 12px; color: #222; font-weight: 700; }
.addr { font-size: 15px; color: #666; margin-bottom: 20px; line-height: 1.5; }
.card-footer { display: flex; justify-content: space-between; border-top: 1px dashed #eee; padding-top: 15px; font-size: 13px; color: #999; }

.msg-loading, .msg-empty { text-align: center; padding: 100px 0; color: #bbb; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1a73e8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { 100% { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .combo-search-bar { flex-direction: column; }
  .select-box, .input-box, .search-btn { width: 100%; }
}
</style>