/* ================= LOGIN (por escola) ================= */
// Cada linha = uma coordenação/escola diferente com login próprio.
// Pra cadastrar outra EFG, só copia uma linha e muda os valores.
const ADMINS = [
  { user: "coord.sarahluisa", pass: "efg2026", schoolId: "efg-sarah-luisa", schoolName: "EFG Sarah Luisa Lemos Kunirtschek de Oliveira" },
];

let currentAdmin = null;

function tryLogin(){
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const found = ADMINS.find(a => a.user === user && a.pass === pass);
  const errorEl = document.getElementById("loginError");
  if(!found){
    errorEl.style.display = "block";
    return;
  }
  errorEl.style.display = "none";
  currentAdmin = found;
  localStorage.setItem("logged-in-user", found.user);
  enterApp();
}

function enterApp(){
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appRoot").style.display = "block";
  document.querySelector(".topbar-name small").textContent = currentAdmin.schoolName;
  loadCustomMap(); // agora que sabemos quem logou, carrega o mapa certo
  renderLiveCustomMap();
}

function logout(){
  localStorage.removeItem("logged-in-user");
  currentAdmin = null;
  document.getElementById("appRoot").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
}

function checkSession(){
  const savedUser = localStorage.getItem("logged-in-user");
  if(savedUser){
    const found = ADMINS.find(a => a.user === savedUser);
    if(found){ currentAdmin = found; enterApp(); return; }
  }
}

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
  liveRooms.forEach(customRoomTickOne);
  if(window.__selectedLive) showLiveDetail(window.__selectedLive);
}

function updateClock(){ document.getElementById("clock").textContent = new Date().toLocaleTimeString("pt-BR"); }

function insightFor(r, status){
  if(status === "bad") return "⚠️ <b>"+r.name+"</b> está com ocupação acima da capacidade recomendada. Pode ser interessante direcionar novas turmas para outro ambiente.";
  if(status === "warn") return "🟡 <b>"+r.name+"</b> está com ocupação elevada. Vale acompanhar nos próximos minutos.";
  return "🟢 <b>"+r.name+"</b> está com ocupação dentro do esperado para este horário.";
}

