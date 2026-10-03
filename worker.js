const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const FREE_LIMIT = 10;
const PRO_LIMIT = 500;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.allSettled([cleanup(env), reconcileBillingState(env)]));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx, url);
    }
    if (url.pathname === '/health') return json({ ok: true, service: 'DOXFRAME' }, 200, {'cache-control':'no-store'});
    // Static assets are served directly by Workers Static Assets before this Worker runs.
    // Do not call env.ASSETS here: the Worker does not need an Assets runtime binding.
    return withSecurityHeaders(new Response('Not found', { status: 404 }));
  }
};

class BodyTooLargeError extends Error { constructor(){ super('Request body too large'); this.status=413; } }

async function handleApi(request, env, ctx, url) {
  const method = request.method.toUpperCase();
  try {
    if (url.pathname === '/api/public-config' && method === 'GET') {
      return json({
        turnstileSiteKey: env.TURNSTILE_SITE_KEY || '',
        paymentProvider: env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && (env.RAZORPAY_PRO_MONTHLY_PLAN_ID || env.RAZORPAY_PRO_ANNUAL_PLAN_ID) ? 'razorpay' : 'unconfigured',
        authBotProtection: !!(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET),
        maxFileBytes: MAX_FILE_BYTES
      });
    }
    if (url.pathname === '/api/health' && method === 'GET') {
      return json({ ok: !!env.DB }, env.DB ? 200 : 503, {'cache-control':'no-store'});
    }
    if (url.pathname === '/api/auth/register' && method === 'POST') return register(request, env);
    if (url.pathname === '/api/auth/verify-email' && method === 'POST') return verifyEmail(request, env);
    if (url.pathname === '/api/auth/resend-verification' && method === 'POST') return resendVerification(request, env);
    if (url.pathname === '/api/auth/request-password-reset' && method === 'POST') return requestPasswordReset(request, env);
    if (url.pathname === '/api/auth/reset-password' && method === 'POST') return resetPassword(request, env);
    if (url.pathname === '/api/auth/login' && method === 'POST') return login(request, env);
    if (url.pathname === '/api/auth/mfa/setup' && method === 'POST') return mfaSetup(request, env);
    if (url.pathname === '/api/auth/mfa/enable' && method === 'POST') return mfaEnable(request, env);
    if (url.pathname === '/api/auth/mfa/disable' && method === 'POST') return mfaDisable(request, env);
    if (url.pathname === '/api/auth/mfa/verify' && method === 'POST') return mfaVerify(request, env);
    if (url.pathname === '/api/auth/logout' && method === 'POST') return logout(request, env);
    if (url.pathname === '/api/auth/me' && method === 'GET') return me(request, env);
    if (url.pathname === '/api/account/delete' && method === 'POST') return deleteAccount(request, env);
    if (url.pathname === '/api/usage' && method === 'GET') return usage(request, env);
    if (url.pathname === '/api/jobs/reserve' && method === 'POST') return reserveJob(request, env);
    if (url.pathname === '/api/jobs/complete' && method === 'POST') return completeJob(request, env);
    if (url.pathname === '/api/history' && method === 'GET') return history(request, env);
    if (url.pathname === '/api/feedback' && method === 'POST') return feedback(request, env);
    if (url.pathname === '/api/billing/checkout' && method === 'POST') return billingCheckout(request, env);
    if (url.pathname === '/api/billing/cancel' && method === 'POST') return billingCancel(request, env);
    if (url.pathname === '/api/billing/webhook' && method === 'POST') return billingWebhook(request, env);
    return json({ error: 'Not found' }, 404);
  } catch (err) {
    if (err?.status===413) return json({error:'Request is too large.'},413);
    console.error(err);
    return json({ error: 'Server error. Please try again.' }, 500);
  }
}

