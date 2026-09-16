import fs from "fs";

// 컴팩트 카드 1개 생성 (진료 페이지 하단 Medical Team)
const card = (img, alt, quote, name, title, desc) =>
  `      <div style="display:flex; gap:24px; align-items:center; padding:28px; border:1px solid var(--line); border-radius:4px;"><img width="330" height="390" src="images/${img}" alt="${alt}" style="width:110px; height:130px; flex-shrink:0; border-radius:3px; object-fit:cover; filter:grayscale(1);"><div><p style="font-family:'Playfair Display',serif; font-style:italic; font-size:16px; color:var(--accent); margin:0 0 8px;">"${quote}"</p><h3 style="font-family:'Noto Serif KR',serif; font-weight:500; font-size:20px; letter-spacing:-0.02em; color:#1A1A1A; margin:0 0 4px;">${name} <span style="font-size:13px; color:#8A8A8A;">${title}</span></h3><p style="font-size:13px; line-height:1.6; color:#4A4A4A; margin:0;">${desc}</p></div></div>`;

const kim = card("dr.kim.jpg", "김진희 대표원장", "보이지 않는 정확함을 만듭니다.", "김진희", "대표원장", "통합치의학과 전문의");
const han = card("dr.han.jpg", "한지상 대표원장", "30년을 환자로 살았습니다.", "한지상", "대표원장", "통합치의학과 전문의");
const seok = card("dr.seok.jpg", "석지원 교정원장", "삐뚤어진 치아를 바르게 교정합니다.", "석지원", "교정원장", "통합치의학과 전문의 · 치아교정");

const NL = "\r\n";
const newGrid =
  `<div class="bd-dr-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:32px;">${NL}${kim}${NL}${han}${NL}${seok}`;

// 대상: Medical Team 컴팩트 카드가 있는 21개 (doctors.html·index.html 제외)
const files = fs.readdirSync(".").filter(f => f.endsWith(".html") && f !== "doctors.html" && f !== "index.html");

const re = /<div class="bd-dr-grid" style="display:grid; grid-template-columns:repeat\(2,1fr\); gap:32px;">\r?\n[ \t]*<div style="display:flex;[^\n]*dr\.han\.jpg[^\r\n]*<\/div>\r?\n[ \t]*<div style="display:flex;[^\n]*dr\.kim\.jpg[^\r\n]*<\/div>/;

let changed = 0, skipped = [];
for (const f of files) {
  const s = fs.readFileSync(f, "utf-8");
  if (!re.test(s)) { if (/bd-dr-grid/.test(s)) skipped.push(f); continue; }
  fs.writeFileSync(f, s.replace(re, newGrid));
  changed++;
}
console.log("교체 완료:", changed, "개");
if (skipped.length) console.log("bd-dr-grid 있으나 미매칭(수동확인):", skipped.join(", "));
