/* DOXFRAME V16.1 shared tool engine — standalone-page safe */
let active=null,files=[];const $=id=>document.getElementById(id),toastEl=$("toast");let activeCat="all";
const TOOLS=[
{id:"mergepdf",n:"Merge PDF",cat:"pdf"},{id:"splitpdf",n:"Split PDF",cat:"pdf"},{id:"compresspdf",n:"Compress PDF",cat:"pdf"},
{id:"wordpdf",n:"Word to PDF",cat:"pdf"},{id:"pdfexcel",n:"PDF to Excel",cat:"pdf"},{id:"pdfword",n:"PDF to Word",cat:"pdf"},
{id:"jpgpdf",n:"JPG to PDF",cat:"pdf"},{id:"pdfjpg",n:"PDF to JPG",cat:"pdf"},{id:"editpdf",n:"Edit PDF",cat:"pdf"},
{id:"excelpdf",n:"Excel to PDF",cat:"pdf"},{id:"watermarkpdf",n:"Watermark PDF",cat:"pdf"},{id:"unlockpdf",n:"Unlock PDF",cat:"pdf"},
{id:"organisepdf",n:"Organise PDF",cat:"pdf"},{id:"resize",n:"Image Resize",cat:"image"},{id:"crop",n:"Crop Image",cat:"image"},
{id:"removebg",n:"Remove Background",cat:"image"},{id:"bulkresize",n:"Bulk Image Resize",cat:"image"},{id:"compressimg",n:"Image Compressor",cat:"image"},{id:"convertimg",n:"Image Converter",cat:"image"},{id:"passport",n:"Passport Photo Maker",cat:"image"},{id:"signature",n:"Signature Resizer",cat:"image"},{id:"ocr",n:"Image to Text",cat:"ocr"}
];

/* DOXFRAME performance: load heavy libraries only when a tool needs them. */
const I24_LIBS={
  pdfLib:'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  mammoth:'https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js',
  xlsx:'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
  jspdf:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js',
  html2canvas:'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  pdfjs:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.min.mjs'
};
const I24_SRI={pdfLib:'sha512-z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ==',jspdf:'sha512-+EeCylkt9WHJk5tGJxYdecHOcXFRME7qnbsfeMsdQL6NUPYm2+uGFmyleEqsmVoap/f3dN/sc3BX9t9kHXkHHg==',html2canvas:'sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA=='};
const i24LibPromises={};

