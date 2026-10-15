(async () => {
const list = document.getElementById("posts");
const modal = document.getElementById("modal");
const body = document.getElementById("modal-body");

const demo = [
  { title: "სანიმუშო წიგნი", bookAuthor: "წიგნის ავტორი", reviewAuthor: "შენი სახელი",
    createdAt: new Date(), imageUrl: "",
    content: "ეს არის სანიმუშო ანალიზი.\n\nმეორე აბზაცი აჩვენებს, როგორ გამოჩნდება სრული ტექსტი ფანჯარაში. რეალური პოსტები გამოჩნდება Firebase-ის დაკავშირების შემდეგ." }
];

const months = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
const fmt = d => `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function cover(p) {
  if (p.imageUrl) { const i = el("img", "cover"); i.src = p.imageUrl; i.alt = `${p.title} — გარეკანი`; i.decoding = "async"; return i; }
  return el("div", "cover ph", p.title.charAt(0));
}

function meta(p, tag) {
  const d = el("div");
  d.append(el(tag, "", p.title), el("p", "by", p.bookAuthor),
    el("p", "reviewer", `ანალიზის ავტორი: ${p.reviewAuthor}`), el("p", "date", fmt(p.createdAt)));
  return d;
}

function card(p) {
  const a = el("article", "card");
  const t = meta(p, "h2");
  const text = p.content.replace(/\s+/g, " ");
  t.append(el("p", "preview", text.length > 220 ? text.slice(0, 220).trimEnd() + "…" : text));
  const b = el("button", "", "სრულად"); b.type = "button"; b.onclick = () => open(p);
  t.append(b);
  a.append(cover(p), t);
  return a;
}

function open(p) {
  body.replaceChildren();
  const head = el("div", "mhead");
  head.append(cover(p), meta(p, "h2"));
  const full = el("div", "full");
  p.content.split(/\n{2,}/).forEach(par => full.append(el("p", "", par.trim())));
  body.append(head, full);
  modal.showModal();
  modal.scrollTop = 0;
}

document.getElementById("close").onclick = () => modal.close();
modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

async function load() {
  if (!configured) { document.getElementById("notice").hidden = false; return demo; }
  const snap = await db.collection("posts").orderBy("createdAt", "desc").get();
  return snap.docs.map(d => { const x = d.data(); return { ...x, createdAt: x.createdAt?.toDate?.() ?? new Date(x.createdAt ?? Date.now()) }; });
}

try {
  const posts = await load();
  list.replaceChildren(...(posts.length ? posts.map(card) : [el("p", "empty", "პოსტები ჯერ არ არის დამატებული.")]));
} catch (e) {
  console.error(e);
  list.replaceChildren(el("p", "empty", "პოსტების ჩატვირთვა ვერ მოხერხდა. შეამოწმე კავშირი და Firestore-ის წესები."));
}
})();
