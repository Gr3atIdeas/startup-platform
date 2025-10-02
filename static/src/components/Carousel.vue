<template>
  <div class="startup-carousel-section" v-if="carouselData.length > 0">
    <div class="startup-carousel-title">
      <h2>
        Чат<br />
        <span class="startup-carousel-title-highlight">СТАРТАПОВ</span>
      </h2>
    </div>
    
    <div class="startup-carousel-container">
      <button 
        @click="prevSlide" 
        class="startup-carousel-btn startup-carousel-btn--prev"
        :disabled="currentIndex === 0"
      >
        <img src="/static/accounts/images/main_page_moderator/chevron-back-circle-outline.svg" alt="Назад" />
      </button>
      
      <div class="startup-carousel-viewport">
        <div 
          class="startup-carousel-track"
          :style="{ transform: `translateX(-${currentIndex * 840}px)` }"
        >
          <div 
            class="startup-carousel-card" 
            v-for="startup in carouselData" 
            :key="startup.startup_id"
          >
            <img
              :src="startup.logo_url"
              class="startup-carousel-card-avatar"
              :alt="startup.name"
            />
            <div class="startup-carousel-card-content">
              <div class="startup-carousel-card-header">
                <h3 class="startup-carousel-card-title">{{ startup.name }}</h3>
                <div class="startup-carousel-card-investment">
                  <span class="startup-carousel-card-investment-label">Всего инвестировано</span>
                  <span class="startup-carousel-card-investment-amount">{{ formatAmount(startup.total_amount) }} ₽</span>
                </div>
              </div>
              
              <div class="startup-carousel-card-footer">
                <div class="startup-carousel-card-updates">
                  <p v-for="update in startup.updates" :key="update" class="startup-carousel-card-update">{{ update }}</p>
                  <p v-if="startup.updates.length === 0" class="startup-carousel-card-update">Нет недавних обновлений</p>
                </div>
                
                <div class="startup-carousel-card-actions">
                  <a :href="startup.chat_url" class="startup-carousel-card-chat-btn">
                    <img src="/static/accounts/images/main_page_moderator/chatbubbles-outline.svg" alt="Чат" />
                    <span>Чат</span>
                  </a>
                  <a :href="startup.startup_url" class="startup-carousel-card-link-btn">К стартапу</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        @click="nextSlide" 
        class="startup-carousel-btn startup-carousel-btn--next"
        :disabled="currentIndex >= carouselData.length - 1"
      >
        <img src="/static/accounts/images/main_page_moderator/chevron-forward-circle-outline.svg" alt="Вперед" />
      </button>
    </div>
    
    <div class="startup-carousel-dots">
      <button
        v-for="(startup, index) in carouselData"
        :key="index"
        class="startup-carousel-dot"
        :class="{ 'startup-carousel-dot--active': index === currentIndex }"
        @click="currentIndex = index"
      >
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StartupCarousel',
  props: {
    carouselData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentIndex: 0
    }
  },
  methods: {
    nextSlide() {
      if (this.currentIndex < this.carouselData.length - 1) {
        this.currentIndex++
      }
    },
    prevSlide() {
      if (this.currentIndex > 0) {
        this.currentIndex--
      }
    },
    formatAmount(amount) {
      return new Intl.NumberFormat('ru-RU').format(amount)
    }
  }
}
</script>

