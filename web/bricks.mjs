import {DominoGame, ROW_SPACING, BRICK_SPACING, BRICK_HEIGHT, BRICK_WIDTH, BRICK_THICKNESS} from './domino-engine.mjs?v=20261107-audio';
import {SCENES} from './scenes.mjs';
import {repairPose,squatVertices,seatedVertices} from './repair-motion.mjs';

const $ = id => document.getElementById(id);
const COLORS = [0xef947e, 0xe6bd63, 0x83b9a0, 0x90b5d1, 0xb5a2ce, 0xe6a4b6];
const PHASES = {standing:'已就位', falling:'正在倒下', waiting:'排队等扶', repairing:'正在扶砖'};
const game = new DominoGame();
const host = $('brick-stage');
const app = new PIXI.Application({view:$('game-board'),resizeTo:host,backgroundAlpha:0,antialias:true,
  autoDensity:true,resolution:2});
const world = new PIXI.Container();
const garden = PIXI.Sprite.from('/art/garden-courtyard.png');
garden.width=1000;garden.height=1000;
let sceneRequest=0;
let selectedScene='garden';
for(const scene of SCENES) {
  const button=document.createElement('button');
  button.type='button';button.className='scene-option';button.dataset.scene=scene.id;
  if(scene.pixel) button.dataset.pixel='true';
  button.setAttribute('aria-label',scene.name);button.setAttribute('aria-pressed',String(scene.id===selectedScene));
  const image=document.createElement('img');image.src=scene.image;image.alt='';image.width=160;image.height=100;
  const label=document.createElement('span');label.textContent=scene.name;
  button.append(image,label);
  button.addEventListener('click',()=>selectScene(scene.id));
  $('scene-options').append(button);
}
async function selectScene(id) {
  const scene=SCENES.find(item=>item.id===id);
  if(!scene) return;
  const request=++sceneRequest;
  $('scene-feedback').textContent=`正在准备${scene.name}…`;
  $('scene-options').setAttribute('aria-busy','true');
  try {
    const texture=await PIXI.Texture.fromURL(scene.image);
    if(request!==sceneRequest) return;
    texture.baseTexture.scaleMode=scene.pixel?PIXI.SCALE_MODES.NEAREST:PIXI.SCALE_MODES.LINEAR;
    garden.texture=texture;garden.width=1000;garden.height=1000;
    selectedScene=scene.id;
    host.dataset.scene=scene.id;
    document.body.style.setProperty('--scene-accent',scene.accent);
    host.style.setProperty('--scene-ink',scene.ink);
    $('scene-title').textContent=scene.title;
    document.querySelectorAll('.scene-option').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===scene.id)));
    $('scene-feedback').textContent=`当前：${scene.name}`;
    try {localStorage.setItem('fish-bricks-scene',scene.id);} catch { /* Selection still works when storage is unavailable. */ }
  } catch {
    if(request===sceneRequest)$('scene-feedback').textContent='背景未加载成功，请再点一次。';
  } finally {
    if(request===sceneRequest)$('scene-options').setAttribute('aria-busy','false');
  }
}
let rememberedScene='garden';
try {rememberedScene=localStorage.getItem('fish-bricks-scene')||'garden';} catch { /* Use the default scene. */ }
selectScene(rememberedScene);
const scenery = new PIXI.Graphics();
const pieces = new PIXI.Container();
pieces.sortableChildren = true;
const parasol=PIXI.Sprite.from('/art/rest-parasol.png');
parasol.position.set(0,440);parasol.width=350;parasol.height=350;parasol.zIndex=480;
const stool=PIXI.Sprite.from('/art/rest-stool.png');
stool.position.set(83,720);stool.width=140;stool.height=120;stool.zIndex=829;
const stoolShadow=new PIXI.Graphics();
stoolShadow.beginFill(0x233c62,.055).drawEllipse(155,831,57,14).endFill();
stoolShadow.beginFill(0x233c62,.08).drawEllipse(153,829,42,8).endFill();stoolShadow.zIndex=828;
pieces.addChild(stoolShadow,parasol,stool);
world.addChild(garden,scenery,pieces);
app.stage.addChild(world);
let model, naturalHeight, soundOn = false, audioContext, speechAudio, analyser;
let voiceBusy = false, voiceGeneration = 0, mouth = 0, bubbleUntil = 0, lastPanelUpdate = 0;
let chatPending=false,chatPlaying=false,chatRequest=0,chatCaptionUntil=0;
const audioOwnership=new BroadcastChannel('fish-preview-audio'),audioPageId=crypto.randomUUID();
const WIDTH = 1000, HEIGHT = 1000;
let viewScale = 1, offsetX = 0, offsetY = 0;
const brickArt = game.rows.map(row => row.bricks.map(() => {
  const graphic = new PIXI.Graphics();
  pieces.addChild(graphic);
  return graphic;
}));

