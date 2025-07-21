let currentChatId = null
let currentProfileUserId = null
let lastMessageTimestamp = null
let pollingInterval = null
let currentParticipants = []
let displayedMessageIds = new Set()
let isDragging = false
let startX
let scrollLeft

// ---> НОВОЕ: Массив для хранения ID выбранных пользователей для группового чата
let selectedGroupChatUserIds = []

const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value

// Элементы DOM
const chatListContainer = document.getElementById('chatListContainer')
const chatWindowColumn = document.getElementById('chatWindowColumn')
const chatActiveHeader = document.getElementById('chatActiveHeader')
const chatWindowTitle = document.getElementById('chatWindowTitle')
const chatMessagesArea = document.getElementById('chatMessagesArea')
const noChatSelectedPlaceholder = document.getElementById('noChatSelectedPlaceholder')
const chatInputFieldArea = document.getElementById('chatInputFieldArea')
const messageFormNew = document.getElementById('messageFormNew')
const chatIdInput = document.getElementById('chatIdInput')
const messageTextInput = messageFormNew
  ? messageFormNew.querySelector('textarea[name="message_text"]')
  : null

const profileModal = document.getElementById('profileModal')
const profileAvatar = document.getElementById('profileAvatar')
const profileName = document.getElementById('profileName')
const profileRole = document.getElementById('profileRole')
const profileRating = document.getElementById('profileRating')
const profileBio = document.getElementById('profileBio')
const profileLink = document.getElementById('profileLink')

const addParticipantModal = document.getElementById('addParticipantModal')
const participantsList = document.getElementById('participantsList')
const addParticipantBtn = document.getElementById('addParticipantBtn') // кнопка в шапке чата
const leaveChatBtn = document.getElementById('leaveChatBtn') // кнопка в шапке чата

const groupChatModal = document.getElementById('groupChatModal')
const groupChatContentWrapper = document.getElementById('groupChatModalContentWrapper') // Вид 1
const groupChatDetailsView = document.getElementById('groupChatDetailsView') // Вид 2
const selectedUserPillsContainer = document.getElementById('selectedUserPillsContainer')
const groupChatSearchInput = document.getElementById('groupChatSearchInput')
const groupChatUsersList = document.getElementById('groupChatUsersList')
const selectedUsersCountElement = document.getElementById('selectedUsersCount')
const navigateToDetailsViewBtn = document.getElementById('navigateToDetailsViewBtn')
const groupChatGoBackBtn = document.getElementById('groupChatGoBackBtn')
const confirmGroupChatCreationBtn = document.getElementById('confirmGroupChatCreationBtn')
const groupChatNameInput = document.getElementById('groupChatNameInput')
const groupChatSelectedParticipantsList = document.getElementById('groupChatSelectedParticipantsList')
const groupChatAddMoreParticipantsBtn = document.getElementById('groupChatAddMoreParticipantsBtn')

