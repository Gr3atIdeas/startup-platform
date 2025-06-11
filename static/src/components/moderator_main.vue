<template>
  <div class="moderator-main-page">
    <div class="dashboard-grid">
      <div class="card deals-card">
         <div class="card-inner">
            <img src="/static/accounts/images/main_page_moderator/hands_upper_block.webp" class="card-bg mirrored" alt="Сделки">
            <div class="card-overlay"></div>
            <div class="card-content">
              <h3>Сделки на покупку/продажу</h3>
              <button class="btn-primary">Перейти</button>
            </div>
         </div>
        <div class="notification-badge">1</div>
      </div>
      <div class="card applications-card">
         <div class="card-inner">
            <img src="/static/accounts/images/main_page_moderator/planets_upperblock.webp" class="card-bg" alt="Заявки">
            <div class="card-overlay-dark"></div>
            <div class="card-content left-align">
              <h3>Заявки на новые стартапы</h3>
              <button class="btn-primary">Перейти</button>
            </div>
         </div>
        <div class="notification-badge">2</div>
      </div>
      <div class="card image-card-tall">
         <div class="card-inner">
            <img src="/static/accounts/images/main_page_moderator/rocket_upperblock.webp" class="card-bg" alt="Rocket">
         </div>
      </div>
      <div class="card image-card-small-planet">
         <div class="card-inner">
            <img src="/static/accounts/images/main_page_moderator/planet_upperblock.webp" class="card-bg" alt="Planet">
         </div>
      </div>
      <div class="card news-card">
         <div class="card-inner">
            <div class="card-content left-align">
              <h3>Новости</h3>
              <button class="btn-primary">Перейти</button>
            </div>
            <img src="/static/accounts/images/main_page_moderator/sound_upperblock.webp" class="news-image" alt="Новости">
         </div>
        <div class="notification-badge">4</div>
      </div>
      <div class="card support-card">
         <div class="card-inner">
            <img src="/static/accounts/images/main_page_moderator/bg_block_support.webp" class="card-bg" alt="Поддержка">
            <div class="card-overlay-dark"></div>
            <div class="card-content left-align">
              <h3>Поддержка</h3>
              <button class="btn-primary">Перейти</button>
            </div>
         </div>
        <div class="notification-badge">3</div>
      </div>
    </div>

    <!-- Carousel Section -->
    <div class="carousel-section">
      <div class="carousel-title-container">
        <h2 class="chat-title">Чат</h2>
        <h2 class="chat-title-highlight">СТАРТАПОВ</h2>
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
                                </button>
                                <span>Чат</span>
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
  </div>
</template>

<script>
export default {
  name: 'ModeratorMainPage',
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
.moderator-main-page {
  color: white;
  font-family: 'Unbounded', sans-serif;
  width: 100%;
}

.dashboard-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    max-width: 1303px;
    margin: 45px auto;
    
    .card {
        position: relative;
        border-radius: 10px;
        overflow: visible; // Allow badge to overflow
        background: linear-gradient(180deg, #004E9F 0%, black 100%);
        box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.25);
        
        .card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 10px;
            overflow: hidden;
        }

        h3 {
            font-size: 20px;
            font-weight: 400;
            line-height: 18px;
            margin: 0;
        }
    }
    .card-bg, .news-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    }
    .mirrored { transform: scaleX(-1); }

    .card-overlay {
        position: absolute;
        width: 100%;
        height: 192px;
        left: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.55) 100%);
        filter: blur(27.5px);
        z-index: 2;
    }
    .card-overlay-dark {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background: linear-gradient(270deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.50) 100%);
        z-index: 2;
    }
    .card-content {
        position: relative;
        z-index: 3;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        height: 100%;
        justify-content: flex-end;
        align-items: center;
        text-align: center;
        &.left-align {
            align-items: flex-start;
            justify-content: center;
            padding-left: 60px;
        }
    }

    .deals-card { width: 389px; height: 346px; }
    .applications-card { width: 620px; height: 346px; }
    .image-card-tall { width: 191px; height: 346px; background: none; box-shadow: none; .card-inner { overflow: hidden; .card-bg { object-fit: cover; } } }
    .image-card-small-planet { width: 180px; height: 180px; background: none; box-shadow: none; .card-inner { overflow: hidden; .card-bg { object-fit: cover; } } }
    .news-card {
        width: 730px; height: 180px;
        .card-inner {
            display: flex;
            align-items: center;
            padding: 0;
        }
        .card-content { width: 50%; }
        .news-image {
            position: relative;
            width: 50%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
            border-radius: 0 10px 10px 0;
        }
    }
    .support-card { width: 290px; height: 180px; }

    .notification-badge {
        position: absolute;
        width: 30px;
        height: 30px;
        background: #FF1B1B;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        font-weight: 400;
        z-index: 5;
        top: -8px;
        right: -8px;
        border: 2px solid #0F0F2D;
    }
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
    width: 100%;
    .carousel-title-container {
        display: flex;
        gap: 15px;
        max-width: 1303px;
        margin: 0 auto 20px auto;
        padding: 0 20px;
        h2 { margin: 0; font-size: 55px; font-weight: 400; font-family: 'Blippo-Black CY [Rus by me]'; }
        .chat-title-highlight { color: #FFEF2B; }
    }
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  .carousel-arrow {
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 10;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    &.left { left: calc((100% - 1303px) / 2 - 80px); }
    &.right { right: 20px; }
    img { width: 50px; height: 50px; }
  }
}

.carousel-container-wrapper {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 32px 0 0 32px;
  backdrop-filter: blur(10px);
  padding: 54px 0 54px 94px;
  overflow: hidden;
  width: auto;
  margin-left: calc((100% - 1303px) / 2);
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        span {
            font-size: 14px;
            font-weight: 300;
        }
    }
    .btn-chat {
        background: white;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        img {
            width: 32px;
            height: 32px;
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