function project(x,z,height=0) {
  const perspective = 1 / (1 + z * .065);
  return {x:590 + (x - 3.1) * 104 * perspective + z * 5,
    y:830 - z * 68 * perspective - height * 100 * perspective, scale:perspective};
}
function polygon(graphic, points, color, alpha=1, outline=false) {
  graphic.lineStyle(outline ? 1 : 0,0x76583d,outline ? .17 : 0);
  graphic.beginFill(color,alpha);
  graphic.drawPolygon(points.flatMap(p => [p.x,p.y]));
  graphic.endFill();
}
function shade(color, factor) {
  return (Math.min(255,(color >> 16) * factor) << 16) |
    (Math.min(255,((color >> 8) & 255) * factor) << 8) | Math.min(255,(color & 255) * factor);
}
function drawGround() {
  scenery.clear();
  // The background ground and all objects share one world, without a raised board.
  for(const row of game.rows) {
    const x=(row.id-1)*ROW_SPACING;
    for(let j=0;j<row.bricks.length;j++) {
      const p=project(x,j*BRICK_SPACING);
      scenery.beginFill(0xad7751,.07).drawEllipse(p.x,p.y+2,36*p.scale,10*p.scale).endFill();
    }
  }
}
drawGround();
await document.fonts.load('27px "Garden Happy"');
for(let i=0;i<6;i++) {
  const p=project(i*ROW_SPACING,-.54,.015);
  const marker=new PIXI.Graphics();
  marker.beginFill(0x9b714c,.16).drawEllipse(p.x,p.y+13,28,8).endFill();
  marker.lineStyle(2,0xfff7df,1).beginFill(COLORS[i]).drawRoundedRect(p.x-24,p.y-19,48,40,12).endFill();
  marker.lineStyle(0).beginFill(0xffffff,.25).drawRoundedRect(p.x-18,p.y-14,34,8,4).endFill();
  marker.interactive=true;marker.buttonMode=true;
  marker.on('pointertap',()=>submit(`${i+1}号倒`));
  const label=new PIXI.Text(String(i+1),{fontFamily:'Garden Happy, sans-serif',fontSize:27,fontWeight:'400',fill:0x594b3c});
  label.anchor.set(.5,.5);label.position.set(p.x,p.y-1);
  world.addChild(marker,label);
}
const shadow=new PIXI.Graphics();
pieces.addChild(shadow);
const spark=new PIXI.Graphics();
pieces.addChild(spark);
const phone=new PIXI.Graphics();
phone.lineStyle(1,0x96b2d9).beginFill(0x203451).drawRoundedRect(-10,-16,20,32,4).endFill();
phone.lineStyle(0).beginFill(0xb8e0f3).drawRoundedRect(-7,-12,14,23,2).endFill();
phone.beginFill(0x5c8dc1).drawRect(-5,-9,10,7).endFill();
phone.beginFill(0xffffff).drawRect(-5,1,8,2).drawRect(-5,5,10,2).endFill();
phone.beginFill(0xd6e3f2).drawCircle(0,13,1).endFill();
phone.beginFill(0xffdecb).drawEllipse(-9,5,2.5,4).endFill();
pieces.addChild(phone);

function fit() {
  viewScale=Math.min(host.clientWidth/WIDTH,host.clientHeight/HEIGHT);
  offsetX=(host.clientWidth-WIDTH*viewScale)/2;
  offsetY=(host.clientHeight-HEIGHT*viewScale)/2;
  world.scale.set(viewScale);world.position.set(offsetX,offsetY);
}
new ResizeObserver(fit).observe(host);fit();

