import Swal from "sweetalert2";

const MODAL_STYLE_ID = "ciis-logout-modal-styles";

const injectLogoutModalStyles = () => {
  if (typeof document === "undefined" || document.getElementById(MODAL_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = MODAL_STYLE_ID;
  style.textContent = `
    .swal2-container.ciis-logout-container {
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
      background-color: rgba(15, 23, 42, 0.5) !important;
      z-index: 99999 !important;
    }

    .ciis-logout-popup {
      position: relative !important;
      border-radius: 18px !important;
      padding: 22px 20px 20px !important;
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.25) !important;
      max-width: 320px !important;
      width: 90% !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    }

    .ciis-logout-popup .swal2-html-container {
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      color: inherit !important;
    }

    .ciis-logout-icon-circle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2px auto 12px auto;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.18);
    }

    .ciis-logout-icon {
      width: 22px;
      height: 22px;
      color: #ef4444;
      stroke: #ef4444;
    }

    .ciis-logout-modal-title {
      font-size: 17px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0 0 6px 0 !important;
      letter-spacing: -0.01em !important;
      line-height: 1.3 !important;
      font-family: inherit !important;
    }

    .ciis-logout-modal-desc {
      font-size: 13px !important;
      color: #64748b !important;
      line-height: 1.45 !important;
      margin: 0 auto 16px auto !important;
      max-width: 260px !important;
      font-family: inherit !important;
    }

    .ciis-logout-actions {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 10px !important;
      margin: 0 !important;
      width: 100% !important;
      padding: 0 !important;
    }

    .ciis-logout-btn {
      font-family: inherit !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      border-radius: 10px !important;
      padding: 9px 16px !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      outline: none !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 1 !important;
      user-select: none !important;
      height: 38px !important;
      box-sizing: border-box !important;
    }

    .ciis-logout-cancel {
      background: #f1f5f9 !important;
      color: #475569 !important;
      border: 1px solid #e2e8f0 !important;
    }

    .ciis-logout-cancel:hover {
      background: #e2e8f0 !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
    }

    .ciis-logout-confirm {
      background: #ef4444 !important;
      color: #ffffff !important;
      border: 1px solid #ef4444 !important;
      box-shadow: 0 3px 10px rgba(239, 68, 68, 0.35) !important;
    }

    .ciis-logout-confirm:hover,
    .ciis-logout-confirm:focus,
    .ciis-logout-confirm:focus-visible {
      background: #dc2626 !important;
      border-color: #dc2626 !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35), 0 4px 14px rgba(239, 68, 68, 0.45) !important;
    }

    .ciis-logout-btn:active {
      transform: translateY(1px) scale(0.98) !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Standard, fast, and rock-solid SweetAlert2 Logout confirmation modal.
 * @param {Object} options
 * @param {Function} options.navigate - React Router navigate function
 * @param {string} [options.redirectPath='/'] - Target redirect path after logout
 */
export const handleAppLogout = async ({ navigate, redirectPath = "/" } = {}) => {
  injectLogoutModalStyles();

  const modalHtml = `
    <div style="text-align: center;">
      <div class="ciis-logout-icon-circle">
        <svg class="ciis-logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </div>
      <div class="ciis-logout-modal-title">Log Out?</div>
      <div class="ciis-logout-modal-desc">
        Are you sure you want to log out of your account?
      </div>
    </div>
  `;

  const result = await Swal.fire({
    html: modalHtml,
    showCancelButton: true,
    confirmButtonText: "Log Out",
    cancelButtonText: "Cancel",
    buttonsStyling: false,
    reverseButtons: true,
    focusConfirm: true,
    focusCancel: false,
    allowOutsideClick: true,
    allowEscapeKey: true,
    didOpen: () => {
      Swal.getConfirmButton()?.focus();
    },
    customClass: {
      container: "ciis-logout-container",
      popup: "ciis-logout-popup",
      actions: "ciis-logout-actions",
      confirmButton: "ciis-logout-btn ciis-logout-confirm",
      cancelButton: "ciis-logout-btn ciis-logout-cancel",
    },
  });

  // If user clicked Cancel, clicked backdrop, or pressed Escape: stay logged in!
  if (!result || !result.isConfirmed) {
    return;
  }

  // Clear auth keys immediately
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("companyDetails");
    localStorage.removeItem("sidebarConfig");
    localStorage.removeItem("unreadCount");
    localStorage.removeItem("superAdmin");
  } catch (err) {
    console.error("Logout cleanup error:", err);
  }

  // Immediate redirect: no lingering timer or delayed popup!
  if (navigate) {
    navigate(redirectPath);
  } else {
    window.location.href = redirectPath;
  }
};
