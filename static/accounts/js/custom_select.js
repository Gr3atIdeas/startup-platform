/**
 * Custom Select — replaces native <select> dropdowns with styled versions.
 * Auto-initializes all <select> inside .sort-dropdown on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.sort-dropdown select, select.sidebar-select').forEach(function (nativeSelect) {
    // Build custom markup
    var wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    var trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML =
      '<span class="cs-label">' + nativeSelect.options[nativeSelect.selectedIndex].text + '</span>' +
      '<span class="cs-arrow"></span>';

    var optionsList = document.createElement('div');
    optionsList.className = 'custom-select-options';

    Array.prototype.forEach.call(nativeSelect.options, function (opt) {
      var item = document.createElement('div');
      item.className = 'custom-select-option' + (opt.selected ? ' selected' : '');
      item.textContent = opt.text;
      item.dataset.value = opt.value;
      optionsList.appendChild(item);
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsList);

    // Insert custom, hide native
    nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);
    nativeSelect.classList.add('native-hidden');

    // Toggle dropdown
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      // Close other open selects
      document.querySelectorAll('.custom-select-wrapper.open').forEach(function (w) {
        if (w !== wrapper) w.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });

    // Select option
    optionsList.addEventListener('click', function (e) {
      var option = e.target.closest('.custom-select-option');
      if (!option) return;
      // Update native select
      nativeSelect.value = option.dataset.value;
      // Update label
      trigger.querySelector('.cs-label').textContent = option.textContent;
      // Update selected class
      optionsList.querySelectorAll('.custom-select-option').forEach(function (o) {
        o.classList.remove('selected');
      });
      option.classList.add('selected');
      // Close
      wrapper.classList.remove('open');
      // Trigger change event on native select
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // Close on click outside
  document.addEventListener('click', function () {
    document.querySelectorAll('.custom-select-wrapper.open').forEach(function (w) {
      w.classList.remove('open');
    });
  });
});
