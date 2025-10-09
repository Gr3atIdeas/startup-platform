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
            <div id="descriptionMediaModal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 9999; padding: 20px; overflow-y: auto; pointer-events: auto;">
                <div class="modal-dialog media-modal-dialog" style="background: white; border-radius: 8px; max-width: 800px; margin: 50px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3); position: relative; pointer-events: auto;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                        <div class="modal-title" style="font-size: 20px; font-weight: 600; color: #333;">Управление медиа-контентом</div>
                        <button type="button" class="modal-close-btn" id="mediaModalCloseBtn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">×</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div class="media-upload-section" style="padding: 15px; text-align: center; background: #f8f9fa; border-radius: 5px; margin-bottom: 20px;">
                                <input type="file" id="mediaFileInput" multiple accept="image/*,video/*" style="display: none;">
                            <button type="button" class="btn-upload-file" id="uploadFileBtn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                Выбрать файлы
                            </button>
                            <p style="margin-top: 10px; font-size: 12px; color: #666;">Изображения: JPG, PNG, GIF, WEBP (до 5MB) • Видео: MP4, MOV, AVI (до 50MB)</p>
                        </div>
                        <div class="media-gallery" id="mediaGallery">
                            <div class="gallery-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 style="margin: 0; font-size: 16px; color: #333;">Загруженные файлы</h3>
                                <div class="gallery-actions">
                                    <button type="button" class="btn-clear-all" id="clearAllBtn" style="display: none; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Очистить все</button>
                                </div>
                            </div>
                            <div class="gallery-grid" id="galleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
                                <div class="gallery-empty" id="galleryEmpty" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                                    <p>Нет загруженных файлов</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 15px 20px; border-top: 1px solid #ddd; display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn-secondary" id="mediaModalCancelBtn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
                        <button type="button" class="btn-primary" id="mediaModalSaveBtn" disabled style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Сохранить</button>
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
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        if (this.modal) {
            const modalDialog = this.modal.querySelector('.modal-dialog');
            
            this.modal.addEventListener('click', (e) => {
                // Закрывать ТОЛЬКО если кликнули НЕПОСРЕДСТВЕННО на overlay, НЕ на dialog
                const clickedOnOverlay = e.target === this.modal;
                
                console.log('Click detected:', {
                    clickedElement: e.target.className || e.target.tagName,
                    clickedOnOverlay: clickedOnOverlay,
                    targetIsModal: e.target === this.modal,
                    targetIsDialog: e.target === modalDialog
                });
                
                if (clickedOnOverlay) {
                    console.log('Clicked directly on overlay background, closing modal');
                    this.close();
                } else {
                    console.log('Clicked inside modal content, NOT closing');
                }
            });
        }
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFiles();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
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
        console.log('createFileItem called for:', file.name, 'isImage:', file.type.startsWith('image/'));
        
        const isImage = file.type.startsWith('image/');
        const fileItem = document.createElement('div');
        fileItem.className = 'gallery-item';
        fileItem.dataset.index = index;
        
        const escapedName = this.escapeHtml(file.name);
        let fileUrl;
        
        if (file.isExisting) {
            fileUrl = file.url;
            console.log('Using existing URL:', fileUrl);
        } else {
            const blobUrl = URL.createObjectURL(file);
            this.blobUrls.set(index, blobUrl);
            fileUrl = blobUrl;
            console.log('Created blob URL:', blobUrl);
        }
        
        let preview;
        if (isImage) {
            preview = `<img src="${fileUrl}" alt="${escapedName}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="console.error('Failed to load image:', this.src)">`;
        } else {
            preview = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; height: 100%; width: 100%;">
                    <div style="font-size: 40px; margin-bottom: 8px;">▶</div>
                    <div style="font-size: 12px; text-align: center; padding: 0 10px; word-break: break-word;">Видео</div>
                 </div>`;
        }
        
        console.log('Preview HTML:', preview.substring(0, 100));
        console.log('File URL for image:', fileUrl);
        
        const removeButtonHtml = (this.isCreateMode || file.isGallery) ? '' : '<button type="button" class="btn-remove-file" data-index="' + index + '" style="position: absolute; top: 5px; right: 5px; background: rgba(220,53,69,0.9); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 16px; line-height: 1; z-index: 10;">×</button>';
        const sourceLabel = file.isGallery ? '<span class="file-source-label" style="color: #28a745; font-size: 11px; font-weight: 600;">из галереи</span>' : '';
        
        fileItem.style.cssText = 'position: relative; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; background: white;';
        fileItem.setAttribute('title', 'Нажмите для копирования ссылки');
        
        fileItem.innerHTML = `
            <div class="file-preview-container" style="position: relative; width: 100%; height: 150px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${preview}
                ${removeButtonHtml}
                </div>
            <div class="file-info" style="padding: 10px; background: white;">
                <div class="file-name" style="font-size: 12px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapedName}">${escapedName}</div>
                <div class="file-type" style="font-size: 11px; color: #666; margin-top: 4px;">${isImage ? 'Изображение' : 'Видео'} ${sourceLabel}</div>
            </div>
        `;
        
        if (!this.isCreateMode) {
            console.log('Adding click listener to fileItem, index:', index);
            
            fileItem.addEventListener('click', (e) => {
                e.stopPropagation(); // ВАЖНО! Останавливаем всплытие до overlay
                console.log('File item clicked!', {
                    target: e.target.className || e.target.tagName,
                    index: index,
                    isRemoveButton: e.target.classList.contains('btn-remove-file')
                });
                
                if (!e.target.classList.contains('btn-remove-file')) {
                    console.log('Not remove button, calling copyFileUrlAndClose');
                    this.copyFileUrlAndClose(index);
                } else {
                    console.log('Remove button clicked, ignoring');
                }
            });
            
            fileItem.addEventListener('mouseenter', () => {
                console.log('Mouse entered fileItem');
                fileItem.style.borderColor = '#007bff';
                fileItem.style.boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
            });
            
            fileItem.addEventListener('mouseleave', () => {
                fileItem.style.borderColor = '#ddd';
                fileItem.style.boxShadow = 'none';
            });
        } else {
            console.log('Create mode, not adding click listener');
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
    
    async copyFileUrlAndClose(index) {
        console.log('copyFileUrlAndClose called for index:', index);
        const file = this.files[index];
        if (!file) {
            console.error('File not found at index:', index);
            return;
        }
        
        const isImage = file.type.startsWith('image/');
        const tag = isImage ? 
            `<img src="${file.url}" alt="${file.name}">` :
            `<video src="${file.url}" controls></video>`;
        
        console.log('Generated tag:', tag);
        
        try {
            await this.copyToClipboard(tag);
            this.showNotification('HTML тег скопирован в буфер обмена', 'success');
            
            setTimeout(() => {
                this.close();
            }, 500);
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showNotification('Ошибка копирования в буфер обмена', 'error');
        }
    }
    
    async copyFileUrl(index) {
        const file = this.files[index];
        if (!file) return;
        
        if (file.isExisting) {
            const isImage = file.type.startsWith('image/');
            const tag = isImage ? 
                `<img src="${file.url}" alt="${file.name}">` :
                `<video src="${file.url}" controls></video>`;
            
            try {
                await this.copyToClipboard(tag);
                this.showNotification('HTML тег скопирован в буфер обмена', 'success');
            } catch (error) {
                this.showNotification('Ошибка копирования в буфер обмена', 'error');
            }
            return;
        }
        
        const fileKey = `${file.name}_${file.size}_${file.lastModified || Date.now()}`;
        
        if (this.uploadingFiles.has(fileKey)) {
            this.showNotification('Файл уже загружается, подождите...', 'warning');
            return;
        }
        
        this.uploadingFiles.add(fileKey);
        
        try {
            const result = await this.uploadFile(file);
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
                        isExisting: true,
                        source: 'uploaded',
                        isGallery: false
                    };
                }
                
                this.updateGallery();
                this.updateSaveButton();
                
                await this.copyToClipboard(tag);
                this.showNotification('HTML тег скопирован в буфер обмена', 'success');
            } else {
                this.showNotification('Ошибка загрузки файла: ' + result.error, 'error');
            }
        } catch (error) {
            this.uploadingFiles.delete(fileKey);
            this.showNotification('Ошибка загрузки файла', 'error');
        }
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
    
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                console.log('Copied to clipboard via navigator.clipboard:', text);
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                console.log('Copied to clipboard via execCommand:', success, text);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Пробуем fallback
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
                console.log('Copied to clipboard via fallback');
            } catch (e) {
                console.error('All copy methods failed:', e);
                throw e;
            }
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
        
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        console.log('Modal shown, display set to block');
        
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

// Singleton instance
let descriptionMediaModalInstance = null;

// Глобальная функция для открытия модального окна
window.openDescriptionMediaModal = function(entityType, entityId = null) {
    // Если модалка уже существует, закрываем её и удаляем
    if (descriptionMediaModalInstance) {
        console.log('Closing existing modal instance');
        descriptionMediaModalInstance.close();
        if (descriptionMediaModalInstance.modal) {
            descriptionMediaModalInstance.modal.remove();
        }
        descriptionMediaModalInstance = null;
    }
    
    // Создаем новый экземпляр
    console.log('Creating new modal instance for', entityType, entityId);
    descriptionMediaModalInstance = new DescriptionMediaModal({
        entityType: entityType,
        entityId: entityId
    });
    descriptionMediaModalInstance.show();
    return descriptionMediaModalInstance;
};
