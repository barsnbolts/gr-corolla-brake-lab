'use strict';
const $ = (selector) => document.querySelector(selector);
const options = {
  a: { name:'Hose adapter', label:'A / UPSTREAM HOSE ADAPTER', number:'01', kicker:'A — THE UPSTREAM CONNECTION', title:['One interface.','Two sizes.'], description:'A straight rectangular-to-round adapter compares nominal 2.5-inch and 3-inch hose classes on the same provisional liner interface.', tag:'TWO-SIZE REFERENCE', route:'Round land for a future hose', tradeoff:'A larger circular passage occupies more radial space. Actual hose, clamp, end treatment, insertion and retention remain unresolved.', connection:'Upstream adapter', end:'Hose joint unresolved', note:'Upstream component only. The straight axis is a controlled comparison, not a selected hose route.', color:'#65ddc5', alt:'Rectangular-to-round upstream adapter with a straight circular land and three proposed liner mounts.' },
  b: { name:'Long rigid duct', label:'B / LONG RIGID DUCT', number:'02', kicker:'B — THE CLOSED REGIONAL DUCT', title:['A longer path.','A free outlet.'], description:'A closed curved duct continues the liner feed to a broad rectangular free outlet near the brake. Its 80-unit tangent extension is a first finite-envelope reference.', tag:'CLOSED REGIONAL REFERENCE', route:'Closed passage; free regional discharge', outlet:'102 × 78 · corner R10', tradeoff:'Length contains the route but increases the cantilever and occupied envelope. Secondary support, wheel movement, liner flex and service access remain unresolved.', connection:'Long closed rigid duct', end:'Free discharge near brakes', note:'No rigid bridge to the moving brake. A regional outlet is not a rotor-centre receiver.', color:'#f3aa71', alt:'Long curved closed rigid duct with an inlet flange, proposed mounts and rectangular free outlet.' },
  c: { name:'Full hose system', label:'C / FULL HOSE-SYSTEM ARCHITECTURE', number:'03', kicker:'C — THE COMPLETE ARCHITECTURE', title:['Connect the','whole system.'], description:'A flattened liner transition, supported flexible hose and separate rotor-centre receiver. The architecture is defined; the moving route and receiver geometry remain unfinished.', tag:'SCHEMATIC · SYSTEM UNFINISHED', route:'Supported hose across relative motion', outlet:'Receiver and throat access unresolved', tradeoff:'A complete system needs two retained joints, a flex-rated route, supports and a heat-qualified receiver. An upstream adapter alone does not complete it.', connection:'Transition + supported hose', end:'Separate rotor-centre receiver', note:'Schematic only. Dashed hose route and receiver mounts are unresolved; no installed system CAD is shown.', color:'#8baef4' }
};
const viewNames = {part:'Part',context:'In the car',section:'Section','3d':'Interactive 3D',system:'Next steps'};
const image = $('#concept-image'), stage = $('#concept-stage'), motion = matchMedia('(prefers-reduced-motion: reduce)');
let selected='a', size='2p5', view='part', request=0, viewer, viewerReady, viewerAttempt=0, modelFailures=0, rotate=false, stageVisible=true;
const caption = {part:'Native component geometry',context:'Recorded scan pose · wheel absent',section:'Diagnostic half-section · not a physical part','3d':'Drag to rotate · pinch to zoom'};
const notes = {part:'Real component geometry. Nominal scale, not calibrated hose fit.',context:'Gray: recorded scan. Colour: component. Static pose only; full motion remains unverified.',section:'A visual cut through the actual model. No global wall-thickness or manufacturing qualification.','3d':'Component geometry only. Nominal scale and orientation do not establish installed fit.'};
const systemViews = {
  part:['System architecture · schematic','Architecture schematic. Dashed hose route and receiver mounts remain unresolved.','Four components; one complete architecture. The hose and receiver are not modelled as installed parts.'],
  context:['Stationary and moving frames · schematic','Frame schematic. A supported flexible connection must accommodate steering and suspension movement.','The liner transition stays body-side. The nonrotating receiver follows steering and suspension; the rotor spins beside it.'],
  section:['Joints and interfaces · schematic','Interface schematic. Actual joints, supports, mounts and accessible vane throat remain unresolved.','Verify the captured feed, two retained hose joints, supported flex span and noncontact receiver-to-rotor interface.'],
  system:['Next evidence · schematic','Planning schematic. No full-system 3D model or installed hose route is available.','Select suitable hose and clamps; establish support and receiver datums; then check full motion, heat shielding and service access.']
};
function assetKey(){return selected==='a'?'r005-a-'+size:'r005-b';}
function normalizeView(option,next){if(option==='c')return ['part','context','section','system'].includes(next)?next:next==='3d'?'system':'part';return ['part','context','section','3d'].includes(next)?next:'part';}

