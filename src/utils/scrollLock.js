/**
 * CIIS Network — Background Scroll Lock Manager
 * Prevents background page scrolling and horizontal layout jitter
 * across desktop and mobile devices when any modal is open.
 */

let lockCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

export const lockBackgroundScroll = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount += 1;
  if (lockCount === 1) {
    const html = document.documentElement;
    const body = document.body;

    originalHtmlOverflow = html.style.overflow;
    originalBodyOverflow = body.style.overflow;
    originalBodyPaddingRight = body.style.paddingRight;

    // Measure vertical scrollbar width to prevent horizontal layout shift
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    html.classList.add('ciis-modal-open');
    body.classList.add('ciis-modal-open');
  }
};

export const unlockBackgroundScroll = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = originalHtmlOverflow;
    body.style.overflow = originalBodyOverflow;
    body.style.paddingRight = originalBodyPaddingRight;

    html.classList.remove('ciis-modal-open');
    body.classList.remove('ciis-modal-open');
  }
};

// Automatic global watcher: If ANY modal in the entire app sets document.body.style.overflow = 'hidden',
// also sync document.documentElement and add ciis-modal-open so the background CANNOT scroll.
if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
  let isSyncing = false;
  const syncObserver = new MutationObserver(() => {
    if (isSyncing) return;
    const isBodyHidden = document.body && document.body.style.overflow === 'hidden';
    const isHtmlLocked = document.documentElement && document.documentElement.classList.contains('ciis-modal-open');

    if (isBodyHidden && !isHtmlLocked) {
      isSyncing = true;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('ciis-modal-open');
      document.body.classList.add('ciis-modal-open');
      isSyncing = false;
    } else if (!isBodyHidden && isHtmlLocked && lockCount === 0) {
      isSyncing = true;
      document.documentElement.style.overflow = '';
      document.documentElement.classList.remove('ciis-modal-open');
      document.body.classList.remove('ciis-modal-open');
      isSyncing = false;
    }
  });

  if (document.body) {
    syncObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      syncObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    });
  }
}
