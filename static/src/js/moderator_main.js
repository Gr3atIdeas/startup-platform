import { createApp } from 'vue'
import ModeratorMainPage from '../components/moderator_main.vue'
import '../scss/global.scss'

// Получаем данные карусели из Django
const carouselData = window.carouselData || []
console.log('Vue app carousel data:', carouselData)

createApp(ModeratorMainPage, {
  carouselData: carouselData
}).mount('#app')
