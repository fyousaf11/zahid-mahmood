(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Duplicate ticker content so the marquee loops seamlessly
  const track = document.querySelector('.ticker-track');
  track.innerHTML += track.innerHTML;

  // Branch dot matrix
  const dots = document.getElementById('dots');
  const BRANCHES = 224;
  dots.innerHTML = '<i></i>'.repeat(BRANCHES);
  const lightDots = () => {
    const cells = [...dots.children];
    if (reduceMotion) { cells.forEach((c) => c.classList.add('on')); return; }
    const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((idx, n) => setTimeout(() => cells[idx].classList.add('on'), 300 + n * 6));
  };

  // Count-up numbers
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion || target <= 1) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
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
      if (entry.target.contains(dots)) lightDots();
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Chart tooltips
  const tip = document.getElementById('tip');
  document.querySelectorAll('[data-tip]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      tip.textContent = el.dataset.tip;
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${e.clientY}px`;
      tip.classList.add('show');
    });
    el.addEventListener('mouseleave', () => tip.classList.remove('show'));
  });

  // Module spotlight follows the cursor
  document.querySelectorAll('.module').forEach((m) => {
    m.addEventListener('mousemove', (e) => {
      const r = m.getBoundingClientRect();
      m.style.setProperty('--mx', `${e.clientX - r.left}px`);
      m.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // Credential card tilt
  const card = document.getElementById('holoCard');
  if (card && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const stage = card.parentElement;
    stage.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
    });
    stage.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }

  // Contact form
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const setStatus = (msg, cls) => { status.textContent = msg; status.className = 'form-status mono ' + (cls || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const ok = field.checkValidity();
      field.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) { setStatus('Please complete the highlighted fields.', 'err'); return; }

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
    setStatus('Transmitting…');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      setStatus('✓ Request received. I will be in touch shortly.', 'ok');
    } catch {
      setStatus('Something went wrong. Please email me directly.', 'err');
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener('input', (e) => e.target.classList.remove('invalid'));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
