# წიგნების ბლოგი — პროექტის სტატუსი და გაშვების ინსტრუქცია

განახლებულია: 2026-10-16

## ამჟამინდელი მდგომარეობა

საიტი ონლაინ არის და მუშაობს **დემო რეჟიმში** (Firebase ჯერ დაკავშირებული არ არის).

- საიტი: https://book-blog-eta.vercel.app
- კოდი: https://github.com/Phillosopheer/book-blog (ფაილების შეცვლისას Vercel ავტომატურად განაახლებს საიტს)

## რა გავაკეთეთ

- [x] მომზადდა საიტის ფაილები: მთავარი გვერდი (ბარათები + „სრულად“ ფანჯარა), ადმინ პანელი, სტილები, JS
- [x] პალიტრა (`#F9F8F6`, `#F4F1EA`, `#2C2C2C`) და Noto Sans/Serif Georgian შრიფტები
- [x] ფაილები ავტვირთეთ GitHub-ზე (`css` და `js` საქაღალდეები სწორად არის)
- [x] საიტი გავუშვით Vercel-ზე და შევამოწმეთ: სტილები, შრიფტები და დემო პოსტი სწორად ჩანს

## რა დაგვრჩა

**1. Firebase პროექტი**
- [ ] console.firebase.google.com → Create project → სახელი `book-blog` (Analytics გამორთე)
- [ ] პროექტში დაამატე ვებ-აპი (`</>`), დააკოპირე `firebaseConfig`

**2. სერვისების ჩართვა**
- [ ] Build → **Firestore Database** → Create database (Production mode)
- [ ] Build → **Storage** → Get started
      (შენიშვნა: Firebase-მა შეიძლება Storage-ისთვის Blaze (pay-as-you-go) გეგმა მოითხოვოს. თუ მოითხოვა, ბარათის მიბმა დაგჭირდება; მცირე გამოყენება ჩვეულებრივ უფასო ლიმიტში ჯდება.)
- [ ] Build → **Authentication** → Sign-in method → ჩართე **Email/Password**

**3. ადმინის მომხმარებელი**
- [ ] Authentication → Users → Add user (შენი ელფოსტა და პაროლი)
- [ ] დააკოპირე მომხმარებლის **UID**

**4. წესები**
- [ ] Firestore → Rules → ჩასვი `firestore.rules`-ის შიგთავსი, `ADMIN_UID`-ის ნაცვლად შენი UID → Publish
- [ ] Storage → Rules → ჩასვი `storage.rules`-ის შიგთავსი, იგივე UID → Publish

**5. კონფიგურაცია საიტში**
- [ ] GitHub-ზე გახსენი `js/firebase-config.js` → ფანქრის ხატულა → ჩასვი შენი `firebaseConfig` მონაცემები → Commit changes
- [ ] დაელოდე ~30 წამს, Vercel თავად განაახლებს საიტს

**6. ადმინ პანელისთვის დომენი**
- [ ] Firebase → Authentication → Settings → **Authorized domains** → Add domain → `book-blog-eta.vercel.app`

**7. შემოწმება**
- [ ] გახსენი `/admin.html`, შედი ელფოსტით და პაროლით
- [ ] დაამატე სატესტო პოსტი (გარეკანით) და შეამოწმე, გამოჩნდა თუ არა მთავარ გვერდზე
- [ ] დემო შეტყობინება უნდა გაქრეს

## სასარგებლო

- ფაილის შეცვლა: GitHub → ფაილი → ფანქრის ხატულა → Commit changes. Vercel თავად გამოაქვეყნებს.
- ადმინ პანელი ფაილზე ორჯერ დაჭერით (`file://`) არ მუშაობს, მხოლოდ ონლაინ საიტზე.
- Firebase-ის `apiKey` საჯარო მონაცემია. ბაზას წესები იცავს, ამიტომ `ADMIN_UID` აუცილებლად ჩასვი.

## ფაილების სტრუქტურა

```
index.html          მთავარი გვერდი
admin.html          ადმინ პანელი
css/style.css       დიზაინი
js/app.js           პოსტების ჩატვირთვა
js/admin.js         შესვლა და პოსტის დამატება
js/firebase-config.js   Firebase-ის მონაცემები
firestore.rules     ბაზის წესები (Firebase-ში ჩასასმელი)
storage.rules       ფოტოების წესები (Firebase-ში ჩასასმელი)
```
