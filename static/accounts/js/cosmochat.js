let currentChatId = null;
let currentProfileUserId = null;
let lastMessageTimestamp = null; 
let pollingInterval = null; 
let currentParticipants = []; 
let displayedMessageIds = new Set();
let isDragging = false;
let startX;
let scrollLeft;

const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

// Элементы DOM
const chatListContainer = document.getElementById('chatListContainer');
const chatWindowColumn = document.getElementById('chatWindowColumn');
const chatActiveHeader = document.getElementById('chatActiveHeader');
const chatWindowTitle = document.getElementById('chatWindowTitle');
const chatMessagesArea = document.getElementById('chatMessagesArea');
const noChatSelectedPlaceholder = document.getElementById('noChatSelectedPlaceholder');
const chatInputFieldArea = document.getElementById('chatInputFieldArea');
const messageFormNew = document.getElementById('messageFormNew');
const chatIdInput = document.getElementById('chatIdInput');
const messageTextInput = messageFormNew ? messageFormNew.querySelector('textarea[name="message_text"]') : null;

const profileModal = document.getElementById('profileModal');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const profileRating = document.getElementById('profileRating');
const profileBio = document.getElementById('profileBio');
const profileLink = document.getElementById('profileLink');

const addParticipantModal = document.getElementById('addParticipantModal');
const participantsList = document.getElementById('participantsList');
const addParticipantBtn = document.getElementById('addParticipantBtn'); // кнопка в шапке чата
const leaveChatBtn = document.getElementById('leaveChatBtn'); // кнопка в шапке чата

document.addEventListener('DOMContentLoaded', function() {
    if (messageFormNew) {
        messageFormNew.addEventListener('submit', handleSendMessage);
    }

    // Если при загрузке страницы есть параметр new_chat=true и open_chat_id, то это новый чат
    // и нужно добавить его в список и загрузить
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new_chat') === 'true' && urlParams.get('open_chat_id')) {
        const newChatId = urlParams.get('open_chat_id');
        // Попытаемся получить информацию о новом чате, чтобы добавить его в список
        // Это потребует дополнительной Django view или изменения существующей
        // Пока просто перезагрузим страницу без new_chat, чтобы он подгрузился стандартно, если уже есть
        // или будет добавлен через polling, если бэкенд его вернет в общем списке.
        // Для более чистого решения, нужна ручка для получения деталей одного чата по ID.
        // loadChat(newChatId); // Загружаем новый чат
        // window.history.replaceState({}, document.title, window.location.pathname + "?open_chat_id=" + newChatId);
        // Лучше перезагрузить список чатов, если возможно, или просто загрузить чат
    }

    // Показываем плейсхолдер, если чат не выбран
    if (!currentChatId) {
        showNoChatSelected();
    }

    // Инициализация отображения рейтинга для всех карточек пользователей
    const userCardsRatingContainers = document.querySelectorAll('.users-list-new .user-card-new .rating-stars-new');
    userCardsRatingContainers.forEach(container => {
        updateUserRatingDisplay(container);
    });

    // Инициализация выпадающего списка поиска
    setupSearchDropdown();
    
    // Обновление HTML-разметки для пагинации
    updatePaginationHTML();
});

function showNoChatSelected() {
    if(noChatSelectedPlaceholder) noChatSelectedPlaceholder.style.display = 'flex';
    if(chatActiveHeader) chatActiveHeader.style.display = 'none';
    if(chatMessagesArea) chatMessagesArea.innerHTML = ''; // Очищаем сообщения
    if(chatMessagesArea) chatMessagesArea.style.display = 'none'; 
    if(chatInputFieldArea) chatInputFieldArea.style.display = 'none';
}

function showActiveChatWindow() {
    if(noChatSelectedPlaceholder) noChatSelectedPlaceholder.style.display = 'none';
    if(chatActiveHeader) chatActiveHeader.style.display = 'flex';
    if(chatMessagesArea) chatMessagesArea.style.display = 'flex';
    if(chatInputFieldArea) chatInputFieldArea.style.display = 'flex';
}

