<template>
  <div class="moderator-main-page">
    <div class="dashboard-grid">
      <div class="card deals-card">
        <div class="card-inner">
          <img
            src="/static/accounts/images/main_page_moderator/hands_upper_block.webp"
            class="card-bg mirrored"
            alt="Сделки"
          />
          <div class="card-overlay"></div>
          <div class="card-content">
            <h3>Сделки на покупку/продажу</h3>
            <a href="/deals/" class="btn-primary">Перейти</a>
          </div>
        </div>
      </div>
      <div class="card applications-card">
        <div class="card-inner">
          <img
            src="/static/accounts/images/main_page_moderator/planets_upperblock.webp"
            class="card-bg"
            alt="Заявки"
          />
          <div class="card-overlay-dark"></div>
          <div class="card-content left-align">
            <h3>Заявки на новые стартапы</h3>
            <a href="/moderator-dashboard/" class="btn-primary">Перейти</a>
          </div>
        </div>
      </div>
      <div class="card image-card-tall">
        <div class="card-inner">
          <img
            src="/static/accounts/images/main_page_moderator/rocket_upperblock.webp"
            class="card-bg"
            alt="Rocket"
          />
        </div>
      </div>
      <div class="card image-card-small-planet">
        <div class="card-inner">
          <img
            src="/static/accounts/images/main_page_moderator/planet_upperblock.webp"
            class="card-bg"
            alt="Planet"
          />
        </div>
      </div>
      <div v-if="isDebug" class="card news-card">
        <div class="card-inner">
          <div class="card-content left-align">
            <h3>Новости</h3>
            <a href="/news/" class="btn-primary">Перейти</a>
          </div>
          <img
            src="/static/accounts/images/main_page_moderator/sound_upperblock.webp"
            class="news-image"
            alt="Новости"
          />
        </div>
      </div>
      <div class="card support-card">
        <div class="card-inner">
          <img
            src="/static/accounts/images/main_page_moderator/bg_block_support.webp"
            class="card-bg"
            alt="Поддержка"
          />
          <div class="card-overlay-dark"></div>
          <div class="card-content left-align">
            <h3>Поддержка</h3>
            <a href="/support/" class="btn-primary">Перейти</a>
          </div>
        </div>
      </div>
    </div>

    <Carousel :carousel-data="carouselData" />
  </div>
</template>

<script>
import Carousel from './Carousel.vue'

