<template>
  <div class="moderator-page">
    <h1>{{ title }}</h1>
    <p>Эта страница создана с использованием Vue.js и Vite!</p>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      title: 'Панель управления модератора'
    }
  }
}
</script>

<style lang="scss" scoped>
.moderator-page {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;

  h1 {
    color: #343a40;
    font-family: 'Inter', sans-serif;
  }
}
</style> 