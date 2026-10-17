'use strict';
const $ = (selector) => document.querySelector(selector);
const options = {
  a: { name:'Enclosed nozzle', label:'A / ENCLOSED NOZZLE', number:'01', kicker:'A — THE ENCLOSED APPROACH', title:['More enclosure.','More reach.'], description:'A curved, enclosed nozzle carries the factory liner feed toward a free outlet near the brake region. It retains the original reference design.', tag:'ENCLOSED REFERENCE', route:'Enclosed passage; free discharge', outlet:'106 × 78 mm rounded rectangle', tradeoff:'A contained passage offers a more defined route. The longer reach makes wheel movement, liner flex and clearance especially important to verify.', connection:'Enclosed nozzle', end:'Free discharge near brakes', note:'Concept connection only. The stationary liner part does not attach to the moving brake assembly.', color:'#f3aa71', alt:'Orange enclosed nozzle with a curved passage, inlet flange and three proposed mounting pads.' },
  b: { name:'Compact open guide', label:'B / COMPACT OPEN GUIDE', number:'02', kicker:'B — THE OPEN APPROACH', title:['Less enclosure.','More possibility.'], description:'A shorter, broad guide that leaves one side open. It is the first packaging candidate, with less control over where the air goes.', tag:'FIRST PACKAGING CANDIDATE', route:'Broad, open brake-region guide', outlet:'112 × 82 mm open envelope', tradeoff:'An open side makes the guide compact and easy to inspect. Air can also spill out, reducing directional capture.', connection:'Open guide', end:'Free discharge near brakes', note:'Concept connection only. No mechanical bridge to the moving brake assembly.', color:'#65ddc5', alt:'Teal compact open guide with an inlet flange and an intentionally open side.' },
  c: { name:'Upstream hose adapter', label:'C / UPSTREAM HOSE ADAPTER', number:'03', kicker:'C — THE HOSE-FED APPROACH', title:['A different','connection.'], description:'A rectangular-to-round transition for a future hose-fed system. This concept completes the upstream adapter; the moving hose route and rotor receiver are separate work.', tag:'UPSTREAM COMPONENT ONLY', route:'Round connection for a future hose', outlet:'Ø57 mm bore / Ø63 mm outside', tradeoff:'The round outlet is substantially smaller than the inlet. Hose fit, retention, routing and a separate rotor receiver must be resolved; no complete cooling system is supplied.', connection:'Round hose adapter', end:'Hose + receiver: future work', note:'Concept architecture only. The downstream hose and rotor-side receiver are not included.', color:'#8baef4', alt:'Blue upstream hose adapter with a piecewise rectangular-to-round taper and a straight round band.' }
};
const viewNames = {part:'Part',context:'In the car',section:'Section', '3d':'Interactive 3D'};
const image = $('#concept-image'), stage = $('#concept-stage'), motion = matchMedia('(prefers-reduced-motion: reduce)');
let selected='b', view='part', request=0, viewer, viewerReady, viewerAttempt=0, modelFailures=0, rotate=false, stageVisible=true;
const caption = {part:'Original component geometry',context:'Recorded scan pose · wheel absent',section:'Diagnostic half-section · not a physical part','3d':'Drag to rotate · pinch to zoom'};
const notes = {part:'Real geometry. Presentation colours. Nominal scale, not calibrated fit.',context:'Gray: recorded scan. Colour: concept. Static pose only; full motion remains unverified.',section:'A visual cut through the actual model. No global wall-thickness or manufacturing certification.','3d':'Part-only geometry. Display orientation and nominal scale do not establish installed fit.'};

