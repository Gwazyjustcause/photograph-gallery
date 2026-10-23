'use strict';
const $ = (id) => document.getElementById(id);
let photos = [], current = 0, opener = null, activeAlbum = null, pendingAlbum = null, albumOpener = null, requestVersion = 0;
const imageURL = (photo, size) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(photo.id)}=${size}`;
const decode = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
$('year').textContent = new Date().getFullYear();
async function readJSON(path) {
  const response = await fetch(path, {cache:'no-store'});
  if (!response.ok) throw new Error('network');
  return response.json();
}
async function loadCatalog() {
  try {
    const albums = await readJSON('albums/index.json');
    for (const album of albums) {
      const card = document.createElement('button');
      card.className = 'album-tile';
      const image = document.createElement('img');
      image.src = imageURL({id:album.cover},'w1000');
      if(album.downloads!==true) {
        image.addEventListener('contextmenu',event=>event.preventDefault());
        image.addEventListener('dragstart',event=>event.preventDefault());
        image.style.webkitTouchCallout='none';
      }
      image.alt = ''; image.loading = 'lazy'; image.draggable = false; image.referrerPolicy = 'no-referrer';
      const info = document.createElement('div'); info.className='tile-info';
      const title = document.createElement('h2'); title.textContent=album.title;
      const meta = document.createElement('p'); meta.textContent = album.passwordRequired ? 'Com palavra-passe' : 'Álbum público';
      const arrow = document.createElement('span'); arrow.className='tile-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
      info.append(title,meta,arrow);card.append(image,info);
      card.addEventListener('click',()=>chooseAlbum(album,card));
      $('album-list').append(card);
    }
  } catch { $('catalog-status').textContent='Não foi possível carregar os álbuns. Atualize a página para tentar novamente.'; }
}
function resetPassword() {
  $('password').value='';$('password').type='password';
  $('show-password').textContent='Mostrar';
  $('show-password').setAttribute('aria-pressed','false');
  $('show-password').setAttribute('aria-label','Mostrar palavra-passe');
  $('message').textContent='';$('unlock').disabled=false;
}
async function chooseAlbum(album,card) {
  albumOpener=card;
  if(album.passwordRequired) {
    pendingAlbum=album;resetPassword();
    $('access-title').textContent=album.title;
    $('access').showModal();$('password').focus();
  } else {
    const version=++requestVersion;
    $('catalog-status').textContent='A abrir o álbum…';
    try {const content=await readJSON(album.source);if(version===requestVersion)showAlbum(album,content);}
    catch {if(version===requestVersion)$('catalog-status').textContent='Não foi possível abrir o álbum. Tente novamente.';}
  }
}
function showAlbum(album,content) {
  activeAlbum=album;photos=content.photos;render();
  $('album-title').textContent=album.title;
  $('album-meta').textContent=[album.location,album.year].filter(Boolean).join(' · ');
  $('album-description').textContent=album.downloads===true ? 'Veja e descarregue as suas fotografias.' : '© Gwazy · Álbum para visualização.';
  $('download').hidden=album.downloads!==true;
  $('view-only').hidden=album.downloads===true;
  $('download-status').textContent='';
  $('entrance').hidden=true;$('album').hidden=false;$('lock').hidden=false;
  $('catalog-status').textContent='';
  window.scrollTo(0,0);$('lock').focus({preventScroll:true});
}
$('show-password').addEventListener('click', () => {
  const shown = $('password').type === 'password';
  $('password').type = shown ? 'text' : 'password';
  $('show-password').textContent = shown ? 'Ocultar' : 'Mostrar';
  $('show-password').setAttribute('aria-pressed', String(shown));
  $('show-password').setAttribute('aria-label', shown ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe');
});
$('close-access').addEventListener('click',()=>$('access').close());
$('access').addEventListener('close',()=>{
  ++requestVersion;pendingAlbum=null;resetPassword();
  if(!activeAlbum)albumOpener?.focus();
});
$('unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  const selected=pendingAlbum,version=++requestVersion;
  if(!selected)return;
  $('unlock').disabled=true;$('message').textContent='A abrir o álbum…';
  let bundle;
  try {bundle=await readJSON(selected.source);}
  catch {if(version===requestVersion){$('message').textContent='Não foi possível carregar o álbum. Verifique a ligação e tente novamente.';$('unlock').disabled=false;}return;}
  try {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode($('password').value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(bundle.salt),iterations:bundle.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(bundle.iv)},key,decode(bundle.data));
    const content=JSON.parse(new TextDecoder().decode(plain));
    if(version!==requestVersion)return;
    // Set the album before closing to keep focus inside the newly opened gallery.
    activeAlbum=selected;
    $('access').close();resetPassword();showAlbum(selected,content);
  } catch {
    if(version===requestVersion){$('message').textContent='Palavra-passe incorreta. Tente novamente.';$('password').select();}
  } finally {if(version===requestVersion)$('unlock').disabled=false;}
});
loadCatalog();
function render() {
  $('count').textContent = photos.length;
  const fragment = document.createDocumentFragment();
  photos.forEach((photo,index) => {
    const button = document.createElement('button');
    button.className = 'photo';
    button.setAttribute('aria-label', `Ampliar ${photo.name}`);
    const img = document.createElement('img');
    img.alt = `${activeAlbum.title} — fotografia ${index+1}`;
    img.loading = index < 6 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    if(activeAlbum.downloads!==true)img.style.webkitTouchCallout='none';
    img.referrerPolicy = 'no-referrer';
    img.src = imageURL(photo, 'w800');
    const caption = document.createElement('span');
    caption.textContent = photo.name;
    img.addEventListener('error', () => { caption.textContent = `${photo.name} · Clique para tentar ampliar`; });
    button.append(img,caption);
    button.addEventListener('click', () => {opener=button;openPhoto(index);});
    fragment.append(button);
  });
  $('grid').replaceChildren(fragment);
}
function openPhoto(index) {
  current = index;
  const photo=photos[current];
  $('image-error').hidden=true;
  $('large-photo').style.webkitTouchCallout=activeAlbum.downloads===true ? 'default' : 'none';
  $('large-photo').alt=`${activeAlbum.title} — ${photo.name}`;
  $('large-photo').src=imageURL(photo,'w2400');
  $('photo-name').textContent=photo.name;
  $('position').textContent=`${current+1} / ${photos.length}`;
  $('previous').disabled=current===0;
  $('next').disabled=current===photos.length-1;
  if (!$('download').disabled) $('download-status').textContent='';
  if (!$('viewer').open) {$('viewer').showModal();document.body.classList.add('viewing');}
}
$('large-photo').addEventListener('error', () => {$('image-error').hidden=false;});
$('previous').addEventListener('click', () => {if(current>0)openPhoto(current-1);});
$('next').addEventListener('click', () => {if(current<photos.length-1)openPhoto(current+1);});
$('close-viewer').addEventListener('click', () => $('viewer').close());
$('viewer').addEventListener('close', () => {document.body.classList.remove('viewing');$('large-photo').removeAttribute('src');opener?.focus();});
$('viewer').addEventListener('keydown', event => {
  if(event.key==='ArrowLeft' && current>0){event.preventDefault();openPhoto(current-1);}
  if(event.key==='ArrowRight' && current<photos.length-1){event.preventDefault();openPhoto(current+1);}
});
let touchStart;
$('large-photo').addEventListener('touchstart',event=>{touchStart=event.changedTouches[0].screenX;},{passive:true});
$('large-photo').addEventListener('touchend',event=>{const delta=event.changedTouches[0].screenX-touchStart;if(Math.abs(delta)<60)return;if(delta<0 && current<photos.length-1)openPhoto(current+1);if(delta>0 && current>0)openPhoto(current-1);},{passive:true});
$('download').addEventListener('click', async () => {
  if(activeAlbum?.downloads!==true)return;
  const downloadAlbum=activeAlbum;
  const photo = photos[current];
  $('download').disabled=true;
  $('download-status').textContent='A preparar a fotografia…';
  try {
    const response=await fetch(imageURL(photo,'d'),{referrerPolicy:'no-referrer'});
    if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw new Error('download');
    const blob=await response.blob();
    if(activeAlbum!==downloadAlbum)return;
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=photo.name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('download-status').textContent='Fotografia enviada para as transferências.';
  } catch {
    if(activeAlbum!==downloadAlbum)return;
    $('download-status').replaceChildren(document.createTextNode('O download direto não está disponível. '));
    const link=document.createElement('a');link.href=imageURL(photo,'d');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Abrir a imagem para guardar';$('download-status').append(link);
  } finally { $('download').disabled=false; }
});
$('lock').addEventListener('click', () => {
  ++requestVersion;
  if($('viewer').open)$('viewer').close();
  photos=[];activeAlbum=null;$('grid').replaceChildren();
  $('album').hidden=true;$('entrance').hidden=false;$('lock').hidden=true;
  $('download').hidden=true;$('download-status').textContent='';
  window.scrollTo(0,0);albumOpener?.focus();
});
// Discourage casual saving only on view-only albums; this is not DRM.
for(const id of ['grid','large-photo']) {
  $(id).addEventListener('contextmenu',event=>{if(activeAlbum?.downloads!==true)event.preventDefault();});
  $(id).addEventListener('dragstart',event=>{if(activeAlbum?.downloads!==true)event.preventDefault();});
}
