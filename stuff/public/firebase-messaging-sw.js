/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/7.15.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.15.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    "apiKey": "AIzaSyC_dyv_fMIivqxEneXzs6lYUXkiZoTUkD8",
    "authDomain": "bridge-monitoring-app.firebaseapp.com",
    "databaseURL": "https://bridge-monitoring-app.firebaseio.com",
    "projectId": "bridge-monitoring-app",
    "storageBucket": "bridge-monitoring-app.appspot.com",
    "messagingSenderId": "59579178044",
    "appId": "1:59579178044:web:6ccb8d02862e1494e77739",
    "measurementId": "G-FZDKS27RH4"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload)
    const notificationTitle = payload.data['"title"'].replace(/"/g, '')
    const notificationOptions = {
        body: payload.data['"message"'].replace(/"/g, ''),
        icon: '/logo192.png',
    };
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = new URL('', self.location.origin).href;
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;

        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
            }
        }

        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });
    event.waitUntil(promiseChain);
});