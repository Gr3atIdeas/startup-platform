<template>
  <div class="custom-scrollbar-container">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'CustomScrollbar',
};
</script>

<style lang="scss">
.custom-scrollbar-container {
  width: 100%;
  height: 100vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #061e38;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #004E9F;
    border-radius: 5px;
    border: 2px solid #061e38;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #C6BBFE;
  }
}
</style> 