function securityHeaders(){
  return {
    'X-Content-Type-Options':'nosniff',
    'X-DNS-Prefetch-Control':'off',
    'Origin-Agent-Cluster':'?1',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'X-Frame-Options':'DENY',
    'Cross-Origin-Opener-Policy':'same-origin',
    'Cross-Origin-Resource-Policy':'same-origin',
    'Strict-Transport-Security':'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy':"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://cdn.sheetjs.com https://cdnjs.cloudflare.com https://challenges.cloudflare.com; script-src-attr 'none'; connect-src 'self' https://challenges.cloudflare.com https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net; worker-src 'self' blob:; frame-src https://challenges.cloudflare.com; upgrade-insecure-requests"
  };
}
function withSecurityHeaders(response){
  const headers=new Headers(response.headers);
  for(const name of ['server','x-powered-by','x-aspnet-version','x-generator']) headers.delete(name);
  for(const [k,v] of Object.entries(securityHeaders())) headers.set(k,v);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...securityHeaders(), ...extra } });
}
function htmlSafe(v) { return typeof v === 'string' ? v.trim() : ''; }
function escapeHtml(v) { return htmlSafe(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;'); }
function normalizeEmail(v) { return htmlSafe(v).toLowerCase(); }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validName(v) { return v.length >= 1 && v.length <= 80; }
function cookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}
function cookieHeader(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
function clearCookie(name) { return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`; }
function originAllowed(request) {
  const origin = request.headers.get('Origin');
  if (!origin) {
    const fetchSite=(request.headers.get('Sec-Fetch-Site')||'').toLowerCase();
    // Browsers send Origin on our state-changing fetch/XHR requests. Refuse
    // ambiguous unsafe requests instead of treating same-site as trusted;
    // webhook verification remains separate and does not call this helper.
    if (['POST','PUT','PATCH','DELETE'].includes(String(request.method||'').toUpperCase())) return fetchSite === 'same-origin';
    return fetchSite !== 'cross-site';
  }
  try {
    const o = new URL(origin), r = new URL(request.url);
    return o.origin === r.origin;
  } catch { return false; }
}
function ip(request) { return request.headers.get('CF-Connecting-IP') || '0.0.0.0'; }
async function digestHex(value) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function sessionHash(token, env) {
  const pepper=env.AUTH_PEPPER;
  if(!pepper) throw new Error('AUTH_PEPPER is not configured');
  return digestHex(`session:${token}:${pepper}`);
}
async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const b = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function timingSafeEqualHex(a,b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i=0;i<a.length;i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function randomId(bytes=32) {
  const b = new Uint8Array(bytes); crypto.getRandomValues(b);
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function b64url(bytes) {
  let s=''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
const PASSWORD_KDF_ITERATIONS=210000;
const LEGACY_PASSWORD_KDF_ITERATIONS=120000;
async function hashPassword(password, saltHex, iterations=PASSWORD_KDF_ITERATIONS) {
  const salt = saltHex ? hexBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations,hash:'SHA-256'}, key, 256);
  return { salt: saltHex || [...salt].map(x=>x.toString(16).padStart(2,'0')).join(''), hash: [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join(''), iterations };
}
async function verifyPasswordRecord(password,row){
  const salt=row?.password_salt||DUMMY_PASSWORD_SALT;
  const expected=row?.password_hash||DUMMY_PASSWORD_HASH;
  const strong=await hashPassword(password,salt,PASSWORD_KDF_ITERATIONS);
  if(timingSafeEqualHex(strong.hash,expected)) return {ok:true,needsRehash:false,hash:strong.hash,salt:strong.salt};
  const legacy=await hashPassword(password,salt,LEGACY_PASSWORD_KDF_ITERATIONS);
  if(timingSafeEqualHex(legacy.hash,expected)) return {ok:true,needsRehash:!!row,hash:strong.hash,salt:strong.salt};
  return {ok:false,needsRehash:false,hash:strong.hash,salt:strong.salt};
}
function hexBytes(hex) { const a=new Uint8Array(hex.length/2); for(let i=0;i<a.length;i++) a[i]=parseInt(hex.slice(i*2,i*2+2),16); return a; }
async function ensureDb(env) { if (!env.DB) throw new Error('D1 database binding is not configured'); }
async function subjectHash(request, env, userId='') {
  const pepper = env.AUTH_PEPPER;
  if (!pepper) throw new Error('AUTH_PEPPER is not configured');
  return digestHex(`${userId ? 'u:'+userId : 'ip:'+ip(request)}:${pepper}`);
}
async function getUser(request, env) {
  await ensureDb(env);
  const token = cookie(request, '__Host-i24_session');
  if (!token) return null;
  const hash = await sessionHash(token, env);
  const row = await env.DB.prepare(`SELECT u.id,u.name,u.email,u.plan,u.subscription_id,u.subscription_status,u.cancel_at_cycle_end,u.email_verified_at,u.created_at,COALESCE((SELECT enabled FROM mfa_credentials m WHERE m.user_id=u.id),0) AS mfa_enabled FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(hash, Date.now()).first();
  return row || null;
}
async function rateLimit(request, env, bucket, max, windowMs) {
  return rateLimitKey(env, `${bucket}:ip:${ip(request)}`, bucket, max, windowMs);
}
async function rateLimitKey(env, rawKey, bucket, max, windowMs) {
  await ensureDb(env);
  const pepper = env.AUTH_PEPPER;
  if (!pepper) throw new Error('AUTH_PEPPER is not configured');
  const key = await digestHex(`${rawKey}:${pepper}`);
  const now = Date.now();
  const start = Math.floor(now/windowMs)*windowMs;
  await env.DB.prepare(`INSERT OR IGNORE INTO rate_limits (key,bucket,window_start,count) VALUES (?,?,?,0)`).bind(key,bucket,start).run();
  const result = await env.DB.prepare(`UPDATE rate_limits SET count=count+1 WHERE key=? AND window_start=? AND count<?`).bind(key,start,max).run();
  return !!result.meta?.changes;
}
async function verifyTurnstile(request, env, token, action) {
  if (!env.TURNSTILE_SECRET) return false;
  token=String(token||'').trim();
  if (!token || token.length>4096) return false;
  const form=new FormData();
  form.append('secret',env.TURNSTILE_SECRET);
  form.append('response',token);
  const vr=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
  if (!vr.ok) return false;
  const v=await vr.json().catch(()=>({}));
  if (!v.success) return false;
  const expectedHost=String(env.TURNSTILE_HOSTNAME||new URL(request.url).hostname).toLowerCase();
  if (!v.hostname || String(v.hostname).toLowerCase()!==expectedHost) return false;
  if (!v.action || String(v.action)!==String(action)) return false;
  return true;
}

const JSON_BODY_LIMITS=new WeakMap();
function requestJsonAllowed(request, maxBytes=64*1024) {
  const ct=(request.headers.get('Content-Type')||'').toLowerCase();
  const len=Number(request.headers.get('Content-Length')||0);
  if(!ct.startsWith('application/json')) return json({error:'Content-Type must be application/json.'},415);
  if(len && len>maxBytes) return json({error:'Request is too large.'},413);
  JSON_BODY_LIMITS.set(request,maxBytes);
  return null;
}
async function readJsonLimited(request) {
  const maxBytes=JSON_BODY_LIMITS.get(request)||64*1024;
  if(!request.body) return {};
  const reader=request.body.getReader();
  const chunks=[]; let total=0;
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      total+=value.byteLength;
      if(total>maxBytes){await reader.cancel();throw new BodyTooLargeError();}
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes=new Uint8Array(total); let off=0;
  for(const chunk of chunks){bytes.set(chunk,off);off+=chunk.byteLength;}
  const text=new TextDecoder().decode(bytes);
  try{return JSON.parse(text);}catch{return {};}
}
async function readTextLimited(request,maxBytes) {
  if(!request.body) return '';
  const reader=request.body.getReader(); let total=0; const chunks=[];
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      total+=value.byteLength;
      if(total>maxBytes){await reader.cancel();throw new BodyTooLargeError();}
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes=new Uint8Array(total); let off=0;
  for(const chunk of chunks){bytes.set(chunk,off);off+=chunk.byteLength;}
  return new TextDecoder().decode(bytes);
}
async function register(request, env) {
  const contentError=await requestJsonAllowed(request, 8*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  if (!(await rateLimit(request, env, 'register', 5, 60*60*1000))) return json({error:'Too many registration attempts. Try again later.'},429);
  const body = await readJsonLimited(request);
  const name=htmlSafe(body.name), email=normalizeEmail(body.email), password=String(body.password||''), turnstileToken=String(body.turnstileToken||'');
  if (!validName(name) || !validEmail(email) || password.length < 8 || password.length > 128) return json({error:'Enter a valid name, email and password (8–128 characters).'},400);
  if (!(await rateLimitKey(env, `register:email:${email}`, 'register-email', 3, 60*60*1000))) return json({error:'Too many registration attempts. Try again later.'},429);
  if (!env.TURNSTILE_SECRET || !(await verifyTurnstile(request, env, turnstileToken, 'auth'))) return json({error:'Human verification failed. Please complete the verification and try again.'},400);
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return json({error:'Email verification is not configured yet. Please contact support.'},503);
  const exists=await env.DB.prepare(`SELECT id,email_verified_at FROM users WHERE email=?`).bind(email).first();
  if (exists) return json({error: exists.email_verified_at ? 'An account with this email already exists.' : 'An account already exists but is not verified. Check your email or request a new verification link.'},409);
  const id=randomId(16), ph=await hashPassword(password), now=Date.now();
  try {
    await env.DB.prepare(`INSERT INTO users (id,name,email,password_hash,password_salt,plan,created_at) VALUES (?,?,?,?,?,'free',?)`).bind(id,name,email,ph.hash,ph.salt,now).run();
    await issueVerificationEmail(request, env, id, name, email);
  } catch (e) {
    if (String(e?.message||'').toLowerCase().includes('unique')) return json({error:'This account could not be created. Please try another email.'},409);
    throw e;
  }
  return json({ok:true,requiresVerification:true,message:'Account created. Check your email to verify your address before signing in.'},201);
}
const DUMMY_PASSWORD_SALT='00000000000000000000000000000000';
const DUMMY_PASSWORD_HASH='f26d80177cf02cde5f227fe852280736c22ec7861a7afe2fd7aa5ffa9ddbe51b';


function b32Encode(bytes){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let out='',bits=0,buf=0;for(const b of bytes){buf=(buf<<8)|b;bits+=8;while(bits>=5){bits-=5;out+=alphabet[(buf>>>bits)&31]}}if(bits)out+=alphabet[(buf<<(5-bits))&31];return out}
function b32Decode(str){const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';str=String(str||'').toUpperCase().replace(/=+$/,'');let bits=0,buf=0,out=[];for(const c of str){const v=a.indexOf(c);if(v<0)throw new Error('Invalid base32');buf=(buf<<5)|v;bits+=5;if(bits>=8){bits-=8;out.push((buf>>>bits)&255)}}return new Uint8Array(out)}
async function aesKey(env){const raw=String(env.MFA_ENCRYPTION_KEY||'');if(!raw)throw new Error('MFA_ENCRYPTION_KEY is not configured');let bytes;try{bytes=Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}catch{throw new Error('Invalid MFA_ENCRYPTION_KEY')}if(bytes.length!==32)throw new Error('MFA_ENCRYPTION_KEY must be 32 bytes base64');return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function encryptMfaSecret(secret,env){const iv=crypto.getRandomValues(new Uint8Array(12));const key=await aesKey(env);const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(secret));return `${b64url(iv)}.${b64url(new Uint8Array(ct))}`}
async function decryptMfaSecret(value,env){const [ivS,ctS]=String(value||'').split('.');if(!ivS||!ctS)throw new Error('Invalid MFA ciphertext');const key=await aesKey(env);const iv=Uint8Array.from(atob(ivS.replace(/-/g,'+').replace(/_/g,'/')+'=='),c=>c.charCodeAt(0));const ct=Uint8Array.from(atob(ctS.replace(/-/g,'+').replace(/_/g,'/')+'=='),c=>c.charCodeAt(0));const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);return new TextDecoder().decode(pt)}
async function totp(secret, counter){const key=await crypto.subtle.importKey('raw',b32Decode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);const buf=new ArrayBuffer(8),dv=new DataView(buf);dv.setUint32(0,Math.floor(counter/0x100000000));dv.setUint32(4,counter>>>0);const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,buf));const off=mac[mac.length-1]&15;const code=((mac[off]&127)<<24|(mac[off+1]&255)<<16|(mac[off+2]&255)<<8|(mac[off+3]&255))%1000000;return String(code).padStart(6,'0')}
async function matchTotp(secret,code){code=String(code||'').replace(/\D/g,'');if(!/^\d{6}$/.test(code))return null;const now=Math.floor(Date.now()/30000);for(let d=-1;d<=1;d++){const step=now+d;if(await totp(secret,step)===code)return step}return null}
async function consumeTotp(userId,secret,code,env){const step=await matchTotp(secret,code);if(step===null)return false;const r=await env.DB.prepare(`UPDATE mfa_credentials SET last_totp_step=?,updated_at=? WHERE user_id=? AND (last_totp_step IS NULL OR last_totp_step<?)`).bind(step,Date.now(),userId,step).run();return Number(r.meta?.changes||0)===1}
function makeRecoveryCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const out=[];const limit=256-Math.floor(256/alphabet.length)*alphabet.length;while(out.length<12){const bytes=crypto.getRandomValues(new Uint8Array(24));for(const b of bytes){if(b>=limit){out.push(alphabet[b%alphabet.length]);if(out.length===12)break}}}return out.join('')}
async function recoveryCodeHash(code,env){return digestHex(`recovery:${String(code||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase()}:${env.AUTH_PEPPER}`)}
async function issueMfaRecoveryCodes(userId,env){const codes=[];const stmts=[env.DB.prepare(`DELETE FROM mfa_recovery_codes WHERE user_id=?`).bind(userId)];for(let i=0;i<10;i++){let code=makeRecoveryCode();while(codes.includes(code))code=makeRecoveryCode();codes.push(code);stmts.push(env.DB.prepare(`INSERT INTO mfa_recovery_codes (id,user_id,code_hash,used_at,created_at) VALUES (?,?,?,NULL,?)`).bind(randomId(16),userId,await recoveryCodeHash(code,env),Date.now()));}await env.DB.batch(stmts);return codes}
async function login(request, env) {
  const contentError=await requestJsonAllowed(request,16*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  if (!(await rateLimit(request,env,'login',8,15*60*1000))) return json({error:'Too many sign-in attempts. Try again later.'},429);
  const body=await readJsonLimited(request);
  const email=normalizeEmail(body.email), password=String(body.password||''), turnstileToken=String(body.turnstileToken||'');
  if (!validEmail(email) || password.length<1 || password.length>128) return json({error:'Invalid email or password.'},401);
  if (!(await rateLimitKey(env,`login:email:${email}`,'login-email',8,15*60*1000))) return json({error:'Too many sign-in attempts. Try again later.'},429);
  if (!env.TURNSTILE_SECRET || !(await verifyTurnstile(request,env,turnstileToken,'auth'))) return json({error:'Human verification failed. Please complete the verification and try again.'},400);
  await ensureDb(env);
  const row=await env.DB.prepare(`SELECT id,name,email,password_hash,password_salt,plan,subscription_id,subscription_status,cancel_at_cycle_end,email_verified_at,COALESCE((SELECT enabled FROM mfa_credentials m WHERE m.user_id=users.id),0) AS mfa_enabled FROM users WHERE email=?`).bind(email).first();
  const verified=await verifyPasswordRecord(password,row);
  if (!verified.ok || !row) return json({error:'Invalid email or password.'},401);
  if (!row.email_verified_at) return json({error:'Invalid email or password.'},401);
  if (verified.needsRehash) {
    await env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=? WHERE id=?`).bind(verified.hash,verified.salt,row.id).run();
  }
  if (Number(row.mfa_enabled)===1) {
    const raw=b64url(crypto.getRandomValues(new Uint8Array(32)));
    const challengeHash=await digestHex(`mfa:${raw}:${env.AUTH_PEPPER}`), now=Date.now(), expires=now+5*60*1000;
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM mfa_challenges WHERE user_id=?`).bind(row.id),
      env.DB.prepare(`INSERT INTO mfa_challenges (id,user_id,challenge_hash,expires_at,attempts,created_at) VALUES (?,?,?,?,0,?)`).bind(randomId(16),row.id,challengeHash,expires,now)
    ]);
    return json({ok:true,mfaRequired:true},202,{'Set-Cookie':cookieHeader('__Host-i24_mfa',raw,5*60)});
  }
  const user={id:row.id,name:row.name,email:row.email,plan:row.plan,subscription_id:row.subscription_id,subscription_status:row.subscription_status,cancel_at_cycle_end:row.cancel_at_cycle_end,email_verified_at:row.email_verified_at,mfa_enabled:Number(row.mfa_enabled)===1};
  return createSessionResponse(env,row.id,user);
}