function loadChat(chatId) {
    console.log("Загрузка чата:", chatId);
    currentChatId = chatId;
    if (chatIdInput) chatIdInput.value = chatId;

    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    displayedMessageIds.clear();

    document.querySelectorAll('.chat-item-new').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-chat-id') == chatId) {
            item.classList.add('active');
            if(chatWindowTitle) chatWindowTitle.textContent = item.dataset.chatName || "Чат";
        }
    });
    
    showActiveChatWindow();

    fetch(`/cosmochat/${chatId}/`, {
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if(chatMessagesArea) {
                chatMessagesArea.innerHTML = '';
                displayedMessageIds.clear();
            }
            data.messages.forEach(msg => appendMessage(msg, false)); 
            
            if(chatWindowTitle && data.chat_name) chatWindowTitle.textContent = data.chat_name;
            // Обновление информации об участниках в шапке (если нужно)
            // const participantsDiv = document.querySelector('.chat-participants'); // TODO: Куда выводить участников?
            // if (participantsDiv) participantsDiv.innerHTML = data.participants.map(p => `<span>${p.name} (${p.role})</span>`).join(', ');
            
            currentParticipants = data.participants || [];

            if (data.messages.length > 0) {
                lastMessageTimestamp = data.messages[data.messages.length - 1].created_at_iso;
            } else {
                lastMessageTimestamp = null;
            }
            if(chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

            fetch(`/cosmochat/mark-read/${chatId}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
            });

            startPolling();
        } else {
            alert(data.error || 'Ошибка при загрузке чата');
            showNoChatSelected();
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки чата:', error);
        alert('Произошла ошибка при загрузке чата.');
        showNoChatSelected();
    });
}

function handleSendMessage(e) {
    e.preventDefault();
    if (!currentChatId || !messageTextInput) {
        alert('Выберите чат и введите сообщение.');
        return;
    }
    const messageText = messageTextInput.value.trim();
    if (!messageText) return;

    const formData = new FormData();
    formData.append('chat_id', currentChatId);
    formData.append('message_text', messageText);

    fetch("/cosmochat/send-message/", { // Используем прямой URL, если он известен, или {% url 'send_message' %}
        method: 'POST',
        body: formData,
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            appendMessage(data.message, true); 
            updateChatListItem(data.message);
            lastMessageTimestamp = data.message.created_at_iso;
            if (messageFormNew) messageFormNew.reset();
            if (messageTextInput) messageTextInput.style.height = 'auto'; // Сброс высоты textarea
        } else {
            alert(data.error || 'Ошибка при отправке сообщения');
        }
    })
    .catch(error => {
        console.error('Ошибка отправки:', error);
        alert('Произошла ошибка при отправке сообщения.');
    });
}

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(() => {
        if (!currentChatId) return;

        const url = lastMessageTimestamp 
            ? `/cosmochat/${currentChatId}/?since=${encodeURIComponent(lastMessageTimestamp)}`
            : `/cosmochat/${currentChatId}/`;

        fetch(url, { headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' } })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const newMessages = data.messages;
                if (newMessages.length > 0) {
                    newMessages.forEach(msg => {
                        if (!displayedMessageIds.has(msg.message_id)) {
                            appendMessage(msg, false);
                        }
                    }); 
                    lastMessageTimestamp = newMessages[newMessages.length - 1].created_at_iso;
                    if(chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
                    updateChatListItem(newMessages[newMessages.length - 1]);
                    
                    fetch(`/cosmochat/mark-read/${currentChatId}/`, {
                        method: 'POST',
                        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
                    });
                }
            } else {
                console.error('Ошибка опроса:', data.error);
            }
        })
        .catch(error => {
            console.error('Ошибка при опросе новых сообщений:', error);
        });
    }, 5000);
}

function appendMessage(msg, isOwnMessageSentJustNow) {
    if (!chatMessagesArea || displayedMessageIds.has(msg.message_id)) {
        return; 
    }

    const messageDiv = document.createElement('div');
    const isOwn = msg.is_own || (isOwnMessageSentJustNow && msg.sender_id == window.REQUEST_USER_ID); // window.REQUEST_USER_ID нужно установить в Django шаблоне
    
    messageDiv.className = `message-bubble-new ${isOwn ? 'current-user-message' : 'other-user-message'} ${msg.is_system ? 'system-notification-message' : ''}`;
    messageDiv.dataset.messageId = msg.message_id;

    let senderNameHTML = '';
    if (!isOwn && msg.sender_name && !msg.is_system) {
        senderNameHTML = `<div class="message-sender-name">${msg.sender_name}</div>`;
    }

    messageDiv.innerHTML = `
        ${senderNameHTML}
        <div class="message-text-content">${msg.message_text}</div>
        <div class="message-meta-info">
            ${msg.created_at_time || msg.created_at} <!-- Предполагаем, что есть created_at_time -->
            ${isOwn && !msg.is_system ? `<span class="status-icon">${msg.is_read ? '✓✓' : '✓'}</span>` : ''}
        </div>
    `;
    chatMessagesArea.appendChild(messageDiv);
    displayedMessageIds.add(msg.message_id);
    
    if (isOwnMessageSentJustNow || chatMessagesArea.scrollHeight - chatMessagesArea.scrollTop < chatMessagesArea.clientHeight + 150) {
         chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
}

function updateChatListItem(lastMessage) {
    if (!currentChatId) return;
    const chatItem = chatListContainer ? chatListContainer.querySelector(`.chat-item-new[data-chat-id="${currentChatId}"]`) : null;
    if (chatItem) {
        const lastMessagePreview = chatItem.querySelector('.last-message-preview');
        const timestampChat = chatItem.querySelector('.timestamp-chat');
        const dateChatPreview = chatItem.querySelector('.date-chat-preview');
        const unreadBadge = chatItem.querySelector('.unread-badge-chat');

        if (lastMessagePreview) {
            let previewText = '';
            if (lastMessage.sender_id == window.REQUEST_USER_ID) { // window.REQUEST_USER_ID
                previewText = "Вы: ";
            }
            previewText += lastMessage.message_text;
            lastMessagePreview.textContent = previewText.substring(0, 30) + (previewText.length > 30 ? '...' : '');
        }
        if (timestampChat && lastMessage.created_at_time) {
            timestampChat.textContent = lastMessage.created_at_time;
        }
        if (dateChatPreview && lastMessage.created_at_date) {
            dateChatPreview.textContent = lastMessage.created_at_date;
        }

        if (unreadBadge) {
            // Логика для значка непрочитанных должна управляться сервером или при polling
            // Если сообщение только что отправлено нами, или прочитано, значок должен исчезнуть
            if (lastMessage.sender_id == window.REQUEST_USER_ID || lastMessage.is_read) {
                 //unreadBadge.style.display = 'none';
                 //unreadBadge.textContent = '0'; // Сервер должен присылать актуальный unread_count
            } else {
                // unreadBadge.style.display = 'inline-block';
                // unreadBadge.textContent = 'N'; // Сервер должен присылать актуальный unread_count
            }
        }
         // Переместить обновленный чат наверх списка
        if (chatListContainer && chatItem.parentElement === chatListContainer) {
            chatListContainer.prepend(chatItem);
        }
    }
}

// Функции для модальных окон (взяты из старого HTML, адаптированы)
function openProfileModal(userId) {
    currentProfileUserId = userId;
    fetch(`/profile/?user_id=${userId}`, { headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => response.json())
    .then(data => {
        if (!profileModal) return;
        const profilePictureUrl = data.profile_picture_url ? 
            (data.profile_picture_url.startsWith('/') ? data.profile_picture_url : `/${data.profile_picture_url}`) : 
            '/static/accounts/images/cosmochat/avatar_placeholder_general.png'; 
        
        if(profileAvatar) profileAvatar.src = profilePictureUrl;
        if(profileName) profileName.textContent = `${data.first_name} ${data.last_name}`;
        if(profileRole) profileRole.textContent = `Роль: ${data.role}`;
        if(profileRating) profileRating.textContent = `Рейтинг: ${data.rating || 'Нет рейтинга'}`;
        if(profileBio) profileBio.textContent = `О себе: ${data.bio || 'Нет информации'}`;
        if(profileLink) profileLink.href = `/profile/${userId}/`;
        profileModal.style.display = 'flex';
    })
    .catch(error => {
        console.error('Ошибка загрузки профиля:', error);
        alert('Произошла ошибка при загрузке профиля.');
    });
}

function closeProfileModal() {
    if(profileModal) profileModal.style.display = 'none';
    currentProfileUserId = null;
}

function startChat() { // Эта функция вызывается из МОДАЛЬНОГО ОКНА ПРОФИЛЯ
    if (!currentProfileUserId) {
        alert('Ошибка: пользователь не выбран');
        return;
    }
    // Вызываем startChatWithUser, которая уже содержит логику создания/открытия чата
    startChatWithUser(currentProfileUserId);
}

function openAddParticipantModal() {
    if (!currentChatId) {
        alert('Выберите чат для добавления участника');
        return;
    }
    if (currentParticipants.length >= 3) {
        alert('В чате уже максимальное количество участников (3)');
        return;
    }

    fetch(`/cosmochat/available-users-for-chat/${currentChatId}/`, { // Нужна новая ручка на бэкенде
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (!addParticipantModal || !participantsList) return;
        participantsList.innerHTML = '';
        
        const currentParticipantIds = currentParticipants.map(p => p.user_id);
        const currentRoles = currentParticipants.map(p => p.role.toLowerCase());
        // const allRoles = ['startuper', 'investor', 'moderator']; // Это лучше получать с сервера или определять иначе
        // const availableRoles = allRoles.filter(role => !currentRoles.includes(role));

        if (data.users && data.users.length > 0) {
            data.users.forEach(user => {
                // Не добавляем уже участвующих
                if (currentParticipantIds.includes(user.user_id)) return;

                // Проверка на уникальность ролей (если чат не групповой)
                // Эту логику лучше перенести на сервер или уточнить правила для групповых чатов
                let isDisabled = false;
                // if (currentParticipants.length < 2 && currentRoles.includes(user.role.toLowerCase())) {
                //     isDisabled = true; // Запрещаем, если такая роль уже есть и участников меньше 2 (т.е. это будет 2-й с такой же ролью)
                // }

                const item = document.createElement('div');
                item.className = `participant-item ${isDisabled ? 'disabled' : ''}`;
                item.innerHTML = `${user.name} (${user.role})`;
                if (!isDisabled) {
                    item.onclick = () => addParticipantToChat(user.user_id);
                }
                participantsList.appendChild(item);
            });
        } else {
            participantsList.innerHTML = '<p style="padding:10px; text-align:center;">Нет доступных пользователей для добавления или все уже в чате.</p>';
        }
        addParticipantModal.style.display = 'flex';
    })
    .catch(error => {
        console.error('Ошибка загрузки пользователей:', error);
        alert('Произошла ошибка при загрузке списка пользователей.');
    });
}

function closeAddParticipantModal() {
    if(addParticipantModal) addParticipantModal.style.display = 'none';
}

function addParticipantToChat(userId) {
    if (!currentChatId) return;

    fetch(`/cosmochat/add-participant/${currentChatId}/?user_id=${userId}`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Обновить список участников в UI (например, в шапке чата)
            // currentParticipants.push(data.new_participant);
            // loadChat(currentChatId); // Перезагрузить чат, чтобы обновить все данные
            alert('Участник добавлен! Информация обновится.');
            closeAddParticipantModal();
            loadChat(currentChatId); // Перезагружаем чат
        } else {
            alert(data.error || 'Ошибка при добавлении участника');
        }
    })
    .catch(error => {
        console.error('Ошибка добавления участника:', error);
        alert('Произошла ошибка при добавлении участника.');
    });
}

function leaveChat() {
    if (!currentChatId) {
        alert('Выберите чат');
        return;
    }
    if (!confirm('Вы уверены, что хотите покинуть/удалить этот чат?')) return;

    fetch(`/cosmochat/leave-chat/${currentChatId}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message || 'Вы покинули чат.');
            currentChatId = null;
            // Перезагрузить страницу или обновить список чатов
            location.reload(); 
        } else {
            alert(data.error || 'Ошибка при выходе из чата');
        }
    })
    .catch(error => {
        console.error('Ошибка выхода из чата:', error);
        alert('Произошла ошибка при выходе из чата.');
    });
}

