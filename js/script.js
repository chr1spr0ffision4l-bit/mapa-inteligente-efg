/* ================= LOGIN (por escola) ================= */
const ADMINS = [
  { user: "coord.sarahluisa", pass: "efg2026", schoolId: "efg-sarah-luisa", schoolName: "EFG Sarah Luisa Lemos Kunirtschek de Oliveira" },
];

let currentAdmin = null;

function tryLogin(){
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const found = ADMINS.find(a => a.user === user && a.pass === pass);
  const errorEl = document.getElementById("loginError");
  if(!found){ errorEl.style.display = "block"; return; }
  errorEl.style.display = "none";
  currentAdmin = found;
  localStorage.setItem("logged-in-user", found.user);
  enterApp();
}

function enterApp(){
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appRoot").style.display = "block";
  document.querySelector(".topbar-name small").textContent = currentAdmin.schoolName;
  loadCustomMap();
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
    if(found){ currentAdmin = found; enterApp(); }
  }
}

/* ================= SCREEN NAVIGATION ================= */
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.screen === name));
  window.scrollTo({top:0, behavior:"instant"});
}

/* ================= RADAR-STYLE DEVICE PINGS ================= */
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

/* ---------- occupancy helpers ---------- */
function statusFor(count, cap){ const ratio = count / cap; if(ratio >= 0.9) return "bad"; if(ratio >= 0.65) return "warn"; return "good"; }
function statusLabel(s){ return s === "bad" ? "lotado" : s === "warn" ? "muita gente" : "normal"; }
function capVisualFor(cap){ return Math.min(12, Math.max(4, Math.round(cap/3))); }
function escapeHtml(s){ const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function insightFor(r, status){
  if(status === "bad") return "⚠️ <b>"+r.name+"</b> está com ocupação acima da capacidade recomendada. Pode ser interessante direcionar novas turmas para outro ambiente.";
  if(status === "warn") return "🟡 <b>"+r.name+"</b> está com ocupação elevada. Vale acompanhar nos próximos minutos.";
  return "🟢 <b>"+r.name+"</b> está com ocupação dentro do esperado para este horário.";
}
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

/* ================= MOBÍLIA DAS SALAS ================= */
const FURNITURE_TYPES = [
  { type:"chair",    label:"Cadeira" },
  { type:"computer", label:"Computador" },
  { type:"shelf",    label:"Estante" },
  { type:"bench",    label:"Bancada" },
  { type:"plant",    label:"Planta" },
  { type:"board",    label:"Quadro" },
];

function furnitureSvg(type, size){
  const paths = {
    chair: '<rect x="6" y="8" width="12" height="10" rx="1"/><line x1="6" y1="8" x2="18" y2="8" stroke-width="3"/>',
    computer: '<rect x="3" y="13" width="18" height="6" rx="1"/><rect x="8" y="4" width="8" height="6" rx="1"/><line x1="12" y1="10" x2="12" y2="13"/>',
    shelf: '<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="14" x2="20" y2="14"/>',
    bench: '<rect x="2" y="9" width="20" height="7" rx="1"/><circle cx="7" cy="7" r="1.4"/><circle cx="12" cy="6.5" r="1.4"/><circle cx="17" cy="7" r="1.4"/>',
    plant: '<circle cx="12" cy="15" r="4"/><path d="M12 11 C 10 8, 8 8, 8 5"/><path d="M12 11 C 12 7, 12 7, 12 4"/><path d="M12 11 C 14 8, 16 8, 16 5"/>',
    board: '<rect x="3" y="5" width="18" height="11" rx="1"/><line x1="3" y1="16" x2="21" y2="16" stroke-width="2.4"/>',
  };
  const inner = paths[type] || '<rect x="6" y="6" width="12" height="12" rx="1"/>';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

let furnitureModalRoom = null;
let furnDrag = null;

function openFurnitureModal(entry){
  furnitureModalRoom = entry;
  if(!furnitureModalRoom.furniture) furnitureModalRoom.furniture = [];
  document.getElementById("furnModalTitle").textContent = "Mobiliar — " + entry.name;

  const palette = document.getElementById("furniturePalette");
  palette.innerHTML = "";
  FURNITURE_TYPES.forEach(f => {
    const btn = document.createElement("button");
    btn.innerHTML = furnitureSvg(f.type, 20) + `<span class="lbl">${f.label}</span>`;
    btn.onclick = () => addFurniture(f.type);
    palette.appendChild(btn);
  });

  renderFurnitureCanvas();
  document.getElementById("furnitureModalOverlay").style.display = "flex";
}
function closeFurnitureModal(){
  document.getElementById("furnitureModalOverlay").style.display = "none";
  furnitureModalRoom = null;
}

function addFurniture(type){
  furnitureModalRoom.furniture.push({ type, x: 40 + Math.random()*20, y: 40 + Math.random()*20 });
  renderFurnitureCanvas();
  renderRoomFurnitureMini(furnitureModalRoom);
}

function renderFurnitureCanvas(){
  const canvas = document.getElementById("furnitureCanvas");
  canvas.innerHTML = "";
  const list = furnitureModalRoom.furniture || [];
  list.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "furniture-item";
    el.style.left = item.x + "%";
    el.style.top = item.y + "%";
    el.innerHTML = furnitureSvg(item.type, 30);

    const del = document.createElement("div");
    del.className = "fi-del";
    del.textContent = "×";
    del.onclick = (ev) => {
      ev.stopPropagation();
      list.splice(idx, 1);
      renderFurnitureCanvas();
      renderRoomFurnitureMini(furnitureModalRoom);
    };
    el.appendChild(del);

    el.addEventListener("mousedown", ev => { ev.stopPropagation(); furnDrag = { item, canvas }; });
    el.addEventListener("touchstart", ev => { ev.stopPropagation(); furnDrag = { item, canvas }; }, {passive:true});
    canvas.appendChild(el);
  });
}