function sanitizeGeneratedHtml(html){
  const doc=new DOMParser().parseFromString(String(html||''),'text/html');
  doc.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach(el=>el.remove());
  doc.querySelectorAll('*').forEach(el=>{
    [...el.attributes].forEach(a=>{
      const n=a.name.toLowerCase(), v=a.value.trim().toLowerCase();
      if(n.startsWith('on-') || n.startsWith('on') || n==='srcdoc' || n==='style' && /url\s*\(/i.test(v)) el.removeAttribute(a.name);
      if((n==='href'||n==='src'||n==='xlink:href') && /^(javascript:|vbscript:|data:text\/html|https?:|\/\/)/i.test(v)) el.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
}
function loadI24Script(key){
  if(window[key==='pdfLib'?'PDFLib':key==='mammoth'?'mammoth':key==='xlsx'?'XLSX':key==='jspdf'?'jspdf':key==='html2canvas'?'html2canvas':'__none']) return Promise.resolve();
  if(i24LibPromises[key]) return i24LibPromises[key];
  i24LibPromises[key]=new Promise((resolve,reject)=>{
    const sc=document.createElement('script'); sc.src=I24_LIBS[key]; sc.async=true; if(I24_SRI[key]){sc.integrity=I24_SRI[key];sc.crossOrigin='anonymous';} sc.onload=resolve; sc.onerror=()=>reject(new Error('Could not load '+key+' library.')); document.head.appendChild(sc);
  });
  return i24LibPromises[key];
}
async function ensureToolLibraries(id){
  const needs=[];
  if(['mergepdf','splitpdf','compresspdf','wordpdf','pdfexcel','pdfword','jpgpdf','pdfjpg','editpdf','excelpdf','watermarkpdf','unlockpdf','organisepdf'].includes(id)) needs.push('pdfLib');
  if(['wordpdf'].includes(id)) needs.push('mammoth','html2canvas','jspdf');
  if(['excelpdf'].includes(id)) needs.push('xlsx','html2canvas','jspdf');
  if(['pdfexcel'].includes(id)) needs.push('xlsx');
  await Promise.all([...new Set(needs)].map(loadI24Script));
}
function filterTools(cat,b){activeCat=cat;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));if(b)b.classList.add("active");renderTools()}
function cardMatchesCategory(c){if(activeCat==="all")return true;if(activeCat==="popular")return c.dataset.popular==="true";if(activeCat==="convert")return /\b(to|convert|converter)\b/i.test((c.dataset.toolName||"")+" "+(c.dataset.toolDesc||""));if(activeCat==="ocr")return c.dataset.toolCat==="ocr"||/\bocr\b|image to text/i.test((c.dataset.toolName||"")+" "+(c.dataset.toolDesc||""));return c.dataset.toolCat===activeCat}
function renderTools(){const grid=$("grid"),count=$("count");if(!grid)return;let q=($("toolSearch")?.value||"").toLowerCase().trim();let cards=[...grid.querySelectorAll(".tool")];let shown=0;cards.forEach(c=>{let hay=((c.dataset.toolName||"")+" "+(c.dataset.toolDesc||"")).toLowerCase();let ok=cardMatchesCategory(c)&&(!q||hay.includes(q));c.style.display=ok?"flex":"none";if(ok)shown++});if(count)count.textContent=shown+" tools";let k=$("toolKbd");if(k)k.textContent=shown+" tools";let t=$("toolTotal");if(t&&activeCat==="all"&&!q)t.textContent=cards.length;}
renderTools();
function openTool(id){
const map={mergepdf:"merge-pdf",splitpdf:"split-pdf",compresspdf:"compress-pdf",wordpdf:"word-to-pdf",pdfexcel:"pdf-to-excel",pdfword:"pdf-to-word",jpgpdf:"jpg-to-pdf",pdfjpg:"pdf-to-jpg",editpdf:"edit-pdf",excelpdf:"excel-to-pdf",watermarkpdf:"watermark-pdf",unlockpdf:"unlock-pdf",organisepdf:"organise-pdf",resize:"image-resize",crop:"crop-image",removebg:"remove-background",bulkresize:"bulk-image-resize",compressimg:"image-compressor",convertimg:"image-converter",passport:"passport-photo",signature:"signature-resizer"};
const slug=map[id]; if(!slug){toast("Tool page not found.");return} location.href="/tools/"+slug+".html";
}
const fileInput=$("file"),dropZone=$("drop");
if(fileInput)fileInput.addEventListener("change",e=>{files=[...e.target.files];if(!validateToolFiles()){files=[];e.target.value="";return}build()});
if(dropZone){dropZone.addEventListener("dragover",e=>{e.preventDefault();dropZone.classList.add("drag")});dropZone.addEventListener("dragleave",()=>dropZone.classList.remove("drag"));dropZone.addEventListener("drop",e=>{e.preventDefault();dropZone.classList.remove("drag");files=[...e.dataTransfer.files];if(!validateToolFiles()){files=[];return}build()});}
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function u16(n){return new Uint8Array([n&255,(n>>>8)&255])} function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
async function makeZip(entries){let chunks=[],central=[],offset=0;for(const e of entries){let name=new TextEncoder().encode(e.name),data=new Uint8Array(await e.blob.arrayBuffer()),crc=crc32(data),head=new Uint8Array(30+name.length);head.set([80,75,3,4,20,0,0,0,0,0,0,0,0,0],0);head.set(u32(crc),14);head.set(u32(data.length),18);head.set(u32(data.length),22);head.set(u16(name.length),26);head.set(name,30);chunks.push(head,data);let c=new Uint8Array(46+name.length);c.set([80,75,1,2,20,0,20,0,0,0,0,0,0,0],0);c.set(u32(crc),16);c.set(u32(data.length),20);c.set(u32(data.length),24);c.set(u16(name.length),28);c.set(u32(offset),42);c.set(name,46);central.push(c);offset+=head.length+data.length}let centralSize=central.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22);end.set([80,75,5,6,0,0,0,0,entries.length&255,(entries.length>>>8)&255,entries.length&255,(entries.length>>>8)&255],0);end.set(u32(centralSize),12);end.set(u32(offset),16);return new Blob([...chunks,...central,end],{type:'application/zip'})}

async function imageCompress(){const f=files[0],target=(+$('targetkb').value||+$('customkb').value)*1024;if(!target||target<5*1024){toast('Choose a valid target size');return}const img=await loadImageFile(f),fmt=$('cfmt').value,ext=fmt==='image/webp'?'webp':'jpg',maxPx=16000000,scale=img.width*img.height>maxPx?Math.sqrt(maxPx/(img.width*img.height)):1;let w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),best=null,achieved=false;for(let pass=0;pass<5;pass++){const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);let low=.1,high=.95,passBest=null;for(let i=0;i<8;i++){const q=(low+high)/2,b=await new Promise(r=>c.toBlob(r,fmt,q));if(!b)continue;if(!passBest||Math.abs(b.size-target)<Math.abs(passBest.size-target))passBest=b;if(b.size>target)high=q;else{achieved=true;low=q}}if(passBest&&(!best||Math.abs(passBest.size-target)<Math.abs(best.size-target)))best=passBest;if(best&&best.size<=target)break;w=Math.max(1,Math.round(w*.85));h=Math.max(1,Math.round(h*.85))}if(!best)throw new Error('Compression failed.');await download(best,'doxframe-compressed.'+ext);$('status').textContent=achieved&&best.size<=target?`Done — ${(best.size/1024).toFixed(0)} KB, target achieved.`:`Done — ${(best.size/1024).toFixed(0)} KB, closest available result.`}
async function imageConvert(){let fmt=$('outfmt').value,q=+$('cq').value/100,out=[];for(let i=0;i<files.length;i++){let f=files[i],img=new Image(),u=URL.createObjectURL(f);img.src=u;await img.decode();URL.revokeObjectURL(u);assertCanvasSize(img.width,img.height,f.name);let c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);let b=await new Promise((r,j)=>c.toBlob(x=>x?r(x):j(new Error('Conversion failed')),fmt,q));let ext=fmt==='image/png'?'png':fmt==='image/webp'?'webp':'jpg';out.push({name:f.name.replace(/\.[^.]+$/,'')+'.'+ext,blob:b});c.width=1;c.height=1}if(out.length>1)await download(await makeZip(out),'doxframe-converted-images.zip');else await download(out[0].blob,out[0].name);$('status').textContent=`Done — ${out.length} image(s) converted.`}
async function passportPhoto(){const img=await loadImageFile(files[0]),preset=$('psize').value==='2x2'?{w:600,h:600,label:'2 × 2 inch'}:{w:413,h:531,label:'35 × 45 mm'},white=$('pwhite')?.checked!==false,c=document.createElement('canvas');c.width=preset.w;c.height=preset.h;const ctx=c.getContext('2d');if(white){ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height)}const scale=Math.max(c.width/img.width,c.height/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);const type=white?'image/jpeg':'image/png',ext=white?'jpg':'png',b=await new Promise((r,j)=>c.toBlob(x=>x?r(x):j(new Error('Could not create photo.')),type,white?.92:undefined));await download(b,'doxframe-passport-photo.'+ext);$('status').textContent=`${preset.label} passport-style crop created.`}
async function signatureResize(){const img=await loadImageFile(files[0]),w=Math.max(50,Math.min(2000,+$('sw').value||300)),target=(+$('skb').value||50)*1024;let cw=w,ch=Math.max(1,Math.round(img.height*w/img.width)),best=null,achieved=false;for(let pass=0;pass<6;pass++){const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');x.clearRect(0,0,cw,ch);x.drawImage(img,0,0,cw,ch);let low=.1,high=.98,passBest=null;for(let i=0;i<9;i++){const q=(low+high)/2,b=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(!b)continue;if(!passBest||Math.abs(b.size-target)<Math.abs(passBest.size-target))passBest=b;if(b.size>target)high=q;else{achieved=true;low=q}}if(passBest&&(!best||Math.abs(passBest.size-target)<Math.abs(best.size-target)))best=passBest;if(best&&best.size<=target)break;cw=Math.max(50,Math.round(cw*.85));ch=Math.max(1,Math.round(img.height*cw/img.width))}if(!best)throw new Error('Signature resize failed.');await download(best,'doxframe-signature.jpg');$('status').textContent=achieved&&best.size<=target?`Done — ${(best.size/1024).toFixed(0)} KB, target achieved.`:`Done — ${(best.size/1024).toFixed(0)} KB, closest available result.`}
async function imagePDF(){let pdf=await PDFLib.PDFDocument.create();for(let f of files){let b=new Uint8Array(await f.arrayBuffer()),im=f.type==="image/jpeg"?await pdf.embedJpg(b):await pdf.embedPng(b),s=im.scale(1),p=pdf.addPage([s.width,s.height]);p.drawImage(im,{x:0,y:0,width:s.width,height:s.height})}download(new Blob([await pdf.save()],{type:"application/pdf"}),"doxframe-images.pdf");$("status").textContent="PDF created."}
async function pdfMerge(){let out=await PDFLib.PDFDocument.create(),total=0;for(let f of files){let d=await PDFLib.PDFDocument.load(await f.arrayBuffer());total+=d.getPageCount();assertPdfPageCount(total);(await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p))}download(new Blob([await out.save()],{type:"application/pdf"}),"doxframe-merged.pdf");$("status").textContent="PDFs merged."}
function parsePages(s,total){let set=[];s.split(",").forEach(part=>{let x=part.trim().split("-").map(Number);if(x.length===1&&x[0]>=1&&x[0]<=total)set.push(x[0]-1);else if(x.length===2)for(let i=x[0];i<=x[1];i++)if(i>=1&&i<=total)set.push(i-1)});return [...new Set(set)]}
async function pdfPages(){let d=await PDFLib.PDFDocument.load(await files[0].arrayBuffer()),n=d.getPageCount();assertPdfPageCount(n);let idx=parsePages(active==="splitpdf"?splitSelected.join(","):($("pages").value||"1"),n);if(!idx.length){toast("Enter valid page numbers");return}let out=await PDFLib.PDFDocument.create(),copied=await out.copyPages(d,idx);copied.forEach(p=>out.addPage(p));download(new Blob([await out.save()],{type:"application/pdf"}),"doxframe-pages.pdf");$("status").textContent="PDF created."}
async function pdfCompress(){let level=$('pdflevel')?.value||'balanced';if(level==='high'){let d=await PDFLib.PDFDocument.load(await files[0].arrayBuffer());assertPdfPageCount(d.getPageCount());let bytes=await d.save({useObjectStreams:true,addDefaultPage:false});await download(new Blob([bytes],{type:'application/pdf'}),'doxframe-compressed.pdf');$('status').textContent='Done — high-quality optimized copy ready.';return}let pdfjs=await loadPDFJS();pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';let doc=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableXfa:false}).promise;assertPdfPageCount(doc.numPages);let out=await PDFLib.PDFDocument.create();let scale=level==='small'?1.25:1.6,quality=level==='small'?.65:.78;for(let i=1;i<=doc.numPages;i++){let pg=await doc.getPage(i),vp=pg.getViewport({scale});assertPdfRenderSize(vp.width,vp.height);let c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;let b=await new Promise(r=>c.toBlob(r,'image/jpeg',quality));let im=await out.embedJpg(new Uint8Array(await b.arrayBuffer()));let p=out.addPage([vp.width/scale,vp.height/scale]);p.drawImage(im,{x:0,y:0,width:p.getWidth(),height:p.getHeight()});$('status').textContent=`Compressing page ${i}/${doc.numPages}…`}let bytes=await out.save({useObjectStreams:true});await download(new Blob([bytes],{type:'application/pdf'}),'doxframe-compressed.pdf');$('status').textContent=`Done — ${level} compressed copy ready. Text may be flattened.`}
async function loadPDFJS(){return await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.min.mjs")}
async function pdfToJpg(){try{let pdfjs=await loadPDFJS();pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';let pdf=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableXfa:false}).promise;assertPdfPageCount(pdf.numPages);let out=[];for(let i=1;i<=pdf.numPages;i++){let p=await pdf.getPage(i),v=p.getViewport({scale:1.5}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;let b=await new Promise(r=>c.toBlob(r,'image/jpeg',+$('jpgq').value/100));out.push({name:`page-${String(i).padStart(3,'0')}.jpg`,blob:b});$('status').textContent=`Exporting ${i}/${pdf.numPages}…`}await download(await makeZip(out),'doxframe-pdf-pages.zip');$('status').textContent=`Done — ${out.length} JPG pages packed into ZIP.`}catch(e){toast(e.message||'PDF export failed.')}}
async function watermarkPDF(){let d=await PDFLib.PDFDocument.load(await files[0].arrayBuffer());assertPdfPageCount(d.getPageCount());let font=await d.embedFont(PDFLib.StandardFonts.HelveticaBold),txt=$("wm").value||"DOXFRAME",op=(+$("wmo").value||35)/100;for(let p of d.getPages()){let {width,height}=p.getSize();p.drawText(txt,{x:25,y:25,size:22,font,color:PDFLib.rgb(0.35,0.35,0.65),opacity:op,rotate:PDFLib.degrees(0)});p.drawText("",{x:width-20,y:height-20})}download(new Blob([await d.save()],{type:"application/pdf"}),"doxframe-watermarked.pdf");$("status").textContent="Watermark added."}
async function unlockPDF(){try{let d=await PDFLib.PDFDocument.load(await files[0].arrayBuffer(),{ignoreEncryption:false});assertPdfPageCount(d.getPageCount());download(new Blob([await d.save()],{type:"application/pdf"}),"doxframe-unlocked.pdf");$("status").textContent="Unlocked copy created when the PDF permits editing."}catch(e){toast("This PDF is password-protected. A password is required.")}}
async function canvasToPagedPdf(canvas,filename,quality=.92){
  const {jsPDF}=window.jspdf;if(!jsPDF)throw new Error('PDF library is loading.');
  const margin=10,pageW=190,pageH=277,scale=pageW/canvas.width,sliceH=Math.max(1,Math.floor(pageH/scale));
  const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});let y=0,page=0;
  while(y<canvas.height){if(page>0)pdf.addPage();const h=Math.min(sliceH,canvas.height-y),slice=document.createElement('canvas');slice.width=canvas.width;slice.height=h;slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);pdf.addImage(slice.toDataURL('image/jpeg',quality),'JPEG',margin,margin,pageW,h*scale);y+=h;page++;}
  pdf.save(filename);
}
async function conversionRun(){try{if(active==="wordpdf"){if(!window.mammoth){toast("Word converter is loading. Try again.");return}let r=await mammoth.convertToHtml({arrayBuffer:await files[0].arrayBuffer()}),box=document.createElement("div");box.style.cssText="position:fixed;left:-10000px;top:0;width:720px;background:white;color:black;padding:30px;font-family:Arial;";box.innerHTML=sanitizeGeneratedHtml(r.value);document.body.appendChild(box);let c=await html2canvas(box,{scale:1.5});await canvasToPagedPdf(c,"doxframe-word.pdf",.92);box.remove();$("status").textContent="Word converted to a paginated PDF."}
else if(active==="excelpdf"){if(!window.XLSX){toast("Excel converter is loading. Try again.");return}let wb=XLSX.read(await files[0].arrayBuffer(),{type:"array"}),html="<div style='font-family:Arial;font-size:10px'>";for(let name of wb.SheetNames){html+="<h3>"+esc(name)+"</h3>"+XLSX.utils.sheet_to_html(wb.Sheets[name])}html+="</div>";let box=document.createElement("div");box.style.cssText="position:fixed;left:-10000px;top:0;width:900px;background:white;color:black;padding:30px;";box.innerHTML=sanitizeGeneratedHtml(html);document.body.appendChild(box);let c=await html2canvas(box,{scale:1.2});await canvasToPagedPdf(c,"doxframe-excel.pdf",.9);box.remove();$("status").textContent="Excel converted to a paginated PDF."}
else if(active==="pdfword"||active==="pdfexcel"){let pdfjs=await loadPDFJS();pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs";let pdf=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableScripting:false}).promise;assertPdfPageCount(pdf.numPages);let rows=[];for(let n=1;n<=pdf.numPages;n++){let page=await pdf.getPage(n),tc=await page.getTextContent(),text=tc.items.map(x=>x.str).join(" ");rows.push([n,text])}if(active==="pdfexcel"){let ws=XLSX.utils.aoa_to_sheet([["Page","Extracted text"],...rows]),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"PDF");XLSX.writeFile(wb,"doxframe-pdf.xlsx");$("status").textContent="PDF text exported to Excel."}else{let docxLib=await import("https://unpkg.com/docx@9.5.1/build/index.js"),children=rows.flatMap(r=>[new docxLib.Paragraph({text:`Page ${r[0]}`,heading:docxLib.HeadingLevel.HEADING_2}),new docxLib.Paragraph({text:r[1]})]);let doc=new docxLib.Document({sections:[{children}]}),blob=await docxLib.Packer.toBlob(doc);download(blob,"doxframe-pdf.docx");$("status").textContent="PDF text exported to Word."}}}catch(e){console.error(e);toast("Conversion failed. Try a simpler document or PDF.")}}


let splitSelected=[];
async function buildSplitPreview(){const box=$("splitPreview");if(!box||!files[0])return;box.innerHTML='<div class="tool-note">Loading PDF pages…</div>';try{const pdfjs=await ensurePDFJS(); const pdf=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableScripting:false}).promise;if(pdf.numPages>I24_MAX_PDF_PAGES_PREVIEW)throw new Error(`PDF has too many pages for browser preview (max ${I24_MAX_PDF_PAGES_PREVIEW}).`);splitSelected=Array.from({length:pdf.numPages},(_,i)=>i+1);box.innerHTML="";for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale:.55}),card=document.createElement("div");card.className="split-page";card.dataset.page=n;const canvas=document.createElement("canvas");canvas.width=vp.width;canvas.height=vp.height;const a=document.createElement("div");a.className="sp-actions";a.innerHTML=`<span>Page ${n}</span><button type="button" data-action="split-toggle" data-page="${n}">Delete</button>`;card.append(canvas,a);box.appendChild(card);await page.render({canvasContext:canvas.getContext("2d"),viewport:vp}).promise}$("status").textContent=`${pdf.numPages} pages loaded.`}catch(e){box.innerHTML='<div class="tool-note danger-note">Could not preview this PDF.</div>';$("status").textContent=e.message||"Preview failed"}}
function splitToggle(n,b){const c=b.closest(".split-page"),on=splitSelected.includes(n);if(on){splitSelected=splitSelected.filter(x=>x!==n);c.classList.add("removed");b.textContent="Keep"}else{splitSelected.push(n);splitSelected.sort((a,b)=>a-b);c.classList.remove("removed");b.textContent="Delete"}$("status").textContent=`${splitSelected.length} page(s) selected.`}
function splitSelectAll(on){const cs=document.querySelectorAll(".split-page");splitSelected=on?[...cs].map(c=>+c.dataset.page):[];cs.forEach(c=>{c.classList.toggle("removed",!on);const b=c.querySelector("button");if(b)b.textContent=on?"Delete":"Keep"})}