// Вспомогательные функции для textarea (авто-изменение высоты)
if (messageTextInput) {
    messageTextInput.addEventListener('input', () => {
        messageTextInput.style.height = 'auto';
        messageTextInput.style.height = (messageTextInput.scrollHeight) + 'px';
    });
}

// Установить ID текущего пользователя (должно быть установлено в Django шаблоне)
// Пример: <script>window.REQUEST_USER_ID = {{ request.user.user_id }};</script> в конце base.html или в cosmochat.html
if (typeof window.REQUEST_USER_ID === 'undefined') {
     // Получаем user_id из data-атрибута на элементе body или другом видном месте
    const bodyUserId = document.body.dataset.userId;
    if (bodyUserId) {
        window.REQUEST_USER_ID = parseInt(bodyUserId);
    } else {
        console.warn('REQUEST_USER_ID не установлен. Некоторые функции чата могут работать некорректно.');
        // Попытка извлечь из скрытого поля, если оно есть для какой-либо формы на странице (менее надежно)
        const userIdField = document.querySelector('input[name="user_id_holder"]'); // Пример
        if (userIdField) window.REQUEST_USER_ID = parseInt(userIdField.value);
    }
}

// Функция для обновления отображения рейтинга планетами
function updateUserRatingDisplay(starsContainer) {
    if (!starsContainer) {
        // console.error("[updateUserRatingDisplay] Container not found for user card.");
        return;
    }
    const ratingString = starsContainer.dataset.rating;
    if (typeof ratingString === 'undefined') {
        // console.warn("[updateUserRatingDisplay] data-rating attribute not found on container:", starsContainer);
        return;
    }

    const iconContainers = starsContainer.querySelectorAll('.rating-icon-planet-container');
    const ratingValue = parseFloat(ratingString) || 0;
    const fullStars = Math.floor(ratingValue);
    const partialPercentage = (ratingValue - fullStars) * 100;

    iconContainers.forEach((container, index) => {
        const filledIcon = container.querySelector('.icon-filled');
        if (!filledIcon) {
            // console.warn(`[updateUserRatingDisplay] Filled icon not found in planet container ${index + 1}`);
            return; 
        }

        let fillWidth = '0%';
        if (index < fullStars) {
            fillWidth = '100%';
        } else if (index === fullStars && partialPercentage > 0) {
            fillWidth = `${partialPercentage}%`;
        }
        filledIcon.style.width = fillWidth;
    });
}