document.addEventListener('DOMContentLoaded', function () {
    // Запускаем поллинг сразу при загрузке для начальной загрузки списка чатов
    startPolling();

    if (messageFormNew && !messageFormNew.dataset.eventListener) {
        messageFormNew.dataset.eventListener = 'true';
        messageFormNew.addEventListener('submit', handleSendMessage);
    }

    // Если при загрузке страницы есть параметр new_chat=true и open_chat_id, то это новый чат
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new_chat') === 'true' && urlParams.get('open_chat_id')) {
        const newChatId = urlParams.get('open_chat_id');
        loadChat(newChatId); // Загружаем новый чат сразу
    }

    // Показываем плейсхолдер, если чат не выбран
    if (!currentChatId) {
        showNoChatSelected();
    }

    // Инициализация отображения рейтинга для всех карточек пользователей
    const userCardsRatingContainers = document.querySelectorAll(
        '.users-list-new .user-card-new .rating-stars-new'
    );
    userCardsRatingContainers.forEach((container) => {
        updateUserRatingDisplay(container);
    });

    // Инициализация выпадающего списка поиска
    setupSearchDropdown();

    // Обновление HTML-разметки для пагинации
    updatePaginationHTML();

    // Объявляем переменные для кнопок один раз
    const startDealBtn = document.getElementById('startDealBtn');
    const leaveChatBtn = document.getElementById('leaveChatBtn');
    const renameChatBtn = document.getElementById('renameChatBtn');
    const participantsBtn = document.getElementById('participantsBtn');

    // Обработчик для кнопки "Начать сделку"
    if (startDealBtn && !startDealBtn.dataset.eventListener) {
        startDealBtn.dataset.eventListener = 'true';
        startDealBtn.addEventListener('click', function () {
            if (!currentChatId) {
                alert('Выберите чат для начала сделки');
                return;
            }
            const chatItem = document.querySelector(
                `.chat-item-new[data-chat-id="${currentChatId}"]`
            );
            if (
                !chatItem ||
                chatItem.dataset.chatType === 'group' ||
                chatItem.dataset.isDeal === 'true'
            ) {
                alert(
                    'Сделку можно начать только в личном чате, который ещё не помечен как сделка'
                );
                return;
            }
            startDealBtn.disabled = true;
            startDealBtn.textContent = 'Инициация сделки...';
            startDeal(currentChatId);
        });
    }

    // Обработчик для кнопки "Покинуть чат"
    if (leaveChatBtn && !leaveChatBtn.dataset.eventListener) {
        leaveChatBtn.dataset.eventListener = 'true';
        leaveChatBtn.addEventListener('click', function () {
            if (!currentChatId) {
                alert('Выберите чат');
                return;
            }
            if (!confirm('Вы уверены, что хотите покинуть/удалить этот чат?')) return;
            leaveChatBtn.disabled = true;
            leaveChatBtn.textContent = 'Выход...';
            leaveChat();
        });
    }

    // Обработчик для кнопки "Далее" в модальном окне группового чата
    if (navigateToDetailsViewBtn && !navigateToDetailsViewBtn.dataset.eventListener) {
        navigateToDetailsViewBtn.dataset.eventListener = 'true';
        navigateToDetailsViewBtn.addEventListener('click', function () {
            console.log('#navigateToDetailsViewBtn clicked');
            if (selectedGroupChatUserIds.length > 0) {
                console.log('Selected users:', selectedGroupChatUserIds);
                const groupChatUsersList = document.getElementById('groupChatUsersList');
                const groupChatNameInput = document.getElementById('groupChatNameInput');

                console.log('Calling renderSelectedParticipantsForDetailsView...');
                renderSelectedParticipantsForDetailsView(groupChatUsersList);
                if (groupChatNameInput && groupChatUsersList) {
                    const firstFewNames = selectedGroupChatUserIds
                        .map((userId) => {
                            const userDiv = groupChatUsersList.querySelector(
                                `.group-chat-modal-user[data-user-id="${userId}"] .group-chat-modal-user-firstname`
                            );
                            return userDiv ? userDiv.textContent : '';
                        })
                        .filter((name) => name)
                        .slice(0, 3)
                        .join(', ');
                    groupChatNameInput.value = firstFewNames || 'Новый групповой чат';
                }
                console.log('Calling toggleGroupChatModalView(true)...');
                toggleGroupChatModalView(true);
            } else {
                alert('Выберите хотя бы одного пользователя.');
            }
        });
    }

    if (groupChatGoBackBtn && !groupChatGoBackBtn.dataset.eventListener) {
        groupChatGoBackBtn.dataset.eventListener = 'true';
        groupChatGoBackBtn.addEventListener('click', function () {
            toggleGroupChatModalView(false);
        });
    }

    if (confirmGroupChatCreationBtn && !confirmGroupChatCreationBtn.dataset.eventListener) {
        confirmGroupChatCreationBtn.dataset.eventListener = 'true';
        confirmGroupChatCreationBtn.addEventListener('click', function () {
            const groupChatNameInput = document.getElementById('groupChatNameInput');
            const chatName = groupChatNameInput
                ? groupChatNameInput.value.trim()
                : 'Групповой чат';
            if (!chatName) {
                alert('Пожалуйста, введите название чата.');
                if (groupChatNameInput) groupChatNameInput.focus();
                return;
            }
            if (selectedGroupChatUserIds.length === 0) {
                alert(
                    'Нет выбранных участников. Пожалуйста, вернитесь и выберите участников.'
                );
                toggleGroupChatModalView(false);
                return;
            }
            confirmGroupChatCreationBtn.disabled = true;
            confirmGroupChatCreationBtn.textContent = 'Создание...';
            createGroupChat(chatName, selectedGroupChatUserIds);
        });
    }

    if (groupChatAddMoreParticipantsBtn && !groupChatAddMoreParticipantsBtn.dataset.eventListener) {
        groupChatAddMoreParticipantsBtn.dataset.eventListener = 'true';
        groupChatAddMoreParticipantsBtn.addEventListener('click', function () {
            toggleGroupChatModalView(false);
        });
    }

    // Закрытие модального окна группового чата по клику вне модального окна
    const groupChatModalOverlay = document.getElementById('groupChatModal');
    if (groupChatModalOverlay && !groupChatModalOverlay.dataset.eventListener) {
        groupChatModalOverlay.dataset.eventListener = 'true';
        groupChatModalOverlay.addEventListener('click', function (event) {
            if (event.target === groupChatModalOverlay) {
                closeGroupChatModal();
            }
        });
    }

    // Закрытие модального окна группового чата по нажатию ESC
    if (!document.body.dataset.keydownListener) {
        document.body.dataset.keydownListener = 'true';
        document.addEventListener('keydown', function (event) {
            const groupChatModal = document.getElementById('groupChatModal');
            if (
                event.key === 'Escape' &&
                groupChatModal &&
                groupChatModal.style.display === 'flex'
            ) {
                closeGroupChatModal();
            }
        });
    }

    // Обработчик для кнопки закрытия модального окна группового чата
    const closeGroupChatModalBtn = document.getElementById('closeGroupChatModalBtn');
    if (closeGroupChatModalBtn && !closeGroupChatModalBtn.dataset.eventListener) {
        closeGroupChatModalBtn.dataset.eventListener = 'true';
        closeGroupChatModalBtn.addEventListener('click', function () {
            closeGroupChatModal();
        });
    }

    // Добавляем обработчики для фильтров чатов
    const chatFilterButtons = document.querySelectorAll('.chat-filters-new .filter-btn-new');
    chatFilterButtons.forEach((button) => {
        if (!button.dataset.eventListener) {
            button.dataset.eventListener = 'true';
            button.addEventListener('click', function () {
                chatFilterButtons.forEach((btn) => btn.classList.remove('active'));
                this.classList.add('active');
                filterChats(this.dataset.filter);
            });
        }
    });

    // Инициализация фильтров ролей
    setupRoleFilters();

    // Обработчик для выпадающего меню действий
    const chatActionsBtn = document.getElementById('chatActionsBtn');
    const chatActionsMenu = document.getElementById('chatActionsMenu');
    if (chatActionsBtn && chatActionsMenu && !chatActionsBtn.dataset.eventListener) {
        chatActionsBtn.dataset.eventListener = 'true';
        chatActionsBtn.addEventListener('click', function () {
            chatActionsMenu.classList.toggle('open');
        });
        document.addEventListener('click', function (event) {
            if (!chatActionsBtn.contains(event.target) && !chatActionsMenu.contains(event.target)) {
                chatActionsMenu.classList.remove('open');
            }
        });
    }

    // Обработчик для переименования чата
    const chatNameInput = document.getElementById('chatNameInput');
    if (chatNameInput && !chatNameInput.dataset.eventListener) {
        chatNameInput.dataset.eventListener = 'true';
        chatNameInput.addEventListener('blur', function () {
            const newName = chatNameInput.value.trim();
            const chatWindowTitle = document.getElementById('chatWindowTitle');
            if (newName && currentChatId && chatWindowTitle) {
                fetch(`/cosmochat/rename-chat/${currentChatId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ name: newName })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        chatWindowTitle.textContent = data.chat_name;
                        const chatItem = document.querySelector(`.chat-item-new[data-chat-id="${currentChatId}"]`);
                        if (chatItem) {
                            chatItem.dataset.chatName = data.chat_name;
                            const chatNameElement = chatItem.querySelector('h4');
                            if (chatNameElement) {
                                chatNameElement.innerHTML = data.chat_name.slice(0, 25) + (data.chat_name.length > 25 ? '...' : '') +
                                    (chatItem.dataset.isDeal === 'true' ? '<span class="deal-indicator" title="Сделка"><img src="/static/accounts/images/cosmochat/deal_icon.svg" alt="Сделка" class="deal-icon"></span>' : '');
                            }
                        }
                        startPolling(); // Обновляем список для других пользователей
                    } else {
                        alert(data.error || 'Ошибка при переименовании чата');
                    }
                })
                .catch(error => {
                    console.error('Ошибка при переименовании:', error);
                    alert('Произошла ошибка при переименовании чата.');
                });
            }
            if (chatNameInput && chatWindowTitle) {
                chatNameInput.style.display = 'none';
                chatWindowTitle.style.display = 'inline';
                if (renameChatBtn) renameChatBtn.style.display = 'inline-block';
            }
        });

        chatNameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                chatNameInput.blur();
            }
        });
    }

    // Обработчик для кнопки "Переименовать" в выпадающем меню
    if (renameChatBtn && !renameChatBtn.dataset.eventListener) {
        renameChatBtn.dataset.eventListener = 'true';
        renameChatBtn.addEventListener('click', function () {
            const chatWindowTitle = document.getElementById('chatWindowTitle');
            const chatNameInput = document.getElementById('chatNameInput');
            if (chatWindowTitle && chatNameInput) {
                chatNameInput.value = chatWindowTitle.textContent;
                chatNameInput.style.display = 'inline';
                chatWindowTitle.style.display = 'none';
                renameChatBtn.style.display = 'none';
                chatNameInput.focus();
            }
        });
    }

    // Обработчик для кнопки "Начать сделку" в выпадающем меню
    if (startDealBtn && !startDealBtn.dataset.eventListener) {
        startDealBtn.dataset.eventListener = 'true';
        startDealBtn.addEventListener('click', function () {
            if (!currentChatId) {
                alert('Выберите чат для начала сделки');
                return;
            }
            const chatItem = document.querySelector(
                `.chat-item-new[data-chat-id="${currentChatId}"]`
            );
            if (
                !chatItem ||
                chatItem.dataset.chatType === 'group' ||
                chatItem.dataset.isDeal === 'true'
            ) {
                alert(
                    'Сделку можно начать только в личном чате, который ещё не помечен как сделка'
                );
                return;
            }
            startDealBtn.disabled = true;
            startDealBtn.textContent = 'Инициация сделки...';
            startDeal(currentChatId);
        });
    }

    // Обработчик для кнопки "Участники" в выпадающем меню
    if (participantsBtn && !participantsBtn.dataset.eventListener) {
        participantsBtn.dataset.eventListener = 'true';
        participantsBtn.addEventListener('click', function () {
            if (!currentChatId) {
                alert('Выберите чат для просмотра участников');
                return;
            }
            const chatItem = document.querySelector(
                `.chat-item-new[data-chat-id="${currentChatId}"]`
            );
            if (chatItem && chatItem.dataset.chatType !== 'group') {
                alert('Просмотр участников доступен только в групповых чатах');
                return;
            }
            showParticipantsModal();
        });
    }

    // Обработчик для кнопки "Покинуть" в выпадающем меню
    if (leaveChatBtn && !leaveChatBtn.dataset.eventListener) {
        leaveChatBtn.dataset.eventListener = 'true';
        leaveChatBtn.addEventListener('click', function () {
            if (!currentChatId) {
                alert('Выберите чат');
                return;
            }
            if (!confirm('Вы уверены, что хотите покинуть/удалить этот чат?')) return;
            leaveChatBtn.disabled = true;
            leaveChatBtn.textContent = 'Выход...';
            leaveChat();
        });
    }
});

function showNoChatSelected() {
    if (noChatSelectedPlaceholder) noChatSelectedPlaceholder.style.display = 'flex'
    if (chatActiveHeader) chatActiveHeader.style.display = 'none'
    if (chatMessagesArea) chatMessagesArea.innerHTML = '' // Очищаем сообщения
    if (chatMessagesArea) chatMessagesArea.style.display = 'none'
    if (chatInputFieldArea) chatInputFieldArea.style.display = 'none'
}

function showActiveChatWindow() {
    if (noChatSelectedPlaceholder) noChatSelectedPlaceholder.style.display = 'none'
    if (chatActiveHeader) chatActiveHeader.style.display = 'flex'
    if (chatMessagesArea) chatMessagesArea.style.display = 'flex'
    if (chatInputFieldArea) chatInputFieldArea.style.display = 'flex'
}

function loadChat(chatId) {
    return new Promise((resolve, reject) => {
        console.log('Загрузка чата:', chatId);
        currentChatId = chatId;
        if (chatIdInput) chatIdInput.value = chatId;

        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        displayedMessageIds.clear();

        document.querySelectorAll('.chat-item-new').forEach((item) => {
            item.classList.remove('active');
            if (item.getAttribute('data-chat-id') == chatId && !item.classList.contains('hidden-chat')) {
                item.classList.add('active');
                if (chatWindowTitle) chatWindowTitle.textContent = item.dataset.chatName || 'Чат';
            }
        });

        showActiveChatWindow();

        fetch(`/cosmochat/${chatId}/`, {
            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                if (chatMessagesArea) {
                    chatMessagesArea.innerHTML = '';
                    displayedMessageIds.clear();
                }
                data.messages.forEach((msg) => appendMessage(msg, false));

                if (chatWindowTitle && data.chat_name) chatWindowTitle.textContent = data.chat_name;
                currentParticipants = data.participants || [];

                const chatItem = document.querySelector(`.chat-item-new[data-chat-id="${chatId}"]`);
                const isDeal = chatItem && chatItem.dataset.isDeal === 'true';
                const isGroupChat = chatItem && chatItem.dataset.chatType === 'group';

                const dealLabel = document.getElementById('dealLabel');
                const startDealBtn = document.getElementById('startDealBtn');
                const participantsBtn = document.getElementById('participantsBtn');
                const participantsListDiv = document.getElementById('chatParticipantsList');

                if (dealLabel) dealLabel.style.display = isDeal ? 'inline' : 'none';
                if (startDealBtn) startDealBtn.style.display = isGroupChat ? 'none' : 'block';
                if (participantsBtn) participantsBtn.style.display = isGroupChat ? 'block' : 'none';

                if (participantsListDiv && isDeal) {
                    participantsListDiv.innerHTML = currentParticipants.map(p => 
                        `<span class="participant-name">${p.name} (${p.role})</span>`
                    ).join(', ');
                    participantsListDiv.style.display = 'block';
                } else if (participantsListDiv) {
                    participantsListDiv.style.display = 'none';
                }

                if (data.messages.length > 0) {
                    lastMessageTimestamp = data.messages[data.messages.length - 1].created_at_iso;
                } else {
                    lastMessageTimestamp = null;
                }
                if (chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

                fetch(`/cosmochat/mark-read/${chatId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                resolve(); // Разрешаем промис после успешной загрузки
            } else {
                alert(data.error || 'Ошибка при загрузке чата');
                showNoChatSelected();
                reject(new Error(data.error || 'Ошибка загрузки чата'));
            }
        })
        .catch((error) => {
            console.error('Ошибка загрузки чата:', error);
            alert('Произошла ошибка при загрузке чата.');
            showNoChatSelected();
            reject(error);
        });
    });
}

function handleSendMessage(e) {
    e.preventDefault()
    if (!currentChatId || !messageTextInput) {
        alert('Выберите чат и введите сообщение.')
        return
    }
    const messageText = messageTextInput.value.trim()
    if (!messageText) return

    const formData = new FormData()
    formData.append('chat_id', currentChatId)
    formData.append('message_text', messageText)

    fetch('/cosmochat/send-message/', {
        method: 'POST',
        body: formData,
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                appendMessage(data.message, true)
                updateChatListItem(data.message)
                lastMessageTimestamp = data.message.created_at_iso
                if (messageFormNew) messageFormNew.reset()
                if (messageTextInput) messageTextInput.style.height = 'auto' // Сброс высоты textarea
            } else {
                alert(data.error || 'Ошибка при отправке сообщения')
            }
        })
        .catch((error) => {
            console.error('Ошибка отправки:', error)
            alert('Произошла ошибка при отправке сообщения.')
        })
}

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(() => {
        console.log('Polling...');
        // Всегда начинаем с загрузки списка чатов
        fetch('/cosmochat/chat-list/', {
            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => {
            if (!response.ok) {
                console.error('Ошибка при получении списка чатов:', response.status, response.statusText);
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const chatListContainer = document.getElementById('chatListContainer');
                if (chatListContainer) {
                    chatListContainer.innerHTML = '';
                    data.chats.forEach((chat) => {
                        if (!chat.is_deleted && (!chat.has_left || (window.REQUEST_USER_ID && requestUserRole === 'moderator'))) {
                            const chatItem = createChatItemElement(chat);
                            chatListContainer.appendChild(chatItem);
                        }
                    });
                    const currentChatItem = chatListContainer.querySelector(`.chat-item-new[data-chat-id="${currentChatId}"]`);
                    if (currentChatItem && chatWindowTitle) {
                        chatWindowTitle.textContent = currentChatItem.dataset.chatName;
                    }
                }
            } else {
                console.error('Ошибка данных списка чатов:', data.error);
            }
        })
        .catch(error => console.error('Ошибка при опросе списка чатов:', error));

        // Поллинг для текущего чата, если он выбран
        if (currentChatId) {
            const url = lastMessageTimestamp
                ? `/cosmochat/${currentChatId}/?since=${encodeURIComponent(lastMessageTimestamp)}`
                : `/cosmochat/${currentChatId}/`;

            fetch(url, {
                headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const newMessages = data.messages;
                        if (newMessages.length > 0) {
                            newMessages.forEach((msg) => {
                                if (!displayedMessageIds.has(msg.message_id)) {
                                    appendMessage(msg, false);
                                }
                            });
                            lastMessageTimestamp = newMessages[newMessages.length - 1].created_at_iso;
                            if (chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
                            updateChatListItem(newMessages[newMessages.length - 1]);
                        }
                        fetch('/cosmochat/chat-list/', {
                            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                const chatListContainer = document.getElementById('chatListContainer');
                                if (chatListContainer) {
                                    chatListContainer.innerHTML = '';
                                    data.chats.forEach((chat) => {
                                        if (!chat.is_deleted && (!chat.has_left || (window.REQUEST_USER_ID && requestUserRole === 'moderator'))) {
                                            const chatItem = createChatItemElement(chat);
                                            chatListContainer.appendChild(chatItem);
                                        }
                                    });
                                    const currentChatItem = chatListContainer.querySelector(`.chat-item-new[data-chat-id="${currentChatId}"]`);
                                    if (currentChatItem && chatWindowTitle) {
                                        chatWindowTitle.textContent = currentChatItem.dataset.chatName;
                                    }
                                }
                            }
                        })
                        .catch(error => console.error('Ошибка обновления списка чатов:', error));
                    } else {
                        console.error('Ошибка опроса:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Ошибка при опросе новых сообщений:', error);
                });
        }
    }, 5000);
}