function announce(text){ $('#announcement').textContent=text; }
function animate(element){ if(!motion.matches) element.animate([{opacity:.2,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.75,.25,1)'}); }
function shareURL(){const url=new URL(location.href);url.searchParams.set('option',selected);url.searchParams.set('view',view);url.hash='concepts';return url.href;}
function updateURL(){const url=new URL(location.href);url.searchParams.set('option',selected);url.searchParams.set('view',view);history.replaceState(null,'',url);}
function setRotation(value){rotate=value&&!motion.matches;$('#rotate-model').setAttribute('aria-pressed',String(rotate));$('#rotate-model').textContent=rotate?'Pause rotation':'Auto-rotate';if(viewer) viewer.autoRotate=rotate&&stageVisible&&!document.hidden&&view==='3d';}
function resetCamera(){if(!viewer)return;viewer.cameraOrbit='35deg 63deg 105%';viewer.cameraTarget='0m 0m 0m';viewer.resetTurntableRotation();viewer.jumpCameraToGoal();}

function loadViewer(){
  if(viewerReady)return viewerReady;
  viewerReady=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.type='module';
    script.src='assets/vendor/model-viewer.min.js'+(viewerAttempt?'?retry='+viewerAttempt:'');viewerAttempt+=1;
    const timeout=setTimeout(()=>{script.remove();reject(new Error('3D viewer timed out.'));},15000);
    script.onload=()=>customElements.whenDefined('model-viewer').then(()=>{clearTimeout(timeout);resolve();});
    script.onerror=()=>{clearTimeout(timeout);script.remove();reject(new Error('3D viewer could not load.'));};
    document.head.append(script);
  }).catch(error=>{viewerReady=null;throw error;});
  return viewerReady;
}
async function show3D(ticket){
  $('#media-status').textContent='Preparing the real 3D model…';
  try{
    await loadViewer();if(ticket!==request||view!=='3d')return;
    if(!viewer){
      viewer=document.createElement('model-viewer');
      for(const [name,value] of Object.entries({'camera-controls':'','interaction-prompt':'none','camera-orbit':'35deg 63deg 105%','camera-target':'0m 0m 0m','shadow-intensity':'.65','shadow-softness':'1','exposure':'1.15','min-camera-orbit':'auto 15deg 55%','max-camera-orbit':'auto 165deg 200%','touch-action':'pan-y','loading':'eager'}))viewer.setAttribute(name,value);
      viewer.addEventListener('load',()=>{if(view==='3d'){image.hidden=true;$('#media-status').textContent='';stage.setAttribute('aria-busy','false');$('#model-controls').hidden=false;resetCamera();setRotation(rotate);}});
      viewer.addEventListener('error',()=>{modelFailures+=1;if(view==='3d'){image.hidden=false;$('#media-status').textContent='3D could not load. The original render is still available; select Explore 3D to retry.';stage.setAttribute('aria-busy','false');}});
      $('#model-slot').append(viewer);
    }
    viewer.alt='Interactive 3D: '+options[selected].name+'. Nominal, uncalibrated concept geometry.';
    viewer.poster=`assets/${selected}-poster.webp`;viewer.src=`assets/${selected}.glb`+(modelFailures?'?retry='+modelFailures:'');
    $('#model-slot').hidden=false;
    if(viewer.loaded){image.hidden=true;$('#media-status').textContent='';$('#model-controls').hidden=false;stage.setAttribute('aria-busy','false');resetCamera();setRotation(rotate);}
  }catch(error){if(ticket!==request)return;$('#media-status').textContent='3D is unavailable. The original CAD render remains available; tap Explore 3D to retry.';stage.setAttribute('aria-busy','false');}
}

async function select(option=selected,nextView=view,writeURL=true){
  selected=options[option]?option:'b';view=Object.hasOwn(viewNames,nextView)?nextView:'part';const ticket=++request;const data=options[selected];
  document.documentElement.style.setProperty('--accent',data.color);$('.explorer').style.setProperty('--accent',data.color);
  document.querySelectorAll('[data-option]').forEach(button=>{const active=button.dataset.option===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  document.querySelectorAll('[data-view]').forEach(button=>{if(button.tagName==='BUTTON')button.setAttribute('aria-pressed',String(button.dataset.view===view));});
  stage.setAttribute('aria-labelledby','tab-'+selected);stage.dataset.view=view;stage.setAttribute('aria-busy','true');
  $('#stage-label').textContent=data.label;$('#stage-index').textContent=data.number;$('#view-caption').textContent=caption[view];$('#media-note').textContent=notes[view];$('#expand-image').hidden=view==='3d';
  $('#story-number').textContent=data.number+' / '+(selected==='b'?'THE OPEN APPROACH':selected==='a'?'THE ENCLOSED APPROACH':'THE HOSE-FED APPROACH');
  $('#concept-kicker').textContent=data.kicker;$('#concept-title').replaceChildren(document.createTextNode(data.title[0]),document.createElement('br'),document.createTextNode(data.title[1]));
  for(const [id,text] of Object.entries({'concept-description':data.description,'recommendation':data.tag,'spec-route':data.route,'spec-outlet':data.outlet,'concept-tradeoff':data.tradeoff,'connection-part':data.connection,'connection-end':data.end,'diagram-note':data.note}))$('#'+id).textContent=text;
  $('#model-slot').hidden=true;$('#model-controls').hidden=true;$('#media-status').textContent='';if(viewer)viewer.autoRotate=false;
  image.hidden=false;image.alt=view==='context'?data.name+' shown in colour against the gray recorded brake-corner scan.':view==='section'?'Diagnostic visual half-section of '+data.name+'.':data.alt;
  image.src=`assets/${selected}-${view==='part'||view==='3d'?'poster':view}.webp`;
  if(writeURL)updateURL();
  try{await image.decode();}catch{if(ticket===request)$('#media-status').textContent='Image could not load. Try another view or reload the page.';}
  if(ticket!==request)return;animate(image);announce(data.name+' selected. '+viewNames[view]+' view.');
  if(view==='3d')await show3D(ticket);else stage.setAttribute('aria-busy','false');
}

document.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.option)));
$('.option-tabs').addEventListener('keydown',event=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const index=['a','b','c'].indexOf(selected);const option=event.key==='Home'?'a':event.key==='End'?'c':['a','b','c'][(index+(event.key==='ArrowRight'?1:2))%3];select(option);$('#tab-'+option).focus();});
document.querySelectorAll('.view-tabs [data-view]').forEach(button=>button.addEventListener('click',()=>select(selected,button.dataset.view)));
document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>{select(button.dataset.select,'part');$('#concepts').scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});}));
$('#rotate-model').addEventListener('click',()=>setRotation(!rotate));$('#reset-model').addEventListener('click',resetCamera);
motion.addEventListener('change',()=>{$('#rotate-model').disabled=motion.matches;if(motion.matches)setRotation(false);});$('#rotate-model').disabled=motion.matches;
new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;setRotation(rotate);},{threshold:.05}).observe(stage);
document.addEventListener('visibilitychange',()=>setRotation(rotate));