// Функция для фильтрации чатов
function filterChats(filter) {
    const chatItems = document.querySelectorAll('.chat-items-list-new .chat-item-new');
    chatItems.forEach(item => {
        const chatType = item.dataset.chatType || 'personal';
        
        if (filter === 'all') {
            item.style.display = 'flex';
        } else if (filter === 'chats' && chatType === 'personal') {
            item.style.display = 'flex';
        } else if (filter === 'groups' && chatType === 'group') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Функция для начала чата с пользователем
function startChatWithUser(userId) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/cosmochat/start-chat/${userId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.chat_id) {
            if (typeof loadChat === 'function') { 
                let chatExists = false;
                document.querySelectorAll('.chat-item-new').forEach(item => {
                    if(item.dataset.chatId == data.chat_id) {
                        chatExists = true;
                    }
                });
                if (chatExists) {
                     loadChat(data.chat_id);
                } else {
                    window.location.href = window.location.pathname + '?open_chat_id=' + data.chat_id + '&new_chat=true';
                }
                if (typeof closeProfileModal === 'function') closeProfileModal();
            } else {
                 window.location.href = window.location.pathname + '?open_chat_id=' + data.chat_id + '&new_chat=true';
            }
        } else {
            alert(data.error || 'Ошибка при создании или открытии чата');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при создании или открытии чата.');
    });
}

// Функции для модальных окон создания чата
function openCreateChatModal() {
    const modal = document.getElementById('createChatModal');
    if(modal) modal.style.display = 'flex';
}

function closeCreateChatModal() {
    const modal = document.getElementById('createChatModal');
    if(modal) modal.style.display = 'none';
}

// Функции для поиска и выпадающего списка
function setupSearchDropdown() {
    const searchInput = document.querySelector('.search-query-input');
    const searchDropdown = document.getElementById('searchDropdown');
    
    if (!searchInput || !searchDropdown) return;
    
    // Показать выпадающий список при фокусе на поле поиска
    searchInput.addEventListener('focus', function() {
        searchDropdown.style.display = 'block';
        loadDropdownData();
    });
    
    // Скрыть выпадающий список при клике вне его
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !searchDropdown.contains(event.target)) {
            searchDropdown.style.display = 'none';
        }
    });
    
    // Предотвращаем скрытие при клике внутри выпадающего списка
    searchDropdown.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Добавляем обработчики для кнопок "Очистить"
    const clearButtons = document.querySelectorAll('.search-dropdown-clear');
    clearButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            clearSearchSection(section);
        });
    });
    
    // Добавляем обработчики для горизонтального свайпа
    const userContainers = document.querySelectorAll('.search-dropdown-users');
    userContainers.forEach(container => {
        // Начало перетаскивания
        container.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        });
        
        // Прекращение перетаскивания
        container.addEventListener('mouseup', function() {
            isDragging = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mouseleave', function() {
            isDragging = false;
            container.style.cursor = 'grab';
        });
        
        // Перетаскивание
        container.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2; // Множитель для увеличения скорости прокрутки
            container.scrollLeft = scrollLeft - walk;
        });
        
        // Установка курсора для показа возможности перетаскивания
        container.style.cursor = 'grab';
    });
}