window.addEventListener("mousemove", e => {
  if(!furnDrag) return;
  const rect = furnDrag.canvas.getBoundingClientRect();
  furnDrag.item.x = Math.min(96, Math.max(4, (e.clientX - rect.left) / rect.width * 100));
  furnDrag.item.y = Math.min(96, Math.max(4, (e.clientY - rect.top) / rect.height * 100));
  renderFurnitureCanvas();
});
window.addEventListener("mouseup", () => {
  if(furnDrag){ renderRoomFurnitureMini(furnitureModalRoom); furnDrag = null; }
});
window.addEventListener("touchmove", e => {
  if(!furnDrag) return;
  const t = e.touches[0];
  const rect = furnDrag.canvas.getBoundingClientRect();
  furnDrag.item.x = Math.min(96, Math.max(4, (t.clientX - rect.left) / rect.width * 100));
  furnDrag.item.y = Math.min(96, Math.max(4, (t.clientY - rect.top) / rect.height * 100));
  renderFurnitureCanvas();
}, {passive:true});
window.addEventListener("touchend", () => {
  if(furnDrag){ renderRoomFurnitureMini(furnitureModalRoom); furnDrag = null; }
});

function renderRoomFurnitureMini(entry){
  const layer = entry.els.root.querySelector(".furniture-layer");
  if(!layer) return;
  layer.innerHTML = "";
  (entry.furniture || []).forEach(item => {
    const span = document.createElement("span");
    span.className = "furniture-icon-mini";
    span.style.left = item.x + "%";
    span.style.top = item.y + "%";
    span.innerHTML = furnitureSvg(item.type, 12);
    layer.appendChild(span);
  });
}

/* ================= MAP EDITOR ("Criar meu mapa") ================= */
const customRooms = [];
let customIdCounter = 0;
let pendingBox = null;
const editorCanvas = document.getElementById("editorCanvas");
const draftRect = document.getElementById("draftRect");
const emptyNote = document.getElementById("editorEmptyNote");

let activeOp = null;

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

function handlePointerMove(clientX, clientY){
  if(!activeOp) return;
  if(activeOp.type === "draw") stepDraw(clientX, clientY);
  else if(activeOp.type === "move") stepMove(clientX, clientY);
  else if(activeOp.type === "resize") stepResize(clientX, clientY);
}
function handlePointerUp(clientX, clientY){
  if(!activeOp) return;
  if(activeOp.type === "draw") finishDraw(clientX, clientY);
  activeOp = null;
}

editorCanvas.addEventListener("mousedown", e => { if(e.target === editorCanvas) startDraw(e.clientX, e.clientY); });
window.addEventListener("mousemove", e => handlePointerMove(e.clientX, e.clientY));
window.addEventListener("mouseup", e => handlePointerUp(e.clientX, e.clientY));
editorCanvas.addEventListener("touchstart", e => { if(e.target === editorCanvas){ const t=e.touches[0]; startDraw(t.clientX, t.clientY); e.preventDefault(); } }, {passive:false});
window.addEventListener("touchmove", e => { if(activeOp){ const t=e.touches[0]; handlePointerMove(t.clientX, t.clientY); } }, {passive:false});
window.addEventListener("touchend", e => { if(activeOp){ const t=e.changedTouches[0]; handlePointerUp(t.clientX, t.clientY); } });

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

