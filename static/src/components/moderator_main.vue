<template>
  <div class="moderator-main-page">
    <div class="grid-container">
      <!-- Top Row -->
      <div class="grid-item large-item">
        <img src="/static/accounts/images/main_page_moderator/hands_upper_block.webp" alt="Сделки на покупку" class="background-image mirrored">
        <div class="overlay-text">Сделки на покупку</div>
        <div class="notification-badge">3</div>
      </div>
      <div class="grid-item large-item">
        <img src="/static/accounts/images/main_page_moderator/planets_upperblock.webp" alt="Заявки на новые стартапы" class="background-image">
        <div class="overlay-text">Заявки на новые стартапы</div>
        <div class="notification-badge">8</div>
      </div>

      <!-- Middle Row -->
      <div class="grid-item small-item">
        <img src="/static/accounts/images/main_page_moderator/planet_upperblock.webp" alt="Planet" class="background-image">
      </div>
      <div class="grid-item medium-item">
        <img src="/static/accounts/images/main_page_moderator/sound_upperblock.webp" alt="Новости" class="background-image">
        <div class="overlay-text">Новости</div>
      </div>
      <div class="grid-item small-item">
        <img src="/static/accounts/images/main_page_moderator/rocket_upperblock.webp" alt="Rocket" class="background-image">
      </div>

      <!-- Bottom Row -->
      <div class="grid-item large-item">
          <img src="/static/accounts/images/main_page_moderator/bg_block_support.webp" alt="Поддержка" class="background-image">
          <div class="overlay-text">Поддержка</div>
          <button class="action-button">Перейти</button>
      </div>
      <div class="grid-item large-item">
          <!-- Placeholder for another block or can be merged -->
          <div class="overlay-text">Пользователи</div>
           <button class="action-button">Управление</button>
      </div>
    </div>

    <!-- Carousel Section -->
    <div class="carousel-container">
      <div class="carousel-card" v-for="i in 3" :key="i">
        <img src="/static/accounts/images/main_page_moderator/bg_carusel_card.webp" class="carousel-bg">
        <img src="/static/accounts/images/main_page_moderator/planet_logo_carusel.webp" class="carousel-avatar">
        <div class="carousel-title">Название стартапа {{ i }}</div>
        <div class="carousel-description">Краткое описание проекта в несколько строк.</div>
        <button class="action-button">Подробнее</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModeratorMainPage'
}
</script>

<style scoped>
/* General Page Styles */
.moderator-main-page {
  padding: 2rem;
  /* The global gradient background should be inherited, this is a fallback */
  background-color: #0F0F2D; 
  color: white;
  font-family: 'Gilroy', sans-serif;
}

/* Grid Layout */
.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto auto auto;
  gap: 20px;
  margin-bottom: 40px;
}

.grid-item {
  position: relative;
  border-radius: 15px;
  overflow: hidden;
  background-color: #1a1a3a;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  border-radius: 15px;
}

.mirrored {
  transform: scaleX(-1);
}

.overlay-text {
  position: relative;
  z-index: 2;
  font-size: 24px;
  font-weight: bold;
}

.notification-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: linear-gradient(to right, #FFEF2B, #F9F7D6);
    color: #1e1e1e;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    z-index: 3;
    border: 2px solid #1a1a3a;
}

/* Spanning items in the grid */
.large-item { grid-column: span 2; }
.medium-item { grid-column: span 2; }
.small-item { grid-column: span 1; }

/* Specific item adjustments based on new layout */
.grid-container .small-item:nth-child(3) { grid-column: 1 / 2; }
.grid-container .medium-item:nth-child(4) { grid-column: 2 / 4; }
.grid-container .small-item:nth-child(5) { grid-column: 4 / 5; }
.grid-container .large-item:nth-child(6) { grid-column: 1 / 3; }
.grid-container .large-item:nth-child(7) { grid-column: 3 / 5; }


/* Action Button */
.action-button {
  position: relative;
  z-index: 2;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(90deg, #FFEF2B 0%, #F9F7D6 100%);
  color: #333;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  align-self: flex-start; /* Align button to the start of the flex container */
  margin-top: auto; /* Push to the bottom */
}

.action-button:hover {
  transform: scale(1.05);
}

/* Carousel Styles */
.carousel-container {
  display: flex;
  gap: 20px;
  overflow-x: auto; /* Simple scroll for now */
  padding-bottom: 20px;
}

.carousel-card {
  position: relative;
  flex: 0 0 300px;
  height: 400px;
  border-radius: 15px;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.carousel-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.carousel-avatar {
  position: relative;
  z-index: 2;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 20px;
}

.carousel-title {
  position: relative;
  z-index: 2;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.carousel-description {
  position: relative;
  z-index: 2;
  font-size: 14px;
  margin-bottom: 20px;
}

.carousel-card .action-button {
  align-self: center;
  margin-top: auto;
}
</style> 