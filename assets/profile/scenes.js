/* Owner-editable direction: a symbolic maker, not a likeness or documentary scene. */
(function(root){'use strict';
 const config={release:'living-story-worlds-v16',tones:{dream:'#c398ff',build:'#78dafa',human:'#ffd394',friction:'#ff9996',care:'#98ebc4'},palette:{background:'#0B0912',line:'#b17af5',highlight:'#e3ccff',signal:'#a8f0de',world:'#a471d6'},gravity:{collapse:0.66,swirl:0.48,trailSpan:0.25,trailLife:750},camera:{yaw:-0.30,pitch:0.12,distance:6,focal:6,compactStrength:.65,shots:{
 establish:{yaw:-.30,pitch:.12,distance:6.4,target:[.10,0,0]},
 draft:{yaw:.58,pitch:.30,distance:5.25,target:[-.25,-.09,.22]},
 detail:{yaw:.44,pitch:.18,distance:5.05,target:[-.26,-.08,.25]},
 connect:{yaw:.28,pitch:.17,distance:6.25,target:[-.20,-.07,.15]},
 isolate:{yaw:.48,pitch:.21,distance:7.25,target:[-.12,-.08,.15]},
 intimate:{yaw:.42,pitch:.10,distance:5.35,target:[-.25,-.06,.25]},
 rise:{yaw:-.42,pitch:.02,distance:6.2,target:[-.30,-.10,.20]},
 reveal:{yaw:.20,pitch:.19,distance:6.35,target:[-.08,-.08,.20]},
 portrait:{yaw:-.15,pitch:.10,distance:5.90,target:[-.25,-.08,.20]}
 }},morph:{start:0.16,end:0.91},scenes:[
 {verb:'Imagine',shot:'establish',shape:'maker',pose:'design',label:'00 / THE PERSON BEHIND THE SYSTEM',caption:'A world begins at the end of a drawn line.',scale:1},
 {verb:'Draw',shape:'maker',pose:'draw',label:'01 / BEFORE CODE, A BLANK PAGE',caption:'First, imagine a place someone could belong.',scale:1},
 {verb:'Build',shape:'maker',pose:'build',label:'02 / THE DRAWING BECOMES A SYSTEM',caption:'The lines leave the page. They have to work.',scale:1},
 {verb:'Connect',shape:'maker',pose:'connect',label:'03 / NOTHING IS BUILT ALONE',caption:'An interface is only the beginning of a connection.',scale:1},
 {verb:'Review',shape:'maker',pose:'review',label:'04 / KEEP A PERSON IN THE LOOP',caption:'More intelligence. Still a human decision.',scale:1},
 {verb:'Persist',shape:'maker',pose:'alone',label:'05 / KEEP BUILDING',caption:'Before there was a system, there was a reason to continue.',scale:1},
 {verb:'Refine',shape:'maker',pose:'shape',label:'06 / EXPERIENCE TAKES SHAPE',caption:'A problem becomes a lesson. A lesson becomes a skill.',scale:1},
 {verb:'Create',shape:'maker',pose:'experience',label:'07 / THE SOUL OF AI EXPERIENCES',caption:'The complexity recedes. The person comes forward.',scale:1},
 {verb:'Share',shape:'maker',pose:'offer',label:'08 / STEP INTO WHAT I AM BUILDING',caption:'A story becomes something you can explore.',scale:1},
 {verb:'Reflect',shot:'portrait',shape:'maker',pose:'stand',label:'09 / THE EXPERIENCE BEHIND THE STORY',caption:'The work that brought me here.',scale:0.9},
 {verb:'Begin',shot:'reveal',shape:'maker',pose:'invite',label:'10 / YOUR NEXT CHAPTER',caption:'What could we make possible, together?',scale:1}
 ]};
 // Every visual beat owns a different terrain recipe within the four selected
 // families. The support plane stays fixed while the outer world reconfigures.
 config.floorMotion={squeeze:.10,turn:.12,sink:.075};
 config.floors=[
  {family:'islands',name:'Seeds of possibility',islands:3,lift:.12,bridge:.06,spread:.10,turn:.25,phase:.0,ink:.20},
  {family:'terraces',name:'The blank site',levels:2,rise:.10,lobes:.06,petals:2,wide:1.13,deep:.69,turn:.12,phase:.1,ink:.48},
  {family:'terraces',name:'An imagined home',levels:3,rise:.12,lobes:.10,petals:3,wide:1.02,deep:.80,turn:.42,phase:.3,ink:.55},
  {family:'paths',name:'The first executable line',branches:3,bend:.20,width:.28,turn:.25,phase:.5,ink:.48},
  {family:'terraces',name:'A component foundation',levels:4,rise:.075,lobes:.04,petals:4,wide:1.10,deep:.72,turn:.78,phase:.4,ink:.49},
  {family:'islands',name:'Parts finding their place',islands:3,lift:.20,bridge:.18,spread:.04,turn:.55,phase:.8,ink:.53},
  {family:'terraces',name:'A measured foundation',levels:2,rise:.15,lobes:.035,petals:2,wide:1.02,deep:.86,turn:.0,phase:.9,ink:.48},
  {family:'paths',name:'Across the distance',branches:2,bend:.35,width:.34,turn:.65,phase:1.1,ink:.48},
  {family:'paths',name:'Connections become a network',branches:4,bend:.58,width:.26,turn:.25,phase:1.3,ink:.54},
  {family:'islands',name:'A shared release',islands:5,lift:.14,bridge:.12,spread:.03,turn:.15,phase:1.5,ink:.51},
  {family:'paths',name:'An intelligence pipeline',branches:3,bend:.09,width:.38,turn:1.2,phase:1.7,ink:.51},
  {family:'terraces',name:'A human review boundary',levels:2,rise:.09,lobes:.10,petals:4,wide:1.15,deep:.68,turn:.35,phase:1.9,ink:.45},
  {family:'islands',name:'An approved connection',islands:4,lift:.08,bridge:.08,spread:-.10,turn:.85,phase:2.0,ink:.48},
  {family:'well',name:'Alone with a conviction',depth:.53,skew:.08,wide:1.02,deep:.86,turn:.2,phase:2.2,ink:.36},
  {family:'well',name:'Resistance around the light',depth:.64,skew:.23,lobes:.055,petals:3,wide:1.14,deep:.72,turn:.7,phase:2.4,ink:.43},
  {family:'well',name:'A place to question',depth:.31,skew:.17,wide:1.22,deep:.65,turn:.4,phase:2.6,ink:.36},
  {family:'terraces',name:'Ground recovered through repair',levels:3,rise:.10,lobes:.075,petals:3,wide:1.0,deep:.86,turn:1.05,phase:2.8,ink:.48},
  {family:'terraces',name:'The next foothold',levels:4,rise:.085,lobes:.06,petals:2,wide:1.17,deep:.68,turn:.15,phase:3.0,ink:.53},
  {family:'terraces',name:'A lesson condensed',levels:3,rise:.075,lobes:.035,petals:5,wide:1.20,deep:.64,turn:.60,phase:3.2,ink:.46},
  {family:'paths',name:'Tributaries of knowledge',branches:5,bend:.40,width:.22,turn:.35,phase:3.4,ink:.51},
  {family:'islands',name:'A capability of its own',islands:4,lift:.28,bridge:.16,spread:.11,turn:.30,phase:3.6,ink:.55},
  {family:'islands',name:'A constellation with a moat',islands:6,lift:.17,bridge:.23,spread:.02,turn:.73,phase:3.8,ink:.53},
  {family:'paths',name:'The depth behind an entrance',branches:6,bend:.66,width:.20,turn:.85,phase:4.0,ink:.48},
  {family:'terraces',name:'A clear place to begin',levels:1,rise:.12,lobes:.045,petals:2,wide:1.06,deep:.82,turn:.2,phase:4.2,ink:.40},
  {family:'paths',name:'A person chooses the way',branches:2,bend:.16,width:.42,turn:.15,phase:4.4,ink:.48},
  {family:'islands',name:'Room for another person',islands:2,lift:.10,bridge:.13,spread:.08,turn:.6,phase:4.6,ink:.46},
  {family:'paths',name:'The work opens outward',branches:5,bend:.29,width:.27,turn:1.0,phase:4.8,ink:.51},
  {family:'terraces',name:'Layers of lived experience',levels:3,rise:.11,lobes:.07,petals:4,wide:1.11,deep:.72,turn:.95,phase:5.0,ink:.46},
  {family:'islands',name:'An offer across the gap',islands:3,lift:.17,bridge:.27,spread:.12,turn:1.25,phase:5.2,ink:.49},
  {family:'well',name:'A quiet centre after the journey',depth:.13,skew:.05,lobes:.035,petals:2,wide:1.12,deep:.73,turn:.4,phase:5.4,ink:.40},
  {family:'islands',name:'An open pavilion for what comes next',islands:6,lift:.12,bridge:.10,spread:-.04,turn:.2,phase:5.6,ink:.51}
 ];
 // Stage dressing follows the story, with eight authored objects per chapter.
 // These are symbolic environments, not documentary representations of employers.
 config.environments=[
  {name:'Possibility',tone:'dream',strength:.14,objects:['petal','arch','orb','petal','tower','arch','folio','bridge']},
  {name:'The unbuilt place',tone:'dream',strength:.40,objects:['folio','arch','tower','folio','arch','tower','folio','bridge']},
  {name:'A system under construction',tone:'build',strength:.40,objects:['tower','bridge','tower','layers','layers','arch','orb','tower']},
  {name:'Across the distance',tone:'build',strength:.38,objects:['folio','network','network','folio','bridge','network','bridge','orb']},
  {name:'A human boundary',tone:'care',strength:.38,objects:['layers','arch','network','layers','arch','network','folio','bridge']},
  {name:'The room that remained',tone:'friction',strength:.35,objects:['chair','fragment','arch','chair','bridge','layers','fragment','folio']},
  {name:'What experience leaves behind',tone:'dream',strength:.43,objects:['folio','petal','folio','orb','network','folio','petal','folio']},
  {name:'A place within complexity',tone:'build',strength:.40,objects:['network','arch','layers','layers','bridge','arch','network','bridge']},
  {name:'The work becomes visible',tone:'care',strength:.40,objects:['layers','folio','network','layers','arch','network','tower','tower']},
  {name:'The distance travelled',tone:'dream',strength:.29,objects:['tower','tower','folio','petal','bridge','arch','folio','bridge']},
  {name:'A place for someone else',tone:'care',strength:.34,objects:['petal','arch','network','petal','arch','network','bridge','folio']}
 ];
 // Readable emotional holds are scroll distance, never a timer or wheel lock.
 config.actingHolds=[
  {beat:13,until:.46,meaning:'Stay with the small light while the camera reaches the rear'},
  {beat:20,until:.36,meaning:'Let the newly distilled capability register'},
  {beat:23,until:.34,meaning:'Give the clear entrance a moment to breathe'}
 ];
 // The same remembered line: plan, component, connection, fracture, capability,
 // then an open invitation. [width, height, turns, roundness, network lobes]
 config.memoryForms=[
  [.34,.19,1,.45,0],[.40,.22,1.05,.35,0],[.36,.21,1.2,.42,0],
  [.38,.20,1.25,.85,.12],[.35,.19,1.3,.90,.10],[.34,.19,1.3,1,0],
  [.22,.15,1.85,1,.035],[.37,.22,1.05,.65,.05],[.38,.21,.85,1,0],
  [.35,.18,1.1,1,0],[.42,.20,.72,1,0]
 ];
 // Camera-track coordinates count authored beats before the action easing.
 // Preframe, orbit, hold, return, release. Distance/pivot/pitch stay fixed while
 // locked; compact yaw is authored separately so the rear view survives on phones.
 config.camera.orbits=[
  {id:'drawing-side',start:1.90,lockStart:2.10,turnEnd:2.52,holdEnd:2.64,returnEnd:2.90,end:3.08,
   entryYaw:.58,yaw:1.08,exitYaw:.44,compactYaw:1.00,distance:6.1,pitch:.20,target:[-.24,-.20,.20]},
  {id:'conviction-rear',start:12.45,lockStart:12.92,turnEnd:13.30,holdEnd:13.45,returnEnd:13.94,end:14.15,
   entryYaw:.28,yaw:2.85,exitYaw:.42,compactYaw:2.65,distance:6.9,pitch:.12,target:[-.26,-.22,.16]},
  {id:'synthesis-side',start:18.92,lockStart:19.12,turnEnd:19.70,holdEnd:20.22,returnEnd:20.88,end:21.12,
   entryYaw:.28,yaw:-1.08,exitYaw:.20,compactYaw:-1.00,distance:6.4,pitch:.16,target:[-.18,-.12,.22]},
  {id:'experience-depth',start:21.94,lockStart:22.15,turnEnd:22.68,holdEnd:23.20,returnEnd:23.76,end:24.02,
   entryYaw:.20,yaw:1.05,exitYaw:.44,compactYaw:.98,distance:6.55,pitch:.16,target:[-.15,-.10,.20],disclosureFan:[.68,-.38]}
 ];
 // Documentary inserts: establish context, approach a subject, let it register,
 // then return. They occupy their own intervals beside the locked orbit shots.
 config.camera.inserts=[
  {id:'the-first-mark',subject:'drawing',framing:'hand',start:1.10,arrive:1.34,holdEnd:1.56,end:1.86,distance:2.55,compactDistance:3.05,yaw:.36,compactYaw:.26,pitch:.27,offset:[0,-.015,0],radius:.27},
  {id:'the-review-boundary',subject:'work',framing:'work',start:11.12,arrive:11.37,holdEnd:11.60,end:11.91,distance:3.05,compactDistance:3.55,yaw:-.13,compactYaw:-.08,pitch:.14,offset:[0,0,0],radius:.49},
  {id:'stay-with-the-question',subject:'head',framing:'head',start:15.10,arrive:15.36,holdEnd:15.59,end:15.94,distance:2.15,compactDistance:2.75,yaw:.56,compactYaw:.38,pitch:.07,offset:[.015,-.10,.02],radius:.31},
  {id:'the-light-that-remains',subject:'light',framing:'hand',start:17.00,arrive:17.17,holdEnd:17.31,end:17.58,distance:2.55,compactDistance:3.0,yaw:-.34,compactYaw:-.22,pitch:.12,offset:[-.04,.035,0],radius:.29},
  {id:'a-capability-of-its-own',subject:'work',framing:'work',start:21.24,arrive:21.43,holdEnd:21.62,end:21.87,distance:3.10,compactDistance:3.60,yaw:-.38,compactYaw:-.25,pitch:.11,offset:[0,.02,0],radius:.49},
  {id:'a-person-chooses',subject:'work',framing:'work',start:24.15,arrive:24.39,holdEnd:24.62,end:24.92,distance:3.10,compactDistance:3.60,yaw:.08,compactYaw:.02,pitch:.10,offset:[.06,-.035,0],radius:.49},
  {id:'the-person-behind-it',subject:'head',framing:'head',start:27.14,arrive:27.40,holdEnd:27.62,end:27.91,distance:2.10,compactDistance:2.75,yaw:.10,compactYaw:.04,pitch:.035,offset:[0,-.11,.015],radius:.31}
 ];
 // Selected surroundings turn into dust at meaningful changes. Pods 0/1 flank
 // the maker; the distant third pod stays intact as a quiet visual anchor.
 config.dust={transitions:[
  {from:'house',to:'code',pods:[1],spread:1},
  {from:'component',to:'assembly',pods:[1],interior:true,spread:.75},
  {from:'assembly',to:'ai',pods:[1],interior:true,spread:.8},
  {from:'verified',to:'ember',pods:[0],drift:-.24,spread:.8},
  {from:'fracture',to:'lesson',pods:[0],interior:true,gather:true,drift:-.18,spread:.65},
  {from:'ember',to:'lesson',pods:[0],gather:true,drift:.12,spread:.9},
  {from:'library',to:'skill',pods:[0,1],gather:true,drift:.10,spread:1},
  {from:'complexity',to:'interface',pods:[1],spread:.85},
  {from:'choice',to:'recipient',pods:[0],interior:true,spread:.65}
 ]};
 // BEGIN GENERATED STORY
 config.story=[{"chapter":1,"beats":[{"action":"Imagine a place","caption":"Before software, there was a wish to make a place for people.","pose":"draw","prop":"blueprint","tone":"dream","meaning":"Imagination","energy":1,"shot":"establish"},{"action":"Draw the first lines","caption":"A hand, a drawing, and something that did not exist before.","pose":"sketch","prop":"house","tone":"dream","meaning":"Imagination","energy":1,"shot":"draft"},{"action":"Turn the drawing into an interface","caption":"The medium changed. The instinct to create stayed.","pose":"type","prop":"code","tone":"build","meaning":"Engineering","energy":1,"shot":"detail"}]},{"chapter":2,"beats":[{"action":"Build one component","caption":"An idea has to become something that works.","pose":"type","prop":"component","tone":"build","meaning":"Engineering","energy":1,"shot":"detail"},{"action":"Fit it into a larger system","caption":"A beautiful part still has to belong to the whole.","pose":"build","prop":"assembly","tone":"build","meaning":"Engineering","energy":1,"shot":"connect"},{"action":"Make it dependable","caption":"Other people will rely on the work. The details matter.","pose":"inspect","prop":"verified","tone":"care","meaning":"Dependability","energy":1,"shot":"detail"}]},{"chapter":3,"beats":[{"action":"Listen to the requirement","caption":"The work begins with understanding someone else’s need.","pose":"read","prop":"brief","tone":"human","meaning":"Understanding","energy":1,"shot":"intimate"},{"action":"Connect across boundaries","caption":"My part had to connect with the work around it.","pose":"connect","prop":"network","tone":"build","meaning":"Connection","energy":1,"shot":"connect"},{"action":"Bring the pieces together","caption":"A shared system asks more of us than a single screen.","pose":"build","prop":"assembly","tone":"care","meaning":"Collaboration","energy":1,"shot":"reveal"}]},{"chapter":4,"beats":[{"action":"Invite intelligence into the workflow","caption":"A new possibility enters a familiar process.","pose":"type","prop":"ai","tone":"dream","meaning":"Possibility","energy":1,"shot":"draft"},{"action":"Pause at the review boundary","caption":"An answer is not the end of a human decision.","pose":"inspect","prop":"review","tone":"human","meaning":"Human judgment","energy":1,"shot":"detail"},{"action":"Keep the person in control","caption":"Move forward with a visible path to inspect and review.","pose":"approve","prop":"verified","tone":"care","meaning":"Agency","energy":1,"shot":"connect"}]},{"chapter":5,"beats":[{"action":"Hold on to the possibility","caption":"Not everyone saw it yet. I still wanted to find out.","pose":"alone","prop":"ember","tone":"human","meaning":"Conviction","energy":0.22,"shot":"isolate"},{"action":"Meet the resistance","caption":"Belief did not make the difficult parts disappear.","pose":"reach","prop":"fracture","tone":"friction","meaning":"An obstacle","energy":0.38,"shot":"intimate"},{"action":"Stay with the problem","caption":"What could this difficulty teach me?","pose":"reflect","prop":"lesson","tone":"human","meaning":"Reflection","energy":0.28,"shot":"intimate"},{"action":"Return to the work","caption":"Another attempt. Another refinement. Then back again.","pose":"repair","prop":"repair","tone":"build","meaning":"Iteration","energy":0.65,"shot":"detail"},{"action":"Keep the light alive","caption":"The work continued, week after week.","pose":"rise","prop":"ember","tone":"human","meaning":"Persistence","energy":0.85,"shot":"rise"}]},{"chapter":6,"beats":[{"action":"Keep the lesson","caption":"A problem I had lived through became a starting point.","pose":"read","prop":"lesson","tone":"human","meaning":"Experience","energy":1,"shot":"intimate"},{"action":"Look beyond my own methods","caption":"Seek the strongest ideas and methods I can find.","pose":"research","prop":"library","tone":"build","meaning":"Research","energy":1,"shot":"connect"},{"action":"Distil a capability","caption":"Experience and selected methods become a skill with character.","pose":"shape","prop":"skill","tone":"dream","meaning":"Synthesis","energy":1,"shot":"detail"},{"action":"Build a distinctive advantage","caption":"Purpose. Method. Character. A MOAT I keep developing.","pose":"protect","prop":"moat","tone":"dream","meaning":"Identity","energy":1,"shot":"reveal"}]},{"chapter":7,"beats":[{"action":"Face the hidden complexity","caption":"There is depth behind an experience that feels simple.","pose":"connect","prop":"complexity","tone":"build","meaning":"Depth","energy":1,"shot":"connect"},{"action":"Shape a clear way in","caption":"Design gives that complexity a human starting point.","pose":"shape","prop":"interface","tone":"dream","meaning":"Design","energy":1,"shot":"draft"},{"action":"Give the person agency","caption":"The next step should feel understandable and in their control.","pose":"offer","prop":"choice","tone":"human","meaning":"Agency","energy":1,"shot":"detail"},{"action":"Make the experience inviting","caption":"Useful enough to work. Engaging enough to want to return.","pose":"welcome","prop":"recipient","tone":"care","meaning":"AI experiences","energy":1,"shot":"reveal"}]},{"chapter":8,"beats":[{"action":"Open the door","caption":"An experience becomes meaningful when someone can enter it.","pose":"invite","prop":"interface","tone":"care","meaning":"Invitation","energy":1,"shot":"reveal"},{"action":"Make the work inspectable","caption":"Explore the demonstration. Look beneath the surface.","pose":"inspect","prop":"review","tone":"build","meaning":"Transparency","energy":1,"shot":"detail"},{"action":"Offer the next possibility","caption":"This story continues through what we choose to build next.","pose":"offer","prop":"recipient","tone":"human","meaning":"Possibility","energy":1,"shot":"reveal"}]}];
 // END GENERATED STORY
 if(typeof module==='object'&&module.exports)module.exports=config;else root.ProfileScenes=config;
})(typeof globalThis!=='undefined'?globalThis:this);
