<template>
  <div class="carousel-section" v-if="carouselData.length > 0">
    <div class="carousel-title-container">
      <h2>
        Чат<br />
        <span class="chat-title-highlight">СТАРТАПОВ</span>
      </h2>
    </div>
    <div class="carousel-wrapper">
      <button @click="prevSlide" class="carousel-arrow left">
        <img
          src="/static/accounts/images/main_page_moderator/chevron-back-circle-outline.svg"
          alt="Назад"
        />
      </button>
      <div class="carousel-container-wrapper">
        <div
          class="carousel-container"
          :style="{ transform: `translateX(-${currentSlide * (801 + 39)}px)` }"
        >
          <div class="carousel-card" v-for="startup in carouselData" :key="startup.startup_id">
            <img
              :src="startup.logo_url"
              class="carousel-avatar"
              :alt="startup.name"
            />
            <div class="carousel-card-header">
              <span class="startup-name">{{ startup.name }}</span>
              <div class="investment-info">
                <span>Всего инвестировано</span>
                <span class="amount">{{ formatAmount(startup.total_amount) }} ₽</span>
              </div>
            </div>
            <div class="carousel-card-footer">
              <div class="updates">
                <p v-for="update in startup.updates" :key="update">{{ update }}</p>
                <p v-if="startup.updates.length === 0">Нет недавних обновлений</p>
              </div>
              <div class="actions">
                <div class="chat-action">
                  <a :href="startup.chat_url" class="btn-chat">
                    <img
                      src="/static/accounts/images/main_page_moderator/chatbubbles-outline.svg"
                      alt="Чат"
                    />
                    <span>Чат</span>
                  </a>
                </div>
                <a :href="startup.startup_url" class="btn-primary">К стартапу</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button @click="nextSlide" class="carousel-arrow right">
        <img
          src="/static/accounts/images/main_page_moderator/chevron-forward-circle-outline.svg"
          alt="Вперед"
        />
      </button>
    </div>
    <div class="carousel-dots">
      <span
        v-for="n in totalSlides"
        :key="n"
        class="dot"
        :class="{ active: n - 1 === currentSlide }"
        @click="currentSlide = n - 1"
      >
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Carousel',
  props: {
    carouselData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentSlide: 0,
    }
  },
  computed: {
    totalSlides() {
      return this.carouselData.length
    }
  },
  methods: {
    nextSlide() {
      if (this.totalSlides > 0) {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides
      }
    },
    prevSlide() {
      if (this.totalSlides > 0) {
        this.currentSlide =
          (this.currentSlide - 1 + this.totalSlides) % this.totalSlides
      }
    },
    formatAmount(amount) {
      return new Intl.NumberFormat('ru-RU').format(amount)
    }
  },
}
</script>

<style lang="scss" scoped>
@font-face {
  font-family: 'Blippo-Black CY [Rus by me]';
  src: url('/static/accounts/fonts/blippo_blackcyrusbyme.otf')
    format('opentype');
  font-weight: normal;
  font-style: normal;
}

.btn-primary {
  padding: 12px 35px !important;
  background: linear-gradient(180deg, #ffef2b 0%, #f9f7d6 100%) !important;
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
  max-width: 100vw;
  position: relative;
  left: 0;
  transform: none;
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
    .chat-title-highlight {
      color: #ffef2b;
    }
  }
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: 100vw;
  max-width: 100vw;
  box-sizing: border-box;
  overflow: hidden;
  margin-left: calc(-50vw + 50%);

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
      background: rgba(0, 0, 0, 0.2);
    }

    &.left {
      left: 20px;
    }

    &.right {
      right: 20px;
    }
    img {
      width: 50px;
      height: 50px;
      display: block;
    }
  }
}

.carousel-container-wrapper {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  padding: 54px 0 54px 54px;
  overflow: hidden;
  flex: 1;
  box-sizing: border-box;
  width: 100%;
}

.carousel-container {
  display: flex;
  gap: 39px;
  transition: transform 0.5s ease-in-out;
  padding-left: 0;
}

.carousel-card {
  flex: 0 0 900px;
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
  overflow: hidden;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:last-child {
    margin-right: 0;
  }

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

  .carousel-card-header,
  .carousel-card-footer {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .carousel-card-header {
    align-items: flex-start;
    .startup-name {
      font-size: 35px;
      font-weight: 600;
    }
    .investment-info {
      background: rgba(43, 251, 255, 0.4);
      border-radius: 10px;
      padding: 15px 21px;
      backdrop-filter: blur(2px);
      font-size: 12px;
      font-weight: 300;
      .amount {
        color: #ffef2b;
        font-size: 16px;
        font-weight: 400;
        display: block;
      }
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
      background: #ffef2b;
      border-radius: 10px;
    }
  }
}
</style>
