/* Content is visible by default; enhance only off-screen content once. */
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  const targets = [...document.querySelectorAll('.document-section > h2, .document-section > .entry, .document-section > .publication, .skills-list > div, .closing-contact')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.target.classList.contains('reveal--pending')) reveal(entry.target);
    }
  }, { rootMargin: '0px 0px -32px 0px' });
  function reveal(element, instant = false) {
    element.classList.remove('reveal--pending');
    element.classList.toggle('reveal', !instant);
    observer.unobserve(element);
  }
  for (const element of targets) {
    if (element.getBoundingClientRect().top >= innerHeight) {
      element.classList.add('reveal--pending');
      observer.observe(element);
    }
  }
  function revealAll() {
    targets.forEach(element => reveal(element, true));
    observer.disconnect();
  }
  motionPreference.addEventListener('change', event => { if (event.matches) revealAll(); });
  window.addEventListener('beforeprint', revealAll);
  document.addEventListener('focusin', event => {
    const pending = event.target.closest('.reveal--pending, .reveal');
    if (pending) reveal(pending, true);
  });
}
