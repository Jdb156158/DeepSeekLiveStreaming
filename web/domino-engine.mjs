// The playable rules are independent of rendering, audio and language models.
import {REPAIR_DURATION,repairPose} from './repair-motion.mjs';

export const ROW_SPACING = 1.25;
export const BRICK_SPACING = .82;
export const ROW_BRICK_COUNTS = [4,5,6,7,8,9];
export const BRICK_HEIGHT = 1.04;
export const BRICK_WIDTH = .46;
export const BRICK_THICKNESS = .16;
export const REST_X = -1.1;
export const REST_Z = 0;
const FALL_DURATION = .32;
const IMPACT_ANGLE = Math.asin((BRICK_SPACING - BRICK_THICKNESS) / BRICK_HEIGHT);
const FALL_INTERVAL = FALL_DURATION * Math.sqrt(IMPACT_ANGLE / (Math.PI / 2));

// The upper leading corner rests on the face of the next domino (van Leeuwen, eq. 1).
export function contactAngle(nextAngle) {
  return nextAngle + Math.asin((BRICK_SPACING * Math.cos(nextAngle) - BRICK_THICKNESS) / BRICK_HEIGHT);
}
export const FALLEN_ANGLES = ROW_BRICK_COUNTS.map(count=>{
  const angles=Array(count).fill(Math.PI / 2);
  for(let index=count-2;index>=0;index--)angles[index]=contactAngle(angles[index+1]);
  return angles;
});

export class DominoGame {
  constructor() { this.reset(); }

  reset() {
    this.time = 0;
    this.rows = ROW_BRICK_COUNTS.map((count,index) => ({id:index + 1, state:'standing', fallenAt:0,
      repaired:0, bricks:Array.from({length:count}, () => ({angle:0}))}));
    this.queue = [];
    this.actor = {x:REST_X, z:REST_Z, phase:'idle', row:null, brick:0, workTime:0, recline:1};
    this.paused = false;
    this.repaired = 0;
    this.knocked = 0;
    this.events = [];
  }

  command(text) {
    const match = /^([1-6一二三四五六])\s*号?\s*(倒|倒下|推倒)[！!。\s]*$/.exec(text.trim());
    if (!match) return {ok:false, message:'试试输入“1号倒”到“6号倒”。'};
    const id = Number(match[1]) || '一二三四五六'.indexOf(match[1]) + 1;
    return this.knock(id);
  }

  knock(id) {
    const row = this.rows[id - 1];
    if (!row) return {ok:false, message:'这里只有 1～6 号砖。'};
    if (this.paused) return {ok:false, message:'场景已暂停，先点“继续”再推砖。'};
    if (row.state !== 'standing') return {ok:false, message:`${id}号还没扶完，先给本鱼留条活路吧。`};
    row.state = 'falling';
    row.fallenAt = this.time;
    row.repaired = 0;
    this.queue.push(id);
    if (this.actor.phase==='idle' || this.actor.phase==='settling') this.actor.phase='rising';
    else if (this.actor.phase==='returning') this.actor.phase='ready';
    this.knocked++;
    this.events.push({type:'knock', row:id});
    return {ok:true, message:`${id}号倒啦！${this.queue.length > 1 || this.actor.row ? '已排队，等本鱼过来。' : '本鱼马上来扶。'}`};
  }

  tick(seconds) {
    if (this.paused) return;
    this.time += seconds;
    for (const row of this.rows) {
      if (row.state !== 'falling') continue;
      row.bricks.forEach((brick, index) => {
        const progress = Math.max(0, Math.min(1, (this.time - row.fallenAt - index * FALL_INTERVAL) / FALL_DURATION));
        brick.angle = progress * progress * Math.PI / 2;
      });
      for(let index=row.bricks.length-2;index>=0;index--) {
        row.bricks[index].angle=Math.min(row.bricks[index].angle,contactAngle(row.bricks[index+1].angle));
      }
      if (this.time >= row.fallenAt + (row.bricks.length - 1) * FALL_INTERVAL + FALL_DURATION) row.state = 'waiting';
    }
    const actor = this.actor;
    if (actor.phase === 'rising') {
      actor.recline=Math.max(0,actor.recline-seconds/.65);
      if(actor.recline===0)actor.phase='ready';
    }
    if (actor.phase === 'ready' && this.queue.length) {
      const row = this.rows[this.queue[0] - 1];
      if (row.state === 'waiting') {
        this.queue.shift();
        row.state = 'repairing';
        Object.assign(actor, {phase:'moving', row:row.id, brick:0, workTime:0});
        this.events.push({type:'start', row:row.id});
      }
    }
    if (actor.phase === 'moving' || actor.phase === 'returning') {
      const returning=actor.phase==='returning';
      const targetX = returning?REST_X:(actor.row - 1) * ROW_SPACING - .5;
      const targetZ = returning?REST_Z:actor.brick * BRICK_SPACING;
      const dx = targetX - actor.x, dz = targetZ - actor.z;
      const distance = Math.hypot(dx, dz), step = 2.7 * seconds;
      if (distance <= step) {
        actor.x = targetX;
        actor.z = targetZ;
        actor.phase = returning?'settling':'repairing';
        actor.workTime = 0;
      } else {
        actor.x += dx / distance * step;
        actor.z += dz / distance * step;
      }
    } else if (actor.phase === 'repairing') {
      actor.workTime += seconds;
      const progress = Math.min(1, actor.workTime / REPAIR_DURATION);
      const row = this.rows[actor.row - 1];
      row.bricks[actor.brick].angle = (1 - repairPose(actor.workTime).lift) * FALLEN_ANGLES[actor.row-1][actor.brick];
      if (progress >= 1) {
        row.bricks[actor.brick].angle = 0;
        row.repaired++;
        this.repaired++;
        this.events.push({type:'repair', row:row.id, brick:actor.brick});
        actor.brick++;
        if (actor.brick === row.bricks.length) {
          row.state = 'standing';
          this.events.push({type:'complete', row:row.id});
          Object.assign(actor, {phase:this.queue.length?'ready':'returning', row:null, workTime:0});
        } else actor.phase = 'moving';
      }
    } else if (actor.phase === 'settling') {
      actor.recline=Math.min(1,actor.recline+seconds/.65);
      if(actor.recline===1) {
        actor.phase='idle';
        this.events.push({type:'rest'});
      }
    }
  }

  takeEvents() { return this.events.splice(0); }

  snapshot() {
    return {paused:this.paused, repaired:this.repaired, knocked:this.knocked,
      down:this.rows.reduce((n,row) => n + row.bricks.filter(brick => brick.angle > .02).length, 0),
      queue:[...this.queue], actor:{...this.actor}, rows:this.rows.map(row => ({id:row.id, state:row.state, repaired:row.repaired}))};
  }
}
