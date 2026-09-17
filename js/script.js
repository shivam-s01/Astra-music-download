(() => {
  const nav = document.querySelector('.nav-inner');
  const progress = document.querySelector('.scroll-progress span');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 18);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
    }
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, {passive:true});

  const items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.1, rootMargin:'0px 0px -30px 0px'});
    items.forEach(el => io.observe(el));
  }

  const tiltTarget = document.querySelector('[data-tilt]');
  if (tiltTarget && !reduced && window.matchMedia('(hover:hover)').matches) {
    const phone = tiltTarget.querySelector('.phone');
    tiltTarget.addEventListener('pointermove', event => {
      const r = tiltTarget.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - .5;
      const y = (event.clientY - r.top) / r.height - .5;
      phone.style.transform = `rotateY(${x * 5 - 1}deg) rotateX(${y * -3 + 1}deg) translateY(-4px)`;
    });
    tiltTarget.addEventListener('pointerleave', () => {
      phone.style.transform = '';
    });
  }
})();
