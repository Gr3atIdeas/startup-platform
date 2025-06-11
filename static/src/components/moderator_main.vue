<template>
  <div class="moderator-main-page">
    <div class="main-content">
      <section class="dashboard">
        <div class="dashboard__grid">
          <DashboardCard 
            title="Сделки на покупку/продажу" 
            grid-area="deals"
            :centered="true"
            style="min-height: 346px"
          />
          <DashboardCard 
            title="Заявки на новые стартап" 
            :notification-count="2" 
            grid-area="applications"
            style="min-height: 346px"
          />
          <DashboardCard 
            type="image"
            img-src="https://placehold.co/191x346"
            grid-area="p-small"
            style="min-height: 346px"
          />
          <DashboardCard 
            title="Новости" 
            :notification-count="4" 
            grid-area="news"
          />
          <DashboardCard 
            type="image"
            img-src="https://placehold.co/180x180"
            grid-area="p-square"
          />
          <DashboardCard 
            title="Поддержка" 
            :notification-count="3" 
            grid-area="support"
          />
        </div>
      </section>

      <section class="startups-chat">
        <div class="startups-chat__header">
          <h2>Чат</h2>
          <h2 class="text-yellow">СТАРТАПОВ</h2>
        </div>
        <div class="carousel-container">
          <div class="carousel">
            <div class="carousel-card" v-for="i in 3" :key="i">
              <div class="carousel-card__header">
                <span class="startup-name">Ромашка</span>
                <div class="investment-info">
                  <span>Вы инвестировали</span>
                  <span class="amount">3 675 998 ₽</span>
                </div>
              </div>
              <img class="carousel-card__main-img" src="https://placehold.co/363x373" alt="startup image">
              <div class="carousel-card__footer">
                <div class="updates">
                  <p>User 67346 инвестировал 7 899 ₽</p>
                  <p>User 67346 понравился комментарий user 74839</p>
                </div>
                <div class="actions">
                    <button class="btn btn--primary">К стартапу</button>
                    <button class="btn-icon">
                        <span class="icon-placeholder"></span>
                        <span>Чат</span>
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import DashboardCard from './DashboardCard.vue';

export default {
  name: 'ModeratorMainPage',
  components: {
    DashboardCard
  }
}
</script>

<style lang="scss" scoped>
// Fonts and basic styles
body {
  font-family: 'Unbounded', sans-serif;
}

.moderator-main-page {
  background: linear-gradient(153deg, black 0%, #00346B 25%, #004E9F 48%, #01366D 64%, #020202 100%);
  color: white;
  padding: 20px;
  min-height: 100vh;
}

.main-content {
  max-width: 1303px;
  margin: 0 auto;
}

.btn {
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 16px;
  padding: 12px 35px;
  box-shadow: 2px 4px 4px rgba(0, 0, 0, 0.25);

  &--primary {
    background: linear-gradient(180deg, #FFEF2B 0%, #F9F7D6 100%);
    color: black;
  }
}

.dashboard {
  padding-top: 45px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 30px;
    
    grid-template-areas:
      "deals deals applications applications applications p-small"
      "news news news news p-square support";
  }
}

.startups-chat {
  padding-top: 45px;

  &__header {
    display: flex;
    gap: 15px;
    margin-left: 71px;
    h2 {
      font-family: 'Blippo-Black CY [Rus by me]', sans-serif;
      font-size: 55px;
      font-weight: 400;
      line-height: 1.2;
    }
    .text-yellow {
      color: #FFEF2B;
    }
  }
}

.carousel-container {
    padding: 10px 0 45px 0;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    &::-webkit-scrollbar { /* WebKit */
        width: 0;
        height: 0;
    }
}

.carousel {
  display: flex;
  gap: 39px;
  padding: 45px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 32px;
  backdrop-filter: blur(10px);
}

.carousel-card {
  flex: 0 0 801px;
  height: 609px;
  background: linear-gradient(180deg, #004E9F 0%, black 100%);
  box-shadow: 6px 6px 10px rgba(123, 97, 255, 0.25);
  border-radius: 10px;
  outline: 1px solid #C6BBFE;
  position: relative;
  overflow: hidden;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &__main-img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 363px;
      height: 373px;
  }

  &__header {
      display: flex;
      justify-content: space-between;
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
              color: #FFEF2B;
              font-size: 16px;
              font-weight: 400;
              display: block;
          }
      }
  }
  
  &__footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      z-index: 2;

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
          align-items: flex-end;
          gap: 15px;

          .btn-icon {
              background: white;
              color: black;
              width: 68px;
              height: 68px;
              border-radius: 50%;
              border: none;
              cursor: pointer;
              font-size: 14px;
              font-weight: 300;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;

              .icon-placeholder {
                  width: 24px;
                  height: 24px;
                  border: 1px solid black; // Placeholder for icon
              }
          }
      }
  }
}
</style> 