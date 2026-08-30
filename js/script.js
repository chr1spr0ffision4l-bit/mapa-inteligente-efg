/* ================= SCREEN NAVIGATION ================= */
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.screen === name));
  window.scrollTo({top:0, behavior:"instant"});
}

/* ================= MAIN MAP DATA ================= */
const rooms = {
  sala1: { name:"Sala 01", sub:"1º ano · Bloco Principal", ap:"AP-01", cap:35, count:12 },
  sala2: { name:"Sala 02", sub:"2º ano · Bloco Principal", ap:"AP-01", cap:35, count:18 },
  labrob:{ name:"Laboratório de Robótica", sub:"Bloco técnico", ap:"AP-03", cap:20, count:8 },
  labti: { name:"Laboratório de TI", sub:"Bloco técnico", ap:"AP-03", cap:30, count:15 },
  bib:   { name:"Biblioteca", sub:"Bloco A", ap:"AP-04", cap:40, count:23 },
};

/* ---------- furniture ---------- */
const svgNS = "http://www.w3.org/2000/svg";
const furnitureGroup = document.getElementById("furniture");
function rectEl(x,y,w,h,rx){ const r=document.createElementNS(svgNS,"rect"); r.setAttribute("x",x); r.setAttribute("y",y); r.setAttribute("width",w); r.setAttribute("height",h); if(rx) r.setAttribute("rx",rx); return r; }
function circleEl(cx,cy,rad){ const c=document.createElementNS(svgNS,"circle"); c.setAttribute("cx",cx); c.setAttribute("cy",cy); c.setAttribute("r",rad); return c; }

[ {ox:65}, {ox:325} ].forEach(cfg=>{
  for(let row=0; row<3; row++){ for(let col=0; col<3; col++){ furnitureGroup.appendChild(rectEl(cfg.ox + col*70, 95 + row*35, 40, 20, 2)); } }
  furnitureGroup.appendChild(rectEl(cfg.ox, 60, 34, 16, 2));
});
for(let i=0;i<2;i++){
  furnitureGroup.appendChild(rectEl(70 + i*130, 330, 100, 30, 2));
  furnitureGroup.appendChild(circleEl(95 + i*130, 345, 6));
  furnitureGroup.appendChild(circleEl(120 + i*130, 345, 4));
  furnitureGroup.appendChild(circleEl(145 + i*130, 345, 5));
}
furnitureGroup.appendChild(rectEl(70, 480, 200, 30, 2));
for(let row=0; row<3; row++){
  for(let col=0; col<2; col++){
    const x = 335 + col*110, y = 320 + row*70;
    furnitureGroup.appendChild(rectEl(x, y+20, 80, 22, 2));
    furnitureGroup.appendChild(rectEl(x+28, y, 24, 16, 2));
  }
}
for(let i=0;i<5;i++){ furnitureGroup.appendChild(rectEl(600 + i*44, 75, 12, 90, 1)); }
furnitureGroup.appendChild(rectEl(610, 220, 210, 46, 4));
furnitureGroup.appendChild(rectEl(610, 300, 210, 46, 4));
[0,1,2,3].forEach(i=>{ furnitureGroup.appendChild(circleEl(640 + i*55, 220, 3)); furnitureGroup.appendChild(circleEl(640 + i*55, 266, 3)); });

