/* ═══════════ OFICINA VIRTUAL ═══════════
   Cada pilar de servicios es una sala; cada servicio es una persona en su escritorio.
   Los datos del servicio vienen de Supabase (getServicios / getGruposServicios);
   quién lo ejecuta, cómo lo hace y su nivel de automatización se guardan por ahora
   en el navegador (localStorage), hasta que se decida una tabla propia. */

const OF_KEY = 'meev_oficina_v1';
const OF_NIVELES = [
  {n:0, icon:'👤', label:'Manual',         desc:'Una persona lo hace todo a mano.'},
  {n:1, icon:'✨', label:'Asistido con IA', desc:'La persona lo hace, apoyada con IA / plantillas.'},
  {n:2, icon:'⚙️', label:'Semi-automático', desc:'Partes del proceso corren solas; la persona revisa.'},
  {n:3, icon:'🤖', label:'Automatizado',   desc:'Corre solo; la persona solo supervisa.'}
];
const OF_NOMBRES = ['Sofi','Mateo','Luna','Dani','Vale','Nico','Cami','Andrés','Maya','Leo','Isa','Tomás','Juli','Santi','Emma','Pablo','Lola','Hugo','Zoe','Bruno'];
const OF_PISOS = ['#dfe8d0','#d9e4ee','#eadfd2','#e6d9ea','#d9ebe6','#efe6c9'];
const OF_PIEL = ['#f5d0b0','#e8b48a','#c68e63','#8d5a3b','#f0c2a0'];
const OF_PELO = ['#2b1d14','#5a3825','#b5651d','#161414','#d9a441','#7a3b8c','#3b6ea8'];
const OF_CAMISA = ['#ccfb55','#ff6b6b','#4dabf7','#ffd43b','#b197fc','#63e6be','#ff922b','#f783ac'];
const OF_TEMAS = [
  [/video|reel|edici/i,'🎬'], [/dise|logo|marca|brand|branding/i,'🎨'], [/web|p[aá]gina|landing|sitio/i,'💻'],
  [/red|social|community|instagram|tiktok/i,'📱'], [/foto/i,'📸'], [/seo|buscador/i,'🔎'],
  [/ads|pauta|campa|publicidad/i,'📣'], [/copy|contenido|blog|texto|gui[oó]n/i,'✍️'],
  [/mail|correo|newsletter/i,'✉️'], [/estrateg|consult|plan/i,'🧠'], [/report|anal[ií]tica|m[eé]trica/i,'📊']
];

let _ofTimer = null;
let _ofSel = null;
let _ofDatos = null;   // {servicios, grupos}

function _ofEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function _ofLoad() { try { return JSON.parse(localStorage.getItem(OF_KEY) || '{}'); } catch(e) { return {}; } }
function _ofSave(d) { try { localStorage.setItem(OF_KEY, JSON.stringify(d)); } catch(e) {} }
function _ofCfg(id) { return _ofLoad()[id] || {}; }
function _ofEmoji(nombre) { const t = OF_TEMAS.find(([re]) => re.test(nombre || '')); return t ? t[1] : '💼'; }
function _ofPick(arr, id, salt) { return arr[Math.abs((Number(id) || 0) * 7 + salt * 13) % arr.length]; }

function _ofSprite(s, nivel) {
  const id = s.id;
  const piel = _ofPick(OF_PIEL, id, 1), pelo = _ofPick(OF_PELO, id, 2), camisa = _ofPick(OF_CAMISA, id, 3);
  const robot = nivel >= 3;
  const ojos = robot ? '#19d3ff' : '#161414';
  return `<svg class="of-svg" viewBox="0 0 16 20" shape-rendering="crispEdges" aria-hidden="true">
    ${robot ? '<rect x="7" y="-1" width="2" height="2" fill="#ccfb55"/><rect x="7.5" y="1" width="1" height="1" fill="#888"/>' : ''}
    <rect x="4" y="1" width="8" height="3" fill="${pelo}"/><rect x="3" y="2" width="1" height="5" fill="${pelo}"/><rect x="12" y="2" width="1" height="5" fill="${pelo}"/>
    <rect x="4" y="3" width="8" height="6" fill="${robot ? '#cfd8dc' : piel}"/>
    <rect x="6" y="5" width="1" height="2" fill="${ojos}"/><rect x="9" y="5" width="1" height="2" fill="${ojos}"/>
    <rect x="7" y="8" width="2" height="1" fill="${robot ? '#888' : '#b5654a'}"/>
    ${nivel === 2 ? '<rect x="2" y="4" width="2" height="3" fill="#161414"/><rect x="12" y="4" width="2" height="3" fill="#161414"/><rect x="4" y="3" width="8" height="1" fill="#161414"/>' : ''}
    <rect x="3" y="9" width="10" height="6" fill="${camisa}"/>
    <rect class="of-arm of-arm-l" x="1" y="10" width="2" height="5" fill="${robot ? '#cfd8dc' : piel}"/>
    <rect class="of-arm of-arm-r" x="13" y="10" width="2" height="5" fill="${robot ? '#cfd8dc' : piel}"/>
    <rect class="of-leg of-leg-l" x="4" y="15" width="3" height="5" fill="#2f3b52"/>
    <rect class="of-leg of-leg-r" x="9" y="15" width="3" height="5" fill="#2f3b52"/>
  </svg>`;
}