function drawBrick(row,index) {
  const x=(row.id-1)*ROW_SPACING,z=index*BRICK_SPACING;
  const angle=row.bricks[index].angle;
  const point=(side,h,depth)=>project(x+side,z+depth*Math.cos(angle)+h*Math.sin(angle),h*Math.cos(angle)-depth*Math.sin(angle)+.003);
  const verts=[];
  for(const h of [0,BRICK_HEIGHT]) for(const depth of [-BRICK_THICKNESS,0]) for(const side of [-BRICK_WIDTH/2,BRICK_WIDTH/2]) {
    verts.push(point(side,h,depth));
  }
  const graphic=brickArt[row.id-1][index];
  graphic.clear();
  const base=project(x,z);
  graphic.zIndex=base.y;
  const near=z-BRICK_THICKNESS*Math.cos(angle),far=z+BRICK_HEIGHT*Math.sin(angle);
  const footprint=[[-1,near],[1,near],[1,far],[-1,far]].map(([side,depth])=>project(x+side*(BRICK_WIDTH/2+.025)+.025,depth-.025));
  polygon(graphic,footprint,0x414c60,.15);
  graphic.beginFill(0x795436,.12).drawEllipse(base.x,base.y+1,25*base.scale,3*base.scale).endFill();
  const color=COLORS[row.id-1];
  const faces=[[[3,2,6,7],.88],[[2,0,4,6],.84],[[1,3,7,5],.8],[[4,5,7,6],1.13],[[2,3,1,0],.78],[[0,1,5,4],1]];
  for(const [indices,light] of faces) {
    const points=indices.map(i=>verts[i]);
    const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0);
    if(area<0) polygon(graphic,points,shade(color,light),1,true);
  }
  const face=(side,h)=>point(side,h,-BRICK_THICKNESS-.001);
  const rim=[face(-BRICK_WIDTH/2+.035,BRICK_HEIGHT-.025),face(BRICK_WIDTH/2-.035,BRICK_HEIGHT-.025)];
  graphic.lineStyle(1,0xffffff,.48).moveTo(rim[0].x,rim[0].y).lineTo(rim[1].x,rim[1].y);
  // Face details use the same rotating plane, including when the domino is lying down.
  for(const side of [-.09,.09]) {
    const eye=[face(side-.018,.57),face(side+.018,.57),face(side+.018,.615),face(side-.018,.615)];
    polygon(graphic,eye,0x685442,.75);
  }
  const left=face(-.05,.49),middle=face(0,.445),right=face(.05,.49);
  graphic.lineStyle(1.5*base.scale,0x685442,.65).moveTo(left.x,left.y).quadraticCurveTo(middle.x,middle.y,right.x,right.y);
}

function feedback(text,error=false) {
  $('command-feedback').textContent=text;
  $('command-feedback').classList.toggle('error',error);
}
function bubble(text,seconds=3.5) {
  if(chatPending || performance.now()<chatCaptionUntil) return;
  $('game-caption').parentElement.dataset.chat='false';
  $('fish-bubble').textContent=text;
  $('fish-bubble').hidden=false;
  $('game-caption').textContent=text;
  bubbleUntil=game.time+seconds;
}
function tone(frequency,length=.06,volume=.04) {
  if(!soundOn || game.paused) return;
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
  oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,audioContext.currentTime);
  gain.gain.setValueAtTime(volume,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+length);
  oscillator.connect(gain);gain.connect(audioContext.destination);
  oscillator.start();oscillator.stop(audioContext.currentTime+length);
}
function stopVoice() {
  voiceGeneration++;
  if(speechAudio) {speechAudio.onended=null;speechAudio.onerror=null;speechAudio.ontimeupdate=null;speechAudio.pause();speechAudio.src='';speechAudio=null;}
  analyser=null;mouth=0;voiceBusy=false;
  if(chatPlaying)finishChat(chatRequest,'声音已停止，回复保留在聊天记录里。');
}
async function say(text) {
  if(!soundOn || !$('game-voice').checked || voiceBusy || chatPending || performance.now()<chatCaptionUntil) return;
  voiceBusy=true;
  const ticket=voiceGeneration;
  try {
    const response=await fetch('/api/game/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || '配音暂不可用');
    if(ticket!==voiceGeneration || !soundOn || game.paused) return;
    speechAudio=new Audio(data.audio);
    analyser=audioContext.createAnalyser();analyser.fftSize=256;
    const source=audioContext.createMediaElementSource(speechAudio);
    source.connect(analyser);analyser.connect(audioContext.destination);
    speechAudio.onended=()=>{if(ticket===voiceGeneration){voiceBusy=false;mouth=0;analyser=null;}};
    speechAudio.onerror=()=>{voiceBusy=false;};
    await speechAudio.play();
    $('voice-feedback').textContent=data.voice+' · 固定短台词';
  } catch { $('voice-feedback').textContent='配音暂不可用，砖块音效和游戏继续。'; }
  finally {if(ticket===voiceGeneration && (!speechAudio || speechAudio.paused)) voiceBusy=false;}
}
async function enableSound() {
  audioContext ||= new AudioContext();
  // Some browsers never settle resume() without a real user gesture; do not block chat on it.
  await Promise.race([audioContext.resume(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('声音未就绪')),2000))]);
  soundOn=true;$('game-sound').textContent='声音已开启';audioOwnership.postMessage(audioPageId);
}
$('game-sound').onclick=async()=>{
  if(soundOn){soundOn=false;stopVoice();$('game-sound').textContent='开启声音';return;}
  try {await enableSound();tone(660,.12);} catch {chatFeedback('声音暂时无法开启，文字聊天仍可使用。',true);}
};
$('game-voice').onchange=()=>{if(!$('game-voice').checked && !chatPending)stopVoice();};
audioOwnership.onmessage=({data})=>{
  if(data===audioPageId)return;
  soundOn=false;stopVoice();$('game-sound').textContent='开启声音';
  chatFeedback('声音已交给另一个预览页，聊天文字仍会显示。');
};

