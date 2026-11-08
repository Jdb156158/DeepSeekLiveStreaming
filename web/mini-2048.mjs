// Mini 2048 for the console: the operator plays while streaming. Kept independent of the domino
// game so it never touches the character, the brick logic or the chat audio.
const $ = id => document.getElementById(id);
const MINI_SIZE=4;
const MINI_KEY='fish-mini-2048';
const MINI_TARGET=2048;

function miniBlank() {
  return Array.from({length:MINI_SIZE},()=>Array(MINI_SIZE).fill(0));
}
function miniEmptyCells(board) {
  const cells=[];
  for(let r=0;r<MINI_SIZE;r++) for(let c=0;c<MINI_SIZE;c++) if(!board[r][c]) cells.push([r,c]);
  return cells;
}
function miniSpawn(board) {
  const cells=miniEmptyCells(board);
  if(!cells.length) return;
  const [r,c]=cells[(Math.random()*cells.length)|0];
  board[r][c]=Math.random()<0.9?2:4;
}
function miniNew() {
  const board=miniBlank();
  miniSpawn(board);miniSpawn(board);
  return board;
}
// Slide one line toward index 0 and merge equal neighbours once per move (2048 rules).
function miniSlideLine(line) {
  const values=line.filter(Boolean);
  const merged=[];
  let gained=0;
  for(let i=0;i<values.length;i++) {
    if(values[i]===values[i+1]) { merged.push(values[i]*2);gained+=values[i]*2;i++; }
    else merged.push(values[i]);
  }
  while(merged.length<MINI_SIZE) merged.push(0);
  return {line:merged,gained};
}
// Rotate the board so every direction becomes "slide left", then rotate the result back.
function miniRotate(board) {
  return board.map((row,r)=>row.map((_,c)=>board[MINI_SIZE-1-c][r]));
}
function miniMove(board,direction) {
  const turns={left:0,up:1,right:2,down:3}[direction]??0;
  let work=board.map(row=>row.slice());
  for(let i=0;i<turns;i++) work=miniRotate(work);
  let gained=0,moved=false;
  work=work.map(row=>{
    const before=row.join(',');
    const {line,gained:g}=miniSlideLine(row);
    gained+=g;
    if(line.join(',')!==before) moved=true;
    return line;
  });
  for(let i=0;i<(4-turns)%4;i++) work=miniRotate(work);
  return {board:work,gained,moved};
}
function miniCanMove(board) {
  if(miniEmptyCells(board).length) return true;
  for(let r=0;r<MINI_SIZE;r++) for(let c=0;c<MINI_SIZE;c++) {
    const v=board[r][c];
    if(c+1<MINI_SIZE&&board[r][c+1]===v) return true;
    if(r+1<MINI_SIZE&&board[r+1][c]===v) return true;
  }
  return false;
}

const mini={board:miniBlank(),score:0,best:0,won:false,over:false};
function miniLoad() {
  try {
    const saved=JSON.parse(localStorage.getItem(MINI_KEY)||'null');
    if(saved&&Array.isArray(saved.board)&&saved.board.length===MINI_SIZE) {
      mini.board=saved.board.map(row=>row.slice(0,MINI_SIZE).map(v=>Number(v)||0));
      mini.score=Number(saved.score)||0;
      mini.best=Number(saved.best)||0;
      mini.won=!!saved.won;
      mini.over=!miniCanMove(mini.board);
      return;
    }
  } catch { /* Storage may be unavailable; start a fresh board. */ }
  mini.board=miniNew();
}
function miniSave() {
  try {
    localStorage.setItem(MINI_KEY,JSON.stringify({board:mini.board,score:mini.score,best:mini.best,won:mini.won}));
  } catch { /* Saving is a convenience only. */ }
}
function miniRender() {
  const grid=$('mini-2048-grid');
  if(!grid) return;
  const flipped=new Set();
  grid.querySelectorAll('.mini-cell').forEach((cell,index)=>{
    const r=(index/MINI_SIZE)|0,c=index%MINI_SIZE;
    const value=mini.board[r][c];
    if(Number(cell.dataset.value)!==value||!cell.textContent) flipped.add(index);
    cell.dataset.value=String(value);
    cell.textContent=value?String(value):'';
    cell.dataset.level=value?String(Math.min(11,Math.log2(value))):'0';
  });
  // Brief pop on the cells that just changed so the move reads at a glance.
  if(flipped.size<=4) flipped.forEach(index=>{
    const cell=grid.children[index];
    if(!cell) return;
    cell.classList.remove('is-new');
    void cell.offsetWidth;
    cell.classList.add('is-new');
  });
  if($('mini-2048-score')) $('mini-2048-score').textContent=String(mini.score);
  if($('mini-2048-best')) $('mini-2048-best').textContent=String(Math.max(mini.best,mini.score));
  const status=$('mini-2048-status');
  if(status) {
    status.textContent=mini.over?'没有可移动的方向了，点「重开」':(mini.won?'已经到 2048 啦，可以继续合':'方向键或滑动玩，WASD 也行');
    status.dataset.state=mini.over?'over':(mini.won?'won':'');
  }
}
function miniStep(direction) {
  if(mini.over) return;
  const result=miniMove(mini.board,direction);
  if(!result.moved) return;
  mini.board=result.board;
  mini.score+=result.gained;
  mini.best=Math.max(mini.best,mini.score);
  miniSpawn(mini.board);
  if(!mini.won&&mini.board.some(row=>row.includes(MINI_TARGET))) mini.won=true;
  mini.over=!miniCanMove(mini.board);
  miniSave();
  miniRender();
}
function miniReset() {
  mini.board=miniNew();
  mini.score=0;mini.won=false;mini.over=false;
  miniSave();miniRender();
}

function miniInit() {
  const panel=$('mini-2048');
  if(!panel) return;
  const grid=$('mini-2048-grid');
  for(let i=0;i<MINI_SIZE*MINI_SIZE;i++) {
    const cell=document.createElement('div');
    cell.className='mini-cell';cell.dataset.value='0';cell.dataset.level='0';
    grid.append(cell);
  }
  miniLoad();
  miniRender();
  // Keyboard: only when the player is focused on the game, so typing in chat is never hijacked.
  panel.addEventListener('keydown',event=>{
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
    const direction=map[event.key];
    if(!direction) return;
    event.preventDefault();
    miniStep(direction);
  });
  grid.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse') return;
    mini.swipe={x:event.clientX,y:event.clientY};
  });
  grid.addEventListener('pointerup',event=>{
    if(event.pointerType==='mouse'||!mini.swipe) return;
    const dx=event.clientX-mini.swipe.x,dy=event.clientY-mini.swipe.y;
    mini.swipe=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<18) return;
    miniStep(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
  });
  $('mini-2048-reset')?.addEventListener('click',miniReset);
}

miniInit();