function announce(text){ $('#announcement').textContent=text; }
function animate(element){ if(!motion.matches) element.animate([{opacity:.2,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.75,.25,1)'}); }
function shareURL(){const url=new URL(location.href);url.searchParams.set('option',selected);url.searchParams.set('view',view);url.searchParams.set('size',size);url.hash='concepts';return url.href;}
function updateURL(){const url=new URL(location.href);url.searchParams.set('option',selected);url.searchParams.set('view',view);url.searchParams.set('size',size);history.replaceState(null,'',url);}
function setRotation(value){rotate=value&&!motion.matches;$('#rotate-model').setAttribute('aria-pressed',String(rotate));$('#rotate-model').textContent=rotate?'Pause rotation':'Auto-rotate';if(viewer) viewer.autoRotate=rotate&&stageVisible&&!document.hidden&&view==='3d';}
function resetCamera(){if(!viewer)return;viewer.cameraOrbit='35deg 63deg 105%';viewer.cameraTarget='0m 0m 0m';viewer.resetTurntableRotation();viewer.jumpCameraToGoal();}

function loadViewer(){
  if(customElements.get('model-viewer'))return Promise.resolve();
  if(!viewerReady){
    const source='./assets/vendor/model-viewer.min.js'+(viewerAttempt?'?retry='+viewerAttempt:'');viewerAttempt+=1;
    viewerReady=import(source).then(()=>customElements.whenDefined('model-viewer')).catch(error=>{viewerReady=null;throw error;});
  }
  // A timeout keeps the in-flight module reusable; importing it twice redefines its elements.
  let timeout;
  return Promise.race([viewerReady,new Promise((resolve,reject)=>{timeout=setTimeout(()=>reject(new Error('3D viewer timed out.')),15000);})]).finally(()=>clearTimeout(timeout));
}

async function show3D(ticket){
  if(selected==='c')return;
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
    const modelSource=`assets/${assetKey()}.glb`+(modelFailures?'?retry='+modelFailures:'');
    // The component keeps the previous loaded state until its next update.
    const alreadyLoaded=viewer.src===modelSource&&viewer.loaded;
    viewer.poster=`assets/${assetKey()}-poster.webp`;viewer.src=modelSource;
    $('#model-slot').hidden=false;
    if(alreadyLoaded){image.hidden=true;$('#media-status').textContent='';$('#model-controls').hidden=false;stage.setAttribute('aria-busy','false');resetCamera();setRotation(rotate);}
  }catch(error){if(ticket!==request)return;$('#media-status').textContent='3D is unavailable. The original CAD render remains available; tap Explore 3D to retry.';stage.setAttribute('aria-busy','false');}
}

async function select(option=selected,nextView=view,writeURL=true){
  selected=options[option]?option:'a';view=normalizeView(selected,nextView);const ticket=++request,data=options[selected],schematic=selected==='c';
  document.documentElement.style.setProperty('--accent',data.color);$('.explorer').style.setProperty('--accent',data.color);
  document.querySelectorAll('[data-option]').forEach(button=>{const active=button.dataset.option===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  $('#size-controls').hidden=selected!=='a';
  document.querySelectorAll('[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.size===size)));
  const interactive=$('#view-interactive');interactive.dataset.view=schematic?'system':'3d';interactive.textContent=schematic?'Next steps':'Explore 3D';
  const labels=schematic?{part:'System',context:'Frames',section:'Interfaces'}:{part:'Part',context:'In the car',section:'Section'};
  document.querySelectorAll('.view-tabs [data-view]').forEach(button=>{if(labels[button.dataset.view])button.textContent=labels[button.dataset.view];button.setAttribute('aria-pressed',String(button.dataset.view===view));});
  stage.setAttribute('aria-labelledby','tab-'+selected);stage.dataset.view=view;stage.dataset.architecture=selected;stage.setAttribute('aria-busy','true');
  $('#stage-label').textContent=data.label;$('#stage-index').textContent=data.number;$('#stage-tag').textContent=schematic?'SYSTEM SCHEMATIC':'NATIVE CAD';
  $('#view-caption').textContent=schematic?systemViews[view][0]:caption[view];$('#media-note').textContent=schematic?systemViews[view][1]:notes[view];$('#expand-image').hidden=schematic||view==='3d';
  $('#story-number').textContent=data.number+' / '+(selected==='a'?'THE HOSE ADAPTER':selected==='b'?'THE CLOSED DUCT':'THE FULL SYSTEM');
  $('#concept-kicker').textContent=data.kicker;$('#concept-title').replaceChildren(document.createTextNode(data.title[0]),document.createElement('br'),document.createTextNode(data.title[1]));
  const outlet=selected==='a'?(size==='2p5'?'Ø57.5 bore / Ø63.5 outside':'Ø70.2 bore / Ø76.2 outside'):data.outlet;
  for(const [id,text] of Object.entries({'concept-description':data.description,'recommendation':data.tag,'spec-route':data.route,'spec-outlet':outlet,'concept-tradeoff':data.tradeoff,'connection-part':data.connection,'connection-end':data.end,'diagram-note':data.note}))$('#'+id).textContent=text;
  $('#spec-mount').textContent=schematic?'Body-side + separate moving receiver':'Proposed liner attachment';
  $('#spec-note').textContent=selected==='a'?(size==='2p5'?'Clear land area: 2,596.723 nominal units².':'Clear land area: 3,870.474 nominal units².')+' CAD seeds; actual hose fit unresolved.':schematic?'System schematic; no measured receiver or hose route.':'102 × 78, R10 section; 80-unit tangent extension. Nominal and uncalibrated.';
  $('#model-slot').hidden=true;$('#model-controls').hidden=true;$('#media-status').textContent='';if(viewer)viewer.autoRotate=false;
  image.hidden=schematic;$('#system-diagram').hidden=!schematic;
  if(writeURL)updateURL();
  if(schematic){$('#system-diagram').dataset.diagramView=view;$('#system-detail').textContent=systemViews[view][2];stage.setAttribute('aria-busy','false');announce(data.name+' selected. '+systemViews[view][0]);animate($('#system-diagram'));return;}
  image.alt=view==='context'?data.name+' shown in colour against the gray recorded brake-corner scan.':view==='section'?'Diagnostic visual half-section of '+data.name+'.':data.alt;
  image.src=`assets/${assetKey()}-${view==='part'||view==='3d'?'poster':view}.webp`;
  try{await image.decode();}catch{if(ticket===request)$('#media-status').textContent='Image could not load. Try another view or reload the page.';}
  if(ticket!==request)return;animate(image);announce(data.name+(selected==='a'?' '+(size==='2p5'?'2.5':'3')+' inch class':'')+' selected. '+viewNames[view]+' view.');
  if(view==='3d')await show3D(ticket);else stage.setAttribute('aria-busy','false');
}

document.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.option)));
$('.option-tabs').addEventListener('keydown',event=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const index=['a','b','c'].indexOf(selected);const option=event.key==='Home'?'a':event.key==='End'?'c':['a','b','c'][(index+(event.key==='ArrowRight'?1:2))%3];select(option);$('#tab-'+option).focus();});
document.querySelectorAll('.view-tabs [data-view]').forEach(button=>button.addEventListener('click',()=>select(selected,button.dataset.view)));
document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>{select(button.dataset.select,'part');$('#concepts').scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});}));
document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{size=button.dataset.size==='3'?'3':'2p5';select(selected,view);}));
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
function restore(){const params=new URLSearchParams(location.search);size=params.get('size')==='3'?'3':'2p5';select(params.get('option')||'a',params.get('view')||'part',false);}
addEventListener('popstate',restore);restore();

new ResizeObserver(()=>{document.documentElement.style.setProperty('--header-height',$('.site-header').getBoundingClientRect().height+'px');}).observe($('.site-header'));