function chatFeedback(text,error=false) {
  $('chat-feedback').textContent=text;$('chat-feedback').classList.toggle('error',error);
}
function addChatMessage(who,text) {
  $('garden-messages').querySelector('.empty-message')?.remove();
  const entry=document.createElement('div'),name=document.createElement('strong'),content=document.createElement('p');
  entry.className=`message ${who}`;name.textContent=who==='user'?'你':'大肥鱼';content.textContent=text;
  entry.append(name,content);$('garden-messages').append(entry);
  $('garden-messages').scrollTop=$('garden-messages').scrollHeight;
}
function setChatPending(value) {
  chatPending=value;$('garden-send').disabled=value;$('chat-stop').disabled=!value;
  $('garden-chat-form').setAttribute('aria-busy',String(value));
  $('garden-chat').dataset.state=chatPlaying?'speaking':value?'thinking':'idle';
  document.querySelectorAll('[data-chat-prompt]').forEach(button=>button.disabled=value);
}
function chatCaption(text) {
  $('fish-bubble').hidden=true;$('game-caption').parentElement.dataset.chat='true';
  $('game-caption').textContent=text;
}
function finishChat(ticket,message,error=false) {
  if(ticket!==chatRequest)return;
  chatPlaying=false;voiceBusy=false;analyser=null;mouth=0;
  setChatPending(false);chatCaptionUntil=performance.now()+5000;
  chatFeedback(message,error);
}
async function sendChat() {
  const text=$('garden-message').value.trim();
  if(!text || chatPending)return;
  const ticket=++chatRequest,mode=$('garden-read-mode').checked?'speak':'chat';
  stopVoice();setChatPending(true);addChatMessage('user',text);
  chatCaption(mode==='speak'?'本鱼来念一念…':'本鱼想一想…');
  chatFeedback(mode==='speak'?'正在准备朗读…':'正在想回答和准备声音，小院照常玩。');
  try {
    try {await enableSound();} catch {soundOn=false;}
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,mode})});
    const data=await response.json();
    if(ticket!==chatRequest)return;
    if(!response.ok)throw new Error(data.error || '发送失败，请稍后再试。');
    if(data.cancelled){finishChat(ticket,'这条回复已取消。');return;}
    addChatMessage('fish',data.text);chatCaption(data.text);
    if($('garden-message').value.trim()===text)$('garden-message').value='';
    if(!soundOn){finishChat(ticket,'回复已显示，开启声音后可继续听本鱼说。');return;}
    const audio=new Audio(data.audio);speechAudio=audio;
    analyser=audioContext.createAnalyser();analyser.fftSize=256;
    const source=audioContext.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioContext.destination);
    audio.ontimeupdate=()=>{
      if(ticket!==chatRequest || !Number.isFinite(audio.duration))return;
      const end=Math.max(1,Math.ceil(data.text.length*audio.currentTime/audio.duration));
      chatCaption(data.text.slice(Math.max(0,end-70),end));
    };
    audio.onended=()=>{if(ticket===chatRequest){chatCaption(data.text.slice(-70));finishChat(ticket,'本鱼说完啦，还想聊什么？');}};
    audio.onerror=()=>{if(ticket===chatRequest)finishChat(ticket,'回复已显示，语音播放失败，请再试一次。',true);};
    try {
      await audio.play();
      if(ticket!==chatRequest)return;
      chatPlaying=true;voiceBusy=true;setChatPending(true);chatFeedback('本鱼正在说话 · '+data.voice);
    } catch {finishChat(ticket,'回复已显示。浏览器拦住了声音，请点击“开启声音”后再发一句。',true);}
  } catch(error) {
    if(ticket===chatRequest){chatCaption('本鱼这句没接上，再试一次吧。');finishChat(ticket,error.message,true);}
  }
}
$('garden-chat-form').onsubmit=event=>{event.preventDefault();sendChat();};
$('garden-message').onkeydown=event=>{
  if(event.key==='Enter' && !event.shiftKey && !event.isComposing){event.preventDefault();$('garden-chat-form').requestSubmit();}
};
document.querySelectorAll('[data-chat-prompt]').forEach(button=>button.onclick=()=>{
  $('garden-message').value=button.dataset.chatPrompt;$('garden-read-mode').checked=false;sendChat();
});
$('chat-stop').onclick=async()=>{
  chatRequest++;stopVoice();chatPlaying=false;setChatPending(false);chatCaptionUntil=0;
  chatCaption('本鱼先不说啦。');
  try {
    const response=await fetch('/api/stop',{method:'POST'});
    if(!response.ok)throw new Error();
    chatFeedback('已停止说话，正在准备的回复也会取消。');
  } catch {chatFeedback('本页声音已停止，服务取消请求未成功，请稍后再试。',true);}
};
async function refreshChatStatus() {
  try {
    const response=await fetch('/api/status');
    if(!response.ok)throw new Error();
    const state=await response.json(),remote=state.provider==='deepseek';
    $('chat-provider-label').textContent=remote?'DeepSeek':'本地 Qwen';
    $('chat-model-status').textContent=remote?`DeepSeek · ${state.has_api_key?'已配置':'缺少 Key'}`:`本地 Qwen 0.5B · ${state.local_ready?'已就绪':'加载中'}`;
    $('chat-provider').value=state.provider;$('chat-model-id').value=state.model;
  } catch {$('chat-provider-label').textContent='未连接';$('chat-model-status').textContent='对话服务连接失败，请检查本地服务后刷新页面。';}
}
$('garden-settings-form').onsubmit=async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;
  try {
    const response=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:$('chat-provider').value,model:$('chat-model-id').value,api_key:$('chat-api-key').value})});
    if(!response.ok)throw new Error(await response.text());
    $('chat-api-key').value='';await refreshChatStatus();chatFeedback('对话来源已保存，可以在小院继续聊。');
  } catch(error){chatFeedback(error.message,true);} finally {button.disabled=false;}
};
refreshChatStatus();

