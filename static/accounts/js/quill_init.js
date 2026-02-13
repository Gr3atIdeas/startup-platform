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

  /* ── Toolbar presets ─────────────────────────────────────── */
  var FULL_TOOLBAR = [
    [{ header: [2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['link', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['image', 'video'],
    ['clean']
  ];

  var SIMPLE_TOOLBAR = [
    ['bold', 'italic', 'link'],
    [{ list: 'ordered' }, { list: 'bullet' }]
  ];

  /* ── Image upload handler ────────────────────────────────── */
  function imageUploadHandler(quillInstance) {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = function () {
      var file = input.files[0];
      if (!file) return;
      var formData = new FormData();
      formData.append('upload', file);
      fetch('/api/ckeditor-upload/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
        body: formData
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.url) {
            var range = quillInstance.getSelection(true);
            quillInstance.insertEmbed(range.index, 'image', data.url);
            quillInstance.setSelection(range.index + 1);
          }
        })
        .catch(function (err) {
          console.error('Image upload error:', err);
        });
    };
  }

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

    /* Determine toolbar & modules */
    var toolbar = isFull ? FULL_TOOLBAR : SIMPLE_TOOLBAR;
    var modules = { toolbar: toolbar };

    /* Create Quill instance */
    var quill = new Quill(container, {
      theme: 'snow',
      modules: modules,
      placeholder: textarea.getAttribute('placeholder') || ''
    });

    /* Custom image upload for full editor */
    if (isFull) {
      quill.getModule('toolbar').addHandler('image', function () {
        imageUploadHandler(quill);
      });
    }

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
