// Free browser-native reading. No account, recording, or paid voice service.
export function mountArticleListener(main){
 const paragraphs=[...main.querySelectorAll('h1,section[id^="chapter-"] > h2,p[data-paragraph]')];
 if(!paragraphs.length)return;
 const root=document.createElement('aside');root.className='bb-listen';root.setAttribute('aria-label','Article read-aloud controls');
 root.innerHTML=`<button class="bb-listen-toggle" type="button" aria-expanded="false" aria-controls="bb-listen-panel">◖ Listen</button><div id="bb-listen-panel" class="bb-listen-panel" hidden><div class="bb-listen-heading"><b>Read Me</b><button type="button" data-action="minimize" aria-label="Minimize reading controls">×</button></div><p class="bb-listen-status" role="status" aria-live="polite">Choose Play to hear this guide.</p><div class="bb-listen-actions"><button type="button" data-action="play">Play</button><button type="button" data-action="pause" disabled>Pause</button><button type="button" data-action="restart">Restart</button><button type="button" data-action="stop" disabled>Stop</button></div><div class="bb-listen-skip"><button type="button" data-action="back" aria-label="Previous paragraph">← Back</button><button type="button" data-action="next" aria-label="Next paragraph">Next →</button></div><label>Reading speed<select class="bb-listen-rate"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label>Voice<select class="bb-listen-voice"><option value="">Device default</option></select></label><label class="bb-listen-follow"><input type="checkbox"> Follow the reading</label><p class="bb-listen-note">Uses your device’s voices. Availability varies by browser. Your private notes are not read.</p></div>`;
 document.body.append(root);
 const toggle=root.querySelector('.bb-listen-toggle'),panel=root.querySelector('.bb-listen-panel'),status=root.querySelector('[role="status"]'),rate=root.querySelector('.bb-listen-rate'),voice=root.querySelector('.bb-listen-voice'),follow=root.querySelector('input'),buttons=Object.fromEntries([...root.querySelectorAll('[data-action]')].map(b=>[b.dataset.action,b]));
 function expand(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));}
 toggle.onclick=()=>expand(panel.hidden);buttons.minimize.onclick=()=>{expand(false);toggle.focus();};
 const synth=window.speechSynthesis;
 if(!synth||!window.SpeechSynthesisUtterance){status.textContent='Read-aloud is unavailable in this browser. You can still read the full guide here.';root.querySelectorAll('button:not(.bb-listen-toggle):not([data-action="minimize"]),select,input').forEach(el=>el.disabled=true);return;}
 const segments=[];
 for(let paragraph=0;paragraph<paragraphs.length;paragraph++){
  let remaining=paragraphs[paragraph].textContent.trim();
  while(remaining){let end=remaining.length;if(end>280){end=remaining.lastIndexOf(' ',280);if(end<1)end=280;}segments.push({paragraph,text:remaining.slice(0,end).trim()});remaining=remaining.slice(end).trim();}
 }
 let index=0,state='idle',generation=0,utterance=null,voices=[];
 function refreshVoices(){const selected=voice.value;voices=synth.getVoices();voice.replaceChildren(new Option('Device default',''));voices.forEach((v,i)=>voice.add(new Option(v.name+' ('+v.lang+')',String(i))));if([...voice.options].some(o=>o.value===selected))voice.value=selected;}
 refreshVoices();synth.addEventListener('voiceschanged',refreshVoices);
 function clearFocus(){paragraphs.forEach(p=>p.classList.remove('bb-speaking'));}
 function controls(){buttons.pause.disabled=!['playing','paused'].includes(state);buttons.pause.textContent=state==='paused'?'Resume':'Pause';buttons.stop.disabled=!['playing','paused'].includes(state);buttons.play.disabled=state==='playing';toggle.textContent=state==='playing'?'◖ Listening':state==='paused'?'◖ Paused':'◖ Listen';}
 function cancel(){generation++;synth.cancel();utterance=null;}
 function speak(){
  if(index>=segments.length){state='finished';index=0;clearFocus();status.textContent='Guide finished. Play to listen again.';controls();return;}
  const item=segments[index],node=paragraphs[item.paragraph],token=generation;
  clearFocus();node.classList.add('bb-speaking');
  if(follow.checked)node.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  const chapter=node.closest('section')?.querySelector('h2')?.textContent||'Introduction';
  status.textContent=chapter+' · '+(item.paragraph+1)+' / '+paragraphs.length;
  utterance=new SpeechSynthesisUtterance(item.text);utterance.rate=Number(rate.value);const selected=voices[Number(voice.value)];if(voice.value!==''&&selected)utterance.voice=selected;else utterance.lang='en-US';
  utterance.onend=()=>{if(token!==generation||state!=='playing')return;index++;speak();};
  utterance.onerror=event=>{if(token!==generation)return;state='idle';clearFocus();status.textContent='Your browser could not read that passage. Choose Play to retry or another voice.';controls();};
  synth.speak(utterance);
 }
 function play(){if(state==='paused'){synth.resume();state='playing';controls();return;}cancel();state='playing';controls();speak();}
 buttons.play.onclick=play;
 buttons.pause.onclick=()=>{if(state==='paused'){play();return;}if(state==='playing'){synth.pause();state='paused';controls();status.textContent='Paused. Choose Resume to continue.';}};
 buttons.stop.onclick=()=>{cancel();index=0;state='idle';clearFocus();status.textContent='Stopped. Play starts from the beginning.';controls();};
 buttons.restart.onclick=()=>{cancel();index=0;state='playing';controls();speak();};
 function skip(direction){const current=segments[index]?.paragraph||0,next=Math.max(0,Math.min(paragraphs.length-1,current+direction));const target=segments.findIndex(s=>s.paragraph===next);if(target<0)return;cancel();index=target;state='playing';controls();speak();}
 buttons.back.onclick=()=>skip(-1);buttons.next.onclick=()=>skip(1);
 for(const input of [rate,voice])input.onchange=()=>{if(state==='playing'){cancel();speak();}else if(state==='paused'){cancel();state='idle';controls();status.textContent='Settings updated. Play resumes at this passage.';}};
 addEventListener('pagehide',()=>{cancel();synth.removeEventListener('voiceschanged',refreshVoices);},{once:true});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){expand(false);toggle.focus();}});
 controls();
}