// Загрузка данных для выпадающего списка
function loadDropdownData() {
    // Загрузка недавних контактов
    fetch('/cosmochat/recent-contacts/', {
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateUserSection('recentUsers', data.users);
        }
    })
    .catch(error => console.error('Ошибка при загрузке недавних контактов:', error));
    
    // Загрузка инвесторов
    fetch('/cosmochat/users-by-role/?role=investor', {
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateUserSection('investorUsers', data.users);
        }
    })
    .catch(error => console.error('Ошибка при загрузке инвесторов:', error));
    
    // Загрузка стартаперов
    fetch('/cosmochat/users-by-role/?role=startuper', {
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateUserSection('startuperUsers', data.users);
        }
    })
    .catch(error => console.error('Ошибка при загрузке стартаперов:', error));
    
    // Если не удается получить данные с сервера, используем тестовые данные
    setTimeout(() => {
        const recentUsers = document.getElementById('recentUsers');
        const investorUsers = document.getElementById('investorUsers');
        const startuperUsers = document.getElementById('startuperUsers');
        
        if (recentUsers && recentUsers.childElementCount === 0) {
            populateUserSectionWithTestData('recentUsers');
        }
        if (investorUsers && investorUsers.childElementCount === 0) {
            populateUserSectionWithTestData('investorUsers');
        }
        if (startuperUsers && startuperUsers.childElementCount === 0) {
            populateUserSectionWithTestData('startuperUsers');
        }
    }, 1000);
}