function _ofEscritorio(s, idx) {
  const cfg = _ofCfg(s.id);
  const nivel = cfg.nivel || 0;
  const persona = cfg.persona || OF_NOMBRES[(Number(s.id) + idx) % OF_NOMBRES.length];
  const sel = String(_ofSel) === String(s.id) ? ' sel' : '';
  if(!s.activo) {
    return `<div class="of-desk vacant${sel}" onclick="ofAbrir(${s.id})" title="Servicio inactivo">
      <div class="of-person"><div class="of-zzz">z z z</div></div>
      <div class="of-table"><div class="of-pc off"></div></div>
      <div class="of-name"><b>Vacante</b><small>${_ofEsc(s.nombre)}</small></div></div>`;
  }
  return `<div class="of-desk${sel}" data-id="${s.id}" onclick="ofAbrir(${s.id})">
    <div class="of-person" id="ofp-${s.id}">
      <div class="of-bubble" id="ofb-${s.id}">${_ofEmoji(s.nombre)}</div>
      <div class="of-chip n${nivel}" title="${OF_NIVELES[nivel].label}">${OF_NIVELES[nivel].icon}</div>
      ${_ofSprite(s, nivel)}
    </div>
    <div class="of-table"><div class="of-pc"><i></i></div></div>
    <div class="of-name"><b>${_ofEsc(persona)}</b><small>${_ofEsc(s.nombre)}</small></div>
  </div>`;
}

