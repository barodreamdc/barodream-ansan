import sanitizeHtml from 'sanitize-html';
export const ORIGIN = 'https://barodreamdental.kr';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const columnPath = slug => slug === 'crown-bridge-caries-front-implant' ? 'column-01.html' : `column-${slug}.html`;
export function cleanBody(html) {
  return sanitizeHtml(html || '', {
    allowedTags: ['h2','h3','p','br','strong','b','em','i','u','s','ul','ol','li','blockquote','a','img','hr','figure','figcaption'],
    allowedAttributes: { a: ['href','target','rel'], img: ['src','alt','title','data-caption'], ol: ['start'] },
    allowedSchemes: ['http','https','mailto','tel'], allowedSchemesByTag: { img: ['http','https'] }, allowProtocolRelative: false,
    transformTags: { a: (tag, attrs) => ({ tagName: tag, attribs: { ...attrs, rel: 'noopener noreferrer' } }) },
  });
}
export function absoluteImage(src) {
  if (!src) return '';
  try { const url = new URL(src, ORIGIN + '/'); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function renderColumn(row, shell, css, preview = false) {
  if (preview) shell = shell.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace('</head>', '<style>[data-reveal]{opacity:1!important;transform:none!important}</style></head>');
  const canonical = `${ORIGIN}/${columnPath(row.slug || '')}`;
  const title = row.seo_title || `${row.title || '칼럼'} · 칼럼 · 바로드림치과 안산점`;
  const description = row.meta_description || row.summary || row.title || '';
  const image = absoluteImage(row.thumbnail_url);
  const json = { '@context': 'https://schema.org', '@type': 'Article', headline: row.title || '', description, ...(image ? { image: [image] } : {}), datePublished: row.published_at, dateModified: row.updated_at || row.published_at, author: { '@type': 'Organization', name: '바로드림치과 안산점', url: ORIGIN }, publisher: { '@type': 'Organization', name: '바로드림치과 안산점', url: ORIGIN }, mainEntityOfPage: { '@type': 'WebPage', '@id': canonical } };
  const seo = `<base href="${ORIGIN}/"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="${preview ? 'noindex,nofollow' : 'index,follow'}"><meta property="og:type" content="article"><meta property="og:site_name" content="바로드림치과 안산점"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}<script type="application/ld+json">${JSON.stringify(json).replace(/</g,'\\u003c')}</script><style>${css}</style>`;
  // 기존 상대 경로 이미지도 admin preview에서 동일하게 표시한다.
  const body = cleanBody(row.body_html).replace(/<img\b([^>]*?)>/g, (tag, attrs) => {
    const caption = attrs.match(/data-caption="([^"]*)"/)?.[1];
    return caption ? `<figure>${tag}<figcaption>${caption}</figcaption></figure>` : tag;
  });
  const content = `<section style="background:#1a1a1a;color:white;padding:72px 24px;text-align:center"><p>${esc(row.category)} · ${esc((row.published_at || '').slice(0,10))}</p><h1 style="font-family:'Noto Serif KR',serif;font-size:clamp(26px,4vw,40px);line-height:1.4;max-width:900px;margin:20px auto;overflow-wrap:anywhere">${esc(row.title)}</h1><p style="max-width:720px;margin:20px auto;line-height:1.8">${esc(row.summary)}</p></section><article style="padding:56px 24px 100px"><div class="column-prose" style="max-width:720px;margin:auto">${image ? `<figure><img src="${esc(image)}" alt="${esc(row.thumbnail_alt || row.title)}">${row.thumbnail_caption ? `<figcaption>${esc(row.thumbnail_caption)}</figcaption>` : ''}</figure>` : ''}${body}</div></article>`;
  return shell.replace('{{COLUMN_SEO}}', () => seo).replace('{{COLUMN_CONTENT}}', () => content);
}