function startDeal(chatId) {
    const startDealBtn = document.getElementById('startDealBtn');
    if (!chatId) {
        alert('Ошибка: chatId не определён');
        return;
    }
    console.log('Starting deal for chatId:', chatId);
    const initiatorName = window.REQUEST_USER_ID ? document.querySelector(`.user-card-new[data-user-id="${window.REQUEST_USER_ID}"] h3`)?.textContent || 'Пользователь' : 'Пользователь';
    fetch(`/cosmochat/start-deal/${chatId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ initiator_name: initiatorName })
    })
    .then(response => {
        console.log('Response status:', response.status); // Для отладки
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(data.message);
            if (startDealBtn) {
                startDealBtn.style.display = 'none';
                startDealBtn.disabled = false;
                startDealBtn.textContent = 'Начать сделку';
            }
            const chatItem = document.querySelector(`.chat-item-new[data-chat-id="${chatId}"]`);
            if (chatItem) {
                chatItem.dataset.isDeal = 'true';
                const chatNameElement = chatItem.querySelector('h4');
                if (chatNameElement) {
                    chatNameElement.innerHTML = chatItem.dataset.chatName.slice(0, 25) + (chatItem.dataset.chatName.length > 25 ? '...' : '') +
                        '<span class="deal-indicator" title="Сделка"><img src="/static/accounts/images/cosmochat/deal_icon.svg" alt="Сделка" class="deal-icon"></span>';
                }
            }
            const dealLabel = document.getElementById('dealLabel');
            if (dealLabel) dealLabel.style.display = 'inline';
            const participantsListDiv = document.getElementById('chatParticipantsList');
            if (participantsListDiv && data.participants) {
                currentParticipants = data.participants;
                participantsListDiv.innerHTML = currentParticipants.map(p => 
                    `<span class="participant-name">${p.name} (${p.role})</span>`
                ).join(', ');
                participantsListDiv.style.display = 'block';
            }
            appendMessage({
                message_id: `temp_${Date.now()}`,
                sender_id: null,
                sender_name: 'Система',
                message_text: `Сделку начал ${initiatorName}. Назначен модератор: ${data.moderator.name}`,
                created_at: new Date().toLocaleString('ru-RU'),
                created_at_iso: new Date().toISOString(),
                is_read: true,
                is_own: false,
                is_system: true
            }, false);
            // Обновляем чат перед запуском поллинга
            loadChat(chatId).then(() => {
                startPolling(); // Запускаем поллинг после обновления
            });
        } else {
            alert(data.error || 'Ошибка при начале сделки');
            if (startDealBtn) {
                startDealBtn.disabled = false;
                startDealBtn.textContent = 'Начать сделку';
            }
        }
    })
    .catch(error => {
        console.error('Ошибка начала сделки:', error);
        alert('Произошла ошибка при начале сделки.');
        if (startDealBtn) {
            startDealBtn.disabled = false;
            startDealBtn.textContent = 'Начать сделку';
        }
    });
}
// Функция для удаления сообщения (для модератора)
function deleteMessage(messageId) {
    if (confirm('Удалить сообщение?')) {
        fetch(`/cosmochat/delete-message/${messageId}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageDiv) messageDiv.remove();
                } else {
                    alert(data.error || 'Ошибка при удалении сообщения');
                }
            })
            .catch((error) => console.error('Ошибка удаления сообщения:', error));
    }
}