function openRoomForm(){
  document.getElementById("rfName").value = "";
  document.getElementById("rfCap").value = 30;
  document.getElementById("rfAp").value = "";
  document.getElementById("rfShape").value = "rect";
  document.getElementById("rfCorner").value = "br";
  document.getElementById("rfNotch").value = 35;
  document.getElementById("rfRadius").value = 6;
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
  if(pendingBox) addCustomRoom({ name, cap, ap, shape, corner, notch, radius, furniture: [], ...pendingBox });
  pendingBox = null;
  document.getElementById("modalOverlay").style.display = "none";
}

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
    <div class="furniture-layer"></div>
    <button class="room-delete" title="Remover sala">×</button>
    <button class="room-furnish-btn" title="Mobiliar">🪑</button>
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
    x: data.x, y: data.y, w: data.w, h: data.h,
    shape: data.shape, corner: data.corner, notch: data.notch, radius: data.radius,
    furniture: data.furniture || [],
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
  root.querySelector(".room-delete").addEventListener("mousedown", ev => ev.stopPropagation());
  root.querySelector(".room-furnish-btn").addEventListener("click", ev => { ev.stopPropagation(); openFurnitureModal(entry); });
  root.querySelector(".room-furnish-btn").addEventListener("mousedown", ev => ev.stopPropagation());
  root.querySelector(".resize-handle").addEventListener("mousedown", ev => { ev.stopPropagation(); startResize(entry, ev.clientX, ev.clientY); });
  root.querySelector(".resize-handle").addEventListener("touchstart", ev => { ev.stopPropagation(); const t=ev.touches[0]; startResize(entry, t.clientX, t.clientY); ev.preventDefault(); }, {passive:false});
  root.addEventListener("mousedown", ev => { if(ev.target === root || ev.target.closest(".room-top") || ev.target.closest(".room-count")) startMove(entry, ev.clientX, ev.clientY); });

  customRooms.push(entry);
  renderRoomList();
  updateEmptyNote();
  customRoomTickOne(entry);
  renderRoomFurnitureMini(entry);
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

async function saveCustomMap(){
  const statusEl = document.getElementById("saveStatus");
  try{
    const payload = customRooms.map(r => ({ name:r.name, cap:r.cap, ap:r.ap, x:r.x, y:r.y, w:r.w, h:r.h, shape:r.shape, corner:r.corner, notch:r.notch, radius:r.radius, furniture:r.furniture || [] }));
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

/* ================= PUBLICAR MAPA ================= */
let liveRooms = [];

async function publishMap(){
  const statusEl = document.getElementById("publishStatus") || document.getElementById("saveStatus");
  try{
    const payload = customRooms.map(r => ({ name:r.name, cap:r.cap, ap:r.ap, x:r.x, y:r.y, w:r.w, h:r.h, shape:r.shape, corner:r.corner, notch:r.notch, radius:r.radius, furniture:r.furniture || [] }));
    localStorage.setItem("published-map:" + currentAdmin.schoolId, JSON.stringify(payload));
    statusEl.textContent = "Publicado ✓ — já está no Mapa ao vivo";
    renderLiveCustomMap();
  }catch(err){ statusEl.textContent = "Não consegui publicar agora"; }
}

function renderLiveCustomMap(){
  const raw = localStorage.getItem("published-map:" + currentAdmin.schoolId);
  const liveStage = document.getElementById("liveStage");
  const emptyNoteLive = document.getElementById("liveEmptyNote");
  let data = [];
  try{ data = raw ? JSON.parse(raw) : []; }catch(e){ data = []; }

  liveStage.querySelectorAll(".room").forEach(el => el.remove());
  liveRooms = [];

  if(!data.length){
    emptyNoteLive.style.display = "flex";
    renderHomeStats();
    return;
  }
  emptyNoteLive.style.display = "none";

  data.forEach((d, i) => {
    const root = document.createElement("div");
    root.className = "room";
    root.style.left = d.x + "%";
    root.style.top = d.y + "%";
    root.style.width = d.w + "%";
    root.style.height = d.h + "%";
    root.dataset.status = "good";
    root.innerHTML = `
      <div class="furniture-layer"></div>
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
      furniture: d.furniture || [],
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
      window.__selectedLive = entry;
      document.querySelectorAll("#liveStage .room").forEach(el => el.classList.remove("selected"));
      root.classList.add("selected");
      showLiveDetail(entry);
    });
    liveRooms.push(entry);
    customRoomTickOne(entry);
    renderRoomFurnitureMini(entry);
  });

  renderHomeStats();
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

function renderHomeStats(){
  let total = 0, alerts = 0;
  liveRooms.forEach(r => {
    total += r.count;
    if(statusFor(r.count, r.cap) === "bad") alerts++;
  });
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statAlert").textContent = alerts;
}

/* ================= CLOCK + LOOP ================= */
function updateClock(){ document.getElementById("clock").textContent = new Date().toLocaleTimeString("pt-BR"); }

function tick(){
  customRooms.forEach(customRoomTickOne);
  liveRooms.forEach(customRoomTickOne);
  if(window.__selectedLive) showLiveDetail(window.__selectedLive);
  renderHomeStats();
}

/* ================= BOOT ================= */
checkSession();
updateClock();
setInterval(updateClock, 1000);
setInterval(tick, 3000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}