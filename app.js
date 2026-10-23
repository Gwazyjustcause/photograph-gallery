'use strict';
const $ = (id) => document.getElementById(id);
let photos = [], current = 0, opener = null;
const imageURL = (photo, size) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(photo.id)}=${size}`;
const decode = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
$('year').textContent = new Date().getFullYear();
$('show-password').addEventListener('click', () => {
  const shown = $('password').type === 'password';
  $('password').type = shown ? 'text' : 'password';
  $('show-password').textContent = shown ? 'Ocultar' : 'Mostrar';
  $('show-password').setAttribute('aria-pressed', String(shown));
  $('show-password').setAttribute('aria-label', shown ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe');
});
$('unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('unlock').disabled = true;
  $('message').textContent = 'A abrir o álbum…';
  let bundle;
  try {
    const response = await fetch('albums/eiras-2025.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('network');
    bundle = await response.json();
  } catch {
    $('message').textContent = 'Não foi possível carregar o álbum. Verifique a ligação e tente novamente.';
    $('unlock').disabled = false;
    return;
  }
  try {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode($('password').value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(bundle.salt),iterations:bundle.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(bundle.iv)},key,decode(bundle.data));
    const album = JSON.parse(new TextDecoder().decode(plain));
    photos = album.photos;
    render();
    $('password').value = '';
    $('password').type = 'password';
    $('message').textContent = '';
    $('entrance').hidden = true;
    $('album').hidden = false;
    $('lock').hidden = false;
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0,0);
    $('lock').focus({preventScroll:true});
  } catch {
    $('message').textContent = 'Palavra-passe incorreta. Tente novamente.';
    $('password').select();
  } finally { $('unlock').disabled = false; }
});
function render() {
  $('count').textContent = photos.length;
  const fragment = document.createDocumentFragment();
  photos.forEach((photo,index) => {
    const button = document.createElement('button');
    button.className = 'photo';
    button.setAttribute('aria-label', `Ampliar ${photo.name}`);
    const img = document.createElement('img');
    img.alt = `Feira Medieval de Eiras — fotografia ${index+1}`;
    img.loading = index < 6 ? 'eager' : 'lazy';
    img.decoding = 'async';
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
  $('large-photo').alt=`Feira Medieval de Eiras — ${photo.name}`;
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
  const photo = photos[current];
  $('download').disabled=true;
  $('download-status').textContent='A preparar a fotografia…';
  try {
    const response=await fetch(imageURL(photo,'d'),{referrerPolicy:'no-referrer'});
    if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw new Error('download');
    const blob=await response.blob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=photo.name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('download-status').textContent='Fotografia enviada para as transferências.';
  } catch {
    $('download-status').replaceChildren(document.createTextNode('O download direto não está disponível. '));
    const link=document.createElement('a');link.href=imageURL(photo,'d');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Abrir a imagem para guardar';$('download-status').append(link);
  } finally { $('download').disabled=false; }
});
$('lock').addEventListener('click', () => {
  if($('viewer').open)$('viewer').close();
  photos=[];$('grid').replaceChildren();
  $('album').hidden=true;$('entrance').hidden=false;$('lock').hidden=true;
  $('password').value='';$('password').focus();
  $('show-password').textContent='Mostrar';$('show-password').setAttribute('aria-pressed','false');$('show-password').setAttribute('aria-label','Mostrar palavra-passe');
});