function toast(msg){const el=document.getElementById("toast");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
function bootToolPage(id){
  try { showTool(id); } catch(e) { console.error(e); const st=document.getElementById("status"); if(st) st.textContent="Tool could not start: "+(e.message||e); }
}

/* DOXFRAME V16.2 feature upgrades */
let orgPages=[], orgSelectedId=null, orgPdfBytes=null, editPdfDoc=null, editPages=[], editSelected=1, editActions=[], editHistory=[], editFuture=[], cropState=null, resizeState=null, bgState=null;

async function ensurePDFJS(){
  if(window.pdfjsLib) return window.pdfjsLib;
  const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs";
  window.pdfjsLib=pdfjs; return pdfjs;
}
function imgEl(src){const i=new Image();i.src=src;return i}
async function loadImageFile(f){const u=URL.createObjectURL(f),i=imgEl(u);await i.decode();URL.revokeObjectURL(u);return i}
function hexRgb(hex){hex=(hex||"#ffffff").replace("#","");return [parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255]}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function escText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function download(blob,name){if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=String(name||'doxframe-result');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function saveCanvas(c,fmt='image/png',q=0.92){return new Promise((resolve,reject)=>c.toBlob(b=>{if(!b){reject(new Error('Could not create output image.'));return}const ext=fmt==='image/jpeg'?'jpg':fmt.split('/')[1]||'png';download(b,'doxframe-result.'+ext);resolve(b)},fmt,q))}
function queue(){const box=$('controls');if(!box||!files.length)return;let old=box.querySelector('.file-queue');if(old)old.remove();const q=document.createElement('div');q.className='file-queue';q.innerHTML=files.map(f=>`<div class="qrow"><b>${escText(f.name)}</b><small>${(f.size/1048576).toFixed(2)} MB</small></div>`).join('');box.appendChild(q)}
async function imageRun(){
  const img=await loadImageFile(files[0]);
  let w=img.width,h=img.height;
  const unit=$('unit')?.value||'px',wv=+$('w')?.value||0,hv=+$('h')?.value||0,lock=$('lock')?.checked!==false;
  if(unit==='%'){w=Math.max(1,Math.round(img.width*(wv||100)/100));h=Math.max(1,Math.round(img.height*(hv||100)/100));}
  else {if(wv)w=Math.max(1,Math.round(wv));if(hv)h=Math.max(1,Math.round(hv));if(lock){if(wv&&!hv)h=Math.max(1,Math.round(img.height*w/img.width));else if(hv&&!wv)w=Math.max(1,Math.round(img.width*h/img.height));}}
  if(w*h>I24_MAX_IMAGE_PIXELS)throw new Error(`Output is too large. Keep it below ${I24_MAX_IMAGE_PIXELS.toLocaleString()} pixels.`);
  const fmt=$('fmt')?.value||'image/jpeg',q=Math.max(.1,Math.min(1,(+$('q')?.value||90)/100)),targetMode=$('sizeMode')?.value==='kb',target=(+$('targetKB')?.value||0)*1024;
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
  let blob;
  if(targetMode && target>0 && fmt!=='image/png'){
    let lo=.1,hi=1,best=null,achieved=false;
    for(let i=0;i<10;i++){const quality=(lo+hi)/2,b=await new Promise(r=>c.toBlob(r,fmt,quality));if(!b)break;if(!best||Math.abs(b.size-target)<Math.abs(best.size-target))best=b;if(b.size>target)hi=quality;else{achieved=true;lo=quality}}
    blob=best||await new Promise(r=>c.toBlob(r,fmt,q));
    if(!blob)throw new Error('Could not create resized image.');
    download(blob,'doxframe-resized.'+(fmt==='image/webp'?'webp':'jpg'));
    $('status').textContent=achieved&&blob.size<=target?`Done — ${(blob.size/1024).toFixed(0)} KB, target achieved.`:`Done — ${(blob.size/1024).toFixed(0)} KB, closest available result.`;
    return;
  }
  blob=await new Promise(r=>c.toBlob(r,fmt,q));if(!blob)throw new Error('Could not create resized image.');
  download(blob,'doxframe-resized.'+(fmt==='image/jpeg'?'jpg':fmt==='image/webp'?'webp':'png'));
  $('status').textContent=fmt==='image/png'&&targetMode?'Done — PNG quality cannot guarantee an exact KB target.':'Done — resized image downloaded.';
}
async function bulkResize(){
  const w=+$('bw')?.value||0,h=+$('bh')?.value||0,keep=$('block')?.checked!==false;
  if(!w&&!h){toast('Enter a width or height.');return}
  const out=[];
  for(let i=0;i<files.length;i++){
    const f=files[i],img=await loadImageFile(f);let nw=w||Math.round(img.width*h/img.height),nh=h||Math.round(img.height*w/img.width);
    if(keep){if(w&&!h)nh=Math.max(1,Math.round(img.height*nw/img.width));else if(h&&!w)nw=Math.max(1,Math.round(img.width*nh/img.height));}
    if(nw*nh>I24_MAX_IMAGE_PIXELS)throw new Error(`${f.name} would exceed the safe output pixel limit.`);
    const c=document.createElement('canvas');c.width=nw;c.height=nh;c.getContext('2d').drawImage(img,0,0,nw,nh);
    const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));if(!b)throw new Error(`Could not resize ${f.name}.`);
    out.push({name:f.name.replace(/\.[^.]+$/,'')+'-resized.jpg',blob:b});
    $('status').textContent=`Processing ${i+1}/${files.length}…`;
  }
  await download(await makeZip(out),'doxframe-bulk-resized.zip');$('status').textContent=`Done — ${out.length} images packed into ZIP.`;
}

