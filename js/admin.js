(() => {
  const $ = id => document.getElementById(id);
  const login = $("login"), form = $("post-form");
  const say = (id, text, cls) => { const m = $(id); m.textContent = text; m.className = "msg " + (cls || ""); };

  if (!configured) { $("notice").hidden = false; return; }
  if (location.protocol === "file:") {
    $("notice").textContent = "ადმინ პანელი მუშაობს მხოლოდ საიტზე განთავსების შემდეგ (Vercel/Netlify), ფაილზე ორჯერ დაჭერით არა.";
    $("notice").hidden = false; return;
  }

  // ფოტოს შეკუმშვა: მაქს. 1000px სიგანე, JPEG. ინახება პირდაპირ ბაზაში, Storage არ სჭირდება.
  function compress(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = Math.min(1000, img.width), h = Math.round(img.height * w / img.width);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        let q = 0.88, data = c.toDataURL("image/jpeg", q);
        while (data.length > 720000 && q > 0.3) { q -= 0.1; data = c.toDataURL("image/jpeg", q); }
        resolve(data);
      };
      img.onerror = () => reject(new Error("ფოტოს წაკითხვა ვერ მოხერხდა"));
      img.src = url;
    });
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
      const imageUrl = await compress($("cover").files[0]);
      await db.collection("posts").add({
        title: $("title").value.trim(),
        bookAuthor: $("bookAuthor").value.trim(),
        reviewAuthor: $("reviewAuthor").value.trim(),
        content: $("content").value.trim(),
        imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      form.reset(); say("post-msg", "გამოქვეყნდა.", "ok");
    } catch (err) {
      console.error(err); say("post-msg", "გამოქვეყნება ვერ მოხერხდა. შეამოწმე Firebase-ის წესები.", "err");
    } finally { btn.disabled = false; }
  });
})();