/* ---------- radar-style device pings ---------- */
const dotCap = { sala1:10, sala2:10, labrob:7, labti:9, bib:12 };
const dotsState = { sala1:[], sala2:[], labrob:[], labti:[], bib:[] };
let dotIdCounter = 0;
function randDotPos(){ return { x: 6 + Math.random()*88, y: 10 + Math.random()*80 }; }
function createDot(layer){
  const pos = randDotPos();
  const wrap = document.createElement("div");
  wrap.className = "dot entering";
  wrap.style.left = pos.x + "%";
  wrap.style.top = pos.y + "%";
  wrap.innerHTML = '<span class="dot-ring"></span><span class="dot-core"></span>';
  layer.appendChild(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove("entering")));
  return { id: dotIdCounter++, el: wrap };
}
function removeDot(entry){
  entry.el.classList.add("leaving");
  setTimeout(() => { if(entry.el.parentNode) entry.el.parentNode.removeChild(entry.el); }, 500);
}
function syncDotsFor(layer, count, capVisual, arr){
  if(!layer) return;
  const target = Math.min(count, capVisual);
  while(arr.length < target) arr.push(createDot(layer));
  while(arr.length > target) removeDot(arr.pop());
  arr.forEach(entry => {
    if(Math.random() < 0.5){
      const pos = randDotPos();
      entry.el.style.left = pos.x + "%";
      entry.el.style.top = pos.y + "%";
    }
  });
  let badge = layer.querySelector(".overflow-badge");
  const overflow = count - capVisual;
  if(overflow > 0){
    if(!badge){ badge = document.createElement("div"); badge.className = "overflow-badge"; layer.appendChild(badge); }
    badge.textContent = "+" + overflow;
  } else if(badge){ badge.remove(); }
}
function syncDots(id){ syncDotsFor(document.getElementById(id + "-dots"), rooms[id].count, dotCap[id], dotsState[id]); }

/* ---------- occupancy logic ---------- */
function statusFor(count, cap){ const ratio = count / cap; if(ratio >= 0.9) return "bad"; if(ratio >= 0.65) return "warn"; return "good"; }
function statusLabel(s){ return s === "bad" ? "lotado" : s === "warn" ? "muita gente" : "normal"; }

function render(){
  let total = 0, alerts = 0;
  for(const id in rooms){
    const r = rooms[id];
    total += r.count;
    const status = statusFor(r.count, r.cap);
    if(status === "bad") alerts++;
    const el = document.getElementById(id);
    el.dataset.status = status;
    el.querySelector(".status-pill").textContent = statusLabel(status);
    document.getElementById(id+"-count").innerHTML = r.count + "<small>/"+r.cap+"</small>";
    document.getElementById(id+"-bar").style.width = Math.min(100, (r.count/r.cap*100)) + "%";
    syncDots(id);
  }
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statAlert").textContent = alerts;
  if(window.__selected) selectRoom(window.__selected);
}

function tick(){
  for(const id in rooms){
    const r = rooms[id];
    const delta = Math.floor(Math.random()*5) - 2;
    r.count = Math.max(0, Math.min(r.cap + 4, r.count + delta));
  }
  render();
  customRoomsTick();
}

function updateClock(){ document.getElementById("clock").textContent = new Date().toLocaleTimeString("pt-BR"); }

function insightFor(r, status){
  if(status === "bad") return "⚠️ <b>"+r.name+"</b> está com ocupação acima da capacidade recomendada. Pode ser interessante direcionar novas turmas para outro ambiente.";
  if(status === "warn") return "🟡 <b>"+r.name+"</b> está com ocupação elevada. Vale acompanhar nos próximos minutos.";
  return "🟢 <b>"+r.name+"</b> está com ocupação dentro do esperado para este horário.";
}

function selectRoom(id){
  window.__selected = id;
  document.querySelectorAll(".room").forEach(el => el.classList.remove("selected"));
  document.getElementById(id).classList.add("selected");
  const r = rooms[id];
  const status = statusFor(r.count, r.cap);
  document.getElementById("sideEmpty").style.display = "none";
  document.getElementById("sideContent").style.display = "block";
  document.getElementById("dName").textContent = r.name;
  document.getElementById("dSub").textContent = r.sub;
  document.getElementById("dCount").textContent = r.count + " dispositivos";
  document.getElementById("dCap").textContent = r.count + " de " + r.cap;
  document.getElementById("dAp").textContent = r.ap;
  document.getElementById("dTime").textContent = new Date().toLocaleTimeString("pt-BR");
  document.getElementById("dInsight").innerHTML = insightFor(r, status);
}

