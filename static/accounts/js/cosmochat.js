let currentChatId = null
let currentProfileUserId = null
let lastMessageTimestamp = null
let pollingInterval = null
let currentParticipants = []
let displayedMessageIds = new Set()
let isDragging = false
let startX
let scrollLeft
let selectedGroupChatUserIds = []
let currentPage = 1
const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value
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
const addParticipantBtn = document.getElementById('addParticipantBtn')
const leaveChatBtn = document.getElementById('leaveChatBtn')
const groupChatModal = document.getElementById('groupChatModal')
const groupChatContentWrapper = document.getElementById('groupChatModalContentWrapper')
const groupChatDetailsView = document.getElementById('groupChatDetailsView')
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
    startPolling();
    if (messageFormNew && !messageFormNew.dataset.eventListener) {
        messageFormNew.dataset.eventListener = 'true';
        messageFormNew.addEventListener('submit', handleSendMessage);
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new_chat') === 'true' && urlParams.get('open_chat_id')) {
        const newChatId = urlParams.get('open_chat_id');
        loadChat(newChatId);
    }
    else if (urlParams.get('chat_id')) {
        const chatId = urlParams.get('chat_id');
        console.log('Opening chat from URL parameter:', chatId);
        setTimeout(() => {
            loadChat(chatId).then(() => {
                const chatWindowColumn = document.getElementById('chatWindowColumn');
                if (chatWindowColumn) {
                    chatWindowColumn.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }).catch((error) => {
                console.error('Failed to load chat from URL:', error);
                showNoChatSelected();
            });
        }, 1000);
    }
    else if (!currentChatId) {
        showNoChatSelected();
    }
    const userCardsRatingContainers = document.querySelectorAll(
        '.users-list-new .user-card-new .rating-stars-new'
    );
    userCardsRatingContainers.forEach((container) => {
        updateUserRatingDisplay(container);
    });
    setupSearchDropdown();
    updatePaginationHTML();
    const startDealBtn = document.getElementById('startDealBtn');
    const leaveChatBtn = document.getElementById('leaveChatBtn');
    const renameChatBtn = document.getElementById('renameChatBtn');
    const participantsBtn = document.getElementById('participantsBtn');
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
    const groupChatModalOverlay = document.getElementById('groupChatModal');
    if (groupChatModalOverlay && !groupChatModalOverlay.dataset.eventListener) {
        groupChatModalOverlay.dataset.eventListener = 'true';
        groupChatModalOverlay.addEventListener('click', function (event) {
            if (event.target === groupChatModalOverlay) {
                closeGroupChatModal();
            }
        });
    }
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
    const closeGroupChatModalBtn = document.getElementById('closeGroupChatModalBtn');
    if (closeGroupChatModalBtn && !closeGroupChatModalBtn.dataset.eventListener) {
        closeGroupChatModalBtn.dataset.eventListener = 'true';
        closeGroupChatModalBtn.addEventListener('click', function () {
            closeGroupChatModal();
        });
    }
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
    setupRoleFilters();
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
                        startPolling();
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
    if (chatMessagesArea) chatMessagesArea.innerHTML = ''
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
                resolve();
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
                if (messageTextInput) messageTextInput.style.height = 'auto'
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
                    updateChatList(data.chats, chatListContainer);

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


                             if (newMessages.length > 0) {
                                 updateChatListItem(newMessages[newMessages.length - 1]);


                                 const chatItem = chatListContainer.querySelector(`.chat-item-new[data-chat-id="${currentChatId}"]`);
                                 if (chatItem) {
                                     const unreadBadge = chatItem.querySelector('.unread-badge-chat');
                                     if (unreadBadge) {

                                         const unreadCount = newMessages.filter(msg =>
                                             msg.sender_id != window.REQUEST_USER_ID && !msg.is_read
                                         ).length;

                                         if (unreadCount > 0) {
                                             unreadBadge.textContent = unreadCount;
                                             unreadBadge.style.display = 'inline';
                                         } else {
                                             unreadBadge.style.display = 'none';
                                         }
                                     }
                                 }
                             }
                         } else {
                             console.error('Ошибка опроса:', data.error);
                         }
                    }
                })
                .catch(error => {
                    console.error('Ошибка при опросе новых сообщений:', error);
                });
        }
    }, 5000);
}