/* Enhanced build: image/PDF preview + richer controls */
function build(){
  if(!files.length)return;
  if(!validateToolFiles())return;
  const id=active;
  if(id==="resize") buildResizeUI();
  else if(id==="crop") buildCropUI();
  else if(id==="removebg") buildRemoveBgUI();
  else if(id==="watermarkpdf") buildWatermarkUI();
  else if(id==="editpdf") buildEditUI();
  else if(id==="organisepdf") buildOrganiseUI();
  else if(id==="compressimg"){$("controls").innerHTML=`<div class="controls"><label class="field">Target size <select id="targetkb"><option value="20">20 KB</option><option value="50">50 KB</option><option value="100" selected>100 KB</option><option value="200">200 KB</option><option value="500">500 KB</option><option value="1000">1 MB</option><option value="0">Custom</option></select></label><label class="field" id="customwrap" hidden>Custom KB <input id="customkb" type="number" min="5" max="10000" value="100"></label><label class="field">Format <select id="cfmt"><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label><button class="primary" data-action="image-compress">Compress image</button></div><div class="tool-note">Target-size compression adjusts quality and may resize very large images when necessary.</div>`;$('targetkb')?.addEventListener('change',e=>{$('customwrap').hidden=e.target.value!=="0"})}
else if(id==="convertimg"){$("controls").innerHTML=`<div class="controls"><label class="field">Convert to <select id="outfmt"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><label class="field">Quality <input id="cq" type="range" min="30" max="100" value="90" data-live-target="cqv"></label><span id="cqv" class="rangeval">90</span><button class="primary" data-action="image-convert">Convert ${files.length} image(s)</button></div><div class="tool-note">Browser support depends on the source format; HEIC/HEIF may require a compatible browser decoder.</div>`}
else if(id==="passport"){$("controls").innerHTML=`<div class="controls"><label class="field">Photo size <select id="psize"><option value="35x45">35 × 45 mm</option><option value="2x2">2 × 2 inch</option></select></label><label class="check"><input id="pwhite" type="checkbox" checked> White background for solid/light backgrounds</label><button class="primary" data-action="passport-photo">Create passport photo</button></div><div class="tool-note">This creates a standard print-size crop. It does not verify official photo requirements for a particular authority.</div>`}
else if(id==="signature"){$("controls").innerHTML=`<div class="controls"><label class="field">Target width <input id="sw" type="number" value="300" min="50" max="2000"></label><label class="field">Target size <select id="skb"><option value="20">20 KB</option><option value="50" selected>50 KB</option><option value="100">100 KB</option></select></label><button class="primary" data-action="signature-resize">Resize signature</button></div><div class="tool-note">Designed for common online-form signature requirements; always check the destination form's exact dimensions and file-size rules.</div>`}
else if(id==="bulkresize"){$("controls").innerHTML=`<div class="controls"><label class="field">Width <input id="bw" type="number" placeholder="e.g. 1200"></label><label class="field">Height <input id="bh" type="number" placeholder="auto"></label><label class="check"><input id="block" type="checkbox" checked> Keep ratio</label><button class="primary" data-action="bulk-resize">Process ${files.length} images → ZIP</button></div>`;queue()}
  else if(id==="mergepdf"){$("controls").innerHTML=`<button class="primary" data-action="pdf-merge">Merge PDFs</button>`;queue()}
  else if(id==="splitpdf"){$("controls").innerHTML=`<div class="controls"><button class="primary" data-action="pdf-pages">Create PDF from selected pages</button><button class="ghost" data-action="split-select-all">Select all</button><button class="ghost" data-action="split-select-clear">Clear all</button></div><div class="tool-note">Tap Delete on any page you do not want in the new PDF.</div><div id="splitPreview" class="split-preview"></div>`;buildSplitPreview()}
  else if(id==="compresspdf"){$("controls").innerHTML=`<div class="controls"><label class="field">Compression <select id="pdflevel"><option value="high">High quality</option><option value="balanced" selected>Balanced</option><option value="small">Smallest</option></select></label><button class="primary" data-action="pdf-compress">Compress PDF</button></div><div class="tool-note">Balanced/Smallest locally rasterize pages for stronger compression; selectable text may be flattened.</div>`;queue()}
  else if(id==="jpgpdf"){$("controls").innerHTML=`<button class="primary" data-action="image-pdf">Create PDF</button>`;queue()}
  else if(id==="pdfjpg"){$("controls").innerHTML=`<div class="controls"><label class="field">JPG quality <input id="jpgq" type="range" min="30" max="100" value="90"></label><button class="primary" data-action="pdf-to-jpg">Export JPGs</button></div>`;queue()}
  else if(id==="unlockpdf"){$("controls").innerHTML=`<button class="primary" data-action="unlock-pdf">Create unlocked copy</button><div class="tool-note danger-note">Encrypted PDFs may require the correct password.</div>`;queue()}
  else if(["wordpdf","pdfword","pdfexcel","excelpdf"].includes(id)){$("controls").innerHTML=`<button class="primary" data-action="conversion-run">Convert & download</button>`;queue()}
  else { /* fallback to original controls where present */ }
}

