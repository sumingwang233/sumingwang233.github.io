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
  }
  function cancel() {
    cancelAnimationFrame(frame);
    frame = null;
    track.classList.remove('is-moving');
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
  controls.hidden = false;
  update();
  carousel.classList.add('hobbies-enhanced');
}
