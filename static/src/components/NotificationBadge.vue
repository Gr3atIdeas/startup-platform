<template>
  <div v-if="count > 0" class="notification-badge">
    {{ count }}
  </div>
</template>

<script>
export default {
  name: 'NotificationBadge',
  props: {
    count: {
      type: Number,
      default: 0,
    },
  },
}
</script>

<style lang="scss" scoped>
.notification-badge {
  position: absolute;
  top: -15px;
  right: -15px;
  background: #ff1b1b;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 400;
  color: white;
}
</style>
