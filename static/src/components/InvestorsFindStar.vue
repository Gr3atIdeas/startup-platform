<template>
  <div class="featured4">
    <div class="frame-parent3">
      <div class="parent6">
        <div class="div23">
          <span class="txt">
            <span>Инвесторы, </span>
            <span class="span3">найдите свою звезду!</span>
          </span>
        </div>
        <div class="group-parent">
          <div class="group-div">
            <div class="card-icon-container">
              <img class="card-icon" src="/static/accounts/images/main_page/planet_4th_main.webp" alt="Доступ к проверенным стартапам">
            </div>
            <div class="wrapper">
              <div class="div24">Доступ к проверенным стартапам</div>
            </div>
          </div>
          <div class="group-div">
            <div class="card-icon-container">
              <img class="card-icon" src="/static/accounts/images/main_page/case_main_4th.webp" alt="Диверсификация портфеля">
            </div>
            <div class="wrapper">
              <div class="div25">Диверсификация портфеля</div>
            </div>
          </div>
          <div class="frame-parent5 group-div">
            <div class="card-icon-container">
              <img class="card-icon" src="/static/accounts/images/main_page/rocket_main_4th.webp" alt="Удобная аналитика">
            </div>
            <div class="wrapper1">
              <div class="div26">Удобная аналитика и фильтры для выбора проектов</div>
            </div>
          </div>
        </div>
        <a href="#" class="btn btn--yellow-gradient">
          <span>Посмотреть стартапы</span>
          <img class="icon" alt="Eye" src="/static/accounts/images/main_page/button_eye.svg">
        </a>
      </div>
      <img class="icon10" alt="Инвесторы находят звезду" src="/static/accounts/images/main_page/4th_block_main_background.webp">
    </div>
  </div>
</template>

<script setup>
// No script needed for this component yet
</script>

<style>
/* --- Секция 4: Featured4 (Инвесторы) --- */
/* Стили скопированы 1 в 1 из main_temp.css и не являются scoped */

.btn {
    display: inline-flex;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.btn--yellow-gradient, .btn--yellow-gradient:visited {
    background: linear-gradient(180deg, #FFEF2B 0%, #F9F7D6 100%) !important;
    border: none !important;
    color: #000000 !important;
}

.btn--yellow-gradient span {
    color: #000000 !important;
}

.btn--yellow-gradient .icon {
    filter: brightness(0) invert(0);
}

.featured4 {
    width: 100%;
    max-width: 1445px;
    height: 521px; /* Фиксированная высота как в макете */
    position: relative;
    overflow: hidden;
    display: flex; /* Для центрирования .frame-parent3 */
    justify-content: center;
    align-items: center;
    padding: 0 20px; /* Горизонтальные отступы */
    box-sizing: border-box;
    background: white; /* Фон секции */
    border-radius: 10px;
    margin-left: auto;
    margin-right: auto;
}

.featured4 .frame-parent3 {
    width: 100%;
    max-width: 1303px; /* Максимальная ширина внутреннего контейнера */
    height: 100%;
    position: relative;
    display: flex; /* Располагаем текст и картинку рядом */
    justify-content: flex-start; /* Начинаем с левого края */
    align-items: center;
    z-index: 1; /* Чтобы быть над возможными псевдоэлементами */
}


.featured4 .parent6 { /* Левый блок с текстом */
    flex-basis: 45%; /* Занимает 45% ширины */
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* Элементы прижаты к левому краю */
    gap: 30px;
    z-index: 2; /* Поверх фоновой картинки */
    padding-left: 100px; /* Отступ слева */
    box-sizing: border-box;
}

.featured4 .parent6 .div23 {
    width: 100%; /* Занимает всю ширину родителя */
}

.featured4 .parent6 .div23 .txt {
    font-family: 'Unbounded', sans-serif;
    font-weight: 600;
    font-size: 35px;
    line-height: 1.1;
    word-wrap: break-word;
}
.featured4 .parent6 .div23 .txt > span:first-child { 
    color: #004E9F;
}
.featured4 .parent6 .div23 .txt .span3 { 
    color: #000000;
}

.featured4 .group-parent { 
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* Карточки начинаются слева */
    gap: 15px;
}

.featured4 .group-div {
    width: 100%; /* Карточка занимает всю ширину родителя (.parent6) */
    max-width: 375px; /* Но не более */
    background: #F2F2F2;
    border-radius: 10px;
    display: flex;
    align-items: center;
    padding: 10px;
    gap: 15px;
    box-sizing: border-box;
}

.featured4 .group-div .card-icon-container {
    flex-shrink: 0;
    width: 125px; /* Фиксированная ширина контейнера иконки */
    height: 96px;
    overflow: hidden;
}

.featured4 .group-div .card-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
}


.featured4 .div24, 
.featured4 .div25,
.featured4 .div26 {
    color: #000;
    font-size: 14px;
    font-family: 'Unbounded', sans-serif;
    font-weight: 400;
    line-height: 1.3;
}
.featured4 .wrapper,
.featured4 .wrapper1 {
    flex-grow: 1; /* Текст занимает оставшееся место */
}


.featured4 .btn { /* Стили для кнопки в этой секции */
    margin-top: 15px;
}


.featured4 .icon10 { /* Фоновое изображение инвесторов */
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: auto;
    max-width: 55%; /* Занимает правую часть */
    object-fit: cover; /* cover, чтобы заполнить пространство */
    z-index: 1;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}
</style> 