<style lang="scss" scoped>
@font-face {
  font-family: 'Blippo-Black CY [Rus by me]';
  src: url('/static/accounts/fonts/blippo_blackcyrusbyme.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Unbounded';
  src: url('/static/accounts/fonts/Unbounded-VariableFont_wght.ttf') format('truetype');
  font-weight: 300 900;
}

.startup-carousel-section {
  padding: 45px 20px 20px;
  margin: 0 auto;
  max-width: 1303px;
}

.startup-carousel-title {
  margin-bottom: 40px;
  text-align: left;
  
  h2 {
    margin: 0;
    font-size: 55px;
    font-weight: 400;
    font-family: 'Blippo-Black CY [Rus by me]';
    line-height: 1.1;
    color: white;
  }
  
  .startup-carousel-title-highlight {
    color: #ffef2b;
  }
}

.startup-carousel-container {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 32px;
  backdrop-filter: blur(20px);
  padding: 54px 80px;
  margin-bottom: 20px;
}

.startup-carousel-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.startup-carousel-track {
  display: flex;
  gap: 39px;
  transition: transform 0.5s ease-in-out;
  width: max-content;
}

.startup-carousel-card {
  flex: 0 0 801px;
  width: 801px;
  height: 609px;
  position: relative;
  background-image:
    linear-gradient(180deg, rgba(0, 78, 159, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%),
    url('/static/accounts/images/main_page_moderator/bg_carusel_card.webp');
  background-size: cover;
  background-position: center;
  box-shadow: 6px 6px 10px rgba(123, 97, 255, 0.25);
  border-radius: 10px;
  border: 1px solid #c6bbfe;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.startup-carousel-card-avatar {
  position: absolute;
  width: 373px;
  height: 373px;
  object-fit: contain;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.startup-carousel-card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.startup-carousel-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.startup-carousel-card-title {
  font-size: 35px;
  font-weight: 600;
  color: white;
  margin: 0;
  font-family: 'Unbounded', sans-serif;
}

.startup-carousel-card-investment {
  background: rgba(43, 251, 255, 0.4);
  border-radius: 10px;
  padding: 15px 21px;
  backdrop-filter: blur(2px);
  font-size: 12px;
  font-weight: 300;
  color: white;
  text-align: right;
}

.startup-carousel-card-investment-label {
  display: block;
  margin-bottom: 5px;
}

.startup-carousel-card-investment-amount {
  color: #ffef2b;
  font-size: 16px;
  font-weight: 400;
  display: block;
}

.startup-carousel-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.startup-carousel-card-updates {
  flex: 1;
}

.startup-carousel-card-update {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: 8px 24px;
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: 300;
  color: white;
  backdrop-filter: blur(5px);
}

.startup-carousel-card-update:last-child {
  margin-bottom: 0;
}

.startup-carousel-card-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.startup-carousel-card-chat-btn {
  background: white;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 7px;
  color: black;
  font-family: 'Unbounded', sans-serif;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: #f0f0f0;
    transform: scale(1.05);
  }

  img {
    width: 32px;
    height: 32px;
    margin-bottom: 4px;
  }

  span {
    font-size: 14px;
    font-weight: 300;
    line-height: 1;
  }
}

.startup-carousel-card-link-btn {
  padding: 12px 35px;
  background: linear-gradient(180deg, #ffef2b 0%, #f9f7d6 100%);
  box-shadow: 2px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  color: black;
  font-size: 16px;
  font-family: 'Unbounded', sans-serif;
  font-weight: 400;
  border: none;
  cursor: pointer;
  line-height: 16px;
  height: 40px;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 4px 6px 8px rgba(0, 0, 0, 0.3);
  }
}

.startup-carousel-btn {
  background: transparent;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 5px;
  transition: all 0.3s ease;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    border-color: rgba(198, 187, 254, 0.7);
    background: rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  img {
    width: 50px;
    height: 50px;
    display: block;
  }
}

.startup-carousel-btn--prev {
  left: 20px;
}

.startup-carousel-btn--next {
  right: 20px;
}

.startup-carousel-dots {
  display: flex;
  justify-content: center;
  gap: 13px;
  margin-top: 20px;
}

.startup-carousel-dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  border: none;
  padding: 0;

  &:hover {
    background: #ffef2b;
  }

  &.startup-carousel-dot--active {
    width: 70px;
    background: #ffef2b;
    border-radius: 10px;
  }
}
</style>