async function buildResizeUI(){
  const f=files[0], url=URL.createObjectURL(f);
  $("controls").innerHTML=`<div class="image-work"><div class="image-preview-card"><div class="preview-title">Preview</div><img id="resizePreview" src="${url}" alt="Preview"></div><div class="controls rich-controls">
  <label class="field wide">Preset <select id="resizePreset" data-action="apply-resize-preset"><option value="custom">Custom</option><option value="instagram">Instagram Post · 1080×1080</option><option value="instagram-story">Instagram Story · 1080×1920</option><option value="facebook">Facebook Post · 1200×630</option><option value="youtube">YouTube Thumbnail · 1280×720</option><option value="linkedin">LinkedIn Post · 1200×627</option><option value="x">X Post · 1600×900</option><option value="whatsapp">WhatsApp DP · 500×500</option></select></label>
  <label class="field">Width <input id="w" type="number" placeholder="auto" data-action="resize-state-update"></label><label class="field">Height <input id="h" type="number" placeholder="auto" data-action="resize-state-update"></label><label class="field">Unit <select id="unit"><option>px</option><option>%</option></select></label><label class="check"><input id="lock" type="checkbox" checked> Keep ratio</label>
  <label class="field wide">Target size <select id="sizeMode"><option value="none">No KB target</option><option value="kb">Target KB</option></select></label><label class="field">KB <input id="targetKB" type="number" placeholder="e.g. 200" min="1"></label>
  <label class="field">Format <select id="fmt"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><label class="field wide">Quality <input id="q" type="range" min="10" max="100" value="90" data-live-target="qv"></label><span id="qv" class="rangeval">90</span>
  <button class="primary" data-action="image-run">Resize & download</button></div></div>`;
  resizeState={url};
}
function applyResizePreset(){const p=$("resizePreset").value,map={instagram:[1080,1080],"instagram-story":[1080,1920],facebook:[1200,630],youtube:[1280,720],linkedin:[1200,627],x:[1600,900],whatsapp:[500,500]};if(!map[p])return;$('w').value=map[p][0];$('h').value=map[p][1];if($("lock"))$("lock").checked=false;}
function resizeStateUpdate(){}

async function buildCropUI(){
  const f=files[0],url=URL.createObjectURL(f);
  $("controls").innerHTML=`<div class="crop-editor"><div class="crop-canvas-wrap"><canvas id="cropCanvas"></canvas><div id="cropBox"></div></div><div class="controls rich-controls"><label class="field wide">Preset <select id="cropPreset" data-action="apply-crop-preset"><option value="free">Free crop</option><option value="square">Square 1:1</option><option value="passport">Passport · 35×45 mm</option><option value="passport2x2">Passport · 2×2 in</option><option value="instagram">Instagram · 1:1</option><option value="story">Story · 9:16</option><option value="youtube">YouTube · 16:9</option></select></label><label class="field">X <input id="cx" type="number"></label><label class="field">Y <input id="cy" type="number"></label><label class="field">Width <input id="cw" type="number"></label><label class="field">Height <input id="ch" type="number"></label><label class="field">Output <select id="cropFmt"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label><button class="primary" data-action="crop-download">Crop & download</button></div><div class="tool-note">Drag the crop box on the image, or enter exact X/Y/width/height values.</div></div>`;
  const img=await loadImageFile(f);cropState={img,scale:Math.min(1,760/img.width),x:0,y:0,w:img.width,h:img.height};setupCropCanvas();
}
function setupCropCanvas(){const s=cropState.scale,c=$("cropCanvas"),i=cropState.img;c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext("2d").drawImage(i,0,0,c.width,c.height);const box=$("cropBox");box.style.left="0px";box.style.top="0px";box.style.width=c.width+"px";box.style.height=c.height+"px";["cx","cy","cw","ch"].forEach((id,idx)=>$(id).value=[0,0,i.width,i.height][idx]);let dragging=false,sx=0,sy=0,ox=0,oy=0;c.onpointerdown=e=>{const r=c.getBoundingClientRect();dragging=true;sx=e.clientX-r.left;sy=e.clientY-r.top;ox=sx;oy=sy;c.setPointerCapture(e.pointerId)};c.onpointermove=e=>{if(!dragging)return;const r=c.getBoundingClientRect(),x=clamp(e.clientX-r.left,0,c.width),y=clamp(e.clientY-r.top,0,c.height);const left=Math.min(ox,x),top=Math.min(oy,y),w=Math.abs(x-ox),h=Math.abs(y-oy);if(w>5&&h>5){box.style.left=left+"px";box.style.top=top+"px";box.style.width=w+"px";box.style.height=h+"px";$("cx").value=Math.round(left/s);$("cy").value=Math.round(top/s);$("cw").value=Math.round(w/s);$("ch").value=Math.round(h/s)}};c.onpointerup=()=>dragging=false}
function applyCropPreset(){const p=$("cropPreset").value;if(!cropState)return;const iw=cropState.img.width,ih=cropState.img.height;let ratio=null;if(p==="square"||p==="instagram")ratio=1;if(p==="story")ratio=9/16;if(p==="youtube")ratio=16/9;if(p==="passport")ratio=35/45;if(p==="passport2x2")ratio=1;if(!ratio){$("cx").value=0;$("cy").value=0;$("cw").value=iw;$("ch").value=ih;return}let w=iw,h=Math.round(w/ratio);if(h>ih){h=ih;w=Math.round(h*ratio)}$("cx").value=Math.round((iw-w)/2);$("cy").value=Math.round((ih-h)/2);$("cw").value=w;$("ch").value=h;syncCropBox()}
function syncCropBox(){if(!cropState)return;const s=cropState.scale,box=$("cropBox");box.style.left=(+$('cx').value*s)+"px";box.style.top=(+$('cy').value*s)+"px";box.style.width=(+$('cw').value*s)+"px";box.style.height=(+$('ch').value*s)+"px"}
async function cropDownload(){const img=cropState.img,x=clamp(+$('cx').value||0,0,img.width-1),y=clamp(+$('cy').value||0,0,img.height-1),w=clamp(+$('cw').value||img.width,img.width-x),h=clamp(+$('ch').value||img.height,img.height-y),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h);saveCanvas(c,$('cropFmt').value,0.92)}

async function buildRemoveBgUI(){
  const f=files[0],url=URL.createObjectURL(f);$("controls").innerHTML=`<div class="bg-editor"><div class="bg-previews"><div><div class="preview-title">Original</div><img src="${url}" id="bgOriginal"></div><div><div class="preview-title">Result</div><canvas id="bgResult"></canvas></div></div><div class="controls rich-controls"><label class="field wide">Background <select id="bgColor"><option value="transparent">Transparent</option><option value="#ffffff">White</option><option value="#000000">Black</option><option value="#1e5eff">Passport Blue</option><option value="#22a447">Green</option><option value="#e9e9e9">Light Gray</option><option value="#f4d7b5">Skin/Beige</option><option value="custom">Custom</option></select></label><input id="bgCustom" type="color" value="#ffffff"><label class="field wide">Tolerance <input id="tol" type="range" min="5" max="100" value="35" data-live-target="tv"></label><span id="tv" class="rangeval">35</span><button class="primary" data-action="remove-background">Remove background</button><button class="ghost" data-action="download-bg-result">Download result</button></div></div>`;bgState={img:await loadImageFile(f)};renderBgPreview();
}
async function removeBackground(){if(!bgState)return;const img=bgState.img,c=document.createElement("canvas");c.width=img.width;c.height=img.height;const x=c.getContext("2d");x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data,t=(+$('tol').value||35)*2.55;let samples=[];for(let yy=0;yy<Math.min(30,c.height);yy++)for(let xx=0;xx<Math.min(30,c.width);xx++){let i=(yy*c.width+xx)*4;samples.push([p[i],p[i+1],p[i+2]])}let avg=samples.reduce((a,v)=>[a[0]+v[0],a[1]+v[1],a[2]+v[2]],[0,0,0]).map(v=>v/samples.length);for(let i=0;i<p.length;i+=4){let dist=Math.hypot(p[i]-avg[0],p[i+1]-avg[1],p[i+2]-avg[2]);if(dist<t)p[i+3]=0}x.putImageData(d,0,0);bgState.result=c;renderBgPreview();$('status').textContent='Background removed. Choose a background color and download.'}
function renderBgPreview(){if(!bgState)return;const c=$('bgResult');if(!c)return;const r=bgState.result||bgState.img;c.width=Math.min(760,r.width);c.height=Math.round(r.height*(c.width/r.width));const x=c.getContext('2d');const bg=$('bgColor')?.value;if(bg&&bg!=="transparent"){x.fillStyle=bg==="custom"?$('bgCustom').value:bg;x.fillRect(0,0,c.width,c.height)}x.drawImage(r,0,0,c.width,c.height)}
function downloadBgResult(){if(!bgState?.result){removeBackground();setTimeout(downloadBgResult,250);return}const bg=$('bgColor').value,c=document.createElement('canvas');c.width=bgState.result.width;c.height=bgState.result.height;const x=c.getContext('2d');if(bg!=="transparent"){x.fillStyle=bg==="custom"?$('bgCustom').value:bg;x.fillRect(0,0,c.width,c.height)}x.drawImage(bgState.result,0,0);saveCanvas(c,"image/png",1)}