for(let id=1;id<=6;id++) {
  const button=document.createElement('button');
  button.className='lane-button';button.id=`lane-${id}`;
  button.style.setProperty('--brick-color',`#${COLORS[id-1].toString(16).padStart(6,'0')}`);
  button.innerHTML=`<span class="lane-number">${id}</span><span class="lane-label">${id}号倒<small id="lane-state-${id}">已就位</small></span>`;
  button.setAttribute('aria-label',`推倒${id}号砖`);
  button.onclick=()=>submit(`${id}号倒`);
  $('lane-commands').append(button);
}
function submit(text) {
  const result=game.command(text);
  feedback(result.message,!result.ok);
  updatePanels();
}
$('brick-command-form').onsubmit=event=>{
  event.preventDefault();submit($('brick-command').value);
  $('brick-command').select();
};
$('game-pause').onclick=()=>{
  game.paused=!game.paused;
  if(game.paused && !chatPending) stopVoice();
  $('game-pause').textContent=game.paused?'继续':'暂停';
  $('paused-overlay').hidden=!game.paused;updatePanels();
};
$('game-reset').onclick=()=>{
  if(!chatPending)stopVoice();game.reset();
  $('game-pause').textContent='暂停';$('paused-overlay').hidden=true;
  $('fish-bubble').hidden=true;bubbleUntil=0;
  if(!chatPending)bubble('小院收拾好啦！这次想推几号？');
  feedback('全部摆好了，重新来！');updatePanels();
};