function selectRoom(id){
  window.__selectedLive = null;
  window.__selected = id;
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

let activeOp = null; // { type: "draw"|"move"|"resize", ...dados da operação }

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

/* ---- desenhar sala nova (arrastar no fundo vazio) ---- */
function startDraw(clientX, clientY){
  const p = pctFromEvent(clientX, clientY);
  activeOp = { type: "draw", startX: p.x, startY: p.y };
  paintDraft(normBox(p.x, p.y, p.x, p.y));
}
function stepDraw(clientX, clientY){
  const cur = pctFromEvent(clientX, clientY);
  paintDraft(normBox(activeOp.startX, activeOp.startY, cur.x, cur.y));
}
function finishDraw(clientX, clientY){
  const cur = pctFromEvent(clientX, clientY);
  const box = normBox(activeOp.startX, activeOp.startY, cur.x, cur.y);
  draftRect.style.display = "none";
  if(box.w >= 4 && box.h >= 4){ pendingBox = box; openRoomForm(); }
}

/* ---- mover sala existente (arrastar em cima dela) ---- */
function startMove(entry, clientX, clientY){
  activeOp = { type: "move", entry, startX: clientX, startY: clientY, origX: entry.x, origY: entry.y };
}
function stepMove(clientX, clientY){
  const rect = editorCanvas.getBoundingClientRect();
  const dx = (clientX - activeOp.startX) / rect.width * 100;
  const dy = (clientY - activeOp.startY) / rect.height * 100;
  const entry = activeOp.entry;
  entry.x = Math.min(100 - entry.w, Math.max(0, activeOp.origX + dx));
  entry.y = Math.min(100 - entry.h, Math.max(0, activeOp.origY + dy));
  entry.els.root.style.left = entry.x + "%";
  entry.els.root.style.top = entry.y + "%";
}
function finishMove(){ /* nada extra a fazer, o objeto já tá com x/y atualizado */ }

/* ---- redimensionar sala existente (arrastar a alcinha do canto) ---- */
function startResize(entry, clientX, clientY){
  activeOp = { type: "resize", entry, startX: clientX, startY: clientY, origW: entry.w, origH: entry.h };
}
function stepResize(clientX, clientY){
  const rect = editorCanvas.getBoundingClientRect();
  const dx = (clientX - activeOp.startX) / rect.width * 100;
  const dy = (clientY - activeOp.startY) / rect.height * 100;
  const entry = activeOp.entry;
  entry.w = Math.max(6, Math.min(100 - entry.x, activeOp.origW + dx));
  entry.h = Math.max(6, Math.min(100 - entry.y, activeOp.origH + dy));
  entry.els.root.style.width = entry.w + "%";
  entry.els.root.style.height = entry.h + "%";
}
function finishResize(){ /* idem */ }

/* ---- despachante único: decide o que fazer conforme activeOp.type ---- */
function handlePointerMove(clientX, clientY){
  if(!activeOp) return;
  if(activeOp.type === "draw") stepDraw(clientX, clientY);
  else if(activeOp.type === "move") stepMove(clientX, clientY);
  else if(activeOp.type === "resize") stepResize(clientX, clientY);
}
function handlePointerUp(clientX, clientY){
  if(!activeOp) return;
  if(activeOp.type === "draw") finishDraw(clientX, clientY);
  else if(activeOp.type === "move") finishMove();
  else if(activeOp.type === "resize") finishResize();
  activeOp = null;
}

editorCanvas.addEventListener("mousedown", e => { if(e.target === editorCanvas) startDraw(e.clientX, e.clientY); });
window.addEventListener("mousemove", e => handlePointerMove(e.clientX, e.clientY));
window.addEventListener("mouseup", e => handlePointerUp(e.clientX, e.clientY));
editorCanvas.addEventListener("touchstart", e => { if(e.target === editorCanvas){ const t=e.touches[0]; startDraw(t.clientX, t.clientY); e.preventDefault(); } }, {passive:false});
window.addEventListener("touchmove", e => { if(activeOp){ const t=e.touches[0]; handlePointerMove(t.clientX, t.clientY); } }, {passive:false});
window.addEventListener("touchend", e => { if(activeOp){ const t=e.changedTouches[0]; handlePointerUp(t.clientX, t.clientY); } });

function openRoomForm(){
  document.getElementById("rfName").value = "";
  document.getElementById("rfCap").value = 30;
  document.getElementById("rfAp").value = "";
  document.getElementById("rfShape").value = "rect";
  document.getElementById("rfCorner").value = "br";
  document.getElementById("rfNotch").value = 35;
  document.getElementById("rfNotchVal").textContent = "35%";
  document.getElementById("rfRadius").value = 6;
  document.getElementById("rfRadiusVal").textContent = "6px";
  toggleShapeFields();
  document.getElementById("modalOverlay").style.display = "flex";
  setTimeout(() => document.getElementById("rfName").focus(), 50);
}

function cancelRoomForm(){ pendingBox = null; document.getElementById("modalOverlay").style.display = "none"; }
function confirmRoomForm(){
  const name = document.getElementById("rfName").value.trim() || ("Sala " + (customRooms.length + 1));
  const cap = Math.max(1, parseInt(document.getElementById("rfCap").value, 10) || 30);
  const ap = document.getElementById("rfAp").value.trim() || "—";
  const shape = document.getElementById("rfShape").value;
  const corner = document.getElementById("rfCorner").value;
  const notch = parseInt(document.getElementById("rfNotch").value, 10);
  const radius = parseInt(document.getElementById("rfRadius").value, 10);
  if(pendingBox) addCustomRoom({ name, cap, ap, shape, corner, notch, radius, ...pendingBox });
  pendingBox = null;
  document.getElementById("modalOverlay").style.display = "none";
}

function capVisualFor(cap){ return Math.min(12, Math.max(4, Math.round(cap/3))); }

function addCustomRoom(data){
  const id = "custom" + (customIdCounter++);
  const root = document.createElement("div");
    root.className = "room room-move-handle";
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
      <div class="resize-handle" title="Redimensionar"></div>
    `;
  editorCanvas.appendChild(root);

  applyShapeStyle(root, data);

  const entry = {
    id, name: data.name, cap: data.cap, ap: data.ap,
    x: data.x, y: data.y, w: data.w, h: data.h,     shape: data.shape, corner: data.corner, notch: data.notch, radius: data.radius,
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
    root.querySelector(".room-delete").addEventListener("mousedown", ev => ev.stopPropagation());
  root.querySelector(".resize-handle").addEventListener("mousedown", ev => { ev.stopPropagation(); startResize(entry, ev.clientX, ev.clientY); });
  root.querySelector(".resize-handle").addEventListener("touchstart", ev => { ev.stopPropagation(); const t=ev.touches[0]; startResize(entry, t.clientX, t.clientY); e.preventDefault(); }, {passive:false});
  root.addEventListener("mousedown", ev => { if(ev.target === root || ev.target.closest(".room-top") || ev.target.closest(".room-count")) startMove(entry, ev.clientX, ev.clientY); });
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
  localStorage.removeItem("custom-map-rooms:" + currentAdmin.schoolId);
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
async function saveCustomMap(){
  const statusEl = document.getElementById("saveStatus");
  try{
    const payload = customRooms.map(r => ({ name:r.name, cap:r.cap, ap:r.ap, x:r.x, y:r.y, w:r.w, h:r.h, shape:r.shape, corner:r.corner, notch:r.notch, radius:r.radius }));
    localStorage.setItem("custom-map-rooms:" + currentAdmin.schoolId, JSON.stringify(payload));
    statusEl.textContent = "Salvo ✓ — vai continuar aqui da próxima vez";
  }catch(err){ statusEl.textContent = "Não consegui salvar agora"; }
}

async function loadCustomMap(){
  try{
    const raw = localStorage.getItem("custom-map-rooms:" + currentAdmin.schoolId);
    if(raw){ JSON.parse(raw).forEach(data => addCustomRoom(data)); }
  }catch(err){ /* nada salvo ainda pra essa escola */ }
  updateEmptyNote();
}

function toggleShapeFields(){
  const isL = document.getElementById("rfShape").value === "l";
  document.getElementById("rfLFields").style.display = isL ? "block" : "none";
}

function applyShapeStyle(root, data){
  if(data.shape === "l"){
    const n = data.notch || 35;
    const c = data.corner || "br";
    let poly;
    if(c === "br") poly = `polygon(0% 0%, 100% 0%, 100% ${100-n}%, ${100-n}% ${100-n}%, ${100-n}% 100%, 0% 100%)`;
    else if(c === "bl") poly = `polygon(0% 0%, 100% 0%, 100% 100%, ${n}% 100%, ${n}% ${100-n}%, 0% ${100-n}%)`;
    else if(c === "tr") poly = `polygon(0% 0%, ${100-n}% 0%, ${100-n}% ${n}%, 100% ${n}%, 100% 100%, 0% 100%)`;
    else poly = `polygon(${n}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${n}%, ${n}% ${n}%)`;
    root.style.clipPath = poly;
    root.style.borderRadius = "0px";
  } else {
    root.style.clipPath = "none";
    root.style.borderRadius = (data.radius != null ? data.radius : 6) + "px";
  }
}

/* ================= PUBLICAR MAPA ================= */
let liveRooms = [];

async function publishMap(){
  const statusEl = document.getElementById("publishStatus");
  try{
    const payload = customRooms.map(r => ({ name:r.name, cap:r.cap, ap:r.ap, x:r.x, y:r.y, w:r.w, h:r.h, shape:r.shape, corner:r.corner, notch:r.notch, radius:r.radius }));
    localStorage.setItem("published-map:" + currentAdmin.schoolId, JSON.stringify(payload));
    statusEl.textContent = "Publicado ✓ — já está no Mapa ao vivo";
    renderLiveCustomMap();
  }catch(err){ statusEl.textContent = "Não consegui publicar agora"; }
}

function renderLiveCustomMap(){
  const raw = localStorage.getItem("published-map:" + currentAdmin.schoolId);
  const demoWrap = document.getElementById("demoStageWrap");
  const liveWrap = document.getElementById("liveStageWrap");
  const liveStage = document.getElementById("liveStage");
  let data = [];
  try{ data = raw ? JSON.parse(raw) : []; }catch(e){ data = []; }

  if(!data.length){
    demoWrap.style.display = "";
    liveWrap.style.display = "none";
    return;
  }

  demoWrap.style.display = "none";
  liveWrap.style.display = "";
  liveStage.innerHTML = "";
  liveRooms = [];

  data.forEach((d, i) => {
    const root = document.createElement("div");
    root.className = "room";
    root.style.left = d.x + "%";
    root.style.top = d.y + "%";
    root.style.width = d.w + "%";
    root.style.height = d.h + "%";
    root.dataset.status = "good";
    root.innerHTML = `
      <div class="room-top">
        <div><div class="room-name">${escapeHtml(d.name)}</div><div class="room-sub">${escapeHtml(d.ap)}</div></div>
        <div class="status-pill">normal</div>
      </div>
      <div class="room-count">--<small>/${d.cap}</small></div>
      <div class="dot-layer"></div>
      <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
    `;
    applyShapeStyle(root, d);
    liveStage.appendChild(root);

    const entry = {
      id: "live" + i, name: d.name, cap: d.cap, ap: d.ap,
      count: Math.floor(Math.random() * d.cap * 0.6),
      dotsArr: [],
      els: {
        root,
        pill: root.querySelector(".status-pill"),
        count: root.querySelector(".room-count"),
        bar: root.querySelector(".bar-fill"),
        layer: root.querySelector(".dot-layer"),
      }
    };
    root.addEventListener("click", () => {
      window.__selected = null;
      window.__selectedLive = entry;
      document.querySelectorAll("#liveStage .room").forEach(el => el.classList.remove("selected"));
      root.classList.add("selected");
      showLiveDetail(entry);
    });
    liveRooms.push(entry);
    customRoomTickOne(entry);
  });
}

function showLiveDetail(entry){
  const status = statusFor(entry.count, entry.cap);
  document.getElementById("sideEmpty").style.display = "none";
  document.getElementById("sideContent").style.display = "block";
  document.getElementById("dName").textContent = entry.name;
  document.getElementById("dSub").textContent = entry.ap;
  document.getElementById("dCount").textContent = entry.count + " dispositivos";
  document.getElementById("dCap").textContent = entry.count + " de " + entry.cap;
  document.getElementById("dAp").textContent = entry.ap;
  document.getElementById("dTime").textContent = new Date().toLocaleTimeString("pt-BR");
  document.getElementById("dInsight").innerHTML = insightFor(entry, status);
}

/* ================= BOOT ================= */
render();
updateClock();
setInterval(updateClock, 1000);
setInterval(tick, 3000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}