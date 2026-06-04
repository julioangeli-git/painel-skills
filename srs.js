/* ===== srs.js — material (grupos -> cartões), subcards e detalhar =====
   Carregado após o script inline do index.html. As funções de REVISÃO (flip/SM-2)
   continuam no inline; aqui ficam o material e os subcards. */

if(!state.started)state.started={};
if(!state.srs)state.srs={};
if(!state.pos)state.pos={};
if(!state.theoryDone)state.theoryDone={};

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
  if(blockSeen(_catId,_catK,d)>=blockTotal(d,_catK)){
    state.done[_catId+'::'+_catK]=true;
    var bl=['v','f','m','i'];
    var allMat=bl.every(function(x){return state.done[_catId+'::'+x];});
    if(allMat){
      if(!state.theoryDone)state.theoryDone={};
      state.theoryDone[_catId]=true;
      // Fecha o tópico se SRS ≥ 50% OU se já estava concluido antes (migração)
      var srsPct=typeof srsTopicPct==='function'?srsTopicPct(_catId):0;
      if(state.done[_catId]||srsPct>=0.5)state.done[_catId]=true;
    }
  }
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
  // Mobile: centralizar na tela mostrando os 2 cartões + botões nav
  if(window.innerWidth<=600){
    setTimeout(function(){
      var mb=document.getElementById('matBody');
      if(mb){var top=mb.getBoundingClientRect().top+window.scrollY-56;window.scrollTo({top:Math.max(0,top),behavior:'smooth'});}
    },80);
  }
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
  var id=t.id;var d=RICH[id]||{};

  /* helper: injetar CSS de grid responsivo uma vez */
  if(!document.getElementById('subRowsCSS')){
    var st=document.createElement('style');st.id='subRowsCSS';
    st.textContent='.sub-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px}'
      +'@media(max-width:700px){.sub-row{grid-template-columns:1fr 1fr}}'+'@media(max-width:480px){.sub-row{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  if(!lang){
    /* Skills técnicas: layout original 4 cards */
    var names=['Conceito','Prática','Projeto','Validação'];
    var blocks=['v','f','m','i'];
    return '<div class="macro-grid">'+blocks.map(function(k,idx){
      var key=id+'::'+k;var done=!!state.done[key];var started=!!(state.started&&state.started[key]);
      var crit=(t.trk&&t.trk[k])||'';
      var tot=blockTotal(d,k);var seen=blockSeen(id,k,d);var pct=tot?Math.round(seen/tot*100):0;
      var prog=tot?'<span style="font-weight:400;font-size:12px;opacity:.7;margin-left:6px">'+seen+'/'+tot+' · '+pct+'%</span>':'';
      var btns;
      if(done){btns='<button class="btn" style="background:#b85a28;color:#fff;border:none" onclick="matReiniciar(\''+id+'\',\''+k+'\')">↻ Reiniciar</button>';}
      else if(started){btns='<button class="btn" style="background:#2e7fa8;color:#fff;border:none" onclick="matStart(\''+id+'\',\''+k+'\')">▸ Continuar</button><button class="btn" style="background:#4f7a3a;color:#fff;border:none" onclick="matConcluir(\''+id+'\',\''+k+'\')">✓ Concluir</button>';}
      else{btns='<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700" onclick="matStart(\''+id+'\',\''+k+'\')">▶ Iniciar</button>';}
      return '<div style="border:1px solid '+(done?'#9ec79a':'var(--border2,#e0d6c6)')+';border-radius:14px;background:'+(done?'var(--sub-done-bg,#eef7ea)':'var(--surface,#fff)')+';padding:16px;display:flex;flex-direction:column;gap:10px;min-height:120px">'
        +'<div style="font-weight:700;font-size:15px;color:var(--ink,#1c1408)">'+(done?'✓ ':'')+srsEsc(names[idx])+prog+'</div>'
        +(crit?'<div style="font-size:12px;color:var(--ink3,#666);line-height:1.45">'+srsEsc(crit)+'</div>':'')
        +'<div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">'+btns+'</div></div>';
    }).join('')+'</div>';
  }

  /* Skills de idioma: novo layout em linhas */
  var vDone=!!state.done[id+'::v'];
  var fDone=!!state.done[id+'::f'];
  var vStarted=!!(state.started&&state.started[id+'::v']);
  var fStarted=!!(state.started&&state.started[id+'::f']);
  var vTot=blockTotal(d,'v'),vSeen=blockSeen(id,'v',d),vPct=vTot?Math.round(vSeen/vTot*100):0;
  var fTot=blockTotal(d,'f'),fSeen=blockSeen(id,'f',d),fPct=fTot?Math.round(fSeen/fTot*100):0;
  var vCrit=(t.trk&&t.trk.v)||'';var fCrit=(t.trk&&t.trk.f)||'';
  var vSrsPct=typeof srsTopicPctDeck==='function'?Math.round(srsTopicPctDeck(id,'vocab')*100):0;
  var fSrsPct=typeof srsTopicPctDeck==='function'?Math.round(srsTopicPctDeck(id,'phrases')*100):0;
  var vPrnPct=typeof pronuncDeckPctDeck==='function'?Math.round(pronuncDeckPctDeck(id,'vocab')*100):0;
  var fPrnPct=typeof pronuncDeckPctDeck==='function'?Math.round(pronuncDeckPctDeck(id,'phrases')*100):0;

  function theoryCard(k,name,done,started,tot,seen,pct,crit){
    var prog=tot?'<span style="font-weight:400;font-size:12px;opacity:.7;margin-left:6px">'+seen+'/'+tot+' · '+pct+'%</span>':'';
    var btns;
    if(done){btns='<button class="btn" style="background:#b85a28;color:#fff;border:none;font-size:11px" onclick="matReiniciar(\''+id+'\',\''+k+'\')">↻ Reiniciar</button>';}
    else if(started){btns='<button class="btn" style="background:#2e7fa8;color:#fff;border:none;font-size:11px" onclick="matStart(\''+id+'\',\''+k+'\')">▸ Continuar</button><button class="btn" style="background:#4f7a3a;color:#fff;border:none;font-size:11px" onclick="matConcluir(\''+id+'\',\''+k+'\')">✓ Concluir</button>';}
    else{btns='<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700;font-size:11px" onclick="matStart(\''+id+'\',\''+k+'\')">▶ Iniciar</button>';}
    return '<div style="border:1px solid '+(done?'#9ec79a':'var(--border2,#e0d6c6)')+';border-radius:14px;background:'+(done?'var(--sub-done-bg,#eef7ea)':'var(--surface,#fff)')+';padding:14px;display:flex;flex-direction:column;gap:8px;min-height:110px">'
      +'<div style="font-weight:700;font-size:14px;color:var(--ink,#1c1408)">'+(done?'✓ ':'')+srsEsc(name)+prog+'</div>'
      +(crit?'<div style="font-size:11px;color:var(--ink3,#666);line-height:1.4">'+srsEsc(crit)+'</div>':'')
      +'<div style="margin-top:auto;display:flex;gap:6px;flex-wrap:wrap">'+btns+'</div>'
      +'</div>';
  }

  function practiceCard(label,icon,pct,onclick,locked,lockMsg){
    if(locked){
      return '<div style="border:1px dashed var(--border2,#d0c8b8);border-radius:14px;background:var(--surface2,#f8f2e5);padding:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:110px;text-align:center">'
        +'<div style="font-size:20px">🔒</div>'
        +'<div style="font-size:11px;color:var(--ink3,#888);line-height:1.35">'+(lockMsg||'Conclua a teoria para liberar')+'</div>'
        +'</div>';
    }
    var col=pct>=60?'#4f7a3a':pct>=30?'#e8a020':'#c0212e';
    return '<div style="border:1px solid var(--border2,#e0d6c6);border-radius:14px;background:var(--surface,#fff);padding:14px;display:flex;flex-direction:column;gap:8px;min-height:110px;cursor:pointer" onclick="'+onclick+'">'
      +'<div style="font-weight:700;font-size:13px;color:var(--ink,#1c1408)">'+icon+' '+srsEsc(label)+'</div>'
      +'<div style="height:5px;background:#eee;border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:3px;transition:.4s"></div></div>'
      +'<div style="font-size:18px;font-weight:800;color:'+col+'">'+pct+'%</div>'
      +'<div style="margin-top:auto"><button class="btn" style="background:'+col+';color:#fff;border:none;font-size:10px" onclick="event.stopPropagation();'+onclick+'">▶ Praticar</button></div>'
      +'</div>';
  }

  function lockedComing(name,icon){
    return '<div style="border:1px dashed var(--border2,#d0c8b8);border-radius:14px;background:var(--surface2,#f8f2e5);padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:10px;opacity:.65">'
      +'<div style="font-size:22px">🔒</div>'
      +'<div><div style="font-weight:600;font-size:14px;color:var(--ink,#1c1408)">'+icon+' '+srsEsc(name)+'</div>'
      +'<div style="font-size:11px;color:var(--ink3,#888);margin-top:2px">Em breve</div></div>'
      +'</div>';
  }

  var vFillPct=Math.round(fillDeckPct(id,'vocab')*100);
  var fFillPct=Math.round(fillDeckPct(id,'phrases')*100);
  var vFillLocked=!(RICH[id]&&RICH[id].fillSentences&&RICH[id].fillSentences.length);
  function fillCard(label,pct,onclick,locked,lockMsg){
    if(locked){
      return '<div style="border:1px dashed var(--border2,#d0c8b8);border-radius:14px;background:var(--surface2,#f8f2e5);'
        +'padding:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:110px;text-align:center">'
        +'<div style="font-size:18px">🔒</div>'
        +'<div style="font-size:11px;color:var(--ink3,#888);line-height:1.35">'+(lockMsg||'Em breve')+'</div>'
        +'</div>';
    }
    var col=pct>=60?'#4f7a3a':pct>=30?'#e8a020':'#c0212e';
    return '<div style="border:1px solid var(--border2,#e0d6c6);border-radius:14px;background:var(--surface,#fff);'
      +'padding:14px;display:flex;flex-direction:column;gap:8px;min-height:110px;cursor:pointer" onclick="'+onclick+'">'
      +'<div style="font-weight:700;font-size:13px;color:var(--ink,#1c1408)">'+srsEsc(label)+'</div>'
      +'<div style="height:5px;background:#eee;border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:3px;transition:.4s"></div></div>'
      +'<div style="font-size:18px;font-weight:800;color:'+col+'">'+pct+'%</div>'
      +'<div style="margin-top:auto"><button class="btn" style="background:'+col+';color:#fff;border:none;font-size:10px" onclick="event.stopPropagation();'+onclick+'">▶ Praticar</button></div>'
      +'</div>';
  }
  var vReviewOC="openReview('"+ id+"','vocab')";
  var vPrnOC="openPronunc('"+id+"','vocab')";
  var fReviewOC="openReview('"+id+"','phrases')";
  var fPrnOC="openPronunc('"+id+"','phrases')";

  return '<div>'
    /* ── Row 1: Vocabulário ── */
    +'<div class="sub-row">'
    +theoryCard('v','Vocabulário',vDone,vStarted,vTot,vSeen,vPct,vCrit)
    +practiceCard('Revisão','🎴',vSrsPct,vReviewOC,!vDone,'Conclua o Vocabulário para liberar')
    +practiceCard('Pronúncia','🎤',vPrnPct,vPrnOC,!vDone,'Conclua o Vocabulário para liberar')
    +fillCard('✏️ Preencha',vFillPct,"openFill('"+id+"','vocab')",!vDone||vFillLocked,'Conclua o Vocabulário para liberar')
    +'</div>'
    /* ── Row 2: Frases ── */
    +'<div class="sub-row">'
    +theoryCard('f','Frases-chave',fDone,fStarted,fTot,fSeen,fPct,fCrit)
    +practiceCard('Revisão','🎴',fSrsPct,fReviewOC,!fDone,'Conclua as Frases para liberar')
    +practiceCard('Pronúncia','🎤',fPrnPct,fPrnOC,!fDone,'Conclua as Frases para liberar')
    +fillCard('✏️ Preencha',fFillPct,"openFill('"+id+"','phrases')",!fDone,'Conclua as Frases para liberar')
    +'</div>'
    /* ── Row 3+4: locked ── */
    +lockedComing('Música','🎵')
    +lockedComing('Imersão real','🌍')
    +'</div>';
}

