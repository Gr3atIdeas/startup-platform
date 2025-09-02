<template>
  <div class="card" :style="{ gridArea: gridArea }">
    <template v-if="type === 'content'">
      <div
        class="card__content"
        :class="{ 'card__content--centered': centered }"
      >
        <h3>{{ title }}</h3>
        <button class="btn btn--primary">Перейти</button>
      </div>
      <NotificationBadge :count="notificationCount" />
    </template>
    <template v-if="type === 'image'">
      <img :src="imgSrc" alt="placeholder" />
    </template>
  </div>
</template>

<script>
import NotificationBadge from './NotificationBadge.vue'

export default {
  name: 'DashboardCard',
  components: {
    NotificationBadge,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
    notificationCount: {
      type: Number,
      default: 0,
    },
    gridArea: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'content',
    },
    imgSrc: {
      type: String,
      default: '',
    },
    centered: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" scoped>
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
    background: linear-gradient(180deg, #ffef2b 0%, #f9f7d6 100%);
    color: black;
  }
}

.card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.25);
  background: linear-gradient(180deg, #004e9f 0%, black 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  min-height: 180px;

  &__content {
    z-index: 2;
    h3 {
      font-size: 20px;
      font-weight: 400;
      line-height: 18px;
      margin-bottom: 20px;
      color: white;
    }
    &--centered {
      text-align: center;
      align-items: center;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.7) 100%
    );
    z-index: 1;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card--deals,
.card--applications {
  min-height: 346px;
}
</style>
