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
        <div class="notification-badge">1</div>
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
        <div class="notification-badge">2</div>
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
      <div class="card news-card">
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
        <div class="notification-badge">4</div>
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
        <div class="notification-badge">3</div>
      </div>
    </div>

    <Carousel />
  </div>
</template>

<script>
import Carousel from './Carousel.vue'

export default {
  name: 'ModeratorMainPage',
  components: {
    Carousel,
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

    .card {
    position: relative;
    border-radius: 10px;
    overflow: visible;
    background: linear-gradient(180deg, #004e9f 0%, black 100%);
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
      color: #fff;
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

  .notification-badge {
    position: absolute;
    width: 30px;
    height: 30px;
    background: #ff1b1b;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    font-weight: 400;
    z-index: 5;
    top: -8px;
    right: -8px;
    border: 2px solid #0f0f2d;
    color: #fff;
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
}
</style>
