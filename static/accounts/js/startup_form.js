document.addEventListener('DOMContentLoaded', function () {
  var logoInput = document.getElementById('id_logo_input')
  var logoLabel = document.querySelector('.logo-upload-label')
  var logoPlaceholder = document.getElementById('logoPlaceholder')
  var logoPreview = document.getElementById('logoPreview')
  function toArray(fileList) {
    return Array.prototype.slice.call(fileList || [])
  }
  function createPreviewItem(params) {
    var container = document.createElement('div')
    container.className = 'file-preview-item'
    var info = document.createElement('div')
    info.className = 'file-info'
    if (params.previewNode) {
      info.appendChild(params.previewNode)
    }
    var textWrap = document.createElement('div')
    textWrap.className = 'file-text-details'
    var nameEl = document.createElement('p')
    nameEl.className = 'file-name-display'
    nameEl.textContent = params.displayName
    textWrap.appendChild(nameEl)
    if (params.typeLabel) {
      var typeEl = document.createElement('p')
      typeEl.className = 'file-type-display'
      typeEl.textContent = params.typeLabel
      textWrap.appendChild(typeEl)
    }
    info.appendChild(textWrap)
    container.appendChild(info)
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
    function clearPreview() {
      preview.innerHTML = ''
    }
    function updatePreview(files) {
      clearPreview()
      files.forEach(function (file) {
        var previewNode
        var displayName = file.name
        var typeLabel = ''
        if (options.kind === 'image') {
          var img = document.createElement('img')
          img.className = 'preview-image'
          var reader = new FileReader()
          reader.onload = function (e) {
            img.src = e.target.result
          }
          reader.readAsDataURL(file)
          previewNode = img
          typeLabel = 'IMAGE'
        } else if (options.kind === 'video') {
          var video = document.createElement('video')
          video.setAttribute('controls', 'controls')
          video.style.maxWidth = '200px'
          video.style.maxHeight = '150px'
          var readerV = new FileReader()
          readerV.onload = function (e) {
            video.src = e.target.result
          }
          readerV.readAsDataURL(file)
          previewNode = video
          typeLabel = 'VIDEO'
        } else {
          var icon = document.createElement('div')
          icon.className = 'file-icon'
          icon.style.width = '36px'
          icon.style.height = '36px'
          icon.style.background = '#e0e0e0'
          icon.style.borderRadius = '4px'
          previewNode = icon
          typeLabel = 'FILE'
        }
        var item = createPreviewItem({ previewNode: previewNode, displayName: displayName, typeLabel: typeLabel })
        preview.appendChild(item)
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
      var dt = new DataTransfer()
      files.forEach(function (f) { dt.items.add(f) })
      input.files = dt.files
      updatePreview(toArray(input.files))
    }
    input.addEventListener('change', function () {
      var files = toArray(input.files)
      var filtered = filterFiles(files)
      setFiles(filtered)
    })
    dropArea.addEventListener('dragover', function (e) {
      e.preventDefault()
    })
    dropArea.addEventListener('drop', function (e) {
      e.preventDefault()
      var dropped = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : []
      var current = toArray(input.files)
      var combined = current.concat(toArray(dropped))
      var filtered = filterFiles(combined)
      setFiles(filtered)
    })
  }
  // Ограничиваем клик логотипа только кнопкой (см. шаблон: #logoUploadButton)
  if (logoInput && logoPreview && logoPlaceholder) {
    logoInput.addEventListener('change', function () {
      var file = logoInput.files && logoInput.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function (e) {
        logoPreview.src = e.target.result
        logoPreview.style.display = 'block'
        logoPlaceholder.style.display = 'none'
      }
      reader.readAsDataURL(file)
    })
  }
  bindInputWithDropArea('id_creatives_input', 'creativesDropArea', 'creativesPreview', { kind: 'image', mimePrefix: 'image/', maxCount: 3 })
  bindInputWithDropArea('id_video_input', 'videoDropArea', 'videoPreview', { kind: 'video', mimePrefix: 'video/', maxCount: 3 })
  bindInputWithDropArea('id_proofs_input', 'proofsDropArea', 'proofsPreview', { kind: 'file', allowedExts: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'], maxCount: 10 })
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

  var startupForm = document.getElementById('startupForm')
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
    var requiredSelectors = [
      "[name='title']",
      "[name='direction']",
      "[name='funding_goal']",
      "[name='stage']",
      "[name='short_description']",
      "[name='description']",
      "[name='terms']",
      "#id_planet_image",
    ]
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
    var creativesInput = document.getElementById('id_creatives_input')
    var videoInput = document.getElementById('id_video_input')
    var proofsInput = document.getElementById('id_proofs_input')
    if (creativesInput) {
      var c = creativesInput.files ? creativesInput.files.length : 0
      if (c < 1) {
        hasError = true
        showFieldError(creativesInput, 'Добавьте хотя бы 1 изображение (до 3)')
      } else if (c > 3) {
        hasError = true
        showFieldError(creativesInput, 'Не более 3 изображений')
      } else {
        clearFieldError(creativesInput)
      }
    }
    if (videoInput) {
      var v = videoInput.files ? videoInput.files.length : 0
      if (v < 1) {
        hasError = true
        showFieldError(videoInput, 'Добавьте хотя бы 1 видео (до 3)')
      } else if (v > 3) {
        hasError = true
        showFieldError(videoInput, 'Не более 3 видео')
      } else {
        clearFieldError(videoInput)
      }
    }
    if (proofsInput) {
      var p = proofsInput.files ? proofsInput.files.length : 0
      if (p < 1) {
        hasError = true
        showFieldError(proofsInput, 'Добавьте хотя бы 1 документ (до 10)')
      } else if (p > 10) {
        hasError = true
        showFieldError(proofsInput, 'Не более 10 документов')
      } else {
        clearFieldError(proofsInput)
      }
    }
    return !hasError
  }
  if (startupForm) {
    startupForm.addEventListener('submit', function (e) {
      // очищаем предыдущие ошибки
      Array.prototype.forEach.call(startupForm.querySelectorAll('.input-error'), function (el) {
        el.classList.remove('input-error')
      })
      Array.prototype.forEach.call(startupForm.querySelectorAll('.custom-validation-error'), function (el) {
        el.remove()
      })
      var ok = validateFormClientSide()
      if (!ok) {
        e.preventDefault()
        var firstError = startupForm.querySelector('.input-error') || startupForm.querySelector('.custom-validation-error')
        if (firstError) {
          var target = firstError.closest('.form-group') || firstError
          if (target) { instantScrollIntoView(target) }
        }
        return
      }

      // AJAX submit, чтобы не терялись прикрепленные файлы при серверных ошибках
      try {
        e.preventDefault()
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
  var currentDocNumber=null; // 1 или 2 — какой документ открыт сейчас
  function setConsentsState(){
    var allow=doc1Read&&doc2Read;
    var r=document.getElementById('id_agree_rules');
    var d=document.getElementById('id_agree_data_processing');
    if(r){ if(allow){ r.removeAttribute('disabled'); } else { r.setAttribute('disabled','disabled'); r.checked=false; } }
    if(d){ if(allow){ d.removeAttribute('disabled'); } else { d.setAttribute('disabled','disabled'); d.checked=false; } }
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

  // Надёжные кнопки для файлов
  ;(function(){
    var bind=function(btnSelector, inputId){
      var btn=document.querySelector(btnSelector)
      var input=document.getElementById(inputId)
      if(btn && input){ btn.addEventListener('click', function(){ input.click() }) }
    }
    bind('#creativesDropArea .custom-file-upload-button','id_creatives_input')
    bind('#videoDropArea .custom-file-upload-button','id_video_input')
    bind('#proofsDropArea .custom-file-upload-button','id_proofs_input')
  })()

  // Планеты (оптимизация: один IMG)
  try {
    var cfg = (window.STARTUP_FORM_CONFIG||{})
    var planetChoices = Array.isArray(cfg.planetChoices)?cfg.planetChoices:[]
    var planetBaseUrl = cfg.planetBaseUrl || ''
    var planetInput = document.getElementById('id_planet_image')
    var planetRibbon = document.getElementById('planetRibbon')
    var prevBtn = document.querySelector('.planet-nav-button.prev-planet')
    var nextBtn = document.querySelector('.planet-nav-button.next-planet')
    var planetIndex = 0
    var imgEl
    function setSrc(){
      if(!imgEl) return
      var name=(planetChoices && planetChoices.length)?planetChoices[planetIndex]:'placeholder.svg'
      imgEl.src=(planetBaseUrl||'')+name
      if(planetInput){ planetInput.value=(planetChoices && planetChoices.length)?name:'' }
    }
    function build(){
      if(!planetRibbon) return
      planetRibbon.innerHTML=''
      imgEl=document.createElement('img')
      imgEl.className='planet-ribbon-item'
      imgEl.loading='lazy'; imgEl.decoding='async'
      imgEl.onerror=function(){ imgEl.src='https://via.placeholder.com/520x520?text=Planet' }
      planetRibbon.appendChild(imgEl)
      planetIndex=0
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
    title.textContent = docNumber===1?'Документ 1':'Документ 2'
    content.innerHTML=''
    var inner=document.createElement('div')
    inner.style.maxHeight='60vh'; inner.style.overflow='auto'; inner.style.padding='8px'
    inner.innerHTML = ('<p>Текст документа '+docNumber+'. Пролистайте до конца для подтверждения.</p>').repeat(12)
    content.appendChild(inner)
    confirm.disabled=true
    inner.onscroll=function(){ if(inner.scrollTop+inner.clientHeight>=inner.scrollHeight-2){ confirm.disabled=false } }
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
      setConsentsState()
    }
    var close=document.getElementById('consentCloseBtn')
    if(close) close.onclick=function(){ modal.classList.remove('open'); modal.style.visibility='hidden'; modal.style.opacity='0' }
    modal.onclick=function(e){ if(e.target===modal){ modal.classList.remove('open'); modal.style.visibility='hidden'; modal.style.opacity='0' } }
  }
  // Кнопки документов: навешиваем и через делегирование на случай рендеров
  function bindConsentButtons(){
    document.querySelectorAll('.consent-doc-btn').forEach(function(b){
      if(!b._consentBound){
        b.addEventListener('click', function(){
          var n=parseInt(b.getAttribute('data-doc'))||1
          openConsentModalInstant(n)
        })
        b._consentBound=true
      }
    })
  }
  bindConsentButtons()
  document.addEventListener('click', function(e){
    if(e.target && e.target.classList && e.target.classList.contains('consent-doc-btn')){
      var n=parseInt(e.target.getAttribute('data-doc'))||1
      openConsentModalInstant(n)
    }
  })
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
