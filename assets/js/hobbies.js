/* Native scrolling keeps the four interests usable without JavaScript. */
const carousel = document.querySelector('.hobbies-carousel');
if (carousel) {
  const track = carousel.querySelector('.hobbies-track');
  const slides = [...track.querySelectorAll('.hobby')];
  const controls = carousel.querySelector('.hobby-controls');
  const dots = [...controls.querySelectorAll('[data-slide]')];
  const previous = controls.querySelector('[data-direction="-1"]');
  const next = controls.querySelector('[data-direction="1"]');
  const position = controls.querySelector('.hobby-position');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const photoControls = carousel.querySelector('.photo-controls');
  const photoToggle = photoControls.querySelector('[data-photo-toggle]');
  const photoPosition = photoControls.querySelector('.photo-position');
  const galleries = slides.map(slide => {
    const link = slide.querySelector('.figure-link'), image = link.querySelector('img');
    const caption = slide.querySelector('figcaption p');
    const photos = [{ href: link.href, thumbnail: image.src, alt: image.alt, caption: caption.textContent }];
    for (const item of slide.querySelector('.hobby-gallery')?.content.querySelectorAll('a') || []) {
      photos.push({ href: item.href, thumbnail: item.dataset.thumbnail, alt: item.dataset.alt, caption: item.dataset.caption });
    }
    return { link, image, caption, photos, index: 0 };
  });
  let photoTimer, photoRequest = 0, visible = false, paused = false;
  let index = -1;
  let destination = 0;
  let frame = null;
  function show(target) {
    slides.forEach((slide, i) => slide.classList.toggle('is-current', i === target));
    previous.disabled = target === 0;
    next.disabled = target === slides.length - 1;
  }
  function update() {
    if (!track.clientWidth) return; // Hidden or detached tracks have no slide geometry.
    const current = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    destination = current;
    show(current);
    if (current === index) return;
    index = current;
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
      dots[i].setAttribute('aria-current', String(i === index));
    });
    position.textContent = `${index + 1} / ${slides.length} · ${slides[index].dataset.title}`;
    schedulePhotos();
  }
  function canRotate() {
    return index >= 0 && galleries[index].photos.length > 1 && visible && !paused && !reducedMotion.matches && !document.hidden && frame === null &&
      !document.querySelector('dialog[open]') && !track.matches(':hover') && !track.contains(document.activeElement);
  }
  function schedulePhotos() {
    clearTimeout(photoTimer);
    photoRequest++; // Discard a late image load after navigation, pause or a modal opens.
    if (index < 0) return;
    const gallery = galleries[index];
    photoControls.hidden = gallery.photos.length < 2;
    photoToggle.disabled = reducedMotion.matches;
    photoToggle.textContent = paused || reducedMotion.matches ? photoToggle.dataset.resume : photoToggle.dataset.pause;
    photoPosition.textContent = `${gallery.index + 1} / ${gallery.photos.length} · ${slides[index].dataset.title}`;
    if (canRotate()) photoTimer = setTimeout(() => changePhoto(1, true), 6000);
  }
  function changePhoto(direction, automatic = false) {
    clearTimeout(photoTimer);
    const request = ++photoRequest, target = index, gallery = galleries[target];
    if (!gallery || gallery.photos.length < 2) return;
    const nextPhoto = (gallery.index + direction + gallery.photos.length) % gallery.photos.length;
    const photo = gallery.photos[nextPhoto], preload = new Image();
    preload.onload = () => {
      if (request !== photoRequest || target !== index || (automatic && !canRotate())) return;
      gallery.image.src = photo.thumbnail;
      gallery.image.alt = photo.alt;
      gallery.link.href = photo.href;
      gallery.caption.textContent = photo.caption;
      gallery.index = nextPhoto;
      if (!reducedMotion.matches) gallery.image.animate([{ opacity: 0.65 }, { opacity: 1 }], { duration: 360 });
      schedulePhotos();
    };
    preload.onerror = () => { if (request === photoRequest) schedulePhotos(); };
    preload.src = photo.thumbnail;
  }
  function cancel() {
    cancelAnimationFrame(frame);
    frame = null;
    track.classList.remove('is-moving');
    schedulePhotos();
  }
  function move(target, instant = reducedMotion.matches) {
    cancel();
    destination = Math.max(0, Math.min(slides.length - 1, target));
    const start = track.scrollLeft;
    const end = destination * track.clientWidth;
    show(destination);
    if (instant || Math.abs(end - start) < 1) {
      track.scrollTo({ left: end, behavior: 'instant' });
      update();
      return;
    }
    track.classList.add('is-moving');
    clearTimeout(photoTimer);
    photoRequest++;
    const started = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - started) / 720);
      track.scrollLeft = start + (end - start) * (1 - (1 - progress) ** 4);
      if (progress < 1) frame = requestAnimationFrame(step);
      else { cancel(); update(); }
    }
    frame = requestAnimationFrame(step);
  }
  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    move(button.hasAttribute('data-slide') ? Number(button.dataset.slide) : destination + Number(button.dataset.direction));
  });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : destination + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('scroll', () => { if (frame === null) update(); }, { passive: true });
  track.addEventListener('pointerdown', cancel, { passive: true });
  track.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('resize', () => move(destination, true));
  reducedMotion.addEventListener('change', () => move(destination, true));
  photoControls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button === photoToggle) { paused = !paused; schedulePhotos(); }
    else {
      paused = true;
      photoToggle.textContent = photoToggle.dataset.resume;
      changePhoto(Number(button.dataset.photoDirection));
    }
  });
  for (const event of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) track.addEventListener(event, schedulePhotos);
  document.addEventListener('visibilitychange', schedulePhotos);
  window.addEventListener('pagehide', () => { clearTimeout(photoTimer); photoRequest++; });
  window.addEventListener('pageshow', schedulePhotos);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
    schedulePhotos();
  }, { threshold: [0, 0.25] }).observe(carousel);
  const modalObserver = new MutationObserver(schedulePhotos);
  document.querySelectorAll('dialog').forEach(dialog => modalObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  controls.hidden = false;
  update();
  carousel.classList.add('hobbies-enhanced');
}
