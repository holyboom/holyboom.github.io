"""Apply the approved bilingual review to semantic text owners, preserving markup."""
from html.parser import HTMLParser
from html import escape, unescape
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
ATOMIC={'p','h1','h2','h3','h4','blockquote','a','summary','li','figcaption','time','button','b','small'}
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
def normalized(s):return re.sub(r'\s+',' ',s).strip()
def lexical(s):return bool(re.search(r'[A-Za-z\u0e00-\u0e7f]',s))
class Node:
 def __init__(self,tag='',attrs=(),raw='',parent=None):
  self.tag=tag;self.attrs=dict(attrs);self.raw=raw;self.end='';self.parent=parent;self.children=[];self.dirty=False
 def key(self):
  if self.attrs.get('id'):return '#'+self.attrs['id']
  if self.parent is None or not self.parent.tag:return '/'+self.tag
  classes=set(self.attrs.get('class','').split());siblings=[n for n in self.parent.children if isinstance(n,Node) and n.tag==self.tag and set(n.attrs.get('class','').split())==classes and not n.attrs.get('id')]
  return self.parent.key()+'/'+self.tag+('.'+'.'.join(sorted(classes)) if classes else '')+'['+str(siblings.index(self)+1)+']'
 def render(self):
  start=('<'+self.tag+''.join(' '+k+('="'+escape(v,quote=True)+'"' if v is not None else '') for k,v in self.attrs.items())+'>') if self.dirty else self.raw
  return start+''.join(c.render() if isinstance(c,Node) else c.value for c in self.children)+self.end
class Text:
 def __init__(self,value,parent):self.value=value;self.parent=parent
class Document(HTMLParser):
 def __init__(self,s):
  super().__init__(convert_charrefs=False);self.root=Node();self.stack=[self.root];self.nodes=[];self.feed(s)
 def literal(self,value):
  p=self.stack[-1]
  if p.children and isinstance(p.children[-1],Text):p.children[-1].value+=value
  else:p.children.append(Text(value,p))
 def handle_starttag(self,tag,attrs):
  p=self.stack[-1];n=Node(tag,attrs,self.get_starttag_text(),p);p.children.append(n);self.nodes.append(n)
  if tag not in VOID:self.stack.append(n)
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if self.stack[-1].tag==tag:self.stack.pop()
 def handle_endtag(self,tag):
  if len(self.stack)>1 and self.stack[-1].tag==tag:self.stack.pop().end='</'+tag+'>'
  else:raise ValueError('Unbalanced review markup: '+tag)
 def handle_data(self,s):self.literal(s)
 def handle_entityref(self,s):self.literal('&'+s+';')
 def handle_charref(self,s):self.literal('&#'+s+';')
 def handle_decl(self,s):self.literal('<!'+s+'>')
 def handle_comment(self,s):self.literal('<!--'+s+'-->')
 def texts(self,node):
  for c in node.children:
   if isinstance(c,Text):yield c
   elif c.tag not in ('script','style'):yield from self.texts(c)
 def owned(self,node):
  result=[]
  for t in self.texts(node):
   if not lexical(unescape(t.value)):continue
   owner=t.parent
   while owner.parent and owner.tag not in ATOMIC:owner=owner.parent
   if owner.tag not in ATOMIC:owner=t.parent
   if owner is node:result.append(t)
  return result

def set_hero_title(doc,node,value):
 """Use the editor's line breaks while retaining any surviving emphasis."""
 value=value.replace('\r\n','\n').replace('\r','\n')
 emphasis=next((child for child in node.children if isinstance(child,Node) and child.tag=='em'),None)
 match=None
 if emphasis:
  words=normalized(' '.join(unescape(t.value) for t in doc.texts(emphasis))).split()
  pattern=''
  for i,word in enumerate(words):
   if i:
    # A Thai phrase can continue across an old layout break without a space.
    thai_join=re.fullmatch(r'[\u0e00-\u0e7f]{2}',words[i-1][-1]+word[0])
    pattern+=r'\s*' if thai_join else r'\s+'
   pattern+=re.escape(word)
  matches=list(re.finditer(pattern,value)) if pattern else []
  if len(matches)==1:match=matches[0]
 def append_lines(parent,text):
  for i,line in enumerate(text.split('\n')):
   if i:parent.children.append(Node('br',raw='<br>',parent=parent))
   if line:parent.children.append(Text(escape(line,quote=False),parent))
 node.children=[]
 if match:
  append_lines(node,value[:match.start()])
  emphasis.children=[];node.children.append(emphasis)
  append_lines(emphasis,match.group())
  append_lines(node,value[match.end():])
 else:append_lines(node,value)

