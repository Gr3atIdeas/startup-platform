/* Quill.js — Rich text editor initialization for GreatIdeas platform */

(function () {
  'use strict';

  /* ── CSRF helper ─────────────────────────────────────────── */
  function getCSRFToken() {
    var input = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (input) return input.value;
    var m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : '';
  }

  /* ── Image upload handler (used as toolbar handler, `this` = toolbar) ── */
  function handleImageUpload() {
    var quill = this.quill;
    var fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/png, image/jpeg, image/gif, image/webp');
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      document.body.removeChild(fileInput);
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Максимальный размер изображения — 5 МБ');
        return;
      }

      var formData = new FormData();
      formData.append('upload', file);

      var range = quill.getSelection(true);

      fetch('/api/ckeditor-upload/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
        body: formData
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Upload failed: ' + response.status);
          return response.json();
        })
        .then(function (data) {
          if (data.url) {
            quill.insertEmbed(range.index, 'image', data.url, 'user');
            quill.setSelection(range.index + 1);
          } else if (data.error) {
            alert('Ошибка загрузки: ' + (data.error.message || data.error));
          }
        })
        .catch(function (err) {
          console.error('Image upload error:', err);
          alert('Ошибка при загрузке изображения');
        });
    });

    fileInput.click();
  }

  /* ── Toolbar presets ─────────────────────────────────────── */
  var FULL_TOOLBAR = {
    container: [
      [{ header: [2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['link', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['image', 'video'],
      ['clean']
    ],
    handlers: {
      image: handleImageUpload
    }
  };

  var SIMPLE_TOOLBAR = {
    container: [
      ['bold', 'italic', 'link'],
      [{ list: 'ordered' }, { list: 'bullet' }]
    ]
  };

  /* ── Initialize one editor ───────────────────────────────── */
  function initEditor(textarea, isFull) {
    /* Create container div */
    var container = document.createElement('div');
    container.className = 'quill-editor-container';

    /* Pre-fill with existing content (for edit forms) */
    var existingContent = textarea.value || '';
    container.innerHTML = existingContent;

    /* Hide textarea, insert editor div after it */
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(container, textarea.nextSibling);

    /* Create Quill instance */
    var quill = new Quill(container, {
      theme: 'snow',
      modules: {
        toolbar: isFull ? FULL_TOOLBAR : SIMPLE_TOOLBAR
      },
      placeholder: textarea.getAttribute('placeholder') || ''
    });

    /* Sync to textarea on every change */
    quill.on('text-change', function () {
      var html = quill.root.innerHTML;
      /* Quill sets <p><br></p> for empty content — normalize to empty string */
      if (html === '<p><br></p>') html = '';
      textarea.value = html;
    });

    /* Also sync on form submit (safety net) */
    var form = textarea.closest('form');
    if (form) {
      form.addEventListener('submit', function () {
        var html = quill.root.innerHTML;
        if (html === '<p><br></p>') html = '';
        textarea.value = html;
      });
    }

    return quill;
  }

  /* ── Init all editors on page ────────────────────────────── */
  function initAll() {
    var editors = [];

    document.querySelectorAll('textarea.ckeditor-full').forEach(function (textarea) {
      if (textarea.dataset.quillReady) return;
      textarea.dataset.quillReady = '1';
      editors.push(initEditor(textarea, true));
    });

    document.querySelectorAll('textarea.ckeditor-simple').forEach(function (textarea) {
      if (textarea.dataset.quillReady) return;
      textarea.dataset.quillReady = '1';
      editors.push(initEditor(textarea, false));
    });

    return editors;
  }

  /* Run on DOMContentLoaded or immediately if DOM already ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.QuillEditors = initAll();
    });
  } else {
    window.QuillEditors = initAll();
  }

  /* Expose for dynamic initialization (popups, modals) */
  window.initQuillEditor = function (textarea, type) {
    var isFull = type !== 'simple';
    return initEditor(textarea, isFull);
  };
})();
