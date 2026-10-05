// 실행 위치: visitor 저장소 루트. 기존 HTML URL와 sitemap의 다른 항목은 보존.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderColumn, columnPath, esc, ORIGIN, absoluteImage } from './columns/column-render.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
export function publishColumns(rows, root = process.cwd()) {
  const published = rows.filter(row => row.status === '공개' && !row.deleted_at);
  const shell = fs.readFileSync(path.join(here, 'columns/column-shell.html'), 'utf8');
  const css = fs.readFileSync(path.join(here, 'columns/column.css'), 'utf8');
  for (const row of published) {
    if (!/^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/.test(row.slug)) throw new Error('Unsafe column slug');
  }
  const manifestPath = path.join(root, 'scripts/columns/manifest.json');
  const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : ['column-01.html'];
  if (!Array.isArray(previous) || previous.some(file => !/^column-[a-z0-9가-힣-]+\.html$/.test(file))) throw new Error('Unsafe manifest; no files changed');
  const current = published.map(row => columnPath(row.slug));
  const indexPath = path.join(root, 'column.html');
  let index = fs.readFileSync(indexPath, 'utf8');
  const cards = published.map(row => `<a href="${esc(columnPath(row.slug))}" data-card style="display:block;text-decoration:none;border:1px solid var(--line);border-radius:6px;overflow:hidden">${row.thumbnail_url ? `<img src="${esc(absoluteImage(row.thumbnail_url))}" alt="${esc(row.thumbnail_alt || row.title)}" style="width:100%;height:220px;object-fit:cover">` : ''}<div style="padding:28px"><p style="font-size:12px;color:var(--accent)">${esc(row.category)}</p><h2 style="font-size:22px;line-height:1.5;color:#1a1a1a">${esc(row.title)}</h2><p style="color:#4a4a4a;line-height:1.8">${esc(row.summary)}</p><p style="color:#888;font-size:13px">${esc((row.published_at || '').slice(0,10))}</p></div></a>`).join('\n') || '<p>발행된 칼럼이 없습니다.</p>';
  if (!index.includes('<!-- COLUMNS:START -->')) {
    const start = index.indexOf('<div class="bd-cards2"');
    const close = index.indexOf('</section>', start);
    if (start < 0 || close < 0) throw new Error('Column list boundary not found; no files changed');
    index = index.slice(0, start) + '<div class="bd-cards2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:32px"><!-- COLUMNS:START --><!-- COLUMNS:END --></div></div>\n' + index.slice(close);
  }
  index = index.replace(/<!-- COLUMNS:START -->[\s\S]*?<!-- COLUMNS:END -->/, () => `<!-- COLUMNS:START -->\n${cards}\n<!-- COLUMNS:END -->`);
  const sitemapPath = path.join(root, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const owned = new Set([...previous, ...current]);
  sitemap = sitemap.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g, entry => {
    const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
    return [...owned].some(file => loc === `${ORIGIN}/${file}` || loc === `${ORIGIN}/${encodeURI(file)}`) ? '' : entry;
  });
  const urls = published.map(row => `<url><loc>${esc(`${ORIGIN}/${encodeURI(columnPath(row.slug))}`)}</loc><lastmod>${esc((row.updated_at || row.published_at).slice(0,10))}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n');
  sitemap = sitemap.replace('</urlset>', () => `${urls}\n</urlset>`);
  for (const row of published) fs.writeFileSync(path.join(root, columnPath(row.slug)), renderColumn(row, shell, css));
  // 생성기가 관리한 칼럼 파일만 제거. draft로 전환하면 공개 파일도 없어져야 한다.
  for (const file of previous) {
    if (!current.includes(file) && fs.existsSync(path.join(root, file))) fs.unlinkSync(path.join(root, file));
  }
  fs.writeFileSync(indexPath, index);
  fs.writeFileSync(sitemapPath, sitemap);
  fs.writeFileSync(manifestPath, JSON.stringify(current, null, 2) + '\n');
  return current;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase environment missing');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/columns?select=*&status=eq.${encodeURIComponent('공개')}&deleted_at=is.null&order=published_at.desc`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!response.ok) throw new Error(`Column query failed (${response.status}); public files preserved`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid column response');
  console.log('Published columns:', publishColumns(rows).length);
}
