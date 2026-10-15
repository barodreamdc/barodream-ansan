// Shared by the final server sanitizer and HTML source preflight.
export const COLUMN_HTML_POLICY = {
  allowedTags: ['h2','h3','p','br','strong','b','em','i','u','s','ul','ol','li','blockquote','a','img','hr','figure','figcaption','table','thead','tbody','tfoot','tr','th','td'],
  allowedAttributes: { a: ['href','target','rel'], img: ['src','alt','title','data-caption'], ol: ['start'], th: ['colspan','rowspan'], td: ['colspan','rowspan'] },
  allowedSchemes: ['http','https','mailto','tel'], allowedSchemesByTag: { img: ['http','https'] }, allowProtocolRelative: false,
};
