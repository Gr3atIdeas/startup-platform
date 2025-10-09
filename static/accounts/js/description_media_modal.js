/**
 * Модальное окно для управления медиа-контентом в описании
 */

class DescriptionMediaModal {
    constructor(options = {}) {
        this.entityType = options.entityType || 'startup';
        this.entityId = options.entityId || null;
        this.isCreateMode = !this.entityId;
        this.maxFiles = 20;
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.maxVideoSize = 50 * 1024 * 1024; // 50MB
        this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        
        this.modal = null;
        this.files = [];
        this.tempFiles = [];
        this.uploadingFiles = new Set();
        this.blobUrls = new Map();
        
        this.init();
    }
    
    init() {
        console.log('Modal init, isCreateMode:', this.isCreateMode, 'entityId:', this.entityId, 'entityType:', this.entityType);
        this.createModal();
        this.bindEvents();
    }
    
    createModal() {
        const existingModal = document.getElementById('descriptionMediaModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div id="descriptionMediaModal" class="modal-overlay" style="display: none;">
                <div class="modal-dialog media-modal-dialog">
                    <div class="modal-header">
                        <div class="modal-title">Управление медиа-контентом</div>
                        <button type="button" class="modal-close-btn" id="mediaModalCloseBtn">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="media-upload-section" style="padding: 15px; text-align: center;">
                            <input type="file" id="mediaFileInput" multiple accept="image/*,video/*" style="display: none;">
                            <button type="button" class="btn-upload-file" id="uploadFileBtn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                Выбрать файлы
                            </button>
                            <p style="margin-top: 10px; font-size: 12px; color: #666;">Изображения: JPG, PNG, GIF, WEBP (до 5MB) • Видео: MP4, MOV, AVI (до 50MB)</p>
                        </div>
                        <div class="media-gallery" id="mediaGallery">
                            <div class="gallery-header">
                                <h3>Загруженные файлы</h3>
                                <div class="gallery-actions">
                                    <button type="button" class="btn-clear-all" id="clearAllBtn" style="display: none;">Очистить все</button>
                                </div>
                            </div>
                            <div class="gallery-grid" id="galleryGrid">
                                <div class="gallery-empty" id="galleryEmpty">
                                    <p>Нет загруженных файлов</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="mediaModalCancelBtn">Отмена</button>
                        <button type="button" class="btn-primary" id="mediaModalSaveBtn" disabled>Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('descriptionMediaModal');
    }
    
    bindEvents() {
        const closeBtn = document.getElementById('mediaModalCloseBtn');
        const cancelBtn = document.getElementById('mediaModalCancelBtn');
        const uploadBtn = document.getElementById('uploadFileBtn');
        const fileInput = document.getElementById('mediaFileInput');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const saveBtn = document.getElementById('mediaModalSaveBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearAllFiles();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.saveFiles();
            });
        }
    }
    
    handleFileSelect(files) {
        const fileArray = Array.from(files);
        
        if (fileArray.length === 0) return;
        
        for (const file of fileArray) {
            if (!this.validateFile(file)) {
                this.resetFileInput();
                return;
            }
        }
        
        const totalFiles = this.files.length + fileArray.length;
        if (totalFiles > this.maxFiles) {
            this.showNotification(`Максимум ${this.maxFiles} файлов. У вас уже ${this.files.length} файлов.`, 'error');
            this.resetFileInput();
            return;
        }
        
        this.files.push(...fileArray);
        this.updateGallery();
        this.updateSaveButton();
        this.resetFileInput();
    }
    
    resetFileInput() {
        const fileInput = document.getElementById('mediaFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    validateFile(file) {
        const isImage = this.allowedImageTypes.includes(file.type);
        const isVideo = this.allowedVideoTypes.includes(file.type);
        
        if (!isImage && !isVideo) {
            this.showNotification(`Файл ${file.name} имеет неподдерживаемый тип`, 'error');
            return false;
        }
        
        const maxSize = isImage ? this.maxImageSize : this.maxVideoSize;
        if (file.size > maxSize) {
            const sizeMB = Math.round(maxSize / (1024 * 1024));
            this.showNotification(`Файл ${file.name} слишком большой. Максимум: ${sizeMB}MB`, 'error');
            return false;
        }
        
        return true;
    }
    
    updateGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        const galleryEmpty = document.getElementById('galleryEmpty');
        const clearAllBtn = document.getElementById('clearAllBtn');
        
        if (!galleryGrid) return;
        
        console.log('updateGallery called, files count:', this.files.length);
        
        if (this.files.length === 0) {
            if (galleryEmpty) galleryEmpty.style.display = 'block';
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            this.revokeBlobUrls();
            return;
        }
        
        if (galleryEmpty) galleryEmpty.style.display = 'none';
        if (clearAllBtn) clearAllBtn.style.display = 'block';
        
        this.revokeBlobUrls();
        
        galleryGrid.innerHTML = '';
        
        this.files.forEach((file, index) => {
            console.log('Creating item for file:', file);
            const fileItem = this.createFileItem(file, index);
            if (fileItem) {
                galleryGrid.appendChild(fileItem);
            }
        });
        
        console.log('Gallery updated with', this.files.length, 'files');
    }
    
    revokeBlobUrls() {
        this.blobUrls.forEach(url => URL.revokeObjectURL(url));
        this.blobUrls.clear();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    createFileItem(file, index) {
        const isImage = file.type.startsWith('image/');
        const fileItem = document.createElement('div');
        fileItem.className = 'gallery-item';
        fileItem.dataset.index = index;
        
        const escapedName = this.escapeHtml(file.name);
        let escapedUrl;
        
        if (file.isExisting) {
            escapedUrl = this.escapeHtml(file.url);
        } else {
            const blobUrl = URL.createObjectURL(file);
            this.blobUrls.set(index, blobUrl);
            escapedUrl = blobUrl;
        }
        
        let preview;
        if (file.isExisting) {
            preview = isImage ? 
                `<img src="${escapedUrl}" alt="${escapedName}" class="file-preview">` :
                `<div class="video-preview">
                    <div class="video-icon">▶</div>
                    <div class="video-name">${escapedName}</div>
                 </div>`;
        } else {
            preview = isImage ? 
                `<img src="${escapedUrl}" alt="${escapedName}" class="file-preview">` :
                `<div class="video-preview">
                    <div class="video-icon">▶</div>
                    <div class="video-name">${escapedName}</div>
                 </div>`;
        }
        
        const copyButtonHtml = this.isCreateMode ? '' : '<button type="button" class="btn-copy-url" data-index="' + index + '">Копировать URL</button>';
        const removeButtonHtml = (this.isCreateMode || file.isGallery) ? '' : '<button type="button" class="btn-remove-file" data-index="' + index + '">×</button>';
        const sourceLabel = file.isGallery ? '<span class="file-source-label" style="color: #28a745; font-size: 11px;">из галереи</span>' : '';
        
        fileItem.innerHTML = `
            <div class="file-preview-container">
                ${preview}
                <div class="file-overlay">
                    ${copyButtonHtml}
                    ${removeButtonHtml}
                </div>
            </div>
            <div class="file-info">
                <div class="file-name">${escapedName}</div>
                <div class="file-type">${isImage ? 'Изображение' : 'Видео'} ${sourceLabel}</div>
            </div>
        `;
        
        if (!this.isCreateMode) {
            const copyBtn = fileItem.querySelector('.btn-copy-url');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const currentIndex = parseInt(e.target.dataset.index, 10);
                    this.copyFileUrl(currentIndex);
                });
            }
        }
        
        const removeBtn = fileItem.querySelector('.btn-remove-file');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentIndex = parseInt(e.target.dataset.index, 10);
                this.removeFile(currentIndex);
            });
        }
        
        return fileItem;
    }
    
    copyFileUrl(index) {
        const file = this.files[index];
        if (!file) return;
        
        if (file.isExisting) {
            const isImage = file.type.startsWith('image/');
            const tag = isImage ? 
                `<img src="${file.url}" alt="${file.name}">` :
                `<video src="${file.url}" controls></video>`;
            
            this.copyToClipboard(tag);
            this.showNotification('HTML тег скопирован в буфер обмена', 'success');
            return;
        }
        
        const fileKey = `${file.name}_${file.size}_${file.lastModified || Date.now()}`;
        
        if (this.uploadingFiles.has(fileKey)) {
            this.showNotification('Файл уже загружается, подождите...', 'warning');
            return;
        }
        
        this.uploadingFiles.add(fileKey);
        
        this.uploadFile(file).then(result => {
            this.uploadingFiles.delete(fileKey);
            
            if (result.success) {
                const fileData = result.files[0];
                const tag = fileData.file_type === 'image' ? 
                    `<img src="${fileData.file_url}" alt="${fileData.file_name}">` :
                    `<video src="${fileData.file_url}" controls></video>`;
                
                const currentIndex = this.files.indexOf(file);
                if (currentIndex !== -1) {
                    this.files[currentIndex] = {
                        id: fileData.file_id,
                        name: fileData.file_name,
                        type: fileData.file_type === 'image' ? 'image/jpeg' : 'video/mp4',
                        url: fileData.file_url,
                        isExisting: true
                    };
                }
                
                this.updateGallery();
                this.updateSaveButton();
                
                this.copyToClipboard(tag);
                this.showNotification('HTML тег скопирован в буфер обмена', 'success');
            } else {
                this.showNotification('Ошибка загрузки файла: ' + result.error, 'error');
            }
        }).catch(error => {
            this.uploadingFiles.delete(fileKey);
            this.showNotification('Ошибка загрузки файла', 'error');
        });
    }
    
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('files', file);
        
        try {
            const response = await fetch(`/upload-description-media/${this.entityType}/${this.entityId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                return { success: false, error: errorData.error || 'Server error' };
            }
            
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Ошибка сети' };
        }
    }
    
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    
    async removeFile(index) {
        const file = this.files[index];
        
        if (file.isGallery) {
            this.showNotification('Файлы из галереи нельзя удалить здесь', 'warning');
            return;
        }
        
        if (file.isExisting && !this.isCreateMode && file.source === 'uploaded') {
            try {
                const response = await fetch(`/delete-description-media/${this.entityType}/${this.entityId}/${file.id}/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    this.showNotification('Ошибка удаления файла: ' + (errorData.error || 'Server error'), 'error');
                    return;
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    this.showNotification('Ошибка удаления файла', 'error');
                    return;
                }
                
                this.showNotification('Файл удален', 'success');
            } catch (error) {
                this.showNotification('Ошибка удаления файла', 'error');
                return;
            }
        }
        
        this.files.splice(index, 1);
        this.updateGallery();
        this.updateSaveButton();
    }
    
    async clearAllFiles() {
        const uploadedFiles = this.files.filter(file => file.source === 'uploaded' && file.isExisting);
        const newFiles = this.files.filter(file => !file.isExisting);
        const galleryFiles = this.files.filter(file => file.isGallery);
        
        const filesToDelete = uploadedFiles.length + newFiles.length;
        
        if (filesToDelete === 0) {
            this.showNotification('Нет файлов для удаления', 'info');
            return;
        }
        
        if (!confirm(`Вы уверены, что хотите удалить ${filesToDelete} файлов? Файлы из галереи не будут удалены.`)) {
            return;
        }
        
        if (uploadedFiles.length > 0 && !this.isCreateMode) {
            const deletePromises = uploadedFiles.map(async file => {
                const response = await fetch(`/delete-description-media/${this.entityType}/${this.entityId}/${file.id}/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to delete ${file.name}`);
                }
                
                return response.json();
            });
            
            try {
                const results = await Promise.all(deletePromises);
                this.showNotification('Файлы удалены', 'success');
            } catch (error) {
                this.showNotification('Ошибка удаления некоторых файлов', 'error');
                return;
            }
        }
        
        this.files = galleryFiles;
        this.updateGallery();
        this.updateSaveButton();
    }
    
    updateSaveButton() {
        const saveBtn = document.getElementById('mediaModalSaveBtn');
        if (!saveBtn) return;
        
        if (this.isCreateMode) {
            saveBtn.disabled = this.files.length === 0;
        } else {
            const hasNewFiles = this.files.some(file => !file.isExisting);
            saveBtn.disabled = false;
            saveBtn.textContent = hasNewFiles ? 'Загрузить' : 'Закрыть';
        }
    }
    
    async loadExistingFiles() {
        if (this.isCreateMode) {
            console.log('Skipping file load in create mode');
            return;
        }
        
        try {
            console.log(`Loading existing files for ${this.entityType} with ID ${this.entityId}`);
            const response = await fetch(`/get-description-media/${this.entityType}/${this.entityId}/`);
            
            if (!response.ok) {
                console.error('Failed to load existing files:', response.status);
                return;
            }
            
            const result = await response.json();
            console.log('Loaded files from server:', result);
            
            if (result.success && Array.isArray(result.files)) {
                this.files = result.files.map(fileData => ({
                    id: fileData.id,
                    name: fileData.name,
                    type: fileData.type === 'image' ? 'image/jpeg' : 'video/mp4',
                    url: fileData.url,
                    isExisting: true,
                    source: fileData.source || 'gallery',
                    isGallery: fileData.source === 'gallery'
                }));
                
                console.log('Mapped files:', this.files);
                console.log('Calling updateGallery...');
                this.updateGallery();
                this.updateSaveButton();
            } else {
                console.log('No files found or invalid response');
            }
        } catch (error) {
            console.error('Error loading existing files:', error);
        }
    }
    
    async saveFiles() {
        if (this.isCreateMode) {
            this.saveToSession();
        } else {
            const newFiles = this.files.filter(file => !file.isExisting);
            
            if (newFiles.length > 0) {
                const uploadPromises = newFiles.map(file => this.uploadFile(file));
                
                try {
                    const results = await Promise.all(uploadPromises);
                    const failedUploads = results.filter(r => !r.success);
                    
                    if (failedUploads.length > 0) {
                        this.showNotification('Некоторые файлы не удалось загрузить', 'error');
                        return;
                    }
                    
                    this.showNotification('Файлы успешно загружены', 'success');
                    await this.loadExistingFiles();
                } catch (error) {
                    this.showNotification('Ошибка загрузки файлов', 'error');
                    return;
                }
            }
            
            this.close();
        }
    }
    
    saveToSession() {
        // Сохраняем информацию о файлах в сессию для последующей обработки
        const filesData = this.files.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        }));
        
        // Используем localStorage как временное хранилище
        localStorage.setItem(`temp_media_${this.entityType}`, JSON.stringify(filesData));
        
        // Добавляем скрытое поле в форму для отправки данных
        this.addTempMediaToForm(filesData);
        
        this.showNotification('Файлы сохранены для загрузки', 'success');
        this.close();
    }
    
    addTempMediaToForm(filesData) {
        // Находим форму по типу сущности
        let form;
        if (this.entityType === 'startup') {
            form = document.getElementById('startupForm');
        } else if (this.entityType === 'franchise') {
            form = document.getElementById('franchiseForm');
        } else if (this.entityType === 'agency') {
            form = document.getElementById('agencyForm');
        } else if (this.entityType === 'specialist') {
            form = document.getElementById('specialistForm');
        }
        
        if (form) {
            // Удаляем существующее поле, если есть
            const existingField = form.querySelector('input[name="temp_media_data"]');
            if (existingField) {
                existingField.remove();
            }
            
            // Создаем новое скрытое поле
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = 'temp_media_data';
            hiddenField.value = JSON.stringify(filesData);
            form.appendChild(hiddenField);
        }
    }
    
    show() {
        if (!this.modal) return;
        
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (this.isCreateMode) {
            const modalBody = this.modal.querySelector('.modal-body');
            if (!modalBody) return;
            
            let warning = modalBody.querySelector('.create-mode-warning');
            
            if (!warning) {
                warning = document.createElement('div');
                warning.className = 'create-mode-warning';
                warning.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size: 14px;';
                warning.innerHTML = '<strong>Внимание:</strong> Сначала создайте сущность, затем вы сможете загрузить файлы и получить ссылки для вставки в описание.';
                modalBody.insertBefore(warning, modalBody.firstChild);
            }
            
            const uploadSection = this.modal.querySelector('.media-upload-section');
            const saveBtn = this.modal.querySelector('#mediaModalSaveBtn');
            const clearBtn = this.modal.querySelector('#clearAllBtn');
            
            if (uploadSection) uploadSection.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
        } else {
            const warning = this.modal.querySelector('.create-mode-warning');
            if (warning) warning.remove();
            
            const uploadSection = this.modal.querySelector('.media-upload-section');
            if (uploadSection) uploadSection.style.display = 'block';
            
            const saveBtn = this.modal.querySelector('#mediaModalSaveBtn');
            if (saveBtn) saveBtn.style.display = 'inline-block';
            
            this.loadExistingFiles();
        }
    }
    
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        document.body.style.overflow = '';
        this.revokeBlobUrls();
        
        if (!this.isCreateMode) {
            this.files = [];
        }
    }
    
    getCSRFToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }
    
    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений или создаем простую
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type, 3000);
        } else {
            alert(message);
        }
    }
}

// Глобальная функция для открытия модального окна
window.openDescriptionMediaModal = function(entityType, entityId = null) {
    const modal = new DescriptionMediaModal({
        entityType: entityType,
        entityId: entityId
    });
    modal.show();
    return modal;
};
