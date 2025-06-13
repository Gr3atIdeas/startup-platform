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

<style scoped>
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
    height: auto; /* Changed from fixed height */
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px; /* Adjusted padding */
    box-sizing: border-box;
    background-color: white;
    border-radius: 10px;
    margin: 0 auto; /* Center the component */
}

.featured4 .frame-parent3 {
    width: 100%;
    max-width: 1200px; /* Adjusted for better layout */
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
}

.featured4 .parent6 { /* Left block with text */
    flex-basis: 50%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 40px;
    z-index: 2;
    padding-right: 20px; /* Spacing from the image */
}

.featured4 .parent6 .div23 {
    font-family: 'Unbounded', sans-serif;
    font-size: 35px;
    font-weight: 600;
    line-height: 1.2;
}

.featured4 .parent6 .div23 .txt > span:first-child {
    color: #004E9F;
}

.featured4 .parent6 .div23 .txt .span3 {
    color: black;
}

.featured4 .group-parent {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
}

.featured4 .group-div {
    display: flex;
    align-items: center;
    background: linear-gradient(180deg, #004E9F 0%, #001C39 100%);
    border-radius: 10px;
    padding: 15px;
    gap: 15px;
    color: white;
    width: 100%;
    box-sizing: border-box;
}

.featured4 .group-div .card-icon-container {
    flex-shrink: 0;
}

.featured4 .group-div .card-icon {
    width: 100px; /* fixed size */
    height: 80px;
    object-fit: cover;
    border-radius: 5px;
}

.featured4 .div24,
.featured4 .div25,
.featured4 .div26 {
    font-family: 'Unbounded', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    font-weight: 400;
}

.featured4 .wrapper,
.featured4 .wrapper1 {
    display: flex;
    align-items: center;
}


.featured4 .btn {
    align-self: flex-start;
}


.featured4 .icon10 { /* Background image of investors */
    flex-basis: 50%;
    height: 450px; /* Adjust height as needed */
    object-fit: cover;
    border-radius: 10px;
    z-index: 1;
}
</style> 