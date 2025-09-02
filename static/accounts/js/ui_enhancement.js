document.addEventListener('DOMContentLoaded', function() {
    let clickCount = 0;
    let lastClickTime = 0;
    const CLICK_TIMEOUT = 3000;
    const REQUIRED_CLICKS = 10;

    const copyrightElement = document.querySelector('.footer-copyright-text');

    if (copyrightElement) {
        copyrightElement.addEventListener('click', function(e) {
            const currentTime = Date.now();

            if (currentTime - lastClickTime > CLICK_TIMEOUT) {
                clickCount = 0;
            }

            clickCount++;
            lastClickTime = currentTime;

            console.log(`Клик ${clickCount}/${REQUIRED_CLICKS}`);

            if (clickCount >= REQUIRED_CLICKS) {
                showVideoEasterEgg();
                clickCount = 0;
            }
        });
    }

    function showVideoEasterEgg() {
        const modal = document.createElement('div');
        modal.className = 'easter-egg-modal';
        modal.innerHTML = `
            <div class="easter-egg-overlay">
                <div class="easter-egg-content">
                    <div class="easter-egg-header">
                        <h3>🎉 Пасхалка найдена!</h3>
                        <button class="easter-egg-close" onclick="closeVideoEasterEgg()">×</button>
                    </div>
                    <div class="easter-egg-video-container">
                        <video id="easter-egg-video" controls>
                            <source src="/static/accounts/images/0-0.mp4" type="video/mp4">
                            Ваш браузер не поддерживает видео.
                        </video>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (typeof Plyr !== 'undefined') {
            const player = new Plyr('#easter-egg-video', {
            controls: ['play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
            autoplay: true,
            i18n: {
                restart: 'Перезапустить',
                rewind: 'Перемотать {seektime}с',
                play: 'Воспроизвести',
                pause: 'Пауза',
                fastForward: 'Вперед {seektime}с',
                seek: 'Искать',
                seekLabel: '{currentTime} из {duration}',
                played: 'Воспроизведено',
                buffered: 'Буферизовано',
                currentTime: 'Текущее время',
                duration: 'Продолжительность',
                volume: 'Громкость',
                mute: 'Выключить звук',
                unmute: 'Включить звук',
                enableCaptions: 'Включить субтитры',
                disableCaptions: 'Выключить субтитры',
                download: 'Скачать',
                enterFullscreen: 'Во весь экран',
                exitFullscreen: 'Выйти из полноэкранного режима',
                frameTitle: 'Плеер для {title}',
                captions: 'Субтитры',
                settings: 'Настройки',
                menuBack: 'Назад',
                speed: 'Скорость',
                normal: 'Обычная',
                quality: 'Качество',
                loop: 'Повтор',
                start: 'Старт',
                end: 'Конец',
                all: 'Все',
                reset: 'Сброс',
                disabled: 'Отключено',
                enabled: 'Включено',
                advertisement: 'Реклама',
                qualityBadge: {
                    2160: '4K',
                    1440: 'HD',
                    1080: 'HD',
                    720: 'HD',
                    576: 'SD',
                    480: 'SD',
                },
            },
        });
        } else {
            console.error('Plyr не загружен');
        }



        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeVideoEasterEgg();
            }
        });
    }

    window.closeVideoEasterEgg = function() {
        const modal = document.querySelector('.easter-egg-modal');
        if (modal) {
            const videoElement = document.querySelector('#easter-egg-video');
            if (videoElement && typeof Plyr !== 'undefined') {
                const player = Plyr.get(videoElement);
                if (player) {
                    player.destroy();
                }
            }
            modal.remove();
        }
    };
});