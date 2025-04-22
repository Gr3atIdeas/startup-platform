document.addEventListener('DOMContentLoaded', function() {
  document.documentElement.style.scrollBehavior = 'smooth';
  
  var style = document.createElement('style');
  style.textContent = 
    'html { scroll-behavior: smooth; } ' +
    '* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; } ' +
    'img, video, svg { shape-rendering: geometricPrecision; image-rendering: -webkit-optimize-contrast; } ' +
    'button, .btn, input, .wave-effect { backface-visibility: hidden; -webkit-backface-visibility: hidden; }';
  
  document.head.appendChild(style);
}); 