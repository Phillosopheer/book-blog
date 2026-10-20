// ფორმატირებული ტექსტის დამხმარე: გაწმენდა (sanitize) და ძველი ტექსტის გადაყვანა.
// ეს ფაილი გამოიყენება როგორც admin.html-ში, ისე index.html-ში.
(() => {
  const MARK = "<!--html-->"; // ახალი (ფორმატირებული) პოსტების ნიშანი

  const ALLOW = { P:1, DIV:1, BR:1, B:1, STRONG:1, I:1, EM:1, U:1, S:1, STRIKE:1, SPAN:1,
                  H1:1, H2:1, H3:1, H4:1, UL:1, OL:1, LI:1, BLOCKQUOTE:1 };
  const DROP  = { SCRIPT:1, STYLE:1, IFRAME:1, OBJECT:1, EMBED:1, NOSCRIPT:1, TEMPLATE:1, SVG:1,
                  MATH:1, HEAD:1, TITLE:1, META:1, LINK:1, TEXTAREA:1, SELECT:1, BUTTON:1, INPUT:1, FORM:1 };

  const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%\/]+\)|[a-z]{3,20})$/i;
  const SIZE  = /^(\d+(?:\.\d+)?)(px|rem|em|%)$/;
  const LIMIT = { px: 200, rem: 20, em: 20, "%": 500 };

  // style ატრიბუტიდან მხოლოდ დაშვებული თვისებები რჩება
  function cleanStyle(str) {
    const out = [];
    String(str || "").split(";").forEach(decl => {
      const i = decl.indexOf(":"); if (i < 0) return;
      const p = decl.slice(0, i).trim().toLowerCase(), v = decl.slice(i + 1).trim();
      if (!v) return;
      if ((p === "color" || p === "background-color") && COLOR.test(v)) out.push(`${p}:${v}`);
      else if (p === "font-size") { const m = v.match(SIZE); if (m && +m[1] <= LIMIT[m[2]]) out.push(`font-size:${v}`); }
      else if (p === "font-weight" && /^(bold|normal|[1-9]00)$/i.test(v)) out.push(`font-weight:${v}`);
      else if (p === "font-style" && /^(italic|normal)$/i.test(v)) out.push(`font-style:${v}`);
      else if ((p === "text-decoration" || p === "text-decoration-line") && /^(underline|line-through|none)( (underline|line-through))*$/i.test(v)) out.push(`text-decoration:${v}`);
      else if (p === "text-align" && /^(left|right|center|justify)$/i.test(v)) out.push(`text-align:${v}`);
    });
    return out.join(";");
  }

  function walk(src, dst) {
    for (const n of Array.from(src.childNodes)) {
      if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.nodeValue)); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName.toUpperCase();
      if (DROP[t]) continue;
      let out, style = "";
      if (t === "FONT") {
        out = document.createElement("span");
        const c = (n.getAttribute("color") || "").trim();
        if (c && COLOR.test(c)) style = `color:${c}`;
      } else if (ALLOW[t]) {
        out = document.createElement(t.toLowerCase());
        style = cleanStyle(n.getAttribute("style"));
        const al = (n.getAttribute("align") || "").toLowerCase();
        if (/^(left|right|center|justify)$/.test(al) && !/text-align/.test(style)) style += (style ? ";" : "") + `text-align:${al}`;
      } else { walk(n, dst); continue; } // უცნობი ტეგი: ვშლით ტეგს, ტექსტი რჩება
      if (style) out.style.cssText = style; // CSSOM: მუშაობს CSP-ის (style-src) შეზღუდვის პირობებშიც
      walk(n, out);
      dst.appendChild(out);
    }
  }

  // აბრუნებს გასუფთავებულ DocumentFragment-ს
  function clean(html) {
    const body = new DOMParser().parseFromString(String(html || ""), "text/html").body;
    const frag = document.createDocumentFragment();
    walk(body, frag);
    return frag;
  }
  function sanitize(html) {
    const d = document.createElement("div"); d.appendChild(clean(html)); return d.innerHTML;
  }
  // ძველი (უბრალო ტექსტის) პოსტი -> HTML აბზაცები
  function fromPlain(text) {
    const d = document.createElement("div");
    String(text || "").split(/\n{2,}/).forEach(par => {
      if (!par.trim()) return;
      const p = document.createElement("p");
      par.trim().split("\n").forEach((line, i) => { if (i) p.appendChild(document.createElement("br")); p.appendChild(document.createTextNode(line)); });
      d.appendChild(p);
    });
    return d.innerHTML;
  }
  const isHtml = s => typeof s === "string" && s.startsWith(MARK);

  window.RT = { MARK, isHtml, clean, sanitize, fromPlain };
})();
