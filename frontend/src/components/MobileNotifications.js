import React, { useState, useEffect } from 'react';

const MobileNotifications = ({ 
  notifications = [], 
  unreadCount = 0, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDeleteNotification,
  onToggleNotifications,
  showNotifications = false 
}) => {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [subscribedToPush, setSubscribedToPush] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setSubscribedToPush(!!subscription);
        });
      });
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!pushSupported) {
      alert('Push notifications are not supported on this device');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPushNotifications();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // For demo purposes, we'll use a dummy VAPID key
      // In production, you'd get this from your backend
      const vapidPublicKey = 'BMxG-VmFL2lBTf0bXWHO1YQk-eSrX8rFgIGdOPqcJYp1t1kC7qGGY7l1B9k6bKYsW7q1fIrOyRdDqPjd8hYQw';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      // Send subscription to backend
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            device_type: getMobileDeviceType()
          })
        });
      }
      
      setSubscribedToPush(true);
      console.log('Push notification subscription successful');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        const token = localStorage.getItem('auth_token');
        if (token) {
          await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint
            })
          });
        }
      }
      
      setSubscribedToPush(false);
      console.log('Unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getMobileDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    return 'mobile';
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-success bg-opacity-25 text-success',
      medium: 'bg-warning bg-opacity-25 text-warning',
      high: 'bg-info bg-opacity-25 text-info',
      urgent: 'bg-danger bg-opacity-25 text-danger'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (type) => {
    const icons = {
      enrollment_approved: '✅',
      enrollment_rejected: '❌',
      session_reminder: '⏰',
      exam_scheduled: '📝',
      course_completed: '🎓',
      certificate_ready: '🏆',
      payment_reminder: '💳',
      payment_completed: '✅',
      payment_failed: '❌'
    };
    return icons[type] || '📢';
  };

  if (!showNotifications) {
    return (
      <button
        onClick={onToggleNotifications}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={onToggleNotifications}
              className="text-white hover:text-gray-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {unreadCount > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm opacity-90">{unreadCount} unread</span>
              <button
                onClick={onMarkAllAsRead}
                className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full hover:bg-opacity-30 transition-colors"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>

        {/* Push Notification Settings */}
        {pushSupported && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                <p className="text-xs text-gray-500">
                  {subscribedToPush ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {pushPermission === 'granted' ? (
                <button
                  onClick={subscribedToPush ? unsubscribeFromPushNotifications : subscribeToPushNotifications}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    subscribedToPush 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {subscribedToPush ? 'Disable' : 'Enable'}
                </button>
              ) : (
                <button
                  onClick={requestNotificationPermission}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-center">No notifications yet</p>
              <p className="text-sm text-center opacity-70">You'll see updates here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getPriorityIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <button
                            onClick={() => onDeleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                        
                        {!notification.is_read && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNotifications;