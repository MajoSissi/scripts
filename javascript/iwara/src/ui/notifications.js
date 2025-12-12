let notificationContainer = null;
const activeNotifications = new Set();

/**
 * @param {() => Array<{url: string, enabled: boolean}>} getProxyList
 */
export function createNotifier(getProxyList) {
  /**
   * @param {string} message
   * @param {{ proxyPrefix?: string, proxyUrl?: string, proxyHostname?: string } | undefined} meta
   */
  function withProxyHint(message, meta) {
    try {
      const hostname =
        (typeof meta?.proxyHostname === 'string' && meta.proxyHostname.trim()) ||
        (typeof meta?.proxyUrl === 'string' && meta.proxyUrl.trim() && new URL(meta.proxyUrl).hostname) ||
        (typeof meta?.proxyPrefix === 'string' && meta.proxyPrefix.trim() && new URL(meta.proxyPrefix).hostname);

      if (!hostname) return message;

      const enabledCount = (getProxyList?.() || []).filter((p) => p?.enabled).length;
      return `${message}\n🔗 本次代理: ${hostname}`;
    } catch {
      return message;
    }
  }

  /**
   * @param {string} message
   * @param {'info'|'success'|'error'} [type]
   * @param {{ proxyPrefix?: string, proxyUrl?: string, proxyHostname?: string }} [meta]
   */
  function notify(message, type = 'info', meta) {
    message = withProxyHint(message, meta);

    const styles = {
      error: {
        bg: 'linear-gradient(135deg, #e06c75 0%, #be5046 100%)',
        glow: 'rgba(224, 108, 117, 0.45)',
        glowStrong: 'rgba(224, 108, 117, 0.75)'
      },
      success: {
        bg: 'linear-gradient(135deg, #98c379 0%, #7bbd6a 100%)',
        glow: 'rgba(152, 195, 121, 0.45)',
        glowStrong: 'rgba(152, 195, 121, 0.75)'
      },
      info: {
        bg: 'linear-gradient(135deg, #61afef 0%, #56b6c2 100%)',
        glow: 'rgba(97, 175, 239, 0.45)',
        glowStrong: 'rgba(97, 175, 239, 0.75)'
      }
    };

    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'iwara-notification-container';
      notificationContainer.style.cssText = [
        'position: fixed',
        'top: 20px',
        'right: 20px',
        'z-index: 9999999',
        'display: flex',
        'flex-direction: column',
        'gap: 12px',
        'pointer-events: none'
      ].join(';');
      document.body.appendChild(notificationContainer);

      if (!document.getElementById('iwara-notification-styles')) {
        const globalStyles = document.createElement('style');
        globalStyles.id = 'iwara-notification-styles';
        globalStyles.textContent = `
          @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(globalStyles);
      }
    }

    const style = styles[type] || styles.info;
    const notification = document.createElement('div');
    notification.className = 'iwara-notification-item';
    notification.style.cssText = [
      'padding: 16px 24px',
      `background: ${style.bg}`,
      'color: white',
      'border-radius: 12px',
      `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px ${style.glow}`,
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 14px',
      'font-weight: 600',
      'border: 2px solid rgba(255, 255, 255, 0.3)',
      'animation: slideInRight 0.3s ease',
      'white-space: pre-line',
      'pointer-events: auto',
      'transition: transform 0.3s ease, opacity 0.3s ease'
    ].join(';');

    const pulseId = `pulse-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes ${pulseId} {
        0%, 100% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px ${style.glow}; }
        50% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 30px ${style.glowStrong}, 0 0 10px rgba(255, 255, 255, 0.5); }
      }
    `;
    notification.appendChild(styleSheet);
    notification.style.animation += `, ${pulseId} 1.5s ease-in-out infinite`;

    notification.textContent = message;
    notificationContainer.appendChild(notification);
    activeNotifications.add(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        activeNotifications.delete(notification);
        notification.remove();
        if (activeNotifications.size === 0 && notificationContainer) {
          notificationContainer.remove();
          notificationContainer = null;
        }
      }, 300);
    }, 3000);
  }

  return notify;
}