async function buildWatermarkUI(){
  const f=files[0];const isImage=f.type.startsWith('image/');let preview='';if(isImage)preview=`<img id="wmImagePreview" src="${URL.createObjectURL(f)}" alt="Preview">`;else preview=`<canvas id="wmPdfPreview"></canvas>`;
  $("controls").innerHTML=`<div class="wm-editor"><div class="wm-preview">${preview}</div><div class="controls rich-controls"><label class="field wide">Watermark text <input id="wm" value="DOXFRAME"></label><label class="field">Opacity <input id="wmo" type="range" min="5" max="100" value="35" data-live-target="wmoVal"></label><span id="wmoVal" class="rangeval">35</span><label class="field">Size <input id="wmSize" type="number" value="32" min="8"></label><label class="field">Color <input id="wmColor" type="color" value="#ffffff"></label><label class="field">Rotation <input id="wmRot" type="number" value="-25" step="5"></label><label class="field">Position <select id="wmPos"><option value="center">Center</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label><button class="primary" data-action="apply-watermark">Apply watermark & download</button></div></div>`;
  if(isImage){const img=await loadImageFile(f);window.__wmImage=img;renderWatermarkImage()}else{window.__wmPdfBytes=await f.arrayBuffer();renderWatermarkPdf()}
}
function wmPosition(w,h,tw,th){switch($('wmPos').value){case'top-left':return[30,30+th];case'top-right':return[w-30-tw,30+th];case'bottom-left':return[30,h-30];case'bottom-right':return[w-30-tw,h-30];default:return[(w-tw)/2,(h+th)/2]}}
function renderWatermarkImage(){const img=window.__wmImage,c=document.createElement('canvas');c.width=Math.min(900,img.width);c.height=Math.round(img.height*c.width/img.width);const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);drawWm(x,c.width,c.height);const holder=document.querySelector('.wm-preview');holder.innerHTML='';holder.appendChild(c);window.__wmCanvas=c}
function drawWm(x,w,h){const text=$('wm')?.value||'DOXFRAME',size=+$('wmSize')?.value||32,op=(+$('wmo')?.value||35)/100,rot=(+$('wmRot')?.value||0)*Math.PI/180;x.save();x.globalAlpha=op;x.fillStyle=$('wmColor')?.value||'#fff';x.font=`700 ${size}px Arial`;const tw=x.measureText(text).width,[px,py]=wmPosition(w,h,tw,size);x.translate(px+tw/2,py-size/2);x.rotate(rot);x.fillText(text,-tw/2,size/2);x.restore()}
async function renderWatermarkPdf(){try{const pdfjs=await ensurePDFJS(),pdf=await pdfjs.getDocument({data:new Uint8Array(window.__wmPdfBytes),isEvalSupported:false,enableScripting:false}).promise,page=await pdf.getPage(1),vp=page.getViewport({scale:.75}),c=$('wmPdfPreview');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const x=c.getContext('2d');drawWm(x,c.width,c.height)}catch(e){console.error(e)}}
async function applyWatermark(){try{if(window.__wmImage){const img=window.__wmImage,c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);drawWm(x,c.width,c.height);saveCanvas(c,'image/png',1);$('status').textContent='Watermark applied to image.';return}let d=await PDFLib.PDFDocument.load(window.__wmPdfBytes),font=await d.embedFont(PDFLib.StandardFonts.HelveticaBold),text=$('wm').value||'DOXFRAME',op=(+$('wmo').value||35)/100,size=+$('wmSize').value||32,color=hexRgb($('wmColor').value),rot=+$('wmRot').value||0;for(const p of d.getPages()){const {width,height}=p.getSize(),tw=font.widthOfTextAtSize(text,size);let [x,y]=wmPosition(width,height,tw,size);p.drawText(text,{x,y:y-size/2,size,font,color:PDFLib.rgb(...color),opacity:op,rotate:PDFLib.degrees(rot)})}download(new Blob([await d.save()],{type:'application/pdf'}),'doxframe-watermarked.pdf');$('status').textContent='Watermark applied to PDF.'}catch(e){console.error(e);toast('Watermark failed. Try another file.')}}
function applyWmPreview(){if(window.__wmImage)renderWatermarkImage();else renderWatermarkPdf()}

async function buildOrganiseUI(){
  $("controls").innerHTML=`<div class="controls"><button class="primary" data-action="save-organised-pdf">Save organised PDF</button><button class="ghost" data-action="org-add-blank">Add blank page</button><button class="ghost" data-action="org-duplicate">Duplicate selected</button><button class="ghost" data-action="org-select-all">Restore all pages</button></div><div id="orgPreview" class="org-preview"></div><div class="tool-note">Drag pages to reorder. Rotate, duplicate, add a blank page, or remove pages before saving.</div>`;await renderOrganise();
}
async function renderOrganise(){try{const pdfjs=await ensurePDFJS(),pdf=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableScripting:false}).promise;assertPdfPageCount(pdf.numPages);if(!orgPages.length)orgPages=Array.from({length:pdf.numPages},(_,i)=>({id:'p'+(i+1),n:i+1,rot:0,type:'source'}));const box=$("orgPreview");box.innerHTML='';for(const obj of orgPages){const card=document.createElement('div');card.className='org-page';card.draggable=true;card.dataset.id=obj.id;if(obj.id===orgSelectedId)card.classList.add('selected');const c=document.createElement('canvas');const a=document.createElement('div');a.className='org-actions';a.innerHTML=`<b>${obj.type==='blank'?'Blank page':'Page '+obj.n}</b><button type="button" data-action="org-rotate" data-page="${obj.id}">↻ Rotate</button><button type="button" data-action="org-duplicate" data-page="${obj.id}">Duplicate</button><button type="button" data-action="org-delete" data-page="${obj.id}">Delete</button>`;card.append(c,a);box.appendChild(card);if(obj.type==='blank'){c.width=180;c.height=250;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#d7dbe4';x.strokeRect(.5,.5,c.width-1,c.height-1)}else{const page=await pdf.getPage(obj.n),vp=page.getViewport({scale:.55,rotation:obj.rot});assertPdfRenderSize(vp.width,vp.height);c.width=vp.width;c.height=vp.height;await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise}card.addEventListener('click',()=>{orgSelectedId=obj.id;document.querySelectorAll('.org-page').forEach(x=>x.classList.remove('selected'));card.classList.add('selected')});card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',obj.id));card.addEventListener('dragover',e=>e.preventDefault());card.addEventListener('drop',e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain'),to=obj.id;if(from===to)return;const fi=orgPages.findIndex(x=>x.id===from),ti=orgPages.findIndex(x=>x.id===to);if(fi<0||ti<0)return;const it=orgPages.splice(fi,1)[0];orgPages.splice(ti,0,it);renderOrganise()})}$("status").textContent=`${orgPages.length} page(s) ready.`}catch(e){console.error(e);$("status").textContent='Could not preview this PDF.'}}
function orgRotate(id){const o=orgPages.find(x=>x.id===id);if(o)o.rot=(o.rot+90)%360;renderOrganise()}
function orgDelete(id){if(orgPages.length<=1){toast('Keep at least one page.');return}orgPages=orgPages.filter(x=>x.id!==id);renderOrganise()}
function orgDuplicate(id=orgSelectedId){const i=orgPages.findIndex(x=>x.id===id);if(i<0)return;const src=orgPages[i];orgPages.splice(i+1,0,{...src,id:'p'+Date.now()+Math.random().toString(16).slice(2)});renderOrganise()}
function orgAddBlank(){orgPages.push({id:'b'+Date.now(),n:0,rot:0,type:'blank'});renderOrganise()}
async function orgSelectAll(){if(!files[0])return;try{const pdfjs=await ensurePDFJS();const pdf=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableScripting:false}).promise;assertPdfPageCount(pdf.numPages);orgPages=Array.from({length:pdf.numPages},(_,i)=>({id:'p'+(i+1),n:i+1,rot:0,type:'source'}));orgSelectedId=null;renderOrganise()}catch(e){toast('Could not restore the original pages.')}}
async function saveOrganisedPDF(){try{if(!orgPages.length){toast('No pages selected.');return}const src=await PDFLib.PDFDocument.load(await files[0].arrayBuffer());assertPdfPageCount(src.getPageCount());const out=await PDFLib.PDFDocument.create();for(const o of orgPages){if(o.type==='blank'){out.addPage([595.28,841.89]);continue}const [p]=await out.copyPages(src,[o.n-1]);p.setRotation(PDFLib.degrees(o.rot));out.addPage(p)}download(new Blob([await out.save()],{type:'application/pdf'}),'doxframe-organised.pdf');$("status").textContent='Organised PDF downloaded.'}catch(e){console.error(e);toast('Could not create organised PDF.')}}

