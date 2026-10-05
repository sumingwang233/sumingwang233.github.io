/* Native dialog supplies focus trapping, Escape and a direct-image fallback. */
const imageViewer = document.querySelector('.image-viewer');
if (imageViewer && typeof imageViewer.showModal === 'function') {
  const stage = imageViewer.querySelector('.image-viewer-stage');
  const image = stage.querySelector('img');
  const caption = imageViewer.querySelector('#image-viewer-caption');
  const error = stage.querySelector('.image-viewer-error');
  const scale = imageViewer.querySelector('output');
  const minus = imageViewer.querySelector('[data-zoom="-1"]');
  const plus = imageViewer.querySelector('[data-zoom="1"]');
  document.querySelectorAll('a.figure-link').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', imageViewer.id);
  });
  let trigger, zoom = 1, x = 0, y = 0, drag;
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

  function render() {
    x = clamp(x, Math.max(0, (image.clientWidth * zoom - stage.clientWidth) / 2));
    y = clamp(y, Math.max(0, (image.clientHeight * zoom - stage.clientHeight) / 2));
    image.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    scale.value = `${Math.round(zoom * 100)}%`;
    minus.disabled = image.hidden || zoom <= 1;
    plus.disabled = image.hidden || zoom >= 4;
    stage.classList.toggle('is-zoomed', zoom > 1);
  }
  function fit() {
    if (!imageViewer.open || image.hidden || !image.naturalWidth) return;
    const ratio = Math.min(stage.clientWidth / image.naturalWidth, stage.clientHeight / image.naturalHeight, 1);
    image.style.width = `${image.naturalWidth * ratio}px`;
    image.style.height = `${image.naturalHeight * ratio}px`;
    render();
  }
  function setZoom(value, clientX, clientY) {
    if (!imageViewer.open || image.hidden) return;
    const rect = stage.getBoundingClientRect();
    const px = clientX === undefined ? 0 : clientX - rect.left - rect.width / 2;
    const py = clientY === undefined ? 0 : clientY - rect.top - rect.height / 2;
    const next = Math.max(1, Math.min(4, value));
    x = px - (px - x) * next / zoom;
    y = py - (py - y) * next / zoom;
    zoom = next;
    render();
  }
  function ready() {
    if (!imageViewer.open || !image.naturalWidth) return;
    image.hidden = false;
    fit();
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a.figure-link');
    if (!link || !link.querySelector('img') || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    trigger = link;
    zoom = 1; x = 0; y = 0; drag = undefined;
    image.hidden = true;
    error.hidden = true;
    // The requested full-size photograph may be uncached and hidden while loading.
    image.loading = 'eager';
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = image.alt;
    imageViewer.classList.toggle('image-viewer--instant', event.detail === 0);
    imageViewer.showModal();
    document.documentElement.classList.add('image-viewer-open');
    render();
    if (image.complete) ready();
  });
  image.addEventListener('load', ready);
  image.addEventListener('error', () => { image.hidden = true; error.hidden = false; render(); });
  imageViewer.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => setZoom(zoom + Number(button.dataset.zoom) * 0.5)));
  imageViewer.querySelector('[data-reset]').addEventListener('click', () => { zoom = 1; x = 0; y = 0; render(); });
  imageViewer.querySelector('.image-viewer-close').addEventListener('click', () => imageViewer.close());
  imageViewer.addEventListener('touchend', event => {
    const button = event.target.closest('button');
    if (!button) return;
    // A deliberate control tap must work even immediately after a drag suppresses native clicks.
    event.preventDefault();
    if (button.disabled || event.touches.length || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    if (document.elementFromPoint(touch.clientX, touch.clientY)?.closest('button') === button) {
      button.focus({ preventScroll: true });
      button.click();
    }
  }, { passive: false });
  imageViewer.addEventListener('click', event => { if (event.target === imageViewer) imageViewer.close(); });
  imageViewer.addEventListener('cancel', () => imageViewer.classList.add('image-viewer--instant'));
  imageViewer.addEventListener('close', () => {
    if (imageViewer.open) return; // Ignore a queued close if another image was already opened.
    document.documentElement.classList.remove('image-viewer-open');
    drag = undefined;
    stage.classList.remove('is-dragging');
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  });
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), event.clientX, event.clientY);
  }, { passive: false });
  stage.addEventListener('dblclick', event => setZoom(zoom > 1 ? 1 : 2, event.clientX, event.clientY));
  stage.addEventListener('pointerdown', event => {
    if (zoom <= 1 || event.button !== 0 || !event.isPrimary) return;
    drag = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, x, y };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    x = drag.x + event.clientX - drag.clientX;
    y = drag.y + event.clientY - drag.clientY;
    render();
  });
  stage.addEventListener('lostpointercapture', () => { drag = undefined; stage.classList.remove('is-dragging'); });
  imageViewer.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Tab') {
      // Keep the first/last control cycle inside the dialog, including disabled zoom limits.
      const controls = [...imageViewer.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
      return;
    }
    if (event.key === '+' || event.key === '=') setZoom(zoom + 0.5);
    else if (event.key === '-') setZoom(zoom - 0.5);
    else if (event.key === '0') { zoom = 1; x = 0; y = 0; render(); }
    else if (zoom > 1 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      x += event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0;
      y += event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0;
      render();
    } else return;
    event.preventDefault();
  });
  window.addEventListener('resize', fit);
  window.addEventListener('beforeprint', () => { if (imageViewer.open) imageViewer.close(); });
}