// Заполнение секции пользователями
function populateUserSection(sectionId, users) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    section.innerHTML = '';
    
    if (users && users.length > 0) {
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'search-dropdown-user';
            userItem.setAttribute('data-user-id', user.user_id);
            
            const defaultAvatarSrc = '/static/accounts/images/avatars/default_avatar_ufo.png';
            const avatarSrc = user.profile_picture_url || defaultAvatarSrc;
            
            userItem.innerHTML = `
                <img src="${avatarSrc}" alt="${user.first_name}">
                <div class="search-dropdown-user-name">${user.first_name}</div>
            `;
            
            userItem.addEventListener('click', function() {
                startChatWithUser(user.user_id);
            });
            
            section.appendChild(userItem);
        });
    } else {
        section.innerHTML = '<div class="search-dropdown-empty">Нет пользователей</div>';
    }
}

// Заполнение секции тестовыми данными (если API не работает)
function populateUserSectionWithTestData(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    section.innerHTML = '';
    
    const names = ['Виталий', 'Александр', 'Екатерина', 'Ольга', 'Михаил', 'Сергей'];
    const defaultAvatarSrc = '/static/accounts/images/avatars/default_avatar_ufo.png';
    
    for (let i = 0; i < 5; i++) {
        const userItem = document.createElement('div');
        userItem.className = 'search-dropdown-user';
        userItem.setAttribute('data-user-id', `test-${i}`);
        
        userItem.innerHTML = `
            <img src="${defaultAvatarSrc}" alt="${names[i]}">
            <div class="search-dropdown-user-name">${names[i]}</div>
        `;
        
        userItem.addEventListener('click', function() {
            alert(`Запуск чата с ${names[i]} (тестовый режим)`);
        });
        
        section.appendChild(userItem);
    }
}

// Очистка секции поиска
function clearSearchSection(section) {
    const sectionId = section === 'recent' ? 'recentUsers' : 
                      section === 'investors' ? 'investorUsers' : 
                      section === 'startupers' ? 'startuperUsers' : null;
    
    if (sectionId) {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            sectionElement.innerHTML = '<div class="search-dropdown-empty">Нет пользователей</div>';
        }
        
        // Также можно отправить запрос на сервер для очистки
        fetch(`/cosmochat/clear-search-section/?section=${section}`, {
            method: 'POST',
            headers: { 
                'X-CSRFToken': csrfToken, 
                'X-Requested-With': 'XMLHttpRequest' 
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`Секция ${section} очищена`);
            }
        })
        .catch(error => console.error(`Ошибка при очистке секции ${section}:`, error));
    }
}

