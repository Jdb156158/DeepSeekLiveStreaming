import assert from 'node:assert/strict';
import {DominoGame,ROW_BRICK_COUNTS,BRICK_HEIGHT,BRICK_SPACING,BRICK_THICKNESS,REST_X,REST_Z} from '../web/domino-engine.mjs';
import {REPAIR_DURATION,repairPose,squatVertices,seatedVertices} from '../web/repair-motion.mjs';

function advance(game, seconds) {
  for(let frame=0;frame<Math.ceil(seconds*60);frame++)game.tick(1/60);
}

export function runTests() {
  const passed=[];
  function test(name,check){check();passed.push(name);}
  test('1到6号逐排加长，末块贴地，扶完实际砖数后按序结束',()=>{
    const game=new DominoGame();
    assert.deepEqual(game.rows.map(row=>row.bricks.length),[4,5,6,7,8,9]);
    [1,2,3,4,5,6].forEach(id=>game.knock(id));advance(game,2.1);
    assert.ok(game.rows.every(row=>row.bricks.at(-1).angle===Math.PI/2));
    advance(game,120);
    assert.equal(game.repaired,39);assert.equal(game.snapshot().down,0);
    assert.deepEqual(game.rows.map(row=>row.repaired),[4,5,6,7,8,9]);
    assert.deepEqual(game.takeEvents().filter(event=>event.type==='complete').map(event=>event.row),[1,2,3,4,5,6]);
    assert.equal(game.actor.phase,'idle');
  });
  test('空闲时坐凳休息，推砖后先起身再去扶砖',()=>{
    const game=new DominoGame();
    assert.equal(game.actor.phase,'idle');assert.equal(game.actor.recline,1);
    assert.equal(game.actor.x,REST_X);assert.equal(game.actor.z,REST_Z);
    game.knock(1);advance(game,.3);
    assert.equal(game.actor.phase,'rising');assert.ok(game.actor.recline>0&&game.actor.recline<1);
    advance(game,2);
    assert.equal(game.actor.recline,0);assert.equal(game.actor.row,1);
    advance(game,30);
    assert.equal(game.repaired,ROW_BRICK_COUNTS[0]);assert.equal(game.actor.phase,'idle');
    assert.equal(game.actor.recline,1);assert.equal(game.actor.x,REST_X);assert.equal(game.actor.z,REST_Z);
  });
  test('回小板凳途中收到新指令，继续扶砖且不丢任务',()=>{
    const game=new DominoGame();game.knock(1);
    for(let i=0;i<1800&&game.actor.phase!=='returning';i++)game.tick(1/60);
    assert.equal(game.actor.phase,'returning');
    game.knock(2);assert.equal(game.actor.phase,'ready');assert.equal(game.actor.recline,0);
    advance(game,40);
    assert.equal(game.repaired,ROW_BRICK_COUNTS[0]+ROW_BRICK_COUNTS[1]);assert.equal(game.actor.phase,'idle');
    assert.equal(game.snapshot().down,0);
  });
  test('坐下中途有新任务，从当前姿势起身，不突然跳回坐姿',()=>{
    const game=new DominoGame();game.knock(1);
    for(let i=0;i<1800&&game.actor.phase!=='settling';i++)game.tick(1/60);
    assert.equal(game.actor.phase,'settling');advance(game,.2);
    const before=game.actor.recline;assert.ok(before>0&&before<1);
    game.knock(3);assert.equal(game.actor.recline,before);
    advance(game,.1);assert.ok(game.actor.recline<before);
    advance(game,40);assert.equal(game.repaired,ROW_BRICK_COUNTS[0]+ROW_BRICK_COUNTS[2]);
    assert.equal(game.actor.phase,'idle');
  });
  test('只接受1～6号的明确指令，支持中文号码',()=>{
    const game=new DominoGame();
    for(const text of ['0号倒','7号倒','1.5号倒','随便倒',''])assert.equal(game.command(text).ok,false);
    assert.equal(game.command('一号倒').ok,true);
    assert.equal(game.command('6号倒！').ok,true);
    assert.deepEqual(game.queue,[1,6]);
  });
  test('只有目标排连倒，后排砖不会提前倒下',()=>{
    const game=new DominoGame();game.knock(3);advance(game,.1);
    assert.ok(game.rows[2].bricks[0].angle>0);
    assert.equal(game.rows[2].bricks.at(-1).angle,0);
    assert.ok(game.rows.filter(row=>row.id!==3).every(row=>row.bricks.every(brick=>brick.angle===0)));
  });
  test('连倒先接触下一块，整个倒下过程不穿过相邻牌面',()=>{
    const game=new DominoGame();game.knock(6);
    for(let frame=0;frame<150;frame++) {
      game.tick(1/60);
      const bricks=game.rows[5].bricks;
      for(let i=0;i<bricks.length-1;i++) {
        const a=bricks[i].angle,b=bricks[i+1].angle;
        const clearance=BRICK_SPACING*Math.cos(b)-BRICK_THICKNESS-BRICK_HEIGHT*Math.sin(a-b);
        assert.ok(clearance>=-1e-9,`第${i+1}块穿过下一块`);
        if(b>0)assert.ok(a>=Math.asin((BRICK_SPACING-BRICK_THICKNESS)/BRICK_HEIGHT));
      }
    }
    const bricks=game.rows[5].bricks;
    assert.equal(bricks.at(-1).angle,Math.PI/2);
    assert.ok(bricks.slice(0,-1).every(brick=>brick.angle<Math.PI/2&&brick.angle>1.2));
    for(let i=0;i<bricks.length-1;i++) {
      // A leading upper corner sits on the broad face of the next domino.
      const a=bricks[i].angle,b=bricks[i+1].angle;
      const cornerZ=BRICK_HEIGHT*Math.sin(a),cornerY=BRICK_HEIGHT*Math.cos(a);
      const nextSurfaceY=(cornerZ-BRICK_SPACING)*Math.cos(b)/Math.sin(b)+BRICK_THICKNESS/Math.sin(b);
      assert.ok(Math.abs(cornerY-nextSurfaceY)<1e-9);
    }
  });
  test('扶砖从实际叠压角度平滑抬起，不会先弹向地面',()=>{
    const game=new DominoGame();game.knock(6);advance(game,2.5);
    let previous=game.rows[5].bricks.map(brick=>brick.angle);
    for(let frame=0;frame<1200;frame++) {
      game.tick(1/60);
      const current=game.rows[5].bricks.map(brick=>brick.angle);
      current.forEach((angle,i)=>assert.ok(angle<=previous[i]+1e-9));
      previous=current;
    }
    assert.equal(game.repaired,ROW_BRICK_COUNTS[5]);
  });
  test('先半蹲伸手再抬砖，收尾站起且砖不会反向倒下',()=>{
    const reach=repairPose(REPAIR_DURATION*.35);
    assert.equal(reach.squat,1);assert.equal(reach.reach,1);assert.equal(reach.lift,0);
    const lift=repairPose(REPAIR_DURATION*.65);
    assert.ok(lift.squat>0&&lift.squat<1);assert.ok(lift.lift>0&&lift.lift<1);
    assert.deepEqual(repairPose(REPAIR_DURATION),{squat:0,reach:0,lift:1});
    let previous=0;
    for(let frame=0;frame<=140;frame++) {
      const pose=repairPose(frame/100);
      assert.ok(pose.lift>=previous);previous=pose.lift;
    }
  });
  test('半蹲固定脚底、双膝收拢且不交叉，上身下沉，站起无残留变形',()=>{
    const source=new Float32Array([-.1,0,.1,0,-.08,.27,.08,.27,0,.75,0,1.2]);
    const vertices=new Float32Array(source.length),rig={x:0,footY:0,height:1.4};
    squatVertices(vertices,source,rig,1);
    assert.deepEqual(Array.from(vertices.slice(0,4)),Array.from(source.slice(0,4)));
    assert.ok(vertices[4]>source[4]);assert.ok(vertices[6]<source[6]);
    assert.ok(vertices[6]-vertices[4]>.1);
    assert.ok(vertices[9]<source[9]-.1);assert.ok(vertices[11]<source[11]-.1);
    assert.ok(Math.abs((vertices[11]-vertices[9])-(source[11]-source[9]))<.02);
    const leg=new Float32Array([-.13,.27,-.07,.27]),bentLeg=new Float32Array(4);
    squatVertices(bentLeg,leg,rig,1);
    assert.ok(Math.abs((bentLeg[2]-bentLeg[0])-(leg[2]-leg[0]))<1e-7);
    squatVertices(vertices,source,rig,0);
    assert.deepEqual(vertices,source);
  });
  test('坐凳时双脚落地、膝盖并拢，上身比例保持，起身恢复原形',()=>{
    const source=new Float32Array([-.1,0,.1,0,-.08,.25,.08,.25,0,.6,0,1.2]);
    const vertices=new Float32Array(source.length),rig={x:0,footY:0,height:1.4};
    seatedVertices(vertices,source,rig,1);
    assert.deepEqual(Array.from(vertices.slice(0,4)),Array.from(source.slice(0,4)));
    assert.ok(vertices[4]>source[4]&&vertices[6]<source[6]);
    assert.ok(vertices[4]<0&&vertices[6]>0);
    assert.ok(vertices[5]>0&&vertices[5]<source[5]);
    assert.ok(vertices[9]<source[9]-.18);
    assert.ok(Math.abs((vertices[11]-vertices[9])-(source[11]-source[9]))<1e-7);
    seatedVertices(vertices,source,rig,0);
    assert.deepEqual(vertices,source);
  });
  test('同一排在倒下、排队、扶起期间均不可重复入队',()=>{
    const game=new DominoGame();assert.equal(game.knock(1).ok,true);
    assert.equal(game.knock(1).ok,false);advance(game,2);
    assert.equal(game.knock(1).ok,false);
    assert.equal(game.knocked,1);
  });
  test('任务按触发顺序完成，每排逐块扶好，完成后可以再推',()=>{
    const game=new DominoGame();[4,1,6].forEach(id=>game.knock(id));
    advance(game,90);
    const events=game.takeEvents();
    assert.deepEqual(events.filter(e=>e.type==='start').map(e=>e.row),[4,1,6]);
    assert.deepEqual(events.filter(e=>e.type==='complete').map(e=>e.row),[4,1,6]);
    assert.deepEqual(events.filter(e=>e.type==='repair'&&e.row===4).map(e=>e.brick),[0,1,2,3,4,5,6]);
    assert.equal(game.repaired,ROW_BRICK_COUNTS[3]+ROW_BRICK_COUNTS[0]+ROW_BRICK_COUNTS[5]);
    assert.equal(game.snapshot().down,0);
    assert.ok(game.rows.every(row=>row.state==='standing'));
    assert.equal(game.knock(4).ok,true);
  });
  test('暂停冻结倒砖和角色状态，继续后可完成',()=>{
    const game=new DominoGame();game.knock(2);advance(game,2);game.paused=true;
    const before=JSON.stringify(game.snapshot());advance(game,10);
    assert.equal(JSON.stringify(game.snapshot()),before);
    assert.equal(game.command('3号倒').ok,false);
    game.paused=false;advance(game,30);
    assert.equal(game.repaired,ROW_BRICK_COUNTS[1]);
  });
  test('重置清掉所有待办、动画、暂停和累计计数',()=>{
    const game=new DominoGame();[1,2,3,4,5,6].forEach(id=>game.knock(id));advance(game,3);
    game.paused=true;game.reset();
    assert.deepEqual(game.snapshot(),new DominoGame().snapshot());
    assert.deepEqual(game.takeEvents(),[]);
  });
  return {passed:passed.length,checks:passed};
}