// Функция для исключения пользователя из группового чата (для модератора)
function removeParticipant(chatId, userId) {
    if (confirm('Исключить участника из чата?')) {
        fetch(`/cosmochat/remove-participant/${chatId}/?user_id=${userId}`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    loadChat(chatId); // Обновляем список участников
                } else {
                    alert(data.error || 'Ошибка при исключении участника');
                }
            })
            .catch((error) => console.error('Ошибка исключения участника:', error));
    }
}

function appendMessage(msg, isOwnMessageSentJustNow) {
  if (!chatMessagesArea || displayedMessageIds.has(msg.message_id)) {
    return
  }

  const messageDiv = document.createElement('div')
  const isOwn =
    msg.is_own ||
    (isOwnMessageSentJustNow && msg.sender_id == window.REQUEST_USER_ID) // window.REQUEST_USER_ID нужно установить в Django шаблоне

  messageDiv.className = `message-bubble-new ${isOwn ? 'current-user-message' : 'other-user-message'} ${msg.is_system ? 'system-notification-message' : ''}`
  messageDiv.dataset.messageId = msg.message_id

  let senderNameHTML = ''
  if (!isOwn && msg.sender_name && !msg.is_system) {
    senderNameHTML = `<div class="message-sender-name">${msg.sender_name}</div>`
  }

  messageDiv.innerHTML = `
        ${senderNameHTML}
        <div class="message-text-content">${msg.message_text}</div>
        <div class="message-meta-info">
            ${msg.created_at_time || msg.created_at} <!-- Предполагаем, что есть created_at_time -->
            ${isOwn && !msg.is_system ? `<span class="status-icon">${msg.is_read ? '✓✓' : '✓'}</span>` : ''}
        </div>
    `
  chatMessagesArea.appendChild(messageDiv)
  displayedMessageIds.add(msg.message_id)

  if (
    isOwnMessageSentJustNow ||
    chatMessagesArea.scrollHeight - chatMessagesArea.scrollTop <
      chatMessagesArea.clientHeight + 150
  ) {
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight
  }
}