// Обновление HTML-разметки для пагинации
function updatePaginationHTML() {
    const usersList = document.getElementById('usersList');
    const userCards = usersList ? usersList.querySelectorAll('.user-card-new') : [];
    const paginationContainer = document.getElementById('userPagination');
    
    if (!usersList || !paginationContainer || userCards.length === 0) return;
    
    const itemsPerPage = 8;
    const totalPages = Math.ceil(userCards.length / itemsPerPage);
    
    let paginationHTML = '';
    
    // Кнопка "Назад"
    paginationHTML += `<span class="page-number-item" data-page="prev">&lsaquo;</span>`;
    
    // Номера страниц
    if (totalPages <= 7) {
        // Показываем все страницы, если их <= 7
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<span class="page-number-item ${i === 1 ? 'current' : ''}" data-page="${i}">${i}</span>`;
        }
    } else {
        // Показываем 1, 2, 3, ..., last-2, last-1, last
        for (let i = 1; i <= 3; i++) {
            paginationHTML += `<span class="page-number-item ${i === 1 ? 'current' : ''}" data-page="${i}">${i}</span>`;
        }
        
        paginationHTML += `<span class="dots">...</span>`;
        
        for (let i = totalPages - 2; i <= totalPages; i++) {
            paginationHTML += `<span class="page-number-item" data-page="${i}">${i}</span>`;
        }
    }
    
    // Кнопка "Вперед"
    paginationHTML += `<span class="page-number-item" data-page="next">&rsaquo;</span>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Добавляем обработчики для кнопок пагинации
    const pageButtons = paginationContainer.querySelectorAll('.page-number-item');
    pageButtons.forEach(button => {
        if (button.classList.contains('dots')) return;
        
        button.addEventListener('click', function() {
            const page = this.dataset.page;
            
            if (page === 'prev') {
                if (currentPage > 1) {
                    currentPage--;
                    showPage(currentPage);
                    updateActivePage();
                }
            } else if (page === 'next') {
                if (currentPage < totalPages) {
                    currentPage++;
                    showPage(currentPage);
                    updateActivePage();
                }
            } else {
                currentPage = parseInt(page);
                showPage(currentPage);
                updateActivePage();
            }
        });
    });
}

// Инициализация при загрузке документа
document.addEventListener('DOMContentLoaded', function() {
    const userIdDataElement = document.getElementById('request_user_id_data');
    if (userIdDataElement) {
        try {
            window.REQUEST_USER_ID = JSON.parse(userIdDataElement.textContent);
        } catch (e) {
            console.error('Error parsing REQUEST_USER_ID:', e);
            window.REQUEST_USER_ID = 0; // Fallback
        }
    } else {
        window.REQUEST_USER_ID = 0; // Fallback if element not found
    }

    const urlParams = new URLSearchParams(window.location.search);
    const openChatId = urlParams.get('open_chat_id');

    if (openChatId) {
        if (typeof loadChat === 'function') loadChat(openChatId);
    } else {
        const firstChatEl = document.querySelector('.chat-item-new.active');
        if (firstChatEl && typeof currentChatId !== 'undefined' && !currentChatId && typeof loadChat === 'function') {
            // Не загружаем первый чат автоматически, если это не указано в URL
        } 
    }

    // Инициализация отображения рейтинга для всех карточек пользователей
    const userCardsRatingContainers = document.querySelectorAll('.users-list-new .user-card-new .rating-stars-new');
    userCardsRatingContainers.forEach(container => {
        if (typeof updateUserRatingDisplay === 'function') {
            updateUserRatingDisplay(container);
        }
    });

    // Обработчики для кнопок фильтрации чатов
    const chatFilterButtons = document.querySelectorAll('.chat-filters-new .filter-btn-new');
    chatFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            chatFilterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            if (typeof filterChats === 'function') filterChats(this.dataset.filter); 
        });
    });
    
    // Обработчик поиска по чатам
    const chatSearchInput = document.getElementById('chatSearchInput');
    if (chatSearchInput) {
        chatSearchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const chatItems = document.querySelectorAll('.chat-items-list-new .chat-item-new');
            chatItems.forEach(item => {
                const chatName = item.dataset.chatName ? item.dataset.chatName.toLowerCase() : '';
                if (chatName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    // Добавляем обработчики для карточек пользователей
    document.querySelectorAll('.user-card-new').forEach(card => {
        card.addEventListener('click', function() {
            const userId = this.dataset.userId;
            if (userId) openProfileModal(userId);
        });
    });
    
    // Обработчики для кнопок чата на карточках
    document.querySelectorAll('.chat-btn-on-card').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Предотвращаем всплытие события
            const userId = this.dataset.userId;
            if (userId) startChatWithUser(userId);
        });
    });
    
    // Обработчики для чатов в списке
    document.querySelectorAll('.chat-item-new').forEach(item => {
        item.addEventListener('click', function() {
            const chatId = this.dataset.chatId;
            if (chatId) loadChat(chatId);
        });
    });
    
    // Кнопки модальных окон
    const createChatBtn = document.getElementById('createChatBtn');
    if (createChatBtn) {
        createChatBtn.addEventListener('click', openCreateChatModal);
    }
    
    const closeCreateChatModalBtn = document.getElementById('closeCreateChatModalBtn');
    if (closeCreateChatModalBtn) {
        closeCreateChatModalBtn.addEventListener('click', closeCreateChatModal);
    }
    
    const createChatModalCloseBtn = document.getElementById('createChatModalCloseBtn');
    if (createChatModalCloseBtn) {
        createChatModalCloseBtn.addEventListener('click', closeCreateChatModal);
    }
    
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', closeProfileModal);
    }
    
    const startChatBtn = document.getElementById('startChatBtn');
    if (startChatBtn) {
        startChatBtn.addEventListener('click', startChat);
    }
    
    const addParticipantBtn = document.getElementById('addParticipantBtn');
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', openAddParticipantModal);
    }
    
    const closeAddParticipantModalBtn = document.getElementById('closeAddParticipantModalBtn');
    if (closeAddParticipantModalBtn) {
        closeAddParticipantModalBtn.addEventListener('click', closeAddParticipantModal);
    }
    
    const leaveChatBtn = document.getElementById('leaveChatBtn');
    if (leaveChatBtn) {
        leaveChatBtn.addEventListener('click', leaveChat);
    }

    // Обработчик для кнопки "Показать еще"
    const showMoreBtn = document.getElementById('showMoreUsersBtn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            showMoreUsers();
        });
    }

    // Инициализация выпадающего списка поиска
    setupSearchDropdown();
    
    // Обновление HTML-разметки для пагинации
    updatePaginationHTML();
});