function updatePanels() {
  const snapshot=game.snapshot(),actor=game.actor;
  for(const row of game.rows) {
    $(`lane-${row.id}`).disabled=row.state!=='standing'||game.paused;
    $(`lane-state-${row.id}`).textContent=row.state==='repairing'?`已扶 ${row.repaired}/${row.bricks.length}`:`${PHASES[row.state]} · ${row.bricks.length}块`;
  }
  $('down-count').textContent=snapshot.down;
  $('repair-count').textContent=game.repaired;
  $('queue-status').textContent=game.queue.length?game.queue.map(id=>`${id}号`).join(' → '):'没有待办';
  const phases={idle:'看手机',rising:'起身中',ready:'等砖倒完',moving:'赶路中',repairing:'扶砖中',returning:'回小板凳',settling:'坐下休息'};
  $('work-phase').textContent=game.paused?'已暂停':phases[actor.phase];
  $('current-task').textContent=actor.row?`${actor.row}号 · 正在${actor.phase==='moving'?'走向':'扶起'}第 ${Math.min(actor.brick+1,game.rows[actor.row-1].bricks.length)} 块砖`:
    game.queue.length?'排好队，一排一排来。':actor.phase==='returning'?'忙完啦，回太阳伞下歇一会儿。':'太阳伞下，坐着刷会儿手机。';
  const board=$('game-board');
  board.dataset.down=snapshot.down;board.dataset.activeRow=actor.row||'';
  board.dataset.repaired=game.repaired;board.dataset.paused=game.paused;
  board.dataset.queue=game.queue.join(',');board.dataset.scene=selectedScene;
  board.dataset.actorPhase=actor.phase;board.dataset.recline=actor.recline.toFixed(3);
}

