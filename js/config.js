/* ============================================================
 * config.js — 바로드림치과 안산점 방문자 사이트 설정값
 * 배포 전 아래 값만 교체하세요. (anon key·cloud name은 공개해도 됩니다)
 * service_role key는 여기에 절대 넣지 마세요 — 서버(Vercel)에만 보관.
 *
 * 로드 순서(각 HTML): config.js  →  barodream-api.js
 * ============================================================ */
window.BARODREAM_CONFIG = {
  // 입력 완료 (publishable key는 공개 가능한 클라이언트 키 — RLS로 보호됨)
  SUPABASE_URL: 'https://rnvokvqnlvzzdlddfroc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_YJUUs80flt3OFGHB5TBdqg_TPYmJWU3',
  CLOUDINARY_CLOUD_NAME: 'rjoebmnd',
  // Web3Forms 상담 접수 이메일 발송용 공개 키(access_key). web3forms.com 대시보드 값.
  // 이 키는 클라이언트에 노출돼도 되는 공개 접수 키입니다(비밀키 아님).
  WEB3FORMS_KEY: '여기에_Web3Forms_access_key_입력'
};
