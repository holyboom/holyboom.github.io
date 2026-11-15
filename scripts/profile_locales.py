"""Translate shared chrome at text-node boundaries; never rewrite code or prose fragments."""
import html, json, re
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class ThaiChrome(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.ui=json.loads((ROOT/'scripts/data/profile-ui.th.json').read_text())
        self.parts=[]
        self.raw=False
    def handle_decl(self,decl): self.parts.append('<!'+decl+'>')
    def handle_starttag(self,tag,attrs):
        text=self.get_starttag_text()
        if tag in ('script','style'): self.raw=True
        for key,value in attrs:
            if key in ('aria-label','title','alt') and value in self.ui:
                text=re.sub(r'('+re.escape(key)+r'=)([\"\'])(.*?)\2',lambda m:m[1]+m[2]+html.escape(self.ui[value],quote=True)+m[2],text,count=1)
        self.parts.append(text)
    def handle_startendtag(self,tag,attrs): self.handle_starttag(tag,attrs)
    def handle_endtag(self,tag):
        self.parts.append('</'+tag+'>')
        if tag in ('script','style'): self.raw=False
    def handle_data(self,text):
        key=html.unescape(text.strip())
        if not self.raw and key in self.ui:
            text=text.replace(text.strip(),html.escape(self.ui[key],quote=False))
        self.parts.append(text)
    def handle_entityref(self,name): self.parts.append('&'+name+';')
    def handle_charref(self,name): self.parts.append('&#'+name+';')
    def handle_comment(self,text): self.parts.append('<!--'+text+'-->')

def localize_th(page):
    # Match full link elements, so canonicals and reciprocal hreflang stay intact.
    page=page.replace('<a href="/th/profile/" lang="th">ไทย</a>','<a href="/profile/" lang="en">English</a>')
    page=page.replace('<a href="/th/profile/" lang="th">ภาษาไทย ↗</a>','<a href="/profile/" lang="en">English ↗</a>')
    # One chrome label contains an entity, so translate its complete text node.
    page=page.replace('For recruiters &amp; teams','สำหรับทีมที่อยากร่วมงานกัน')
    page=page.replace('03 / Review &amp; access','03 / สิทธิ์และการตรวจทาน')
    page=page.replace('Boom · AI Engineer &amp; AI Solutions Architect','บูม · AI Engineer &amp; AI Solutions Architect')
    parser=ThaiChrome();parser.feed(page)
    return ''.join(parser.parts)
