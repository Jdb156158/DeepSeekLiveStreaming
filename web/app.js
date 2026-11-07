/* Local adaptation. Live2D artwork is credited without changing its watermark. */
const $ = (id) => document.getElementById(id);
if (location.pathname === '/stage') document.body.classList.add('stage-only');
let character, renderer, audioContext, analyser, audio, mouth = 0, speaking = false, pending = false;
let audioEnabled = false, playbackId = 0;
const audioOwnership = new BroadcastChannel('fish-preview-audio');
const pageId = crypto.randomUUID();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);

function feedback(message, error = false) {
  $('feedback').textContent = message;
  $('feedback').classList.toggle('error', error);
}
function addMessage(who, text) {
  document.querySelector('.empty-message')?.remove();
  const entry = document.createElement('div');
  entry.className = `message ${who}`;
  const name = document.createElement('strong');
  name.textContent = who === 'user' ? '你' : '大肥鱼';
  const content = document.createElement('p');
  content.textContent = text;
  entry.append(name, content);
  $('messages').append(entry);
  $('messages').scrollTop = $('messages').scrollHeight;
}
function setPending(value) {
  pending = value;
  $('send').disabled = value;
  document.querySelectorAll('[data-prompt]').forEach(button => button.disabled = value);
}
async function enableAudio() {
  audioContext ||= new AudioContext();
  await audioContext.resume();
  audioEnabled = true;
  audioOwnership.postMessage(pageId);
  $('stage-sound').hidden = true;
  $('sound').textContent = '声音已开启';
  $('audio-status').textContent = '已就绪';
  feedback('声音已开启，可以和本鱼聊天了。');
}
$('sound').onclick = enableAudio;
$('stage-sound').onclick = enableAudio;
audioOwnership.onmessage = ({data}) => {
  if (data === pageId) return;
  stopPlayback();
  audioEnabled = false;
  setPending(false);
  $('stage-sound').hidden = false;
  $('sound').textContent = '开启声音';
  $('audio-status').textContent = '声音已交给另一个预览页';
};

function stopPlayback() {
  playbackId++;
  if (audio) { audio.pause(); audio.src = ''; audio = null; }
  speaking = false;
  mouth = 0;
  $('caption').hidden = true;
  $('thought').hidden = true;
}
$('stop').onclick = async () => {
  stopPlayback();
  await fetch('/api/stop', {method: 'POST'});
  setPending(false);
  feedback('已停止播放，正在生成的回复也会取消。');
};

async function playSpeech(event) {
  stopPlayback();
  const id = playbackId;
  const text = event.text;
  $('thought').hidden = true;
  $('voice-label').textContent = event.voice;
  addMessage('fish', text);
  if (!audioEnabled) {
    feedback('回复已生成。请先开启声音，再发送一句。');
    $('caption').textContent = text;
    $('caption').hidden = false;
    setPending(false);
    return;
  }
  audio = new Audio(event.audio);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  audio.ontimeupdate = () => {
    if (id !== playbackId || !Number.isFinite(audio?.duration)) return;
    // Approximate display progress, not phoneme-aligned subtitles.
    const progress = Math.min(1, audio.currentTime / audio.duration);
    $('caption').textContent = text.slice(0, Math.max(1, Math.ceil(text.length * progress)));
  };
  audio.onended = () => {
    if (id !== playbackId) return;
    speaking = false;
    mouth = 0;
    setPending(false);
    $('audio-status').textContent = '等待下一句';
    $('caption').textContent = text;
    feedback('本鱼说完啦。');
    setTimeout(() => { if (id === playbackId) $('caption').hidden = true; }, 3500);
  };
  audio.onerror = () => { speaking = false; setPending(false); feedback('语音播放失败，请重新发送。', true); };
  try {
    await audio.play();
    speaking = true;
    $('caption').textContent = text.slice(0, 1);
    $('caption').hidden = false;
    $('audio-status').textContent = '正在说话 · 音频驱动口型';
    feedback('正在说话…');
  } catch {
    setPending(false);
    feedback('浏览器拦截了声音。点击“开启声音”后重新发送。', true);
  }
}
socket.onopen = () => { $('connection').textContent = '本机服务已连接'; };
socket.onclose = () => { $('connection').textContent = '本机服务已断开'; setPending(false); feedback('服务连接已断开，请重新启动本地预览并刷新页面。', true); };
socket.onmessage = ({data}) => {
  const event = JSON.parse(data);
  if (event.type === 'thinking') {
    setPending(true);
    addMessage('user', event.question);
    $('thought').textContent = event.mode === 'speak' ? '本鱼来念一念…' : '本鱼想一想…';
    $('thought').hidden = false;
    feedback(event.mode === 'speak' ? '正在准备配音…' : '本鱼正在想怎么回答…');
  } else if (event.type === 'synthesizing') {
    $('thought').textContent = '马上说给你听…';
    feedback('回答已生成，正在合成声音…');
  } else if (event.type === 'speech') {
    playSpeech(event);
  } else if (event.type === 'error') {
    $('thought').hidden = true;
    feedback(event.message, true);
    setPending(false);
  } else if (event.type === 'stop') {
    stopPlayback();
    setPending(false);
  }
};

