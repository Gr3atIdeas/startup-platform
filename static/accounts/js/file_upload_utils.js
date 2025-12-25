/**
 * Унифицированная логика загрузки файлов для всех сущностей
 * (startups, franchises, agencies, specialists)
 * 
 * Использование:
 * FileUploadUtils.init({
 *   staticUrl: '/static/accounts/images/creat_startup/'  // путь к иконкам
 * });
 * 
 * FileUploadUtils.setupFileInput({
 *   inputId: 'id_creatives_input',
 *   dropAreaId: 'creativesDropArea',
 *   previewAreaId: 'creativesPreview',
 *   isMultiple: true,
 *   maxFiles: 10,
 *   allowedTypes: { 
 *     mimes: ['image/jpeg', 'image/png'], 
 *     extensions: ['jpg', 'jpeg', 'png'] 
 *   }
 * });
 */

window.FileUploadUtils = (function() {
    'use strict';
    
    // Конфигурация
    let config = {
        staticUrl: '/static/accounts/images/creat_startup/',
        docIconPath: 'docimage.png',
        editIconPath: 'edit_icon.svg',
        deleteIconPath: 'delete_icon.svg',
        fileIconPath: '/static/accounts/images/icons/file_icon.svg'
    };
    
    // Глобальное хранилище для накопленных файлов
    const accumulatedFiles = {};
    
    /**
     * Инициализация модуля с конфигурацией
     */
    function init(options) {
        if (options) {
            Object.assign(config, options);
        }
    }
    
    /**
     * Преобразует FileList в массив
     */
    function toArray(fileList) {
        return Array.prototype.slice.call(fileList || []);
    }
    
    /**
     * Проверяет допустимость расширения файла
     */
    function isAllowedByExtension(filename, allowedExts) {
        const idx = filename.lastIndexOf('.');
        if (idx === -1) return false;
        const ext = filename.slice(idx + 1).toLowerCase();
        return allowedExts.indexOf(ext) !== -1;
    }
    
    /**
     * Проверяет допустимость файла по MIME типу и расширению
     */
    function isAllowedFile(file, allowedTypes) {
        if (!allowedTypes) return true;
        
        const fileType = file.type;
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // Проверяем по MIME типам
        if (allowedTypes.mimes && allowedTypes.mimes.length) {
            const mimeMatch = allowedTypes.mimes.some(mime => {
                if (mime.endsWith('/')) {
                    return fileType.startsWith(mime);
                }
                return fileType === mime || fileType.startsWith(mime);
            });
            if (mimeMatch) return true;
        }
        
        // Проверяем по mimePrefix (для обратной совместимости)
        if (allowedTypes.mimePrefix) {
            if (fileType && fileType.indexOf(allowedTypes.mimePrefix) === 0) {
                return true;
            }
        }
        
        // Проверяем по расширениям
        if (allowedTypes.extensions && allowedTypes.extensions.length) {
            if (allowedTypes.extensions.includes(fileExtension)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Проверяет, является ли файл дубликатом
     */
    function isDuplicate(existingFiles, newFile) {
        return existingFiles.some(f => 
            f.name === newFile.name && f.size === newFile.size
        );
    }
    
    /**
     * Получает расширение файла
     */
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
    
    /**
     * Обновляет input.files из accumulatedFiles
     */
    function updateInputFiles(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const files = accumulatedFiles[inputId] || [];
        const dataTransfer = new DataTransfer();
        files.forEach(f => dataTransfer.items.add(f));
        input.files = dataTransfer.files;
    }
    
    /**
     * Создает HTML для превью файла (стиль из franchise)
     */
    function createPreviewItemHTML(file, previewSrc, isImage) {
        const fileExtension = getFileExtension(file.name);
        const imageClass = isImage ? 'preview-image' : 'file-icon';
        
        const dragHandleHTML = '<div class="drag-handle-mock"><span></span><span></span><span></span><span></span><span></span><span></span></div>';
        
        const actionsHTML = 
            '<div class="file-actions">' +
                '<button type="button" class="edit-file-btn" aria-label="Редактировать" style="display:none;">' +
                    '<img src="' + config.staticUrl + config.editIconPath + '" alt="Редактировать">' +
                '</button>' +
                '<button type="button" class="delete-file-btn" aria-label="Удалить">' +
                    '<img src="' + config.staticUrl + config.deleteIconPath + '" alt="Удалить">' +
                '</button>' +
            '</div>';

        return '<div class="file-preview-item" draggable="true" data-filename="' + CSS.escape(file.name) + '">' +
                dragHandleHTML +
                '<div class="file-info">' +
                    '<img src="' + previewSrc + '" alt="' + (isImage ? 'Предпросмотр' : 'Иконка файла') + '" class="' + imageClass + '">' +
                    '<div class="file-text-details">' +
                        '<p class="file-name-display">' + file.name + '</p>' +
                        '<p class="file-type-display">' + fileExtension.toUpperCase() + '</p>' +
                    '</div>' +
                '</div>' +
                actionsHTML +
            '</div>';
    }
    
    /**
     * Добавляет превью файла в область предпросмотра
     */
    function addFilePreview(file, previewAreaId, isMultiple, maxFiles) {
        const previewArea = document.getElementById(previewAreaId);
        if (!previewArea) return;
        
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (isImage) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewSrc = e.target.result;
                const html = createPreviewItemHTML(file, previewSrc, true);
                
                if (!isMultiple) {
                    previewArea.innerHTML = html;
                } else if (previewArea.children.length < maxFiles) {
                    previewArea.insertAdjacentHTML('beforeend', html);
                }
            };
            reader.readAsDataURL(file);
        } else if (isVideo) {
            // Для видео показываем иконку документа
            const previewSrc = config.staticUrl + config.docIconPath;
            const html = createPreviewItemHTML(file, previewSrc, false);
            
            if (!isMultiple) {
                previewArea.innerHTML = html;
            } else if (previewArea.children.length < maxFiles) {
                previewArea.insertAdjacentHTML('beforeend', html);
            }
        } else {
            // Для документов показываем иконку
            const previewSrc = config.staticUrl + config.docIconPath;
            const html = createPreviewItemHTML(file, previewSrc, false);
            
            if (!isMultiple) {
                previewArea.innerHTML = html;
            } else if (previewArea.children.length < maxFiles) {
                previewArea.insertAdjacentHTML('beforeend', html);
            }
        }
    }
    
    /**
     * Показывает ошибку загрузки файла
     */
    function displayFileUploadError(inputId, message) {
        const fileInput = document.getElementById(inputId);
        if (!fileInput) return;
        
        const dropArea = fileInput.closest('.upload-box, .logo-upload-group');
        if (!dropArea) return;

        // Удаляем предыдущую ошибку
        const existingError = dropArea.querySelector('.custom-validation-error.file-specific-upload-error');
        if (existingError) {
            existingError.remove();
        }

        const errorMsgElement = document.createElement('p');
        errorMsgElement.className = 'error-message custom-validation-error file-specific-upload-error';
        errorMsgElement.textContent = message;

        const smallText = dropArea.querySelector('.small-text');
        const uploadButton = dropArea.querySelector('.custom-file-upload-button');

        if (smallText && smallText.nextSibling) {
            smallText.parentNode.insertBefore(errorMsgElement, smallText.nextSibling);
        } else if (smallText) {
            smallText.parentNode.appendChild(errorMsgElement);
        } else if (uploadButton && uploadButton.nextSibling) {
            uploadButton.parentNode.insertBefore(errorMsgElement, uploadButton.nextSibling);
        } else if (uploadButton) {
            uploadButton.parentNode.appendChild(errorMsgElement);
        } else {
            dropArea.appendChild(errorMsgElement);
        }

        if (uploadButton) {
            uploadButton.classList.add('input-error');
        } else {
            dropArea.classList.add('input-error');
        }
        
        errorMsgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    /**
     * Очищает ошибку загрузки
     */
    function clearFileUploadError(inputId) {
        const fileInput = document.getElementById(inputId);
        if (!fileInput) return;
        
        const dropArea = fileInput.closest('.upload-box, .logo-upload-group');
        if (!dropArea) return;
        
        const existingError = dropArea.querySelector('.custom-validation-error.file-specific-upload-error');
        if (existingError) {
            existingError.remove();
        }
        
        const uploadButton = dropArea.querySelector('.custom-file-upload-button');
        if (uploadButton) {
            uploadButton.classList.remove('input-error');
        } else {
            dropArea.classList.remove('input-error');
        }
    }
    
    /**
     * Обновляет видимость placeholder
     */
    function checkPlaceholderVisibility(dropAreaId, inputId) {
        const dropArea = document.getElementById(dropAreaId);
        if (!dropArea) return;
        
        const placeholder = dropArea.querySelector('.drop-placeholder');
        if (!placeholder) return;
        
        const files = accumulatedFiles[inputId] || [];
        placeholder.style.display = files.length > 0 ? 'none' : '';
    }
    
    /**
     * Удаляет файл из списка
     */
    function removeFile(inputId, fileName, previewAreaId, dropAreaId) {
        if (!accumulatedFiles[inputId]) return;
        
        // Удаляем из накопленных файлов (используем CSS.escape для сравнения)
        accumulatedFiles[inputId] = accumulatedFiles[inputId].filter(function(file) {
            return CSS.escape(file.name) !== fileName;
        });
        
        // Обновляем input.files
        updateInputFiles(inputId);
        
        // Удаляем превью
        const previewArea = document.getElementById(previewAreaId);
        if (previewArea) {
            const item = previewArea.querySelector('[data-filename="' + fileName + '"]');
            if (item) item.remove();
        }
        
        // Обновляем placeholder
        checkPlaceholderVisibility(dropAreaId, inputId);
    }
    
    /**
     * Обрабатывает добавление файлов
     */
    function handleFiles(inputId, newFiles, options) {
        const previewAreaId = options.previewAreaId;
        const dropAreaId = options.dropAreaId;
        const isMultiple = options.isMultiple;
        const maxFiles = options.maxFiles;
        const allowedTypes = options.allowedTypes;
        
        if (!accumulatedFiles[inputId]) {
            accumulatedFiles[inputId] = [];
        }
        
        // Очищаем предыдущие ошибки
        clearFileUploadError(inputId);
        
        const previewArea = document.getElementById(previewAreaId);
        const currentCount = accumulatedFiles[inputId].length;
        
        // Для одиночных файлов - очищаем
        if (!isMultiple) {
            accumulatedFiles[inputId] = [];
            if (previewArea) previewArea.innerHTML = '';
        }
        
        // Проверяем лимит
        if (isMultiple && currentCount >= maxFiles) {
            displayFileUploadError(inputId, 'Можно загрузить не более ' + maxFiles + ' файлов для этого поля.');
            return;
        }
        
        var addedCount = 0;
        
        newFiles.forEach(function(file) {
            // Проверяем лимит
            if (isMultiple && accumulatedFiles[inputId].length >= maxFiles) {
                return;
            }
            
            // Проверяем допустимость файла
            if (!isAllowedFile(file, allowedTypes)) {
                const extensions = allowedTypes.extensions || [];
                displayFileUploadError(inputId, 
                    'Файл "' + file.name + '" имеет неподдерживаемый тип. Допустимые форматы: ' + extensions.map(function(ext) { return ext.toUpperCase(); }).join(', ')
                );
                return;
            }
            
            // Проверяем дубликаты
            if (isDuplicate(accumulatedFiles[inputId], file)) {
                return;
            }
            
            // Добавляем файл
            accumulatedFiles[inputId].push(file);
            addedCount++;
            
            // Создаём превью
            addFilePreview(file, previewAreaId, isMultiple, maxFiles);
        });
        
        // Если добавили файлов больше лимита - показываем предупреждение
        if (isMultiple && currentCount + newFiles.length > maxFiles) {
            displayFileUploadError(inputId, 'Можно загрузить не более ' + maxFiles + ' файлов. Добавлено: ' + addedCount + '.');
            
            // Обрезаем до лимита
            accumulatedFiles[inputId] = accumulatedFiles[inputId].slice(0, maxFiles);
        }
        
        // Обновляем input.files
        updateInputFiles(inputId);
        
        // Обновляем placeholder
        checkPlaceholderVisibility(dropAreaId, inputId);
    }
    
    /**
     * Настраивает загрузку файлов для input элемента
     */
    function setupFileInput(options) {
        const inputId = options.inputId;
        const dropAreaId = options.dropAreaId;
        const previewAreaId = options.previewAreaId;
        const isMultiple = options.isMultiple !== undefined ? options.isMultiple : false;
        const maxFiles = options.maxFiles !== undefined ? options.maxFiles : 1;
        const allowedTypes = options.allowedTypes || null;
        
        const input = document.getElementById(inputId);
        const dropArea = document.getElementById(dropAreaId);
        const previewArea = document.getElementById(previewAreaId);
        
        if (!input || !dropArea) {
            console.warn('FileUploadUtils: не найдены элементы для ' + inputId);
            return;
        }
        
        // Инициализируем хранилище
        if (!accumulatedFiles[inputId]) {
            accumulatedFiles[inputId] = [];
        }
        
        const handlerOptions = { 
            previewAreaId: previewAreaId, 
            dropAreaId: dropAreaId, 
            isMultiple: isMultiple, 
            maxFiles: maxFiles, 
            allowedTypes: allowedTypes 
        };
        
        // Обработчик клика по области (кроме кнопок)
        dropArea.addEventListener('click', function(e) {
            if (e.target.closest('.delete-file-btn') || e.target.closest('.edit-file-btn')) {
                return;
            }
            if (!e.target.closest('.custom-file-upload-button')) {
                input.click();
            }
        });
        
        // Обработчик изменения input
        input.addEventListener('change', function(e) {
            if (e.target.files && e.target.files.length > 0) {
                const newFiles = toArray(e.target.files);
                handleFiles(inputId, newFiles, handlerOptions);
            }
        });
        
        // Drag & Drop
        dropArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        
        dropArea.addEventListener('dragleave', function() {
            dropArea.classList.remove('dragover');
        });
        
        dropArea.addEventListener('drop', function(e) {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length) {
                const newFiles = toArray(files);
                handleFiles(inputId, newFiles, handlerOptions);
            }
        });
        
        // Начальная проверка placeholder
        checkPlaceholderVisibility(dropAreaId, inputId);
    }
    
    /**
     * Настраивает глобальный обработчик удаления файлов
     */
    function setupDeleteHandler() {
        document.addEventListener('click', function(event) {
            const deleteButton = event.target.closest('.delete-file-btn');
            if (!deleteButton) return;
            
            const previewItem = deleteButton.closest('.file-preview-item');
            if (!previewItem) return;

            const fileNameToRemove = previewItem.dataset.filename;
            const previewArea = previewItem.parentElement;
            
            if (!previewArea || !previewArea.id) return;
            
            // Определяем inputId из previewAreaId
            const inputId = previewArea.id.replace('Preview', '_input');
            const dropAreaId = previewArea.id.replace('Preview', 'DropArea');
            
            removeFile(inputId, fileNameToRemove, previewArea.id, dropAreaId);
        });
    }
    
    // Публичный API
    return {
        init: init,
        setupFileInput: setupFileInput,
        setupDeleteHandler: setupDeleteHandler,
        getAccumulatedFiles: function(inputId) {
            return accumulatedFiles[inputId] || [];
        },
        clearFiles: function(inputId, previewAreaId, dropAreaId) {
            accumulatedFiles[inputId] = [];
            updateInputFiles(inputId);
            const previewArea = document.getElementById(previewAreaId);
            if (previewArea) previewArea.innerHTML = '';
            if (dropAreaId) checkPlaceholderVisibility(dropAreaId, inputId);
        },
        removeFile: removeFile
    };
})();

// Автоматически настраиваем глобальный обработчик удаления при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (window.FileUploadUtils) {
        window.FileUploadUtils.setupDeleteHandler();
    }
});
