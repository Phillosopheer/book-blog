(() => {
  const $ = id => document.getElementById(id);
  const login = $("login"), form = $("post-form");
  const say = (id, text, cls) => { const m = $(id); m.textContent = text; m.className = "msg " + (cls || ""); };

  if (!configured) { $("notice").hidden = false; return; }
  if (location.protocol === "file:") {
    $("notice").textContent = "ადმინ პანელი მუშაობს მხოლოდ საიტზე განთავსების შემდეგ (Vercel/Netlify), ფაილზე ორჯერ დაჭერით არა.";
    $("notice").hidden = false; return;
  }

  auth.onAuthStateChanged(user => { login.hidden = !!user; form.hidden = !user; });

  login.addEventListener("submit", async e => {
    e.preventDefault();
    try { await auth.signInWithEmailAndPassword($("email").value, $("password").value); say("login-msg", ""); }
    catch { say("login-msg", "ელფოსტა ან პაროლი არასწორია.", "err"); }
  });

  $("logout").onclick = () => auth.signOut();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("publish"); btn.disabled = true; say("post-msg", "იტვირთება…");
    try {
      const file = $("cover").files[0];
      const r = storage.ref(`covers/${Date.now()}-${file.name}`);
      await r.put(file);
      await db.collection("posts").add({
        title: $("title").value.trim(),
        bookAuthor: $("bookAuthor").value.trim(),
        reviewAuthor: $("reviewAuthor").value.trim(),
        content: $("content").value.trim(),
        imageUrl: await r.getDownloadURL(),
        createdAt: firebase.firestore.Timestamp.fromDate(new Date($("date").value))
      });
      form.reset(); say("post-msg", "გამოქვეყნდა.", "ok");
    } catch (err) {
      console.error(err); say("post-msg", "გამოქვეყნება ვერ მოხერხდა. შეამოწმე Firebase-ის წესები.", "err");
    } finally { btn.disabled = false; }
  });
})();