document.querySelectorAll(".room[id]").forEach(el => el.addEventListener("click", () => selectRoom(el.id)));

/* ================= MAP EDITOR ("Criar meu mapa") ================= */
const customRooms = [];
let customIdCounter = 0;
let pendingBox = null;
const editorCanvas = document.getElementById("editorCanvas");
const draftRect = document.getElementById("draftRect");
const emptyNote = document.getElementById("editorEmptyNote");

function pctFromEvent(clientX, clientY){
  const rect = editorCanvas.getBoundingClientRect();
  const x = Math.min(100, Math.max(0, (clientX - rect.left) / rect.width * 100));
  const y = Math.min(100, Math.max(0, (clientY - rect.top) / rect.height * 100));
  return { x, y };
}
function normBox(x1,y1,x2,y2){ return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) }; }
function paintDraft(box){
  draftRect.style.display = "block";
  draftRect.style.left = box.x + "%";
  draftRect.style.top = box.y + "%";
  draftRect.style.width = box.w + "%";
  draftRect.style.height = box.h + "%";
}

let drawing = false, startPt = null;
function startDraw(clientX, clientY){ startPt = pctFromEvent(clientX, clientY); drawing = true; paintDraft(normBox(startPt.x, startPt.y, startPt.x, startPt.y)); }
function moveDraw(clientX, clientY){ if(!drawing) return; const cur = pctFromEvent(clientX, clientY); paintDraft(normBox(startPt.x, startPt.y, cur.x, cur.y)); }
function endDraw(clientX, clientY){
  if(!drawing) return;
  drawing = false;
  const cur = pctFromEvent(clientX, clientY);
  const box = normBox(startPt.x, startPt.y, cur.x, cur.y);
  draftRect.style.display = "none";
  if(box.w < 4 || box.h < 4) return;
  pendingBox = box;
  openRoomForm();
}

editorCanvas.addEventListener("mousedown", e => startDraw(e.clientX, e.clientY));
window.addEventListener("mousemove", e => moveDraw(e.clientX, e.clientY));
window.addEventListener("mouseup", e => endDraw(e.clientX, e.clientY));
editorCanvas.addEventListener("touchstart", e => { const t=e.touches[0]; startDraw(t.clientX, t.clientY); e.preventDefault(); }, {passive:false});
editorCanvas.addEventListener("touchmove", e => { const t=e.touches[0]; moveDraw(t.clientX, t.clientY); e.preventDefault(); }, {passive:false});
editorCanvas.addEventListener("touchend", e => { const t=e.changedTouches[0]; endDraw(t.clientX, t.clientY); });

function openRoomForm(){
  document.getElementById("rfName").value = "";
  document.getElementById("rfCap").value = 30;
  document.getElementById("rfAp").value = "";
  document.getElementById("modalOverlay").style.display = "flex";
  setTimeout(() => document.getElementById("rfName").focus(), 50);
}
function cancelRoomForm(){ pendingBox = null; document.getElementById("modalOverlay").style.display = "none"; }
function confirmRoomForm(){
  const name = document.getElementById("rfName").value.trim() || ("Sala " + (customRooms.length + 1));
  const cap = Math.max(1, parseInt(document.getElementById("rfCap").value, 10) || 30);
  const ap = document.getElementById("rfAp").value.trim() || "—";
  if(pendingBox) addCustomRoom({ name, cap, ap, ...pendingBox });
  pendingBox = null;
  document.getElementById("modalOverlay").style.display = "none";
}

function capVisualFor(cap){ return Math.min(12, Math.max(4, Math.round(cap/3))); }

