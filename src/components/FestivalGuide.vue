<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { FESTIVAL_KEY } from '../ApiConfig';

const festivals = ref([]);
const loading = ref(false);

const fetchFestivals = async () => {
  loading.value = true;
  try {
	const url = '/api/B551011/KorService1/searchFestival1';    
    // 오늘 날짜 구하기 (20240213 형식)
    const today = new Date().toISOString().slice(0,10).replace(/-/g,"");

    const response = await axios.get(url, {
      params: {
        serviceKey: FESTIVAL_KEY,
        numOfRows: '20',
        pageNo: '1',
        MobileOS: 'ETC',
        MobileApp: 'MyTravelApp',
        eventStartDate: today, // 오늘부터 시작하는 축제
        _type: 'json'
      }
    });

    const items = response.data.response.body.items.item;
    if (items) {
      festivals.value = Array.isArray(items) ? items : [items];
    }
  } catch (e) {
    console.error(e);
    alert("축제 데이터 불러오기 실패!");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFestivals();
});
</script>

<template>
  <div class="container">
    <h2>🎉 전국 축제 가이드</h2>
    
    <div v-if="loading">축제 정보 찾는 중... 🎡</div>
    
    <div v-else class="grid">
      <div v-for="(item, index) in festivals" :key="index" class="card">
        <div class="image-area">
          <img v-if="item.firstimage" :src="item.firstimage" alt="축제" />
          <div v-else class="no-image">이미지 없음 😢</div>
        </div>
        <div class="content">
          <h3>{{ item.title }}</h3>
          <p class="date">{{ item.eventstartdate }} ~ {{ item.eventenddate }}</p>
          <p class="loc">📍 {{ item.addr1 }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 20px; max-width: 800px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.card { border-radius: 15px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: white; transition: transform 0.2s; }
.card:hover { transform: translateY(-5px); }
.image-area { height: 150px; background: #eee; }
.image-area img { width: 100%; height: 100%; object-fit: cover; }
.no-image { height: 100%; display: flex; align-items: center; justify-content: center; color: #999; }
.content { padding: 15px; }
.content h3 { margin: 0 0 10px 0; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.date { color: #4A90E2; font-weight: bold; font-size: 12px; }
.loc { color: #666; font-size: 12px; margin-top: 5px; }
</style>