$('chat-form').onsubmit = async event => {
  event.preventDefault();
  const text = $('message').value.trim();
  if (!text || pending) return;
  await enableAudio();
  setPending(true);
  try {
    const response = await fetch('/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text, mode: $('read-mode').checked ? 'speak' : 'chat'})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '发送失败，请稍后再试。');
    if (result.cancelled) setPending(false);
    $('message').value = '';
  } catch (error) { setPending(false); feedback(error.message, true); }
};
$('message').onkeydown = event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('chat-form').requestSubmit(); }
};
document.querySelectorAll('[data-prompt]').forEach(button => button.onclick = () => {
  $('message').value = button.dataset.prompt;
  $('read-mode').checked = false;
  $('chat-form').requestSubmit();
});
async function refreshStatus() {
  try {
    const state = await (await fetch('/api/status')).json();
    $('model-status').textContent = state.provider === 'deepseek' ? `DeepSeek · ${state.has_api_key ? '已配置' : '缺少 Key'}` : `本地 Qwen 0.5B · ${state.local_ready ? '已就绪' : '加载中'}`;
    $('provider').value = state.provider;
    $('model-id').value = state.model;
    return state;
  } catch { $('model-status').textContent = '连接失败'; }
}
$('refresh').onclick = refreshStatus;
$('settings-form').onsubmit = async event => {
  event.preventDefault();
  const response = await fetch('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({provider:$('provider').value, model:$('model-id').value, api_key:$('api-key').value})});
  if (!response.ok) { feedback(await response.text(), true); return; }
  $('api-key').value = '';
  await refreshStatus();
  feedback('对话来源已保存。');
};

async function loadCharacter() {
  try {
    const stage = $('stage');
    renderer = new PIXI.Application({view:$('character'), resizeTo:stage, backgroundAlpha:0, antialias:true, resolution:Math.min(devicePixelRatio, 1.5), autoDensity:true});
    character = await PIXI.live2d.Live2DModel.from('/assets/model/大肥鱼.model3.json', {autoInteract:false});
    renderer.stage.addChild(character);
    character.anchor.set(.5, .5);
    const natural = {width:character.width, height:character.height};
    const fit = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      character.scale.set(Math.min(w * 1.06 / natural.width, h * .92 / natural.height));
      character.position.set(w * .5, h * .55);
    };
    new ResizeObserver(fit).observe(stage);
    fit();
    const core = character.internalModel.coreModel;
    const originalUpdate = core.update.bind(core);
    const samples = new Uint8Array(128);
    core.update = () => {
      if (analyser && speaking) {
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const value of samples) energy += ((value - 128) / 128) ** 2;
        mouth += (Math.min(1, Math.sqrt(energy / samples.length) * 8) - mouth) * .45;
      } else mouth *= .65;
      core.setParameterValueById('ParamMouthOpenY', mouth);
      if (!reducedMotion) {
        const t = performance.now() / 1000;
        core.setParameterValueById('ParamAngleZ', Math.sin(t * .7) * 3);
        core.setParameterValueById('ParamAngleX', Math.sin(t * .38) * 4);
        core.setParameterValueById('ParamBodyAngleZ', Math.sin(t * .5) * 1.8);
        const blinkPhase = t % 4.8;
        const eyes = blinkPhase < .16 ? Math.abs(blinkPhase - .08) / .08 : 1;
        core.setParameterValueById('ParamEyeLOpen', eyes);
        core.setParameterValueById('ParamEyeROpen', eyes);
        core.setParameterValueById('ParamBreath', (Math.sin(t * 1.4) + 1) / 2);
      }
      originalUpdate();
    };
    $('model-loading').hidden = true;
    $('performance').textContent = 'Live2D 已就绪 · 呼吸 / 眨眼 / 口型';
    window.previewCharacter = character;
  } catch (error) {
    console.error(error);
    $('model-loading').textContent = '角色加载失败，请检查素材下载后刷新。';
    $('performance').textContent = '角色素材未就绪';
  }
}
refreshStatus();
setInterval(refreshStatus, 15000);
loadCharacter();
