import fs from "fs";

// ── laminate에서 BLOCK 8 DOCTORS 섹션 추출(정본) ─────────────
const lam = fs.readFileSync("laminate.html", "utf-8");
const a = lam.indexOf("<!-- BLOCK 8 DOCTORS -->");
const b = lam.indexOf("</section>", a) + "</section>".length;
const BLOCK8 = lam.slice(a, b);
if (a < 0 || b < a) throw new Error("BLOCK8 추출 실패");

// ── Task 1: 3개 페이지에 Medical Team 삽입(<!-- CTA --> 직전) ──
const t1files = ["implant-senior.html", "ortho.html", "sedation.html"];
let t1 = [];
for (const f of t1files) {
  let s = fs.readFileSync(f, "utf-8");
  if (s.includes("BLOCK 8 DOCTORS")) { t1.push(`${f}(이미있음-건너뜀)`); continue; }
  const anchor = s.match(/[ \t]*<!-- CTA -->/);
  if (!anchor) { t1.push(`${f}(CTA앵커없음-실패)`); continue; }
  s = s.replace(/([ \t]*<!-- CTA -->)/, `${BLOCK8}\r\n\r\n$1`);
  fs.writeFileSync(f, s);
  t1.push(`${f}(삽입)`);
}

// ── Task 2: column-01 글쓴이 변경 + 검수줄 삭제 ──────────────
let c = fs.readFileSync("column-01.html", "utf-8");
const c0 = c;
c = c.replace("<strong>한지상 대표원장</strong>", "<strong>한지상·김진희 대표원장</strong>");
// 검수 <p> 한 줄 통째 삭제(앞 개행 포함)
c = c.replace(/[ \t]*<p style="[^"]*">검수: \[교체\] 원장 검수 후 이름·일자 입력<\/p>\r?\n/, "");
fs.writeFileSync("column-01.html", c);
const t2 = {
  name변경: c.includes("한지상·김진희 대표원장"),
  검수삭제: !c.includes("검수: [교체]"),
  changed: c !== c0,
};

// ── Task 3: threshold 0.12 → 0 (30개 root 페이지) ────────────
let t3 = 0;
for (const f of fs.readdirSync(".")) {
  if (!f.endsWith(".html")) continue;
  let s = fs.readFileSync(f, "utf-8");
  if (!s.includes("threshold:0.12")) continue;
  s = s.replace(/threshold:0\.12/g, "threshold:0");
  fs.writeFileSync(f, s);
  t3++;
}

console.log("BLOCK8 길이:", BLOCK8.length);
console.log("[Task1]", t1.join(", "));
console.log("[Task2]", JSON.stringify(t2));
console.log("[Task3] threshold 변경 파일:", t3, "개");