def set_copy(doc,node,value):
 texts=doc.owned(node);old=normalized(' '.join(unescape(t.value) for t in texts))
 if node.tag=='h1' and node.attrs.get('id')=='hero-title':
  if old!=normalized(value) or '\n' in value or '\r' in value:set_hero_title(doc,node,value)
  return
 if old==normalized(value):return
 if not texts:raise ValueError('Missing text owner: '+node.key())
 # Preserve purposeful emphasis and company spans when the exact phrase survives.
 if len(texts)>1:
  special=[(i,unescape(t.value).strip()) for i,t in enumerate(texts) if t.parent.tag=='strong' or 'career-company' in t.parent.attrs.get('class','').split()]
  if len(special)==1 and special[0][1] in value:
   i,phrase=special[0];before,after=value.split(phrase,1)
   if i>0 and i<len(texts)-1:
    pieces=['']*len(texts);pieces[0]=before;pieces[i]=phrase;pieces[-1]=after
   elif i==0 and i<len(texts)-1:pieces=[phrase,after]+['']*(len(texts)-2)
   else:pieces=None
  else:pieces=None
  if pieces is None:
   words=value.split();weights=[max(1,len(unescape(t.value).split())) for t in texts];total=sum(weights);pieces=[];start=0;cumulative=0
   for i,w in enumerate(weights):
    cumulative+=w;end=len(words) if i==len(weights)-1 else round(len(words)*cumulative/total);pieces.append(' '.join(words[start:end]));start=end
  for i,(t,piece) in enumerate(zip(texts,pieces)):t.value=escape(piece,quote=False)+(' ' if i<len(texts)-1 and piece else '')
 else:texts[0].value=escape(value,quote=False)
 assert normalized(' '.join(unescape(t.value) for t in texts))==normalized(value),node.key()

def apply_review(page,lang):
 data=json.loads((ROOT/'scripts/data/profile-gemini-copy.json').read_text())['items'];locations=json.loads((ROOT/'scripts/data/profile-copy-locations.json').read_text());field='thai' if lang=='th' else 'english';doc=Document(page);nodes={n.key():n for n in doc.nodes}
 for row in data:
  value=row[field];kind=row['kind'];location=locations.get(row['id'])
  if kind.startswith('Native page /'):set_copy(doc,nodes[location],value)
  elif kind.startswith('Accessibility /'):
   key,attr=location.rsplit('/@',1);n=nodes[key]
   if n.attrs.get(attr)!=value:n.attrs[attr]=value;n.dirty=True
  elif row['section']=='Metadata':
   if kind=='Page title':
    n=next(n for n in doc.nodes if n.tag=='title');n.children=[Text(escape(value),n)]
   else:
    attr,label={'Search description':('name','description'),'Open Graph title':('property','og:title'),'Open Graph description':('property','og:description')}[kind];n=next(n for n in doc.nodes if n.tag=='meta' and n.attrs.get(attr)==label);n.attrs['content']=value;n.dirty=True
 schema=next(n for n in doc.nodes if n.tag=='script' and n.attrs.get('type')=='application/ld+json');obj=json.loads(''.join(t.value for t in schema.children))
 for row in data:
  if row['section']!='Metadata / JSON-LD':continue
  path=row['sourceEn'].split('JSON-LD $',1)[1];keys=[int(b) if b else a for a,b in re.findall(r'([^.[\]]+)|\[(\d+)\]',path)];target=obj
  for key in keys[:-1]:target=target[key]
  target[keys[-1]]=row[field]
 schema.children=[Text(json.dumps(obj,ensure_ascii=False).replace('<','\\u003c'),schema)]
 return doc.root.render()