function addCustomRoom(data){
  const id = "custom" + (customIdCounter++);
  const root = document.createElement("div");
  root.className = "room";
  root.style.left = data.x + "%";
  root.style.top = data.y + "%";
  root.style.width = data.w + "%";
  root.style.height = data.h + "%";
  root.dataset.status = "good";
  root.innerHTML = `
    <button class="room-delete" title="Remover sala">×</button>
    <div class="room-top">
      <div><div class="room-name">${escapeHtml(data.name)}</div><div class="room-sub">Cap. ${data.cap} · ${escapeHtml(data.ap)}</div></div>
      <div class="status-pill">normal</div>
    </div>
    <div class="room-count">--<small>/${data.cap}</small></div>
    <div class="dot-layer"></div>
    <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
  `;
  editorCanvas.appendChild(root);

  const entry = {
    id, name: data.name, cap: data.cap, ap: data.ap,
    x: data.x, y: data.y, w: data.w, h: data.h,
    count: Math.floor(Math.random() * data.cap * 0.6),
    dotsArr: [],
    els: {
      root,
      pill: root.querySelector(".status-pill"),
      count: root.querySelector(".room-count"),
      bar: root.querySelector(".bar-fill"),
      layer: root.querySelector(".dot-layer"),
    }
  };
  root.querySelector(".room-delete").addEventListener("click", (ev) => { ev.stopPropagation(); removeCustomRoom(id); });
  customRooms.push(entry);
  renderRoomList();
  updateEmptyNote();
  customRoomTickOne(entry);
}

function removeCustomRoom(id){
  const idx = customRooms.findIndex(r => r.id === id);
  if(idx === -1) return;
  customRooms[idx].els.root.remove();
  customRooms.splice(idx, 1);
  renderRoomList();
  updateEmptyNote();
}

function clearCustomMap(){
  [...customRooms].forEach(r => removeCustomRoom(r.id));
  localStorage.removeItem("custom-map-rooms")
}

function renderRoomList(){
  const list = document.getElementById("editorRoomList");
  list.innerHTML = "";
  customRooms.forEach(r => {
    const chip = document.createElement("div");
    chip.className = "room-chip";
    chip.innerHTML = `<b>${escapeHtml(r.name)}</b> · cap. ${r.cap} <button class="chip-delete" title="Remover">×</button>`;
    chip.querySelector(".chip-delete").addEventListener("click", () => removeCustomRoom(r.id));
    list.appendChild(chip);
  });
}
function updateEmptyNote(){ emptyNote.style.display = customRooms.length ? "none" : "flex"; }
function escapeHtml(s){ const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function customRoomTickOne(r){
  const delta = Math.floor(Math.random()*5) - 2;
  r.count = Math.max(0, Math.min(r.cap + 2, r.count + delta));
  const status = statusFor(r.count, r.cap);
  r.els.root.dataset.status = status;
  r.els.pill.textContent = statusLabel(status);
  r.els.count.innerHTML = r.count + "<small>/"+r.cap+"</small>";
  r.els.bar.style.width = Math.min(100, (r.count/r.cap*100)) + "%";
  syncDotsFor(r.els.layer, r.count, capVisualFor(r.cap), r.dotsArr);
}
function customRoomsTick(){ customRooms.forEach(customRoomTickOne); }

/* ---------- persistence (per-user, private) ---------- */
function saveCustomMap(){
  const statusEl = document.getElementById("saveStatus");
  try{
    const payload = customRooms.map(r => ({ name:r.name, cap:r.cap, ap:r.ap, x:r.x, y:r.y, w:r.w, h:r.h }));
    localStorage.setItem("custom-map-rooms", JSON.stringify(payload));
    statusEl.textContent = "Salvo ✓ — vai continuar aqui da próxima vez";
  }catch(err){ statusEl.textContent = "Não consegui salvar agora"; }
}

function loadCustomMap(){
  try{
    const raw = localStorage.getItem("custom-map-rooms");
    if(raw){ JSON.parse(raw).forEach(data => addCustomRoom(data)); }
  }catch(err){ /* nada salvo ainda */ }
  updateEmptyNote();
}
loadCustomMap();

/* ================= BOOT ================= */
render();
updateClock();
setInterval(updateClock, 1000);
setInterval(tick, 3000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}