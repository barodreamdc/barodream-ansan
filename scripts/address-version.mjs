import fs from "fs";
import path from "path";

const NEW = "대동조이월드 4층(롯데시네마 센트럴락 4층)";

function processDir(dir) {
  let addr = 0, ver = 0, files = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".html")) continue;
    const p = path.join(dir, f);
    let s = fs.readFileSync(p, "utf-8");
    const before = s;
    // 1) 405호 표기 → 4층(롯데시네마 센트럴락 4층)
    s = s.replace(/대동조이월드 405호/g, NEW);
    // 2) 단독 "대동조이월드 4층"(뒤에 '(' 없는 경우) → 통일 표기
    s = s.replace(/대동조이월드 4층(?!\()/g, NEW);
    // 3) 버전 쿼리 갱신
    s = s.replace(/\?v=20260915/g, "?v=20260916");
    if (s !== before) {
      addr += (before.match(/405호|대동조이월드 4층(?!\()/g) || []).length;
      ver += (before.match(/\?v=20260915/g) || []).length;
      fs.writeFileSync(p, s);
      files++;
    }
  }
  return { addr, ver, files };
}

const root = processDir(".");
const dict = processDir("dictionary");
console.log("[root]", JSON.stringify(root));
console.log("[dictionary]", JSON.stringify(dict));
