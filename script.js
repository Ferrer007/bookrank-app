const API_KEY = "IdB3Gqm6uCd0oQOcQ7SC2I9mhzIw6YXvcviFTyB6tcPG8MZg";
const BASE = "https://api.nytimes.com/svc/books/v3";
const STORES = [
  {id:1,name:"Librería Central",lat:4.7110,lng:-74.0721,addr:"Av. Séptima #24-15"},
  {id:2,name:"Casa del Libro",lat:4.6486,lng:-74.0648,addr:"Calle 19 #4-30"},
  {id:3,name:"Páginas y Café",lat:4.6970,lng:-74.0450,addr:"Cra 13 #85-20"},
  {id:4,name:"El Tomo Perdido",lat:4.6280,lng:-74.0650,addr:"Av. Jiménez #6-12"}
];
const FALLBACK = {
  "hardcover-fiction":[{rank:1,title:"La sombra del viento",author:"Carlos Ruiz Zafón",weeks_on_list:32,description:"En la Barcelona de posguerra, un joven descubre un libro maldito que lo arrastra a un misterio literario de décadas.",isbn13:"demo1"},
  {rank:2,title:"Cien años de soledad",author:"Gabriel García Márquez",weeks_on_list:214,description:"La saga de la familia Buendía y el pueblo de Macondo, entre el realismo y el mito.",isbn13:"demo2"}],
  "hardcover-nonfiction":[{rank:1,title:"Hábitos atómicos",author:"James Clear",weeks_on_list:105,description:"Un método práctico para construir buenos hábitos y romper los malos, un cambio pequeño a la vez.",isbn13:"demo3"}],
  "young-adult":[{rank:1,title:"La hipótesis del amor",author:"Ali Hazelwood",weeks_on_list:8,description:"Una doctoranda finge una relación para ayudar a una amiga y termina descubriendo algo real.",isbn13:"demo4"}]
};
let state = {favorites:[],logs:[],location:null,notifPerm:(typeof Notification!=="undefined"?Notification.permission:"unsupported"),currentBooks:[],usingLive:false};

function store(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }

function log(accion,detalle,pantalla){
  state.logs.push({accion,detalle,pantalla,ts:new Date().toISOString()});
  state.logs = state.logs.slice(-50);
  store('bookrank_logs', state.logs);
  renderLogs();
}
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

async function fetchList(listName){
  document.getElementById('book-list').innerHTML = '<div class="spin"></div>';
  try{
    const res = await fetch(`${BASE}/lists/current/${listName}.json?api-key=${API_KEY}`);
    if(!res.ok) throw new Error('bad status');
    const data = await res.json();
    const books = data.results.books.map(b=>({rank:b.rank,title:b.title,author:b.author,weeks_on_list:b.weeks_on_list,description:b.description,isbn13:b.primary_isbn13}));
    state.usingLive = true;
    return books;
  }catch(e){
    state.usingLive = false;
    return FALLBACK[listName] || [];
  }
}
async function filterCat(el){
  [...el.parentElement.children].forEach(c=>c.classList.remove('on')); el.classList.add('on');
  log('filtrar_categoria', el.dataset.cat, 'home');
  const books = await fetchList(el.dataset.cat);
  state.currentBooks = books;
  renderList(books);
}
function renderList(books){
  document.getElementById('book-list').innerHTML = (state.usingLive? '' : '<div style="font-size:10.5px;color:var(--muted);margin-bottom:8px">Mostrando datos de ejemplo (la API no respondió)</div>') +
    books.map(b=>`<div class="card" onclick='openDetail(${JSON.stringify(b).replace(/'/g,"&#39;")})'>
      <div class="rank">0<br>${b.rank}</div>
      <div><b>${b.title}</b><span>${b.author} · ${b.weeks_on_list} sem. en lista</span></div></div>`).join('');
}
function openDetail(b){
  const fav = state.favorites.some(f=>f.isbn13===b.isbn13);
  document.getElementById('detail-body').innerHTML = `
    <div class="cover" id="cover-box">${b.title}</div>
    <h2 class="serif" style="margin:0 0 2px">${b.title}</h2>
    <div style="color:var(--crimson);font-size:13px;margin-bottom:10px">${b.author}</div>
    <p style="font-size:13px;line-height:1.6">${b.description||'Sin descripción disponible.'}</p>
    <button class="btn" onclick='toggleFav(${JSON.stringify(b).replace(/'/g,"&#39;")},this)'>${fav?'♥ Quitar de favoritos':'♡ Guardar en favoritos'}</button>
    <a class="btn" style="text-decoration:none" target="_blank" href="https://www.nytimes.com/search?query=${encodeURIComponent(b.title)}" onclick="log('abrir_resena','${b.title}','detalle')">Leer reseña del NYT ↗</a>
    <button class="btn gps" onclick='openNearby(${JSON.stringify(b).replace(/'/g,"&#39;")})'><svg class="icon" style="stroke:#fff"><use href="#i-pin"/></svg> Buscar cerca de mí</button>`;
  log('ver_detalle_libro', b.title, 'detalle');
  go('detalle');
}