async function buildEditUI(){
  $("controls").innerHTML=`<div class="edit-editor"><div class="edit-main"><div class="preview-title">PDF preview</div><div id="editPageCanvasWrap" class="edit-page-wrap"></div><div id="editThumbs" class="edit-thumbs"></div></div><div class="edit-tools"><div class="tool-section"><b>Editing tools</b><div class="controls"><button class="ghost" data-action="edit-mode" data-mode="text">Text</button><button class="ghost" data-action="edit-mode" data-mode="highlight">Highlight</button><button class="ghost" data-action="edit-mode" data-mode="whiteout">Whiteout</button><button class="ghost" data-action="edit-mode" data-mode="box">Box</button></div></div><label class="field wide">Text <input id="et" placeholder="Type text"></label><label class="field">Size <input id="eSize" type="number" value="18"></label><label class="field">Color <input id="eColor" type="color" value="#111111"></label><label class="field">Opacity <input id="eOpacity" type="range" min="10" max="100" value="70"></label><div class="controls"><button class="primary" data-action="edit-add-text">Add text</button><button class="ghost" data-action="edit-undo">Undo</button><button class="ghost" data-action="edit-redo">Redo</button><button class="ghost" data-action="edit-clear-page">Clear page changes</button></div><button class="primary wide-btn" data-action="edit-pdf">Save edited PDF</button><div class="tool-note">Select a page, choose a tool, then tap/click the PDF preview to place it. Text can also be entered with exact coordinates below.</div><div class="controls"><label class="field">X <input id="ex" type="number" value="50"></label><label class="field">Y <input id="ey" type="number" value="50"></label><label class="field">W <input id="ew" type="number" value="120"></label><label class="field">H <input id="eh" type="number" value="60"></label></div></div></div>`;
  await loadEditPdf();
}
async function loadEditPdf(){try{const pdfjs=await ensurePDFJS(),pdf=await pdfjs.getDocument({data:await files[0].arrayBuffer(),isEvalSupported:false,enableScripting:false}).promise;assertPdfPageCount(pdf.numPages);editPdfDoc=pdf;editPages=Array.from({length:pdf.numPages},(_,i)=>i+1);editSelected=1;editActions=[];editHistory=[];editFuture=[];await renderEditPage();renderEditThumbs();$('status').textContent=`${pdf.numPages} page(s) loaded. Click a page to edit.`}catch(e){console.error(e);$('status').textContent='Could not render this PDF.'}}
async function renderEditPage(){const page=await editPdfDoc.getPage(editSelected),vp=page.getViewport({scale:Math.min(1.05,820/page.getViewport({scale:1}).width)}),wrap=$('editPageCanvasWrap');wrap.innerHTML='';const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;wrap.appendChild(c);await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;const base=page.getViewport({scale:1});$('ex').value=Math.round(px*base.width);$('ey').value=Math.round((1-py)*base.height);if(window.__editMode==='text')editAddText();else if(window.__editMode==='highlight')editAddShape('highlight',px*base.width,(1-py)*base.height,140,45);else if(window.__editMode==='whiteout')editAddShape('whiteout',px*base.width,(1-py)*base.height,160,55);else if(window.__editMode==='box')editAddShape('box',px*base.width,(1-py)*base.height,160,70)});renderEditActionsOverlay(c, page.getViewport({scale:1}), vp)}
function renderEditActionsOverlay(c,base,vp){const wrap=$('editPageCanvasWrap');for(const a of editActions.filter(x=>x.page===editSelected)){const el=document.createElement('div');el.className='edit-marker '+a.type;let x=a.x/base.width*vp.width,y=(1-a.y/base.height)*vp.height;if(a.type==='text')el.textContent=a.text;el.style.left=x+'px';el.style.top=Math.max(0,y-(a.h||a.size||20))+'px';el.style.width=(a.w||140)/base.width*vp.width+'px';el.style.height=(a.h||a.size||20)/base.height*vp.height+'px';wrap.appendChild(el)}}
function renderEditThumbs(){const box=$('editThumbs');box.innerHTML='';editPages.forEach(n=>{const b=document.createElement('button');b.className='edit-thumb'+(n===editSelected?' active':'');b.textContent='Page '+n;b.addEventListener('click',()=>{editSelected=n;renderEditPage();renderEditThumbs()});box.appendChild(b)})}
function editMode(m){window.__editMode=m;toast(m==='text'?'Tap the page where the text should go.':'Tap the page to place '+m+'.')}
function pushEditChange(next){editHistory=[...editHistory,editActions].slice(-30);editFuture=[];editActions=next;renderEditPage()}
function editAddText(){const text=$('et').value||'DOXFRAME';pushEditChange([...editActions,{page:editSelected,type:'text',text,x:+$('ex').value||50,y:+$('ey').value||50,size:+$('eSize').value||18,color:$('eColor').value,opacity:+$('eOpacity').value/100,w:Math.max(80,text.length*10),h:+$('eSize').value||18}])}
function editAddShape(type,x,y,w,h){pushEditChange([...editActions,{page:editSelected,type,x,y,w:+$('ew').value||w,h:+$('eh').value||h,color:type==='highlight'?'#ffe66d':type==='whiteout'?'#ffffff':'#ef4444',opacity:+$('eOpacity').value/100}])}
function editClearPage(){pushEditChange(editActions.filter(a=>a.page!==editSelected))}
function editUndo(){const prev=editHistory.at(-1);if(!prev)return;editFuture=[editActions,...editFuture].slice(0,30);editHistory=editHistory.slice(0,-1);editActions=prev;renderEditPage()}
function editRedo(){const next=editFuture[0];if(!next)return;editHistory=[...editHistory,editActions].slice(-30);editFuture=editFuture.slice(1);editActions=next;renderEditPage()}
async function editPDF(){try{const d=await PDFLib.PDFDocument.load(await files[0].arrayBuffer());assertPdfPageCount(d.getPageCount());const font=await d.embedFont(PDFLib.StandardFonts.Helvetica);for(const a of editActions){const p=d.getPages()[a.page-1];if(!p)continue;if(a.type==='text'){const [r,g,b]=hexRgb(a.color);p.drawText(a.text,{x:a.x,y:a.y,size:a.size,font,color:PDFLib.rgb(r,g,b),opacity:a.opacity})}else{const [r,g,b]=hexRgb(a.color);p.drawRectangle({x:a.x,y:a.y-a.h,width:a.w,height:a.h,color:PDFLib.rgb(r,g,b),opacity:a.opacity,borderColor:a.type==='box'?PDFLib.rgb(r,g,b):undefined,borderWidth:a.type==='box'?2:0})}}download(new Blob([await d.save()],{type:'application/pdf'}),'doxframe-edited.pdf');$('status').textContent='Edited PDF downloaded.'}catch(e){console.error(e);toast('Could not save the edited PDF.')}}

/* Live image watermark controls */
document.addEventListener('input',e=>{if(['wm','wmo','wmSize','wmColor','wmRot','wmPos'].includes(e.target.id)){if(window.__wmImage)renderWatermarkImage();else if(window.__wmPdfBytes)renderWatermarkPdf();}if(['bgColor','bgCustom'].includes(e.target.id))renderBgPreview();});

