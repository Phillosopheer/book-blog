# როგორ გავუშვა

1. გახსენი zip და ორჯერ დააჭირე `index.html`-ს. საიტი ბრაუზერში გაიხსნება დემო პოსტით.
2. ონლაინ გასაშვებად (და ადმინ პანელისთვის):
   - https://app.netlify.com/drop → გადმოათრიე მთელი `book-blog` საქაღალდე. მიიღებ ბმულს.
   - ან Vercel (როგორც გეგმაშია): ატვირთე GitHub-ზე და დააიმპორტე.
3. Firebase: შექმენი პროექტი → ჩართე Firestore, Storage, Authentication (Email/Password).
4. Authentication → Users → დაამატე შენი ელფოსტა და პაროლი, დააკოპირე UID.
5. `js/firebase-config.js`-ში ჩასვი კონფიგურაცია; `firestore.rules` და `storage.rules`-ის შიგთავსი ჩასვი Firebase-ში (`ADMIN_UID`-ის ნაცვლად შენი UID).
6. Firebase → Authentication → Settings → Authorized domains: დაამატე შენი Netlify/Vercel დომენი.