async function fetchCover(isbn){
  if(!isbn || isbn.startsWith('demo')) return;
  try{
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const d = await r.json();
    const thumb = d.items && d.items[0].volumeInfo.imageLinks && d.items[0].volumeInfo.imageLinks.thumbnail;
    if(thumb){
      const box = document.getElementById('cover-box');
      if(box) box.outerHTML = `<img src="${thumb.replace('http://','https://')}" style="width:100%;height:170px;object-fit:cover;border-radius:12px;margin-bottom:14px">`;
    }
  }catch(e){}
}

function toggleFav(b,btn){
  const i = state.favorites.findIndex(f=>f.isbn13===b.isbn13);
  if(i>-1){ state.favorites.splice(i,1); btn.textContent='♡ Guardar en favoritos'; toast('Quitado de favoritos'); }
  else { state.favorites.push(b); btn.textContent='♥ Quitar de favoritos'; toast('Guardado en favoritos'); }
  store('bookrank_favs', state.favorites);
  log('cambiar_favorito', b.title, 'detalle');
  renderFavs();
}
function renderFavs(){
  const el = document.getElementById('fav-list');
  if(!state.favorites.length){ el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;margin-top:60px">Aún no tienes libros guardados.</div>'; return; }
  el.innerHTML = state.favorites.map(b=>`<div class="card" onclick='openDetail(${JSON.stringify(b).replace(/'/g,"&#39;")})'><div><b>${b.title}</b><span>${b.author}</span></div></div>`).join('');
}
function haversine(lat1,lon1,lat2,lon2){const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function openNearby(b){
  go('cercanas'); log('activar_gps','solicitado','cercanas');
  document.getElementById('mapbox').innerHTML = '<div class="spin"></div>';
  document.getElementById('gps-btn-wrap').innerHTML='';
  if(!navigator.geolocation){ renderStores(null); return; }
  navigator.geolocation.getCurrentPosition(
    pos=>{ state.location={lat:pos.coords.latitude,lng:pos.coords.longitude}; log('gps_ok',`${pos.coords.latitude.toFixed(2)},${pos.coords.longitude.toFixed(2)}`,'cercanas'); renderStores(state.location); },
    err=>{ log('gps_error', err.message, 'cercanas'); renderStores(null); },
    {timeout:8000}
  );
}
function renderStores(loc){
  let list = STORES.map(s=>({...s, d: loc? haversine(loc.lat,loc.lng,s.lat,s.lng) : null}));
  if(loc) list.sort((a,b)=>a.d-b.d);
  document.getElementById('mapbox').innerHTML = loc
    ? STORES.map((s,i)=>`<svg class="icon" style="stroke:var(--gps);width:18px;height:18px;position:absolute;top:${15+i*22}%;left:${20+(i%3)*25}%"><use href="#i-pin"/></svg>`).join('')
    : '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11.5px;color:var(--muted);text-align:center;padding:0 1rem">Activa tu ubicación para ordenar por distancia real</div>';
  document.getElementById('gps-btn-wrap').innerHTML = loc ? '' : '<button class="btn" onclick="retryGps()">Reintentar ubicación</button>';
  document.getElementById('store-list').innerHTML = list.map(s=>`<div class="card"><div><b>${s.name}</b><span>${s.addr}</span></div><span style="margin-left:auto;color:var(--gps);font-weight:600;font-size:12px">${s.d!=null?s.d.toFixed(1)+' km':'—'}</span></div>`).join('');
}
function retryGps(){
  document.getElementById('mapbox').innerHTML='<div class="spin"></div>';
  navigator.geolocation.getCurrentPosition(pos=>{state.location={lat:pos.coords.latitude,lng:pos.coords.longitude};renderStores(state.location);},()=>renderStores(null),{timeout:8000});
}
async function enableNotifs(){
  if(typeof Notification==="undefined"){ toast('Tu navegador no soporta notificaciones'); return; }
  const perm = await Notification.requestPermission();
  state.notifPerm = perm; log('permiso_notificaciones', perm, 'notif');
  document.getElementById('notif-btn').textContent = perm==='granted' ? 'Notificaciones activadas ✓' : 'No autorizadas por el navegador';
}
function simulateRanking(){
  const n = {title:'Nuevo ranking disponible', body:'Se actualizó la categoría que estás viendo.', ts:new Date().toISOString()};
  addNotif(n); log('simular_notificacion', n.title, 'notif');
  if(state.notifPerm==='granted'){ try{ new Notification(n.title,{body:n.body}); }catch(e){} } else toast(n.title);
}
let notifs = [{title:'Nuevo ranking semanal',body:'Ya está disponible la lista de esta semana.',ts:new Date(Date.now()-600000).toISOString()},{title:'Tu favorito subió de puesto',body:'Revisa el ranking actualizado.',ts:new Date(Date.now()-7200000).toISOString()}];
function addNotif(n){ notifs.unshift(n); renderNotifs(); }
function renderNotifs(){
  document.getElementById('notif-list').innerHTML = notifs.map(n=>`<div class="notif"><div class="bullet"></div><div><b>${n.title}</b><p>${n.body}</p><small>${timeAgo(n.ts)}</small></div></div>`).join('');
}
function timeAgo(iso){const m=Math.floor((Date.now()-new Date(iso))/60000); if(m<1)return'ahora'; if(m<60)return`hace ${m} min`; const h=Math.floor(m/60); if(h<24)return`hace ${h} h`; return`hace ${Math.floor(h/24)} d`;}
function renderLogs(){
  document.getElementById('log-stats').textContent = `${state.logs.length} eventos registrados en este navegador`;
  document.getElementById('log-list').innerHTML = state.logs.slice(-5).reverse().map(l=>`<div class="logtxt"><span>${l.accion}${l.detalle?' · '+l.detalle:''}</span><span>${timeAgo(l.ts)}</span></div>`).join('');
}

const GENRE_OPTIONS = ["Ficción","No ficción","Misterio","Historia","Infantil"];
const AGE_OPTIONS = ["18-25","26-35","36-45","46+"];
function usageTop(){
  const counts={};
  state.logs.forEach(l=>{ if(l.accion==='filtrar_categoria'&&l.detalle) counts[l.detalle]=(counts[l.detalle]||0)+1; });
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return top?top[0]:'—';
}
function renderProfile(){
  const prefs = load('bookrank_prefs', {genres:["Ficción"], age:"26-35"});
  document.getElementById('profile-genres').innerHTML = GENRE_OPTIONS.map(g=>
    `<div class="chip ${prefs.genres.includes(g)?'on':''}" data-g="${g}" onclick="toggleChip(this)">${g}</div>`).join('');
  document.getElementById('profile-age').innerHTML = AGE_OPTIONS.map(a=>
    `<div class="chip ${prefs.age===a?'on':''}" onclick="selectOnly(this)">${a}</div>`).join('');
  document.getElementById('profile-stats').textContent = `${state.favorites.length} libros guardados`;
  document.getElementById('profile-top').textContent = `Categoría más vista: ${usageTop()}`;
}
function savePrefs(){
  const genres=[...document.querySelectorAll('#profile-genres .chip.on')].map(c=>c.dataset.g);
  const age=document.querySelector('#profile-age .chip.on')?.textContent||'26-35';
  store('bookrank_prefs',{genres,age});
  log('cambiar_preferencia', genres.join(','), 'config');
  toast('Preferencias actualizadas');
}

function go(name){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active', s.dataset.s===name)); document.querySelectorAll('.navitem').forEach(n=>n.classList.toggle('on', n.dataset.nav===name)); if(name==='config') renderProfile(); log('ver_pantalla','',name); }
function toggleChip(el){ el.classList.toggle('on'); }
function selectOnly(el){ [...el.parentElement.children].forEach(c=>c.classList.remove('on')); el.classList.add('on'); }
function setTheme(dark,el){ document.body.classList.toggle('dark',dark); [...el.parentElement.children].forEach(c=>c.classList.remove('on')); el.classList.add('on'); document.getElementById('dark-switch').classList.toggle('on',dark); }
function toggleDark(sw){ sw.classList.toggle('on'); document.body.classList.toggle('dark', sw.classList.contains('on')); }
function finishOnboarding(){
  const genres=[...document.querySelectorAll('#ob-genres .chip.on')].map(c=>c.dataset.v);
  store('bookrank_prefs',{genres}); log('configurar_preferencias', genres.join(','), 'onboarding');
  go('home');
}
state.favorites = load('bookrank_favs', []);
state.logs = load('bookrank_logs', []);
renderFavs(); renderNotifs(); renderLogs();
filterCat(document.querySelector('#home-tabs .chip.on'));
setTimeout(()=> go(load('bookrank_prefs',null) ? 'home' : 'onboarding'), 1300);

document.querySelectorAll('.tabs').forEach(t=>{
  t.addEventListener('wheel', e=>{
    if(e.deltaY === 0) return;
    e.preventDefault();
    t.scrollLeft += e.deltaY;
  });
});