function _ofInyectarCSS() {
  if(document.getElementById('ofStyles')) return;
  const st = document.createElement('style');
  st.id = 'ofStyles';
  st.textContent = `
  .of-wrap{display:flex;gap:18px;align-items:flex-start}
  .of-main{flex:1;min-width:0}
  .of-hud{display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:var(--negro);color:var(--blanco);border-radius:14px;padding:12px 18px;margin-bottom:14px;font-family:'Press Start 2P',monospace;font-size:.6rem}
  .of-hud .t{color:var(--verde)}
  .of-bar{flex:1;min-width:140px;height:12px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden;border:2px solid rgba(255,255,255,.25)}
  .of-bar>div{height:100%;background:repeating-linear-gradient(90deg,var(--verde) 0 8px,#a8d93f 8px 10px);transition:width .6s}
  .of-hint{font-family:'Poppins',sans-serif;font-size:.7rem;color:var(--gris-t);margin:0 0 12px}
  .of-floor{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:18px}
  .of-room{background:var(--piso);border:4px solid var(--negro);border-radius:6px;padding:0 12px 14px;position:relative;
    background-image:linear-gradient(45deg,rgba(0,0,0,.035) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.035) 75%),linear-gradient(45deg,rgba(0,0,0,.035) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.035) 75%);
    background-size:40px 40px;background-position:0 0,20px 20px;box-shadow:0 4px 0 rgba(22,20,20,.25)}
  .of-sign{margin:0 -12px 10px;background:var(--negro);color:var(--verde);padding:8px 12px;font-family:'Press Start 2P',monospace;font-size:.58rem;line-height:1.5;display:flex;justify-content:space-between;gap:8px}
  .of-sign span{color:rgba(255,255,255,.5)}
  .of-desks{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:14px 8px}
  .of-desk{display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative;padding:4px 2px 6px;border-radius:8px;transition:background .15s}
  .of-desk:hover{background:rgba(255,255,255,.55)}
  .of-desk.sel{background:rgba(204,251,85,.55);outline:3px solid var(--negro)}
  .of-person{position:relative;width:64px;height:80px;z-index:1;transition:transform 2.4s linear}
  .of-person.walk{z-index:30}
  .of-svg{width:64px;height:80px;display:block;image-rendering:pixelated}
  .of-person.walk .of-svg{animation:ofBob .35s steps(2) infinite}
  .of-person.walk.izq .of-svg{transform:scaleX(-1)}
  .of-arm-l{animation:ofType .5s steps(2) infinite}
  .of-arm-r{animation:ofType .5s steps(2) infinite .25s}
  .of-person.walk .of-arm{animation:none}
  .of-person.walk .of-leg-l{animation:ofLeg .35s steps(2) infinite}
  .of-person.walk .of-leg-r{animation:ofLeg .35s steps(2) infinite reverse}
  @keyframes ofType{0%{transform:translateY(0)}100%{transform:translateY(-1px)}}
  @keyframes ofBob{0%{transform:translateY(0)}100%{transform:translateY(-3px)}}
  @keyframes ofLeg{0%{transform:translateY(0)}100%{transform:translateY(-1px)}}
  .of-person.walk.izq .of-svg{animation-name:ofBob}
  .of-bubble{position:absolute;top:-18px;left:50%;transform:translateX(-50%) scale(0);background:var(--blanco);border:2px solid var(--negro);border-radius:8px;padding:1px 6px;font-size:.85rem;white-space:nowrap;z-index:5;transition:transform .2s;pointer-events:none}
  .of-bubble.on{transform:translateX(-50%) scale(1)}
  .of-chip{position:absolute;top:2px;right:-6px;font-size:.7rem;background:var(--blanco);border:2px solid var(--negro);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;z-index:4}
  .of-chip.n3{background:var(--verde)}
  .of-table{position:relative;z-index:2;margin-top:-30px;width:100px;height:34px;background:#b98b5e;border:3px solid #6b4a2b;border-radius:4px 4px 2px 2px;box-shadow:0 3px 0 #6b4a2b;display:flex;justify-content:center}
  .of-pc{position:relative;top:-14px;width:30px;height:20px;background:#2d3340;border:3px solid #161414;border-radius:2px}
  .of-pc i{position:absolute;inset:2px;background:#19d3ff;animation:ofScreen 1.6s steps(3) infinite}
  .of-pc.off i,.of-pc.off{background:#555}
  @keyframes ofScreen{0%{background:#19d3ff}50%{background:#7be8ff}100%{background:#19d3ff}}
  .of-name{margin-top:6px;text-align:center;font-family:'Poppins',sans-serif;line-height:1.2;max-width:108px}
  .of-name b{display:block;font-size:.72rem;color:var(--negro)}
  .of-name small{display:block;font-size:.6rem;color:#555;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .of-desk.vacant{opacity:.65}
  .of-zzz{position:absolute;top:30px;left:0;right:0;text-align:center;font-family:'Press Start 2P',monospace;font-size:.5rem;color:#777;animation:ofZ 2s ease-in-out infinite}
  @keyframes ofZ{0%,100%{opacity:.3}50%{opacity:1}}
  .of-lobby{grid-column:1/-1;display:flex;gap:26px;align-items:flex-end;justify-content:center;padding:10px;background:#c9ccc4;border:4px solid var(--negro);border-radius:6px;font-size:2.2rem;flex-wrap:wrap}
  .of-lobby>div{text-align:center}
  .of-lobby small{display:block;font-family:'Press Start 2P',monospace;font-size:.45rem;margin-top:4px;color:#333}
  .of-panel{width:300px;flex-shrink:0;position:sticky;top:16px;background:var(--blanco);border:4px solid var(--negro);border-radius:10px;padding:16px;font-family:'Poppins',sans-serif;box-shadow:0 4px 0 rgba(22,20,20,.25)}
  .of-panel h3{margin:0 0 2px;font-size:.95rem}
  .of-panel .sub{font-size:.68rem;color:var(--gris-t);margin-bottom:12px}
  .of-panel label{display:block;font-size:.62rem;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--gris-t);margin:12px 0 4px}
  .of-panel input[type=text],.of-panel textarea{width:100%;box-sizing:border-box;border:2px solid var(--gris-m);border-radius:8px;padding:8px 10px;font:inherit;font-size:.78rem;resize:vertical}
  .of-panel input:focus,.of-panel textarea:focus{outline:none;border-color:var(--negro)}
  .of-niv{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .of-niv button{border:2px solid var(--gris-m);background:var(--blanco);border-radius:8px;padding:7px 4px;font:inherit;font-size:.68rem;cursor:pointer;line-height:1.3}
  .of-niv button.on{border-color:var(--negro);background:var(--verde);font-weight:700}
  .of-niv-desc{font-size:.66rem;color:#555;margin-top:6px;min-height:2.4em}
  .of-empty{text-align:center;color:var(--gris-t);font-size:.8rem;padding:10px 4px}
  .of-empty .big{font-size:2.2rem}
  @media(max-width:900px){.of-wrap{flex-direction:column}.of-panel{width:100%;position:static;box-sizing:border-box}}
  @media(prefers-reduced-motion:reduce){.of-person,.of-svg,.of-arm,.of-leg,.of-pc i{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(st);
  if(!document.getElementById('ofFont')) {
    const l = document.createElement('link');
    l.id = 'ofFont'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(l);
  }
}

async function renderOficina() {
  _ofInyectarCSS();
  clearInterval(_ofTimer);
  const content = document.getElementById('mainContent');
  content.innerHTML = '<div class="of-empty"><div class="big">🏢</div>Abriendo la oficina…</div>';
  const [servicios, grupos] = await Promise.all([getServicios(), getGruposServicios()]);
  _ofDatos = {servicios, grupos};
  if(document.getElementById('mainContent') !== content || currentModule !== 'oficina') return;

  const salas = grupos.map(g => ({g, items: servicios.filter(s => s.grupo_id === g.id)}));
  const huerfanos = servicios.filter(s => !s.grupo_id);
  if(huerfanos.length) salas.push({g:{id:'sg', nombre:'Sin categoría'}, items: huerfanos});

  const salasHTML = salas.map(({g, items}, i) => {
    const activos = items.filter(s => s.activo).length;
    return `<div class="of-room" style="--piso:${OF_PISOS[i % OF_PISOS.length]}">
      <div class="of-sign">${_ofEsc(g.nombre)}<span>${activos} 👤</span></div>
      <div class="of-desks">${items.length ? items.map(s => _ofEscritorio(s, servicios.indexOf(s))).join('') : '<div class="of-empty" style="grid-column:1/-1">Sala vacía</div>'}</div>
    </div>`;
  }).join('');

  content.innerHTML = `
    <div class="of-main-wrap">
      <div class="of-hud" id="ofHud"></div>
      <p class="of-hint">Haz clic en una persona para definir <b>quién ejecuta el servicio</b>, <b>cómo lo hace</b> y qué tan automatizado está.</p>
      <div class="of-wrap">
        <div class="of-main"><div class="of-floor" id="ofFloor">
          ${salasHTML || '<div class="of-empty" style="grid-column:1/-1">Aún no hay servicios. Agrégalos en el módulo Servicios.</div>'}
          <div class="of-lobby"><div>🪴<small>PLANTA</small></div><div id="ofCafe">☕<small>CAFETERA</small></div><div>🖨️<small>IMPRESORA</small></div><div>🛋️<small>DESCANSO</small></div></div>
        </div></div>
        <aside class="of-panel" id="ofPanel"></aside>
      </div>
    </div>`;
  ofActualizarHud();
  ofPintarPanel();
  _ofTimer = setInterval(_ofTick, 3500);
}

function ofActualizarHud() {
  const hud = document.getElementById('ofHud');
  if(!hud || !_ofDatos) return;
  const activos = _ofDatos.servicios.filter(s => s.activo);
  const cfgs = _ofLoad();
  const suma = activos.reduce((a, s) => a + ((cfgs[s.id]?.nivel) || 0), 0);
  const pct = activos.length ? Math.round(suma / (activos.length * 3) * 100) : 0;
  const robots = activos.filter(s => (cfgs[s.id]?.nivel || 0) >= 3).length;
  hud.innerHTML = `<span class="t">MEEV HQ</span><span>👥 ${activos.length}</span><span>🤖 ${robots}</span>
    <span>AUTOMATIZACIÓN ${pct}%</span><div class="of-bar"><div style="width:${pct}%"></div></div>`;
}

// Cada pocos segundos: alguien piensa algo; de vez en cuando alguien va por café
function _ofTick() {
  const floor = document.getElementById('ofFloor');
  if(!floor || currentModule !== 'oficina') { clearInterval(_ofTimer); return; }
  const personas = [...floor.querySelectorAll('.of-person[id^="ofp-"]')];
  if(!personas.length) return;
  const p = personas[Math.floor(Math.random() * personas.length)];
  const id = p.id.slice(4);
  const b = document.getElementById('ofb-' + id);
  const s = _ofDatos.servicios.find(x => String(x.id) === id);
  if(b && s) {
    const nivel = _ofCfg(id).nivel || 0;
    const opts = [_ofEmoji(s.nombre), '💡', nivel >= 2 ? '⚙️' : '💭', nivel >= 3 ? '🤖' : '✅', '⌨️'];
    b.textContent = opts[Math.floor(Math.random() * opts.length)];
    b.classList.add('on');
    setTimeout(() => b.classList.remove('on'), 2200);
  }
  if(Math.random() < 0.35 && !floor.querySelector('.of-person.walk')) _ofCafe(p);
}

function _ofCafe(p) {
  const cafe = document.getElementById('ofCafe');
  if(!cafe) return;
  const a = p.getBoundingClientRect(), c = cafe.getBoundingClientRect();
  const dx = c.left + c.width / 2 - (a.left + a.width / 2);
  const dy = c.top - a.bottom + 50;
  const b = p.querySelector('.of-bubble');
  p.classList.add('walk');
  p.classList.toggle('izq', dx < 0);
  p.style.transform = `translate(${dx}px,${dy}px)`;
  setTimeout(() => { if(b) { b.textContent = '☕'; b.classList.add('on'); } }, 2500);
  setTimeout(() => {
    if(b) b.classList.remove('on');
    p.classList.toggle('izq', dx > 0);
    p.style.transform = '';
  }, 5200);
  setTimeout(() => p.classList.remove('walk', 'izq'), 7700);
}

function ofAbrir(id) {
  _ofSel = id;
  document.querySelectorAll('.of-desk').forEach(d => d.classList.toggle('sel', d.getAttribute('onclick') === `ofAbrir(${id})`));
  ofPintarPanel();
}

function ofPintarPanel() {
  const panel = document.getElementById('ofPanel');
  if(!panel || !_ofDatos) return;
  const s = _ofDatos.servicios.find(x => String(x.id) === String(_ofSel));
  if(!s) {
    panel.innerHTML = `<div class="of-empty"><div class="big">👆</div>Elige a alguien de la oficina para ver y definir cómo se ejecuta su servicio.</div>`;
    return;
  }
  const g = _ofDatos.grupos.find(x => x.id === s.grupo_id);
  const cfg = _ofCfg(s.id);
  const nivel = cfg.nivel || 0;
  const idx = _ofDatos.servicios.indexOf(s);
  const persona = cfg.persona || OF_NOMBRES[(Number(s.id) + idx) % OF_NOMBRES.length];
  panel.innerHTML = `
    <h3>${_ofEsc(s.nombre)}</h3>
    <div class="sub">${_ofEsc(g ? g.nombre : 'Sin categoría')}${s.activo ? '' : ' · inactivo'}</div>
    <label>Quién lo ejecuta</label>
    <input type="text" value="${_ofEsc(persona)}" placeholder="Nombre de la persona" onchange="ofGuardar(${s.id},'persona',this.value)">
    <label>Cómo lo hacen (paso a paso)</label>
    <textarea rows="6" placeholder="1. Recibe el brief&#10;2. Investiga referencias&#10;3. Entrega borrador…" onchange="ofGuardar(${s.id},'pasos',this.value)">${_ofEsc(cfg.pasos || '')}</textarea>
    <label>Herramientas que usa</label>
    <input type="text" value="${_ofEsc(cfg.herramientas || '')}" placeholder="Canva, Premiere, ChatGPT…" onchange="ofGuardar(${s.id},'herramientas',this.value)">
    <label>Nivel de automatización</label>
    <div class="of-niv">${OF_NIVELES.map(l => `<button class="${l.n === nivel ? 'on' : ''}" onclick="ofGuardar(${s.id},'nivel',${l.n},true)">${l.icon}<br>${l.label}</button>`).join('')}</div>
    <div class="of-niv-desc">${OF_NIVELES[nivel].desc}</div>`;
}

function ofGuardar(id, campo, valor, repintar) {
  const d = _ofLoad();
  d[id] = Object.assign({}, d[id], {[campo]: valor});
  _ofSave(d);
  ofActualizarHud();
  if(campo === 'nivel' || campo === 'persona') {
    // Rehace los escritorios para que cambien el sprite, la insignia y la etiqueta
    const s = _ofDatos.servicios.find(x => String(x.id) === String(id));
    const desk = document.querySelector(`.of-desk[data-id="${id}"]`);
    if(s && desk) {
      const tmp = document.createElement('div');
      tmp.innerHTML = _ofEscritorio(s, _ofDatos.servicios.indexOf(s));
      desk.replaceWith(tmp.firstElementChild);
    }
  }
  if(repintar) ofPintarPanel();
}
