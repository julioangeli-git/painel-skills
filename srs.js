/* ===== srs.js — material (grupos -> cartões), subcards e detalhar =====
   Carregado após o script inline do index.html. As funções de REVISÃO (flip/SM-2)
   continuam no inline; aqui ficam o material e os subcards. */

if(!state.started)state.started={};
if(!state.srs)state.srs={};
if(!state.pos)state.pos={};

function srsEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function srsJsq(s){return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');}
var SRS_LANG_MAP={'Italiano':'it-IT','Inglês':'en-US','English':'en-US'};
function srsTTSLang(){var s=APP&&APP.skills&&APP.skills[typeof curIdx!=='undefined'?curIdx:0];return (s&&SRS_LANG_MAP[s.name])||'it-IT';}
function srsSpeak(t){try{var u=new SpeechSynthesisUtterance(t);u.lang=srsTTSLang();speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}

/* karaokê aproximado: colore as sílabas (ks0,ks1...) conforme o áudio anda */
function srsSpeakKaraoke(text,pron){
  var sylls=pron?String(pron).split('-'):[];
  sylls.forEach(function(s,i){var e=document.getElementById('ks'+i);if(e){e.style.color='#7a8aa0';e.style.fontWeight='400';}});
  try{
    var u=new SpeechSynthesisUtterance(text);u.lang=srsTTSLang();
    var per=360;var timers=[];
    u.onstart=function(){sylls.forEach(function(s,i){timers.push(setTimeout(function(){var e=document.getElementById('ks'+i);if(e){e.style.color='#b85a28';e.style.fontWeight='700';}},Math.round(i*per)));});};
    u.onend=function(){timers.forEach(clearTimeout);};
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }catch(e){}
}

/* imagens-emoji (placeholder; w[3]=URL substitui por foto real) */
var EMOJI={"ciao":"👋","buongiorno":"🌅","buonasera":"🌆","buonanotte":"🌙","grazie":"🙏","prego":"🤲","scusa":"🙇","scusi":"🙇","per favore":"🙏","mi dispiace":"😔","sì":"✅","no":"❌","forse":"🤔","mai":"🚫","sempre":"♾️","basta":"✋","io":"🙋","tu":"👉","lui":"👨","lei":"👩","noi":"👥","voi":"👥","loro":"👫","signore":"🎩","signora":"👒","uomo":"👨","donna":"👩","ragazzo":"👦","ragazza":"👧","bambino":"🧒","casa":"🏠","città":"🏙️","via":"🛣️","piazza":"⛲","bar":"☕","ristorante":"🍽️","stazione":"🚉","farmacia":"💊","vado":"🚶","viene":"🚶","voglio":"🙋","posso":"🙆","capisco":"💡","parlo":"💬","bene":"👍","male":"👎","buono":"😋","grande":"🔺","piccolo":"🔹","bello":"😍","nuovo":"🆕","vero":"✔️","uno":"1️⃣","due":"2️⃣","tre":"3️⃣","quattro":"4️⃣","cinque":"5️⃣","sei":"6️⃣","sette":"7️⃣","otto":"8️⃣","nove":"9️⃣","dieci":"🔟","come":"❓","dove":"📍","chi":"🙋","sole":"☀️","gatto":"🐈","treno":"🚆","mare":"🌊"};
function matImg(w){return EMOJI[w]||'';}

/* ---- substituição de placeholders personalizados ---- */
function srsUserName(){return (typeof currentUser!=='undefined'&&currentUser&&currentUser.nome)?currentUser.nome:'Julio';}
function srsApplyPlaceholders(s){
  return String(s==null?'':s)
    .replace(/\[nome\]/gi, srsUserName())
    .replace(/\[cidade\]/gi, 'Milano')
    .replace(/\[città\]/gi, 'Milano')
    .replace(/\[país\]/gi, 'Brasil')
    .replace(/\[paese\]/gi, 'Brasile');
}

/* grupos (categorias) de um bloco */
function catsFor(d,k){
  var out=[];
  if(k==='v'){(d.words||[]).forEach(function(c){out.push({name:c.cat,items:(c.items||[]).map(function(w){return {f:w[0],b:w[1],pron:w[2]||'',img:w[3]||null};})});});}
  else if(k==='f'){
    // gera pron por palavras para karaokê nas frases
    out.push({name:'Frases-chave',items:(d.phrases||[]).map(function(p){
      var ft=srsApplyPlaceholders(p[0]);
      var bt=srsApplyPlaceholders(p[1]);
      var pron=ft.replace(/[.,?!]/g,'').split(/\s+/).filter(Boolean).join('-');
      return {f:ft,b:bt,pron:pron,img:null};
    })});
  }
  else if(k==='m'){
    out.push({name:'Versos da música',items:(d.songLines||[]).map(function(v,i){return {f:v,b:(d.songLinesTr&&d.songLinesTr[i])||'',pron:'',img:null};})});
    if(d.songWords&&d.songWords.length)out.push({name:'Palavras da música',items:d.songWords.map(function(w){return {f:w[0],b:w[1],pron:'',img:null};})});
  } else if(d.phrases){out.push({name:'Conteúdo',items:d.phrases.map(function(p){return {f:srsApplyPlaceholders(p[0]),b:srsApplyPlaceholders(p[1]),pron:'',img:null};})});}
  return out;
}
function blockTotal(d,k){return catsFor(d,k).reduce(function(a,c){return a+c.items.length;},0);}
function blockSeen(id,k,d){var cats=catsFor(d,k);var s=0;cats.forEach(function(c,ci){s+=Math.min(state.pos[id+'::'+k+'::'+ci]||0,c.items.length);});return s;}

/* cartão duplo (frente/verso) com bandeiras */
var FLAG_IT='<img src="https://flagcdn.com/w40/it.png" alt="IT" style="position:absolute;top:14px;right:16px;width:32px;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.25)">';
var FLAG_BR='<img src="https://flagcdn.com/w40/br.png" alt="BR" style="position:absolute;top:14px;right:16px;width:32px;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.25)">';
function bigPair(it){
  var vis=it.img||matImg(it.f);
  var visHtml=vis?(String(vis).indexOf('http')===0
     ?'<img src="'+srsEsc(vis)+'" alt="" style="width:110px;height:110px;object-fit:cover;border-radius:16px;margin-bottom:12px">'
     :'<div style="font-size:80px;line-height:1;margin-bottom:8px">'+vis+'</div>'):'';
  var pron=it.pron?'<div id="karaoke" style="font-size:16px;letter-spacing:.6px;margin-top:6px;color:var(--ink3,#7a8aa0)">'+String(it.pron).split('-').map(function(s,i){return '<span id="ks'+i+'">'+srsEsc(s)+'</span>';}).join(' ')+'</div>':'';
  return '<div class="mat-pair" style="display:flex;gap:22px;align-items:stretch;max-width:1000px;margin:0 auto">'
    +'<div class="mat-card-front" style="position:relative;flex:1;background:linear-gradient(135deg,#eaf4fb,#d4e9f5);border:2px solid #1c6b8c;border-radius:22px;padding:28px 22px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:290px">'
      +FLAG_IT+visHtml
      +'<div class="mat-word" style="font-size:34px;font-weight:800;color:#0f3d52">'+srsEsc(it.f)+'</div>'+pron
      +'<button class="btn" style="margin-top:14px;font-size:15px" onclick="srsSpeakKaraoke(\''+srsJsq(it.f)+'\',\''+srsJsq(it.pron||'')+'\')">🔊 ouvir</button>'
    +'</div>'
    +'<div class="mat-card-back" style="position:relative;flex:1;background:linear-gradient(135deg,#eef7ea,#d8efcf);border:2px solid #4f7a3a;border-radius:22px;padding:28px 22px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:28px;font-weight:800;color:#234a18;min-height:290px">'
      +FLAG_BR+srsEsc(it.b)+'</div></div>';
}

/* ---- página do bloco: nível A (grupos) ---- */
function openMaterial(id,k){
  if(typeof ensureMatView==='function')ensureMatView();
  _matBlock=id+'::'+k;
  if(!state.started)state.started={};state.started[id+'::'+k]=true;save();
  var names={v:'Vocabulário',f:'Frases-chave',m:'Música',i:'Imersão'};
  var t=(APP.skills[curIdx]?APP.skills[curIdx].topics.find(function(x){return x.id===id;}):null);
  document.getElementById('matTitle').textContent=(names[k]||'Material')+' · '+(t?t.t:id);
  renderCatCarousel(id,k);
  var detail=document.getElementById('detail');detail.style.display='none';
  var ov=document.getElementById('overview');if(ov)ov.style.display='none';
  var mv=document.getElementById('matView');
  // coloca a página de material no fluxo do conteúdo (dentro do .wrap, sob o cabeçalho)
  if(detail&&detail.parentNode&&mv.parentNode!==detail.parentNode){detail.parentNode.appendChild(mv);}
  ['position','top','left','right','bottom','overflow','zIndex','background'].forEach(function(p){mv.style[p]='';});
  mv.style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderCatCarousel(id,k){
  var d=RICH[id]||{};var cats=catsFor(d,k);
  var why=document.getElementById('matWhy');
  if(k==='v'&&d.why){why.style.display='block';why.textContent=d.why;}else{why.style.display='none';}
  var cur=0;for(var i=0;i<cats.length;i++){var sn=Math.min(state.pos[id+'::'+k+'::'+i]||0,cats[i].items.length);cur=i;if(sn<cats[i].items.length)break;}
  if(!document.getElementById('catRowStyle')){var st=document.createElement('style');st.id='catRowStyle';st.textContent='#catRow{scrollbar-width:thin;scrollbar-color:#c9b89a transparent}#catRow::-webkit-scrollbar{height:8px}#catRow::-webkit-scrollbar-track{background:transparent}#catRow::-webkit-scrollbar-thumb{background:#c9b89a;border-radius:8px}#catRow::-webkit-scrollbar-button{display:none;width:0}';document.head.appendChild(st);}
  var html='<div style="font-size:13px;opacity:.7;margin-bottom:6px">Escolha um grupo para estudar:</div>';
  html+='<div id="catRow" style="display:flex;gap:14px;overflow-x:auto;padding:16px 36%;scroll-snap-type:x mandatory">';
  cats.forEach(function(c,ci){
    var tot=c.items.length;var seen=Math.min(state.pos[id+'::'+k+'::'+ci]||0,tot);var pct=tot?Math.round(seen/tot*100):0;var done=seen>=tot&&tot>0;
    html+='<div id="catcard'+ci+'" class="cat-card'+(done?' cat-done':'')+'" onclick="openCat(\''+id+'\',\''+k+'\','+ci+')" style="scroll-snap-align:center;flex:0 0 300px;cursor:pointer;border:2px solid '+(done?'#4f7a3a':(ci===cur?'#1c6b8c':'#e0d6c6'))+';border-radius:20px;background:'+(done?'#eef7ea':'var(--surface,#fff)')+';padding:24px;min-height:200px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,.08)">'
      +'<div style="font-weight:700;font-size:20px;color:var(--ink,#1c1408)">'+(done?'✓ ':'')+srsEsc(c.name)+'</div>'
      +'<div><div style="height:7px;background:var(--border,#eee);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(done?'#4f7a3a':'#1c6b8c')+'"></div></div>'
      +'<div style="font-size:12px;color:var(--ink3,#666);margin-top:5px">'+seen+'/'+tot+' · '+pct+'%</div></div></div>';
  });
  html+='</div>';
  document.getElementById('matBody').innerHTML=html;
  setTimeout(function(){var el=document.getElementById('catcard'+cur);if(el&&el.scrollIntoView)el.scrollIntoView({inline:'center',block:'nearest'});},60);
}

/* ---- nível B: cartões de um grupo ---- */
var _catId,_catK,_catCi,_wordItems=[],_wordPos=0;
function openCat(id,k,ci){
  var d=RICH[id]||{};var cats=catsFor(d,k);var c=cats[ci];if(!c)return;
  _catId=id;_catK=k;_catCi=ci;_wordItems=c.items;
  var seen=state.pos[id+'::'+k+'::'+ci]||0;
  _wordPos=Math.min(seen,c.items.length-1);if(_wordPos<0)_wordPos=0;
  renderWord(c.name);
}
function backToCats(){renderCatCarousel(_catId,_catK);}
function renderWord(catName){
  var body=document.getElementById('matBody');if(!body)return;
  var it=_wordItems[_wordPos];var n=_wordItems.length;
  var catKey=_catId+'::'+_catK+'::'+_catCi;
  state.pos[catKey]=Math.max(state.pos[catKey]||0,_wordPos+1);
  var d=RICH[_catId]||{};
  if(blockSeen(_catId,_catK,d)>=blockTotal(d,_catK)){state.done[_catId+'::'+_catK]=true;var bl=['v','f','m','i'];if(bl.every(function(x){return state.done[_catId+'::'+x];}))state.done[_catId]=true;}
  save();
  var isLast=_wordPos>=n-1;
  var nav='<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:22px">'
    +'<button class="btn" '+(_wordPos===0?'disabled style="opacity:.4"':'')+' onclick="wordPrev()">← Anterior</button>'
    +'<span style="font-size:13px;opacity:.7">'+(_wordPos+1)+' / '+n+'</span>'
    +(isLast
      ?'<button class="btn" style="background:var(--it-green,#007a3d);color:#fff;border:none;font-weight:700" onclick="backToCats()">✓ Concluir</button>'
      :'<button class="btn" onclick="wordNext()">Próximo →</button>')
    +'</div>';
  body.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<button class="btn" onclick="backToCats()">← grupos</button>'
    +'<span style="font-weight:700;text-transform:uppercase;letter-spacing:.5px;font-size:12px;color:var(--ink3,#888)">'+srsEsc(catName)+'</span><span></span></div>'
    +bigPair(it)+nav;
  setTimeout(function(){srsSpeakKaraoke(it.f,it.pron);},250);
}
function wordPrev(){if(_wordPos>0){_wordPos--;renderWordKeep();}}
function wordNext(){if(_wordPos<_wordItems.length-1){_wordPos++;renderWordKeep();}}
function renderWordKeep(){var d=RICH[_catId]||{};var cats=catsFor(d,_catK);renderWord(cats[_catCi].name);}

function closeMaterial(){
  document.getElementById('matView').style.display='none';
  document.getElementById('detail').style.display='block';
  if(typeof renderDetail==='function')renderDetail();
}

/* ---- 4 subcards (com progresso e descrição) ---- */
function matSubcardsHtml(t,lang){
  var id=t.id;var blocks=['v','f','m','i'];var d=RICH[id]||{};
  var names=lang?['Vocabulário','Frases-chave','Música','Imersão real']:['Conceito','Prática','Projeto','Validação'];
  return '<div class="macro-grid">'+blocks.map(function(k,idx){
    var key=id+'::'+k;var done=!!state.done[key];var started=!!(state.started&&state.started[key]);
    var crit=(t.trk&&t.trk[k])||'';
    var tot=blockTotal(d,k);var seen=blockSeen(id,k,d);var pct=tot?Math.round(seen/tot*100):0;
    var prog=tot?'<span style="font-weight:400;font-size:12px;opacity:.7;margin-left:6px">'+seen+'/'+tot+' · '+pct+'%</span>':'';
    var btns;
    if(done){btns='<button class="btn" style="background:#b85a28;color:#fff;border:none" onclick="matReiniciar(\''+id+'\',\''+k+'\')">↻ Reiniciar</button>';}
    else if(started){btns='<button class="btn" style="background:#2e7fa8;color:#fff;border:none" onclick="matStart(\''+id+'\',\''+k+'\')">▸ Continuar</button>'
      +'<button class="btn" style="background:#4f7a3a;color:#fff;border:none" onclick="matConcluir(\''+id+'\',\''+k+'\')">✓ Concluir</button>';}
    else{btns='<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700" onclick="matStart(\''+id+'\',\''+k+'\')">▶ Iniciar</button>';}
    return '<div class="sub-card'+(done?' sub-done':'')+'" style="border:1px solid '+(done?'#9ec79a':'var(--border2,#e0d6c6)')+';border-radius:14px;background:'+(done?'var(--sub-done-bg,#eef7ea)':'var(--surface,#fff)')+';padding:16px;display:flex;flex-direction:column;gap:10px;min-height:120px">'
      +'<div style="font-weight:700;font-size:15px;color:var(--ink,#1c1408)">'+(done?'✓ ':'')+srsEsc(names[idx])+prog+'</div>'
      +(crit?'<div style="font-size:12px;color:var(--ink3,#666);line-height:1.45">'+srsEsc(crit)+'</div>':'')
      +'<div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">'+btns+'</div></div>';
  }).join('')+'</div>';
}
function matStart(id,k){if(!state.started)state.started={};state.started[id+'::'+k]=true;save();openMaterial(id,k);}
function matConcluir(id,k){state.done[id+'::'+k]=true;var bl=['v','f','m','i'];if(bl.every(function(x){return state.done[id+'::'+x];}))state.done[id]=true;save();if(typeof renderDetail==='function')renderDetail();}
function matReiniciar(id,k){delete state.done[id+'::'+k];if(state.started)delete state.started[id+'::'+k];delete state.done[id];var cats=catsFor(RICH[id]||{},k);cats.forEach(function(c,ci){delete state.pos[id+'::'+k+'::'+ci];});save();if(typeof renderDetail==='function')renderDetail();}

/* ---- detalhar (recolhe a descrição) ---- */
function detalharHtml(id,rich){
  var safe=String(id).replace(/[^A-Za-z0-9]/g,'_');
  return '<div style="margin-top:10px"><button class="btn" style="font-size:13px" onclick="toggleDetalhe(\''+safe+'\',this)">▾ Detalhar</button>'
    +'<div id="det-'+safe+'" style="display:none;margin-top:8px">'+rich+'</div></div>';
}
function toggleDetalhe(safe,btn){var e=document.getElementById('det-'+safe);if(!e)return;var open=e.style.display==='none';e.style.display=open?'block':'none';if(btn)btn.textContent=open?'▴ Ocultar detalhes':'▾ Detalhar';}

/* ===== Tricolore e bandeiras: só aparece no contexto italiano ===== */
function srsUpdateTricolore(show){
  var t=document.querySelector('.tricolore');
  if(t)t.style.display=show?'grid':'none';
}

/* ===== Cards tracejados para skills sem progresso ===== */
function skillHasProgress(s){
  if(!s||!s.topics)return false;
  return s.topics.some(function(t){
    var k=t.id;
    return !!(state.done[k]||state.done[k+'::v']||state.done[k+'::f']||(state.started&&(state.started[k+'::v']||state.started[k+'::f']||state.started[k+'::m']||state.started[k+'::i'])));
  });
}
function skillCard(s,i){
  if(!skillHasProgress(s)){
    return '<div class="sk-card" data-i="'+i+'" style="animation-delay:'+(i*55)+'ms;border-style:dashed;border-width:2px;cursor:pointer" onclick="openDetail('+i+')">'
      +'<div class="sk-body" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;gap:10px;padding:24px">'
      +'<div style="font-size:44px;font-weight:300;color:var(--ink3);line-height:1">+</div>'
      +'<div class="sk-name" style="text-align:center">'+s.name+'</div>'
      +'<div style="font-size:12px;color:var(--ink3);text-align:center">Adicione esta skill ao seu plano</div>'
      +'</div></div>';
  }
  var c=compute(s);
  var lvl=s.lang?(APP.cefr[c.cl]||'A0')+' → '+APP.cefr[s.target]:'N'+c.cl+' → N'+s.target;
  var stTxt={ok:'No prazo',alert:'Alerta',keep:'—'};
  return '<div class="sk-card" data-i="'+i+'" style="animation-delay:'+(i*55)+'ms">'
    +'<div class="sk-body">'
    +'<div class="sk-top"><div class="sk-name">'+s.name+'</div><span class="sk-pill '+c.st+'">'+stTxt[c.st]+'</span></div>'
    +'<div class="sk-ring-row">'
    +'<div class="ringwrap" style="width:68px;height:68px">'+ring(c.pct,68,7)+'<div class="pc" style="font-size:13px">'+Math.round(c.pct*100)+'%</div></div>'
    +'<div class="sk-meta">'
    +'<div class="sk-lvl">'+(s.lang?'CEFR':'Nível')+' '+lvl+'</div>'
    +'<div class="sk-rem">Restam <b>'+c.rem+'h</b>'+(c.days?' · ~'+c.days+'d':'')+'</div>'
    +(c.proj?'<div class="sk-proj">proj. '+fmt(c.proj)+'</div>':'')
    +'</div></div>'
    +'<div class="sk-next">'+(c.next?'→ <b>'+c.next.t+'</b>':'<b>✓ Alvo atingido</b>')+'</div>'
    +'</div></div>';
}
function miniCard(s,i){
  if(!skillHasProgress(s)){
    var pc=(typeof PC!=='undefined'?PC[s.priority]:'#aaa')||'#aaa';
    return '<div class="sk-mini" data-i="'+i+'" style="--pc:'+pc+';animation-delay:'+(i*45)+'ms;border-style:dashed;opacity:.65" onclick="openDetail('+i+')">'
      +'<div class="mn" style="display:flex;gap:6px;align-items:center">'
      +'<span style="font-size:16px;font-weight:300;color:var(--ink3)">+</span>'
      +'<span>'+s.name+'</span></div>'
      +'<div style="font-size:11px;color:var(--ink3)">Não iniciado</div>'
      +'</div>';
  }
  var c=compute(s);var pc=(typeof PC!=='undefined'?PC[s.priority]:'#aaa')||'#aaa';
  var lvl=s.lang?(APP.cefr[c.cl]||'A0'):'N'+c.cl;
  return '<div class="sk-mini" data-i="'+i+'" style="--pc:'+pc+';animation-delay:'+(i*45)+'ms">'
    +'<div class="mn"><span class="mdot"></span>'+s.name+'</div>'
    +'<div class="mbar"><div class="mbar-fg" style="width:'+Math.round(c.pct*100)+'%"></div></div>'
    +'<div class="ms"><span>'+lvl+' · '+Math.round(c.pct*100)+'%</span><span>'+c.rem+'h rest.</span></div>'
    +'</div>';
}

/* ===== Configurações: paleta de cores e título ===== */
var THEMES={
  'Itália (padrão)':{},
  'Noite':{
    '--bg':'#1e1b16','--bg2':'#26221b','--surface':'#2a261e','--surface2':'#332e24',
    '--ink':'#f2ecdd','--ink2':'#cdbf9f','--ink3':'#9a8a66',
    '--border':'rgba(255,240,210,.12)','--border2':'rgba(255,240,210,.2)',
    '--sub-done-bg':'#1a2e19',
    '_theme':'noite'
  },
  'Oceano':{'--bg':'#eaf2f7','--bg2':'#dde9f1','--surface':'#f7fbfe','--surface2':'#eef5fa','--terra':'#1c6b8c','--terra-g':'#2e8bb0','--gold':'#3a7ca5','--ink':'#10222c','--ink2':'#33586b'},
  'Floresta':{'--bg':'#eef3e7','--bg2':'#e2ead6','--surface':'#f8fbf3','--surface2':'#eef4e6','--terra':'#4f7a3a','--terra-g':'#67995a','--gold':'#7a9a3a','--ink':'#16240f','--ink2':'#33502a'},
  'Rosé':{'--bg':'#f7ecec','--bg2':'#f1dede','--surface':'#fdf6f6','--surface2':'#f8eaea','--terra':'#b8485f','--terra-g':'#d46a80','--gold':'#c4708a','--ink':'#2a1218','--ink2':'#6b3340'}
};
var THEME_VARS=['--bg','--bg2','--surface','--surface2','--ink','--ink2','--ink3','--terra','--terra-g','--gold','--border','--border2','--sub-done-bg'];
function srsApplyTheme(name){
  var t=THEMES[name]||{};var r=document.documentElement;
  THEME_VARS.forEach(function(v){r.style.removeProperty(v);});
  Object.keys(t).forEach(function(v){if(v.startsWith('--'))r.style.setProperty(v,t[v]);});
  // data-theme para overrides CSS de elementos com cores hardcoded
  r.setAttribute('data-theme', t['_theme']||'');
  try{localStorage.setItem('painelTheme',name);}catch(e){}
}
function srsApplyTitle(t){
  var h=document.querySelector('.top h1');if(!h)return;
  if(window._origTitleHTML===undefined)window._origTitleHTML=h.innerHTML;
  if(t&&String(t).trim()){h.textContent=t;}else{h.innerHTML=window._origTitleHTML;}
  try{localStorage.setItem('painelTitle',t||'');}catch(e){}
}
function srsOpenConfig(){
  var ov=document.getElementById('cfgOverlay');
  if(!ov){ov=document.createElement('div');ov.id='cfgOverlay';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:3000;display:flex;align-items:center;justify-content:center';ov.onclick=function(e){if(e.target===ov)ov.style.display='none';};document.body.appendChild(ov);}
  var cur='';try{cur=localStorage.getItem('painelTitle')||'';}catch(e){}
  var sw=Object.keys(THEMES).map(function(n){var c=THEMES[n]['--bg']||'#f2ead8';var a=THEMES[n]['--terra']||'#b85a28';return '<button onclick="srsApplyTheme(\''+srsJsq(n)+'\')" style="cursor:pointer;border:1px solid #ccc;border-radius:10px;padding:8px 10px;margin:4px;background:'+c+';color:'+(n==='Noite'?'#f2ecdd':'#1c1408')+';font-weight:600;font-size:13px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+a+';margin-right:6px"></span>'+srsEsc(n)+'</button>';}).join('');
  ov.innerHTML='<div onclick="event.stopPropagation()" style="background:var(--surface,#fdf9f2);color:var(--ink,#1c1408);border-radius:16px;padding:24px;max-width:440px;width:90%;box-shadow:0 12px 44px rgba(0,0,0,.3)">'
    +'<div style="font-weight:700;font-size:18px;margin-bottom:16px">⚙ Configurações</div>'
    +'<label style="font-size:13px;font-weight:600">Título do painel</label>'
    +'<input id="cfgTitle" value="'+srsEsc(cur)+'" placeholder="Mudança para a Itália" style="width:100%;padding:9px;margin:6px 0 6px;border:1px solid #ccc;border-radius:8px;font-size:14px">'
    +'<button class="btn" style="margin-bottom:18px" onclick="srsApplyTitle(document.getElementById(\'cfgTitle\').value)">Salvar título</button>'
    +'<div style="font-size:13px;font-weight:600;margin-bottom:8px">Paleta de cores</div><div style="display:flex;flex-wrap:wrap">'+sw+'</div>'
    +'<div style="text-align:right;margin-top:18px"><button class="btn" onclick="document.getElementById(\'cfgOverlay\').style.display=\'none\'">Fechar</button></div></div>';
  ov.style.display='flex';
}
function srsInitUI(){
  var anchor=document.getElementById('expBtn')||document.getElementById('logoutBtn');
  if(anchor&&anchor.parentNode&&!document.getElementById('cfgBtn')){var b=document.createElement('button');b.id='cfgBtn';b.className='btn';b.textContent='⚙ Tema';b.onclick=srsOpenConfig;anchor.parentNode.insertBefore(b,anchor);}
  try{var th=localStorage.getItem('painelTheme');if(th)srsApplyTheme(th);}catch(e){}
  try{var ti=localStorage.getItem('painelTitle');if(ti)srsApplyTitle(ti);}catch(e){}

  // Injetar CSS global para: tema escuro, sec-flags ocultas, tricolore condicional
  if(!document.getElementById('srsGlobalStyles')){
    var css=document.createElement('style');css.id='srsGlobalStyles';css.textContent=
      /* sec-flags: remover banderinhas italianas hardcoded do header da overview */
      '.sec-flag{display:none!important}'
      /* tricolore: oculto por padrão, só aparece com .showing-italian no body */
      +'.tricolore{display:none!important}'
      +'body.showing-italian .tricolore{display:grid!important}'
      /* Tema Noite — corrigir cores hardcoded nos cards de material */
      +'[data-theme=noite] .mat-card-front{background:linear-gradient(135deg,#1a2a3a,#0d1e2d)!important;border-color:#2e7fa8!important}'
      +'[data-theme=noite] .mat-word{color:#a8d8f0!important}'
      +'[data-theme=noite] .mat-card-back{background:linear-gradient(135deg,#1a2e19,#112010)!important;border-color:#4f7a3a!important;color:#c8e6c0!important}'
      +'[data-theme=noite] .cat-card{background:#2a261e!important;color:#f2ecdd}'
      +'[data-theme=noite] .cat-card.cat-done{background:#1a2e19!important;border-color:#4f7a3a!important}'
      +'[data-theme=noite] .sub-card{background:#2a261e!important}'
      +'[data-theme=noite] .sub-card.sub-done{background:#1a2e19!important}'
      +'[data-theme=noite] #matWhy{background:#332e24!important;color:#cdbf9f!important}'
      +'[data-theme=noite] #matView{color:#f2ecdd}'
      /* Salvar e status de nuvem: ocultados (auto-save mantido em background) */
      +'#saveBtn{display:none!important}'
      +'#cloudStatus{display:none!important}'
      /* Header mobile: esconde elementos secundários, mantém brand + botões essenciais */
      +'@media(max-width:600px){'
      +'header.top{margin:6px 8px 0;border-radius:12px}'
      +'.top-in{height:auto!important;padding:6px 12px;gap:6px;flex-wrap:nowrap}'
      +'.kicker{display:none!important}'
      +'.brand h1{font-size:15px!important}'
      +'.date-field{display:none!important}'
      +'#expBtn{display:none!important}'
      +'.whoami-wrap{display:none!important}'
      +'.tools{gap:4px;flex-wrap:nowrap}'
      +'.btn{padding:5px 9px!important;font-size:8.5px!important}'
      +'.wrap{padding:8px 10px 80px!important}'
      /* Flashcards mobile: empilhados, altura proporcional à tela */
      +'.mat-pair{flex-direction:column!important;gap:10px!important}'
      +'.mat-card-front,.mat-card-back{min-height:38vh!important;font-size:22px!important}'
      +'}';
    document.head.appendChild(css);
  }

}
/* patch de back button para tricolore — hash routing faz o resto */
(function(){
  var backBtn=document.getElementById('back');
  if(backBtn&&!backBtn._srsPatchedBack){backBtn._srsPatchedBack=true;var ob=backBtn.onclick;backBtn.onclick=function(){if(ob)ob.call(this);document.body.classList.remove('showing-italian');srsHashSave('');};}
})();
if(document.querySelector('.top h1')){srsInitUI();}else{document.addEventListener('DOMContentLoaded',srsInitUI);}

/* ===== Hash routing: persiste a view atual na URL ===== */
function srsHashSave(hash){
  try{history.replaceState(null,'',location.pathname+(hash?'#'+hash:''));}catch(e){}
}
function srsHashRestore(){
  var h=(location.hash||'').replace('#','');
  if(!h)return;
  var parts=h.split(':');
  var view=parts[0];
  if(view==='detail'&&parts[1]!=null){
    var i=parseInt(parts[1],10);
    if(!isNaN(i)&&APP.skills[i])openDetail(i);
  } else if(view==='mat'&&parts[1]&&parts[2]){
    var id=decodeURIComponent(parts[1]+'::'+parts[2]+(parts[3]?'::'+parts[3]:''));
    var k=parts[parts.length-1];
    // id tem o formato Italiano::1::0, k é v/f/m/i
    var idFull=parts.slice(1,parts.length-1).join('::');
    var skillIdx=APP.skills.findIndex(function(s){return idFull.startsWith(s.name);});
    if(skillIdx>=0){openDetail(skillIdx);openMaterial(idFull,k);}
  }
}
(function srsHookNav(){
  if(window._srsNavPatched)return;window._srsNavPatched=true;
  // openDetail: hash + tricolore
  var _od=typeof openDetail==='function'?openDetail:null;
  if(_od){window.openDetail=function(i){_od(i);srsHashSave('detail:'+i);var isIt=APP.skills[i]&&APP.skills[i].name==='Italiano';document.body.classList.toggle('showing-italian',!!isIt);};}
  // openMaterial: hash
  var _om=window.openMaterial;
  if(_om){window.openMaterial=function(id,k){_om(id,k);srsHashSave('mat:'+id.replace(/::/g,':')+':'+k);};}
  // closeMaterial: hash
  var _cm=window.closeMaterial;
  if(_cm){window.closeMaterial=function(){_cm();srsHashSave('detail:'+(typeof curIdx!=='undefined'?curIdx:0));};}
  // Restaurar na carga
  if(location.hash&&location.hash.length>1)srsHashRestore();
})();
