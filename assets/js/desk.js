/* Native dialogs retain keyboard focus and Escape; links work without JavaScript. */
(() => {
  const links = document.querySelectorAll('a[data-desk-dialog]');
  let trigger;
  const dialogs = new Set();
  for (const link of links) {
    const dialog = document.getElementById(link.dataset.deskDialog);
    if (!dialog || typeof dialog.showModal !== 'function') continue;
    dialogs.add(dialog);
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      for (const other of dialogs) if (other.open) other.close();
      trigger = link;
      dialog.showModal();
      document.documentElement.classList.add('desk-dialog-open');
    });
  }
  for (const dialog of dialogs) {
    const paper = dialog.querySelector('.desk-dialog-paper');
    const outside = event => {
      const rect = paper.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    let startedOutside = false;
    dialog.querySelector('.desk-dialog-close').addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('.desk-dialog-actions a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) dialog.close();
      });
    });
    dialog.addEventListener('pointerdown', event => { startedOutside = outside(event); });
    dialog.addEventListener('click', event => {
      if (startedOutside && outside(event)) dialog.close();
      startedOutside = false;
    });
    dialog.addEventListener('close', () => {
      if ([...dialogs].some(item => item.open)) return;
      document.documentElement.classList.remove('desk-dialog-open');
      if (trigger?.isConnected) trigger.focus({preventScroll: true});
    });
  }
})();
