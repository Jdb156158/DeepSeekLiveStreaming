export const REPAIR_DURATION = 1.4;

const smooth = value => {
  const t=Math.max(0,Math.min(1,value));
  return t*t*(3-2*t);
};

export function repairPose(workTime) {
  const progress=Math.max(0,Math.min(1,workTime/REPAIR_DURATION));
  return {
    squat:smooth(progress/.28)*(1-smooth((progress-.52)/.43)),
    reach:smooth((progress-.13)/.2)*(1-smooth((progress-.75)/.22)),
    lift:smooth((progress-.38)/.44),
  };
}

// Lower the hips over planted feet; keep the dress and torso at their original proportions.
export function squatVertices(vertices,source,rig,amount) {
  for(let i=0;i<source.length;i+=2) {
    const x=source[i]-rig.x,y=source[i+1]-rig.footY;
    const height=y/rig.height;
    const shin=Math.max(0,Math.min(1,(height-.055)/.125));
    const thigh=Math.max(0,Math.min(1,(height-.18)/.155));
    const hipWeight=shin/3+thigh*2/3;
    const knee=shin-thigh;
    const side=x<0?-1:1;
    const angle=.12*amount*smooth((height-.32)/.16);
    const cosine=Math.cos(angle),sine=Math.sin(angle);
    const upperY=y-rig.height*.42;
    vertices[i]=rig.x+x*cosine+upperY*sine+rig.height*amount*(.018*hipWeight-.012*side*knee);
    vertices[i+1]=rig.footY+rig.height*.42-x*sine+upperY*cosine-rig.height*.085*amount*hipWeight;
  }
}

// Fold the thighs toward a low seat, keeping the torso upright and both feet planted.
export function seatedVertices(vertices,source,rig,amount) {
  for(let i=0;i<source.length;i+=2) {
    const x=source[i]-rig.x,height=(source[i+1]-rig.footY)/rig.height;
    const shin=smooth((height-.055)/.125),thigh=smooth((height-.18)/.155);
    const side=x<0?-1:1;
    vertices[i]=source[i]-side*rig.height*.016*amount*(shin-thigh);
    vertices[i+1]=source[i+1]-rig.height*.145*amount*(.22*shin+.78*thigh);
  }
}
