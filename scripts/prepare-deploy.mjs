import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';

const config='wrangler.jsonc';
let text=readFileSync(config,'utf8');
const match=text.match(/database_id"\s*:\s*"([^"]*)"/);
if(!match) throw new Error('Could not find D1 database_id in wrangler.jsonc');
if(match[1] && match[1] !== 'REPLACE_WITH_NEW_D1_DATABASE_ID'){
  console.log('D1 database_id already configured:', match[1]);
  process.exit(0);
}
console.log('Creating fresh D1 database: doxframe-db');
const out=execFileSync('npx',['wrangler','d1','create','doxframe-db'],{encoding:'utf8',stdio:['inherit','pipe','inherit']});
const id=out.match(/database_id\s*=\s*"([^"]+)"/)?.[1] || out.match(/"database_id"\s*:\s*"([^"]+)"/)?.[1];
if(!id) throw new Error('Wrangler created the database but the database_id could not be parsed. Copy the ID from the command output into wrangler.jsonc.');
text=text.replace(/("database_id"\s*:\s*")REPLACE_WITH_NEW_D1_DATABASE_ID("\s*)/,'$1'+id+'$2');
writeFileSync(config,text);
console.log('Updated wrangler.jsonc with D1 database_id:',id);
console.log('Next: npx wrangler d1 migrations apply doxframe-db --remote && npm run deploy');
