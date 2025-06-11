<template>
  <div class="carousel-section">
    <div class="carousel-title-container">
      <h2>
        Чат<br>
        <span class="chat-title-highlight">СТАРТАПОВ</span>
      </h2>
    </div>
    <div class="carousel-wrapper">
      <button @click="prevSlide" class="carousel-arrow left">
        <img src="/static/accounts/images/main_page_moderator/chevron-back-circle-outline.svg" alt="Назад">
      </button>
      <div class="carousel-container-wrapper">
          <div class="carousel-container" :style="{ transform: `translateX(-${currentSlide * (801 + 39)}px)` }">
              <div class="carousel-card" v-for="i in 3" :key="i">
                  <img src="/static/accounts/images/main_page_moderator/planet_logo_carusel.webp" class="carousel-avatar" alt="Planet Logo">
                  <div class="carousel-card-header">
                      <span class="startup-name">Ромашка</span>
                      <div class="investment-info">
                          <span>Вы инвестировали</span>
                          <span class="amount">3 675 998 ₽</span>
                      </div>
                  </div>
                  <div class="carousel-card-footer">
                      <div class="updates">
                          <p>User 67346 инвестировал 7 899 ₽</p>
                          <p>User 67346 понравился комментарий user 74839</p>
                          <p>Вышло обновления новости по стартапу</p>
                      </div>
                      <div class="actions">
                          <div class="chat-action">
                              <button class="btn-chat">
                                  <img src="/static/accounts/images/main_page_moderator/chatbubbles-outline.svg" alt="Чат">
                                  <span>Чат</span>
                              </button>
                          </div>
                          <button class="btn-primary">К стартапу</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      <button @click="nextSlide" class="carousel-arrow right">
          <img src="/static/accounts/images/main_page_moderator/chevron-forward-circle-outline.svg" alt="Вперед">
      </button>
    </div>
     <div class="carousel-dots">
          <span v-for="n in totalSlides" :key="n" 
                class="dot" 
                :class="{ 'active': n - 1 === currentSlide }"
                @click="currentSlide = n - 1">
          </span>
      </div>
  </div>
</template>

<script>
export default {
  name: 'Carousel',
  data() {
    return {
      currentSlide: 0,
      totalSlides: 3,
    };
  },
  methods: {
    nextSlide() {
      this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    },
    prevSlide() {
      this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    },
  },
}
</script>

<style lang="scss" scoped>
@font-face {
    font-family: 'Blippo-Black CY [Rus by me]';
    src: url('/static/accounts/fonts/blippo_blackcyrusbyme.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
}

.btn-primary {
  padding: 12px 35px !important;
  background: linear-gradient(180deg, #FFEF2B 0%, #F9F7D6 100%) !important;
  box-shadow: 2px 4px 4px rgba(0, 0, 0, 0.25) !important;
  border-radius: 10px !important;
  color: black !important;
  font-size: 16px !important;
  font-family: 'Unbounded', sans-serif !important;
  font-weight: 400 !important;
  border: none !important;
  cursor: pointer !important;
  line-height: 16px !important;
  height: 40px !important;
  min-width: auto !important;
}

.carousel-section {
    padding: 0;
    margin-top: 45px;
    width: 100vw;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    overflow: hidden;
    .carousel-title-container {
        max-width: 1303px;
        margin: 0 auto 20px auto;
        padding: 75px 20px;
        h2 { 
            margin: 0; 
            font-size: 55px; 
            font-weight: 400; 
            font-family: 'Blippo-Black CY [Rus by me]'; 
            line-height: 1.1;
            text-align: left;
        }
        .chat-title-highlight { color: #FFEF2B; }
    }
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: calc((100% - 1303px) / 2);
  width: 100%;
  box-sizing: border-box;
  
  .carousel-arrow {
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
    
    &:hover {
      border-color: rgba(198, 187, 254, 0.7);
      background: rgba(0,0,0,0.2);
    }

    &.left { left: calc(((100% - 1303px) / 2) + 30px); }
    &.right { 
        right: calc(((100% - 1303px) / 2) + 40px);
        position: absolute; 
    }
    img { width: 50px; height: 50px; display: block; }
  }
}

.carousel-container-wrapper {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 32px 0 0 32px;
  backdrop-filter: blur(10px);
  padding: 54px;
  overflow: hidden;
  width: 100%;
}

.carousel-container {
  display: flex;
  gap: 39px;
  transition: transform 0.5s ease-in-out;
  padding-left: 0; // Center alignment
}

.carousel-card {
  flex: 0 0 801px;
  height: 609px;
  position: relative;
  background-image: linear-gradient(180deg, rgba(0, 78, 159, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), url('/static/accounts/images/main_page_moderator/bg_carusel_card.webp');
  background-size: cover;
  background-position: center;
  box-shadow: 6px 6px 10px rgba(123, 97, 255, 0.25);
  border-radius: 10px;
  outline: 1px #C6BBFE solid;
  overflow: hidden;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .carousel-avatar {
    position: absolute;
    width: 373px;
    height: 373px;
    object-fit: contain;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
  }

  .carousel-card-header, .carousel-card-footer {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .carousel-card-header {
    align-items: flex-start;
    .startup-name { font-size: 35px; font-weight: 600; }
    .investment-info {
        background: rgba(43, 251, 255, 0.4);
        border-radius: 10px;
        padding: 15px 21px;
        backdrop-filter: blur(2px);
        font-size: 12px;
        font-weight: 300;
        .amount { color: #FFEF2B; font-size: 16px; font-weight: 400; display: block; }
    }
  }

  .carousel-card-footer {
    align-items: flex-end;
    .updates p {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        padding: 8px 24px;
        margin-bottom: 15px;
        font-size: 14px;
        font-weight: 300;
        backdrop-filter: blur(5px);
    }
    .actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    }
    .chat-action {
        order: 1;
    }
    .btn-primary {
        order: 2;
        white-space: nowrap;
    }
    .btn-chat {
        background: white;
        width: 86px; // Increased width to fit content
        height: 86px; // Increased height
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding-top: 7px;
        padding-bottom: 7px;
        color: black;
        font-family: 'Unbounded', sans-serif;
        
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
  }
}
.carousel-dots {
    display: flex;
    justify-content: center;
    gap: 13px;
    max-width: 1303px;
    margin: 20px auto;
    padding: 0 20px;
    .dot {
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease-in-out;
        &.active {
            width: 70px;
            background: #FFEF2B;
            border-radius: 10px;
        }
    }
}
</style> 