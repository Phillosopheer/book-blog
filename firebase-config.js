// აქ ჩასვი შენი Firebase კონფიგურაცია
// (Firebase Console → Project settings → Your apps → Web app)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
let db = null, storage = null, auth = null;
if (configured) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  auth = firebase.auth();
}
