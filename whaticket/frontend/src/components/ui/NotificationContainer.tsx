import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import useNotificationStore from '@/stores/notificationStore';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotificationStore();

  // Create portal container if it doesn't exist
  useEffect(() => {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-3';
      document.body.appendChild(container);
    }

    return () => {
      const existingContainer = document.getElementById('notification-container');
      if (existingContainer && existingContainer.children.length === 0) {
        document.body.removeChild(existingContainer);
      }
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-sky-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
      default:
        return 'bg-sky-50 border-sky-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
      default:
        return 'text-sky-800';
    }
  };

  if (notifications.length === 0) return null;

  const container = document.getElementById('notification-container');
  if (!container) return null;

  return createPortal(
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 pointer-events-auto
            transform transition-all duration-300 ease-in-out
            ${getBgColor(notification.type)}
          `}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                {notification.title && (
                  <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                    {notification.title}
                  </p>
                )}
                <p className={`text-sm ${getTextColor(notification.type)} ${notification.title ? 'mt-1' : ''}`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className={`
                    inline-flex rounded-md p-1.5 transition-colors
                    ${getTextColor(notification.type)} hover:bg-white hover:bg-opacity-75
                  `}
                  onClick={() => removeNotification(notification.id)}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>,
    container
  );
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

export default NotificationContainer;