// Функция для показа дополнительных пользователей
let additionalUsersShown = 0;
function showMoreUsers() {
    const usersList = document.getElementById('usersList');
    const hiddenUserCards = usersList ? usersList.querySelectorAll('.user-card-new.hidden-user') : [];
    const paginationContainer = document.getElementById('userPagination');
    const showMoreBtn = document.getElementById('showMoreUsersBtn');
    
    if (!usersList || hiddenUserCards.length === 0) {
        // Если больше нет скрытых пользователей, можно скрыть кнопку
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        return;
    }
    
    // Скрываем пагинацию с цифрами и меняем отображение кнопок
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
    
    // Если контейнер для кнопок еще не создан, создаем его
    let buttonsContainer = document.querySelector('.pagination-buttons-container');
    if (!buttonsContainer) {
        buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'pagination-buttons-container';
        const paginationNew = document.querySelector('.pagination-new');
        if (paginationNew) {
            paginationNew.appendChild(buttonsContainer);
        }
    }
    
    // Показываем кнопку "Скрыть", если её еще нет
    let hideBtn = document.getElementById('hideUsersBtn');
    if (!hideBtn) {
        hideBtn = document.createElement('button');
        hideBtn.id = 'hideUsersBtn';
        hideBtn.className = 'hide-btn-new';
        hideBtn.textContent = 'Скрыть';
        hideBtn.addEventListener('click', hideExtraUsers);
        buttonsContainer.appendChild(hideBtn);
    } else {
        hideBtn.style.display = 'flex';
    }
    
    // Перемещаем кнопку "Показать еще" в контейнер, если она еще не там
    if (showMoreBtn && showMoreBtn.parentElement !== buttonsContainer) {
        buttonsContainer.appendChild(showMoreBtn);
    }
    
    // Показываем следующие 5 скрытых карточек
    const showCount = Math.min(5, hiddenUserCards.length);
    for (let i = 0; i < showCount; i++) {
        hiddenUserCards[i].classList.remove('hidden-user');
        hiddenUserCards[i].classList.add('show-more-revealed');
        additionalUsersShown++;
    }
    
    // Если больше нет скрытых пользователей, скрываем кнопку "Показать еще"
    if (hiddenUserCards.length <= showCount) {
        if (showMoreBtn) showMoreBtn.style.display = 'none';
    }
}

// Функция для скрытия дополнительных пользователей и возврата к пагинации
function hideExtraUsers() {
    const usersList = document.getElementById('usersList');
    const paginationContainer = document.getElementById('userPagination');
    const buttonsContainer = document.querySelector('.pagination-buttons-container');
    const hideBtn = document.getElementById('hideUsersBtn');
    const showMoreBtn = document.getElementById('showMoreUsersBtn');
    
    // Возвращаем отображение пагинации с цифрами
    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
    }
    
    // Скрываем кнопку "Скрыть"
    if (hideBtn) {
        hideBtn.style.display = 'none';
    }
    
    // Возвращаем кнопку "Показать еще" в исходное положение
    if (showMoreBtn && buttonsContainer) {
        document.querySelector('.pagination-new').appendChild(showMoreBtn);
        showMoreBtn.style.display = 'flex';
    }
    
    // Скрываем все карточки, которые были показаны через "Показать еще"
    const revealedCards = usersList ? usersList.querySelectorAll('.user-card-new.show-more-revealed') : [];
    revealedCards.forEach(card => {
        card.classList.add('hidden-user');
        card.classList.remove('show-more-revealed');
    });
    
    // Сбрасываем счетчик показанных дополнительных пользователей
    additionalUsersShown = 0;
    
    // Восстанавливаем состояние текущей страницы
    const currentPageBtn = document.querySelector('.page-number-item.current');
    if (currentPageBtn) {
        const currentPage = parseInt(currentPageBtn.dataset.page);
        showPage(currentPage);
    }
}

// Функция для показа определенной страницы
function showPage(page) {
    const usersList = document.getElementById('usersList');
    const userCards = usersList ? usersList.querySelectorAll('.user-card-new') : [];
    const itemsPerPage = 8; // Изменили с 5 на 8
    
    if (!usersList || userCards.length === 0) return;
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    userCards.forEach((card, index) => {
        if (index >= startIndex && index < endIndex) {
            card.classList.remove('hidden-user');
        } else {
            // Если карточка уже была показана через "Показать еще", не скрываем её
            if (!card.classList.contains('show-more-revealed')) {
                card.classList.add('hidden-user');
            }
        }
    });
} 