function updateChatName(chatId, newName) {
    const chatItem = document.querySelector(`.chat-item-new[data-chat-id="${chatId}"]`);
    if (chatItem) {
        chatItem.dataset.chatName = newName;
        const chatNameElement = chatItem.querySelector('h4');
        if (chatNameElement) {
            chatNameElement.innerHTML = newName.slice(0, 25) + (newName.length > 25 ? '...' : '') +
                (chatItem.dataset.isDeal === 'true' ? '<span class="deal-indicator" title="Сделка"><img src="/static/accounts/images/cosmochat/deal_icon.svg" alt="Сделка" class="deal-icon"></span>' : '');
        }
    }
    if (chatWindowTitle && currentChatId === chatId) {
        chatWindowTitle.textContent = newName;
    }
}

function showParticipantsModal() {
    if (!currentChatId) {
        alert('Выберите чат для просмотра участников');
        return;
    }
    if (!addParticipantModal || !participantsList) {
        console.error('addParticipantModal or participantsList is null');
        return;
    }
    participantsList.innerHTML = '';
    if (currentParticipants.length > 0) {
        currentParticipants.forEach((user) => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.innerHTML = `${user.name} (${user.role})`;
            participantsList.appendChild(item);
        });
    } else {
        participantsList.innerHTML = '<p style="padding:10px; text-align:center;">Нет участников в чате.</p>';
    }
    addParticipantModal.classList.add('active');
    addParticipantModal.style.display = 'flex';
}

function updateChatListItem(lastMessage) {
  if (!currentChatId) return
  const chatItem = chatListContainer
    ? chatListContainer.querySelector(
        `.chat-item-new[data-chat-id="${currentChatId}"]`
      )
    : null
  if (chatItem) {
    const lastMessagePreview = chatItem.querySelector('.last-message-preview')
    const timestampChat = chatItem.querySelector('.timestamp-chat')
    const dateChatPreview = chatItem.querySelector('.date-chat-preview')
    const unreadBadge = chatItem.querySelector('.unread-badge-chat')

    if (lastMessagePreview) {
      let previewText = ''
      if (lastMessage.sender_id == window.REQUEST_USER_ID) {
        // window.REQUEST_USER_ID
        previewText = 'Вы: '
      }
      previewText += lastMessage.message_text
      lastMessagePreview.textContent =
        previewText.substring(0, 30) + (previewText.length > 30 ? '...' : '')
    }
    if (timestampChat && lastMessage.created_at_time) {
      timestampChat.textContent = lastMessage.created_at_time
    }
    if (dateChatPreview && lastMessage.created_at_date) {
      dateChatPreview.textContent = lastMessage.created_at_date
    }

    if (unreadBadge) {
      // Логика для значка непрочитанных должна управляться сервером или при polling
      // Если сообщение только что отправлено нами, или прочитано, значок должен исчезнуть
      if (
        lastMessage.sender_id == window.REQUEST_USER_ID ||
        lastMessage.is_read
      ) {
        //unreadBadge.style.display = 'none';
        //unreadBadge.textContent = '0'; // Сервер должен присылать актуальный unread_count
      } else {
        // unreadBadge.style.display = 'inline-block';
        // unreadBadge.textContent = 'N'; // Сервер должен присылать актуальный unread_count
      }
    }
    // Переместить обновленный чат наверх списка
    if (chatListContainer && chatItem.parentElement === chatListContainer) {
      chatListContainer.prepend(chatItem)
    }
  }
}