async function mfaSetup(request,env){if(!originAllowed(request))return json({error:'Invalid origin'},403);if(!env.MFA_ENCRYPTION_KEY)return json({error:'MFA is not configured yet.'},503);const user=await getUser(request,env);if(!user)return json({error:'Sign in required.'},401);if(!(await rateLimit(request,env,'mfa-setup',5,60*60*1000)))return json({error:'Too many MFA setup attempts.'},429);const existing=await env.DB.prepare(`SELECT enabled FROM mfa_credentials WHERE user_id=?`).bind(user.id).first();if(existing?.enabled)return json({error:'MFA is already enabled.'},409);const bytes=crypto.getRandomValues(new Uint8Array(20)),secret=b32Encode(bytes),cipher=await encryptMfaSecret(secret,env),now=Date.now();await env.DB.prepare(`INSERT INTO mfa_credentials (user_id,secret_ciphertext,key_version,enabled,created_at,updated_at) VALUES (?,?,1,0,?,?) ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=excluded.secret_ciphertext,key_version=1,enabled=0,last_totp_step=NULL,updated_at=excluded.updated_at`).bind(user.id,cipher,now,now).run();const issuer='DOXFRAME',label=encodeURIComponent(user.email);return json({ok:true,secret,otpauth:`otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`})}
async function mfaEnable(request,env){const contentError=await requestJsonAllowed(request,8*1024);if(contentError)return contentError;if(!originAllowed(request))return json({error:'Invalid origin'},403);if(!(await rateLimit(request,env,'mfa-enable',6,15*60*1000)))return json({error:'Too many MFA enable attempts. Try again later.'},429);const user=await getUser(request,env);if(!user)return json({error:'Sign in required.'},401);const body=await readJsonLimited(request);const code=String(body.code||'');const row=await env.DB.prepare(`SELECT secret_ciphertext,enabled FROM mfa_credentials WHERE user_id=?`).bind(user.id).first();if(!row?.secret_ciphertext)return json({error:'Start MFA setup first.'},400);const secret=await decryptMfaSecret(row.secret_ciphertext,env);if(!(await consumeTotp(user.id,secret,code,env)))return json({error:'Invalid or already-used authenticator code.'},400);await env.DB.prepare(`UPDATE mfa_credentials SET enabled=1,updated_at=? WHERE user_id=?`).bind(Date.now(),user.id).run();const recoveryCodes=await issueMfaRecoveryCodes(user.id,env);return json({ok:true,message:'MFA enabled.',recoveryCodes});}
async function mfaDisable(request,env){const contentError=await requestJsonAllowed(request,8*1024);if(contentError)return contentError;if(!originAllowed(request))return json({error:'Invalid origin'},403);if(!(await rateLimit(request,env,'mfa-disable',6,15*60*1000)))return json({error:'Too many MFA disable attempts. Try again later.'},429);const user=await getUser(request,env);if(!user)return json({error:'Sign in required.'},401);const body=await readJsonLimited(request);const password=String(body.password||''),code=String(body.code||'');if(password.length<8||password.length>128)return json({error:'Password confirmation required.'},400);const row=await env.DB.prepare(`SELECT password_hash,password_salt FROM users WHERE id=?`).bind(user.id).first();const pv=await verifyPasswordRecord(password,row);if(!pv.ok)return json({error:'Password confirmation failed.'},401);const m=await env.DB.prepare(`SELECT secret_ciphertext,enabled FROM mfa_credentials WHERE user_id=?`).bind(user.id).first();if(!m?.enabled)return json({error:'MFA is not enabled.'},400);const secret=await decryptMfaSecret(m.secret_ciphertext,env);if(!(await consumeTotp(user.id,secret,code,env)))return json({error:'Invalid or already-used authenticator code.'},400);await env.DB.batch([env.DB.prepare(`DELETE FROM mfa_credentials WHERE user_id=?`).bind(user.id),env.DB.prepare(`DELETE FROM mfa_recovery_codes WHERE user_id=?`).bind(user.id)]);return json({ok:true,message:'MFA disabled.'})}
async function mfaVerify(request,env){
  const contentError=await requestJsonAllowed(request,8*1024); if(contentError)return contentError;
  if(!originAllowed(request))return json({error:'Invalid origin'},403);
  const challenge=cookie(request,'__Host-i24_mfa');
  if(!challenge)return json({error:'MFA challenge expired.'},401);
  const body=await readJsonLimited(request),code=String(body.code||'').trim();
  if(!(await rateLimit(request,env,'mfa-verify',8,15*60*1000)))return json({error:'Too many MFA attempts.'},429);
  const hash=await digestHex(`mfa:${challenge}:${env.AUTH_PEPPER}`),row=await env.DB.prepare(`SELECT c.id,c.user_id,c.expires_at,c.attempts,u.id,u.name,u.email,u.plan,u.subscription_id,u.subscription_status,u.cancel_at_cycle_end,u.email_verified_at FROM mfa_challenges c JOIN users u ON u.id=c.user_id WHERE c.challenge_hash=?`).bind(hash).first();
  if(!row||row.expires_at<Date.now()||row.attempts>=8)return new Response(JSON.stringify({error:'MFA challenge expired.'}),{status:401,headers:{...JSON_HEADERS,...securityHeaders(),'Set-Cookie':clearCookie('__Host-i24_mfa')}});
  const m=await env.DB.prepare(`SELECT secret_ciphertext,enabled,last_totp_step FROM mfa_credentials WHERE user_id=?`).bind(row.user_id).first();
  if(!m?.enabled)return json({error:'MFA is not enabled.'},400);
  let valid=false,recoveryUsed=false;
  if(/^\d{6}$/.test(code)){
    const secret=await decryptMfaSecret(m.secret_ciphertext,env); valid=await consumeTotp(row.user_id,secret,code,env);
  } else if(/^[A-Za-z0-9 -]{8,32}$/.test(code)){
    const rh=await recoveryCodeHash(code,env);
    const rr=await env.DB.prepare(`SELECT id FROM mfa_recovery_codes WHERE user_id=? AND code_hash=? AND used_at IS NULL`).bind(row.user_id,rh).first();
    if(rr){const consumed=await env.DB.prepare(`UPDATE mfa_recovery_codes SET used_at=? WHERE id=? AND used_at IS NULL`).bind(Date.now(),rr.id).run();valid=!!consumed.meta?.changes;recoveryUsed=valid;}
  }
  if(!valid){
    const upd=await env.DB.prepare(`UPDATE mfa_challenges SET attempts=attempts+1 WHERE id=? AND attempts<8 AND expires_at>?`).bind(row.id,Date.now()).run();
    const extra=(upd.meta?.changes && Number(row.attempts)+1>=8)?{'Set-Cookie':clearCookie('__Host-i24_mfa')}:{};
    return json({error:'Invalid authenticator or recovery code.'},401,extra);
  }
  // Consume the challenge atomically so two concurrent valid submissions cannot create two sessions.
  const consumed=await env.DB.prepare(`DELETE FROM mfa_challenges WHERE id=? AND expires_at>? AND attempts<8`).bind(row.id,Date.now()).run();
  if(!consumed.meta?.changes)return new Response(JSON.stringify({error:'MFA challenge expired.'}),{status:401,headers:{...JSON_HEADERS,...securityHeaders(),'Set-Cookie':clearCookie('__Host-i24_mfa')}});
  const user={id:row.user_id,name:row.name,email:row.email,plan:row.plan,subscription_id:row.subscription_id,subscription_status:row.subscription_status,cancel_at_cycle_end:row.cancel_at_cycle_end,email_verified_at:row.email_verified_at,mfa_enabled:true};
  const resp=await createSessionResponse(env,row.user_id,user);
  const h=new Headers(resp.headers);
  // Preserve the session cookie generated by createSessionResponse and clear the temporary MFA cookie.
  const sessionSet=resp.headers.get('Set-Cookie');
  h.delete('Set-Cookie');
  if(sessionSet) h.append('Set-Cookie',sessionSet);
  h.append('Set-Cookie',clearCookie('__Host-i24_mfa'));
  if(recoveryUsed){const remaining=await env.DB.prepare(`SELECT COUNT(*) AS c FROM mfa_recovery_codes WHERE user_id=? AND used_at IS NULL`).bind(row.user_id).first();h.set('X-MFA-Recovery-Remaining',String(Number(remaining?.c||0)));}
  return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h});
}

