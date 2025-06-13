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
/* General button styles that might be needed */
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
    background: linear-gradient(180deg, #FFEF2B 0%, #F9F7D6 100%);
    border: none;
    color: #000000;
}

.btn--yellow-gradient span {
    color: #000000;
}

.btn--yellow-gradient .icon {
    filter: brightness(0) invert(0);
}


/* Styles for featured4 */
.featured4 {
    width: 100%;
    max-width: 1445px;
    height: auto;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 20px;
    box-sizing: border-box;
    background-color: white; /* Changed from transparent to match investor page style */
    margin-left: auto;
    margin-right: auto;
    border-radius: 10px; /* Added for consistency */
}

.featured4 .frame-parent3 {
    width: 100%;
    max-width: 1303px;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    z-index: 1;
}

.featured4 .parent6 {
    flex: 1;
    max-width: 50%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 30px;
    z-index: 2;
}

.featured4 .parent6 .div23 .txt > span:first-child {
    color: #004E9F;
    font-size: 35px;
    font-family: 'Unbounded', sans-serif;
    font-weight: 600;
    line-height: 35px;
    word-wrap: break-word;
}
.featured4 .parent6 .div23 .txt .span3 {
    color: black;
    font-size: 35px;
    font-family: 'Unbounded', sans-serif;
    font-weight: 600;
    line-height: 35px;
    word-wrap: break-word;
}

.featured4 .group-parent {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    width: 100%;
}

.featured4 .group-div {
    width: 100%;
    max-width: 480px;
    padding: 20px;
    background: linear-gradient(180deg, #004E9F 0%, #001C39 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 20px;
    transition: transform 0.3s ease;
}

.featured4 .group-div:hover {
    transform: translateY(-5px);
}

.featured4 .group-div .card-icon-container {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    overflow: hidden;
    border-radius: 8px;
}

.featured4 .group-div .card-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.featured4 .div24,
.featured4 .div25,
.featured4 .div26 {
    color: white;
    font-size: 16px;
    font-family: 'Unbounded', sans-serif;
    font-weight: 400;
    line-height: 1.4;
}

.featured4 .btn {
    text-decoration: none;
}

.featured4 .btn .icon {
    width: 24px;
    height: 24px;
}

.featured4 .icon10 {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: auto;
    max-width: 50%;
    height: 100%;
    object-fit: contain;
    z-index: 0;
    opacity: 0.9;
}
</style> 