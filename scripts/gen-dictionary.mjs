#!/usr/bin/env node
/**
 * 치과 백과사전 1차(46개 용어) 정적 페이지 생성 → /dictionary/
 * 이번 배포는 noindex 유지(검수 전). '감수' 표기 없음. sitemap 미추가.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "dictionary";
const GA = `<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-WMKC3PRD3W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  if (location.hostname === "barodreamdental.kr") { gtag("config", "G-WMKC3PRD3W"); }
</script>`;

// 본사이트 전체 헤더/모바일메뉴/푸터/JS를 실제 페이지에서 추출 → /dictionary/ 기준으로 경로 보정
const REF = fs.readFileSync("caries.html", "utf-8");
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return s.slice(i, j + b.length); };
function fixPaths(s) {
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

// 연결 진료페이지: 용어표 표기 → 실제 파일명
const PAGE = {
  "implant.html": "implant-senior.html",
  "implant-bone-graft.html": "implant-senior.html",
  "implant-navigation.html": "implant-navigation.html",
  "implant-allonx.html": "implant-all-on-x.html",
  "prosthesis.html": "prosthesis.html",
  "implant-sedation.html": "implant-sedation.html",
  "sedation.html": "sedation.html",
};
const PAGE_LABEL = {
  "implant-senior.html": "임플란트 진료 안내",
  "implant-navigation.html": "네비게이션 임플란트",
  "implant-all-on-x.html": "올온엑스(전체 임플란트)",
  "prosthesis.html": "보철치료",
  "implant-sedation.html": "수면 임플란트",
  "sedation.html": "의식하진정법",
};

const CATS = ["임플란트 기본", "올온엑스(All-on-X)", "수면임플란트·의식하진정"];

// 46개 용어. def=정의(2~4문장, '~입니다'로 시작), why=왜 중요, misc=오해(선택), related=관련용어(표제어명), col=칼럼1호 연결
const T = [
  { slug:"implant", cat:0, term:"임플란트", search:["임플란트란","임플란트 뜻"], page:"implant.html", related:["픽스처","어버트먼트","임플란트 크라운"], col:false,
    def:"임플란트는 빠진 치아 자리에 인공 뿌리를 심어 그 위에 인공 치아를 만드는 치료입니다. 잇몸뼈 안에 티타늄 등으로 만든 픽스처를 넣고, 그 위에 기둥과 보철물을 연결해 자연치아와 비슷하게 씹는 기능을 회복합니다.",
    why:"틀니나 브리지와 달리 옆 치아를 깎지 않고 독립적으로 치아를 복구할 수 있어, 남은 치아를 보존하는 데 도움이 됩니다.",
    misc:"임플란트도 심고 나서 관리하지 않으면 잇몸 염증이 생길 수 있어, 자연치아처럼 정기 검진과 관리가 필요합니다." },
  { slug:"fixture", cat:0, term:"픽스처(고정체)", search:["임플란트 나사","임플란트 뿌리"], page:"implant.html", related:["골유착","어버트먼트"], col:false,
    def:"픽스처는 잇몸뼈 안에 심어 자연치아의 뿌리 역할을 하는 임플란트 몸체입니다. 주로 티타늄 계열 재료로 만들어지며, 뼈와 결합해 임플란트 전체를 지탱합니다.",
    why:"픽스처가 잇몸뼈에 단단히 붙어야(골유착) 그 위의 기둥과 보철물이 안정적으로 기능할 수 있습니다." },
  { slug:"abutment", cat:0, term:"어버트먼트(지대주)", search:["임플란트 기둥"], page:"implant.html", related:["픽스처","임플란트 크라운","나사 풀림"], col:false,
    def:"어버트먼트는 잇몸뼈에 심은 픽스처와 겉으로 보이는 인공 치아(크라운)를 이어주는 기둥 부품입니다. 픽스처에 나사로 연결되며, 그 위에 보철물이 올라갑니다.",
    why:"픽스처와 크라운을 연결하는 중간 역할을 하므로, 어버트먼트의 나사가 풀리면 보철물이 흔들리는 느낌이 들 수 있습니다." },
  { slug:"implant-crown", cat:0, term:"임플란트 크라운", search:["임플란트 머리","임플란트 보철"], page:"implant.html", related:["어버트먼트","지르코니아 전악 보철"], col:true,
    def:"임플란트 크라운은 어버트먼트 위에 올라가는, 겉으로 보이는 인공 치아입니다. 지르코니아나 세라믹 등으로 만들며, 옆 치아의 색과 모양에 맞춰 제작합니다.",
    why:"실제로 씹고 웃을 때 보이는 부분이라, 색·형태·잇몸선과의 조화가 자연스러움을 좌우합니다." },
  { slug:"osseointegration", cat:0, term:"골유착", search:["임플란트 뼈 붙는 기간"], page:"implant.html", related:["픽스처","치조골","2차 수술"], col:false,
    def:"골유착은 잇몸뼈에 심은 픽스처가 주변 뼈와 단단히 결합하는 과정입니다. 이 결합이 이루어져야 임플란트가 힘을 견디고 오래 기능할 수 있습니다.",
    why:"골유착이 충분히 이루어진 뒤 보철물을 올려야 안정적이며, 이 때문에 식립 후 일정 기간을 기다립니다.",
    misc:"골유착에 걸리는 기간은 보통 수개월이지만, 뼈 상태와 부위에 따라 개인차가 있습니다." },
  { slug:"alveolar-bone", cat:0, term:"치조골", search:["잇몸뼈"], page:"implant.html", related:["골밀도","골이식","치조골 흡수"], col:false,
    def:"치조골은 치아 뿌리를 감싸 지지하는 잇몸 속 뼈입니다. 임플란트는 이 치조골 안에 픽스처를 심기 때문에, 치조골의 양과 질이 중요합니다.",
    why:"치조골이 충분해야 임플란트를 안정적으로 심을 수 있고, 부족하면 뼈이식 등 추가 과정을 검토합니다." },
  { slug:"alveolar-bone-resorption", cat:0, term:"치조골 흡수", search:["발치 후 잇몸뼈 녹음"], page:"implant.html", related:["치조골","골이식","즉시 식립"], col:false,
    def:"치조골 흡수는 치아를 뽑거나 오래 비워 두었을 때 잇몸뼈가 점차 줄어드는 현상입니다. 치아가 빠지면 그 자리에 가해지던 자극이 사라지면서 뼈의 양이 감소할 수 있습니다.",
    why:"흡수가 진행되면 임플란트를 심을 뼈가 부족해질 수 있어, 발치 후 방치하지 않고 상태를 확인하는 것이 좋습니다." },
  { slug:"bone-density", cat:0, term:"골밀도", search:["뼈가 약해서 임플란트 안 된다"], page:"implant.html", related:["치조골","골이식","CT 검사"], col:false,
    def:"골밀도는 잇몸뼈가 얼마나 단단하고 치밀한지를 나타내는 정도입니다. 임플란트를 심을 부위의 골밀도에 따라 식립 방법과 회복 기간이 달라질 수 있습니다.",
    why:"골밀도가 낮아도 식립 방식 조정이나 뼈이식으로 진행할 수 있는 경우가 있어, 검사 후 판단합니다." },
  { slug:"bone-graft", cat:0, term:"골이식(뼈이식)", search:["임플란트 뼈이식 꼭 해야 하나"], page:"implant-bone-graft.html", related:["치조골","상악동 거상술"], col:true,
    def:"골이식은 임플란트를 심을 잇몸뼈가 부족할 때 뼈나 뼈 대체 재료를 보충하는 시술입니다. 부족한 뼈의 폭이나 높이를 채워 임플란트가 안정적으로 자리 잡도록 돕습니다.",
    why:"뼈가 부족한 경우에도 임플란트를 진행할 수 있는 길을 넓혀 줍니다.",
    misc:"임플란트라고 모든 경우에 뼈이식이 필요한 것은 아니며, 식립 부위에 뼈가 충분하면 하지 않습니다." },
  { slug:"sinus-lift", cat:0, term:"상악동 거상술(사이너스 리프트)", search:["위 어금니 임플란트 뼈이식"], page:"implant-bone-graft.html", related:["골이식","치조골"], col:false,
    def:"상악동 거상술은 위쪽 어금니 부위의 뼈 위에 있는 빈 공간(상악동)의 바닥막을 들어 올려 그 아래에 뼈를 보충하는 시술입니다. 위 어금니는 뼈 높이가 부족한 경우가 많아 시행하기도 합니다.",
    why:"위 어금니처럼 뼈 높이가 부족한 부위에 임플란트를 심을 수 있도록 돕는 방법입니다." },
  { slug:"immediate-placement", cat:0, term:"즉시 식립", search:["발치하고 바로 임플란트"], page:"implant.html", related:["지연 식립","치조골 흡수"], col:true,
    def:"즉시 식립은 치아를 뽑은 그 자리에 곧바로 임플란트를 심는 방식입니다. 발치와 식립을 한 번에 진행해 전체 치료 기간을 줄일 수 있는 경우가 있습니다.",
    why:"발치 후 뼈가 줄어드는 것을 줄이는 데 도움이 될 수 있습니다.",
    misc:"모든 경우에 가능한 것은 아니며, 발치 부위의 뼈 양·염증 여부·초기 고정 등 조건이 맞아야 합니다." },
  { slug:"delayed-placement", cat:0, term:"지연 식립", search:["발치 후 몇 달 뒤 임플란트"], page:"implant.html", related:["즉시 식립","골유착"], col:false,
    def:"지연 식립은 치아를 뽑은 뒤 일정 기간 잇몸과 뼈가 회복되기를 기다렸다가 임플란트를 심는 방식입니다. 발치 부위에 염증이 있거나 뼈 회복이 필요할 때 선택합니다.",
    why:"발치 부위 상태가 좋지 않을 때 안정적인 식립 환경을 먼저 만드는 방법입니다." },
  { slug:"navigation-implant", cat:0, term:"네비게이션 임플란트(가이드 수술)", search:["네비게이션 임플란트란","디지털 임플란트"], page:"implant-navigation.html", related:["CT 검사","수술 가이드"], col:true,
    def:"네비게이션 임플란트는 3D CT와 구강 스캔으로 임플란트 위치·각도·깊이를 미리 계획하고, 맞춤 가이드로 그대로 식립하는 방식입니다. 흔히 가이드 수술이라고도 부릅니다.",
    why:"미리 설계해 진행하기 때문에 절개를 줄이거나 계획한 위치에 가깝게 식립하는 데 도움이 될 수 있습니다.",
    misc:"디지털 방식이라도 오차가 완전히 없어지는 것은 아니며, 뼈·잇몸 상태와 수술 당일 상황을 의료진이 함께 판단합니다." },
  { slug:"surgical-guide", cat:0, term:"수술 가이드(서지컬 가이드)", search:["임플란트 가이드 틀"], page:"implant-navigation.html", related:["네비게이션 임플란트"], col:false,
    def:"수술 가이드는 계획한 임플란트 위치대로 식립하도록 도와주는 맞춤 제작 틀입니다. 환자의 구강 모형과 CT 자료를 바탕으로 만들어, 수술 시 위치와 방향을 안내합니다.",
    why:"미리 세운 계획을 실제 수술에 옮기는 데 사용되는 도구입니다." },
  { slug:"ct-scan", cat:0, term:"CT 검사(3D CT)", search:["임플란트 전 검사"], page:"implant-navigation.html", related:["골밀도","네비게이션 임플란트"], col:false,
    def:"CT 검사는 잇몸뼈와 신경, 상악동 등을 3차원으로 촬영해 확인하는 검사입니다. 임플란트를 심기 전 뼈의 양과 신경 위치 등을 파악하는 데 쓰입니다.",
    why:"평면 X-ray로는 보기 어려운 뼈의 두께나 신경 위치를 확인해 계획을 세우는 데 도움이 됩니다." },
  { slug:"second-stage-surgery", cat:0, term:"2차 수술(힐링 어버트먼트)", search:["임플란트 2차 수술이 뭐예요"], page:"implant.html", related:["골유착","어버트먼트"], col:false,
    def:"2차 수술은 잇몸 속에 심은 픽스처가 뼈와 붙은 뒤, 잇몸 위로 연결 부품(힐링 어버트먼트)을 노출시키는 간단한 과정입니다. 이후 보철물을 올릴 준비를 합니다.",
    why:"픽스처를 잇몸으로 덮어 둔 경우, 골유착 이후 잇몸을 다듬어 보철 과정으로 넘어가기 위한 단계입니다." },
  { slug:"temporary-prosthesis", cat:0, term:"임시 치아(임시 보철)", search:["임플란트 하는 동안 이 없이 지내나요"], page:"implant.html", related:["즉시 부하","임플란트 크라운"], col:false,
    def:"임시 치아는 최종 보철물이 완성되기 전 사용하는 임시 인공 치아입니다. 치료 기간 동안 겉모습과 기본적인 기능을 유지하도록 돕습니다.",
    why:"특히 앞니처럼 보이는 부위에서 치료 중에도 일상생활을 이어가는 데 도움이 됩니다." },
  { slug:"peri-implantitis", cat:0, term:"임플란트 주위염", search:["임플란트 잇몸 염증","임플란트 붓고 아픔"], page:"implant.html", related:["임플란트 재수술","치조골"], col:true,
    def:"임플란트 주위염은 임플란트 주변 잇몸과 뼈에 염증이 생긴 상태입니다. 자연치아의 잇몸병과 비슷하게, 치태와 세균이 쌓여 진행될 수 있습니다.",
    why:"방치하면 임플란트를 지지하는 뼈가 줄어들 수 있어, 조기에 확인하고 관리하는 것이 중요합니다." },
  { slug:"screw-loosening", cat:0, term:"나사 풀림", search:["임플란트 흔들림"], page:"implant.html", related:["어버트먼트"], col:false,
    def:"나사 풀림은 임플란트의 기둥(어버트먼트)이나 보철물을 고정하는 나사가 느슨해지는 현상입니다. 씹는 힘이 반복되면서 나타날 수 있습니다.",
    why:"흔들리는 느낌이 있을 때 확인하면 대개 나사를 다시 조여 해결할 수 있고, 방치하면 부품 손상으로 이어질 수 있습니다." },
  { slug:"implant-resurgery", cat:0, term:"임플란트 재수술", search:["임플란트 실패","다시 하기"], page:"implant.html", related:["임플란트 주위염","골이식"], col:false,
    def:"임플란트 재수술은 기존 임플란트에 문제가 생겨 제거하고 다시 심거나 보완하는 치료입니다. 심한 주위염이나 뼈 부족 등이 원인이 될 수 있습니다.",
    why:"원인에 따라 뼈를 회복시킨 뒤 재식립하는 등 과정이 달라지므로, 정확한 진단이 먼저입니다." },
  { slug:"bridge-vs-implant", cat:0, term:"브리지 vs 임플란트", search:["브리지 임플란트 차이","뭐가 나은가"], page:"prosthesis.html", related:["임플란트","임플란트 크라운"], col:true,
    def:"브리지는 빠진 치아 양옆을 기둥 삼아 연결해 메우는 방식이고, 임플란트는 빠진 자리에 인공 뿌리를 심는 방식입니다. 브리지는 옆 치아를 다듬어야 하지만, 임플란트는 옆 치아를 건드리지 않고 독립적으로 복구합니다.",
    why:"남은 치아 상태와 뼈 조건에 따라 더 적합한 방법이 다르므로, 두 방법을 비교해 선택합니다." },
  { slug:"in-house-lab", cat:0, term:"원내 기공소", search:["임플란트 크라운 어디서 만드나"], page:"implant.html", related:["임플란트 크라운","지르코니아 전악 보철"], col:false,
    def:"원내 기공소는 치과 안에 보철물을 제작·조정하는 기공 시설을 갖춘 것을 말합니다. 크라운 등 보철물을 병원 내에서 만들고 다듬을 수 있습니다.",
    why:"보철물의 색이나 형태를 직접 확인하며 조정하는 과정을 원내에서 진행할 수 있습니다." },

  { slug:"all-on-x", cat:1, term:"올온엑스(All-on-X)", search:["올온엑스란","올온4 올온6"], page:"implant-allonx.html", related:["올온포","올온식스","전악 임플란트"], col:false,
    def:"올온엑스는 이가 많이 없거나 전부 없는 경우, 적은 수의 임플란트로 한쪽 턱 전체의 치아를 고정하는 방식을 통칭합니다. X는 사용하는 임플란트 개수를 뜻하며, 올온4·올온6 등이 여기에 포함됩니다.",
    why:"모든 치아 자리에 임플란트를 심지 않고도 전체 치아를 고정성으로 회복할 수 있는 방법입니다." },
  { slug:"all-on-4", cat:1, term:"올온포(All-on-4)", search:["올온4 임플란트"], page:"implant-allonx.html", related:["올온엑스","경사 식립","즉시 부하"], col:false,
    def:"올온포는 한쪽 턱에 임플란트 4개를 심어 전체 치아를 고정하는 방식입니다. 뒤쪽 임플란트를 비스듬히 심는 경사 식립을 함께 사용하기도 합니다.",
    why:"뼈가 부족한 부위를 피해 설계할 수 있어, 전악 수복의 한 방법으로 검토됩니다." },
  { slug:"all-on-6", cat:1, term:"올온식스(All-on-6)", search:["올온6 임플란트"], page:"implant-allonx.html", related:["올온엑스","올온포"], col:false,
    def:"올온식스는 한쪽 턱에 임플란트 6개를 심어 전체 치아를 고정하는 방식입니다. 올온포보다 임플란트 개수가 많아 지지점이 늘어납니다.",
    why:"뼈 상태와 씹는 힘 등을 고려해 4개와 6개 중 적합한 방식을 선택합니다." },
  { slug:"full-arch-implant", cat:1, term:"전악 임플란트", search:["이가 하나도 없을 때 임플란트","전체 임플란트"], page:"implant-allonx.html", related:["무치악","올온엑스","임플란트 틀니"], col:false,
    def:"전악 임플란트는 한쪽 또는 위아래 턱 전체의 치아를 임플란트로 회복하는 치료를 말합니다. 올온엑스 같은 고정성 방식이나 임플란트 틀니 방식으로 진행할 수 있습니다.",
    why:"이가 거의 없거나 전부 없는 경우 씹는 기능을 되찾기 위한 방법입니다." },
  { slug:"edentulous", cat:1, term:"무치악", search:["이가 다 빠짐"], page:"implant-allonx.html", related:["전악 임플란트","임플란트 틀니"], col:false,
    def:"무치악은 한쪽 또는 위아래 턱에 치아가 하나도 없는 상태를 뜻합니다. 전악 임플란트나 틀니로 치아를 회복하는 대상이 됩니다.",
    why:"무치악은 뼈 상태·잇몸 형태에 따라 적합한 회복 방법이 달라 정밀한 진단이 필요합니다." },
  { slug:"hybrid-prosthesis", cat:1, term:"하이브리드 보철(고정형)", search:["올온엑스 고정 틀니"], page:"implant-allonx.html", related:["올온엑스","지르코니아 전악 보철"], col:false,
    def:"하이브리드 보철은 임플란트에 고정해 빼지 않고 사용하는 전악 보철물입니다. 틀니처럼 잇몸에 얹는 것이 아니라 임플란트에 나사 등으로 단단히 연결됩니다.",
    why:"고정성이라 씹는 힘과 안정감 면에서 장점이 있으며, 재료와 형태는 상태에 따라 정합니다." },
  { slug:"implant-overdenture", cat:1, term:"임플란트 틀니(오버덴처)", search:["임플란트 틀니 뭐가 다른가"], page:"implant-allonx.html", related:["전악 임플란트","하이브리드 보철"], col:false,
    def:"임플란트 틀니(오버덴처)는 임플란트 몇 개를 심어 그 위에 틀니를 결합해 쓰는 방식입니다. 일반 틀니보다 헐거움이 적고, 필요 시 빼서 세척할 수 있습니다.",
    why:"고정성 전악 임플란트와 일반 틀니의 중간 성격으로, 뼈 상태나 관리 편의에 따라 선택합니다." },
  { slug:"immediate-loading", cat:1, term:"즉시 부하(당일 임시치아)", search:["올온엑스 하루 만에 되나"], page:"implant-allonx.html", related:["임시 치아","올온엑스"], col:false,
    def:"즉시 부하는 임플란트를 심은 당일 또는 이른 시기에 고정성 임시 치아를 연결해 사용하는 방식입니다. 조건이 맞으면 수술 후 바로 겉모습과 기본 기능을 회복할 수 있습니다.",
    why:"이 없이 지내는 기간을 줄이는 데 도움이 됩니다.",
    misc:"당일 연결되는 것은 임시 치아이며, 최종 보철물은 뼈가 붙는 기간(보통 수개월)을 거쳐 완성합니다." },
  { slug:"tilted-implant", cat:1, term:"경사 식립(틸티드 임플란트)", search:["올온4 비스듬히 심는 이유"], page:"implant-allonx.html", related:["올온포","상악동 거상술"], col:false,
    def:"경사 식립은 임플란트를 수직이 아니라 비스듬한 각도로 심는 방식입니다. 뼈가 부족하거나 신경·상악동을 피해야 하는 부위에서 활용됩니다.",
    why:"뼈이식 같은 추가 과정을 줄이면서 임플란트를 안정적으로 배치하는 데 쓰이기도 합니다." },
  { slug:"zirconia-full-arch", cat:1, term:"지르코니아 전악 보철", search:["올온엑스 최종 보철 재료"], page:"implant-allonx.html", related:["하이브리드 보철","임플란트 크라운"], col:false,
    def:"지르코니아 전악 보철은 전악 임플란트의 최종 보철물을 단단하고 심미적인 지르코니아 재료로 만든 것입니다. 강도와 색 재현이 좋은 편이라 전악 수복에 사용됩니다.",
    why:"오래 사용하는 최종 보철물의 재료로, 씹는 힘과 심미성을 함께 고려해 선택합니다." },
  { slug:"full-mouth-reconstruction", cat:1, term:"전악 재건(풀마우스)", search:["입안 전체 치료"], page:"implant-allonx.html", related:["올온엑스","무치악"], col:false,
    def:"전악 재건은 입안 전체의 치아와 씹는 관계(교합)를 종합적으로 다시 만드는 치료를 말합니다. 임플란트·보철·교정 등을 상태에 맞게 함께 계획합니다.",
    why:"여러 치아가 손상됐거나 교합이 무너진 경우, 부분이 아니라 전체를 하나의 계획으로 보는 접근입니다." },

  { slug:"sedation-implant", cat:2, term:"수면임플란트", search:["수면임플란트란","자면서 임플란트"], page:"implant-sedation.html", related:["의식하진정법","정맥 진정"], col:false,
    def:"수면임플란트는 완전히 잠드는 것이 아니라, 의식이 있는 진정 상태에서 두려움과 긴장을 낮추며 임플란트 수술을 받는 방법입니다. 진정 약물로 편안함을 돕되 의식은 유지되는 얕은 진정으로 진행하는 경우가 많습니다.",
    why:"치과 수술이 무섭거나 오래 앉아 있기 힘든 분이 부담을 덜고 치료받는 데 도움이 될 수 있습니다." },
  { slug:"conscious-sedation", cat:2, term:"의식하진정법", search:["의식하진정이 뭐예요"], page:"sedation.html", related:["수면임플란트","진정 깊이 단계","마취과 협진"], col:false,
    def:"의식하진정법은 진정 약물로 긴장과 불안을 낮춘 상태에서 치료를 받는 방법입니다. 의식이 완전히 사라지는 전신마취와 달리, 얕은 진정 상태를 유지하며 진행합니다.",
    why:"치과 공포나 구역감이 심한 분이 비교적 편안하게 치료를 받도록 돕는 방법입니다." },
  { slug:"iv-sedation", cat:2, term:"정맥 진정(IV sedation)", search:["수면마취 주사"], page:"sedation.html", related:["의식하진정법","미다졸람","프로포폴"], col:false,
    def:"정맥 진정은 팔의 혈관을 통해 진정 약물을 투여해 진정 상태를 만드는 방법입니다. 약물 용량을 조절하며 진정 깊이를 관리합니다.",
    why:"먹는 약보다 진정 정도를 세밀하게 조절할 수 있어, 상황에 맞춰 사용됩니다." },
  { slug:"sedation-vs-general-anesthesia", cat:2, term:"수면마취 vs 전신마취", search:["수면마취 전신마취 차이"], page:"sedation.html", related:["의식하진정법","회복 시간·보호자 동반"], col:false,
    def:"흔히 말하는 '수면마취'는 의식이 남아 있는 진정에 가깝고, 전신마취는 의식이 완전히 사라진 상태입니다. 치과에서 진행하는 진정은 대개 전신마취보다 얕은 단계입니다.",
    why:"두 방법은 의식 수준·회복 시간·관리 방식이 달라, 치료 범위와 몸 상태에 따라 구분해 적용합니다." },
  { slug:"sedation-levels", cat:2, term:"진정 깊이 단계", search:["수면치료 중 깨어나나요"], page:"sedation.html", related:["의식하진정법","모니터링(산소포화도·혈압)"], col:false,
    def:"진정 깊이 단계는 얕은 진정부터 깊은 진정까지, 의식이 얼마나 남아 있는지를 나누는 정도를 말합니다. 부르면 반응하는 얕은 단계에서 반응이 줄어드는 단계까지 구분됩니다.",
    why:"치료 내용과 환자 상태에 맞춰 적절한 깊이를 유지하며, 이를 확인하기 위해 감시 장비를 사용합니다." },
  { slug:"midazolam", cat:2, term:"미다졸람", search:["수면치료 약","기억 안 남"], page:"sedation.html", related:["정맥 진정(IV sedation)","진정 전 금식"], col:false,
    def:"미다졸람은 진정과 항불안 목적으로 쓰이는 약물의 하나입니다. 긴장을 낮추고 치료 중 기억이 잘 남지 않게 하는 특성이 있는 것으로 알려져 있습니다.",
    why:"진정 치료에서 불안을 줄이는 데 사용되는 약물로, 사용 여부와 용량은 의료진이 상태를 보고 결정합니다." },
  { slug:"propofol", cat:2, term:"프로포폴", search:["프로포폴 치과"], page:"sedation.html", related:["정맥 진정(IV sedation)","마취과 협진"], col:false,
    def:"프로포폴은 진정·마취에 사용되는 정맥 투여 약물입니다. 작용이 비교적 빠르고 회복이 빠른 특성으로 알려져 있습니다.",
    why:"진정 치료에서 의료진의 관리 아래 사용되는 약물이며, 감시 장비로 상태를 확인하면서 투여합니다." },
  { slug:"pre-sedation-fasting", cat:2, term:"진정 전 금식", search:["수면치료 전 밥 먹어도 되나"], page:"sedation.html", related:["정맥 진정(IV sedation)","회복 시간·보호자 동반"], col:false,
    def:"진정 전 금식은 진정 치료 전 일정 시간 동안 음식과 음료를 제한하는 것을 말합니다. 진정 중 위 내용물이 역류하는 것을 막기 위한 준비입니다.",
    why:"금식 시간은 안내에 따라 지켜야 안전하게 진정 치료를 진행할 수 있습니다." },
  { slug:"sedation-monitoring", cat:2, term:"모니터링(산소포화도·혈압)", search:["수면치료 안전한가요"], page:"sedation.html", related:["진정 깊이 단계","마취과 협진"], col:false,
    def:"모니터링은 진정 치료 중 산소포화도·혈압·맥박 등을 감시 장비로 지속 확인하는 것을 말합니다. 진정 상태와 활력 징후의 변화를 살피며 진행합니다.",
    why:"진정 중 몸 상태를 실시간으로 확인해 변화에 대응할 수 있도록 하는 과정입니다." },
  { slug:"anesthesiology-collaboration", cat:2, term:"마취과 협진", search:["치과에 마취과 의사 있나요"], page:"sedation.html", related:["의식하진정법","정맥 진정(IV sedation)"], col:false,
    def:"마취과 협진은 진정·마취를 담당하는 마취 전문 의료진과 함께 치료를 진행하는 것을 말합니다. 진정 관리와 활력 징후 확인을 전문적으로 맡습니다.",
    why:"진정 깊이 조절과 응급 상황 대비 측면에서 협진이 이루어지기도 합니다." },
  { slug:"sedation-recovery", cat:2, term:"회복 시간·보호자 동반", search:["수면치료 후 운전 되나요"], page:"sedation.html", related:["진정 전 금식","정맥 진정(IV sedation)"], col:false,
    def:"진정 치료 후에는 약물 기운이 남아 있어 일정 시간 회복이 필요하고, 이 때문에 보호자 동반이 권장됩니다. 당일에는 운전 등 집중이 필요한 활동을 피하는 것이 좋습니다.",
    why:"진정 후 판단력과 반응이 평소와 다를 수 있어, 안전한 귀가를 위해 회복 시간과 동반이 필요합니다." },
  { slug:"sedation-contraindications", cat:2, term:"진정 치료 금기·주의 대상", search:["수면치료 못 받는 사람"], page:"sedation.html", related:["의식하진정법","모니터링(산소포화도·혈압)"], col:false,
    def:"진정 치료 금기·주의 대상은 특정 전신질환이나 약물 복용, 임신 등으로 진정을 신중히 판단해야 하는 경우를 말합니다. 상태에 따라 진정 방법을 조정하거나 다른 방법을 검토합니다.",
    why:"진정 전 건강 상태와 복용 약물을 확인하는 것이 안전한 진행의 출발점입니다." },
  { slug:"dental-phobia", cat:2, term:"치과공포증(덴탈 포비아)", search:["치과 무서워서 못 감"], page:"sedation.html", related:["의식하진정법","수면임플란트"], col:false,
    def:"치과공포증은 치과 치료에 대한 두려움이 심해 진료를 미루거나 피하게 되는 상태를 말합니다. 과거 통증 경험이나 소리·기구에 대한 불안 등이 원인이 될 수 있습니다.",
    why:"두려움 때문에 치료를 미루면 상태가 악화될 수 있어, 의식하진정법 같은 방법으로 부담을 줄이는 것을 고려할 수 있습니다." },
];

// 표제어(괄호 앞 기준) → slug 매핑 + 별칭 매칭
const baseName = (t) => t.replace(/\(.*?\)/g, "").trim();
const nameToSlug = {};
for (const t of T) nameToSlug[baseName(t.term)] = t.slug;
function resolveRelated(name) {
  const n = name.replace(/\(.*?\)/g, "").trim();
  if (nameToSlug[n]) return nameToSlug[n];
  for (const t of T) { const b = baseName(t.term); if (b === n || b.includes(n) || n.includes(b)) return t.slug; }
  return null;
}

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

fs.mkdirSync(OUT, { recursive: true });
let made = 0;

for (const t of T) {
  const title = `${baseName(t.term)} | 치과 백과사전 | 바로드림치과 안산점`;
  const desc = t.def.split(/(?<=\.)\s/)[0].slice(0, 150);
  const canonical = `https://barodreamdental.kr/dictionary/${t.slug}.html`;
  const relLinks = t.related.map((r) => {
    const s = resolveRelated(r);
    const nm = r.replace(/\(.*?\)/g, "").trim();
    return s ? `<li><a href="${s}.html">${esc(nm)}</a></li>` : `<li><a style="opacity:.5; pointer-events:none;">${esc(nm)}</a></li>`;
  });
  if (t.col) relLinks.push(`<li><a href="../column-01.html">칼럼 · 크라운·브리지 재건 이야기</a></li>`);
  const realPage = PAGE[t.page] || "index.html";
  const pageLabel = PAGE_LABEL[realPage] || "진료 안내";
  const ld = {
    "@context": "https://schema.org", "@type": "DefinedTerm", name: baseName(t.term),
    description: t.def, inDefinedTermSet: "https://barodreamdental.kr/dictionary/",
    url: canonical,
  };
  const html = head(title, desc, canonical) + `
<main class="wrap">
  <p class="crumb"><a href="index.html">치과 백과사전</a> › ${esc(CATS[t.cat])} › ${esc(baseName(t.term))}</p>
  <h1 class="term">${esc(baseName(t.term))}</h1>
  <p class="lead">${esc(t.def)}</p>
  <div class="body">
    <h2 class="dh">왜 알아두면 좋은가</h2>
    <p>${esc(t.why)}</p>
    ${t.misc ? `<h2 class="dh">자주 하는 오해</h2>\n    <p>${esc(t.misc)}</p>` : ""}
  </div>
  <h2 class="dh">관련 용어</h2>
  <ul class="rel">
    ${relLinks.join("\n    ")}
  </ul>
  <h2 class="dh">관련 진료 안내</h2>
  <a class="cta-link" href="../${realPage}">${esc(pageLabel)} 보기 →</a>
  <p class="disc">${esc(DISCLAIMER)}</p>
</main>
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>` + footer;
  fs.writeFileSync(path.join(OUT, `${t.slug}.html`), html, "utf-8");
  made++;
}

// 색인 페이지
const setLd = {
  "@context": "https://schema.org", "@type": "DefinedTermSet",
  name: "치과 백과사전 · 바로드림치과 안산점",
  url: "https://barodreamdental.kr/dictionary/",
  hasDefinedTerm: T.map((t) => ({ "@type": "DefinedTerm", name: baseName(t.term), url: `https://barodreamdental.kr/dictionary/${t.slug}.html` })),
};
let idxBody = "";
CATS.forEach((c, ci) => {
  const items = T.filter((t) => t.cat === ci);
  idxBody += `\n  <h2 class="dh" style="margin-top:52px;">${esc(c)}</h2>\n`;
  for (const t of items) {
    const first = t.def.split(/(?<=\.)\s/)[0];
    idxBody += `  <a class="idx-term" href="${t.slug}.html"><h3>${esc(baseName(t.term))}</h3><p>${esc(first)}</p></a>\n`;
  }
});
const idxTitle = "치과 백과사전 | 임플란트·올온엑스·수면임플란트 용어 | 바로드림치과 안산점";
const idxHtml = head(idxTitle, "임플란트·올온엑스·수면임플란트/의식하진정 관련 치과 용어를 환자가 이해하기 쉽게 정리한 치과 백과사전입니다.", "https://barodreamdental.kr/dictionary/") + `
<main class="wrap">
  <p class="crumb"><a href="../index.html">홈</a> › 치과 백과사전</p>
  <h1 class="term">치과 백과사전</h1>
  <p class="lead">임플란트·올온엑스·수면임플란트(의식하진정) 관련 용어를 환자가 이해하기 쉬운 말로 정리했습니다. 궁금한 용어를 눌러 자세히 보세요.</p>
  ${idxBody}
  <p class="disc">${esc(DISCLAIMER)}</p>
</main>
<script type="application/ld+json">
${JSON.stringify(setLd, null, 2)}
</script>` + footer;
fs.writeFileSync(path.join(OUT, "index.html"), idxHtml, "utf-8");

console.log(`생성 완료: 용어 ${made}개 + 색인 1개 = ${made + 1}개 (dictionary/)`);
