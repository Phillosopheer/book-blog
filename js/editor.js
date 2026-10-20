// ტექსტის რედაქტორი ფორმატირების პანელით (admin.html-ისთვის)
(() => {
  const ed = document.getElementById("content");
  const bar = document.getElementById("rt-toolbar");
  if (!ed || !bar) return;
  const EMPTY = "<p><br></p>";
  const exec = (c, v) => document.execCommand(c, false, v);

  try { exec("defaultParagraphSeparator", "p"); } catch {}
  if (!ed.innerHTML.trim()) ed.innerHTML = EMPTY;

  // ბოლო მონიშვნა რედაქტორში (რომ select/ფერის არჩევისას არ დაიკარგოს)
  let saved = null;
  const STATES = ["bold", "italic", "underline", "strikeThrough", "justifyLeft", "justifyCenter",
                  "justifyRight", "justifyFull", "insertUnorderedList", "insertOrderedList"];
  function refresh() {
    STATES.forEach(c => {
      const b = bar.querySelector(`[data-cmd="${c}"]`); if (!b) return;
      let on = false; try { on = document.queryCommandState(c); } catch {}
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
    });
  }
  document.addEventListener("selectionchange", () => {
    const s = getSelection();
    if (s.rangeCount && ed.contains(s.anchorNode)) { saved = s.getRangeAt(0).cloneRange(); refresh(); }
  });
  function restore() {
    ed.focus();
    if (saved) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); }
  }
  function run(fn) { restore(); fn(); ed.focus(); refresh(); }

  // ღილაკებზე დაჭერა მონიშვნას არ აფუჭებს
  bar.addEventListener("mousedown", e => { if (e.target.closest("button")) e.preventDefault(); });
  bar.addEventListener("click", e => {
    const b = e.target.closest("button[data-cmd]"); if (!b) return;
    const cmd = b.dataset.cmd;
    run(() => {
      exec("styleWithCSS", /^justify/.test(cmd));
      if (cmd === "quote") {
        const cur = (document.queryCommandValue("formatBlock") || "").toLowerCase();
        exec("formatBlock", cur === "blockquote" ? "p" : "blockquote");
      } else if (cmd === "clear") exec("removeFormat");
      else exec(cmd);
    });
  });

  // ზომა
  const size = document.getElementById("rt-size");
  size.addEventListener("change", () => {
    const val = size.value; size.value = ""; if (!val) return;
    run(() => {
      exec("styleWithCSS", false);
      exec("fontSize", "7"); // დროებითი ნიშანი, მერე ჩვენს ზომაზე ვცვლით
      ed.querySelectorAll('font[size="7"]').forEach(f => {
        const s = document.createElement("span");
        s.style.fontSize = val;
        while (f.firstChild) s.appendChild(f.firstChild);
        s.querySelectorAll("[style]").forEach(x => { x.style.fontSize = ""; });
        f.replaceWith(s);
      });
    });
  });

  // ფერები: ტექსტის და მონიშვნის (ფონის)
  function colorTool(id, cmd) {
    const inp = document.getElementById(id);
    inp.addEventListener("input", () => bar.style.setProperty("--" + id, inp.value));
    inp.addEventListener("change", () => run(() => {
      exec("styleWithCSS", true);
      if (cmd === "hiliteColor" && !exec(cmd, inp.value)) exec("backColor", inp.value);
      else if (cmd !== "hiliteColor") exec(cmd, inp.value);
    }));
  }
  colorTool("rt-fore", "foreColor");
  colorTool("rt-back", "hiliteColor");

  // ჩასმისას მხოლოდ ტექსტი (Word-ის/საიტების ზედმეტი ფორმატირების გარეშე)
  ed.addEventListener("paste", e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    const html = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      .map(l => "<p>" + l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>").join("");
    if (html) exec("insertHTML", html);
  });

  // ყველაფრის წაშლისას სტრუქტურა არ დაიკარგოს
  ed.addEventListener("input", () => {
    if (ed.innerHTML === "" || ed.innerHTML === "<br>") {
      ed.innerHTML = EMPTY;
      const r = document.createRange(); r.setStart(ed.firstChild, 0); r.collapse(true);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  });

  window.RTEditor = {
    getHTML: () => RT.MARK + RT.sanitize(ed.innerHTML),
    getText: () => ed.innerText.replace(/\s+/g, " ").trim(),
    isEmpty: () => !ed.innerText.trim(),
    setContent(content) {
      // innerHTML-ის ნაცვლად DOM-ით ვავსებთ, რომ style ატრიბუტები CSP-ის გამო არ დაიბლოკოს
      ed.replaceChildren(RT.clean(RT.isHtml(content) ? content : RT.fromPlain(content)));
      if (!ed.innerHTML.trim()) ed.innerHTML = EMPTY;
      saved = null;
    },
    clear() { ed.innerHTML = EMPTY; saved = null; }
  };
})();
