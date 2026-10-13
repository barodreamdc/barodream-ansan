#!/usr/bin/env node
/**
 * 치과 백과사전 정적 페이지 생성 → /dictionary/
 * 데이터: scripts/dictionary/terms.json (용어 추가·수정은 이 파일에서)
 * 실행: node scripts/gen-dictionary.mjs  (sitemap.xml의 dictionary 항목도 갱신)
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "dictionary";
// 본사이트 전체 헤더/모바일메뉴/푸터/JS를 실제 페이지에서 추출 → /dictionary/ 기준으로 경로 보정
const REF = fs.readFileSync("caries.html", "utf-8").replace(/\r\n/g, "\n");
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return s.slice(i, j + b.length); };
// Preserve the current site's tracking when regenerating dictionary pages.
const GA = cut(REF, "<!-- Google Tag Manager -->", "<!-- End Google Tag Manager -->") + "\n";
const NOSCRIPT = cut(REF, "<!-- Google Tag Manager (noscript) -->", "<!-- End Google Tag Manager (noscript) -->");
function fixPaths(s) {
  // Shared navigation is copied from root-level pages; resolve its dictionary
  // link locally before prefixing root-level HTML links with ../.
  s = s.replace(/href="dictionary\/index\.html"/g, 'href="/dictionary/index.html"');
  s = s.replace(/href="([a-zA-Z][a-zA-Z0-9_\-]*\.html)/g, 'href="../$1');
  s = s.replace(/href="\.\.\/dictionary\/index\.html"/g, 'href="index.html"');
  return s;
}
const HEADER = fixPaths(cut(REF, "<!-- HEADER -->", "</header>"));
const MMENU = fixPaths(REF.slice(REF.indexOf("<!-- bd-mobile-menu -->"), REF.indexOf('<div id="bd-notice-bar"')));
const GNBCSS = cut(REF, "/* ── GNB 드롭다운", "</style>").replace(/<\/style>\s*$/, "") + "\n  #bd-float-cta a{ pointer-events:auto; }";
const MMCSS = cut(REF, '<style id="bd-mm-style">', "</style>");
const FOOTER_FULL = fixPaths(cut(REF, "<footer", "</footer>"));
const FLOAT = fixPaths(cut(REF, '<div id="bd-float-cta"', "</div>"));
const mmI = REF.lastIndexOf("<script>", REF.indexOf("var mm=document.getElementById('bd-mobile-menu')"));
const MMJS = REF.slice(mmI, REF.indexOf("</script>", mmI) + 9);

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const DISCLAIMER = "이 내용은 일반적인 정보 제공 목적이며, 개인의 상태에 따라 다를 수 있습니다. 정확한 진단은 진료 후 의료진과 상담하세요.";

function head(title, desc, canonical) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
${GA}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="https://barodreamdental.kr/images/og-image.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
  :root{ --accent:#6B4423; --ink:#1A1A1A; --ink2:#4A4A4A; --ink3:#8A8A8A; --line:rgba(26,26,26,.12); --bg2:#F5F5F5; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:#fff; color:#1A1A1A; font-family:'Pretendard',sans-serif; word-break:keep-all; -webkit-font-smoothing:antialiased; }
  a{ color:inherit; }
  .wrap{ max-width:760px; margin:0 auto; padding:0 24px; }
  header.dh{ position:sticky; top:0; z-index:50; height:64px; display:flex; align-items:center; justify-content:space-between; padding:0 24px; background:rgba(255,255,255,.92); backdrop-filter:blur(12px); border-bottom:1px solid var(--line); }
  header.dh .logo{ font-family:'Noto Serif KR',serif; font-weight:600; font-size:19px; text-decoration:none; color:#1A1A1A; }
  header.dh nav a{ font-size:14px; color:#4A4A4A; text-decoration:none; margin-left:18px; }
  header.dh nav a:hover{ color:var(--accent); }
  .crumb{ font-size:13px; color:#8A8A8A; margin:36px 0 0; }
  .crumb a{ color:#8A8A8A; text-decoration:none; }
  .crumb a:hover{ color:var(--accent); }
  h1.term{ font-family:'Noto Serif KR',serif; font-weight:600; font-size:clamp(28px,5vw,40px); letter-spacing:-0.02em; margin:14px 0 0; }
  .lead{ font-size:18px; line-height:1.85; color:#1A1A1A; margin:26px 0 0; }
  h2.dh{ font-family:'Noto Serif KR',serif; font-weight:600; font-size:20px; letter-spacing:-0.02em; margin:44px 0 12px; }
  .body p{ font-size:16px; line-height:1.85; color:#333; margin:0 0 14px; }
  .rel{ list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px; }
  .rel a{ display:inline-block; padding:9px 16px; background:var(--bg2); border:1px solid var(--line); border-radius:100px; font-size:14px; text-decoration:none; color:#1A1A1A; }
  .rel a:hover{ border-color:var(--accent); color:var(--accent); }
  .cta-link{ display:inline-block; padding:14px 26px; background:#1A1A1A; color:#fff; border-radius:6px; text-decoration:none; font-size:15px; }
  .disc{ font-size:13px; line-height:1.7; color:#8A8A8A; border-top:1px solid var(--line); margin:56px 0 0; padding:20px 0 0; }
  footer.dh{ background:#141210; color:rgba(255,255,255,.6); padding:40px 24px; margin-top:60px; font-size:12.5px; line-height:1.8; text-align:center; }
  footer.dh a{ color:rgba(255,255,255,.8); text-decoration:none; }
  .cat-tab{ display:inline-block; padding:8px 16px; border-radius:100px; font-size:14px; text-decoration:none; color:#4A4A4A; background:var(--bg2); margin:0 8px 8px 0; }
  .idx-term{ display:block; padding:18px 0; border-bottom:1px solid var(--line); text-decoration:none; }
  .idx-term h3{ font-family:'Noto Serif KR',serif; font-weight:500; font-size:17px; margin:0 0 4px; color:#1A1A1A; }
  .idx-term p{ font-size:14px; color:#8A8A8A; margin:0; line-height:1.5; }
  ${GNBCSS}
</style>
${MMCSS}
</head>
<body>
${NOSCRIPT}
<div style="max-width:100vw;">
${HEADER}
${MMENU}`;
}
const footer = `${FOOTER_FULL}
${FLOAT}
</div>
${MMJS}
</body>
</html>`;


const T = JSON.parse(fs.readFileSync("scripts/dictionary/terms.json", "utf-8"));
const CATS = ["임플란트","전체 임플란트·올온엑스","의식하진정·마취","충치·보존치료","신경치료·자연치아보존","잇몸·치주","보철·틀니","치아교정","사랑니·구강외과","심미치료","예방·검진·건강보험","증상·자가진단","턱관절·구강습관"];
const PAGE_LABEL = {
  "implant-senior.html":"임플란트 진료 안내","implant-all-on-x.html":"풀아치 임플란트(올온엑스)","implant-immediate.html":"즉시 임플란트",
  "implant-navigation.html":"네비게이션 임플란트","implant-sedation.html":"진정 임플란트","sedation.html":"의식하진정법",
  "caries.html":"충치 치료","general-cavity.html":"충치 치료","general-resin.html":"레진 치료","general-inlay.html":"인레이",
  "general-crown.html":"크라운","general-rootcanal.html":"신경치료","endo.html":"신경치료·자연치아 보존","general-wisdom.html":"사랑니 발치",
  "general-gum.html":"잇몸치료","perio.html":"치주치료","scaling.html":"스케일링","prosthesis.html":"보철치료","denture.html":"틀니",
  "ortho.html":"치아교정","ortho-adult.html":"성인교정","ortho-child.html":"소아교정","ortho-clear.html":"투명교정",
  "laminate.html":"라미네이트","whitening.html":"치아미백","resin-front.html":"앞니 레진","tmj.html":"턱관절 치료",
};
const UPDATED = new Date().toISOString().slice(0, 10);
const baseName = (t) => t.replace(/\(.*?\)/g, "").trim();
const inParen = (t) => (t.match(/\((.*?)\)/g) || []).map((x) => x.slice(1, -1).trim());
const norm = (s) => s.replace(/\s/g, "");
const IDX = [];
for (const t of T) {
  IDX.push([baseName(t.term), t.slug]);
  inParen(t.term).forEach((x) => IDX.push([x, t.slug]));
  (t.aliases || []).forEach((a) => IDX.push([a, t.slug]));
}
function resolveRelated(name) {
  const b = norm(baseName(name));
  let h = IDX.find(([k]) => norm(k) === b);
  if (!h) h = IDX.find(([k]) => norm(k).length >= 2 && (norm(k).includes(b) || b.includes(norm(k))));
  return h ? h[1] : null;
}
const BY = Object.fromEntries(T.map((t) => [t.slug, t]));

// 초성
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const MERGE = { "ㄲ":"ㄱ","ㄸ":"ㄷ","ㅃ":"ㅂ","ㅆ":"ㅅ","ㅉ":"ㅈ" };
function cho(s) {
  const c = baseName(s).charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) { const k = CHO[Math.floor((c - 0xac00) / 588)]; return MERGE[k] || k; }
  return "A-Z";
}
const CHO_ORDER = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","A-Z"];
const firstSentence = (s) => (s.split(/(?<=[.?!])\s/)[0] || s);

const EXTRA_CSS = `
  .en{ font-family:'Playfair Display',serif; font-style:italic; font-size:17px; color:#8A8A8A; margin:6px 0 0; }
  .tagcat{ display:inline-block; font-size:12px; letter-spacing:.02em; color:var(--accent); border:1px solid rgba(107,68,35,.35); border-radius:100px; padding:3px 10px; }
  .alias{ font-size:14px; color:#8A8A8A; margin:12px 0 0; line-height:1.7; }
  .faq details{ border:1px solid var(--line); border-radius:8px; padding:16px 18px; margin:0 0 10px; background:#fff; }
  .faq summary{ cursor:pointer; font-weight:600; font-size:16px; line-height:1.6; list-style:none; }
  .faq summary::-webkit-details-marker{ display:none; }
  .faq summary::before{ content:"Q. "; color:var(--accent); }
  .faq details p{ font-size:15.5px; line-height:1.85; color:#333; margin:12px 0 0; }
  .box{ background:var(--bg2); border-radius:10px; padding:20px 22px; margin:10px 0 0; }
  .box p{ margin:0; }
  .same a{ display:block; padding:12px 0; border-bottom:1px solid var(--line); text-decoration:none; font-size:15px; color:#1A1A1A; }
  .same a span{ color:#8A8A8A; font-size:13.5px; margin-left:8px; }
  .meta{ font-size:12.5px; color:#8A8A8A; margin:18px 0 0; }
  /* index */
  .dsearch{ position:relative; margin:32px 0 0; }
  .dsearch input{ width:100%; height:54px; border:1px solid rgba(26,26,26,.2); border-radius:10px; padding:0 18px 0 48px; font-size:16px; font-family:inherit; background:#fff; }
  .dsearch input:focus{ outline:none; border-color:var(--accent); }
  .dsearch svg{ position:absolute; left:16px; top:17px; }
  .chips{ display:flex; flex-wrap:wrap; gap:8px; margin:22px 0 0; }
  .chip{ border:1px solid var(--line); background:#fff; color:#4A4A4A; border-radius:100px; padding:8px 14px; font-size:13.5px; font-family:inherit; cursor:pointer; }
  .chip b{ font-weight:500; color:#8A8A8A; margin-left:4px; }
  .chip.on{ background:#1A1A1A; color:#fff; border-color:#1A1A1A; }
  .chip.on b{ color:rgba(255,255,255,.6); }
  .cho{ display:flex; flex-wrap:wrap; gap:4px; margin:18px 0 0; padding:14px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .cho a{ width:34px; height:34px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:14px; text-decoration:none; color:#1A1A1A; }
  .cho a:hover{ background:var(--bg2); color:var(--accent); }
  .cho a.off{ color:#ccc; pointer-events:none; }
  .grp h2{ font-family:'Noto Serif KR',serif; font-weight:600; font-size:22px; margin:44px 0 6px; color:var(--accent); scroll-margin-top:90px; }
  .it{ display:block; padding:16px 0; border-bottom:1px solid var(--line); text-decoration:none; }
  .it .t{ font-family:'Noto Serif KR',serif; font-weight:500; font-size:17px; color:#1A1A1A; }
  .it .e{ font-size:13px; color:#8A8A8A; margin-left:8px; }
  .it .c{ float:right; font-size:12px; color:var(--accent); margin-top:4px; }
  .it p{ font-size:14px; color:#6A6A6A; margin:6px 0 0; line-height:1.6; }
  .it:hover .t{ color:var(--accent); }
  .cnt{ font-size:14px; color:#8A8A8A; margin:22px 0 0; }
  .empty{ display:none; padding:40px 0; text-align:center; color:#8A8A8A; }
  @media (max-width:600px){ .it .c{ float:none; display:block; margin:0 0 4px; } .chips{ flex-wrap:nowrap; overflow-x:auto; margin-left:-24px; margin-right:-24px; padding:0 24px 4px; scrollbar-width:none; } .chip{ flex-shrink:0; } .chips::-webkit-scrollbar{ display:none; } }
`;

fs.mkdirSync(OUT, { recursive: true });
let made = 0;

for (const t of T) {
  const name = baseName(t.term);
  const title = `${name}${t.en ? " (" + t.en + ")" : ""} 뜻·치료 | 치과 백과사전 | 바로드림치과 안산점`;
  const desc = firstSentence(t.def).slice(0, 155);
  const canonical = `https://barodreamdental.kr/dictionary/${t.slug}.html`;
  const rel = [];
  for (const r of t.related || []) {
    const s = resolveRelated(r);
    if (s && s !== t.slug && BY[s] && !rel.includes(s)) rel.push(s);
  }
  const relLinks = rel.map((s) => `<li><a href="${s}.html">${esc(baseName(BY[s].term))}</a></li>`);
  if (t.col) relLinks.push(`<li><a href="../column-01.html">칼럼 · 크라운·브리지 재건 이야기</a></li>`);
  const same = T.filter((x) => x.cat === t.cat && x.slug !== t.slug && !rel.includes(x.slug)).slice(0, 6);
  const aliases = [...new Set([...inParen(t.term), ...(t.aliases || [])])].filter((a) => !/수면/.test(a) || true);
  const faq = (t.faq || []).filter((f) => f && f.q && f.a);
  const ld = [
    { "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [t.en, ...inParen(t.term)].filter(Boolean),
      description: t.def, inDefinedTermSet: "https://barodreamdental.kr/dictionary/", url: canonical },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://barodreamdental.kr/" },
      { "@type": "ListItem", position: 2, name: "치과 백과사전", item: "https://barodreamdental.kr/dictionary/" },
      { "@type": "ListItem", position: 3, name, item: canonical } ] },
  ];
  if (faq.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const page = t.page && PAGE_LABEL[t.page] ? t.page : "";
  const html = head(title, desc, canonical).replace("</style>", EXTRA_CSS + "</style>") + `
<main class="wrap">
  <p class="crumb"><a href="../index.html">홈</a> › <a href="index.html">치과 백과사전</a> › <a href="index.html#cat-${CATS.indexOf(t.cat)}">${esc(t.cat)}</a></p>
  <p style="margin:22px 0 0;"><span class="tagcat">${esc(t.cat)}</span></p>
  <h1 class="term">${esc(name)}</h1>
  ${t.en ? `<p class="en">${esc(t.en)}</p>` : ""}
  ${aliases.length ? `<p class="alias">다른 이름 · ${aliases.map(esc).join(" · ")}</p>` : ""}
  <p class="lead">${esc(t.def)}</p>
  <div class="body">
    ${t.why ? `<h2 class="dh">왜 알아두면 좋은가</h2>\n    <p>${esc(t.why)}</p>` : ""}
    ${t.how ? `<h2 class="dh">어떻게 진행되나요</h2>\n    <p>${esc(t.how)}</p>` : ""}
    ${t.caution ? `<h2 class="dh">주의할 점</h2>\n    <div class="box"><p>${esc(t.caution)}</p></div>` : ""}
    ${t.misc ? `<h2 class="dh">자주 하는 오해</h2>\n    <p>${esc(t.misc)}</p>` : ""}
  </div>
  ${faq.length ? `<h2 class="dh">자주 묻는 질문</h2>\n  <div class="faq">${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>` : ""}
  ${relLinks.length ? `<h2 class="dh">관련 용어</h2>\n  <ul class="rel">\n    ${relLinks.join("\n    ")}\n  </ul>` : ""}
  ${page ? `<h2 class="dh">관련 진료 안내</h2>\n  <a class="cta-link" href="../${page}">${esc(PAGE_LABEL[page])} 보기 →</a>` : ""}
  ${same.length ? `<h2 class="dh">${esc(t.cat)} 다른 용어</h2>\n  <div class="same">${same.map((x) => `<a href="${x.slug}.html">${esc(baseName(x.term))}<span>${esc(firstSentence(x.def).slice(0, 40))}…</span></a>`).join("")}</div>` : ""}
  <p class="disc">${esc(DISCLAIMER)}</p>
  <p class="meta">최종 업데이트 ${UPDATED}</p>
</main>
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>` + footer;
  fs.writeFileSync(path.join(OUT, `${t.slug}.html`), html, "utf-8");
  made++;
}

// 색인
const sorted = [...T].sort((a, b) => baseName(a.term).localeCompare(baseName(b.term), "ko"));
const groups = {};
for (const t of sorted) (groups[cho(t.term)] ||= []).push(t);
const catCount = CATS.map((c) => T.filter((t) => t.cat === c).length);
const chips = `<button class="chip on" data-cat="all">전체<b>${T.length}</b></button>` +
  CATS.map((c, i) => `<button class="chip" data-cat="${i}" id="cat-${i}">${esc(c)}<b>${catCount[i]}</b></button>`).join("");
const choBar = CHO_ORDER.map((k) => groups[k] ? `<a href="#g-${encodeURIComponent(k)}">${k === "A-Z" ? "A–Z" : k}</a>` : `<a class="off">${k === "A-Z" ? "A–Z" : k}</a>`).join("");
let list = "";
for (const k of CHO_ORDER) {
  if (!groups[k]) continue;
  list += `\n  <section class="grp" data-g="${k}"><h2 id="g-${encodeURIComponent(k)}">${k === "A-Z" ? "A–Z" : k}</h2>\n`;
  for (const t of groups[k]) {
    const hay = [t.term, t.en, ...(t.aliases || []), t.def].join(" ").toLowerCase().replace(/"/g, "");
    list += `  <a class="it" href="${t.slug}.html" data-cat="${CATS.indexOf(t.cat)}" data-s="${esc(hay)}"><span class="c">${esc(t.cat)}</span><span class="t">${esc(baseName(t.term))}</span>${t.en ? `<span class="e">${esc(t.en)}</span>` : ""}<p>${esc(firstSentence(t.def))}</p></a>\n`;
  }
  list += `  </section>\n`;
}
const setLd = {
  "@context": "https://schema.org", "@type": "DefinedTermSet",
  name: "치과 백과사전 · 바로드림치과 안산점", url: "https://barodreamdental.kr/dictionary/",
  hasDefinedTerm: T.map((t) => ({ "@type": "DefinedTerm", name: baseName(t.term), url: `https://barodreamdental.kr/dictionary/${t.slug}.html` })),
};
const JS = `<script>
(function(){
  var q=document.getElementById('dq'), chips=[].slice.call(document.querySelectorAll('.chip')), items=[].slice.call(document.querySelectorAll('.it')),
      grps=[].slice.call(document.querySelectorAll('.grp')), cnt=document.getElementById('dcnt'), empty=document.getElementById('dempty'), cat='all';
  function run(){
    var s=(q.value||'').trim().toLowerCase().replace(/\\s+/g,''), n=0;
    items.forEach(function(el){
      var ok=(cat==='all'||el.getAttribute('data-cat')===cat)&&(!s||el.getAttribute('data-s').replace(/\\s+/g,'').indexOf(s)>-1);
      el.style.display=ok?'':'none'; if(ok)n++;
    });
    grps.forEach(function(g){ g.style.display=[].some.call(g.querySelectorAll('.it'),function(e){return e.style.display!=='none';})?'':'none'; });
    cnt.textContent=n+'개 용어'; empty.style.display=n?'none':'block';
  }
  q.addEventListener('input',run);
  chips.forEach(function(c){ c.addEventListener('click',function(){ chips.forEach(function(x){x.classList.remove('on');}); c.classList.add('on'); cat=c.getAttribute('data-cat'); run(); }); });
  var h=location.hash.match(/^#cat-(\\d+)$/); if(h){ var c=document.getElementById('cat-'+h[1]); if(c) c.click(); }
  var p=new URLSearchParams(location.search).get('q'); if(p){ q.value=p; run(); }
})();
</script>`;
const idxTitle = "치과 백과사전 | 임플란트·충치·잇몸·교정 치과 용어 " + T.length + "개 | 바로드림치과 안산점";
const idxDesc = `임플란트, 의식하진정, 충치, 신경치료, 잇몸, 보철·틀니, 교정, 사랑니, 미백, 건강보험까지 치과 용어 ${T.length}개를 환자가 이해하기 쉬운 말로 정리한 치과 백과사전입니다.`;
const idxHtml = head(idxTitle, idxDesc, "https://barodreamdental.kr/dictionary/").replace("</style>", EXTRA_CSS + "</style>") + `
<main class="wrap" style="max-width:860px;">
  <p class="crumb"><a href="../index.html">홈</a> › 치과 백과사전</p>
  <h1 class="term">치과 백과사전</h1>
  <p class="lead">치과에서 듣는 낯선 용어, 증상, 치료 과정, 건강보험 기준까지 ${T.length}개 용어를 환자가 이해하기 쉬운 말로 정리했습니다. 궁금한 용어를 검색하거나 분류·초성으로 찾아보세요.</p>
  <div class="dsearch">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
    <input id="dq" type="search" placeholder="예: 임플란트, 시린 이, 스케일링 보험, 사랑니" aria-label="치과 용어 검색">
  </div>
  <div class="chips">${chips}</div>
  <nav class="cho" aria-label="초성 바로가기">${choBar}</nav>
  <p class="cnt" id="dcnt">${T.length}개 용어</p>
  ${list}
  <p class="empty" id="dempty">검색 결과가 없습니다. 다른 말로 검색해 보세요.</p>
  <p class="disc">${esc(DISCLAIMER)}</p>
  <p class="meta">최종 업데이트 ${UPDATED}</p>
</main>
<script type="application/ld+json">
${JSON.stringify(setLd)}
</script>
${JS}` + footer;
fs.writeFileSync(path.join(OUT, "index.html"), idxHtml, "utf-8");

// sitemap 갱신 (dictionary 항목 교체)
const SM = "sitemap.xml";
if (fs.existsSync(SM)) {
  let sm = fs.readFileSync(SM, "utf-8");
  sm = sm.replace(/\s*<url><loc>https:\/\/barodreamdental\.kr\/dictionary\/[^<]*<\/loc>.*?<\/url>/g, "");
  const add = [`  <url><loc>https://barodreamdental.kr/dictionary/</loc><lastmod>${UPDATED}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`]
    .concat(T.map((t) => `  <url><loc>https://barodreamdental.kr/dictionary/${t.slug}.html</loc><lastmod>${UPDATED}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`));
  sm = sm.replace("</urlset>", add.join("\n") + "\n</urlset>");
  fs.writeFileSync(SM, sm, "utf-8");
}
console.log(`생성 완료: 용어 ${made}개 + 색인 1개 (dictionary/)`);
