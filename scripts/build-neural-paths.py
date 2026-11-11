# Offline regeneration from the original brain artwork; requires Pillow.
from pathlib import Path
from PIL import Image
import heapq,math,json
p=Path(__file__).resolve().parents[1];W=240
im=Image.open(p/'assets/brain.webp').convert('RGBA').resize((W,W),Image.Resampling.LANCZOS)
pix=list(im.getdata());scores=[(.35*r+.45*g+.2*b)/255*(a/255) for r,g,b,a in pix]
candidates=sorted([(scores[y*W+x],x,y) for y in range(44,197) for x in range(28,213) if scores[y*W+x]>.69],reverse=True)
nodes=[]
for score,x,y in candidates:
 if all((x-a)**2+(y-b)**2>13**2 for a,b in nodes):nodes.append((x,y))
 if len(nodes)==27:break
pairs=set()
for i,a in enumerate(nodes):
 nearest=sorted(((math.dist(a,b),j) for j,b in enumerate(nodes) if i!=j and 22<math.dist(a,b)<95))[:3]
 for d,j in nearest:pairs.add(tuple(sorted((i,j))))
def route(a,b):
 start=a[1]*W+a[0];end=b[1]*W+b[0];dist={start:0};parent={};q=[(0,start)]
 while q:
  cost,u=heapq.heappop(q)
  if cost!=dist.get(u):continue
  if u==end:break
  x,y=u%W,u//W
  for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
   nx,ny=x+dx,y+dy
   if not(20<=nx<220 and 37<=ny<203):continue
   v=ny*W+nx
   if pix[v][3]<100:continue
   nc=cost+(1.414 if dx and dy else 1)*(1+80*(1-scores[v])**4)
   if nc<dist.get(v,1e20):dist[v]=nc;parent[v]=u;heapq.heappush(q,(nc,v))
 if end not in parent:return None
 path=[];u=end
 while u!=start:path.append([u%W*2,u//W*2]);u=parent[u]
 path.append([a[0]*2,a[1]*2]);path.reverse()
 if len(path)>math.dist(a,b)*2.1:return None
 return path
paths=[r for i,j in sorted(pairs) if (r:=route(nodes[i],nodes[j]))]
(p/'assets/neural-paths.json').write_text(json.dumps({'width':480,'nodes':[[x*2,y*2] for x,y in nodes],'paths':paths},separators=(',',':')))
print('Image-derived bright nodes',len(nodes),'weighted bright-line paths',len(paths))