/* Allow the watermark tool to accept both PDF and image files. */
function showTool(id){
  document.body.classList.add("tool-page-mode");
  active=id;files=[];orgPages=[];orgSelectedId=null;editActions=[];editHistory=[];editFuture=[];cropState=null;bgState=null;window.__wmImage=null;window.__wmPdfBytes=null;
  $("workspace").classList.add("show");let t=TOOLS.find(x=>x.id===id);if(t){$("wt").textContent=t.n;$("wh").textContent=(id==="watermarkpdf"?"PDF + image workflow":t.cat==="pdf"?"PDF workflow":"Image workflow")}
  $("file").value="";
  const acceptMap={
    mergepdf:".pdf,application/pdf",splitpdf:".pdf,application/pdf",compresspdf:".pdf,application/pdf",
    wordpdf:".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pdfexcel:".pdf,application/pdf",pdfword:".pdf,application/pdf",jpgpdf:".jpg,.jpeg,image/jpeg",pdfjpg:".pdf,application/pdf",
    editpdf:".pdf,application/pdf",excelpdf:".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls",
    watermarkpdf:".pdf,application/pdf,image/jpeg,image/png,image/webp",unlockpdf:".pdf,application/pdf",
    organisepdf:".pdf,application/pdf",resize:"image/*",crop:"image/*",removebg:"image/*",bulkresize:"image/*",compressimg:"image/*",convertimg:"image/*,.heic,.heif",passport:"image/*",signature:"image/*"
  };
  $("file").accept=acceptMap[id]||"";
  $("file").multiple=["mergepdf","jpgpdf","bulkresize","convertimg"].includes(id);
  $("controls").innerHTML="";$("status").textContent="";
  const dz=$("drop"); if(dz && !dz.querySelector(".drop-note")){const n=document.createElement("div");n.className="drop-note";n.textContent="Maximum 50 MB per file. Browser-first tools process files locally whenever possible.";dz.querySelector("div")?.appendChild(n);}
}

/* DOXFRAME V17 production guard: file validation + server-side usage reservation */
const I24_MAX_FILE_BYTES = 50 * 1024 * 1024;
const I24_MAX_IMAGE_PIXELS = 40_000_000;
const I24_MAX_PDF_PAGES_PREVIEW = 250;
const I24_MAX_CANVAS_DIMENSION = 10000;
const I24_MAX_PDF_RENDER_PIXELS = 25_000_000;
const I24_MAX_BULK_FILES = 50;
function assertPdfPageCount(n){if(Number(n)>I24_MAX_PDF_PAGES_PREVIEW)throw new Error(`PDF exceeds the browser safety limit of ${I24_MAX_PDF_PAGES_PREVIEW} pages.`);}
function assertCanvasSize(w,h,label='image'){w=Number(w);h=Number(h);if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>I24_MAX_CANVAS_DIMENSION||h>I24_MAX_CANVAS_DIMENSION||w*h>I24_MAX_IMAGE_PIXELS)throw new Error(`${label} is too large for safe browser processing.`);}
function assertPdfRenderSize(w,h){w=Number(w);h=Number(h);if(!Number.isFinite(w)||!Number.isFinite(h)||w>I24_MAX_CANVAS_DIMENSION||h>I24_MAX_CANVAS_DIMENSION||w*h>I24_MAX_PDF_RENDER_PIXELS)throw new Error('This PDF page is too large for safe browser rendering.');}
function validateToolFiles(){
  if(!files.length)return false;
  if(files.length > I24_MAX_BULK_FILES){ toast(`Please select no more than ${I24_MAX_BULK_FILES} files at once.`); return false; }
  for(const f of files){ if(f.size > I24_MAX_FILE_BYTES){ toast(`${f.name} is larger than 50 MB.`); return false; } }
  const imageIds=new Set(['resize','crop','removebg','bulkresize','compressimg','convertimg','passport','signature']);
  const imageOk=f=>/^image\/(jpeg|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.type)||/\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name);
  const pdfOk=f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name);
  const docxOk=f=>f.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'||/\.docx$/i.test(f.name);
  const xlsOk=f=>['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'].includes(f.type)||/\.(xlsx?|xls)$/i.test(f.name);
  if(imageIds.has(active) && files.some(f=>!imageOk(f))){toast('Please choose a supported image file.');return false;}
  if(active==='jpgpdf' && files.some(f=>!/^image\/(jpeg|jpg)$/i.test(f.type)&&!/\.jpe?g$/i.test(f.name))){toast('JPG to PDF accepts JPG/JPEG files only.');return false;}
  if(['mergepdf','splitpdf','compresspdf','pdfexcel','pdfword','pdfjpg','editpdf','unlockpdf','organisepdf'].includes(active) && files.some(f=>!pdfOk(f))){toast('Please choose a PDF file.');return false;}
  if(active==='wordpdf' && files.some(f=>!docxOk(f))){toast('Word to PDF currently supports DOCX files.');return false;}
  if(active==='excelpdf' && files.some(f=>!xlsOk(f))){toast('Excel to PDF accepts XLS/XLSX files.');return false;}
  if(active==='watermarkpdf' && files.some(f=>!(pdfOk(f)||/^image\/(jpeg|png|webp)$/i.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name)))){toast('Watermark accepts PDF, JPG, PNG or WebP files.');return false;}
  return true;
}
const TOOL_API_IDS={mergepdf:'merge-pdf',splitpdf:'split-pdf',compresspdf:'compress-pdf',wordpdf:'word-to-pdf',pdfexcel:'pdf-to-excel',pdfword:'pdf-to-word',jpgpdf:'jpg-to-pdf',pdfjpg:'pdf-to-jpg',editpdf:'edit-pdf',excelpdf:'excel-to-pdf',watermarkpdf:'watermark-pdf',unlockpdf:'unlock-pdf',organisepdf:'organise-pdf',resize:'image-resizer',crop:'crop-image',removebg:'remove-background',bulkresize:'bulk-image-resizer',compressimg:'image-compressor',convertimg:'image-converter',passport:'passport-photo-maker',signature:'signature-resizer'};
async function reserveToolJob(){
  if(!validateToolFiles())return null;
  try{
    const apiTool=TOOL_API_IDS[active]||active;
    const r=await fetch('/api/jobs/reserve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:apiTool})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){toast(j.error||'Daily limit reached.');return null;}
    if($('status'))$('status').textContent=`Processing… ${j.remaining} jobs remaining today.`;
    return j.jobId||null;
  }catch(e){toast('Usage service is unavailable. Please try again.');return null;}
}
async function completeToolJob(jobId,status){if(!jobId)return;try{await fetch('/api/jobs/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId,status})})}catch(e){}}
function guardToolAction(name){
  const original=window[name];
  if(typeof original!=='function')return;
  window[name]=async function(...args){
    try{await ensureToolLibraries(active);}catch(e){toast(e.message||'A required library could not be loaded.');return;}
    const jobId=await reserveToolJob();
    if(!jobId)return;
    try{const result=await original.apply(this,args);await completeToolJob(jobId,'completed');return result;}catch(e){await completeToolJob(jobId,'failed');throw e;}
  };
}
['imageRun','removeBackground','bulkResize','imageCompress','imageConvert','passportPhoto','signatureResize','pdfMerge','pdfPages','pdfCompress','imagePDF','pdfToJpg','watermarkPDF','editPDF','unlockPDF','conversionRun','cropDownload','applyWatermark','saveOrganisedPDF'].forEach(guardToolAction);

// Unified processing indicator for every tool page.
(function(){const s=$("status");if(!s)return;const host=s.parentElement;const obs=new MutationObserver(()=>{let bar=host.querySelector(".process-bar");if(!bar){bar=document.createElement("div");bar.className="process-bar";s.insertAdjacentElement("afterend",bar)}const t=(s.textContent||"").toLowerCase();bar.classList.toggle("done",/^done|ready|created|merged|added|unlocked|saved|exported/.test(t));});obs.observe(s,{childList:true,characterData:true,subtree:true});})();

/* DOXFRAME V23.2 final tool bootstrap: every standalone tool page initializes from its URL. */
(function(){
  const m=location.pathname.toLowerCase().match(/\/tools\/([a-z0-9-]+)\.html$/);
  if(!m || m[1]==='image-to-text')return;
  const map={'merge-pdf':'mergepdf','split-pdf':'splitpdf','compress-pdf':'compresspdf','word-to-pdf':'wordpdf','pdf-to-excel':'pdfexcel','pdf-to-word':'pdfword','jpg-to-pdf':'jpgpdf','pdf-to-jpg':'pdfjpg','edit-pdf':'editpdf','excel-to-pdf':'excelpdf','watermark-pdf':'watermarkpdf','unlock-pdf':'unlockpdf','organise-pdf':'organisepdf','image-resize':'resize','crop-image':'crop','remove-background':'removebg','bulk-image-resize':'bulkresize','image-compressor':'compressimg','image-converter':'convertimg','passport-photo':'passport','signature-resizer':'signature'};
  const id=map[m[1]];if(!id)return;
  const start=()=>typeof bootToolPage==='function'&&bootToolPage(id);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
