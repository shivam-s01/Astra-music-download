(function(){
  'use strict';

  const ASTRA_CONFIG = {
    version: "2.3.2",
    platform: "Android",
    downloadUrl: "https://github.com/shivam-s01/Aurum-app/releases/download/build646/app-arm64-v8a-release.apk",
    fileSize: "32.4 MB",
    downloads: 18000,
    rating: 4.8
  };

  document.getElementById('metaVersion').textContent = 'Version ' + ASTRA_CONFIG.version;
  document.getElementById('metaPlatform').textContent = ASTRA_CONFIG.platform;
  document.getElementById('metaSize').textContent = ASTRA_CONFIG.fileSize;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const navInner = document.getElementById('navInner');
  window.addEventListener('scroll', () => {
    navInner.classList.toggle('scrolled', window.scrollY > 12);
  }, { passive: true });

  const coffeeFabWrap = document.getElementById('coffeeFabWrap');
  const faqSection = document.getElementById('faq');

  if (coffeeFabWrap) {
    let pastFaq = false;

    if (faqSection && 'IntersectionObserver' in window) {
      // Once the FAQ section comes into view, treat the coffee nudge as
      // "shown its moment" and keep it hidden for the rest of the page
      // (footer, download card, etc.) — it shouldn't linger over content.
      const faqIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pastFaq = true;
            coffeeFabWrap.classList.remove('visible');
            faqIo.disconnect();
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -60% 0px' });
      faqIo.observe(faqSection);
    }

    window.addEventListener('scroll', () => {
      if (pastFaq) return;
      // A small scroll (a bit past one screen's worth of nudging, ~180px)
      // is enough to reveal the button and its message together; scrolling
      // back up near the top hides both again.
      coffeeFabWrap.classList.toggle('visible', window.scrollY > 180);
    }, { passive: true });
  }

  const glow = document.getElementById('cursorGlow');
  const deviceFrame = document.getElementById('deviceFrame');
  const canHover = window.matchMedia('(hover: hover)').matches && window.innerWidth > 900;

  if (canHover && !prefersReducedMotion) {
    let rafPending = false, mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      glow.classList.add('active');
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          glow.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
          rafPending = false;
        });
      }
    }, { passive: true });
    window.addEventListener('mouseleave', () => glow.classList.remove('active'));

    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual && deviceFrame) {
      heroVisual.addEventListener('mousemove', (e) => {
        const rect = heroVisual.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        deviceFrame.style.animation = 'none';
        deviceFrame.style.transform = `rotateY(${-6 + px * 10}deg) rotateX(${2 - py * 8}deg)`;
      }, { passive: true });
      heroVisual.addEventListener('mouseleave', () => {
        deviceFrame.style.transform = '';
        deviceFrame.style.animation = '';
      });
    }
  }

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealEls = document.querySelectorAll('.reveal:not(.in)');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // Fail-safe: content must never stay hidden. If any .reveal element
  // hasn't been marked .in within a second (slow device, IO edge case,
  // fast scroll past the trigger point, etc.), force it visible.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
  }, 1000);

  const countEl = document.querySelector('[data-count]');
  if (countEl && !prefersReducedMotion) {
    const target = parseInt(countEl.dataset.count, 10);
    let started = false;
    const startCount = () => {
      if (started) return;
      started = true;
      const duration = 1400, startTime = performance.now();
      function tick(now){
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.floor(eased * target);
        countEl.textContent = val >= 1000 ? (val/1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'K+' : val;
        if (p < 1) requestAnimationFrame(tick);
        else countEl.textContent = (target/1000) + 'K+';
      }
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const statIo = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { startCount(); statIo.disconnect(); } });
      }, { threshold: 0.5 });
      statIo.observe(countEl);
    } else {
      countEl.textContent = (target/1000) + 'K+';
    }
  } else if (countEl) {
    countEl.textContent = (parseInt(countEl.dataset.count,10)/1000) + 'K+';
  }

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const btn = document.getElementById('downloadBtn');
  const statusText = document.getElementById('dlStatusText');

  function resetBtn(){
    btn.classList.remove('is-loading', 'is-success', 'is-error');
    statusText.textContent = '';
  }

  btn.addEventListener('click', async () => {
    if (btn.classList.contains('is-loading')) return;
    resetBtn();

    if (!ASTRA_CONFIG.downloadUrl || ASTRA_CONFIG.downloadUrl === 'YOUR_APK_DOWNLOAD_LINK') {
      btn.classList.add('is-error');
      statusText.textContent = 'No download link has been configured yet.';
      return;
    }

    btn.classList.add('is-loading');
    statusText.textContent = 'Preparing download…';

    try {
      const link = document.createElement('a');
      link.href = ASTRA_CONFIG.downloadUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);

      await new Promise(r => setTimeout(r, 500));
      statusText.textContent = 'Download starting…';

      link.click();
      document.body.removeChild(link);

      await new Promise(r => setTimeout(r, 500));
      btn.classList.remove('is-loading');
      btn.classList.add('is-success');
      statusText.textContent = 'Check your notifications or downloads folder to install.';

      setTimeout(() => { resetBtn(); }, 5000);
    } catch (err) {
      btn.classList.remove('is-loading');
      btn.classList.add('is-error');
      statusText.textContent = 'Something went wrong. Please try again.';
    }
  });

})();
