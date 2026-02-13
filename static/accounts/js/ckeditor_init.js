import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Heading,
  List,
  BlockQuote,
  Image,
  ImageUpload,
  ImageBlock,
  ImageInline,
  ImageResize,
  MediaEmbed,
  Paragraph,
  Undo,
  SimpleUploadAdapter
} from 'https://cdn.ckeditor.com/ckeditor5/47.5.0/ckeditor5.js';

import ruTranslations from 'https://cdn.ckeditor.com/ckeditor5/47.5.0/translations/ru.js';

/* ── CSRF helper ─────────────────────────────────────────── */
function getCSRFToken() {
  var input = document.querySelector('input[name="csrfmiddlewaretoken"]');
  if (input) return input.value;
  var m = document.cookie.match(/csrftoken=([^;]+)/);
  return m ? m[1] : '';
}

/* ── Configs ─────────────────────────────────────────────── */
var FULL_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Bold, Italic, Underline, Strikethrough,
    Link, Heading, List, BlockQuote,
    Image, ImageUpload, ImageBlock, ImageInline, ImageResize,
    MediaEmbed, Paragraph, Undo, SimpleUploadAdapter
  ],
  toolbar: {
    items: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
      'imageUpload', 'mediaEmbed', '|',
      'undo', 'redo'
    ],
    shouldNotGroupWhenFull: false
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Текст', class: 'ck-heading_paragraph' },
      { model: 'heading2', view: 'h2', title: 'Заголовок 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Заголовок 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Заголовок 4', class: 'ck-heading_heading4' }
    ]
  },
  simpleUpload: {
    uploadUrl: '/api/ckeditor-upload/',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  },
  mediaEmbed: {
    previewsInData: true
  },
  language: 'ru',
  translations: [ruTranslations]
};

var SIMPLE_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Bold, Italic, Link, List, Paragraph, Undo
  ],
  toolbar: {
    items: [
      'bold', 'italic', 'link', '|',
      'bulletedList', 'numberedList', '|',
      'undo', 'redo'
    ]
  },
  language: 'ru',
  translations: [ruTranslations]
};

/* ── Init all editors on page ────────────────────────────── */
var editors = [];

document.querySelectorAll('textarea.ckeditor-full').forEach(function(textarea) {
  ClassicEditor.create(textarea, FULL_CONFIG)
    .then(function(editor) {
      editors.push(editor);
    })
    .catch(function(err) {
      console.error('CKEditor full init error:', err);
    });
});

document.querySelectorAll('textarea.ckeditor-simple').forEach(function(textarea) {
  ClassicEditor.create(textarea, SIMPLE_CONFIG)
    .then(function(editor) {
      editors.push(editor);
    })
    .catch(function(err) {
      console.error('CKEditor simple init error:', err);
    });
});

/* Expose for external use (e.g. popup forms) */
window.CKEditorInstances = editors;
window.initCKEditor = function(textarea, type) {
  var config = type === 'simple' ? Object.assign({}, SIMPLE_CONFIG) : Object.assign({}, FULL_CONFIG);
  /* Refresh CSRF token for dynamically created editors */
  if (config.simpleUpload) {
    config.simpleUpload.headers = { 'X-CSRFToken': getCSRFToken() };
  }
  return ClassicEditor.create(textarea, config).then(function(editor) {
    editors.push(editor);
    return editor;
  });
};