function matStart(id,k){if(!state.started)state.started={};state.started[id+'::'+k]=true;save();openMaterial(id,k);}
function matConcluir(id,k){
  state.done[id+'::'+k]=true;
  var bl=['v','f','m','i'];
  var allMat=bl.every(function(x){return state.done[id+'::'+x];});
  if(allMat){
    if(!state.theoryDone)state.theoryDone={};
    state.theoryDone[id]=true;
    var srsPct=typeof srsTopicPct==='function'?srsTopicPct(id):0;
    var allSn=typeof srsAllSeen==='function'?srsAllSeen(id):true;
    // Fecha só se SRS ≥ 50% E todas vistas (ou já estava concluído — migração)
    if(state.done[id]||(allSn&&srsPct>=0.5))state.done[id]=true;
  }
  save();if(typeof renderDetail==='function')renderDetail();
}
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

/* ===== Avatares (personagens retrô) ===== */
var AVATARS=[
  {id:'wizard',    label:'Mago',       icon:'🧙'},
  {id:'warrior',   label:'Guerreiro',  icon:'⚔️'},
  {id:'elf',       label:'Elfo',       icon:'🧝'},
  {id:'robot',     label:'Robô',       icon:'🤖'},
  {id:'hero',      label:'Herói',      icon:'🦸'},
  {id:'pirate',    label:'Pirata',     icon:'🏴‍☠️'},
  {id:'dragon',    label:'Dragão',     icon:'🐉'},
  {id:'ninja',     label:'Sombra',     icon:'🌙'},
  {id:'vampire',   label:'Vampiro',    icon:'🧛'},
  {id:'princess',  label:'Princesa',   icon:'👸'},
  {id:'fairy',     label:'Fada',       icon:'🧚'},
  {id:'mermaid',   label:'Sereia',     icon:'🧜'},
  {id:'heroine',   label:'Heroína',    icon:'🦸‍♀️'},
  {id:'witch',     label:'Bruxa',      icon:'🧙‍♀️'},
  {id:'elf_f',     label:'Elfa',       icon:'🧝‍♀️'},
  {id:'oracle',    label:'Oráculo',    icon:'🔮'}
];
var _srsApplyingAvatar=false;
function srsApplyAvatar(id){
  var av=AVATARS.find(function(a){return a.id===id;})||null;
  if(!av)return;
  _srsApplyingAvatar=true;
  try{localStorage.setItem('painelAvatar',id);}catch(e){}
  // Badge dedicado (único lugar — visível em todos os dispositivos)
  var badge=document.getElementById('srsAvatarBadge');
  if(badge)badge.textContent=av.icon;
  // Atualiza whoami: apenas o nome, sem duplicar ícone
  var w=document.getElementById('whoami');
  if(w){
    var nome=w.dataset.nome||(typeof currentUser!=='undefined'&&currentUser?currentUser.nome:'')||'';
    if(!nome){nome=w.textContent.replace(/[^ -\w ]/g,'').trim();}
    w.dataset.nome=nome;
  }
  // Atualiza a grade de avatares se o painel estiver aberto
  var grid=document.getElementById('avatarGrid');
  if(grid)grid.innerHTML=srsAvatarHtml();
  setTimeout(function(){_srsApplyingAvatar=false;},150);
}
function srsAvatarHtml(){
  var cur='';try{cur=localStorage.getItem('painelAvatar')||'';}catch(e){}
  return AVATARS.map(function(a){
    var sel=a.id===cur;
    return '<button onclick="srsApplyAvatar(\''+a.id+'\')" title="'+srsEsc(a.label)+'"'
      +' style="cursor:pointer;border:'+(sel?'2px solid var(--terra,#b85a28)':'1px solid #ddd')
      +';border-radius:12px;padding:8px 6px;margin:3px;background:'+(sel?'rgba(184,90,40,.1)':'transparent')
      +';font-size:28px;line-height:1;min-width:52px;text-align:center">'
      +a.icon+'<div style="font-size:9px;color:var(--ink3,#666);margin-top:3px;font-family:monospace">'+srsEsc(a.label)+'</div>'
      +'</button>';
  }).join('');
}


/* ===== Helpers SRS por deck ===== */
function srsTopicPctDeck(id,deck){
  var cs=srsCardsForTopic(id);
  if(deck==='vocab')cs=cs.filter(function(c){return !c.f.includes(' ');});
  else if(deck==='phrases')cs=cs.filter(function(c){return c.f.includes(' ');});
  if(!cs.length)return 0;
  var sum=cs.reduce(function(a,c){return a+(MAT[srsMaturity(c.key)]||{w:0}).w;},0);
  return sum/cs.length;
}
function srsAllSeen(id){
  var cs=srsCardsForTopic(id);
  return cs.length===0||cs.every(function(c){return srsMaturity(c.key)!=='new';});
}

