(async () => {
const list = document.getElementById("posts");
const modal = document.getElementById("modal");
const body = document.getElementById("modal-body");
const search = document.getElementById("search");
const sug = document.getElementById("suggest");

const months = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
const fmt = d => `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const short = t => t.replace(/\s+/g, " ").slice(0, 220);

const demoText = "ეს არის სანიმუშო ანალიზი.\n\nმეორე აბზაცი აჩვენებს, როგორ გამოჩნდება სრული ტექსტი ფანჯარაში. რეალური პოსტები გამოჩნდება Firebase-ის დაკავშირების შემდეგ.";
const demo = [{ id: "demo", title: "სანიმუშო წიგნი", bookAuthor: "წიგნის ავტორი", reviewAuthor: "შენი სახელი",
  createdAt: new Date(), thumb: "", preview: short(demoText), content: demoText, imageUrl: "" }];

// ბარათის მონაცემები (მსუბუქი). ძველი ფორმატის პოსტებსაც ეგუება.
const norm = (id, x) => ({
  id, title: x.title, bookAuthor: x.bookAuthor, reviewAuthor: x.reviewAuthor,
  preview: x.preview ?? short(x.content || ""), thumb: x.thumb ?? x.imageUrl ?? "",
  createdAt: x.createdAt?.toDate?.() ?? new Date(x.createdAt ?? Date.now())
});

// ქეში ბრაუზერში: შემდეგ ვიზიტზე პოსტები მყისიერად ჩანს
const KEY = "posts-cache-v2";
function readCache() {
  try { return JSON.parse(localStorage.getItem(KEY)).map(p => ({ ...p, createdAt: new Date(p.createdAt) })); }
  catch { return null; }
}
function writeCache(ps) {
  try { localStorage.setItem(KEY, JSON.stringify(ps.map(p => ({ ...p, thumb: p.thumb.length > 150000 ? "" : p.thumb })))); } catch {}
}

function cover(p, src) {
  if (src) { const i = el("img", "cover"); i.src = src; i.alt = `${p.title} — გარეკანი`; i.decoding = "async"; return i; }
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
  t.append(el("p", "preview", p.preview + (p.preview.length >= 220 ? "…" : "")));
  const b = el("button", "", "სრულად"); b.type = "button"; b.onclick = () => open(p);
  t.append(b);
  a.append(cover(p, p.thumb), t);
  return a;
}

// სრული ტექსტი და დიდი გარეკანი იტვირთება მხოლოდ „სრულად“-ზე დაჭერისას
const fullCache = {};
async function getFull(p) {
  if (p.content != null) return p;
  if (fullCache[p.id]) return fullCache[p.id];
  let d = await db.collection("postBodies").doc(p.id).get();
  if (!d.exists) d = await db.collection("posts").doc(p.id).get(); // ძველი ფორმატი
  const x = d.data() || {};
  return (fullCache[p.id] = { content: x.content || "", imageUrl: x.imageUrl || p.thumb });
}

async function open(p) {
  body.replaceChildren(el("p", "empty", "იტვირთება…"));
  modal.showModal();
  let f;
  try { f = await getFull(p); } catch { body.replaceChildren(el("p", "empty", "ტექსტის ჩატვირთვა ვერ მოხერხდა.")); return; }
  const head = el("div", "mhead");
  head.append(cover(p, f.imageUrl || p.thumb), meta(p, "h2"));
  const full = el("div", "full");
  f.content.split(/\n{2,}/).forEach(par => full.append(el("p", "", par.trim())));
  body.replaceChildren(head, full);
  modal.scrollTop = 0;
}

document.getElementById("close").onclick = () => modal.close();
modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

let all = [];
const match = q => p => `${p.title} ${p.bookAuthor} ${p.reviewAuthor}`.toLowerCase().includes(q);
function render() {
  const q = search.value.trim().toLowerCase();
  const f = q ? all.filter(match(q)) : all;
  list.replaceChildren(...(f.length ? f.map(card)
    : [el("p", "empty", all.length ? "ვერაფერი მოიძებნა." : "პოსტები ჯერ არ არის დამატებული.")]));
}

// ჩამოშლადი შედეგები ძიების ველის ქვეშ
let shown = [], active = -1;
function closeSug() { sug.hidden = true; search.setAttribute("aria-expanded", "false"); active = -1; }
function mark() {
  sug.querySelectorAll(".sg").forEach((b, i) => {
    b.setAttribute("aria-selected", String(i === active));
    if (i === active) b.scrollIntoView({ block: "nearest" });
  });
}
function suggest() {
  const q = search.value.trim().toLowerCase();
  active = -1;
  if (!q) { sug.replaceChildren(); closeSug(); return; }
  shown = all.filter(match(q)).slice(0, 6);
  if (!shown.length) { sug.replaceChildren(el("li", "sg-empty", "ვერაფერი მოიძებნა.")); }
  else sug.replaceChildren(...shown.map(p => {
    const li = el("li"); li.setAttribute("role", "option");
    const b = el("button", "sg"); b.type = "button"; b.tabIndex = -1;
    let th;
    if (p.thumb) { th = el("img"); th.src = p.thumb; th.alt = ""; } else th = el("span", "sgph", p.title.charAt(0));
    const t = el("span", "sgt"); t.append(el("strong", "", p.title), el("small", "", p.bookAuthor));
    b.append(th, t);
    b.onclick = () => { closeSug(); open(p); };
    li.append(b); return li;
  }));
  sug.hidden = false; search.setAttribute("aria-expanded", "true");
}
search.addEventListener("input", () => { render(); suggest(); });
search.addEventListener("focus", suggest);
search.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSug();
  else if (e.key === "ArrowDown" && shown.length) { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); mark(); }
  else if (e.key === "ArrowUp" && shown.length) { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
  else if (e.key === "Enter") { if (active >= 0) { e.preventDefault(); const p = shown[active]; closeSug(); open(p); } else closeSug(); }
});
document.addEventListener("click", e => { if (!e.target.closest(".searchbox")) closeSug(); });

if (!configured) {
  document.getElementById("notice").hidden = false;
  all = demo; render();
} else {
  const cached = readCache();
  if (cached) { all = cached; render(); }
  try {
    const snap = await db.collection("posts").orderBy("createdAt", "desc").get();
    all = snap.docs.map(d => norm(d.id, d.data()));
    writeCache(all); render();
  } catch (e) {
    console.error(e);
    if (!cached) list.replaceChildren(el("p", "empty", "პოსტების ჩატვირთვა ვერ მოხერხდა. შეამოწმე კავშირი და Firestore-ის წესები."));
  }
}
})();