export default {
  name: 'ModeratorMainPage',
  components: {
    Carousel,
  },
  props: {
    carouselData: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    isDebug() {
      return window.DEBUG || false
    }
  }
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

@font-face {
  font-family: 'Unbounded';
  src: url('/static/accounts/fonts/Unbounded-VariableFont_wght.ttf')
    format('truetype');
  font-weight: 300 900;
}

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
  padding: 0 20px;

  @media (max-width: 768px) {
    gap: 20px;
    margin: 30px auto;
    padding: 0 15px;
  }

  @media (max-width: 480px) {
    gap: 15px;
    margin: 20px auto;
    padding: 0 10px;
    flex-direction: column;
  }

  .card {
    position: relative;
    border-radius: 10px;
    overflow: visible;
    background: linear-gradient(180deg, #004e9f 0%, black 100%);
    box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.25);
    
    &:hover {
      transform: none !important;
      box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.25) !important;
    }

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
      color: #fff;
    }

    @media (max-width: 768px) {
      h3 {
        font-size: 18px;
        line-height: 16px;
      }
    }

    @media (max-width: 480px) {
      h3 {
        font-size: 16px;
        line-height: 14px;
      }
    }

    .card-bg,
    .news-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }
    .mirrored {
      transform: scaleX(-1);
    }

    .card-overlay {
      position: absolute;
      width: 100%;
      height: 192px;
      left: 0;
      bottom: 0;
      background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.25) 0%,
        rgba(0, 0, 0, 0.55) 100%
      );
      filter: blur(27.5px);
      z-index: 2;
    }
    .card-overlay-dark {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      background: linear-gradient(
        270deg,
        rgba(0, 0, 0, 0.1) 0%,
        rgba(0, 0, 0, 0.5) 100%
      );
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
      color: #fff;
    &.left-align {
      align-items: flex-start;
      justify-content: center;
      padding-left: 60px;
    }

    @media (max-width: 768px) {
      padding: 15px;
      gap: 15px;

      &.left-align {
        padding-left: 40px;
      }
    }

    @media (max-width: 480px) {
      padding: 15px;
      gap: 12px;

      &.left-align {
        padding-left: 20px;
      }
    }
  }
  }

  .deals-card {
    width: 389px;
    height: 346px;
  }
  .applications-card {
    width: 663px;
    height: 346px;
  }
  .image-card-tall {
    width: 191px;
    height: 346px;
    background: none;
    box-shadow: none;
    .card-inner {
      overflow: hidden;
      .card-bg {
        object-fit: cover;
      }
    }
  }
  .image-card-small-planet {
    width: 180px;
    height: 180px;
    background: none;
    box-shadow: none;
    .card-inner {
      overflow: hidden;
      .card-bg {
        object-fit: cover;
      }
    }
  }
  .news-card {
    width: 773px;
    height: 180px;
    .card-inner {
      display: flex;
      align-items: center;
      padding: 0;
    }
    .card-content {
      width: 50%;
    }
    .news-image {
      position: relative;
      width: 50%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
      border-radius: 0 10px 10px 0;
    }
  }
  .support-card {
    width: 290px;
    height: 180px;
  }

  @media (max-width: 1024px) {
    .deals-card {
      width: calc(50% - 15px);
      min-width: 300px;
    }
    .applications-card {
      width: calc(50% - 15px);
      min-width: 300px;
    }
    .news-card {
      width: 100%;
    }
    .image-card-tall {
      width: calc(33.333% - 20px);
      min-width: 150px;
    }
    .image-card-small-planet {
      width: calc(33.333% - 20px);
      min-width: 150px;
    }
    .support-card {
      width: calc(33.333% - 20px);
      min-width: 150px;
    }
  }

  @media (max-width: 768px) {
    .deals-card {
      width: 100%;
      height: 280px;
    }
    .applications-card {
      width: 100%;
      height: 280px;
    }
    .news-card {
      width: 100%;
      height: 160px;
    }
    .image-card-tall {
      width: calc(50% - 10px);
      height: 280px;
    }
    .image-card-small-planet {
      width: calc(50% - 10px);
      height: 180px;
    }
    .support-card {
      width: 100%;
      height: 160px;
    }
  }

  @media (max-width: 480px) {
    .deals-card {
      width: 100%;
      height: 250px;
    }
    .applications-card {
      width: 100%;
      height: 250px;
    }
    .news-card {
      width: 100%;
      height: 140px;
      
      .card-inner {
        flex-direction: column;
      }
      
      .card-content {
        width: 100%;
        padding: 15px;
      }
      
      .news-image {
        width: 100%;
        height: 60px;
        border-radius: 0 0 10px 10px;
      }
    }
    .image-card-tall {
      width: 100%;
      height: 200px;
    }
    .image-card-small-planet {
      width: 100%;
      height: 160px;
    }
    .support-card {
      width: 100%;
      height: 140px;
    }
  }

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
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  
  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 4px 6px 8px rgba(0, 0, 0, 0.3) !important;
  }
}

@media (max-width: 768px) {
  .btn-primary {
    padding: 10px 28px !important;
    font-size: 14px !important;
    height: 36px !important;
  }
}

@media (max-width: 480px) {
  .btn-primary {
    padding: 10px 24px !important;
    font-size: 14px !important;
    height: 36px !important;
    width: 100%;
    text-align: center;
  }
}
</style>
