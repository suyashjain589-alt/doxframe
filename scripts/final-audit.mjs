import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';

const root=process.cwd(), pub=join(root,'public');
const toolDir=join(pub,'tools');
const expected=['bulk-image-resize','compress-pdf','crop-image','edit-pdf','excel-to-pdf','image-compressor','image-converter','image-resize','image-to-text','jpg-to-pdf','merge-pdf','organise-pdf','passport-photo','pdf-to-excel','pdf-to-jpg','pdf-to-word','remove-background','signature-resizer','split-pdf','unlock-pdf','watermark-pdf','word-to-pdf'];
const tools=readdirSync(toolDir).filter(x=>x.endsWith('.html')).map(x=>x.slice(0,-5)).sort();
const fail=[];
if(!root.endsWith('DOXFRAME-V23.2.8-RELEASE'))fail.push('Release directory/version mismatch.');
if(!readFileSync(join(pub,'.well-known','security.txt'),'utf8').includes('Contact:'))fail.push('security.txt contact missing.');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const manifest=JSON.parse(readFileSync(join(pub,'manifest.webmanifest'),'utf8'));
if(pkg.version!=='23.2.8')fail.push(`Package version mismatch: ${pkg.version}`);
if(manifest.version!=='23.2.8')fail.push(`Manifest version mismatch: ${manifest.version}`);
if(tools.length!==22)fail.push(`Expected 22 tool pages, found ${tools.length}.`);
if(JSON.stringify(tools)!==JSON.stringify([...expected].sort()))fail.push('Tool-page inventory mismatch.');
const index=readFileSync(join(pub,'index.html'),'utf8');
const homeTools=[...index.matchAll(/href="\/tools\/([^"]+)\.html"/g)].map(m=>m[1]);
if(new Set(homeTools).size!==22)fail.push(`Expected 22 unique homepage tool links, found ${new Set(homeTools).size}.`);
const sitemap=readFileSync(join(pub,'sitemap.xml'),'utf8');
if((sitemap.match(/<loc>https:\/\/doxframe\.suyashjain589\.workers\.dev\/tools\/[^<]+<\/loc>/g)||[]).length!==22)fail.push('Sitemap tool count is not 22.');
const app=readFileSync(join(toolDir,'tool-app.js'),'utf8');
const names=[...app.matchAll(/^((?:async )?function)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[2]);
const dup=names.filter((n,i)=>names.indexOf(n)!==i); if(dup.length)fail.push(`Duplicate top-level functions: ${[...new Set(dup)].join(', ')}`);
if(!app.includes('DOXFRAME V23.2 final tool bootstrap'))fail.push('Universal tool bootstrap missing.');
if(!app.includes("passport:'passport-photo-maker'"))fail.push('Passport usage mapping missing.');
if(!app.includes("signature:'signature-resizer'"))fail.push('Signature usage mapping missing.');
const requiredCore=['download','saveCanvas','queue','imageRun','bulkResize','imageCompress','imageConvert','passportPhoto','signatureResize'];
const a11y=readFileSync(join(pub,'assets','a11y.js'),'utf8');
for(const fn of requiredCore){if(!new RegExp('(?:^|\\n)(?:async\\s+)?function\\s+'+fn+'\\s*\\(').test(app))fail.push(`Required tool-engine function missing: ${fn}`);}
const allJs=[app,a11y,...readdirSync(join(pub,'assets','inline')).filter(x=>x.endsWith('.js')).map(x=>readFileSync(join(pub,'assets','inline',x),'utf8'))].join('\n');
const declared=new Set([...allJs.matchAll(/(?:^|\n)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]));
for(const ref of ['bulkResize','imageRun','clearFeedback','sendFeedback','toggleAuth']){if(!declared.has(ref))fail.push(`Required action function missing: ${ref}`);}
if(!readFileSync(join(pub,'privacy.html'),'utf8').includes('<main'))fail.push('Privacy page missing main landmark.');
if(!readFileSync(join(pub,'terms.html'),'utf8').includes('<main'))fail.push('Terms page missing main landmark.');
if(!readFileSync(join(pub,'cookies.html'),'utf8').includes('<main'))fail.push('Cookies page missing main landmark.');

const actionValues=new Set([...index.matchAll(/data-action=\"([^\"]+)/g)].map(m=>m[1]));
const actionBlock=a11y.split('var actions=',2)[1]?.split('};',1)[0]||'';
for(const action of actionValues){if(!new RegExp(`['\"]${action.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}['\"]\\s*:`).test(actionBlock))fail.push(`Homepage data-action is unmapped: ${action}`)}
if(!a11y.includes("document.addEventListener('change'"))fail.push('Delegated change handler missing.');
const worker=readFileSync(join(root,'worker.js'),'utf8');
if(!worker.includes("fetchSite === 'same-origin'"))fail.push('Unsafe requests without an Origin header are not fail-closed.');
if((worker.match(/UPDATE users SET email_verified_at=/g)||[]).length!==1)fail.push('Email verification contains duplicate or missing state update.');
if(!worker.includes("password-reset-email") || !worker.includes("verifyTurnstile(request,env,turnstileToken,'auth')"))fail.push('Password reset abuse protection missing.');
if(!worker.includes('UPDATE password_reset_tokens SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>=?') || !worker.includes('EXISTS (SELECT 1 FROM password_reset_tokens WHERE id=? AND used_at=?)'))fail.push('Password reset token consumption is not atomically bound to the password update.');
if(!app.includes("vbscript:") || !app.includes("https?:"))fail.push('Generated HTML URL sanitizer is not blocking external/dangerous URLs.');
const extScriptRe=/<script[^>]+src=["']https?:[^>]+>/gi;
const extScripts=[...readFileSync(join(pub,'index.html'),'utf8').matchAll(extScriptRe),...tools.flatMap(t=>[...readFileSync(join(toolDir,t+'.html'),'utf8').matchAll(extScriptRe)])];
const missingIntegrity=extScripts.filter(m=>!/integrity=["'][^"']+["']/i.test(m[0]));
if(missingIntegrity.length)console.warn(`SECURITY WARNING: External script tags without SRI remain: ${missingIntegrity.length}. Vendor these dependencies or add verified SRI before a strict supply-chain gate.`);

if(!worker.includes('passport-photo-maker')||!worker.includes('signature-resizer'))fail.push('Worker usage allowlist missing new tools.');
if(fail.length){console.error('FINAL AUDIT: FAIL');for(const x of fail)console.error(' -',x);process.exit(1)}
console.log('FINAL AUDIT: PASS');
console.log(`Tool pages: ${tools.length}`);
console.log(`Homepage tool links: ${new Set(homeTools).size}`);
console.log('Sitemap tool links: 22');
console.log('Duplicate top-level functions: none');
console.log('Universal standalone-tool bootstrap: present');
console.log('New-tool quota mappings: present');
