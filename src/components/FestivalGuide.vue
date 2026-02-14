<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import { FESTIVAL_KEY } from '../ApiConfig';

const festivals = ref([]);
const loading = ref(false);
const selectedFestival = ref(null); // 선택된 축제 (모달용)

// 📅 날짜 형식 변환 함수 (20260221 -> 2026.02.21)
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3');
};

const fetchFestivals = async () => {
  loading.value = true;
  try {
    // 🚨 스크린샷 3번의 상세기능명 searchFestival2 적용
    const url = `/api/B551011/KorService2/searchFestival2`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const response = await axios.get(url, {
      params: {
        serviceKey: FESTIVAL_KEY,
        numOfRows: 12,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'AppTest',
        eventStartDate: today,
        _type: 'json'
      }
    });

    const items = response.data?.response?.body?.items?.item;
    if (items) {
      festivals.value = Array.isArray(items) ? items : [items];
    }
  } catch (e) {
    console.error("축제 에러:", e);
  } finally {
    loading.value = false;
  }
};

fetchFestivals();
</script>

<template>
  <div class="festival-container">
    <header class="header">
      <h1>🎊 전국 축제 가이드</h1>
      <p>지금 가장 핫한 축제 정보를 확인하세요!</p>
    </header>

    <div v-if="loading" class="loader">축제 정보를 불러오는 중... 🎈</div>

    <div v-else class="festival-grid">
      <div 
        v-for="(item, index) in festivals" 
        :key="index" 
        class="festival-card"
        @click="selectedFestival = item" 
      >
        <div class="image-box">
          <img :src="item.firstimage || 'https://via.placeholder.com/300x200?text=No+Image'" :alt="item.title" />
        </div>
        <div class="info-box">
          <h3>{{ item.title }}</h3>
          <p class="date">
            {{ formatDate(item.eventstartdate) }} / {{ formatDate(item.eventenddate) }}
          </p>
          <p class="addr">📍 {{ item.addr1 }}</p>
        </div>
      </div>
    </div>

    <div v-if="selectedFestival" class="modal-overlay" @click.self="selectedFestival = null">
      <div class="modal-content">
        <button class="close-btn" @click="selectedFestival = null">✕</button>
        <img :src="selectedFestival.firstimage" :alt="selectedFestival.title" class="modal-img" />
        <div class="modal-body">
          <h2>{{ selectedFestival.title }}</h2>
          <div class="modal-info">
            <p><strong>🗓️ 기간:</strong> {{ formatDate(selectedFestival.eventstartdate) }} ~ {{ formatDate(selectedFestival.eventenddate) }}</p>
            <p><strong>📍 주소:</strong> {{ selectedFestival.addr1 }} {{ selectedFestival.addr2 || '' }}</p>
            <p v-if="selectedFestival.tel"><strong>📞 문의:</strong> {{ selectedFestival.tel }}</p>
          </div>
          <p class="modal-desc">※ 상세 일정 및 프로그램은 주최측 사정에 따라 변경될 수 있습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.festival-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Pretendard', sans-serif; }
.header { text-align: center; margin-bottom: 40px; }
.header h1 { font-size: 28px; color: #333; font-weight: 800; }

/* 리스트 그리드 디자인 */
.festival-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
.festival-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); transition: 0.3s; cursor: pointer; }
.festival-card:hover { transform: translateY(-8px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }

.image-box img { width: 100%; height: 200px; object-fit: cover; }
.info-box { padding: 20px; }
.info-box h3 { font-size: 18px; margin-bottom: 10px; color: #222; }
.date { color: #3498db; font-weight: bold; font-size: 14px; margin-bottom: 10px; } /* 날짜 파란색 유지 */
.addr { font-size: 13px; color: #666; }

/* 상세 보기 모달 디자인 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; border-radius: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; }
.close-btn { position: absolute; top: 15px; right: 20px; font-size: 24px; background: none; border: none; cursor: pointer; z-index: 10; color: #fff; text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.modal-img { width: 100%; height: 250px; object-fit: cover; }
.modal-body { padding: 30px; }
.modal-body h2 { margin-bottom: 20px; font-size: 24px; }
.modal-info p { margin-bottom: 12px; font-size: 15px; line-height: 1.6; }
.modal-desc { margin-top: 20px; font-size: 13px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }

.loader { text-align: center; padding: 100px 0; color: #999; }
</style>