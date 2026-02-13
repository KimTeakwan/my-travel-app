<script setup>
import { ref } from 'vue';
import EvCharger from './components/EvCharger.vue';
import FestivalGuide from './components/FestivalGuide.vue';

const currentTab = ref('EV'); // 기본값: 전기차
</script>

<template>
  <div class="app-container">
    <header>
      <h1>🚗 여행 & 테크 라이프</h1>
      <nav>
        <button @click="currentTab = 'EV'" :class="{ active: currentTab === 'EV' }">⚡ 전기차 충전</button>
        <button @click="currentTab = 'FESTIVAL'" :class="{ active: currentTab === 'FESTIVAL' }">🎡 전국 축제</button>
      </nav>
    </header>

    <main>
      <EvCharger v-if="currentTab === 'EV'" />
      <FestivalGuide v-if="currentTab === 'FESTIVAL'" />
    </main>
  </div>
</template>

<style>
body { margin: 0; background: #f4f6f8; font-family: 'Pretendard', sans-serif; }
.app-container { text-align: center; }

/* 🔥 여기 고쳤음! (sticky 앞에 position: 추가) */
header { 
  background: white; 
  padding: 20px; 
  box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
  position: sticky; /* 👈 범인 검거! position: 추가함 */
  top: 0; 
  z-index: 100; 
}

h1 { margin: 0 0 20px 0; color: #333; font-size: 24px; }
nav { display: flex; justify-content: center; gap: 10px; }

button { 
  padding: 10px 20px; 
  border: none; 
  background: #f1f3f5; 
  border-radius: 25px; 
  cursor: pointer; 
  font-weight: bold; 
  transition: 0.3s; 
  font-size: 16px; 
  color: #868e96; 
}

button.active { 
  background: #42b883; 
  color: white; 
  box-shadow: 0 4px 10px rgba(66, 184, 131, 0.4); 
}

button:hover { 
  transform: translateY(-2px); 
}

main { padding: 20px; }
</style>