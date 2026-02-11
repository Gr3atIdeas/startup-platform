document.addEventListener('DOMContentLoaded', function () {
  var logoInput = document.getElementById('id_logo_input')
  var logoLabel = document.querySelector('.logo-upload-label')
  var logoPlaceholder = document.getElementById('logoPlaceholder')
  var logoPreview = document.getElementById('logoPreview')
  
  // Используем унифицированный модуль FileUploadUtils для загрузки файлов
  if (window.FileUploadUtils) {
    // Creatives (изображения)
    FileUploadUtils.setupFileInput({
      inputId: 'id_creatives_input',
      dropAreaId: 'creativesDropArea',
      previewAreaId: 'creativesPreview',
      isMultiple: true,
      maxFiles: 10,
      allowedTypes: { mimes: ['image/jpeg', 'image/png'], extensions: ['jpg', 'jpeg', 'png'] }
    });
    
    // Video
    FileUploadUtils.setupFileInput({
      inputId: 'id_video_input',
      dropAreaId: 'videoDropArea',
      previewAreaId: 'videoPreview',
      isMultiple: true,
      maxFiles: 3,
      allowedTypes: { mimes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'], extensions: ['mp4', 'mov', 'avi', 'mkv'] }
    });
    
    // Proofs (документы)
    FileUploadUtils.setupFileInput({
      inputId: 'id_proofs_input',
      dropAreaId: 'proofsDropArea',
      previewAreaId: 'proofsPreview',
      isMultiple: true,
      maxFiles: 10,
      allowedTypes: { mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx'] }
    });
  } else {
    // Fallback: старая логика если FileUploadUtils не загружен
    console.warn('FileUploadUtils не загружен, используется fallback логика');
    initLegacyFileUpload();
  }
  
  function initLegacyFileUpload() {
    // Старая логика загрузки файлов (fallback)
    function toArray(fileList) {
      return Array.prototype.slice.call(fileList || [])
    }
    function createPreviewItem(params) {
      var container = document.createElement('div')
      container.className = 'file-preview-item'
      if (params.previewNode) {
        container.appendChild(params.previewNode)
      }
      var nameEl = document.createElement('p')
      nameEl.textContent = params.displayName
      container.appendChild(nameEl)
      if (params.showDelete) {
        var deleteBtn = document.createElement('button')
        deleteBtn.type = 'button'
        deleteBtn.className = 'delete-new-file-btn'
        deleteBtn.textContent = 'Удалить'
        deleteBtn.addEventListener('click', function() {
          if (params.onDelete) {
            params.onDelete(params.index)
          }
        })
        container.appendChild(deleteBtn)
      }
      return container
    }
    function isAllowedByExt(filename, allowedExts) {
      var idx = filename.lastIndexOf('.')
      if (idx === -1) return false
      var ext = filename.slice(idx + 1).toLowerCase()
      return allowedExts.indexOf(ext) !== -1
    }
    function bindInputWithDropArea(inputId, dropAreaId, previewId, options) {
      var input = document.getElementById(inputId)
      var dropArea = document.getElementById(dropAreaId)
      var preview = document.getElementById(previewId)
      if (!input || !dropArea || !preview) return
      var currentFiles = []
      if (input.files && input.files.length > 0) {
        currentFiles = toArray(input.files)
      }
      function updatePreview(files) {
        var newFilesEls = preview.querySelectorAll('.file-preview-item:not(.existing-file)')
        newFilesEls.forEach(function(el) { el.remove() })
        files.forEach(function (file, index) {
          var previewNode
          if (options.kind === 'image') {
            var img = document.createElement('img')
            img.style.maxWidth = '200px'
            img.style.maxHeight = '150px'
            var reader = new FileReader()
            reader.onload = function (e) { img.src = e.target.result }
            reader.readAsDataURL(file)
            previewNode = img
          } else if (options.kind === 'video') {
            var video = document.createElement('video')
            video.setAttribute('controls', 'controls')
            video.style.maxWidth = '200px'
            video.style.maxHeight = '150px'
            var readerV = new FileReader()
            readerV.onload = function (e) { video.src = e.target.result }
            readerV.readAsDataURL(file)
            previewNode = video
          } else {
            var icon = document.createElement('img')
            icon.src = '/static/accounts/images/icons/file_icon.svg'
            icon.className = 'file-icon'
            icon.style.width = '40px'
            previewNode = icon
          }
          preview.appendChild(createPreviewItem({ 
            previewNode: previewNode, 
            displayName: file.name,
            showDelete: true,
            index: index,
            onDelete: removeFile
          }))
        })
      }
      function filterFiles(fileList) {
        var files = []
        var maxCount = options.maxCount || 1
        var allowedExts = options.allowedExts || []
        var allowByMimePrefix = options.mimePrefix || null
        for (var i = 0; i < fileList.length; i++) {
          var f = fileList[i]
          var ok = true
          if (allowByMimePrefix) {
            ok = f.type && f.type.indexOf(allowByMimePrefix) === 0
          } else if (allowedExts.length) {
            ok = isAllowedByExt(f.name, allowedExts)
          }
          if (ok) files.push(f)
          if (files.length >= maxCount) break
        }
        return files
      }
      function setFiles(files) {
        currentFiles = files.slice()
        var dt = new DataTransfer()
        files.forEach(function (f) { dt.items.add(f) })
        input.files = dt.files
        updatePreview(files)
      }
      function removeFile(index) {
        currentFiles.splice(index, 1)
        setFiles(currentFiles)
      }
      input.addEventListener('change', function () {
        var newFiles = toArray(input.files)
        if (newFiles.length === 0) return
        var combined = currentFiles.concat(newFiles)
        var filtered = filterFiles(combined)
        setFiles(filtered)
      })
      dropArea.addEventListener('dragover', function (e) { e.preventDefault() })
      dropArea.addEventListener('drop', function (e) {
        e.preventDefault()
        var dropped = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : []
        var combined = currentFiles.concat(toArray(dropped))
        var filtered = filterFiles(combined)
        setFiles(filtered)
      })
    }
    bindInputWithDropArea('id_creatives_input', 'creativesDropArea', 'creativesPreview', { kind: 'image', mimePrefix: 'image/', maxCount: 10 })
    bindInputWithDropArea('id_video_input', 'videoDropArea', 'videoPreview', { kind: 'video', mimePrefix: 'video/', maxCount: 3 })
    bindInputWithDropArea('id_proofs_input', 'proofsDropArea', 'proofsPreview', { kind: 'file', allowedExts: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'], maxCount: 10 })
  }

  // Ограничиваем клик логотипа только кнопкой (см. шаблон: #logoUploadButton)
  // Хранилище файлов в памяти для сохранения при ошибках валидации
  var singleFileStorage = {
    logo: null,
    catalog_card_image: null
  };
  
  // Функция загрузки файла во временное хранилище на сервере
  function uploadSingleFileTempStorage(file, fieldName) {
    if (!window.FileUploadUtils) return;
    var formId = window.FileUploadUtils.getFormId ? window.FileUploadUtils.getFormId() : 'startup_form';
    var formData = new FormData();
    formData.append('file', file);
    formData.append('field_name', fieldName);
    formData.append('form_id', formId);
    
    var csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]');
    
    fetch('/temp-upload/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken ? csrfToken.value : ''
      },
      body: formData,
      credentials: 'same-origin'
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      if (data.success && data.files && data.files.length > 0) {
        console.log('Файл ' + fieldName + ' загружен во временное хранилище: ', data.files[0].temp_id);
      }
    }).catch(function(err) {
      console.error('Ошибка загрузки во временное хранилище:', err);
    });
  }
  
  // Функция синхронизации файла обратно в input (для FormData)
  function syncSingleFileToInput(inputId, file) {
    var input = document.getElementById(inputId);
    if (!input || !file) return;
    try {
      var dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
    } catch(e) {
      console.warn('DataTransfer не поддерживается:', e);
    }
  }
  
  if (logoInput && logoPreview && logoPlaceholder) {
    logoInput.addEventListener('change', function () {
      var file = logoInput.files && logoInput.files[0]
      if (!file) return
      // Сохраняем в память
      singleFileStorage.logo = file;
      var reader = new FileReader()
      reader.onload = function (e) {
        logoPreview.src = e.target.result
        logoPreview.style.display = 'block'
        logoPlaceholder.style.display = 'none'
        // Сохраняем dataURL для восстановления превью
        logoPreview.dataset.fileDataUrl = e.target.result;
      }
      reader.readAsDataURL(file)
      // Загружаем во временное хранилище
      uploadSingleFileTempStorage(file, 'logo');
    })
  }

  // Обработчик для изображения карточки каталога
  var catalogCardImageInput = document.getElementById('id_catalog_card_image_input')
  var catalogCardImagePreview = document.getElementById('catalogCardImagePreview')
  var catalogCardImagePlaceholder = document.getElementById('catalogCardImagePlaceholder')
  
  if (catalogCardImageInput && catalogCardImagePreview && catalogCardImagePlaceholder) {
    catalogCardImageInput.addEventListener('change', function () {
      var file = catalogCardImageInput.files && catalogCardImageInput.files[0]
      if (!file) return
      // Сохраняем в память
      singleFileStorage.catalog_card_image = file;
      var reader = new FileReader()
      reader.onload = function (e) {
        catalogCardImagePreview.src = e.target.result
        catalogCardImagePreview.style.display = 'block'
        catalogCardImagePlaceholder.style.display = 'none'
        // Сохраняем dataURL для восстановления превью
        catalogCardImagePreview.dataset.fileDataUrl = e.target.result;
      }
      reader.readAsDataURL(file)
      // Загружаем во временное хранилище
      uploadSingleFileTempStorage(file, 'catalog_card_image');
    })
  }
  
  // Синхронизируем файлы из памяти перед созданием FormData
  window.syncSingleFilesBeforeSubmit = function() {
    if (singleFileStorage.logo) {
      syncSingleFileToInput('id_logo_input', singleFileStorage.logo);
    }
    if (singleFileStorage.catalog_card_image) {
      syncSingleFileToInput('id_catalog_card_image_input', singleFileStorage.catalog_card_image);
    }
  };

  var microCheckbox = document.getElementById('id_micro_investment_available')
  var microLabel = document.querySelector('.micro-investment-label-new')
  function syncMicroUI() {
    if (!microLabel) return
    var checkedIcon = microLabel.querySelector('.micro-checkbox-checked')
    if (checkedIcon) {
      checkedIcon.style.display = microCheckbox && microCheckbox.checked ? 'block' : 'none'
    }
  }
  if (microCheckbox) {
    syncMicroUI()
    microCheckbox.addEventListener('change', syncMicroUI)
    if (microLabel) {
      microLabel.addEventListener('click', function () {
        setTimeout(syncMicroUI, 0)
      })
    }
  }
  var timelineSteps = document.querySelectorAll('.timeline-step')
  var descriptionContainers = document.querySelectorAll('.timeline-description-container')
  var currentStepInput = document.getElementById('step_number')
  var setCurrentButtons = document.querySelectorAll('.btn-select-current-step')
  var timelineProgressFilled = document.getElementById('timelineProgressFilled')
  var totalSteps = 5
  function setOnlyActiveTextareaRequired(stepNumber) {
    descriptionContainers.forEach(function (container) {
      var ta = container.querySelector('textarea')
      if (!ta) return
      var isActive = String(container.getAttribute('data-step-content')) === String(stepNumber)
      var stepNum = parseInt(container.getAttribute('data-step-content'))
      if (stepNum === 1) {
        ta.setAttribute('required', 'required')
      } else {
        ta.removeAttribute('required')
      }
    })
  }
  function selectStepDescription(stepNumber) {
    descriptionContainers.forEach(function (container) {
      var isActive = String(container.getAttribute('data-step-content')) === String(stepNumber)
      if (isActive) container.classList.add('active')
      else container.classList.remove('active')
    })
    timelineSteps.forEach(function (step) {
      var isActive = String(step.getAttribute('data-step')) === String(stepNumber)
      if (isActive) step.classList.add('active-step-display')
      else step.classList.remove('active-step-display')
    })
    setOnlyActiveTextareaRequired(stepNumber)
  }
  function setCurrentStep(stepNumber) {
    var current = parseInt(stepNumber)
    if (currentStepInput) currentStepInput.value = current
    timelineSteps.forEach(function (step) {
      var stepNum = parseInt(step.getAttribute('data-step'))
      var wrapper = step.querySelector('.step-number-wrapper')
      step.classList.remove('active-step-display')
      if (wrapper) wrapper.classList.remove('active')
      if (stepNum <= current && wrapper) wrapper.classList.add('active')
    })
    if (timelineProgressFilled) {
      if (current > 1) {
        var p = ((current - 1) / (totalSteps - 1)) * 100
        timelineProgressFilled.style.width = p + '%'
      } else {
        timelineProgressFilled.style.width = '0%'
      }
    }
    selectStepDescription(current)
  }
  if (timelineSteps.length) {
    timelineSteps.forEach(function (step) {
      step.addEventListener('click', function () {
        var num = this.getAttribute('data-step')
        selectStepDescription(num)
      })
    })
  }
  if (setCurrentButtons.length) {
    setCurrentButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var num = this.getAttribute('data-step-target')
        setCurrentStep(num)
      })
    })
  }
  if (currentStepInput) {
    var initStep = currentStepInput.value || 1
    setCurrentStep(initStep)
  }

  // Поддержка всех форм создания (startup, franchise, agency, specialist)
  var startupForm = document.getElementById('startupForm') || 
                    document.getElementById('franchiseForm') ||
                    document.getElementById('agencyForm') ||
                    document.getElementById('specialistForm')
  function showFieldError(fieldEl, message) {
    if (!fieldEl) return
    fieldEl.classList.add('input-error')
    var parent = fieldEl.closest('.form-group') || fieldEl.parentElement
    if (!parent) parent = fieldEl
    var old = parent.querySelector('.custom-validation-error')
    if (old) old.remove()
    var msg = document.createElement('span')
    msg.className = 'custom-validation-error'
    msg.textContent = message
    parent.appendChild(msg)
  }
  function clearFieldError(fieldEl) {
    if (!fieldEl) return
    fieldEl.classList.remove('input-error')
    var parent = fieldEl.closest('.form-group') || fieldEl.parentElement
    if (!parent) parent = fieldEl
    var old = parent.querySelector('.custom-validation-error')
    if (old) old.remove()
  }
  function validateFormClientSide() {
    var hasError = false
    var isEditPage = window.location.pathname.includes('/edit/') || window.location.pathname.includes('/edit-startup/')
    
    var requiredSelectors = [
      "[name='title']",
      "[name='direction']",
      "[name='funding_goal']",
      "[name='stage']",
      "[name='short_description']",
      "[name='description']",
      // terms теперь необязательное поле
    ]
    
    // Планета обязательна только при создании, не при редактировании
    if (!isEditPage) {
      requiredSelectors.push("#id_planet_image")
    }
    requiredSelectors.forEach(function (sel) {
      var el = document.querySelector(sel)
      if (!el) return
      clearFieldError(el)
      var val = (el.value || '').toString().trim()
      if (!val) {
        hasError = true
        showFieldError(el, 'Это поле обязательно')
      }
    })
    
    // Валидация файлов только для создания, не для редактирования
    if (!isEditPage) {
      var creativesInput = document.getElementById('id_creatives_input')
      var videoInput = document.getElementById('id_video_input')
      var proofsInput = document.getElementById('id_proofs_input')
      if (creativesInput) {
        var c = creativesInput.files ? creativesInput.files.length : 0
        // Также проверяем превью-область
        var creativesPreview = document.getElementById('creativesPreview')
        var previewCount = creativesPreview ? creativesPreview.querySelectorAll('.file-preview-item').length : 0
        var totalCreatives = Math.max(c, previewCount)
        if (totalCreatives < 1) {
          hasError = true
          showFieldError(creativesInput, 'Добавьте хотя бы 1 изображение (до 10)')
        } else if (totalCreatives > 10) {
          hasError = true
          showFieldError(creativesInput, 'Не более 10 изображений')
        } else {
          clearFieldError(creativesInput)
        }
      }
      if (videoInput) {
        var v = videoInput.files ? videoInput.files.length : 0
        // Видео теперь необязательное поле
        if (v > 3) {
          hasError = true
          showFieldError(videoInput, 'Не более 3 видео')
        } else {
          clearFieldError(videoInput)
        }
      }
      if (proofsInput) {
        var p = proofsInput.files ? proofsInput.files.length : 0
        // Документы теперь необязательное поле
        if (p > 10) {
          hasError = true
          showFieldError(proofsInput, 'Не более 10 документов')
        } else {
          clearFieldError(proofsInput)
        }
      }
    } else {
      // Для редактирования только проверяем лимиты, если файлы загружены
      var creativesInput = document.getElementById('id_creatives_input')
      var videoInput = document.getElementById('id_video_input')
      var proofsInput = document.getElementById('id_proofs_input')
      
      if (creativesInput && creativesInput.files && creativesInput.files.length > 10) {
        hasError = true
        showFieldError(creativesInput, 'Не более 10 изображений')
      } else if (creativesInput) {
        clearFieldError(creativesInput)
      }
      
      if (videoInput && videoInput.files && videoInput.files.length > 3) {
        hasError = true
        showFieldError(videoInput, 'Не более 3 видео')
      } else if (videoInput) {
        clearFieldError(videoInput)
      }
      
      if (proofsInput && proofsInput.files && proofsInput.files.length > 10) {
        hasError = true
        showFieldError(proofsInput, 'Не более 10 документов')
      } else if (proofsInput) {
        clearFieldError(proofsInput)
      }
    }
    return !hasError
  }
  var isFormSubmitting = false;
  if (startupForm) {
    startupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // Предотвращаем повторную отправку
      if (isFormSubmitting) {
        console.log('Form already submitting, blocked');
        return false;
      }
      
      // очищаем предыдущие ошибки
      Array.prototype.forEach.call(startupForm.querySelectorAll('.input-error'), function (el) {
        el.classList.remove('input-error')
      })
      Array.prototype.forEach.call(startupForm.querySelectorAll('.custom-validation-error'), function (el) {
        el.remove()
      })
      var ok = validateFormClientSide()
      if (!ok) {
        var firstError = startupForm.querySelector('.input-error') || startupForm.querySelector('.custom-validation-error')
        if (firstError) {
          var target = firstError.closest('.form-group') || firstError
          if (target) { instantScrollIntoView(target) }
        }
        return false;
      }
      
      // Устанавливаем флаг отправки
      isFormSubmitting = true;

      // AJAX submit, чтобы не терялись прикрепленные файлы при серверных ошибках
      try {
        
        // Синхронизируем файлы из памяти обратно в input перед созданием FormData
        if (typeof window.syncSingleFilesBeforeSubmit === 'function') {
          window.syncSingleFilesBeforeSubmit();
        }
        
        var loadingOverlay = document.createElement('div')
        loadingOverlay.id = 'submission-loading-overlay'
        loadingOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); z-index: 10000; display: flex; align-items: center; justify-content: center;'
        var loadingContent = document.createElement('div')
        loadingContent.style.cssText = 'background: #2a2a2a; padding: 30px 50px; border-radius: 12px; text-align: center; color: #fff; font-family: Unbounded, sans-serif;'
        loadingContent.innerHTML = '<div style="font-size: 24px; font-weight: 600; margin-bottom: 10px;">Отправка</div><div style="font-size: 14px; color: #aaa;">Пожалуйста, подождите...</div>'
        loadingOverlay.appendChild(loadingContent)
        document.body.appendChild(loadingOverlay)
        
        var formData = new FormData(startupForm)
        var csrfInput = startupForm.querySelector('input[name="csrfmiddlewaretoken"]')
        var csrfToken = csrfInput ? csrfInput.value : null
        fetch(startupForm.action || window.location.href, {
          method: 'POST',
          headers: Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          body: formData,
          credentials: 'same-origin',
        }).then(function (res) {
          if (!res.ok) return res.json().then(function (data) { throw data })
          return res.json()
        }).then(function (data) {
          var loadingOverlay = document.getElementById('submission-loading-overlay')
          if (loadingOverlay) loadingOverlay.remove()
          if (data && data.success && data.redirect_url) {
            if (data.file_save_errors && data.file_save_errors.length) {
              var generalBox = document.getElementById('formGeneralErrors')
              if (!generalBox) {
                generalBox = document.createElement('div')
                generalBox.id = 'formGeneralErrors'
                generalBox.style.color = '#e74c3c'
                generalBox.style.margin = '10px 0'
                generalBox.style.padding = '10px'
                generalBox.style.border = '1px solid #e74c3c'
                generalBox.style.borderRadius = '6px'
                generalBox.setAttribute('role', 'alert')
                startupForm.insertBefore(generalBox, startupForm.firstChild)
              }
              var warn = document.createElement('div')
              warn.textContent = 'Часть файлов не сохранилась:'
              generalBox.appendChild(warn)
              var ulw = document.createElement('ul')
              ulw.style.margin = '8px 0 0 18px'
              generalBox.appendChild(ulw)
              data.file_save_errors.forEach(function (it) {
                var li = document.createElement('li')
                li.textContent = (it.field || 'file') + (it.file ? ' (' + it.file + ')' : '')
                ulw.appendChild(li)
              })
            }
            window.location.assign(data.redirect_url)
          }
        }).catch(function (err) {
          // Сбрасываем флаг при ошибке
          isFormSubmitting = false;
          
          var loadingOverlay = document.getElementById('submission-loading-overlay')
          if (loadingOverlay) loadingOverlay.remove()
          // показать серверные ошибки без перезагрузки
          var errors = (err && err.errors) || {}
          var nonField = (err && err.non_field_errors) || []
          var generalBox = document.getElementById('formGeneralErrors')
          if (!generalBox) {
            generalBox = document.createElement('div')
            generalBox.id = 'formGeneralErrors'
            generalBox.style.color = '#e74c3c'
            generalBox.style.margin = '10px 0'
            generalBox.style.padding = '10px'
            generalBox.style.border = '1px solid #e74c3c'
            generalBox.style.borderRadius = '6px'
            generalBox.setAttribute('role', 'alert')
            startupForm.insertBefore(generalBox, startupForm.firstChild)
          }
          generalBox.innerHTML = ''
          var header = document.createElement('div')
          header.style.fontWeight = '600'
          header.textContent = 'Форма содержит ошибки. Исправьте следующие поля:'
          generalBox.appendChild(header)
          var ul = document.createElement('ul')
          ul.style.margin = '8px 0 0 18px'
          ul.style.padding = '0'
          generalBox.appendChild(ul)
          if (Array.isArray(nonField) && nonField.length) {
            nonField.forEach(function (msg) {
              var li = document.createElement('li')
              li.textContent = msg
              ul.appendChild(li)
            })
          }
          function getLabelForField(el, fieldName) {
            try {
              if (el && el.id) {
                var direct = document.querySelector("label[for='" + el.id + "']")
                if (direct && direct.textContent) return direct.textContent.trim()
              }
              var group = el ? el.closest('.form-group') : null
              if (group) {
                var lbl = group.querySelector('label')
                if (lbl && lbl.textContent) return lbl.textContent.trim()
              }
            } catch (_) {}
            return fieldName
          }
          var firstErrorField = null
          Object.keys(errors).forEach(function (fieldName) {
            var fieldErrors = errors[fieldName]
            if (!Array.isArray(fieldErrors)) return
            var selector = "[name='" + fieldName + "']"
            var el = startupForm.querySelector(selector)
            if (!el) {
              // для файлов ids
              if (fieldName === 'creatives') el = document.getElementById('id_creatives_input')
              if (fieldName === 'video') el = document.getElementById('id_video_input')
              if (fieldName === 'proofs') el = document.getElementById('id_proofs_input')
            }
            if (el) {
              showFieldError(el, fieldErrors[0])
              if (!firstErrorField) firstErrorField = el
            }
            var label = getLabelForField(el, fieldName)
            var li = document.createElement('li')
            li.textContent = label + ': ' + fieldErrors.join(' ')
            ul.appendChild(li)
          })
          var target = firstErrorField ? (firstErrorField.closest('.form-group') || firstErrorField) : generalBox
          if (target) { instantScrollIntoView(target) }
        })
      } catch (_) {
        // если что-то пошло не так — позволим обычной отправке
      }
    })
  }
  // throttle scroll listeners
  function rafThrottle(fn){
    var ticking=false;return function(){if(!ticking){window.requestAnimationFrame(()=>{fn();ticking=false});ticking=true}}}
  // Consents strict lock
  var doc1Read=false, doc2Read=false;
  var currentDocNumber=null;
  function setConsentsState(){
    var r=document.getElementById('id_agree_rules');
    var d=document.getElementById('id_agree_data_processing');
    if(r){ r.removeAttribute('disabled'); }
    if(d){ d.removeAttribute('disabled'); }
  }
  setConsentsState();
  // Кнопка выбора лого — триггерит скрытый input
  ;(function(){
    var btn=document.getElementById('logoUploadButton')
    var input=document.getElementById('id_logo_input')
    if(btn && input){ btn.addEventListener('click', function(){ input.click() }) }
    // доп. клик по самой плитке логотипа
    var label=document.querySelector('.logo-upload-label')
    if(label && input){ label.addEventListener('click', function(e){ e.preventDefault(); input.click() }) }
  })()

  // Кнопка выбора изображения карточки каталога — триггерит скрытый input
  ;(function(){
    var btn=document.getElementById('catalogCardImageUploadButton')
    var input=document.getElementById('id_catalog_card_image_input')
    if(btn && input){ 
      btn.addEventListener('click', function(){ input.click() }) 
    }
    // доп. клик по самой плитке изображения карточки
    var label=document.querySelector('.catalog-card-image-label')
    if(label && input){ 
      label.addEventListener('click', function(e){ e.preventDefault(); input.click() }) 
    }
  })()

  // Кнопки выбора файлов уже имеют inline onclick в шаблоне — дублирующее навешивание убрано

  // Планеты (3D вращающийся div)
  try {
    var cfg = (window.STARTUP_FORM_CONFIG||{})
    var planetChoices = Array.isArray(cfg.planetChoices)?cfg.planetChoices:[]
    var planetBaseUrl = cfg.planetBaseUrl || ''
    var currentPlanet = cfg.currentPlanet || null
    var planetInput = document.getElementById('id_planet_image')
    var planetRibbon = document.getElementById('planetRibbon')
    var prevBtn = document.querySelector('.planet-nav-button.prev-planet')
    var nextBtn = document.querySelector('.planet-nav-button.next-planet')
    var planetIndex = 0
    var planetDiv

    if(currentPlanet && planetChoices.length > 0){
      var foundIndex = planetChoices.indexOf(currentPlanet)
      if(foundIndex !== -1){
        planetIndex = foundIndex
      }
    }

    function setSrc(){
      if(!planetDiv) return
      var name=(planetChoices && planetChoices.length)?planetChoices[planetIndex]:''
      if(name){
        planetDiv.style.backgroundImage='url('+(planetBaseUrl||'')+name+')'
      }
      if(planetInput){ planetInput.value=(planetChoices && planetChoices.length)?name:'' }
    }
    function build(){
      if(!planetRibbon) return
      planetRibbon.innerHTML=''
      planetDiv=document.createElement('div')
      planetDiv.className='planet-ribbon-3d'
      planetDiv.style.width='100%'
      planetDiv.style.height='100%'
      planetDiv.style.borderRadius='50%'
      planetDiv.style.backgroundSize='200% 100%'
      planetDiv.style.backgroundRepeat='repeat-x'
      planetDiv.style.animation='planet-chooser-spin 12s linear infinite'
      planetDiv.style.position='relative'
      planetDiv.style.overflow='hidden'
      planetRibbon.appendChild(planetDiv)
      setSrc()
    }
    function shift(dir){
      if(!planetRibbon) return
      var total=(planetChoices && planetChoices.length)?planetChoices.length:1
      planetIndex=(planetIndex+(dir==='next'?1:-1)+total)%total
      setSrc()
    }
    if(planetRibbon){ build() }
    if(prevBtn) prevBtn.addEventListener('click', function(){ shift('prev') })
    if(nextBtn) nextBtn.addEventListener('click', function(){ shift('next') })
  } catch(_) {}

  // Модалка согласий (мгновенно)
  function openConsentModalInstant(docNumber){
    var modal=document.getElementById('consentsModal')
    var content=document.getElementById('consentDocContent')
    var title=document.getElementById('consentDocTitle')
    var confirm=document.getElementById('consentConfirmBtn')
    if(!modal||!content||!title||!confirm) return
    currentDocNumber = docNumber
    title.textContent = docNumber===1?'Политика конфиденциальности':'Согласие на обработку персональных данных'
    content.innerHTML=''
    var inner=document.createElement('div')
    inner.style.maxHeight='60vh'; inner.style.overflow='auto'; inner.style.padding='16px'; inner.style.whiteSpace='pre-wrap'; inner.style.lineHeight='1.45'
    var policyText = `1. ОБЩИЕ ПОЛОЖЕНИЯ

1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, хранения, обработки и защиты персональных данных пользователей интернет-платформы https://www.greatideas.ru (далее — «Платформа»), принадлежащей Обществу с Ограниченной Ответственностью "КОНСУЛЬТАНТ-ЭНЕРГО" ИНН 2309175360 В лице директора Толмачева Владимира Эдуардовича, находящегося по адресу 350058, Краснодарский край, Краснодар г., Ставропольская ул., дом 336/3, офис ПОМЕЩ. 6 (далее — «Оператор»).
1.2. Настоящая Политика разработана в соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных», иными нормативными актами РФ, а также учитывает требования действующего законодательства о защите информации.
1.3. Используя Платформу, Пользователь подтверждает своё согласие с условиями настоящей Политики. В случае несогласия Пользователь обязан воздержаться от использования Платформы.

2. СОСТАВ И КАТЕГОРИИ ОБРАБАТЫВАЕМЫХ ДАННЫХ

2.1. В рамках предоставления услуг Оператор может обрабатывать следующие персональные данные Пользователей:
фамилия, имя, отчество (при наличии);
адрес электронной почты (e-mail);
номер телефона;
данные, указанные при регистрации, публикации проектов, оформлении подписки;
иные сведения, которые Пользователь предоставляет добровольно.
2.2. Кроме того, при посещении Платформы автоматически собираются технические данные: IP-адрес, данные cookies, параметры браузера, время доступа, источник перехода, сведения о действиях на сайте.
2.3. Оператор не собирает специальные категории данных (о расовой принадлежности, религиозных убеждениях, состоянии здоровья и т.п.).

3. ЦЕЛИ ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ

3.1. Персональные данные Пользователей обрабатываются исключительно для следующих целей:
регистрации и идентификации Пользователей на Платформе;
обеспечения доступа к функционалу Платформы;
оказания услуг, включая размещение проектов, рекламных материалов и подписок;
направления уведомлений, запросов и иной информации, связанной с использованием Платформы;
улучшения качества сервиса и разработки новых функций;
соблюдения требований законодательства Российской Федерации.

4. ПРАВОВЫЕ ОСНОВАНИЯ ОБРАБОТКИ

4.1. Основанием для обработки персональных данных является:
согласие Пользователя на обработку данных, выраженное при регистрации и использовании Платформы;
необходимость исполнения договора между Пользователем и Оператором;
законные интересы Оператора, направленные на повышение качества сервиса;
исполнение обязательств, установленных законодательством РФ.

5. ХРАНЕНИЕ И УНИЧТОЖЕНИЕ ДАННЫХ
5.1. Персональные данные Пользователей хранятся на серверах, расположенных на территории Российской Федерации: город Москва (adminvps.ru).
5.2. Облачные сервисы за пределами РФ могут использоваться только для обработки обезличенных данных или технических данных, при обеспечении соответствия требованиям законодательства.
5.3. Срок хранения персональных данных определяется целями их обработки, но не превышает сроков, установленных законодательством.
5.4. По достижении целей обработки либо по отзыву согласия данные подлежат удалению или обезличиванию.

6. ПЕРЕДАЧА ПЕРСОНАЛЬНЫХ ДАННЫХ

6.1. Оператор не передаёт персональные данные третьим лицам, за исключением случаев, когда такая передача:
необходима для оказания услуг (например, хостинг-провайдерам, платёжным сервисам, подрядчикам по рекламе);
предусмотрена законодательством РФ;
осуществляется с согласия Пользователя.
6.2. Все подрядчики, получающие доступ к данным, обязаны соблюдать режим конфиденциальности и требования законодательства о защите персональных данных.
6.3. Передача персональных данных граждан РФ за пределы Российской Федерации осуществляется только с согласия пользователя или для обработки обезличенных данных, обеспечивающих соответствие требованиям 152-ФЗ.

7. ЗАЩИТА ПЕРСОНАЛЬНЫХ ДАННЫХ

7.1. Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения и иных неправомерных действий.
7.2. Меры защиты включают:
использование защищённых каналов передачи данных (SSL/TLS);
ограничение доступа сотрудников и подрядчиков к данным;
регулярное обновление программного обеспечения и контроль уязвимостей.

8. ПРАВА ПОЛЬЗОВАТЕЛЕЙ

8.1. Пользователь имеет право:
получать информацию о наличии у Оператора своих персональных данных;
требовать уточнения, блокирования или уничтожения своих данных;
отзывать согласие на обработку данных;
обжаловать действия Оператора в уполномоченный орган или суд.
8.2. Для реализации указанных прав Пользователь направляет письменный запрос на адрес электронной почты: gr3atideas@yandex.ru.

9. ОТВЕТСТВЕННОСТЬ

9.1. Оператор не несёт ответственности за действия третьих лиц, получивших доступ к персональным данным вследствие:
ошибок или неосторожных действий Пользователя;
сбоев связи, работы программного обеспечения, хакерских атак;
иных обстоятельств, не зависящих от Оператора.

11. ИЗМЕНЕНИЕ ПОЛИТИКИ

11.1. Оператор вправе вносить изменения в настоящую Политику без предварительного уведомления.
11.2. Новая редакция вступает в силу с момента её размещения на Платформе.
11.3. Пользователь обязан самостоятельно отслеживать актуальную версию Политики.

12. КОНТАКТНАЯ ИНФОРМАЦИЯ

12.1. Все запросы, связанные с обработкой персональных данных, направляются на адрес электронной почты: gr3atideas@yandex.ru.
12.2. Почтовый адрес для корреспонденции: 350058, Краснодарский край, Краснодар г., Ставропольская ул., дом 336/3, офис ПОМЕЩ.`
    var consentText = `Нажимая «Отправить», я даю согласие на обработку моих персональных данных (ФИО, телефон, email) сайтом https://www.greatideas.ru в целях связи, оказания услуг, маркетинга и формирования рекламных аудиторий.
Я подтверждаю, что мои персональные данные гражданина РФ будут храниться только на серверах, расположенных в Российской Федерации. Передача моих данных за пределы РФ возможна только в обезличенном виде или с моего отдельного согласия.
Я ознакомлен с Политикой конфиденциальности и принимаю её условия. Я понимаю, что могу отозвать согласие в любой момент.`
    inner.textContent = docNumber===1 ? policyText : consentText
    content.appendChild(inner)
    confirm.disabled=false
    modal.classList.add('open')
    modal.style.visibility='visible'; modal.style.opacity='1'
    confirm.onclick=function(){
      modal.classList.remove('open')
      modal.style.visibility='hidden'; modal.style.opacity='0'
      if(docNumber===1){
        doc1Read=true
        var cb1=document.getElementById('id_agree_rules')
        if(cb1){ cb1.checked=true; cb1.dispatchEvent(new Event('change')) }
      } else {
        doc2Read=true
        var cb2=document.getElementById('id_agree_data_processing')
        if(cb2){ cb2.checked=true; cb2.dispatchEvent(new Event('change')) }
      }
    }
    var close=document.getElementById('consentCloseBtn')
    if(close) close.onclick=function(){ modal.classList.remove('open'); modal.style.visibility='hidden'; modal.style.opacity='0' }
    modal.onclick=function(e){ if(e.target===modal){ modal.classList.remove('open'); modal.style.visibility='hidden'; modal.style.opacity='0' } }
    // принудительный фокус в модалку
    setTimeout(function(){ try{ (dialog||modal).focus({preventScroll:true}) }catch(_){ } }, 0)
  }
  // Экспортируем для inline-обработчиков в шаблоне
  window.openConsentModalInstant = openConsentModalInstant
  // Кнопки документов: строгое делегирование от контейнера
  var docsContainer=document.querySelector('.consents-docs-buttons')
  if(docsContainer){
    var handler=function(e){
      var btn=e.target && e.target.closest ? e.target.closest('.consent-doc-btn') : null
      if(!btn) return
      e.preventDefault();
      var n=parseInt(btn.getAttribute('data-doc'))||1
      openConsentModalInstant(n)
    }
    docsContainer.addEventListener('click', handler, true)
  }
  // Прямое навешивание на кнопки (подстраховка)
  document.querySelectorAll('.consent-doc-btn').forEach(function(b){
    if(!b._consentDirect){
      var fn=function(e){
        e.preventDefault();
        e.stopPropagation();
        var n=parseInt(b.getAttribute('data-doc'))||1
        openConsentModalInstant(n)
      }
      ;['click','mousedown','touchstart'].forEach(function(t){ b.addEventListener(t, fn, true) })
      b.style.pointerEvents='auto'
      b._consentDirect=true
    }
  })

  // Жёсткая привязка к лейблам чекбоксов (включая mousedown/touchstart)
  ;(function(){
    function bindLabel(labelSel, docNum){
      var lbl=document.querySelector(labelSel)
      if(!lbl) return
      var fn=function(e){ e.preventDefault(); e.stopPropagation(); openConsentModalInstant(docNum) }
      ;['click','mousedown','touchstart'].forEach(function(t){ lbl.addEventListener(t, fn, true) })
      lbl.style.pointerEvents='auto'
    }
    bindLabel('label[for="id_agree_rules"]', 1)
    bindLabel('label[for="id_agree_data_processing"]', 2)
  })()
  var agreeLabels=document.querySelectorAll('.agreement-section .custom-checkbox-label')
  if(agreeLabels && agreeLabels.length){
    agreeLabels.forEach(function(lbl){
      lbl.addEventListener('click', function(e){
        var inputId=this.getAttribute('for'); var input=document.getElementById(inputId)
        // Всегда открываем соответствующий документ по клику на чекбокс
        if(inputId==='id_agree_rules'){
          e.preventDefault(); openConsentModalInstant(1)
        } else if(inputId==='id_agree_data_processing'){
          e.preventDefault(); openConsentModalInstant(2)
        } else if(input && input.hasAttribute('disabled')){
          e.preventDefault(); openConsentModalInstant(!doc1Read?1:2)
        }
      })
    })
  }
  // Делегирование клика по любым лейблам согласий (на случай динамики/оверлеев)
  document.addEventListener('click', function(e){
    var lbl=e.target.closest && e.target.closest('.agreement-section .custom-checkbox-label')
    if(!lbl) return
    var inputId=lbl.getAttribute('for')
    if(inputId==='id_agree_rules'){ e.preventDefault(); openConsentModalInstant(1) }
    else if(inputId==='id_agree_data_processing'){ e.preventDefault(); openConsentModalInstant(2) }
  }, true)

  // Убираем плавный скролл — только мгновенный
  function instantScrollIntoView(node){ try{ node.scrollIntoView({behavior:'instant', block:'center'}) }catch(_){ node.scrollIntoView() } }
  // Подменяем вызовы внутри формы
  var originalScroll = Element.prototype.scrollIntoView
  // оставляем по умолчанию, а точечные места ниже вызываем instantScrollIntoView

  // Валидация — используем мгновенный скролл
  // (замена в одном месте ниже)

  // Починка кликов модалки (pointer-events)
  ;(function(){
    var modal=document.getElementById('consentsModal')
    if(modal){
      modal.addEventListener('click', function(e){
        if(e.target===modal){ modal.style.visibility='hidden'; modal.style.opacity='0' }
      })
      var dialog=modal.querySelector('.modal-dialog')
      if(dialog){ dialog.style.pointerEvents='auto' }
      var btn=document.getElementById('consentConfirmBtn')
      if(btn){ btn.style.pointerEvents='auto' }
      var close=document.getElementById('consentCloseBtn')
      if(close){ close.style.pointerEvents='auto' }
    }
  })()

  // Микроинвестиции — надёжная синхронизация
  ;(function(){
    var input=document.getElementById('id_micro_investment_available')
    var label=document.querySelector('label[for="id_micro_investment_available"]')
    function paint(){
      var icon=label?label.querySelector('.micro-checkbox-checked'):null
      if(icon) icon.style.display = (input && input.checked) ? 'block' : 'none'
    }
    if(input){ input.addEventListener('change', paint); paint() }
    if(label){
      label.addEventListener('click', function(e){
        if(input){ e.preventDefault(); input.checked = !input.checked; input.dispatchEvent(new Event('change')) }
      })
    }
  })()

  // Таймлайн — форс показать шаг 1 и его textarea
  ;(function(){
    var current=document.getElementById('step_number')
    if(current){ current.value=1 }
    var desc=document.getElementById('step-description-1')
    if(desc){ desc.classList.add('active') }
    var step=document.querySelector('.timeline-step[data-step="1"] .step-number-wrapper')
    if(step){ step.classList.add('active') }
  })()

  // Открытие модалки по кнопкам документов
  ;(function(){
    var btns=document.querySelectorAll('.consent-doc-btn')
    if(btns && btns.length){
      btns.forEach(function(b){
        b.addEventListener('click', function(){
          var n=parseInt(b.getAttribute('data-doc'))||1
          openConsentModalInstant(n)
        })
      })
    }
  })()
})