const imageDialog=$('#image-dialog'), shareDialog=$('#share-dialog');
$('#expand-image').addEventListener('click',()=>{$('#dialog-image').src=image.src;$('#dialog-image').alt=image.alt;$('#dialog-caption').textContent=options[selected].name+' · '+caption[view]+'. '+notes[view];imageDialog.showModal();});
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});});
function showShareFallback(){ $('#share-url').value=shareURL();$('#share-status').textContent='';shareDialog.showModal();$('#share-url').focus();$('#share-url').select(); }
$('#share').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:'GR Brake Lab — '+options[selected].name,text:'Explore the three GR Corolla cooling concepts.',url:shareURL()});return;}catch(error){if(error.name==='AbortError')return;}}showShareFallback();});
$('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#share-url').value);$('#share-status').textContent='Link copied. Ready to share.';}catch{$('#share-url').focus();$('#share-url').select();$('#share-status').textContent='Select and copy the link above.';}});
$('#share-url').addEventListener('click',event=>event.target.select());

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));document.documentElement.classList.add('js');
let scrollPending=false;function progress(){const distance=document.documentElement.scrollHeight-innerHeight;$('.read-progress span').style.transform=`scaleX(${distance>0?Math.min(1,Math.max(0,scrollY/distance)):0})`;scrollPending=false;}
addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(progress);}},{passive:true});addEventListener('resize',progress);progress();
function restore(){const params=new URLSearchParams(location.search);select(params.get('option')||'b',params.get('view')||'part',false);}
addEventListener('popstate',restore);restore();

new ResizeObserver(()=>{document.documentElement.style.setProperty('--header-height',$('.site-header').getBoundingClientRect().height+'px');}).observe($('.site-header'));