async function loadModel() {
  try {
    model=await PIXI.live2d.Live2DModel.from('/assets/model/大肥鱼.model3.json',{autoInteract:false});
    naturalHeight=model.height;
    model.anchor.set(.5,1);
    pieces.addChild(model);
    const core=model.internalModel.coreModel,originalUpdate=core.update.bind(core);
    const samples=new Uint8Array(128);
    const drawables=core.getModel().drawables;
    const originalVertices=drawables.vertexPositions.map(vertices=>new Float32Array(vertices));
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,previousPose=0;
    for(const vertices of originalVertices)for(let i=0;i<vertices.length;i+=2) {
      minX=Math.min(minX,vertices[i]);maxX=Math.max(maxX,vertices[i]);
      minY=Math.min(minY,vertices[i+1]);maxY=Math.max(maxY,vertices[i+1]);
    }
    const rig={x:(minX+maxX)/2,footY:minY,height:maxY-minY};
    core.update=()=>{
      if(analyser && speechAudio && !speechAudio.paused) {
        analyser.getByteTimeDomainData(samples);
        const energy=samples.reduce((sum,n)=>sum+((n-128)/128)**2,0)/samples.length;
        mouth+=(Math.min(1,Math.sqrt(energy)*8)-mouth)*.45;
      } else mouth*=.6;
      const t=game.time;
      const pose=game.actor.phase==='repairing'?repairPose(game.actor.workTime):{squat:0,reach:0};
      const resting=game.actor.recline*game.actor.recline*(3-2*game.actor.recline);
      core.setParameterValueById('Paramcol_3',1);
      core.setParameterValueById('ParamMouthOpenY',mouth);
      core.setParameterValueById('ParamAngleZ',Math.sin(t*1.6)*2-pose.squat*2);
      core.setParameterValueById('ParamBodyAngleZ',Math.sin(t)*1.5);
      core.setParameterValueById('ParamAngleY',-pose.squat*18-resting*8);
      core.setParameterValueById('ParamEyeBallX',.35);
      core.setParameterValueById('ParamEyeBallY',-pose.reach*.65-resting*.3);
      core.setParameterValueById('Param_arm_R1',-pose.reach*25+resting*28);
      core.setParameterValueById('Param_arm_R2',-pose.reach*18+resting*25);
      core.setParameterValueById('Param_arm_R3',pose.reach*12+resting*15);
      core.setParameterValueById('Param_arm_L1',pose.squat*7+resting*10);
      const phase=t%4.7,eyes=phase<.15?Math.abs(phase-.075)/.075:1;
      core.setParameterValueById('ParamEyeLOpen',eyes);core.setParameterValueById('ParamEyeROpen',eyes);
      // Restore SDK vertices before updating, so seated and squat poses never accumulate.
      if(previousPose)drawables.vertexPositions.forEach((vertices,i)=>vertices.set(originalVertices[i]));
      originalUpdate();
      drawables.vertexPositions.forEach((vertices,i)=>{
        originalVertices[i].set(vertices);
        if(resting || pose.squat || previousPose) {
          if(resting)seatedVertices(vertices,originalVertices[i],rig,resting);
          else squatVertices(vertices,originalVertices[i],rig,pose.squat);
          drawables.dynamicFlags[i]|=32; // Cubism VertexPositionsDidChange, including clipping masks.
        }
      });
      previousPose=resting || pose.squat;
    };
    $('board-loading').hidden=true;
  } catch(error) {
    console.error(error);$('board-loading').textContent='角色加载失败，请刷新页面重试。';
  }
}
app.ticker.add(()=>{
  game.tick(Math.min(app.ticker.deltaMS/1000,.05));
  for(const event of game.takeEvents()) {
    if(event.type==='knock') {
      const line=game.actor.row?`${event.row}号也倒了？本鱼记住你啦！`:`谁推的${event.row}号？本鱼这就来！`;
      bubble(line);say(line);
      tone(180,.12,.08);
    } else if(event.type==='start') {
      bubble(`先扶${event.row}号。一个、两个…`,2.5);
    } else if(event.type==='repair') {
      tone(600+event.brick*35,.08,.035);
    } else if(event.type==='complete') {
      const line=game.queue.length?`${event.row}号搞定！还有？本鱼的腰啊…`:`${event.row}号扶好啦！谁也不许偷偷推。`;
      bubble(line,4);say(line);
    } else if(event.type==='rest') {
      bubble('终于扶完了，坐下刷会儿手机。',3);
    }
  }
  for(const row of game.rows)for(let index=0;index<row.bricks.length;index++)drawBrick(row,index);
  const actor=game.actor,p=project(actor.x,actor.z);
  const bob=actor.phase==='moving'||actor.phase==='returning'?Math.abs(Math.sin(game.time*12))*1.3:0;
  const resting=actor.recline*actor.recline*(3-2*actor.recline);
  shadow.clear();
  shadow.beginFill(0x86603f,.055*(1-resting)).drawEllipse(p.x+5,p.y+3,43*p.scale,13*p.scale).endFill();
  shadow.beginFill(0x86603f,.12*(1-resting)).drawEllipse(p.x+2,p.y+1,32*p.scale,8*p.scale).endFill();
  shadow.beginFill(0x735336,.13*(1-resting)).drawEllipse(p.x,p.y,21*p.scale,4*p.scale).endFill();shadow.zIndex=p.y-1;
  if(model) {
    model.scale.set(268*p.scale/naturalHeight);
    model.rotation=0;
    model.position.set(p.x,p.y-bob+10*resting);
    model.zIndex=p.y+2;
    phone.position.set(model.x+52*p.scale,model.y-92*p.scale);
    phone.rotation=-.2+Math.sin(game.time*.8)*.025;
    phone.scale.set(p.scale);phone.alpha=resting;phone.visible=resting>.01;phone.zIndex=p.y+4;
  } else phone.visible=false;
  spark.clear();
  if(actor.phase==='repairing') {
    const point=project((actor.row-1)*ROW_SPACING,actor.brick*BRICK_SPACING,.65);
    const pulse=repairPose(actor.workTime).reach;
    spark.lineStyle(2,0xfff5ad,pulse);
    for(let i=0;i<4;i++) {
      const angle=i*Math.PI/2+game.time;
      spark.moveTo(point.x+Math.cos(angle)*10,point.y+Math.sin(angle)*10).lineTo(point.x+Math.cos(angle)*17,point.y+Math.sin(angle)*17);
    }
    spark.zIndex=p.y+3;
  }
  if(!game.paused && game.time>bubbleUntil)$('fish-bubble').hidden=true;
  $('fish-bubble').style.left=`${Math.max(115,Math.min(host.clientWidth-115,offsetX+p.x*viewScale+40))}px`;
  $('fish-bubble').style.top=`${offsetY+(p.y-(276-46*resting)*p.scale)*viewScale}px`;
  if(performance.now()-lastPanelUpdate>120){updatePanels();lastPanelUpdate=performance.now();}
});
updatePanels();loadModel();
