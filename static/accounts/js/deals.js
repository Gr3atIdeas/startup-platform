function loadChat(chatId) {
    window.location.href = `?chat_id=${chatId}&status=${encodeURIComponent('{{ current_status }}')}`;
}
