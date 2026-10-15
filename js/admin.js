(() => {
  const $ = id => document.getElementById(id);
  const login = $("login"), form = $("post-form"), manage = $("manage"), listEl = $("manage-list");
  const say = (id, text, cls) => { const m = $(id); m.textContent = text; m.className = "msg " + (cls || ""); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const months = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
  const fmt = d => d ? `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}` : "";

  if (!configured) { $("notice").hidden = false; return; }
  if (location.protocol === "file:") {
    $("notice").textContent = "ადმინ პანელი მუშაობს მხოლოდ საიტზე განთავსების შემდეგ (Vercel/Netlify), ფაილზე ორჯერ დაჭერით არა.";
    $("notice").hidden = false; return;
  }

  // ფოტოს შეკუმშვა ბრაუზერში: JPEG, მაქს. სიგანე maxW, ზომა cap სიმბოლომდე
  function compress(file, maxW, q, cap) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = Math.min(maxW, img.width), h = Math.round(img.height * w / img.width);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        let data = c.toDataURL("image/jpeg", q);
        while (data.length > cap && q > 0.3) { q -= 0.1; data = c.toDataURL("image/jpeg", q); }
        resolve(data);
      };
      img.onerror = () => reject(new Error("ფოტოს წაკითხვა ვერ მოხერხდა"));
      img.src = url;
    });
  }

  // ---------- რედაქტირების რეჟიმი ----------
  let editing = null; // {id, createdAt, thumb, imageUrl}

  function setMode(isEdit) {
    $("form-title").textContent = isEdit ? "პოსტის რედაქტირება" : "ახალი პოსტი";
    $("publish").textContent = isEdit ? "ცვლილებების შენახვა" : "გამოქვეყნება";
    $("cancel-edit").hidden = !isEdit;
    $("cover").required = !isEdit;
    $("cover-label").textContent = isEdit ? "ახალი გარეკანი (თუ არ ცვლი, დატოვე ცარიელი)" : "წიგნის გარეკანი";
  }

  function exitEdit() { editing = null; form.reset(); setMode(false); say("post-msg", ""); }

  async function startEdit(id) {
    say("post-msg", "იტვირთება…");
    try {
      const pd = await db.collection("posts").doc(id).get();
      const x = pd.data();
      const bd = await db.collection("postBodies").doc(id).get();
      const b = bd.exists ? bd.data() : { content: x.content || "", imageUrl: x.imageUrl || "" };
      editing = { id, createdAt: x.createdAt, thumb: x.thumb ?? x.imageUrl ?? "", imageUrl: b.imageUrl || x.thumb || "" };
      $("title").value = x.title; $("bookAuthor").value = x.bookAuthor;
      $("reviewAuthor").value = x.reviewAuthor; $("content").value = b.content;
      $("cover").value = "";
      setMode(true); say("post-msg", "");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) { console.error(err); say("post-msg", "პოსტის ჩატვირთვა ვერ მოხერხდა.", "err"); }
  }

  async function remove(id, title) {
    if (!confirm(`წაიშალოს „${title}“?\nამის გაუქმება შეუძლებელია.`)) return;
    try {
      const batch = db.batch();
      batch.delete(db.collection("posts").doc(id));
      batch.delete(db.collection("postBodies").doc(id));
      await batch.commit();
      if (editing && editing.id === id) exitEdit();
      loadList();
    } catch (err) { console.error(err); alert("წაშლა ვერ მოხერხდა. შეამოწმე Firebase-ის წესები."); }
  }

  // ---------- პოსტების სია ----------
  async function loadList() {
    listEl.replaceChildren(el("p", "empty", "იტვირთება…"));
    try {
      const snap = await db.collection("posts").orderBy("createdAt", "desc").get();
      if (snap.empty) { listEl.replaceChildren(el("p", "empty", "პოსტები ჯერ არ არის.")); return; }
      listEl.replaceChildren(...snap.docs.map(d => {
        const x = d.data();
        const row = el("div", "item");
        const info = el("div", "item-info");
        info.append(el("strong", "", x.title), el("span", "", `${x.bookAuthor} • ${fmt(x.createdAt?.toDate?.())}`));
        const acts = el("div", "item-actions");
        const e = el("button", "ghost", "შეცვლა"); e.type = "button"; e.onclick = () => startEdit(d.id);
        const r = el("button", "danger", "წაშლა"); r.type = "button"; r.onclick = () => remove(d.id, x.title);
        acts.append(e, r); row.append(info, acts);
        return row;
      }));
    } catch (err) { console.error(err); listEl.replaceChildren(el("p", "empty", "სიის ჩატვირთვა ვერ მოხერხდა.")); }
  }

  // ---------- შესვლა ----------
  auth.onAuthStateChanged(user => {
    login.hidden = !!user; form.hidden = !user; manage.hidden = !user;
    if (user) loadList();
  });

  login.addEventListener("submit", async e => {
    e.preventDefault();
    try { await auth.signInWithEmailAndPassword($("email").value, $("password").value); say("login-msg", ""); }
    catch { say("login-msg", "ელფოსტა ან პაროლი არასწორია.", "err"); }
  });

  $("logout").onclick = () => auth.signOut();
  $("cancel-edit").onclick = exitEdit;

  // ---------- გამოქვეყნება / შენახვა ----------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("publish"); btn.disabled = true; say("post-msg", "იტვირთება…");
    try {
      const file = $("cover").files[0];
      let thumb = editing?.thumb, imageUrl = editing?.imageUrl;
      if (file) {
        [imageUrl, thumb] = await Promise.all([
          compress(file, 1000, 0.88, 720000),
          compress(file, 520, 0.8, 90000)
        ]);
      }
      const content = $("content").value.trim();
      const ref = db.collection("posts").doc(editing ? editing.id : undefined);
      const batch = db.batch();
      batch.set(ref, {
        title: $("title").value.trim(),
        bookAuthor: $("bookAuthor").value.trim(),
        reviewAuthor: $("reviewAuthor").value.trim(),
        preview: content.replace(/\s+/g, " ").slice(0, 220),
        thumb,
        createdAt: editing ? editing.createdAt : firebase.firestore.FieldValue.serverTimestamp()
      });
      batch.set(db.collection("postBodies").doc(ref.id), { content, imageUrl });
      await batch.commit();
      const wasEdit = !!editing;
      exitEdit(); say("post-msg", wasEdit ? "შენახულია." : "გამოქვეყნდა.", "ok");
      loadList();
    } catch (err) {
      console.error(err); say("post-msg", "შენახვა ვერ მოხერხდა. შეამოწმე Firebase-ის წესები.", "err");
    } finally { btn.disabled = false; }
  });
})();
