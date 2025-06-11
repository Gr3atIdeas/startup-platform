<template>
  <div class="moderator-main-page">
    <!-- Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Deals Card -->
      <div class="card deals-card">
        <img src="/static/accounts/images/main_page_moderator/hands_upper_block.webp" class="card-bg mirrored" alt="Сделки на покупку">
        <div class="card-overlay"></div>
        <div class="card-content">
          <h3>Сделки на покупку/продажу</h3>
          <button class="btn-primary">Перейти</button>
        </div>
        <div class="notification-badge" style="top: -10px; right: -10px;">1</div>
      </div>

      <!-- Applications Card -->
      <div class="card applications-card">
        <img src="/static/accounts/images/main_page_moderator/planets_upperblock.webp" class="card-bg" alt="Заявки на новые стартапы">
        <div class="card-overlay dark"></div>
        <div class="card-content left-align">
          <h3>Заявки на новые стартапы</h3>
          <button class="btn-primary">Перейти</button>
        </div>
        <div class="notification-badge" style="top: -10px; right: -10px;">2</div>
      </div>
      
      <!-- Planet Image Card -->
      <div class="card image-card-tall">
         <img src="/static/accounts/images/main_page_moderator/planet_upperblock.webp" class="card-bg" alt="Planet">
      </div>

      <!-- News Card -->
      <div class="card news-card">
        <img src="/static/accounts/images/main_page_moderator/sound_upperblock.webp" class="card-bg" alt="Новости">
        <div class="card-overlay dark"></div>
        <div class="card-content left-align">
          <h3>Новости</h3>
          <button class="btn-primary">Перейти</button>
        </div>
        <div class="notification-badge" style="top: -10px; right: -10px;">4</div>
      </div>
      
      <!-- Rocket Image Card -->
      <div class="card image-card-square">
        <img src="/static/accounts/images/main_page_moderator/rocket_upperblock.webp" class="card-bg" alt="Rocket">
      </div>

      <!-- Support Card -->
      <div class="card support-card">
        <img src="/static/accounts/images/main_page_moderator/bg_block_support.webp" class="card-bg" alt="Поддержка">
        <div class="card-overlay dark"></div>
        <div class="card-content left-align">
          <h3>Поддержка</h3>
          <button class="btn-primary">Перейти</button>
        </div>
        <div class="notification-badge" style="top: -10px; right: -10px;">3</div>
      </div>
    </div>

    <!-- Carousel Section -->
    <div class="carousel-section">
      <div class="carousel-title-container">
        <h2 class="chat-title">Чат</h2>
        <h2 class="chat-title-highlight">СТАРТАПОВ</h2>
      </div>
      <div class="carousel-container-wrapper">
        <div class="carousel-container">
          <div class="carousel-card" v-for="i in 3" :key="i">
            <img src="/static/accounts/images/main_page_moderator/bg_carusel_card.webp" class="carousel-bg" alt="Card Background">
            <img src="/static/accounts/images/main_page_moderator/planet_logo_carusel.webp" class="carousel-avatar" alt="Avatar">
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
                    <p>User 67346 понравился комментарий</p>
                </div>
                <div class="actions">
                    <button class="btn-primary">К стартапу</button>
                    <button class="btn-chat">
                        <!-- Chat Icon Placeholder -->
                        <span>Чат</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModeratorMainPage',
}
</script>

<style lang="scss" scoped>
.moderator-main-page {
  width: 100%;
  padding: 20px;
  background: linear-gradient(153deg, black 0%, #00346B 25%, #004E9F 48%, #01366D 64%, #020202 100%);
  color: white;
  font-family: 'Unbounded', sans-serif;
}

.dashboard-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  max-width: 1303px;
  margin: 0 auto 45px auto;
}

.card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.25);
  background: linear-gradient(180deg, #004E9F 0%, black 100%);

  h3 {
    font-size: 20px;
    font-weight: 400;
    line-height: 1.2;
    margin-bottom: 20px;
  }
}

.card-bg {
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
  bottom: 0;
  left: 0;
  width: 100%;
  height: 55%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.55) 100%);
  filter: blur(27.5px);
  z-index: 2;

  &.dark {
    background: linear-gradient(270deg, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0.30) 100%);
  }
}

.card-content {
  position: relative;
  z-index: 3;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  text-align: center;
  height: 100%;

  &.left-align {
    align-items: flex-start;
    text-align: left;
  }
}

.btn-primary {
  padding: 12px 35px;
  background: linear-gradient(180deg, #FFEF2B 0%, #F9F7D6 100%);
  box-shadow: 2px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  color: black;
  font-size: 16px;
  font-family: 'Unbounded', sans-serif;
  font-weight: 400;
  border: none;
  cursor: pointer;
}

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
    z-index: 4;
    border: 2px solid #0F0F2D;
}


/* Card specific sizes */
.deals-card { width: 389px; height: 346px; }
.applications-card { width: 620px; height: 346px; }
.image-card-tall { width: 191px; height: 346px; box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.20); background: none;}
.image-card-square { width: 180px; height: 180px; box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.20); background: none;}
.news-card { width: 730px; height: 180px; }
.support-card { width: 290px; height: 180px; }


/* Carousel Section */
.carousel-section {
    max-width: 1303px;
    margin: 0 auto;
}
.carousel-title-container {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}
.chat-title {
    font-family: 'Blippo-Black CY [Rus by me]', sans-serif;
    font-size: 55px;
    font-weight: 400;
    color: white;
}
.chat-title-highlight {
    font-family: 'Blippo-Black CY [Rus by me]', sans-serif;
    font-size: 55px;
    font-weight: 400;
    color: #FFEF2B;
}

.carousel-container-wrapper {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 32px;
  backdrop-filter: blur(10px);
  padding: 45px;
  overflow-x: auto;
}

.carousel-container {
  display: flex;
  gap: 39px;
}

.carousel-card {
  flex: 0 0 801px;
  height: 609px;
  position: relative;
  background: linear-gradient(180deg, #004E9F 0%, black 100%);
  box-shadow: 6px 6px 10px rgba(123, 97, 255, 0.25);
  border-radius: 10px;
  outline: 1px #C6BBFE solid;
  overflow: hidden;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.carousel-bg {
    position: absolute;
    top:0;
    left:0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
}
.carousel-avatar {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 363px;
    height: 373px;
    z-index: 2;
}

.carousel-card-header, .carousel-card-footer {
    position: relative;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.carousel-card-header {
    align-items: flex-start;
}
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
        color: #FFEF2B;
        font-size: 16px;
        font-weight: 400;
        display: block;
    }
}

.carousel-card-footer {
    align-items: flex-end;
}
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
    align-items: center;
    gap: 15px;
}
.btn-chat {
    background: white;
    color: black;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 300;
}

</style> 