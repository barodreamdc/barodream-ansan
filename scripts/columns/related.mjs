// 칼럼 하단 "함께 보면 좋은 안내" — 진료 페이지 + 관련 칼럼 내부 링크.
// 새 칼럼도 같은 규칙으로 자동 생성된다(publish-columns → renderColumn).
export const cleanTitle = value => String(value ?? '').split(/\s*title_\d+\s*[:：]/i)[0].trim();

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = value => String(value ?? '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// 주제 → 진료 페이지. 순서가 곧 우선순위(구체적인 주제가 앞).
const TOPICS = [
  { id: 'senior', re: /시니어|고령|노인|70대|80대|혈압|당뇨|항혈전/, links: [['implant-senior.html', '안산 시니어 임플란트 안내']] },
  { id: 'allonx', re: /풀아치|전체 임플란트|올온엑스|All-on/i, links: [['implant-all-on-x.html', '풀아치 임플란트 안내']] },
  { id: 'immediate', re: /당일|즉시|발치하고 바로|발치 후 바로|뽑는 날/, links: [['implant-immediate.html', '즉시로딩 임플란트 안내']] },
  { id: 'navi', re: /네비게이션|가이드 수술/, links: [['implant-navigation.html', '네비게이션 임플란트 안내']] },
  { id: 'sedation', re: /의식하진정|공포|무서/, links: [['sedation.html', '의식하진정법 안내']] },
  { id: 'perio', re: /잇몸|치주|치은|치조골|스케일링/, links: [['perio.html', '잇몸치료 안내']] },
  { id: 'endo', re: /신경치료|근관|재신경/, links: [['general-rootcanal.html', '신경치료 안내']] },
  { id: 'crown', re: /깨졌|크라운|씌우|브리지/, links: [['general-crown.html', '크라운 안내']] },
  { id: 'caries', re: /충치|레진|인레이/, links: [['general-cavity.html', '충치치료 안내'], ['general-inlay.html', '인레이·온레이 안내']] },
  { id: 'clear', re: /투명교정/, links: [['ortho-clear.html', '투명교정 안내']] },
  { id: 'ortho', re: /교정|부정교합|브라켓/, links: [['ortho.html', '치아교정 안내']] },
  { id: 'tmj', re: /턱관절|스플린트/, links: [['tmj.html', '턱관절 치료 안내']] },
  { id: 'laminate', re: /라미네이트|변색|벌어진 치아|벌어짐/, links: [['laminate.html', '라미네이트 안내'], ['resin-front.html', '앞니 레진 안내']] },
  { id: 'wisdom', re: /사랑니/, links: [['general-wisdom.html', '사랑니 발치 안내']] },
  { id: 'implant', re: /임플란트/, links: [['implant-navigation.html', '네비게이션 임플란트 안내']] },
];
const FALLBACK = [['cases.html', '치료 사례 보기'], ['doctors.html', '의료진 소개']];

const textOf = item => `${cleanTitle(item.title)} ${item.summary || ''} ${item.category || ''}`;
const topicsOf = item => new Set(TOPICS.filter(t => t.re.test(textOf(item))).map(t => t.id));

export function relatedItems(item, all = [], minScore = 1) {
  const mine = topicsOf(item);
  const links = [];
  for (const t of TOPICS) {
    if (!mine.has(t.id)) continue;
    for (const l of t.links) if (!links.some(x => x[0] === l[0])) links.push(l);
  }
  const treat = (links.length ? links : FALLBACK).slice(0, 3);
  const others = all.filter(o => o.slug && o.slug !== item.slug);
  const scored = others.map(o => {
    const t = topicsOf(o);
    let score = 0;
    mine.forEach(id => {
      if (!t.has(id)) return;
      const topic = TOPICS.find(x => x.id === id);
      score += id === 'implant' ? 1 : 3;
      if (topic.re.test(cleanTitle(o.title))) score += 2; // 제목에 직접 나오면 더 관련 깊음
    });
    if (o.category && o.category === item.category && item.category) score += 1;
    return { o, score };
  }).sort((a, b) => b.score - a.score || String(b.o.published_at || '').localeCompare(String(a.o.published_at || '')));
  return { treat, columns: scored.filter(s => s.score >= minScore).slice(0, 3).map(s => s.o) };
}

export function relatedBlock(item, all, hrefOf) {
  const { treat, columns } = relatedItems(item, all);
  const li = (href, label) => `<li><a href="${esc(href)}" style="color:#6B4423;text-decoration:underline;text-underline-offset:3px">${esc(label)}</a></li>`;
  const treatHtml = treat.map(([href, label]) => li(href, label)).join('');
  const colHtml = columns.map(c => li(hrefOf(c.slug), cleanTitle(unesc(c.title)))).join('');
  return `<!-- RELATED:START --><aside aria-label="관련 안내" style="max-width:720px;margin:56px auto 0;padding:28px;border:1px solid rgba(26,26,26,.12);border-radius:6px"><h2 style="font-size:18px;margin:0 0 12px;line-height:1.5">함께 보면 좋은 안내</h2><ul style="margin:0 0 20px;padding-left:20px;line-height:2">${treatHtml}</ul>${columns.length ? `<h3 style="font-size:15px;margin:0 0 8px;color:#4a4a4a">관련 칼럼</h3><ul style="margin:0 0 20px;padding-left:20px;line-height:2">${colHtml}</ul>` : ''}<p style="margin:0;font-size:14px"><a href="column.html" style="color:#4a4a4a">칼럼 전체 보기</a> · <a href="index.html" style="color:#4a4a4a">바로드림치과 안산점 홈</a></p></aside><!-- RELATED:END -->`;
}

// 진료 페이지 하단용 "관련 칼럼" 블록(정적 페이지에 삽입).
export function treatmentColumnsBlock(pseudo, all, hrefOf) {
  const { columns } = relatedItems(pseudo, all, 3);
  if (!columns.length) return '';
  const li = c => `<li><a href="${esc(hrefOf(c.slug))}" style="color:#6B4423;text-decoration:underline;text-underline-offset:3px">${esc(cleanTitle(unesc(c.title)))}</a></li>`;
  return `<!-- RELATED-COLUMNS:START --><section aria-label="관련 칼럼" style="padding:56px 24px"><div style="max-width:960px;margin:0 auto"><h2 style="font-family:'Noto Serif KR',serif;font-weight:500;font-size:22px;margin:0 0 14px">관련 칼럼</h2><ul style="margin:0 0 14px;padding-left:20px;line-height:2">${columns.map(li).join('')}</ul><p style="margin:0;font-size:14px"><a href="column.html" style="color:#4a4a4a">칼럼 전체 보기</a></p></div></section><!-- RELATED-COLUMNS:END -->\n`;
}
