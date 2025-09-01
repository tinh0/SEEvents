importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js");

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
});

// Get a reference to the messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    data: payload.data,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click in background
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event);

  event.notification.close();
  
  // This will post a message to the client
  const clickedNotificationData = {
    firebaseMessaging: {
      type: 'notification-clicked',
      payload: {
        notification: {
          title: event.notification.title,
          body: event.notification.body,
        },
        data: event.notification.data
      }
    }
  };
  
  // Attempt to send click data to all clients
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        clientList[i].postMessage(clickedNotificationData);
      }
      
      // If there is a client, focus it
      if (clientList.length > 0) {
        clientList[0].focus();
        return;
      }
      
      // If no client is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});