/* ===== SRS flip: pronuncia lookup ===== */
function srsPronFor(word,topicId){
  var d=RICH[topicId]||{};
  for(var i=0;i<(d.words||[]).length;i++){
    var items=d.words[i].items||[];
    for(var j=0;j<items.length;j++){if(items[j][0]===word)return items[j][2]||'';}
  }
  for(var k=0;k<(d.phrases||[]).length;k++){
    var ph=srsApplyPlaceholders(d.phrases[k][0]);
    if(ph===word||d.phrases[k][0]===word)return ph.replace(/[.,?!]/g,'').split(/\s+/).filter(Boolean).join('-');
  }
  return '';
}
/* srsRender override: autoplay, karaoke, bandeiras */
function srsRender(){
  _srsShown=false;
  var box=document.getElementById('srsCardBox');var btns=document.getElementById('srsBtns');
  if(!box||!btns)return;
  var total=srsCardsForTopic(_srsTopic).length;
  document.getElementById('srsCounts').textContent='Sessão: '+(_srsIdx+1)+'/'+_srsQueue.length+' · Total: '+total;
  if(_srsIdx>=_srsQueue.length){
    box.innerHTML='<div style="font-size:18px;text-align:center;padding:60px 0">✓ Sessão concluída!<br><span style="font-size:14px;opacity:.6">Volte amanhã para revisar as vencidas.</span></div>';
    btns.innerHTML='<button class="btn" onclick="closeReview()">Voltar</button>';return;
  }
  var c=_srsQueue[_srsIdx];
  var pron=srsPronFor(c.f,_srsTopic);
  var pronHtml=pron?'<div id="karaoke" style="font-size:15px;color:#7a8aa0;letter-spacing:.5px;margin-top:8px">'
    +pron.split('-').map(function(s,i){return '<span id="ks'+i+'">'+srsEsc(s)+'</span>';}).join(' ')+'</div>':'';
  var img=c.img?'<img src="'+srsEsc(c.img)+'" alt="" style="max-width:90px;max-height:90px;border-radius:10px;margin-bottom:10px">':'';
  /* Não adicionar position:relative nas faces — quebra o flip 3D */
  box.innerHTML='<div class="flip" id="srsFlip" onclick="srsShow()"><div class="flip-in">'
    +'<div class="face front"><div style="font-size:22px;margin-bottom:4px">🇮🇹</div>'+img
    +'<div style="font-size:27px;font-weight:700">'+srsEsc(c.f)+'</div>'
    +pronHtml
    +'<button class="btn" style="margin-top:14px;font-size:14px" onclick="event.stopPropagation();srsSpeakKaraoke(\''+srsJsq(c.f)+'\',\''+srsJsq(pron)+'\')">🔊 ouvir</button>'
    +'<div style="margin-top:10px;opacity:.45;font-size:11px">toque para ver tradução</div></div>'
    +'<div class="face back"><div style="font-size:22px;margin-bottom:8px">🇧🇷</div>'
    +'<div style="font-size:24px;font-weight:700">'+srsEsc(c.b)+'</div></div>'
    +'</div></div>';
  btns.innerHTML='';
  setTimeout(function(){srsSpeakKaraoke(c.f,pron);},280);
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
  loadEmailState();
  var ov=document.getElementById('cfgOverlay');
  if(!ov){ov=document.createElement('div');ov.id='cfgOverlay';ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:3000;display:flex;align-items:center;justify-content:center';ov.onclick=function(e){if(e.target===ov)ov.style.display='none';};document.body.appendChild(ov);}
  var cur='';try{cur=localStorage.getItem('painelTitle')||'';}catch(e){}
  var curDate=state&&state.startDate?state.startDate:'';
  var sw=Object.keys(THEMES).map(function(n){var c=THEMES[n]['--bg']||'#f2ead8';var a=THEMES[n]['--terra']||'#b85a28';return '<button onclick="srsApplyTheme(\''+srsJsq(n)+'\')" style="cursor:pointer;border:1px solid #ccc;border-radius:10px;padding:8px 10px;margin:4px;background:'+c+';color:'+(n==='Noite'?'#f2ecdd':'#1c1408')+';font-weight:600;font-size:13px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+a+';margin-right:6px"></span>'+srsEsc(n)+'</button>';}).join('');
  var isFirst=!localStorage.getItem('painelAjustesShown');
  ov.innerHTML='<div onclick="event.stopPropagation()" style="background:var(--surface,#fdf9f2);color:var(--ink,#1c1408);border-radius:16px;padding:24px;max-width:480px;width:94%;max-height:92vh;overflow-y:auto;box-shadow:0 12px 44px rgba(0,0,0,.3)">'
    +(isFirst?'<div style="font-size:13px;color:var(--terra,#b85a28);margin-bottom:14px;padding:10px 14px;background:rgba(184,90,40,.08);border-radius:10px;border-left:3px solid var(--terra,#b85a28)">👋 Bem-vindo! Personalize o painel antes de começar.</div>':'')
    +'<div style="font-weight:700;font-size:18px;margin-bottom:16px">⚙ Ajustes</div>'
    +'<label style="font-size:13px;font-weight:600">Data de início do projeto</label>'
    +'<input type="date" id="cfgStartDate" value="'+curDate+'" style="width:100%;padding:8px;margin:4px 0 14px;border:1px solid #ccc;border-radius:8px;font-size:14px">'
    +'<label style="font-size:13px;font-weight:600">Nome do seu projeto</label>'
    +'<input id="cfgTitle" value="'+srsEsc(cur)+'" placeholder="Mudança para a Itália" style="width:100%;padding:9px;margin:6px 0 6px;border:1px solid #ccc;border-radius:8px;font-size:14px">'
    +'<button class="btn" style="margin-bottom:18px" onclick="srsApplyTitle(document.getElementById(\'cfgTitle\').value);var d=document.getElementById(\'cfgStartDate\');if(d&&d.value){state.startDate=d.value;save();}">Salvar nome</button>'
    +'<div style="font-size:13px;font-weight:600;margin-bottom:8px">Escolha seu personagem</div>'
    +'<div id="avatarGrid" style="display:flex;flex-wrap:wrap;margin-bottom:16px">'+srsAvatarHtml()+'</div>'
    +'<div style="font-size:13px;font-weight:600;margin-bottom:8px">Tema de cores</div>'
    +'<div style="display:flex;flex-wrap:wrap;margin-bottom:4px">'+sw+'</div>'
    +'<hr style="border:none;border-top:1px solid var(--border,#e0d0b0);margin:18px 0">'
    +'<div style="font-size:13px;font-weight:600;margin-bottom:8px">E-mail e segurança</div>'
    +'<div style="margin-bottom:10px">'+emailStatusHtml()+'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">'
    +'<button class="btn" onclick="srsOpenEmailRegister()">📧 '+((_emailState.email&&_emailState.verified)?'Alterar e-mail':'Cadastrar e-mail')+'</button>'
    +((_emailState.verified)?'<button class="btn" onclick="srsOpenChangePIN()">🔑 Trocar senha</button>':'')
    +'</div>'
    +'<div style="text-align:right;margin-top:18px">'
    +'<button class="btn" style="background:var(--terra,#b85a28);color:#fff;border:none;font-weight:700" onclick="srsCloseAjustes()">Pronto ✓</button>'
    +'</div></div>';
  ov.style.display='flex';
}
/* ===== SRS flip cards: autoplay, karaoke, bandeiras ===== */
function srsPronFor(word, topicId){
  var d=RICH[topicId]||{};
  for(var i=0;i<(d.words||[]).length;i++){
    var items=d.words[i].items||[];
    for(var j=0;j<items.length;j++){if(items[j][0]===word)return items[j][2]||'';}
  }
  // frases: gera pron por palavra
  for(var k=0;k<(d.phrases||[]).length;k++){
    var ph=srsApplyPlaceholders(d.phrases[k][0]);
    if(ph===word||d.phrases[k][0]===word)return ph.replace(/[.,?!]/g,'').split(/\s+/).filter(Boolean).join('-');
  }
  return '';
}
function srsRender(){
  _srsShown=false;
  var box=document.getElementById('srsCardBox');var btns=document.getElementById('srsBtns');
  if(!box||!btns)return;
  var total=srsCardsForTopic(_srsTopic).length;
  document.getElementById('srsCounts').textContent=
    'Sessão: '+(_srsIdx+1)+'/'+_srsQueue.length+' · Total do tópico: '+total;
  if(_srsIdx>=_srsQueue.length){
    box.innerHTML='<div style="font-size:18px;text-align:center;padding:60px 0">✓ Sessão concluída!<br><span style="font-size:14px;opacity:.6">Volte amanhã para revisar as vencidas.</span></div>';
    btns.innerHTML='<button class="btn" onclick="closeReview()">Voltar</button>';
    return;
  }
  var c=_srsQueue[_srsIdx];
  var cf=typeof srsApplyPlaceholders==='function'?srsApplyPlaceholders(c.f):c.f;
  var cb=typeof srsApplyPlaceholders==='function'?srsApplyPlaceholders(c.b):c.b;
  var pron=srsPronFor(cf,_srsTopic)||cf.replace(/[.,?!]/g,'').split(/\s+/).filter(Boolean).join('-');
  var pronHtml=pron
    ?'<div id="karaoke" style="font-size:15px;color:#7a8aa0;letter-spacing:.5px;margin-top:8px">'
      +pron.split('-').map(function(s,i){return '<span id="ks'+i+'">'+srsEsc(s)+'</span>';}).join(' ')
      +'</div>':'';
  var img=c.img?'<img src="'+srsEsc(c.img)+'" alt="" style="max-width:90px;max-height:90px;border-radius:10px;margin-bottom:10px">':'';
  var flagIT='<img src="https://flagcdn.com/w40/it.png" alt="IT" style="width:28px;border-radius:3px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,.2)">';
  var flagBR='<img src="https://flagcdn.com/w40/br.png" alt="BR" style="width:28px;border-radius:3px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.2)">';
  box.innerHTML='<div class="flip" id="srsFlip" onclick="srsShow()"><div class="flip-in">'
    +'<div class="face front">'+flagIT+img
    +'<div style="font-size:27px;font-weight:700">'+srsEsc(cf)+'</div>'
    +pronHtml
    +'<button class="btn" style="margin-top:14px;font-size:14px" onclick="event.stopPropagation();srsOuvir()">🔊 ouvir</button>'
    +'<div style="margin-top:10px;opacity:.45;font-size:11px">toque para ver tradução</div></div>'
    +'<div class="face back">'+flagBR
    +'<div style="font-size:24px;font-weight:700">'+srsEsc(cb)+'</div></div>'
    +'</div></div>';
  btns.innerHTML='';
  setTimeout(function(){srsSpeakKaraoke(cf,pron);},280);
}
function srsOuvir(){
  var c=_srsQueue[_srsIdx];if(!c)return;
  var cf=typeof srsApplyPlaceholders==='function'?srsApplyPlaceholders(c.f):c.f;
  var pron=srsPronFor(cf,_srsTopic)||cf.replace(/[.,?!]/g,'').split(/\s+/).filter(Boolean).join('-');
  srsSpeakKaraoke(cf,pron);
}

/* ===== SRS detalhado: override de srsCardHtml e openReview ===== */
function srsCardHtml(id){
  // Lang skills: handled by matSubcardsHtml rows
  var s=APP&&APP.skills&&APP.skills[typeof curIdx!=='undefined'?curIdx:0];
  if(s&&s.lang)return '';
  var cards=srsCardsForTopic(id);if(!cards.length)return '';
  var cnt={new:0,learning:0,young:0,mature:0};
  cards.forEach(function(c){var m=srsMaturity(c.key);cnt[m]=(cnt[m]||0)+1;});
  var vocabCards=cards.filter(function(c){return !c.f.includes(' ');});
  var phraseCards=cards.filter(function(c){return c.f.includes(' ');});
  var vPct=typeof srsTopicPctDeck==='function'?Math.round(srsTopicPctDeck(id,'vocab')*100):0;
  var pPct=typeof srsTopicPctDeck==='function'?Math.round(srsTopicPctDeck(id,'phrases')*100):0;
  var dueVocab=vocabCards.filter(function(c){return srsDue(c.key);}).length;
  var duePhr=phraseCards.filter(function(c){return srsDue(c.key);}).length;
  var allSeen=typeof srsAllSeen==='function'?srsAllSeen(id):true;
  var tags=[
    cnt.mature  ?'<span style="color:#4f7a3a">●</span> '+cnt.mature+' maduras':'',
    cnt.young   ?'<span style="color:#2e7fa8">●</span> '+cnt.young+' jovens':'',
    cnt.learning?'<span style="color:#e8a020">●</span> '+cnt.learning+' aprendendo':'',
    cnt.new     ?'<span style="color:#bbb">●</span> '+cnt.new+' não vistas':''
  ].filter(Boolean).join(' &nbsp; ');
  var dueTotal=(dueVocab||0)+(duePhr||0);
  var statusMsg=dueTotal>0
    ?'<div style="font-size:12px;font-weight:700;color:#c0212e;margin-top:5px">⏰ '+dueTotal+' pedindo revisão agora</div>'
    :(!allSeen
      ?'<div style="font-size:11px;color:#e8a020;margin-top:5px">⚡ Veja todas ao menos 1× antes de fechar o tópico</div>'
      :'<div style="font-size:11px;color:#4f7a3a;margin-top:5px">✓ Em dia — sistema avisará quando revisitar</div>');
  function col(p){return p>=60?'#4f7a3a':p>=30?'#e8a020':'#c0212e';}
  function miniBar(p,c){return '<span style="display:inline-block;width:44px;height:5px;background:#e8e0d0;border-radius:3px;vertical-align:middle;margin-left:5px"><span style="display:block;height:100%;width:'+p+'%;background:'+c+';border-radius:3px"></span></span>';}
  var deckBtns='';
  if(vocabCards.length)deckBtns+='<button onclick="openReview(\''+id+'\',\'vocab\')" style="cursor:pointer;border:1px solid #d9c7b0;border-radius:8px;padding:7px 12px;margin:3px 0;background:transparent;font-size:12px;width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between">'
    +'<span>🔤 Vocabulário'+(dueVocab?' &nbsp;<b style="color:#c0212e">'+dueVocab+' vencidos</b>':'')+'</span>'
    +'<b style="color:'+col(vPct)+';white-space:nowrap">'+vPct+'%'+miniBar(vPct,col(vPct))+'</b></button>';
  if(phraseCards.length)deckBtns+='<button onclick="openReview(\''+id+'\',\'phrases\')" style="cursor:pointer;border:1px solid #d9c7b0;border-radius:8px;padding:7px 12px;margin:3px 0;background:transparent;font-size:12px;width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between">'
    +'<span>💬 Frases <span style="opacity:.6">(+ rep.)</span>'+(duePhr?' &nbsp;<b style="color:#c0212e">'+duePhr+' vencidas</b>':'')+'</span>'
    +'<b style="color:'+col(pPct)+';white-space:nowrap">'+pPct+'%'+miniBar(pPct,col(pPct))+'</b></button>';
  // Deck Pronuncia
  var prnPct=Math.round(pronuncDeckPct(id)*100);
  function prnCol(p){return p>=PRONUNC_THRESHOLD?'#4f7a3a':p>=50?'#e8a020':'#c0212e';}
  deckBtns+='<button onclick="openPronunc(\''+id+'\');" style="cursor:pointer;border:1px solid #d9c7b0;border-radius:8px;padding:7px 12px;margin:3px 0;background:transparent;font-size:12px;width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between">'
    +'<span>🎤 Pronúncia <span style="opacity:.6">(meta '+PRONUNC_THRESHOLD+'%)</span></span>'
    +'<b style="color:'+prnCol(prnPct)+';white-space:nowrap">'+prnPct+'%'+miniBar(prnPct,prnCol(prnPct))+'</b></button>';
  return '<div class="srs-card" style="margin:10px 0;padding:14px;border:1px solid #d9c7b0;border-radius:12px;background:#fbf6ee">'+
    '<div style="font-weight:700;font-size:14px;margin-bottom:5px">🎴 Revisão por cartões</div>'+
    '<div style="font-size:11px;color:var(--ink3,#666)">'+tags+'</div>'+
    statusMsg+
    '<div style="margin-top:8px">'+deckBtns+'</div>'+
    '<div style="font-size:10px;opacity:.4;margin-top:7px">💡 "Fácil 1×" ≠ aprendizado — palavras maduras chegam após revisões espaçadas em dias</div>'+
    '</div>';
}

function openReview(id,deck){
  if(typeof ensureSrsView==='function')ensureSrsView();
  _srsTopic=id;_srsDeck=deck||null;
  var cs=srsCardsForTopic(id);
  // Filtrar por deck
  if(deck==='vocab') cs=cs.filter(function(c){return !c.f.includes(' ');});
  else if(deck==='phrases') cs=cs.filter(function(c){return c.f.includes(' ');});
  var due=cs.filter(function(c){return srsDue(c.key)&&srsMaturity(c.key)!=='new';});
  var newCards=cs.filter(function(c){return srsMaturity(c.key)==='new';});
  var BATCH=20;
  _srsQueue=due.slice(0,BATCH);
  if(_srsQueue.length<BATCH)_srsQueue=_srsQueue.concat(newCards.slice(0,BATCH-_srsQueue.length));
  if(!_srsQueue.length)_srsQueue=cs.slice(0,BATCH);
  _srsIdx=0;
  var detail=document.getElementById('detail');if(detail)detail.style.display='none';
  var ov=document.getElementById('overview');if(ov)ov.style.display='none';
  document.getElementById('srsView').style.display='block';
  var t=(APP.skills[curIdx]?APP.skills[curIdx].topics.find(function(x){return x.id===id;}):null);
  var deckLabel=deck==='vocab'?'Vocabulário':deck==='phrases'?'Frases':'Revisão';
  document.getElementById('srsTitle').textContent=deckLabel+' · '+(t?t.t:id);
  document.getElementById('srsCounts').textContent='Sessão: 0/'+_srsQueue.length+' · Total: '+cs.length;
  window.scrollTo({top:0,behavior:'smooth'});
  if(typeof srsRender==='function')srsRender();
}
/* SM-2 mais exigente para frases: ao dar Easy, trata como Good (intervalo menor) */
var _origSrsGrade=typeof srsGrade==='function'?srsGrade:null;
function srsAns(g){
  var c=_srsQueue[_srsIdx];
  // Frases exigem mais: "fácil" vira "bom", "bom" vira "difícil"
  var actualG=g;
  if(_srsDeck==='phrases'||c.f.includes(' ')){
    if(g==='easy')actualG='good';
    else if(g==='good')actualG='hard';
  }
  srsGrade(c.key,actualG);_srsIdx++;srsRender();
}

function srsCloseAjustes(){
  try{localStorage.setItem('painelAjustesShown','1');}catch(e){}
  var ov=document.getElementById('cfgOverlay');if(ov)ov.style.display='none';
}
function srsInitUI(){
  var anchor=document.getElementById('expBtn')||document.getElementById('logoutBtn');
  // Botão Ajustes (sem avatar embutido)
  if(anchor&&anchor.parentNode&&!document.getElementById('cfgBtn')){
    var b=document.createElement('button');b.id='cfgBtn';b.className='btn';b.textContent='⚙ Ajustes';b.onclick=srsOpenConfig;
    anchor.parentNode.insertBefore(b,anchor);
  }
  // Badge de avatar dedicado (no bloco .tools, visível desktop+mobile)
  if(!document.getElementById('srsAvatarBadge')){
    var tools=document.querySelector('.tools');
    if(tools){
      var badge=document.createElement('span');badge.id='srsAvatarBadge';
      badge.style.cssText='font-size:20px;line-height:1;cursor:pointer;padding:0 2px';
      badge.title='Clique em Ajustes para trocar';badge.onclick=srsOpenConfig;
      tools.insertBefore(badge,tools.firstChild);
    }
    // Remove o 👤 hardcoded do whoami-wrap
    var ww=document.querySelector('.whoami-wrap');
    if(ww){Array.from(ww.childNodes).forEach(function(n){if(n.nodeType===3)n.textContent=n.textContent.replace('👤','').replace(' ','');});}
  }
  try{var th=localStorage.getItem('painelTheme');if(th)srsApplyTheme(th);}catch(e){}
  try{var ti=localStorage.getItem('painelTitle');if(ti)srsApplyTitle(ti);}catch(e){}
  // Aplicar avatar e observar login para reaplicar depois que o nome aparecer
  (function(){
    var savedAv=null;try{savedAv=localStorage.getItem('painelAvatar');}catch(e){}
    if(savedAv)srsApplyAvatar(savedAv);
    var w=document.getElementById('whoami');
    if(w){
      var obs=new MutationObserver(function(){
        if(_srsApplyingAvatar)return;
        var av=null;try{av=localStorage.getItem('painelAvatar');}catch(e){}
        if(av){w.dataset.nome=w.textContent.trim();srsApplyAvatar(av);}
      });
      obs.observe(w,{childList:true,characterData:true,subtree:true});
    }
  })();
  // Normalizar nome no login: primeira letra maiúscula, sem travar login
  (function(){
    var nomeFld=document.getElementById('loginNome');
    if(nomeFld&&!nomeFld._srsPatchedNome){
      nomeFld._srsPatchedNome=true;
      nomeFld.addEventListener('blur',function(){
        var v=this.value.trim();
        if(v)this.value=v.charAt(0).toUpperCase()+v.slice(1).toLowerCase();
      });
    }
  })();
  // First-time: mostrar Ajustes após login (uma vez só)
  if(!localStorage.getItem('painelAjustesShown')){
    var _roOrig=typeof renderOverview==='function'?renderOverview:null;
    if(_roOrig&&!window._srsFirstTimeHooked){
      window._srsFirstTimeHooked=true;
      window.renderOverview=function(){
        _roOrig();
        if(!localStorage.getItem('painelAjustesShown')){setTimeout(srsOpenConfig,400);}
      };
    }
  }

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
      /* Botões de gestão de dados: ocultos da interface (auto-save em background) */
      +'#saveBtn,#cloudStatus,#expBtn,#impBtn,#resetBtn,.date-field{display:none!important}'
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
      +'@media(max-width:600px){.journey{grid-template-columns:1fr!important}.jstep.done{padding:10px 18px!important}.jstep.done .jdesc,.jstep.done .jbadge{display:none!important}.jstep.future{display:none!important}.journey.expanded .jstep.future{display:block!important}}'
      +'.mat-pair{flex-direction:column!important;gap:8px!important}'
      +'.mat-card-front,.mat-card-back{min-height:28vh!important;max-height:28vh!important;font-size:18px!important;overflow:auto}'+'#matBody~div{position:sticky!important;bottom:6px!important;z-index:10!important;background:var(--bg,#f2ead8)!important;padding:4px 0!important;border-radius:12px!important}'
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


/* ===== PRONÚNCIA: Web Speech API ===== */
if(!state.pronunc)state.pronunc={};
var PRONUNC_THRESHOLD=70;

function levenshtein(a,b){
  var m=a.length,n=b.length,dp=[],i,j;
  for(i=0;i<=m;i++){dp[i]=[i];for(j=1;j<=n;j++)dp[i][j]=i?0:j;}
  for(i=1;i<=m;i++)for(j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function pronuncScore(spoken,target){
  var norm=function(s){return String(s).toLowerCase().replace(/[.,?!;:'"]/g,'').trim();};
  var s=norm(spoken),t=norm(target);
  if(!t.length)return 100;if(!s.length)return 0;
  // Levenshtein puro (sequência importa para palavras e frases)
  var d=levenshtein(s,t);
  var score=Math.max(0,Math.round((1-d/Math.max(s.length,t.length))*100));
  // Penalidade: resposta muito curta em relação ao alvo (palavra incompleta ou frase parcial)
  var ratio=s.length/t.length;
  if(ratio<0.6)score=Math.round(score*Math.sqrt(ratio/0.6));
  return Math.min(score,100);
}
function pronuncBest(key){return(state.pronunc&&state.pronunc[key])||0;}
function pronuncDeckPct(id){
  var cs=srsCardsForTopic(id);if(!cs.length)return 0;
  return cs.reduce(function(a,c){return a+Math.min(pronuncBest(c.key),100)/100;},0)/cs.length;
}
function pronuncDeckPctDeck(id,deck){
  var cs=srsCardsForTopic(id);
  if(deck==='vocab')cs=cs.filter(function(c){return !c.f.includes(' ');});
  else if(deck==='phrases')cs=cs.filter(function(c){return c.f.includes(' ');});
  if(!cs.length)return 0;
  return cs.reduce(function(a,c){return a+Math.min(pronuncBest(c.key),100)/100;},0)/cs.length;
}

var _pronuncId=null,_pronuncQueue=[],_pronuncIdx=0,_pronuncRecog=null;

function ensurePronuncView(){
  if(document.getElementById('pronuncView'))return;
  var st=document.createElement('style');
  st.textContent=
    '.mic-btn{font-size:36px;background:none;border:3px solid #1c6b8c;border-radius:50%;'
    +'width:76px;height:76px;cursor:pointer;transition:.2s;display:inline-flex;'
    +'align-items:center;justify-content:center;margin:8px auto}'
    +'.mic-btn.listening{border-color:#c0212e!important;animation:srs-pulse 1s infinite}'
    +'@keyframes srs-pulse{0%,100%{box-shadow:0 0 0 0 rgba(192,33,46,.4)}'
    +'50%{box-shadow:0 0 0 14px rgba(192,33,46,0)}}';
  document.head.appendChild(st);
  var v=document.createElement('div');v.id='pronuncView';v.style.display='none';
  v.innerHTML='<div style="max-width:580px;margin:0 auto;padding:18px">'
    +'<button class="btn" id="pronuncBack">← Voltar</button>'
    +'<div id="pronuncTitle" style="margin:12px 0 4px;font-weight:700;font-size:16px"></div>'
    +'<div id="pronuncCounts" style="font-size:12px;opacity:.7;margin-bottom:14px"></div>'
    +'<div id="pronuncCardBox"></div>'
    +'<div id="pronuncBtns" style="margin-top:18px;text-align:center;display:flex;'
    +'gap:10px;justify-content:center;flex-wrap:wrap"></div>'
    +'</div>';
  document.body.appendChild(v);
  document.getElementById('pronuncBack').onclick=closePronunc;
}
function closePronunc(){
  if(_pronuncRecog){try{_pronuncRecog.stop();}catch(e){}_pronuncRecog=null;}
  var pv=document.getElementById('pronuncView');if(pv)pv.style.display='none';
  document.getElementById('detail').style.display='block';
  if(typeof renderDetail==='function')renderDetail();
}
function openPronunc(id,deck){
  ensurePronuncView();_pronuncId=id;
  var cs=srsCardsForTopic(id);
  if(deck==='vocab')cs=cs.filter(function(c){return !c.f.includes(' ');});
  else if(deck==='phrases')cs=cs.filter(function(c){return c.f.includes(' ');});
  var notDone=cs.filter(function(c){return pronuncBest(c.key)<PRONUNC_THRESHOLD;});
  _pronuncQueue=(notDone.length?notDone:cs).slice(0,20);
  _pronuncIdx=0;
  document.getElementById('detail').style.display='none';
  var ov=document.getElementById('overview');if(ov)ov.style.display='none';
  var sv=document.getElementById('srsView');if(sv)sv.style.display='none';
  document.getElementById('pronuncView').style.display='block';
  var t=APP.skills[curIdx]?APP.skills[curIdx].topics.find(function(x){return x.id===id;}):null;
  var dlabel=deck==='vocab'?'Vocabulário':deck==='phrases'?'Frases':'Tudo';
  document.getElementById('pronuncTitle').textContent='Pronúncia ('+dlabel+') · '+(t?t.t:id);
  window.scrollTo({top:0,behavior:'smooth'});
  renderPronunc();
}
function renderPronunc(){
  var box=document.getElementById('pronuncCardBox');
  var btns=document.getElementById('pronuncBtns');
  var total=_pronuncQueue.length;
  var done=_pronuncQueue.filter(function(c){return pronuncBest(c.key)>=PRONUNC_THRESHOLD;}).length;
  document.getElementById('pronuncCounts').textContent=
    'Sessão: '+(_pronuncIdx+1)+'/'+total+' · Meta: '+PRONUNC_THRESHOLD+'% · ✓ '+done+'/'+total;
  if(_pronuncIdx>=total){
    var oPct=Math.round(pronuncDeckPct(_pronuncId)*100);
    var okCol=oPct>=PRONUNC_THRESHOLD?'#4f7a3a':'#e8a020';
    box.innerHTML='<div style="text-align:center;padding:40px 0">'
      +'<div style="font-size:52px">'+(oPct>=PRONUNC_THRESHOLD?'🎉':'💪')+'</div>'
      +'<div style="font-size:22px;font-weight:700;margin:12px 0">Sessão concluída!</div>'
      +'<div style="font-size:28px;font-weight:800;color:'+okCol+'">'+oPct+'%</div>'
      +'<div style="font-size:13px;opacity:.65;margin-top:8px">'
      +(oPct>=PRONUNC_THRESHOLD?'Pronúncia dominada ✓':'Meta: '+PRONUNC_THRESHOLD+'% — continue praticando')+'</div>'
      +'</div>';
    btns.innerHTML='<button class="btn" onclick="closePronunc()">Voltar</button>';
    return;
  }
  var c=_pronuncQueue[_pronuncIdx];
  var best=pronuncBest(c.key);
  var lang=APP.skills[curIdx]?APP.skills[curIdx].name:'Italiano';
  box.innerHTML=
    '<div style="border:2px solid #4f7a3a;border-radius:22px;padding:28px 22px;'
    +'background:linear-gradient(135deg,#eef7ea,#d8efcf);text-align:center;min-height:280px;'
    +'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">'
    +'<div style="font-size:22px">🇧🇷</div>'
    +'<div style="font-size:30px;font-weight:800;color:#234a18">'+srsEsc(typeof srsApplyPlaceholders==="function"?srsApplyPlaceholders(c.b):c.b)+'</div>'
    +'<div style="font-size:13px;color:#4f7a3a;opacity:.8">Como se diz em '+srsEsc(lang)+'?</div>'
    +'<button class="mic-btn" id="micBtn" onclick="srsMicStart()" title="Clique e fale">🎤</button>'
    +'<div style="font-size:12px;opacity:.5">Clique no microfone e fale</div>'
    +'<div id="pronuncResult" style="min-height:80px;width:100%"></div>'
    +(best>0?'<div style="font-size:11px;opacity:.45">Melhor: <b style="color:'+(best>=PRONUNC_THRESHOLD?'#4f7a3a':'#e8a020')+'">'+best+'%</b></div>':'')
    +'</div>';
  btns.innerHTML='';
}
function srsMicStart(){
  var SRC=window.SpeechRecognition||window.webkitSpeechRecognition;
  var res=document.getElementById('pronuncResult');
  var btn=document.getElementById('micBtn');
  if(!SRC){
    if(res)res.innerHTML='<span style="color:#c0212e;font-size:12px">Use Chrome para reconhecimento de voz.</span>';
    return;
  }
  if(btn)btn.classList.add('listening');
  if(res)res.innerHTML='<div style="opacity:.6;font-size:13px;margin-top:8px">🎤 Ouvindo… fale agora</div>';
  document.getElementById('pronuncBtns').innerHTML='';
  if(_pronuncRecog){try{_pronuncRecog.stop();}catch(e){}}
  var recog=new SRC();
  recog.lang=srsTTSLang();recog.interimResults=false;recog.maxAlternatives=2;
  _pronuncRecog=recog;
  recog.onresult=function(e){
    var c=_pronuncQueue[_pronuncIdx];
    var alts=[];for(var i=0;i<e.results[0].length;i++)alts.push(e.results[0][i].transcript);
    var cf2=typeof srsApplyPlaceholders==="function"?srsApplyPlaceholders(c.f):c.f;
    var scores=alts.map(function(s){return pronuncScore(s,cf2);});
    var score=Math.max.apply(null,scores);
    var bestAlt=alts[scores.indexOf(score)];
    if(!state.pronunc)state.pronunc={};
    if(score>pronuncBest(c.key))state.pronunc[c.key]=score;
    save();
    if(btn)btn.classList.remove('listening');_pronuncRecog=null;
    var col=score>=PRONUNC_THRESHOLD?'#4f7a3a':score>=50?'#e8a020':'#c0212e';
    var emj=score>=PRONUNC_THRESHOLD?'✓':score>=50?'⚡':'✗';
    var msg=score>=PRONUNC_THRESHOLD?'Ótimo!':score>=50?'Quase lá!':'Tente novamente';
    res.innerHTML='<div style="margin-top:10px;text-align:center">'
      +'<div style="font-size:13px;color:#666;margin-bottom:4px">Você disse: <i>&ldquo;'+srsEsc(bestAlt)+'&rdquo;</i></div>'
      +'<div style="font-size:13px;color:#444;margin-bottom:8px">Esperado: <b>'+srsEsc(c.f)+'</b></div>'
      +'<div style="font-size:36px;font-weight:800;color:'+col+'">'+score+'%</div>'
      +'<div style="font-size:14px;color:'+col+'">'+emj+' '+msg+'</div>'
      +'</div>';
    document.getElementById('pronuncBtns').innerHTML=
      '<button class="btn" onclick="srsMicStart()">🎤 Tentar novamente</button>'
      +'<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700" onclick="pronuncNext()">Próximo →</button>';
    setTimeout(function(){
      var pron=typeof srsPronFor==='function'?srsPronFor(c.f,_pronuncId):'';
      srsSpeakKaraoke(c.f,pron);
    },700);
  };
  recog.onerror=function(e){
    if(btn)btn.classList.remove('listening');_pronuncRecog=null;
    var errMsg={'not-allowed':'Permita o microfone no browser.','no-speech':'Nenhuma fala detectada.'}[e.error]||('Erro: '+e.error);
    if(res)res.innerHTML='<div style="color:#c0212e;font-size:12px;margin-top:8px">'+errMsg+'</div>';
    document.getElementById('pronuncBtns').innerHTML=
      '<button class="btn" onclick="srsMicStart()">🎤 Tentar novamente</button>'
      +'<button class="btn" onclick="pronuncNext()">Pular →</button>';
  };
  recog.onend=function(){if(btn)btn.classList.remove('listening');};
  try{recog.start();}catch(e){if(res)res.innerHTML='<div style="color:#c0212e;font-size:12px">Permita o microfone.</div>';}
}
function pronuncNext(){
  if(_pronuncRecog){try{_pronuncRecog.stop();}catch(e){}_pronuncRecog=null;}
  _pronuncIdx++;renderPronunc();
}



/* ===== PREENCHA A FRASE: word-order exercise ===== */
if(!state.fill)state.fill={};

function fillSentencesFor(id, deck){
  var d=RICH[id]||{};
  if(deck==='phrases') return (d.phrases||[]).map(function(p){return [srsApplyPlaceholders(p[0]),srsApplyPlaceholders(p[1])];});
  // vocab deck: use fillSentences if available
  var fs=d.fillSentences||[];
  return fs.map(function(p){return [srsApplyPlaceholders(p[0]),srsApplyPlaceholders(p[1])];});
}
function fillDeckPct(id, deck){
  var ss=fillSentencesFor(id,deck);if(!ss.length)return 0;
  var done=ss.filter(function(p){return (state.fill[id+'::'+deck+'::'+p[0]]||0)>=1;}).length;
  return done/ss.length;
}

var _fillId=null,_fillDeck=null,_fillQueue=[],_fillIdx=0;
var _fillAnswer=[],_fillPool=[];

function ensureFillView(){
  if(document.getElementById('fillView'))return;
  var st=document.createElement('style');st.textContent=
    '.fill-tile{cursor:pointer;padding:7px 12px;border-radius:8px;font-size:15px;font-weight:600;'
    +'border:2px solid #1c6b8c;background:#eaf4fb;color:#0f3d52;transition:.15s;user-select:none}'
    +'.fill-tile:hover{background:#d4e9f5}'
    +'.fill-tile.used{opacity:.3;cursor:default;pointer-events:none}'
    +'.fill-answer-slot{min-width:60px;padding:7px 12px;border-radius:8px;font-size:15px;font-weight:600;'
    +'border:2px dashed #9a835a;background:rgba(0,0,0,.03);color:#1c1408;cursor:pointer;transition:.15s}'
    +'.fill-answer-slot:hover{background:rgba(184,90,40,.08)}';
  document.head.appendChild(st);
  var v=document.createElement('div');v.id='fillView';v.style.display='none';
  v.innerHTML='<div style="max-width:640px;margin:0 auto;padding:18px">'
    +'<button class="btn" id="fillBack">← Voltar</button>'
    +'<div id="fillTitle" style="margin:12px 0 4px;font-weight:700;font-size:16px"></div>'
    +'<div id="fillCounts" style="font-size:12px;opacity:.7;margin-bottom:16px"></div>'
    +'<div id="fillCardBox"></div>'
    +'<div id="fillBtns" style="margin-top:16px;text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"></div>'
    +'</div>';
  document.body.appendChild(v);
  document.getElementById('fillBack').onclick=closeFill;
}
function closeFill(){
  var fv=document.getElementById('fillView');if(fv)fv.style.display='none';
  document.getElementById('detail').style.display='block';
  if(typeof renderDetail==='function')renderDetail();
}
function openFill(id, deck){
  ensureFillView();_fillId=id;_fillDeck=deck;
  var ss=fillSentencesFor(id,deck);
  // Prioritise unseen sentences first
  var unseen=ss.filter(function(p){return !(state.fill[id+'::'+deck+'::'+p[0]]);});
  _fillQueue=(unseen.length?unseen:ss).slice(0,15);
  _fillIdx=0;
  document.getElementById('detail').style.display='none';
  var ov=document.getElementById('overview');if(ov)ov.style.display='none';
  var sv=document.getElementById('srsView');if(sv)sv.style.display='none';
  var pv=document.getElementById('pronuncView');if(pv)pv.style.display='none';
  document.getElementById('fillView').style.display='block';
  var t=APP.skills[curIdx]?APP.skills[curIdx].topics.find(function(x){return x.id===id;}):null;
  var dlabel=deck==='phrases'?'Frases':'Vocabulário';
  document.getElementById('fillTitle').textContent='Preencha a frase ('+dlabel+') · '+(t?t.t:id);
  window.scrollTo({top:0,behavior:'smooth'});
  renderFill();
}
function renderFill(){
  var box=document.getElementById('fillCardBox');
  var btns=document.getElementById('fillBtns');
  var total=_fillQueue.length;
  var done=_fillQueue.filter(function(p){return (state.fill[_fillId+'::'+_fillDeck+'::'+p[0]]||0)>=1;}).length;
  document.getElementById('fillCounts').textContent=
    'Carta '+(_fillIdx+1)+'/'+total+' · ✓ '+done+'/'+total+' concluídas';
  if(_fillIdx>=total){
    var pct=Math.round(fillDeckPct(_fillId,_fillDeck)*100);
    box.innerHTML='<div style="text-align:center;padding:40px 0">'
      +'<div style="font-size:52px">'+(pct>=80?'🎉':'💪')+'</div>'
      +'<div style="font-size:22px;font-weight:700;margin:12px 0">Sessão concluída!</div>'
      +'<div style="font-size:26px;font-weight:800;color:'+(pct>=80?'#4f7a3a':'#e8a020')+'">'+pct+'%</div>'
      +'</div>';
    btns.innerHTML='<button class="btn" onclick="closeFill()">Voltar</button>';
    return;
  }
  var pair=_fillQueue[_fillIdx];
  var sentence=pair[0],translation=pair[1];
  // Split sentence into words, create shuffled pool with 2 distractors
  var words=sentence.replace(/[.,!?]/g,' $& ').split(/\s+/).filter(Boolean);
  var distractors=_fillGetDistractors(words,2);
  _fillAnswer=[];
  _fillPool=shuffle(words.concat(distractors));
  renderFillCard(sentence, translation, false, null);
  btns.innerHTML='';
  // Play audio
  setTimeout(function(){srsSpeakKaraoke(sentence,'');},300);
}
function _fillGetDistractors(words, n){
  // Pull random words from vocabulary of this topic as distractors
  var d=RICH[_fillId]||{};
  var pool=[];
  (d.words||[]).forEach(function(cat){(cat.items||[]).forEach(function(w){if(words.indexOf(w[0])<0)pool.push(w[0]);});});
  if(!pool.length)return [];
  var result=[];for(var i=0;i<n&&pool.length;i++){var ri=Math.floor(Math.random()*pool.length);result.push(pool.splice(ri,1)[0]);}
  return result;
}
function shuffle(arr){
  var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;
}
function renderFillCard(sentence, translation, checked, isCorrect){
  var box=document.getElementById('fillCardBox');
  var lang=APP.skills[curIdx]?APP.skills[curIdx].name:'Italiano';
  var ansHtml=_fillAnswer.map(function(w,i){
    return '<span class="fill-answer-slot" onclick="fillRemoveWord('+i+')">'+srsEsc(w)+'</span>';
  }).join(' ');
  if(!_fillAnswer.length)ansHtml='<span style="opacity:.4;font-size:13px">Clique nas palavras abaixo para montar a frase</span>';
  var poolHtml=_fillPool.map(function(w,i){
    var used=_fillAnswer.indexOf(w)>=0&&_fillAnswer.filter(function(a){return a===w;}).length>=_fillPool.filter(function(p){return p===w;}).length;
    return '<span class="fill-tile'+(used?' used':'')+'" onclick="fillAddWord('+i+')">'+srsEsc(w)+'</span>';
  }).join(' ');
  var feedbackHtml='';
  if(checked===true&&isCorrect){
    feedbackHtml='<div style="background:#eef7ea;border:1px solid #9ec79a;border-radius:10px;padding:12px;margin-top:12px;font-size:14px;color:#4f7a3a">✓ Correto! &nbsp; <i>'+srsEsc(translation)+'</i></div>';
  } else if(checked===true&&!isCorrect){
    feedbackHtml='<div style="background:#fdecea;border:1px solid #f5a0a0;border-radius:10px;padding:12px;margin-top:12px;font-size:14px;color:#c0212e">✗ A frase correta é: <b>'+srsEsc(sentence)+'</b></div>';
  }
  box.innerHTML=
    '<div style="background:var(--surface,#fff);border:1px solid var(--border2,#e0d6c6);border-radius:16px;padding:20px">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'
    +'<button class="btn" onclick="srsSpeakKaraoke(\''+srsJsq(sentence)+'\',\'\')">🔊 Ouvir</button>'
    +'<span style="font-size:12px;color:var(--ink3,#666)">Ouça e monte a frase em '+srsEsc(lang)+'</span>'
    +'</div>'
    // Answer area
    +'<div style="min-height:44px;padding:10px;border:2px solid var(--border2,#e0d6c6);border-radius:10px;'
    +'background:var(--surface2,#f8f2e5);display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:14px">'
    +ansHtml+'</div>'
    // Word pool
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;background:var(--bg2,#ede3cd);border-radius:10px">'
    +poolHtml+'</div>'
    +feedbackHtml
    +'</div>';
  var btns=document.getElementById('fillBtns');
  if(!checked){
    btns.innerHTML=
      '<button class="btn" onclick="fillClear()" style="opacity:.7">↺ Limpar</button>'
      +'<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700" onclick="fillCheck()">✓ Verificar</button>';
  } else {
    btns.innerHTML='<button class="btn" style="background:#4f7a3a;color:#fff;border:none;font-weight:700" onclick="fillNext()">Próximo →</button>';
    if(isCorrect)setTimeout(fillNext,1200);
  }
}
function fillAddWord(idx){
  var w=_fillPool[idx];
  // Check if this instance is still available
  var usedCount=_fillAnswer.filter(function(a){return a===w;}).length;
  var poolCount=_fillPool.filter(function(p){return p===w;}).length;
  if(usedCount>=poolCount)return;
  _fillAnswer.push(w);
  var pair=_fillQueue[_fillIdx];
  renderFillCard(pair[0],pair[1],false,null);
}
function fillRemoveWord(idx){
  _fillAnswer.splice(idx,1);
  var pair=_fillQueue[_fillIdx];
  renderFillCard(pair[0],pair[1],false,null);
}
function fillClear(){_fillAnswer=[];var pair=_fillQueue[_fillIdx];renderFillCard(pair[0],pair[1],false,null);}
function fillCheck(){
  var pair=_fillQueue[_fillIdx];
  var sentence=pair[0];
  // Normalize: remove punctuation from both
  var normTarget=sentence.replace(/[.,!?]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  var normAnswer=_fillAnswer.join(' ').replace(/[.,!?]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  var correct=normAnswer===normTarget;
  // Track score
  var key=_fillId+'::'+_fillDeck+'::'+pair[0];
  if(correct){if(!state.fill[key]||state.fill[key]<1)state.fill[key]=1;}
  else{if(!state.fill[key])state.fill[key]=0;}
  save();
  renderFillCard(pair[0],pair[1],true,correct);
}
function fillNext(){_fillIdx++;renderFill();}


/* ===== Override srsCardsForTopic: exclui musica (songWords/songLines) =====*/
function srsCardsForTopic(id){
  var d=RICH[id]||{};var out=[],seen={};
  function add(f,b,img){
    if(f==null)return;var k=String(f).toLowerCase().trim();
    if(!k||seen[k])return;seen[k]=1;
    out.push({f:String(f),b:String(b==null?'':b),key:id+'::'+f,img:img||null});
  }
  (d.words||[]).forEach(function(c){(c.items||[]).forEach(function(w){add(w[0],w[1],w[3]);});});
  (d.phraseWords||[]).forEach(function(w){add(w[0],w[1]);});
  (d.phrases||[]).forEach(function(p){add(srsApplyPlaceholders(p[0]),srsApplyPlaceholders(p[1]));});
  return out;
}

/* ===== E-MAIL: registro, verificação e troca de senha =====
   Requer:
   1. SQL de migração: supabase-email.sql
   2. Conta EmailJS em https://emailjs.com (gratuita):
      - Service: conecte seu Gmail/Outlook
      - Template: assunto "Código de verificação", corpo:
          "Seu código: {{code}} — válido por 15 minutos."
      - Preencha as 3 constantes abaixo
   ============================================================ */
var EMAILJS_SERVICE_ID  = 'service_nr171pe';
var EMAILJS_TEMPLATE_ID = 'template_yvalbij';
var EMAILJS_PUBLIC_KEY  = 'RbRbZ5sip0VGG4O2G';

var _emailjsLoaded = false;
function loadEmailJS(cb){
  if(_emailjsLoaded){cb(null);return;}
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload=function(){
    try{emailjs.init({publicKey:EMAILJS_PUBLIC_KEY});}catch(e){console.error('EmailJS init error:',e);}
    _emailjsLoaded=true;cb(null);
  };
  s.onerror=function(){
    console.error('EmailJS: falha ao carregar script');
    cb(new Error('EmailJS script failed to load'));
  };
  document.head.appendChild(s);
}

function genCode(){return String(Math.floor(100000+Math.random()*900000));}

async function sendEmailCode(toEmail, code, nome){
  return new Promise(function(resolve,reject){
    loadEmailJS(function(loadErr){
      if(loadErr){console.error('EmailJS load error:',loadErr);reject(loadErr);return;}
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: toEmail,
        code: code,
        nome: nome||'usuário',
        reply_to: toEmail
      }).then(function(resp){
        console.log('EmailJS enviado com sucesso:', resp.status, resp.text);
        resolve('sent');
      }).catch(function(err){
        console.error('EmailJS send error:', JSON.stringify(err));
        reject(err);
      });
    });
  });
}

/* Estado local do e-mail (carregado ao abrir Ajustes) */
var _emailState = {email:null, verified:false, loaded:false};

async function loadEmailState(){
  if(!currentUser||!sb)return;
  try{
    var r=await sb.rpc('get_user_email',{p_user_id:currentUser.id});
    if(r.data&&r.data.length>0){
      _emailState.email=r.data[0].email||null;
      _emailState.verified=!!r.data[0].email_verified;
    }
    _emailState.loaded=true;
  }catch(e){_emailState.loaded=true;}
}

function emailStatusHtml(){
  if(!currentUser)return '<div style="font-size:12px;color:#888">Faça login para gerenciar e-mail.</div>';
  if(!_emailState.loaded)return '<div style="font-size:12px;opacity:.6">Carregando…</div>';
  if(_emailState.email&&_emailState.verified){
    return '<div style="font-size:13px;color:#4f7a3a">✓ '+srsEsc(_emailState.email)+' verificado</div>';
  } else if(_emailState.email&&!_emailState.verified){
    return '<div style="font-size:13px;color:#e8a020">⚡ '+srsEsc(_emailState.email)+' — aguardando verificação</div>';
  }
  return '<div style="font-size:13px;color:#888">Nenhum e-mail cadastrado</div>';
}

/* ── Fluxo: cadastrar e-mail ── */
function srsOpenEmailRegister(){
  var cur=_emailState.email||'';
  var ov=document.getElementById('cfgOverlay');if(!ov)return;
  ov.innerHTML='<div onclick="event.stopPropagation()" style="background:var(--surface,#fdf9f2);color:var(--ink,#1c1408);border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 12px 44px rgba(0,0,0,.3)">'
    +'<div style="font-weight:700;font-size:17px;margin-bottom:14px">📧 Cadastrar e-mail</div>'
    +'<label style="font-size:13px;font-weight:600">Seu e-mail</label>'
    +'<input id="emailInput" type="email" value="'+srsEsc(cur)+'" placeholder="nome@email.com" style="width:100%;padding:9px;margin:6px 0 12px;border:1px solid #ccc;border-radius:8px;font-size:14px">'
    +'<div id="emailMsg" style="font-size:12px;min-height:18px;margin-bottom:10px"></div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button class="btn" onclick="srsOpenConfig()">← Voltar</button>'
    +'<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700" onclick="srsSubmitEmail()">Enviar código</button>'
    +'</div></div>';
  ov.style.display='flex';
}

async function srsSubmitEmail(){
  var input=document.getElementById('emailInput');
  var msg=document.getElementById('emailMsg');
  if(!input||!msg)return;
  var email=input.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.style.color='#c0212e';msg.textContent='E-mail inválido.';return;}
  msg.style.color='#888';msg.textContent='Enviando código…';
  var code=genCode();
  var expires=new Date(Date.now()+15*60*1000).toISOString();
  try{
    await sb.rpc('set_email',{p_user_id:currentUser.id,p_email:email,p_code:code,p_expires:expires});
    var result=await sendEmailCode(email,code,currentUser.nome);
    if(result&&result.startsWith('dev:')){
      // Dev mode: show code directly
      msg.style.color='#e8a020';
      msg.textContent='Modo dev — código: '+result.split(':')[1]+' (EmailJS não configurado)';
    } else {
      msg.style.color='#4f7a3a';msg.textContent='Código enviado para '+email;
    }
    setTimeout(function(){srsOpenEmailVerify(email,result&&result.startsWith('dev:')?result.split(':')[1]:null);},1200);
  }catch(e){msg.style.color='#c0212e';msg.textContent='Erro: '+(e&&e.message?e.message:JSON.stringify(e));console.error('set_email error',e);}
}

function srsOpenEmailVerify(email, devCode){
  var ov=document.getElementById('cfgOverlay');if(!ov)return;
  var devHint=devCode?'<div style="background:#fff3cd;border-radius:8px;padding:8px;font-size:12px;margin-bottom:8px">Modo dev — código: <b>'+srsEsc(devCode)+'</b></div>':'';
  ov.innerHTML='<div onclick="event.stopPropagation()" style="background:var(--surface,#fdf9f2);color:var(--ink,#1c1408);border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 12px 44px rgba(0,0,0,.3)">'
    +'<div style="font-weight:700;font-size:17px;margin-bottom:8px">🔐 Verificar e-mail</div>'
    +'<div style="font-size:13px;opacity:.7;margin-bottom:14px">Insira o código de 6 dígitos enviado para <b>'+srsEsc(email)+'</b></div>'
    +devHint
    +'<input id="codeInput" type="number" inputmode="numeric" maxlength="6" placeholder="000000" style="width:100%;padding:12px;margin-bottom:12px;border:1px solid #ccc;border-radius:8px;font-size:20px;text-align:center;letter-spacing:4px">'
    +'<div id="verifyMsg" style="font-size:12px;min-height:18px;margin-bottom:10px"></div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button class="btn" onclick="srsOpenEmailRegister()">← Voltar</button>'
    +'<button class="btn" style="background:#4f7a3a;color:#fff;border:none;font-weight:700" onclick="srsVerifyCode()">Verificar</button>'
    +'</div></div>';
  ov.style.display='flex';
  setTimeout(function(){var c=document.getElementById('codeInput');if(c)c.focus();},100);
}

async function srsVerifyCode(){
  var input=document.getElementById('codeInput');
  var msg=document.getElementById('verifyMsg');
  if(!input||!msg)return;
  var code=input.value.trim();
  if(code.length!==6){msg.style.color='#c0212e';msg.textContent='Digite os 6 dígitos.';return;}
  msg.style.color='#888';msg.textContent='Verificando…';
  try{
    var r=await sb.rpc('verify_email',{p_user_id:currentUser.id,p_code:code});
    if(r.data===true){
      _emailState.verified=true;
      msg.style.color='#4f7a3a';msg.textContent='✓ E-mail verificado com sucesso!';
      setTimeout(srsOpenConfig,1200);
    } else {
      msg.style.color='#c0212e';msg.textContent='Código incorreto ou expirado.';
    }
  }catch(e){msg.style.color='#c0212e';msg.textContent='Erro. Tente novamente.';}
}

/* ── Fluxo: trocar senha (PIN) ── */
function srsOpenChangePIN(){
  if(!_emailState.verified){alert('Cadastre e verifique um e-mail antes de trocar a senha.');return;}
  var ov=document.getElementById('cfgOverlay');if(!ov)return;
  ov.innerHTML='<div onclick="event.stopPropagation()" style="background:var(--surface,#fdf9f2);color:var(--ink,#1c1408);border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 12px 44px rgba(0,0,0,.3)">'
    +'<div style="font-weight:700;font-size:17px;margin-bottom:8px">🔑 Trocar senha</div>'
    +'<div style="font-size:13px;opacity:.7;margin-bottom:14px">Enviaremos um código para <b>'+srsEsc(_emailState.email)+'</b></div>'
    +'<div id="pinMsg" style="font-size:12px;min-height:18px;margin-bottom:10px"></div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button class="btn" onclick="srsOpenConfig()">← Voltar</button>'
    +'<button class="btn" style="background:#1c6b8c;color:#fff;border:none;font-weight:700" onclick="srsSendPinCode()">Enviar código</button>'
    +'</div></div>';
  ov.style.display='flex';
}

async function srsSendPinCode(){
  var msg=document.getElementById('pinMsg');if(!msg)return;
  msg.style.color='#888';msg.textContent='Enviando código…';
  var code=genCode();
  var expires=new Date(Date.now()+15*60*1000).toISOString();
  try{
    var r=await sb.rpc('request_pin_change',{p_user_id:currentUser.id,p_code:code,p_expires:expires});
    if(!r.data){msg.style.color='#c0212e';msg.textContent='Erro: e-mail não verificado.';return;}
    var result=await sendEmailCode(_emailState.email,code,currentUser.nome);
    var devCode=result&&result.startsWith('dev:')?result.split(':')[1]:null;
    msg.style.color='#4f7a3a';msg.textContent='Código enviado!';
    setTimeout(function(){srsOpenNewPIN(devCode);},900);
  }catch(e){msg.style.color='#c0212e';msg.textContent='Erro. Tente novamente.';}
}

function srsOpenNewPIN(devCode){
  var ov=document.getElementById('cfgOverlay');if(!ov)return;
  var devHint=devCode?'<div style="background:#fff3cd;border-radius:8px;padding:8px;font-size:12px;margin-bottom:8px">Modo dev — código: <b>'+srsEsc(devCode)+'</b></div>':'';
  ov.innerHTML='<div onclick="event.stopPropagation()" style="background:var(--surface,#fdf9f2);color:var(--ink,#1c1408);border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 12px 44px rgba(0,0,0,.3)">'
    +'<div style="font-weight:700;font-size:17px;margin-bottom:14px">🔑 Nova senha</div>'
    +devHint
    +'<label style="font-size:13px;font-weight:600">Código recebido</label>'
    +'<input id="pinCode" type="number" inputmode="numeric" maxlength="6" placeholder="000000" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #ccc;border-radius:8px;font-size:18px;text-align:center;letter-spacing:3px">'
    +'<label style="font-size:13px;font-weight:600">Nova senha (mínimo 4 dígitos)</label>'
    +'<input id="pinNew" type="password" inputmode="numeric" placeholder="••••" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #ccc;border-radius:8px;font-size:16px">'
    +'<label style="font-size:13px;font-weight:600">Confirmar nova senha</label>'
    +'<input id="pinConfirm" type="password" inputmode="numeric" placeholder="••••" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #ccc;border-radius:8px;font-size:16px">'
    +'<div id="newPinMsg" style="font-size:12px;min-height:18px;margin-bottom:10px"></div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button class="btn" onclick="srsOpenConfig()">Cancelar</button>'
    +'<button class="btn" style="background:#4f7a3a;color:#fff;border:none;font-weight:700" onclick="srsConfirmNewPIN()">Salvar senha</button>'
    +'</div></div>';
  ov.style.display='flex';
}

async function srsConfirmNewPIN(){
  var code=document.getElementById('pinCode').value.trim();
  var np=document.getElementById('pinNew').value.trim();
  var nc=document.getElementById('pinConfirm').value.trim();
  var msg=document.getElementById('newPinMsg');
  if(code.length!==6){msg.style.color='#c0212e';msg.textContent='Código deve ter 6 dígitos.';return;}
  if(np.length<4){msg.style.color='#c0212e';msg.textContent='Senha deve ter ao menos 4 dígitos.';return;}
  if(np!==nc){msg.style.color='#c0212e';msg.textContent='As senhas não coincidem.';return;}
  msg.style.color='#888';msg.textContent='Salvando…';
  try{
    var r=await sb.rpc('change_pin',{p_user_id:currentUser.id,p_code:code,p_new_pin:np});
    if(r.data===true){
      msg.style.color='#4f7a3a';msg.textContent='✓ Senha alterada com sucesso!';
      setTimeout(srsCloseAjustes,1500);
    } else {
      msg.style.color='#c0212e';msg.textContent='Código incorreto ou expirado.';
    }
  }catch(e){msg.style.color='#c0212e';msg.textContent='Erro. Tente novamente.';}
}

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

/* Journey mobile: botão para expandir etapas futuras */
function srsInitJourneyMobile(){
  if(window.innerWidth>600)return;
  var j=document.getElementById('journey');if(!j||j._srsMobileInit)return;
  j._srsMobileInit=true;
  var btn=document.createElement('button');
  btn.className='btn';btn.style.cssText='width:100%;margin-top:6px;font-size:12px';
  btn.textContent='Ver próximas etapas ▾';
  btn.onclick=function(){
    j.classList.toggle('expanded');
    btn.textContent=j.classList.contains('expanded')?'Ocultar etapas ▴':'Ver próximas etapas ▾';
  };
  j.parentNode.insertBefore(btn,j.nextSibling);
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
