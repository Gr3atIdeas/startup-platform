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
        
        // Определяем имя поля для сервера
        var fieldName = inputId.replace('id_', '').replace('_input', '');
        
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
            
            // Загружаем на сервер во временное хранилище (асинхронно)
            uploadTempFile(file, fieldName, getFormId()).then(function(tempInfo) {
                if (tempInfo && tempInfo.temp_id) {
                    // Добавляем temp_id к элементу превью
                    var previewItems = document.querySelectorAll('#' + previewAreaId + ' .file-preview-item');
                    for (var i = 0; i < previewItems.length; i++) {
                        if (previewItems[i].dataset.filename === CSS.escape(file.name) && !previewItems[i].dataset.tempId) {
                            previewItems[i].dataset.tempId = tempInfo.temp_id;
                            break;
                        }
                    }
                }
            });
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
        
        // Обработчик клика ТОЛЬКО по кнопке загрузки
        dropArea.addEventListener('click', function(e) {
            // Игнорируем клики по кнопкам удаления/редактирования
            if (e.target.closest('.delete-file-btn') || e.target.closest('.edit-file-btn')) {
                return;
            }
            // Открываем диалог выбора файлов ТОЛЬКО при клике на кнопку
            if (e.target.closest('.custom-file-upload-button')) {
                e.preventDefault();
                e.stopPropagation();
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
            
            // Удаляем с сервера если есть temp_id
            const tempId = previewItem.dataset.tempId;
            if (tempId) {
                deleteTempFileFromServer(tempId);
            }
            
            removeFile(inputId, fileNameToRemove, previewArea.id, dropAreaId);
        });
    }
    
    /**
     * Загружает файл на сервер во временное хранилище
     */
    function uploadTempFile(file, fieldName, formId) {
        return new Promise(function(resolve, reject) {
            var formData = new FormData();
            formData.append('file', file);
            formData.append('field_name', fieldName);
            formData.append('form_id', formId || getFormId());
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/temp-upload/', true);
            xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.success && response.files && response.files.length > 0) {
                            resolve(response.files[0]);
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            
            xhr.onerror = function() {
                resolve(null);
            };
            
            xhr.send(formData);
        });
    }
    
    /**
     * Удаляет временный файл с сервера
     */
    function deleteTempFileFromServer(tempId) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/temp-delete/' + tempId + '/', true);
        xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send('form_id=' + encodeURIComponent(getFormId()));
    }
    
    /**
     * Получает CSRF токен
     */
    function getCSRFToken() {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = cookie.substring(10);
                    break;
                }
            }
        }
        // Также пробуем из скрытого поля формы
        if (!cookieValue) {
            var csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (csrfInput) {
                cookieValue = csrfInput.value;
            }
        }
        return cookieValue;
    }
    
    /**
     * Получает ID формы (для группировки временных файлов)
     */
    function getFormId() {
        var form = document.querySelector('form[id]');
        if (form && form.id) return form.id;
        // Генерируем уникальный ID на основе URL
        return 'form_' + window.location.pathname.replace(/\//g, '_');
    }
    
    /**
     * Загружает список временных файлов с сервера и восстанавливает превью
     */
    function restoreTempFiles() {
        var formId = getFormId();
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/temp-files/?form_id=' + encodeURIComponent(formId), true);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success && response.fields) {
                        // Восстанавливаем превью для каждого поля
                        for (var fieldName in response.fields) {
                            var files = response.fields[fieldName];
                            restoreFieldPreviews(fieldName, files);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing temp files response:', e);
                }
            }
        };
        
        xhr.send();
    }
    
    /**
     * Восстанавливает превью файлов для поля
     */
    function restoreFieldPreviews(fieldName, files) {
        // Определяем previewAreaId из fieldName
        // fieldName обычно: creatives, video, proofs, logo и т.д.
        var previewAreaId = fieldName + 'Preview';
        var previewArea = document.getElementById(previewAreaId);
        
        if (!previewArea) {
            // Пробуем другие варианты названий
            previewAreaId = 'id_' + fieldName + '_preview';
            previewArea = document.getElementById(previewAreaId);
        }
        
        if (!previewArea || files.length === 0) return;
        
        files.forEach(function(fileInfo) {
            var isImage = fileInfo.content_type && fileInfo.content_type.startsWith('image/');
            var previewSrc = isImage ? '/static/accounts/images/creat_startup/docimage.png' : config.staticUrl + config.docIconPath;
            
            // Для изображений показываем placeholder (полное изображение недоступно без данных)
            var html = createTempPreviewHTML(fileInfo, previewSrc, isImage);
            previewArea.insertAdjacentHTML('beforeend', html);
        });
    }
    
    /**
     * Создает HTML для превью временного файла
     */
    function createTempPreviewHTML(fileInfo, previewSrc, isImage) {
        var fileExtension = fileInfo.name.split('.').pop().toLowerCase();
        
        var dragHandleHTML = '<div class="drag-handle-mock"><span></span><span></span><span></span><span></span><span></span><span></span></div>';
        
        var actionsHTML = 
            '<div class="file-actions">' +
                '<button type="button" class="delete-file-btn" aria-label="Удалить">' +
                    '<img src="' + config.staticUrl + config.deleteIconPath + '" alt="Удалить">' +
                '</button>' +
            '</div>';

        return '<div class="file-preview-item" draggable="true" data-filename="' + CSS.escape(fileInfo.name) + '" data-temp-id="' + fileInfo.temp_id + '">' +
                dragHandleHTML +
                '<div class="file-info">' +
                    '<img src="' + previewSrc + '" alt="Файл" class="file-icon">' +
                    '<div class="file-text-details">' +
                        '<p class="file-name-display">' + fileInfo.name + '</p>' +
                        '<p class="file-type-display">' + fileExtension.toUpperCase() + ' (сохранён)</p>' +
                    '</div>' +
                '</div>' +
                actionsHTML +
            '</div>';
    }
    
    // Публичный API
    return {
        init: init,
        setupFileInput: setupFileInput,
        setupDeleteHandler: setupDeleteHandler,
        uploadTempFile: uploadTempFile,
        restoreTempFiles: restoreTempFiles,
        getFormId: getFormId,
        getAccumulatedFiles: function(inputId) {
            return accumulatedFiles[inputId] || [];
        },
        clearFiles: function(inputId, previewAreaId, dropAreaId) {
            accumulatedFiles[inputId] = [];
            updateInputFiles(inputId);
            var previewArea = document.getElementById(previewAreaId);
            if (previewArea) previewArea.innerHTML = '';
            if (dropAreaId) checkPlaceholderVisibility(dropAreaId, inputId);
        },
        removeFile: removeFile
    };
})();

// Автоматически настраиваем глобальный обработчик удаления при загрузке
// и восстанавливаем временные файлы
document.addEventListener('DOMContentLoaded', function() {
    if (window.FileUploadUtils) {
        window.FileUploadUtils.setupDeleteHandler();
        // Восстанавливаем файлы если страница перезагружена после ошибки валидации
        window.FileUploadUtils.restoreTempFiles();
    }
});
