// Firebase-ის კონფიგურაცია (პროექტი: book-blog)
const firebaseConfig = {
  apiKey: "AIzaSyBG7sUkoIrceV_c030berUi5RH0SAQ-QDo",
  authDomain: "filmebis-ganxilva.firebaseapp.com",
  projectId: "filmebis-ganxilva",
  storageBucket: "filmebis-ganxilva.firebasestorage.app",
  messagingSenderId: "1031829944576",
  appId: "1:1031829944576:web:cab91fdd0290690f381be5"
};

const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
let db = null, storage = null, auth = null;
if (configured) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  auth = firebase.auth();
}
