(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav border on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Count-up numbers
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion || target <= 1) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Credential card tilt
  const card = document.getElementById('credCard');
  if (card && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const stage = card.parentElement;
    stage.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      card.style.setProperty('--sheen', `${x * 60}%`);
    });
    stage.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.setProperty('--sheen', '-30%');
    });
  }

  // Contact form
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const setStatus = (msg, cls) => { status.textContent = msg; status.className = 'form-status ' + (cls || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const ok = field.checkValidity();
      field.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) { setStatus('Please fill in the highlighted fields.', 'err'); return; }

    const data = Object.fromEntries(new FormData(form));
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      const body = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        data.organisation ? `Organisation: ${data.organisation}` : null,
        data.phone ? `Phone: ${data.phone}` : null,
        `Area: ${data.service}`,
        '',
        data.message,
      ].filter((line) => line !== null).join('\n');
      const subject = `Consultancy enquiry: ${data.service}`;
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('Opening your mail app…', 'ok');
      return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      setStatus('Thank you. Your message has been sent.', 'ok');
    } catch {
      setStatus('Something went wrong. Please email me directly.', 'err');
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener('input', (e) => e.target.classList.remove('invalid'));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