// Функции для модальных окон (взяты из старого HTML, адаптированы)
function openProfileModal(userId) {
  currentProfileUserId = userId
  fetch(`/profile/?user_id=${userId}`, {
    headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then((response) => response.json())
    .then((data) => {
      if (!profileModal) return
      const profilePictureUrl = data.profile_picture_url
      ? (data.profile_picture_url.startsWith('http://') || data.profile_picture_url.startsWith('https://')
          ? data.profile_picture_url
          : data.profile_picture_url.startsWith('/')
            ? data.profile_picture_url
            : '/' + data.profile_picture_url)
      : '/static/accounts/images/avatars/default_avatar_ufo.png';

      if (profileAvatar) profileAvatar.src = profilePictureUrl
      if (profileName)
        profileName.textContent = `${data.first_name} ${data.last_name}`
      if (profileRole) profileRole.textContent = `Роль: ${data.role}`
      if (profileRating)
        profileRating.textContent = `Рейтинг: ${data.rating || 'Нет рейтинга'}`
      if (profileBio)
        profileBio.textContent = `О себе: ${data.bio || 'Нет информации'}`
      if (profileLink) profileLink.href = `/profile/${userId}/`
      profileModal.style.display = 'flex'
    })
    .catch((error) => {
      console.error('Ошибка загрузки профиля:', error)
      alert('Произошла ошибка при загрузке профиля.')
    })
}

function closeProfileModal() {
  if (profileModal) profileModal.style.display = 'none'
  currentProfileUserId = null
}

function startChat() {
  // Эта функция вызывается из МОДАЛЬНОГО ОКНА ПРОФИЛЯ
  const userId = currentProfileUserId
  if (!userId) {
    alert('Ошибка: пользователь не выбран')
    return
  }
  fetch(`/cosmochat/start-chat/${userId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.chat_id) {
        let chatExists = false
        document.querySelectorAll('.chat-item-new').forEach((item) => {
          if (item.dataset.chatId == data.chat_id) {
            chatExists = true
          }
        })
        if (chatExists) {
          loadChat(data.chat_id)
          document
            .querySelector('.main-chat-area-new')
            .scrollIntoView({ behavior: 'smooth' })
        } else {
          window.location.href =
            window.location.pathname +
            '?open_chat_id=' +
            data.chat_id +
            '&new_chat=true'
        }
        closeProfileModal()
      } else {
        alert(data.error || 'Ошибка при создании чата')
      }
    })
    .catch((error) => {
      console.error('Ошибка создания чата:', error)
      alert('Произошла ошибка при создании чата')
    })
}

function openAddParticipantModal() {
  console.log('openAddParticipantModal called, currentChatId:', currentChatId);
  if (!currentChatId) {
    alert('Выберите чат для добавления участника');
    return;
  }
  const chatItem = document.querySelector(`.chat-item-new[data-chat-id="${currentChatId}"]`);
  const isGroupChat = chatItem && chatItem.dataset.chatType === 'group';
  console.log('Chat type:', isGroupChat ? 'group' : 'personal', 'Participants count:', currentParticipants.length);
  if (!isGroupChat && currentParticipants.length >= 3) {
    alert('В личном чате уже максимальное количество участников (3)');
    return;
  }

  console.log('Fetching available users for chat:', currentChatId);
  fetch(`/cosmochat/available-users-for-chat/${currentChatId}/`, {
    headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then((response) => {
      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        console.error('Failed to fetch available users:', response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      console.log('Fetch data:', data);
      if (!addParticipantModal || !participantsList) {
        console.error('addParticipantModal or participantsList is null');
        return;
      }
      participantsList.innerHTML = '';

      const currentParticipantIds = currentParticipants.map((p) => p.user_id);
      const currentRoles = currentParticipants.map((p) => p.role.toLowerCase());

      if (data.users && data.users.length > 0) {
        data.users.forEach((user) => {
          if (currentParticipantIds.includes(user.user_id)) return;

          let isDisabled = false;

          const item = document.createElement('div');
          item.className = `participant-item ${isDisabled ? 'disabled' : ''}`;
          item.innerHTML = `${user.name} (${user.role})`;
          if (!isDisabled) {
            item.onclick = () => addParticipantToChat(user.user_id);
          }
          participantsList.appendChild(item);
        });
      } else {
        participantsList.innerHTML =
          '<p style="padding:10px; text-align:center;">Нет доступных пользователей для добавления или все уже в чате.</p>';
      }
      console.log('Showing modal');
      addParticipantModal.classList.add('active');
      addParticipantModal.style.display = 'flex';
    })
    .catch((error) => {
      console.error('Ошибка загрузки пользователей:', error);
      alert('Произошла ошибка при загрузке списка пользователей.');
    });
}

function closeAddParticipantModal() {
  if (addParticipantModal) {
    console.log('Closing addParticipantModal');
    addParticipantModal.classList.remove('active');
    addParticipantModal.style.display = 'none';
  }
}

function addParticipantToChat(userId) {
    if (!currentChatId) return;

    console.log('Attempting to add participant, chatId:', currentChatId, 'userId:', userId);
    const formData = new FormData();
    formData.append('user_id', userId);

    fetch(`/cosmochat/add-participant/${currentChatId}/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then((response) => {
            console.log('Add participant response status:', response.status);
            if (!response.ok) {
                console.error('Failed to add participant:', response.statusText);
            }
            return response.json();
        })
        .then((data) => {
            console.log('Add participant data:', data);
            if (data.success) {
                alert('Участник добавлен! Информация обновится.');
                closeAddParticipantModal();
                loadChat(currentChatId);
            } else {
                alert(data.error || 'Ошибка при добавлении участника');
            }
        })
        .catch((error) => {
            console.error('Ошибка добавления участника:', error);
            alert('Произошла ошибка при добавлении участника.');
        });
}

let alertShown = false;

function leaveChat() {
    if (!currentChatId) {
        if (!alertShown) {
            alertShown = true;
            alert('Выберите чат');
            alertShown = false;
        }
        return;
    }
    if (!confirm('Вы уверены, что хотите покинуть/удалить этот чат?')) return;

    if (!alertShown) {
        alertShown = true;
        fetch(`/cosmochat/leave-chat/${currentChatId}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message || 'Вы покинули чат.');
                currentChatId = null;
                location.reload();
            } else {
                alert(data.error || 'Ошибка при выходе из чата');
            }
            alertShown = false; // Сбрасываем флаг после выполнения
        })
        .catch(error => {
            console.error('Ошибка выхода из чата:', error);
            alert('Произошла ошибка при выходе из чата.');
            alertShown = false;
        });
    }
}

// Вспомогательные функции для textarea (авто-изменение высоты)
if (messageTextInput) {
  messageTextInput.addEventListener('input', () => {
    messageTextInput.style.height = 'auto'
    messageTextInput.style.height = messageTextInput.scrollHeight + 'px'
  })
}

function openGroupChatModal() {
  console.log('openGroupChatModal called');
  const groupChatModalOverlay = document.getElementById('groupChatModal');
  if (!groupChatModalOverlay) {
    console.error('#groupChatModal not found');
    return;
  }

  selectedGroupChatUserIds = [];
  groupChatModalOverlay.style.display = 'flex';
  setTimeout(() => {
    groupChatModalOverlay.classList.add('active');
    console.log('Group chat modal activated');
  }, 10);

  const groupChatModalElement = groupChatModalOverlay.querySelector('.group-chat-modal');
  if (groupChatModalElement) {
    const roleButtons = groupChatModalElement.querySelectorAll('.group-chat-modal-role-btn');
    roleButtons.forEach((btn) => {
      btn.classList.add('active');
      btn.classList.remove('inactive');
    });
  }

  const usersList = document.getElementById('groupChatUsersList');
  const countElement = document.getElementById('selectedUsersCount');
  const pillsContainer = document.getElementById('selectedUserPillsContainer');
  if (usersList && countElement && pillsContainer) {
    console.log('Loading group chat users');
    loadGroupChatUsers(usersList, countElement, pillsContainer);
  }
}

function closeGroupChatModal() {
  const groupChatModal = document.getElementById('groupChatModal')
  if (!groupChatModal) return
  groupChatModal.classList.remove('active')
  setTimeout(() => {
    groupChatModal.style.display = 'none'
  }, 300)
}

function loadGroupChatUsers(usersListElement, countElement, pillsContainer) {
  console.log('loadGroupChatUsers called')
  if (!usersListElement) {
    console.error('loadGroupChatUsers: usersListElement is null!')
    return
  }
  const activeRoleButtons = document.querySelectorAll(
    '.group-chat-modal-role-btn.active'
  )
  const activeRoles = Array.from(activeRoleButtons).map(
    (btn) => btn.dataset.role
  )

  fetch('/cosmochat/available_users/', {
    headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then((response) => response.json())
    .then((data) => {
      usersListElement.innerHTML = ''
      if (data.success && data.users) {
        const filteredUsers =
          activeRoles.length > 0
            ? data.users.filter((user) =>
                activeRoles.includes(user.role.toLowerCase())
              )
            : data.users

        if (filteredUsers.length === 0) {
          usersListElement.innerHTML =
            '<p style="padding: 10px; text-align: center;">Нет доступных пользователей для выбранной роли.</p>'
          return
        }

        filteredUsers.forEach((user) => {
          const userItem = document.createElement('div')
          userItem.className = 'group-chat-modal-user'
          userItem.dataset.userId = user.user_id
          const isChecked = selectedGroupChatUserIds.includes(
            user.user_id.toString()
          )
          userItem.innerHTML = `
                    <div class="group-chat-modal-user-info">
                        <img class="group-chat-modal-user-avatar" src="${user.profile_picture_url || '/static/accounts/images/avatars/default_avatar_ufo.png'}" alt="${user.name}">
                        <div class="group-chat-modal-user-name">
                            <span class="group-chat-modal-user-firstname">${user.name.split(' ')[0]}</span>
                            <span class="group-chat-modal-user-lastname">${user.name.split(' ').slice(1).join(' ')}</span>
                        </div>
                                       </div>
                    <div class="group-chat-modal-checkbox ${isChecked ? 'checked' : ''}" data-user-id="${user.user_id}">
                        <div class="group-chat-modal-checkbox-empty"></div>
                        <div class="group-chat-modal-checkbox-filled"></div>
                        <div class="group-chat-modal-checkbox-tick"></div>
                    </div>
                `
          usersListElement.appendChild(userItem)
        })

        usersListElement
          .querySelectorAll('.group-chat-modal-checkbox')
          .forEach((checkbox) => {
            checkbox.addEventListener('click', function () {
              this.classList.toggle('checked')
              const userId = this.dataset.userId
              if (this.classList.contains('checked')) {
                if (!selectedGroupChatUserIds.includes(userId))
                  selectedGroupChatUserIds.push(userId)
              } else {
                selectedGroupChatUserIds = selectedGroupChatUserIds.filter(
                  (id) => id !== userId
                )
              }
              renderSelectedUserPills(pillsContainer, usersListElement)
              updateSelectedUsersCount(countElement)
            })
          })
      } else {
        usersListElement.innerHTML =
          '<p style="padding: 10px; text-align: center;">Нет доступных пользователей.</p>'
      }
    })
    .catch((error) => {
      console.error('Ошибка загрузки пользователей:', error)
      usersListElement.innerHTML =
        '<p style="padding: 10px; text-align: center;">Ошибка загрузки.</p>'
    })
}

function updateSelectedUsersCount(countElement) {
  console.log('updateSelectedUsersCount called')
  if (!countElement) {
    console.error('updateSelectedUsersCount: countElement is null!')
    return
  }
  const count = selectedGroupChatUserIds.length
  countElement.textContent = `${count}/10`
}

function toggleGroupChatModalView(showDetailsView) {
  console.log('toggleGroupChatModalView called with:', showDetailsView)
  const groupChatContentWrapper = document.getElementById('groupChatModalContentWrapper')
  const groupChatDetailsView = document.getElementById('groupChatDetailsView')

  if (!groupChatContentWrapper || !groupChatDetailsView) {
    console.error('toggleGroupChatModalView: groupChatContentWrapper or groupChatDetailsView is null! GETTING THEM BY ID.')
    return
  }

  const groupChatUsersList = document.getElementById('groupChatUsersList')
  const pillsContainer = document.getElementById('selectedUserPillsContainer')
  const countElement = document.getElementById('selectedUsersCount')

  if (showDetailsView) {
    groupChatContentWrapper.style.display = 'none'
    groupChatDetailsView.style.display = 'flex'
  } else {
    groupChatContentWrapper.style.display = 'flex'
    groupChatDetailsView.style.display = 'none'
    if (groupChatUsersList && countElement && pillsContainer) {
      loadGroupChatUsers(groupChatUsersList, countElement, pillsContainer)
    }
    if (pillsContainer && groupChatUsersList) {
      renderSelectedUserPills(pillsContainer, groupChatUsersList)
    }
  }
}

function renderSelectedParticipantsForDetailsView(groupChatUsersListFromCaller) {
  console.log('renderSelectedParticipantsForDetailsView called')
  const groupChatSelectedParticipantsList = document.getElementById('groupChatSelectedParticipantsList')
  const usersList = groupChatUsersListFromCaller || document.getElementById('groupChatUsersList')

  if (!groupChatSelectedParticipantsList || !usersList) {
    console.error('renderSelectedParticipantsForDetailsView: groupChatSelectedParticipantsList or usersList is null!')
    return
  }
  groupChatSelectedParticipantsList.innerHTML = ''
  selectedGroupChatUserIds.forEach((userId) => {
    const userDiv = usersList.querySelector(
      `.group-chat-modal-user[data-user-id="${userId}"]`
    )
    if (userDiv) {
      const avatarSrc = userDiv.querySelector('.group-chat-modal-user-avatar').src
      const firstName = userDiv.querySelector('.group-chat-modal-user-firstname').textContent
      const lastName = userDiv.querySelector('.group-chat-modal-user-lastname').textContent
      const participantNameText = `${firstName} ${lastName}`
      const participantItem = document.createElement('div')
      participantItem.className = 'participant-display-item'
      participantItem.innerHTML = `
                <img src="${avatarSrc}" alt="${participantNameText}">
                <span class="participant-name">${participantNameText}</span>
            `
      groupChatSelectedParticipantsList.appendChild(participantItem)
    }
  })
}

function renderSelectedUserPills(pillsContainer, usersList) {
  console.log('renderSelectedUserPills called')
  if (!pillsContainer || !usersList) {
    console.error('renderSelectedUserPills: pillsContainer or usersList is null!')
    return
  }
  pillsContainer.innerHTML = ''
  selectedGroupChatUserIds.forEach((userId) => {
    const userDiv = usersList.querySelector(
      `.group-chat-modal-user[data-user-id="${userId}"]`
    )
    if (userDiv) {
      const firstName = userDiv.querySelector('.group-chat-modal-user-firstname').textContent
      const lastNameInitial = userDiv.querySelector('.group-chat-modal-user-lastname').textContent.charAt(0)
      const pillNameText = `${firstName} ${lastNameInitial}.`
      const pill = document.createElement('div')
      pill.className = 'selected-user-pill'
      pill.dataset.userId = userId
      const pillNameElement = document.createElement('span')
      pillNameElement.className = 'pill-name'
      pillNameElement.textContent =
        pillNameText.length > 15
          ? pillNameText.substring(0, 13) + '...'
          : pillNameText
      const removeIcon = document.createElement('span')
      removeIcon.className = 'pill-remove-icon'
      removeIcon.innerHTML = '×'
      removeIcon.addEventListener('click', function () {
        const userIdToRemove = this.parentElement.dataset.userId
        selectedGroupChatUserIds = selectedGroupChatUserIds.filter(
          (id) => id !== userIdToRemove
        )
        const checkbox = usersList.querySelector(
          `.group-chat-modal-checkbox[data-user-id="${userIdToRemove}"]`
        )
        if (checkbox) checkbox.classList.remove('checked')

        const currentPillsContainer = document.getElementById('selectedUserPillsContainer')
        const currentUsersList = document.getElementById('groupChatUsersList')
        const currentCountElement = document.getElementById('selectedUsersCount')

        if (currentPillsContainer && currentUsersList)
          renderSelectedUserPills(currentPillsContainer, currentUsersList)
        if (currentCountElement) updateSelectedUsersCount(currentCountElement)
      })
      pill.appendChild(pillNameElement)
      pill.appendChild(removeIcon)
      pillsContainer.appendChild(pill)
    }
  })
}

function setupRoleFilters() {
  const roleButtons = document.querySelectorAll('.group-chat-modal-role-btn')
  const usersList = document.getElementById('groupChatUsersList')
  const countElement = document.getElementById('selectedUsersCount')
  const pillsContainer = document.getElementById('selectedUserPillsContainer')

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('active')
      button.classList.toggle('inactive', !button.classList.contains('active'))
      loadGroupChatUsers(usersList, countElement, pillsContainer)
    })
  })
}

function createChatItemElement(chat) {
    const defaultAvatarSrc = '/static/accounts/images/cosmochat/group_avatar.svg';
    let avatarUrl = defaultAvatarSrc;
    let avatarAlt = chat.name || `Чат ${chat.conversation_id}`;
    let chatType = chat.is_group_chat ? 'group' : 'personal';

    if (chatType === 'personal' && chat.participant && chat.participant.profile_picture_url) {
        avatarUrl = chat.participant.profile_picture_url;
        avatarAlt = `${chat.participant.first_name || 'Чат'} ${chat.participant.last_name || ''}`.trim();
    }

    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item-new';
    chatItem.dataset.chatId = chat.conversation_id;
    chatItem.dataset.chatName = chat.name || `Чат ${chat.conversation_id}`;
    chatItem.dataset.chatType = chatType;
    chatItem.dataset.isDeal = chat.is_deal ? 'true' : 'false';

    chatItem.innerHTML = `
        <img src="${avatarUrl}" alt="${avatarAlt}" class="chat-avatar-img">
        <div class="chat-item-info-new">
            <h4>
                ${(chat.name || `Чат ${chat.conversation_id}`).substring(0, 25)}${(chat.name || `Чат ${chat.conversation_id}`).length > 25 ? '...' : ''}
                ${chat.is_deal ? '<span class="deal-indicator" title="Сделка"><img src="/static/accounts/images/cosmochat/deal_icon.svg" alt="Сделка" class="deal-icon"></span>' : ''}
            </h4>
            <p class="last-message-preview">Нет сообщений</p>
        </div>
        <div class="chat-item-meta-new">
            <span class="timestamp-chat"></span>
            <span class="date-chat-preview"></span>
        </div>
    `;

    chatItem.addEventListener('click', function () {
        if (typeof loadChat === 'function') {
            loadChat(this.dataset.chatId);
        }
    });

    return chatItem;
}

document.addEventListener('DOMContentLoaded', function() {
  // Находим все чекбоксы ролей
  const roleCheckboxes = document.querySelectorAll('.django-roles-filter input[type="checkbox"][name="roles"]');
  // Находим все карточки пользователей
  const userCards = document.querySelectorAll('.user-card-new');

  function filterUsersByRole() {
      // Собираем выбранные роли
      const selectedRoles = Array.from(roleCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value.toLowerCase());

      userCards.forEach(card => {
          const userRole = (card.dataset.role || '').toLowerCase();
          // Если ни одна роль не выбрана — показываем всех
          if (selectedRoles.length === 0 || selectedRoles.includes(userRole)) {
              card.style.display = '';
          } else {
              card.style.display = 'none';
          }
      });
  }

  // Вешаем обработчик на каждый чекбокс
  roleCheckboxes.forEach(cb => {
      cb.addEventListener('change', filterUsersByRole);
  });

  // Вызываем фильтрацию при первой загрузке (если что-то выбрано)
  filterUsersByRole();
});