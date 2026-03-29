/**
 * Lightweight Modal — drop-in replacement for bootstrap.Modal
 *
 * API (mirrors Bootstrap 5):
 *   const m = new bootstrap.Modal(element);
 *   m.show();
 *   m.hide();
 *   bootstrap.Modal.getInstance(element);
 *
 * Events dispatched on the modal element:
 *   show.bs.modal, shown.bs.modal, hide.bs.modal, hidden.bs.modal
 *
 * HTML contract (same as Bootstrap):
 *   <div class="modal fade" id="myModal" tabindex="-1">
 *     <div class="modal-dialog"> ... </div>
 *   </div>
 *   <button data-bs-dismiss="modal">Close</button>
 */
(function () {
  'use strict';

  const INSTANCES = new WeakMap();
  let backdropEl = null;
  let openCount = 0;

  function getOrCreateBackdrop() {
    if (!backdropEl) {
      backdropEl = document.createElement('div');
      backdropEl.className = 'modal-backdrop';
    }
    return backdropEl;
  }

  class Modal {
    constructor(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (!element) return;
      this._element = element;
      this._isShown = false;
      INSTANCES.set(element, this);

      // Delegate dismiss buttons
      element.addEventListener('click', (e) => {
        const dismissBtn = e.target.closest('[data-bs-dismiss="modal"]');
        if (dismissBtn) {
          this.hide();
        }
      });

      // Close on backdrop click
      element.addEventListener('mousedown', (e) => {
        if (e.target === element) {
          this.hide();
        }
      });

      // Close on Escape
      this._onKeydown = (e) => {
        if (e.key === 'Escape' && this._isShown) {
          this.hide();
        }
      };
    }

    show() {
      if (this._isShown || !this._element) return;

      this._element.dispatchEvent(new Event('show.bs.modal'));

      const backdrop = getOrCreateBackdrop();
      if (openCount === 0) {
        document.body.appendChild(backdrop);
        // Force reflow
        void backdrop.offsetHeight;
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
      openCount++;

      this._element.style.display = 'block';
      // Force reflow for transition
      void this._element.offsetHeight;
      this._element.classList.add('show');

      this._isShown = true;
      document.addEventListener('keydown', this._onKeydown);

      // Dispatch shown after transition
      const dialog = this._element.querySelector('.modal-dialog');
      if (dialog) {
        const onEnd = () => {
          dialog.removeEventListener('transitionend', onEnd);
          this._element.dispatchEvent(new Event('shown.bs.modal'));
        };
        dialog.addEventListener('transitionend', onEnd);
      } else {
        this._element.dispatchEvent(new Event('shown.bs.modal'));
      }
    }

    hide() {
      if (!this._isShown || !this._element) return;

      this._element.dispatchEvent(new Event('hide.bs.modal'));

      this._element.classList.remove('show');
      document.removeEventListener('keydown', this._onKeydown);

      openCount--;
      if (openCount <= 0) {
        openCount = 0;
        const backdrop = getOrCreateBackdrop();
        backdrop.classList.remove('show');
      }

      // Wait for transition then hide
      const dialog = this._element.querySelector('.modal-dialog');
      const cleanup = () => {
        if (dialog) dialog.removeEventListener('transitionend', cleanup);
        this._element.style.display = 'none';
        this._isShown = false;

        if (openCount <= 0 && backdropEl && backdropEl.parentNode) {
          backdropEl.parentNode.removeChild(backdropEl);
          document.body.style.overflow = '';
        }

        this._element.dispatchEvent(new Event('hidden.bs.modal'));
      };

      if (dialog) {
        dialog.addEventListener('transitionend', cleanup);
        // Fallback if transition doesn't fire
        setTimeout(cleanup, 300);
      } else {
        cleanup();
      }
    }

    dispose() {
      this.hide();
      INSTANCES.delete(this._element);
      this._element = null;
    }

    static getInstance(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      return element ? INSTANCES.get(element) || null : null;
    }

    static getOrCreateInstance(element) {
      return Modal.getInstance(element) || new Modal(element);
    }
  }

  // Expose as bootstrap.Modal (drop-in compatible)
  window.bootstrap = window.bootstrap || {};
  window.bootstrap.Modal = Modal;
})();
