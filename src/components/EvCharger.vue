<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { EV_KEY } from '../ApiConfig';

// 🌏 지역 코드 (API가 이걸 원함)
const REGIONS = [
  { code: '11', name: '서울' },
  { code: '26', name: '부산' },
  { code: '27', name: '대구' },
  { code: '28', name: '인천' },
  { code: '29', name: '광주' },
  { code: '30', name: '대전' },
  { code: '31', name: '울산' },
  { code: '41', name: '경기' },
  { code: '50', name: '제주' }
];

const chargers = ref([]);
const loading = ref(false);

// 🔍 필터 변수 (사용자가 선택하는 값)
const selectedRegion = ref('11'); // 기본값: 서울
const typeFilter = ref('ALL');    // 급속/완속

// API 호출 함수
const fetchChargers = async () => {
  loading.value = true;
  chargers.value = []; // 기존 데이터 초기화
  
  try {
	const url = '/api/B552584/EvCharger/getChargerInfo';
    const response = await axios.get(url, {
      params: {
        serviceKey: EV_KEY,
        pageNo: '1',
        numOfRows: '30', // 30개만 가져오기
        zcode: selectedRegion.value, // 선택한 지역 코드
        dataType: 'JSON'
      }
    });

    const items = response.data.items.item;
    if (items) {
      chargers.value = Array.isArray(items) ? items : [items];
    }
  } catch (e) {
    console.error(e);
    alert("데이터 불러오기 실패! 키를 확인해주세요.");
  } finally {
    loading.value = false;
  }
};

// 🔥 computed: 실시간 필터링 (Vue의 핵심 기술!)
const filteredList = computed(() => {
  return chargers.value.filter(item => {
    // 급속(04,07) / 완속(02) 필터링
    if (typeFilter.value === 'FAST') return item.chgerType === '04' || item.chgerType === '07';
    if (typeFilter.value === 'SLOW') return item.chgerType === '02';
    return true; // ALL이면 다 보여줌
  });
});

// 지역이 바뀌면 자동으로 데이터 다시 가져오기
watch(selectedRegion, () => {
  fetchChargers();
}, { immediate: true }); // 처음에 한 번 자동 실행
</script>

<template>
  <div class="container">
    <h2>⚡ 전기차 충전소 찾기</h2>
    
    <div class="controls">
      <select v-model="selectedRegion" class="box">
        <option v-for="region in REGIONS" :key="region.code" :value="region.code">
          {{ region.name }}
        </option>
      </select>
      
      <select v-model="typeFilter" class="box">
        <option value="ALL">전체 보기</option>
        <option value="FAST">🚀 급속 충전</option>
        <option value="SLOW">🐢 완속 충전</option>
      </select>
    </div>

    <p v-if="loading">데이터 불러오는 중... 🔌</p>
    
    <div v-else class="list">
      <div v-for="(item, index) in filteredList" :key="index" class="card">
        <h3>{{ item.statNm }}</h3>
        <p>📍 {{ item.addr }}</p>
        <div class="tags">
          <span class="badge" :class="{'fast': item.chgerType === '04' || item.chgerType === '07'}">
            {{ (item.chgerType === '04' || item.chgerType === '07') ? '급속' : '완속' }}
          </span>
          <span class="status">{{ item.stat === '2' ? '충전가능 🟢' : '사용중 🔴' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 20px; max-width: 600px; margin: 0 auto; }
.controls { display: flex; gap: 10px; margin-bottom: 20px; }
.box { padding: 10px; border-radius: 8px; border: 1px solid #ddd; flex: 1; font-size: 16px; }
.card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.tags { margin-top: 10px; display: flex; gap: 10px; align-items: center; }
.badge { padding: 5px 10px; background: #eee; border-radius: 20px; font-size: 12px; font-weight: bold; }
.badge.fast { background: #ffeaa7; color: #d35400; }
.status { font-size: 14px; font-weight: bold; margin-left: auto; }
</style>