async function issueVerificationEmail(request, env, userId, name, email) {
  const raw=b64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash=await digestHex(`verify:${raw}:${env.AUTH_PEPPER}`);
  const now=Date.now(), expires=now+24*60*60*1000;
  await env.DB.prepare(`DELETE FROM email_verification_tokens WHERE user_id=? AND used_at IS NULL`).bind(userId).run();
  await env.DB.prepare(`INSERT INTO email_verification_tokens (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)`).bind(randomId(16),userId,tokenHash,expires,now).run();
  const base=new URL(request.url).origin;
  const verifyUrl=`${base}/verify-email.html?token=${encodeURIComponent(raw)}`;
  const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#182033"><h2>Verify your DOXFRAME email</h2><p>Hello ${escapeHtml(name)},</p><p>Confirm your email address to activate your DOXFRAME account.</p><p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p><p>This link expires in 24 hours and can be used once.</p><p>If you did not create this account, you can ignore this email.</p></div>`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.FROM_EMAIL,to:[email],subject:'Verify your DOXFRAME email',html})});
  if(!r.ok) { await env.DB.prepare(`DELETE FROM email_verification_tokens WHERE user_id=?`).bind(userId).run(); await env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(userId).run(); throw new Error('Verification email could not be sent'); }
}

async function verifyEmail(request, env) {
  const contentError=await requestJsonAllowed(request, 8*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  const body=await readJsonLimited(request); const token=String(body.token||'').trim();
  if(!token || token.length>256) return json({error:'Invalid verification link.'},400);
  const hash=await digestHex(`verify:${token}:${env.AUTH_PEPPER}`), now=Date.now();
  const row=await env.DB.prepare(`SELECT t.id,t.user_id,t.expires_at,u.email_verified_at FROM email_verification_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=? AND t.used_at IS NULL`).bind(hash).first();
  if(!row || row.expires_at<now) return json({error:'This verification link is invalid or expired.'},400);
  const consumed=await env.DB.prepare(`UPDATE email_verification_tokens SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>=?`).bind(now,row.id,now).run();
  if(Number(consumed.meta?.changes||0)!==1) return json({error:'This verification link is invalid or already used.'},400);
  await env.DB.prepare(`UPDATE users SET email_verified_at=? WHERE id=? AND email_verified_at IS NULL`).bind(now,row.user_id).run();
  return json({ok:true,message:'Email verified. You can now sign in.'});
}

async function resendVerification(request, env) {
  const contentError=await requestJsonAllowed(request, 8*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  if (!(await rateLimit(request,env,'resend-verification',4,60*60*1000))) return json({error:'Too many requests. Try again later.'},429);
  const body=await readJsonLimited(request); const email=normalizeEmail(body.email); if(!validEmail(email)) return json({ok:true});
  const row=await env.DB.prepare(`SELECT id,name,email,email_verified_at FROM users WHERE email=?`).bind(email).first();
  if(row && !row.email_verified_at && env.RESEND_API_KEY && env.FROM_EMAIL) await issueVerificationEmail(request,env,row.id,row.name,row.email);
  return json({ok:true,message:'If the account exists and needs verification, a new email has been sent.'});
}

async function issuePasswordResetEmail(request, env, userId, name, email) {
  const raw=b64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash=await digestHex(`reset:${raw}:${env.AUTH_PEPPER}`);
  const now=Date.now(), expires=now+60*60*1000;
  await env.DB.prepare(`DELETE FROM password_reset_tokens WHERE user_id=? AND used_at IS NULL`).bind(userId).run();
  await env.DB.prepare(`INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)`).bind(randomId(16),userId,tokenHash,expires,now).run();
  const base=new URL(request.url).origin;
  const resetUrl=`${base}/reset-password.html?token=${encodeURIComponent(raw)}`;
  const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#182033"><h2>Reset your DOXFRAME password</h2><p>Hello ${escapeHtml(name)},</p><p>Use the button below to choose a new password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p><p>This link expires in 1 hour and can be used once.</p><p>If you did not request this, you can ignore this email.</p></div>`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.FROM_EMAIL,to:[email],subject:'Reset your DOXFRAME password',html})});
  if(!r.ok){await env.DB.prepare(`DELETE FROM password_reset_tokens WHERE user_id=?`).bind(userId).run();throw new Error('Password reset email could not be sent');}
}
async function requestPasswordReset(request, env) {
  const contentError=await requestJsonAllowed(request,8*1024); if(contentError)return contentError;
  if(!originAllowed(request))return json({error:'Invalid origin'},403);
  if(!(await rateLimit(request,env,'password-reset',2,60*60*1000)))return json({error:'Too many requests. Try again later.'},429);
  const body=await readJsonLimited(request); const email=normalizeEmail(body.email); const turnstileToken=String(body.turnstileToken||'');
  if(!validEmail(email))return json({ok:true,message:'If an account exists for that email, a password reset link has been sent.'});
  if(!(await rateLimitKey(env,`password-reset:email:${email}`,'password-reset-email',2,60*60*1000)))return json({ok:true,message:'If an account exists for that email, a password reset link has been sent.'});
  if(!env.RESEND_API_KEY || !env.FROM_EMAIL)return json({ok:true,message:'If an account exists for that email, a password reset link has been sent.'});
  const row=await env.DB.prepare(`SELECT id,name,email,email_verified_at FROM users WHERE email=?`).bind(email).first();
  if(row?.email_verified_at) { try { await issuePasswordResetEmail(request,env,row.id,row.name,row.email); } catch(e) {} }
  return json({ok:true,message:'If an account exists for that email, a password reset link has been sent.'});
}
async function resetPassword(request, env) {
  const contentError=await requestJsonAllowed(request,8*1024); if(contentError)return contentError;
  if(!originAllowed(request))return json({error:'Invalid origin'},403);
  const body=await readJsonLimited(request); const token=String(body.token||'').trim(); const password=String(body.password||'');
  if(!token || token.length>256 || password.length<8 || password.length>128)return json({error:'Invalid reset request.'},400);
  if(!env.AUTH_PEPPER)return json({error:'Password reset is temporarily unavailable.'},503);
  if(!(await rateLimit(request,env,'password-reset-complete',8,60*60*1000)))return json({error:'Too many reset attempts. Try again later.'},429);
  const hash=await digestHex(`reset:${token}:${env.AUTH_PEPPER}`), now=Date.now();
  const row=await env.DB.prepare(`SELECT id,user_id,expires_at FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL`).bind(hash).first();
  if(!row || row.expires_at<now)return json({error:'This password reset link is invalid or expired.'},400);
  const ph=await hashPassword(password);
  // Atomically consume the reset token first, then allow the password update
  // only when this request successfully consumed that exact token. This
  // prevents two concurrent requests from reusing one reset link.
  const results=await env.DB.batch([
    env.DB.prepare(`UPDATE password_reset_tokens SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>=?`).bind(now,row.id,now),
    env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=? WHERE id=? AND EXISTS (SELECT 1 FROM password_reset_tokens WHERE id=? AND used_at=?)`).bind(ph.hash,ph.salt,row.user_id,row.id,now),
    env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(row.user_id)
  ]);
  if(Number(results?.[0]?.meta?.changes||0)!==1 || Number(results?.[1]?.meta?.changes||0)!==1) return json({error:'This password reset link is invalid or already used.'},400);
  return json({ok:true,message:'Password updated. Please sign in again.'});
}

async function createSessionResponse(env,userId,user) {
  const tokenBytes=crypto.getRandomValues(new Uint8Array(32)); const token=b64url(tokenBytes); const tokenHash=await sessionHash(token,env); const now=Date.now();
  await env.DB.prepare(`INSERT INTO sessions (id,user_id,token_hash,created_at,expires_at) VALUES (?,?,?,?,?)`).bind(randomId(16),userId,tokenHash,now,now+30*24*60*60*1000).run();
  return new Response(JSON.stringify({user}),{status:200,headers:{...JSON_HEADERS,...securityHeaders(),'Set-Cookie':cookieHeader('__Host-i24_session',token,30*24*60*60)}});
}

async function logout(request, env) {
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  const token=cookie(request,'__Host-i24_session');
  if (token && env.DB) await env.DB.prepare(`DELETE FROM sessions WHERE token_hash=?`).bind(await sessionHash(token,env)).run();
  return new Response(JSON.stringify({ok:true}),{status:200,headers:{...JSON_HEADERS,...securityHeaders(),'Set-Cookie':clearCookie('__Host-i24_session')}});
}
async function me(request, env) { const user=await getUser(request,env); return json({user}); }

async function deleteAccount(request, env) {
  const contentError=await requestJsonAllowed(request, 8*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  if (!(await rateLimit(request, env, 'account-delete', 3, 60*60*1000))) return json({error:'Too many deletion attempts. Try again later.'},429);
  const user=await getUser(request,env); if(!user) return json({error:'Sign in required.'},401);
  const body=await readJsonLimited(request);
  const password=String(body.password||'');
  if(password.length<8 || password.length>128) return json({error:'Enter your account password to confirm deletion.'},400);
  const row=await env.DB.prepare(`SELECT id,password_hash,password_salt,subscription_id,subscription_status FROM users WHERE id=?`).bind(user.id).first();
  const pv=await verifyPasswordRecord(password,row);
  if(!pv.ok)return json({error:'Password confirmation failed.'},401);
  if(pv.needsRehash) await env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=? WHERE id=?`).bind(pv.hash,pv.salt,row.id).run();
  if(row.subscription_id && ['active','authenticated'].includes(String(row.subscription_status||''))) return json({error:'Cancel your active Pro subscription before deleting the account.'},409);
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(user.id),
    env.DB.prepare(`DELETE FROM jobs WHERE user_id=?`).bind(user.id),
    env.DB.prepare(`DELETE FROM feedback WHERE user_id=?`).bind(user.id),
    env.DB.prepare(`DELETE FROM subscriptions WHERE user_id=?`).bind(user.id),
    env.DB.prepare(`DELETE FROM billing_checkout_locks WHERE user_id=?`).bind(user.id),
    env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(user.id)
  ]);
  return new Response(JSON.stringify({ok:true}),{status:200,headers:{...JSON_HEADERS,...securityHeaders(),'Set-Cookie':clearCookie('__Host-i24_session')}});
}

async function usage(request, env) {
  const user=await getUser(request,env); const key=await subjectHash(request,env,user?.id||''); const day=utcDay();
  await env.DB.prepare(`INSERT OR IGNORE INTO daily_usage (subject_key,day,count) VALUES (?,?,0)`).bind(key,day).run();
  const row=await env.DB.prepare(`SELECT count FROM daily_usage WHERE subject_key=? AND day=?`).bind(key,day).first();
  const plan=user?.plan==='pro'?'pro':'free', limit=plan==='pro'?PRO_LIMIT:FREE_LIMIT, today=Number(row?.count||0);
  return json({plan,today,limit,remaining:Math.max(0,limit-today),authenticated:!!user});
}
async function reserveJob(request, env) {
  if (!(await rateLimit(request, env, 'job-reserve', 120, 60*1000))) return json({error:'Too many requests. Please slow down.'},429);
  const contentError=await requestJsonAllowed(request, 8*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  const user=await getUser(request,env); const body=await readJsonLimited(request); const rawTool=htmlSafe(body.tool).toLowerCase();
  const toolAliases={mergepdf:'merge-pdf',splitpdf:'split-pdf',compresspdf:'compress-pdf',wordpdf:'word-to-pdf',pdfexcel:'pdf-to-excel',pdfword:'pdf-to-word',jpgpdf:'jpg-to-pdf',pdfjpg:'pdf-to-jpg',editpdf:'edit-pdf',excelpdf:'excel-to-pdf',watermarkpdf:'watermark-pdf',unlockpdf:'unlock-pdf',organisepdf:'organise-pdf',resize:'image-resizer',crop:'crop-image',removebg:'remove-background',bulkresize:'bulk-image-resizer'};
  const tool=toolAliases[rawTool]||rawTool;
  const allowedTools=new Set(['image-resizer','bulk-image-resizer','image-compressor','crop-image','collage-maker','flip-image','rotate-image','image-enlarger','color-picker','meme-generator','image-converter','pdf-to-jpg','heic-to-jpg','svg-converter','pdf-to-png','png-to-svg','webp-to-jpg','png-to-jpg','jpg-to-png','compress-pdf','pdf-converter','image-to-pdf','jpg-to-pdf','png-to-pdf','merge-pdf','split-pdf','compress-images','watermark-pdf','pdf-to-word','pdf-to-excel','excel-to-pdf','edit-pdf','organise-pdf','image-to-text','remove-background','bulk-image-resizer','passport-photo-maker','signature-resizer']);
  if (!allowedTools.has(tool)) return json({error:'Invalid tool.'},400);
  const key=await subjectHash(request,env,user?.id||''); const day=utcDay(); const plan=user?.plan==='pro'?'pro':'free'; const limit=plan==='pro'?PRO_LIMIT:FREE_LIMIT;
  await env.DB.prepare(`INSERT OR IGNORE INTO daily_usage (subject_key,day,count) VALUES (?,?,0)`).bind(key,day).run();
  const result=await env.DB.prepare(`UPDATE daily_usage SET count=count+1 WHERE subject_key=? AND day=? AND count<?`).bind(key,day,limit).run();
  if (!result.meta?.changes) return json({error:`Daily limit reached. ${plan==='pro'?PRO_LIMIT:FREE_LIMIT} jobs/day are included in your ${plan} plan.`,limit,plan},429);
  const jobId=randomId(16);
  await env.DB.prepare(`INSERT INTO jobs (id,user_id,subject_key,tool,status,created_at) VALUES (?,?,?,?,?,?)`).bind(jobId,user?.id||null,key,tool,'started',Date.now()).run();
  return json({ok:true,jobId,plan,limit,remaining:Math.max(0,limit-Number((await env.DB.prepare(`SELECT count FROM daily_usage WHERE subject_key=? AND day=?`).bind(key,day).first())?.count||0))});
}
async function completeJob(request, env) {
  if (!(await rateLimit(request, env, 'job-complete', 180, 60*1000))) return json({error:'Too many requests. Please slow down.'},429);
  const contentError=await requestJsonAllowed(request, 8*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  const body=await readJsonLimited(request); const jobId=String(body.jobId||''); const status=body.status==='failed'?'failed':'completed';
  if(!/^[a-f0-9]{32}$/i.test(jobId)) return json({error:'Invalid job id.'},400);
  const user=await getUser(request,env); const key=await subjectHash(request,env,user?.id||'');
  const result=await env.DB.prepare(`UPDATE jobs SET status=? WHERE id=? AND subject_key=?`).bind(status,jobId,key).run();
  if(!result.meta?.changes)return json({error:'Job not found.'},404);
  return json({ok:true,status});
}
async function history(request, env) {
  const user=await getUser(request,env); if(!user) return json({error:'Sign in required.'},401);
  const rows=await env.DB.prepare(`SELECT tool,status,created_at FROM jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 50`).bind(user.id).all();
  return json({items:rows.results||[]});
}
async function feedback(request, env) {
  const contentError=await requestJsonAllowed(request, 16*1024); if(contentError)return contentError;
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  if (!(await rateLimit(request,env,'feedback',8,60*60*1000))) return json({error:'Too many feedback submissions. Try again later.'},429);
  const body=await readJsonLimited(request);
  const type=htmlSafe(body.type)||'General feedback', tool=htmlSafe(body.tool).slice(0,100), email=normalizeEmail(body.email).slice(0,160), message=htmlSafe(body.message).slice(0,5000), turnstile=String(body.turnstileToken||''), honeypot=String(body.website||'');
  if (honeypot) return json({ok:true});
  if (!message) return json({error:'Please enter a message.'},400);
  if (env.TURNSTILE_SECRET) {
    if (!(await verifyTurnstile(request,env,turnstile,'feedback'))) return json({error:'Bot verification failed. Please try again.'},400);
  }
  const user=await getUser(request,env);
  await env.DB.prepare(`INSERT INTO feedback (id,user_id,type,tool,email,message,created_at) VALUES (?,?,?,?,?,?,?)`).bind(randomId(16),user?.id||null,type,tool,email,message,Date.now()).run();
  return json({ok:true});
}

async function billingCheckout(request, env) {
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  const user=await getUser(request,env); if(!user) return json({error:'Sign in required.'},401);
  if (!(await rateLimit(request,env,'billing-checkout',8,15*60*1000))) return json({error:'Too many checkout attempts. Try again later.'},429);
  const contentError=await requestJsonAllowed(request,16384); if(contentError)return contentError;
  let body={}; try{ body=await request.json(); }catch{return json({error:'Invalid JSON payload.'},400)}
  const cycle=String(body?.cycle||'monthly').toLowerCase();
  if(!['monthly','annual'].includes(cycle)) return json({error:'Invalid billing cycle.'},400);
  const planId=cycle==='annual' ? (env.RAZORPAY_PRO_ANNUAL_PLAN_ID||'') : (env.RAZORPAY_PRO_MONTHLY_PLAN_ID||'');
  if(!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !planId) return json({error:'Billing is not configured yet. Add the Razorpay Pro plan IDs and secrets.'},503);

  const existing=await env.DB.prepare(`SELECT subscription_id,subscription_status,cancel_at_cycle_end FROM users WHERE id=?`).bind(user.id).first();
  if(existing?.subscription_status==='active' || existing?.subscription_status==='authenticated') return json({error:'Your Pro subscription is already active.'},409);
  if(existing?.subscription_id && existing?.subscription_status && !['cancelled','completed','expired'].includes(String(existing.subscription_status))) {
    const pendingSub=await env.DB.prepare(`SELECT checkout_url,status FROM subscriptions WHERE id=? AND user_id=?`).bind(existing.subscription_id,user.id).first();
    if(pendingSub?.checkout_url && ['created','pending','halted'].includes(String(pendingSub.status||''))) return json({url:pendingSub.checkout_url,reuse:true});
  }

  const now=Date.now(), lockUntil=now+10*60*1000;
  const lock=await env.DB.prepare(`
    INSERT INTO billing_checkout_locks (user_id,locked_until,created_at)
    VALUES (?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET locked_until=excluded.locked_until
    WHERE billing_checkout_locks.locked_until<?
  `).bind(user.id,lockUntil,now,now).run();
  if(!lock.meta?.changes) return json({error:'A payment setup is already in progress. Please wait a few minutes and try again.'},409);

  try {
    const auth=btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const totalCount=Number(env[cycle==='annual'?'RAZORPAY_ANNUAL_TOTAL_COUNT':'RAZORPAY_MONTHLY_TOTAL_COUNT'] || (cycle==='annual'?100:1200));
    const response=await fetch('https://api.razorpay.com/v1/subscriptions',{method:'POST',headers:{'Authorization':`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({plan_id:planId,total_count:Math.min(Math.max(totalCount,1),1200),quantity:1,customer_notify:true,notes:{user_id:user.id,product:'DOXFRAME Pro',billing_cycle:cycle}})});
    const data=await response.json();
    if(!response.ok || !data.id || !data.short_url) { console.error('Razorpay checkout error',data); await env.DB.prepare(`DELETE FROM billing_checkout_locks WHERE user_id=?`).bind(user.id).run(); return json({error:'Could not start checkout. Please try again.'},502); }

    const subStatus=String(data.status||'created');
    const now2=Date.now();
    await env.DB.prepare(`INSERT INTO subscriptions (id,user_id,status,plan,cancel_at_cycle_end,checkout_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`).bind(data.id,user.id,subStatus,['active','authenticated'].includes(subStatus)?'pro':'free',data.cancel_at_cycle_end?1:0,data.short_url,now2,now2).run();
    const updated=await env.DB.prepare(`UPDATE users SET subscription_id=?,subscription_status=?,plan=? WHERE id=? AND (subscription_id IS NULL OR subscription_status IN ('cancelled','completed','expired'))`).bind(data.id,subStatus,['active','authenticated'].includes(subStatus)?'pro':'free',user.id).run();
    if(!updated.meta?.changes) {
      await env.DB.prepare(`DELETE FROM billing_checkout_locks WHERE user_id=?`).bind(user.id).run();
      return json({error:'A newer subscription is already associated with this account. Please use the active subscription.'},409);
    }
    await env.DB.prepare(`DELETE FROM billing_checkout_locks WHERE user_id=?`).bind(user.id).run();
    return json({url:data.short_url,cycle});
  } catch (err) {
    await env.DB.prepare(`DELETE FROM billing_checkout_locks WHERE user_id=?`).bind(user.id).run();
    throw err;
  }
}
async function billingCancel(request, env) {
  if (!originAllowed(request)) return json({error:'Invalid origin'},403);
  const user=await getUser(request,env); if(!user) return json({error:'Sign in required.'},401);
  if (!(await rateLimit(request,env,'billing-cancel',10,15*60*1000))) return json({error:'Too many cancellation attempts. Try again later.'},429);
  if(!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return json({error:'Billing is not configured.'},503);
  const row=await env.DB.prepare(`SELECT subscription_id,subscription_status,cancel_at_cycle_end FROM users WHERE id=?`).bind(user.id).first();
  if(!row?.subscription_id) return json({error:'No subscription found.'},404);
  if(['cancelled','completed','expired'].includes(String(row.subscription_status||''))) return json({ok:true,status:row.subscription_status,cancel_at_cycle_end:0});
  if(!['active','authenticated'].includes(String(row.subscription_status||''))) return json({error:'This subscription cannot be cancelled yet. Please wait for payment activation or try again later.'},409);
  const auth=btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const r=await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(row.subscription_id)}/cancel`,{method:'POST',headers:{'Authorization':`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({cancel_at_cycle_end:true})});
  const data=await r.json(); if(!r.ok) return json({error:'Could not cancel the subscription.'},502);
  await env.DB.prepare(`UPDATE users SET subscription_status=?,cancel_at_cycle_end=1 WHERE id=? AND subscription_id=?`).bind(data.status||'active',user.id,row.subscription_id).run();
  return json({ok:true,status:data.status||'cancelled'});
}
async function billingWebhook(request, env) {

  const contentLength=Number(request.headers.get('Content-Length')||0);
  if(contentLength && contentLength>256*1024)return json({error:'Webhook payload is too large.'},413);
  if(!env.RAZORPAY_WEBHOOK_SECRET) return json({error:'Webhook secret not configured.'},503);
  let raw;
  try { raw=await readTextLimited(request,256*1024); } catch { return json({error:'Webhook payload is too large.'},413); }
  const received=request.headers.get('X-Razorpay-Signature')||''; const expected=await hmacHex(env.RAZORPAY_WEBHOOK_SECRET,raw);
  if(!timingSafeEqualHex(expected,received)) return json({error:'Invalid signature'},401);
  const eventId=request.headers.get('X-Razorpay-Event-Id')||await digestHex(raw);
  let body;
  try { body=JSON.parse(raw); } catch { return json({error:'Invalid JSON payload.'},400); }
  try {
    await env.DB.prepare(`INSERT INTO webhook_events (id,event,created_at) VALUES (?,?,?)`).bind(eventId,String(body?.event||'unknown'),Date.now()).run();
  } catch (e) {
    if (String(e?.message||'').toLowerCase().includes('unique')) return json({ok:true,duplicate:true});
    throw e;
  }
  const sub=body?.payload?.subscription?.entity;
  if(sub?.id){
    const userId=sub.notes?.user_id;
    const status=String(sub.status||''); const pro=['authenticated','active'].includes(status); const plan=pro?'pro':'free';
    if(userId){
      // Record every subscription separately. This prevents an old subscription's
      // webhook from overwriting a newer subscription owned by the same user.
      await env.DB.prepare(`INSERT INTO subscriptions (id,user_id,status,plan,cancel_at_cycle_end,checkout_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,plan=excluded.plan,cancel_at_cycle_end=excluded.cancel_at_cycle_end,updated_at=excluded.updated_at`).bind(sub.id,userId,status,plan,sub.cancel_at_cycle_end?1:0,null,Date.now(),Date.now()).run();
      const current=await env.DB.prepare(`SELECT subscription_id FROM users WHERE id=?`).bind(userId).first();
      const pending=await env.DB.prepare(`SELECT user_id FROM billing_checkout_locks WHERE user_id=? AND locked_until>?`).bind(userId,Date.now()).first();
      const canAttach=!current?.subscription_id || current.subscription_id===sub.id;
      if(canAttach && (!current?.subscription_id ? !!pending : true)) {
        await env.DB.prepare(`UPDATE users SET plan=?,subscription_id=?,subscription_status=?,cancel_at_cycle_end=CASE WHEN ?='cancelled' OR ?='completed' OR ?='expired' THEN 0 ELSE ? END WHERE id=? AND (subscription_id=? OR subscription_id IS NULL)`).bind(plan,sub.id,status,status,status,sub.cancel_at_cycle_end?1:0,userId,sub.id).run();
      }
    }
  }
  return json({ok:true});
}
function utcDay(){ const d=new Date(); return d.toISOString().slice(0,10); }


async function reconcileBillingState(env) {
  if(!env.DB) return;
  let lastId='';
  for(let batch=0;batch<100;batch++){
    const rows=lastId
      ? await env.DB.prepare(`SELECT u.id,u.subscription_id,u.subscription_status,u.plan,u.cancel_at_cycle_end FROM users u WHERE u.subscription_id IS NOT NULL AND u.id>? ORDER BY u.id LIMIT 100`).bind(lastId).all()
      : await env.DB.prepare(`SELECT u.id,u.subscription_id,u.subscription_status,u.plan,u.cancel_at_cycle_end FROM users u WHERE u.subscription_id IS NOT NULL ORDER BY u.id LIMIT 100`).all();
    const results=rows.results||[];
    if(!results.length) break;
    for(const r of results){
    let status=String(r.subscription_status||''), cancel=Number(r.cancel_at_cycle_end||0);
    if(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET){
      try{const auth=btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);const rr=await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(r.subscription_id)}`,{headers:{'Authorization':`Basic ${auth}`}});if(rr.ok){const data=await rr.json();status=String(data.status||status);cancel=['cancelled','completed','expired'].includes(status)?0:(data.cancel_at_cycle_end?1:0)}}catch(e){console.error('Billing reconciliation failed',r.subscription_id,e)}}
    const plan=['active','authenticated'].includes(status)?'pro':'free';
    if(String(r.subscription_status||'')!==status||String(r.plan||'')!==plan||Number(r.cancel_at_cycle_end||0)!==cancel) await env.DB.prepare(`UPDATE users SET plan=?,subscription_status=?,cancel_at_cycle_end=? WHERE id=? AND subscription_id=?`).bind(plan,status,cancel,r.id,r.subscription_id).run();
      await env.DB.prepare(`UPDATE subscriptions SET status=?,plan=?,cancel_at_cycle_end=?,updated_at=? WHERE id=?`).bind(status,plan,cancel,Date.now(),r.subscription_id).run();
    }
    lastId=String(results[results.length-1].id);
    if(results.length<100) break;
  }
}

async function cleanup(env) {
  if(!env.DB) return;
  const now=Date.now();
  const dayCutoff=new Date(now-7*24*60*60*1000).toISOString().slice(0,10);
  const sessionCutoff=now-31*24*60*60*1000;
  const jobCutoff=now-90*24*60*60*1000;
  const feedbackCutoff=now-180*24*60*60*1000;
  const webhookCutoff=now-90*24*60*60*1000;
  const rateCutoff=now-2*24*60*60*1000;
  await Promise.allSettled([
    env.DB.prepare(`DELETE FROM sessions WHERE expires_at<?`).bind(sessionCutoff).run(),
    env.DB.prepare(`DELETE FROM rate_limits WHERE window_start<?`).bind(rateCutoff).run(),
    env.DB.prepare(`DELETE FROM jobs WHERE created_at<?`).bind(jobCutoff).run(),
    env.DB.prepare(`DELETE FROM feedback WHERE created_at<?`).bind(feedbackCutoff).run(),
    env.DB.prepare(`DELETE FROM webhook_events WHERE created_at<?`).bind(webhookCutoff).run(),
    env.DB.prepare(`DELETE FROM daily_usage WHERE day<?`).bind(dayCutoff).run(),
    env.DB.prepare(`DELETE FROM billing_checkout_locks WHERE locked_until<?`).bind(now).run(),
    env.DB.prepare(`DELETE FROM email_verification_tokens WHERE expires_at<? OR used_at IS NOT NULL`).bind(now-7*24*60*60*1000).run(),
    env.DB.prepare(`DELETE FROM password_reset_tokens WHERE expires_at<? OR used_at IS NOT NULL`).bind(now-7*24*60*60*1000).run(),
    env.DB.prepare(`DELETE FROM mfa_challenges WHERE expires_at<?`).bind(now).run()
  ]);
}
