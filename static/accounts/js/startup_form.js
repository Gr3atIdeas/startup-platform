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
  if (logoLabel && logoInput) {
    logoLabel.addEventListener('click', function (e) {
      if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'input') return
      logoInput.click()
    })
  }
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
    var activeTextarea = document.querySelector('.timeline-description-container.active textarea')
    if (activeTextarea) activeTextarea.focus()
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
})