function updateChatList(newChats, container) {
    const existingChats = new Map();
    const existingChatElements = container.querySelectorAll('.chat-item-new');

    existingChatElements.forEach(element => {
        const chatId = element.dataset.chatId;
        if (chatId) {
            existingChats.set(chatId, element);
        }
    });

    const fragment = document.createDocumentFragment();

    newChats.forEach(chat => {
        if (!chat.is_deleted && (!chat.has_left || (window.REQUEST_USER_ID && requestUserRole === 'moderator'))) {
            const existingElement = existingChats.get(chat.conversation_id);

            if (existingElement) {
                updateExistingChatElement(existingElement, chat);
                fragment.appendChild(existingElement);
                existingChats.delete(chat.conversation_id);
            } else {
                const newChatElement = createChatItemElement(chat);
                fragment.appendChild(newChatElement);
            }
        }
    });

    existingChats.forEach(element => {
        element.remove();
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

function updateExistingChatElement(element, chat) {
    const currentName = element.dataset.chatName;
    const newName = chat.name || `Чат ${chat.conversation_id}`;

    if (currentName !== newName) {
        element.dataset.chatName = newName;
        const nameElement = element.querySelector('h4');
        if (nameElement) {
            nameElement.innerHTML = `
                ${newName.substring(0, 25)}${newName.length > 25 ? '...' : ''}
                ${chat.is_deal ? '<span class="deal-indicator" title="Сделка"><img src="/static/accounts/images/cosmochat/deal_icon.svg" alt="Сделка" class="deal-icon"></span>' : ''}
            `;
        }
    }

    const isDeal = chat.is_deal ? 'true' : 'false';
    if (element.dataset.isDeal !== isDeal) {
        element.dataset.isDeal = isDeal;
    }

    const chatType = chat.is_group_chat ? 'group' : 'personal';
    if (element.dataset.chatType !== chatType) {
        element.dataset.chatType = chatType;
    }

    const avatarElement = element.querySelector('.chat-avatar-img');
    if (avatarElement) {
        const defaultAvatarSrc = '/static/accounts/images/cosmochat/group_avatar.svg';
        let avatarUrl = defaultAvatarSrc;
        let avatarAlt = newName;

        if (chatType === 'personal' && chat.participant && chat.participant.profile_picture_url) {
            avatarUrl = chat.participant.profile_picture_url;
            avatarAlt = `${chat.participant.first_name || 'Чат'} ${chat.participant.last_name || ''}`.trim();
        }

        if (avatarElement.src !== avatarUrl) {
            avatarElement.src = avatarUrl;
            avatarElement.alt = avatarAlt;
        }
    }

    const lastMessagePreview = element.querySelector('.last-message-preview');
    const timestampChat = element.querySelector('.timestamp-chat');
    const dateChatPreview = element.querySelector('.date-chat-preview');
    const unreadBadge = element.querySelector('.unread-badge-chat');

    if (chat.last_message) {
        if (lastMessagePreview) {
            let previewText = '';
            if (chat.last_message.sender_id == window.REQUEST_USER_ID) {
                previewText = 'Вы: ';
            }
            previewText += chat.last_message.message_text;
            lastMessagePreview.textContent = previewText.substring(0, 30) + (previewText.length > 30 ? '...' : '');
        }

        if (timestampChat) {
            timestampChat.textContent = chat.last_message.created_at_time || '';
        }

        if (dateChatPreview) {
            dateChatPreview.textContent = chat.last_message.created_at_date || '';
        }
    } else {
        if (lastMessagePreview) {
            lastMessagePreview.textContent = 'Нет сообщений';
        }
        if (timestampChat) {
            timestampChat.textContent = '';
        }
        if (dateChatPreview) {
            dateChatPreview.textContent = '';
        }
    }

    if (unreadBadge) {
        if (chat.unread_count > 0) {
            unreadBadge.textContent = chat.unread_count;
            unreadBadge.style.display = 'inline';
        } else {
            unreadBadge.style.display = 'none';
        }
    }
}
document.addEventListener('DOMContentLoaded', function () {
    const requestUserRoleElement = document.getElementById('request_user_role_data');
    if (requestUserRoleElement && requestUserRoleElement.textContent) {
        const roleData = JSON.parse(requestUserRoleElement.textContent);
        if (roleData) {
            window.requestUserRole = roleData.role_name;
        } else {
            console.warn('REQUEST_USER_ROLE не установлен. Получено пустое значение из JSON.');
        }
    } else {
        console.error('Элемент request_user_role_data не найден или пуст. Проверьте шаблон.');
    }
});
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
        console.log('Response status:', response.status);
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
            loadChat(chatId).then(() => {
                startPolling();
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
function removeParticipant(chatId, userId) {
    if (confirm('Исключить участника из чата?')) {
        fetch(`/cosmochat/remove-participant/${chatId}/?user_id=${userId}`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    loadChat(chatId);
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
    (isOwnMessageSentJustNow && msg.sender_id == window.REQUEST_USER_ID)
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
      if (
        lastMessage.sender_id == window.REQUEST_USER_ID ||
        lastMessage.is_read
      ) {
        unreadBadge.style.display = 'none';
      } else {

        unreadBadge.style.display = 'inline';

        const currentCount = parseInt(unreadBadge.textContent) || 0;
        if (lastMessage.sender_id != window.REQUEST_USER_ID && !lastMessage.is_read) {
          unreadBadge.textContent = currentCount + 1;
        }
      }
    }
  }
}
function openProfileModal(userId) {
  currentProfileUserId = userId
  if (typeof startChatBtn !== 'undefined' && startChatBtn) startChatBtn.disabled = true;
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
      profileModal.style.display = 'flex';
      profileModal.classList.add('active');
      if (typeof startChatBtn !== 'undefined' && startChatBtn) startChatBtn.disabled = false;
    })
    .catch((error) => {
      console.error('Ошибка загрузки профиля:', error)
      alert('Произошла ошибка при загрузке профиля.')
      if (typeof startChatBtn !== 'undefined' && startChatBtn) startChatBtn.disabled = false;
    })
}
function closeProfileModal() {
  if (profileModal) {
    profileModal.classList.remove('active');
    profileModal.style.display = 'none';
  }
  currentProfileUserId = null
}
function startChat() {
  const userId = currentProfileUserId
  if (!userId) {
    alert('Ошибка: пользователь не выбран')
    return
  }
  if (typeof startChatBtn !== 'undefined' && startChatBtn) startChatBtn.disabled = true;
  fetch(`/cosmochat/start-chat/${userId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      const chatId = data.chat_id || (data.chat && data.chat.conversation_id);
      if (data.success && chatId) {
        let chatExists = false
        document.querySelectorAll('.chat-item-new').forEach((item) => {
          if (item.dataset.chatId == chatId) {
            chatExists = true
          }
        })
        if (chatExists) {
          loadChat(chatId)
          document
            .querySelector('.main-chat-area-new')
            .scrollIntoView({ behavior: 'smooth' })
        } else if (data.chat) {
          const newChatItem = createChatItemElement(data.chat)
          if (newChatItem) {
            const chatListContainer = document.getElementById('chatListContainer')
            const noChatsMessage = chatListContainer.querySelector('p')
            if (noChatsMessage) {
              noChatsMessage.remove()
            }
            startPolling()
            waitForChatInDOM(chatId, 3000)
              .then(() => {
                loadChat(chatId).then(() => {
                  if (typeof closeProfileModal === 'function') closeProfileModal();
                  document.querySelector('.main-chat-area-new').scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              })
              .catch(() => {
                window.showNotification('Чат создан, но не удалось его сразу открыть. Обновите страницу.', 'warning');
              });
          }
        } else {
          loadChat(chatId)
          document
            .querySelector('.main-chat-area-new')
            .scrollIntoView({ behavior: 'smooth' })
        }
        closeProfileModal()
      } else {
        alert(data.error || 'Ошибка при создании чата')
      }
      if (typeof startChatBtn !== 'undefined' && startChatBtn) startChatBtn.disabled = false;
    })
    .catch(() => {
      alert('Произошла ошибка при создании чата')
      if (typeof startChatBtn !== 'undefined' && startChatBtn) startChatBtn.disabled = false;
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
function showConfirmModal(message, onConfirm, onCancel) {
  let oldModal = document.getElementById('custom-confirm-modal-overlay');
  if (oldModal) oldModal.remove();
  const overlay = document.createElement('div');
  overlay.id = 'custom-confirm-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.zIndex = 20000;
  const modal = document.createElement('div');
  modal.className = 'modal-popup';
  modal.style.background = 'rgba(34, 34, 34, 0.95)';
  modal.style.color = 'white';
  modal.style.borderRadius = '20px';
  modal.style.boxShadow = '0 15px 40px rgb(0 0 0 / 50%)';
  modal.style.padding = '40px 32px 32px 32px';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.maxWidth = '350px';
  modal.style.width = '100%';
  modal.style.position = 'relative';
  const text = document.createElement('div');
  text.textContent = message;
  text.style.fontSize = '18px';
  text.style.marginBottom = '32px';
  text.style.textAlign = 'center';
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '18px';
  btnRow.style.justifyContent = 'center';
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Выйти';
  confirmBtn.className = 'btn promo-action-button';
  confirmBtn.style.background = 'linear-gradient(180deg, #ffef2b 0%, #f9f7d6 100%)';
  confirmBtn.style.color = '#191919';
  confirmBtn.style.fontWeight = 'bold';
  confirmBtn.style.fontSize = '16px';
  confirmBtn.style.padding = '10px 28px';
  confirmBtn.style.borderRadius = '10px';
  confirmBtn.style.border = 'none';
  confirmBtn.style.cursor = 'pointer';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Отмена';
  cancelBtn.className = 'btn';
  cancelBtn.style.background = 'rgba(255,255,255,0.12)';
  cancelBtn.style.color = '#fff';
  cancelBtn.style.fontWeight = 'bold';
  cancelBtn.style.fontSize = '16px';
  cancelBtn.style.padding = '10px 28px';
  cancelBtn.style.borderRadius = '10px';
  cancelBtn.style.border = 'none';
  cancelBtn.style.cursor = 'pointer';
  btnRow.appendChild(confirmBtn);
  btnRow.appendChild(cancelBtn);
  modal.appendChild(text);
  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  confirmBtn.onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };
  cancelBtn.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  document.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escListener);
    }
  });
}
window.customConfirm = function(message) {
  return new Promise((resolve) => {
    let oldModal = document.getElementById('custom-confirm-modal-overlay');
    if (oldModal) oldModal.remove();
    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.zIndex = 20000;
    const modal = document.createElement('div');
    modal.className = 'modal-popup';
    modal.style.background = 'rgba(34, 34, 34, 0.95)';
    modal.style.color = 'white';
    modal.style.borderRadius = '20px';
    modal.style.boxShadow = '0 15px 40px rgb(0 0 0 / 50%)';
    modal.style.padding = '40px 32px 32px 32px';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.maxWidth = '350px';
    modal.style.width = '100%';
    modal.style.position = 'relative';
    const text = document.createElement('div');
    text.textContent = message;
    text.style.fontSize = '18px';
    text.style.marginBottom = '32px';
    text.style.textAlign = 'center';
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '18px';
    btnRow.style.justifyContent = 'center';
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Выйти';
    confirmBtn.className = 'btn promo-action-button';
    confirmBtn.style.background = 'linear-gradient(180deg, #ffef2b 0%, #f9f7d6 100%)';
    confirmBtn.style.color = '#191919';
    confirmBtn.style.fontWeight = 'bold';
    confirmBtn.style.fontSize = '16px';
    confirmBtn.style.padding = '10px 28px';
    confirmBtn.style.borderRadius = '10px';
    confirmBtn.style.border = 'none';
    confirmBtn.style.cursor = 'pointer';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.className = 'btn';
    cancelBtn.style.background = 'rgba(255,255,255,0.12)';
    cancelBtn.style.color = '#fff';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.fontSize = '16px';
    cancelBtn.style.padding = '10px 28px';
    cancelBtn.style.borderRadius = '10px';
    cancelBtn.style.border = 'none';
    cancelBtn.style.cursor = 'pointer';
    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(cancelBtn);
    modal.appendChild(text);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    confirmBtn.onclick = () => {
      overlay.remove();
      resolve(true);
    };
    cancelBtn.onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
    document.addEventListener('keydown', function escListener(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escListener);
        resolve(false);
      }
    });
  });
};
window.confirm = window.customConfirm;
let isLeavingChat = false;
async function leaveChat() {
  if (isLeavingChat) return;
  if (!currentChatId) {
    window.showNotification('Выберите чат', 'warning');
    return;
  }
  const confirmed = await window.confirm('Вы уверены, что хотите покинуть/удалить этот чат?');
  if (!confirmed) return;
  isLeavingChat = true;
  fetch(`/cosmochat/leave-chat/${currentChatId}/`, {
    method: 'POST',
    headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.showNotification(data.message || 'Вы покинули чат.', 'success');
        currentChatId = null;
        location.reload();
      } else {
        window.showNotification(data.error || 'Ошибка при выходе из чата', 'error');
      }
      isLeavingChat = false;
    })
    .catch(error => {
      console.error('Ошибка выхода из чата:', error);
      window.showNotification('Произошла ошибка при выходе из чата.', 'error');
      isLeavingChat = false;
    });
}
if (messageTextInput) {
  messageTextInput.addEventListener('input', () => {
    messageTextInput.style.height = 'auto'
    messageTextInput.style.height = messageTextInput.scrollHeight + 'px'
  })
}
document.addEventListener('DOMContentLoaded', function () {
    const requestUserIdElement = document.getElementById('request_user_id_data')
    if (requestUserIdElement && requestUserIdElement.textContent) {
        const requestUserIdData = JSON.parse(requestUserIdElement.textContent)
        if (requestUserIdData) {
            window.REQUEST_USER_ID = parseInt(requestUserIdData)
        } else {
            console.warn(
                'REQUEST_USER_ID не установлен. Получено пустое значение из JSON.'
            )
        }
    } else {
        console.error(
            'Элемент request_user_id_data не найден или пуст. Проверьте шаблон.'
        )
        const bodyUserId = document.body.dataset.userId
        if (bodyUserId) {
            window.REQUEST_USER_ID = parseInt(bodyUserId)
        } else {
            console.warn(
                'REQUEST_USER_ID не установлен. Некоторые функции чата могут работать некорректно.'
            )
        }
    }
})
function updateUserRatingDisplay(starsContainer) {
  if (!starsContainer) {
    console.error(
      '[updateUserRatingDisplay] Container not found for user card.'
    )
    return
  }
  const ratingString = starsContainer.dataset.rating
  if (typeof ratingString === 'undefined') {
    console.warn(
      '[updateUserRatingDisplay] data-rating attribute not found on container:',
      starsContainer
    )
    return
  }
  const iconContainers = starsContainer.querySelectorAll(
    '.rating-icon-planet-container'
  )
  const ratingValue = parseFloat(ratingString) || 0
  iconContainers.forEach((container, index) => {
    const filledIcon = container.querySelector('.icon-filled')
    if (!filledIcon) {
      console.warn(
        `[updateUserRatingDisplay] Filled icon not found in planet container ${index + 1}`
      )
      return
    }
    const emptyIcon = container.querySelector('.icon-empty')
    if (!emptyIcon) {
      console.warn(
        `[updateUserRatingDisplay] Empty icon not found in planet container ${index + 1}`
      )
      return
    }
    if (index < Math.floor(ratingValue)) {
      filledIcon.style.width = '100%'
    } else if (index === Math.floor(ratingValue) && ratingValue % 1 > 0) {
      const percentage = (ratingValue % 1) * 100
      filledIcon.style.width = `${percentage}%`
    } else {
      filledIcon.style.width = '0%'
    }
  })
}
function filterChats(filter) {
  const chatItems = document.querySelectorAll(
    '.chat-items-list-new .chat-item-new'
  )
  const paginationContainer = document.getElementById('chatPagination')
  const showMoreContainer = document.querySelector(
    '.pagination-new:has(#showMoreChatsBtn)'
  )
  if (filter === 'all') {
    if (paginationContainer) paginationContainer.style.display = 'flex'
    if (showMoreContainer) showMoreContainer.style.display = 'flex'
    chatItems.forEach((item) => (item.style.display = ''))
    const currentPageBtn = document.querySelector(
      '#chatPagination .page-number-item.current'
    )
    if (currentPageBtn) {
      const currentPage = parseInt(currentPageBtn.dataset.page)
      showChatPage(currentPage)
    }
  } else {
    if (paginationContainer) paginationContainer.style.display = 'none'
    if (showMoreContainer) showMoreContainer.style.display = 'none'
    chatItems.forEach((item) => {
      const type = item.getAttribute('data-chat-type')
      if (filter === 'chats' && type === 'personal') {
        item.style.display = 'flex'
      } else if (filter === 'groups' && type === 'group') {
        item.style.display = 'flex'
      } else {
        item.style.display = 'none'
      }
    })
  }
}
function startChatWithUser(userId) {
  fetch(`/cosmochat/start-chat/${userId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Сетевая ошибка: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      if (data.success) {
        if (data.existed) {
          loadChat(data.chat_id).then(() => {
            if (typeof closeProfileModal === 'function') closeProfileModal();
          });
        } else {
          const newChatItem = createChatItemElement(data.chat)
          if (newChatItem) {
            const chatListContainer = document.getElementById('chatListContainer')
            const noChatsMessage = chatListContainer.querySelector('p')
            if (noChatsMessage) {
              noChatsMessage.remove()
            }


            chatListContainer.prepend(newChatItem)


            setTimeout(() => {
                const chatItem = chatListContainer.querySelector(`.chat-item-new[data-chat-id="${data.chat.conversation_id}"]`);
                if (chatItem) {

                    const timestampChat = chatItem.querySelector('.timestamp-chat');
                    const dateChatPreview = chatItem.querySelector('.date-chat-preview');

                    if (timestampChat) {
                        const now = new Date();
                        timestampChat.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    }

                    if (dateChatPreview) {
                        const now = new Date();
                        dateChatPreview.textContent = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                    }
                }
            }, 100);

            startPolling();
            waitForChatInDOM(data.chat.conversation_id, 3000)
              .then(() => {
                loadChat(data.chat.conversation_id).then(() => {
                  if (typeof closeProfileModal === 'function') closeProfileModal();
                  document.querySelector('.main-chat-area-new').scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              })
              .catch(() => {
                window.showNotification('Чат создан, но не удалось его сразу открыть. Обновите страницу.', 'warning');
              });
          }
        }
        const searchDropdown = document.getElementById('searchDropdown')
        if (searchDropdown) searchDropdown.style.display = 'none'
        document
          .querySelector('.main-chat-area-new')
          .scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        alert(`Не удалось начать чат: ${data.error || 'Неизвестная ошибка'}`)
      }
    })
    .catch((error) => {
      console.error('Ошибка при создании чата:', error)
      alert('Произошла критическая ошибка при попытке начать чат.')
    })
}
function createGroupChat(chatName, userIds) {
  if (!chatName || userIds.length === 0) {
    alert('Необходимо указать название чата и выбрать участников.')
    return
  }
  fetch('/cosmochat/create-group-chat/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ name: chatName, user_ids: userIds }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Сетевая ошибка: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      if (data.success && data.chat) {
        const newChatItem = createChatItemElement(data.chat)
        if (newChatItem) {
          const chatListContainer = document.getElementById('chatListContainer')
          const noChatsMessage = chatListContainer.querySelector('p')
          if (noChatsMessage) {
            noChatsMessage.remove()
          }
                     chatListContainer.prepend(newChatItem)


           setTimeout(() => {
               const chatItem = chatListContainer.querySelector(`.chat-item-new[data-chat-id="${data.chat.conversation_id}"]`);
               if (chatItem) {

                   const timestampChat = chatItem.querySelector('.timestamp-chat');
                   const dateChatPreview = chatItem.querySelector('.date-chat-preview');

                   if (timestampChat) {
                       const now = new Date();
                       timestampChat.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                   }

                   if (dateChatPreview) {
                       const now = new Date();
                       dateChatPreview.textContent = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                   }
               }
           }, 100);

           loadChat(data.chat.conversation_id)
        }
        if (typeof closeGroupChatModal === 'function') {
          closeGroupChatModal()
        }
        document
          .querySelector('.main-chat-area-new')
          .scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        alert(
          `Ошибка создания группового чата: ${data.error || 'Неизвестная ошибка'}`
        )
      }
    })
    .catch((error) => {
      console.error('Ошибка при создании группового чата:', error)
      alert('Произошла критическая ошибка при создании группового чата.')
    })
}
function openCreateChatModal() {
}
function setupSearchDropdown() {
  const searchInput = document.querySelector('.search-query-input')
  const searchDropdown = document.getElementById('searchDropdown')
  if (!searchInput || !searchDropdown) return
  searchInput.addEventListener('focus', function () {
    searchDropdown.style.display = 'block'
    loadDropdownData()
  })
  document.addEventListener('click', function (event) {
    if (
      !searchInput.contains(event.target) &&
      !searchDropdown.contains(event.target)
    ) {
      searchDropdown.style.display = 'none'
    }
  })
  searchDropdown.addEventListener('click', function (event) {
    event.stopPropagation()
  })
  const clearButtons = document.querySelectorAll('.search-dropdown-clear')
  clearButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const section = this.getAttribute('data-section')
      clearSearchSection(section)
    })
  })
  const userContainers = document.querySelectorAll('.search-dropdown-users')
  userContainers.forEach((container) => {
    container.addEventListener('selectstart', function (e) {
      if (isDragging) {
        e.preventDefault()
        return false
      }
    })
    container.addEventListener('mousedown', function (e) {
      isDragging = true
      startX = e.pageX - container.offsetLeft
      scrollLeft = container.scrollLeft
      container.style.cursor = 'grabbing'
      e.preventDefault()
      document.body.style.userSelect = 'none'
    })
    container.addEventListener('mouseup', function () {
      isDragging = false
      container.style.cursor = 'grab'
      document.body.style.userSelect = ''
    })
    container.addEventListener('mouseleave', function () {
      isDragging = false
      container.style.cursor = 'grab'
      document.body.style.userSelect = ''
    })
    container.addEventListener('mousemove', function (e) {
      if (!isDragging) return
      e.preventDefault()
      const x = e.pageX - container.offsetLeft
      const walk = (x - startX) * 2
      container.scrollLeft = scrollLeft - walk
    })
    container.style.cursor = 'grab'
  })
}
function loadDropdownData() {
  const userCards = document.querySelectorAll('.user-card-new')
  const users = []
  userCards.forEach((card) => {
    const userId = card.dataset.userId
    const avatarImg = card.querySelector('.avatar-img')
    const nameElement = card.querySelector('h3')
    if (userId && nameElement) {
      const name = nameElement.textContent.trim()
      const avatarSrc = avatarImg
        ? avatarImg.src
        : '/static/accounts/images/avatars/default_avatar_ufo.png'
      const role = card.dataset.role
      users.push({
        user_id: userId,
        first_name: name,
        profile_picture_url: avatarSrc,
        role: role,
      })
    }
  })
  const recentUsers = users.slice(0, 5)
  const investorUsers = users.filter((user) => user.role === 'investor')
  const startuperUsers = users.filter((user) => user.role === 'startuper')
  populateUserSection('recentUsers', recentUsers)
  populateUserSection('investorUsers', investorUsers)
  populateUserSection('startuperUsers', startuperUsers)
}
function populateUserSection(sectionId, users) {
  const section = document.getElementById(sectionId)
  if (!section) return
  section.innerHTML = ''
  if (users && users.length > 0) {
    users.forEach((user) => {
      const userItem = document.createElement('div')
      userItem.className = 'search-dropdown-user'
      userItem.setAttribute('data-user-id', user.user_id)
      const defaultAvatarSrc =
        '/static/accounts/images/avatars/default_avatar_ufo.png'
      const avatarSrc = user.profile_picture_url || defaultAvatarSrc
      userItem.innerHTML = `
                <img src="${avatarSrc}" alt="${user.first_name}" draggable="false">
                <div class="search-dropdown-user-name">${user.first_name}</div>
            `
      userItem.addEventListener('click', function () {
        startChatWithUser(user.user_id)
      })
      section.appendChild(userItem)
    })
  } else {
    section.innerHTML =
      '<div class="search-dropdown-empty">Нет пользователей</div>'
  }
}
function clearSearchSection(section) {
  const sectionId =
    section === 'recent'
      ? 'recentUsers'
      : section === 'investors'
        ? 'investorUsers'
        : section === 'startupers'
          ? 'startuperUsers'
          : null
  if (sectionId) {
    const sectionElement = document.getElementById(sectionId)
    if (sectionElement) {
      sectionElement.innerHTML =
        '<div class="search-dropdown-empty">Нет пользователей</div>'
    }
  }
}
function updatePaginationHTML() {
    const usersList = document.getElementById('usersList')
    const userCards = usersList
        ? usersList.querySelectorAll('.user-card-new')
        : []
    const paginationContainer = document.getElementById('userPagination')
    if (!usersList || !paginationContainer || userCards.length === 0) return
    const itemsPerPage = 8
    const totalPages = Math.ceil(userCards.length / itemsPerPage)


    if (currentPage > totalPages) {
        currentPage = 1
    }

    let paginationHTML = ''
    paginationHTML += `<span class="page-number-item" data-page="prev">‹</span>`
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<span class="page-number-item ${i === currentPage ? 'current' : ''}" data-page="${i}">${i}</span>`
        }
    } else {
        for (let i = 1; i <= 3; i++) {
            paginationHTML += `<span class="page-number-item ${i === currentPage ? 'current' : ''}" data-page="${i}">${i}</span>`
        }
        paginationHTML += `<span class="dots">...</span>`
        for (let i = totalPages - 2; i <= totalPages; i++) {
            paginationHTML += `<span class="page-number-item" data-page="${i}">${i}</span>`
        }
    }
    paginationHTML += `<span class="page-number-item" data-page="next">›</span>`
    paginationContainer.innerHTML = paginationHTML

    const pageButtons = paginationContainer.querySelectorAll('.page-number-item')
    pageButtons.forEach((button) => {
        if (button.classList.contains('dots')) return
        button.addEventListener('click', function () {
            const page = this.dataset.page
            if (page === 'prev') {
                if (currentPage > 1) {
                    currentPage--
                    showPage(currentPage)
                }
            } else if (page === 'next') {
                if (currentPage < totalPages) {
                    currentPage++
                    showPage(currentPage)
                }
            } else {
                currentPage = parseInt(page)
                showPage(currentPage)
            }
        })
    })


    if (userCards.length > 0) {
        showPage(currentPage)
    }
}
let additionalUsersShown = 0
function showMoreUsers() {
    const usersList = document.getElementById('usersList')
    const hiddenUserCards = usersList
        ? usersList.querySelectorAll('.user-card-new.hidden-user')
        : []
    const paginationContainer = document.getElementById('userPagination')
    const showMoreBtn = document.getElementById('showMoreUsersBtn')
    if (!usersList || hiddenUserCards.length === 0) {
        if (showMoreBtn) showMoreBtn.style.display = 'none'
        return
    }
    if (paginationContainer) {
        paginationContainer.style.display = 'none'
    }


    currentPage = 1
    let buttonsContainer = document.querySelector('.pagination-buttons-container')
    if (!buttonsContainer) {
        buttonsContainer = document.createElement('div')
        buttonsContainer.className = 'pagination-buttons-container'
        const paginationNew = document.querySelector('.pagination-new')
        if (paginationNew) {
            paginationNew.appendChild(buttonsContainer)
        }
    }
    let hideBtn = document.getElementById('hideUsersBtn')
    if (!hideBtn) {
        hideBtn = document.createElement('button')
        hideBtn.id = 'hideUsersBtn'
        hideBtn.className = 'hide-btn-new'
        hideBtn.textContent = 'Скрыть'
        hideBtn.addEventListener('click', hideExtraUsers)
        buttonsContainer.appendChild(hideBtn)
    } else {
        hideBtn.style.display = 'flex'
    }
    if (showMoreBtn && showMoreBtn.parentElement !== buttonsContainer) {
        buttonsContainer.appendChild(showMoreBtn)
    }
    const showCount = Math.min(5, hiddenUserCards.length)
    for (let i = 0; i < showCount; i++) {
        hiddenUserCards[i].classList.remove('hidden-user')
        hiddenUserCards[i].classList.add('show-more-revealed')
        additionalUsersShown++
    }
    if (hiddenUserCards.length <= showCount) {
        if (showMoreBtn) showMoreBtn.style.display = 'none'
    }
}
function hideExtraUsers() {
    const usersList = document.getElementById('usersList')
    const paginationContainer = document.getElementById('userPagination')
    const buttonsContainer = document.querySelector('.pagination-buttons-container')
    const hideBtn = document.getElementById('hideUsersBtn')
    const showMoreBtn = document.getElementById('showMoreUsersBtn')
    if (paginationContainer) {
        paginationContainer.style.display = 'flex'
    }
    if (hideBtn) {
        hideBtn.style.display = 'none'
    }
    if (showMoreBtn && buttonsContainer) {
        document.querySelector('.pagination-new').appendChild(showMoreBtn)
        showMoreBtn.style.display = 'flex'
    }
    const revealedCards = usersList
        ? usersList.querySelectorAll('.user-card-new.show-more-revealed')
        : []
    revealedCards.forEach((card) => {
        card.classList.add('hidden-user')
        card.classList.remove('show-more-revealed')
    })
    additionalUsersShown = 0
    const currentPageBtn = document.querySelector('.page-number-item.current')
    if (currentPageBtn) {
        currentPage = parseInt(currentPageBtn.dataset.page)
        showPage(currentPage)
    }
}
function showPage(page) {
  const usersList = document.getElementById('usersList')
  const userCards = usersList
    ? usersList.querySelectorAll('.user-card-new')
    : []
  const itemsPerPage = 8
  if (!usersList || userCards.length === 0) return


  userCards.forEach((card) => {
    card.classList.add('hidden-user')
  })


  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  for (let i = startIndex; i < endIndex && i < userCards.length; i++) {
    userCards[i].classList.remove('hidden-user')
  }


  const currentPageBtn = document.querySelector('.page-number-item.current')
  if (currentPageBtn) {
    currentPageBtn.classList.remove('current')
  }

  const newCurrentPageBtn = document.querySelector(`[data-page="${page}"]`)
  if (newCurrentPageBtn && !newCurrentPageBtn.classList.contains('dots')) {
    newCurrentPageBtn.classList.add('current')
  }


  const showMoreBtn = document.getElementById('showMoreUsersBtn')
  if (showMoreBtn) {
    showMoreBtn.style.display = 'none'
  }


  const paginationContainer = document.getElementById('userPagination')
  if (paginationContainer) {
    paginationContainer.style.display = 'flex'
  }
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

    let lastMessageText = 'Нет сообщений';
    let timestampText = '';
    let dateText = '';
    let unreadBadgeHtml = '';

    if (chat.last_message) {
        let previewText = '';
        if (chat.last_message.sender_id == window.REQUEST_USER_ID) {
            previewText = 'Вы: ';
        }
        previewText += chat.last_message.message_text;
        lastMessageText = previewText.substring(0, 30) + (previewText.length > 30 ? '...' : '');


        if (chat.last_message.created_at_time) {
            timestampText = chat.last_message.created_at_time;
        } else if (chat.last_message.created_at) {
            try {
                const messageDate = new Date(chat.last_message.created_at);
                timestampText = messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                timestampText = '';
            }
        } else {
            timestampText = '';
        }

        if (chat.last_message.created_at_date) {
            dateText = chat.last_message.created_at_date;
        } else if (chat.last_message.created_at) {
            try {
                const messageDate = new Date(chat.last_message.created_at);
                dateText = messageDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            } catch (e) {
                dateText = '';
            }
        } else {
            dateText = '';
        }
    }

    if (chat.unread_count > 0) {
        unreadBadgeHtml = `<span class="unread-badge-chat">${chat.unread_count}</span>`;
    } else {
        unreadBadgeHtml = `<span class="unread-badge-chat" style="display: none;"></span>`;
    }

    chatItem.innerHTML = `
        <img src="${avatarUrl}" alt="${avatarAlt}" class="chat-avatar-img">
        <div class="chat-item-info-new">
            <h4>
                ${(chat.name || `Чат ${chat.conversation_id}`).substring(0, 25)}${(chat.name || `Чат ${chat.conversation_id}`).length > 25 ? '...' : ''}
                ${chat.is_deal ? '<span class="deal-indicator" title="Сделка"><img src="/static/accounts/images/cosmochat/deal_icon.svg" alt="Сделка" class="deal-icon"></span>' : ''}
            </h4>
            <p class="last-message-preview">${lastMessageText}</p>
        </div>
        <div class="chat-item-meta-new">
            <span class="timestamp-chat">${timestampText}</span>
            ${unreadBadgeHtml}
            <span class="date-chat-preview">${dateText}</span>
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
  const roleCheckboxes = document.querySelectorAll('.django-roles-filter input[type="checkbox"][name="roles"]');
  const userCards = document.querySelectorAll('.user-card-new');
  function filterUsersByRole() {
      const selectedRoles = Array.from(roleCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value.toLowerCase());
      userCards.forEach(card => {
          const userRole = (card.dataset.role || '').toLowerCase();
          if (selectedRoles.length === 0 || selectedRoles.includes(userRole)) {
              card.style.display = '';
          } else {
              card.style.display = 'none';
          }
      });
  }
  roleCheckboxes.forEach(cb => {
      cb.addEventListener('change', filterUsersByRole);
  });
  filterUsersByRole();
});
function waitForChatInDOM(chatId, maxWaitMs = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const chatElem = chatListContainer.querySelector(`.chat-item-new[data-chat-id='${chatId}']`);
      if (chatElem) {
        resolve(chatElem);
      } else if (Date.now() - start > maxWaitMs) {
        reject(new Error('Чат не появился в DOM за отведённое время.'));
      } else {
        setTimeout(check, 100);
      }
    }
    check();
  });
}

