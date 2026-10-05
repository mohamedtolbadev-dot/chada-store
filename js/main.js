  lucide.createIcons();
  const $ = (s, r = document) => r.querySelector(s);
  // ---------- voice reviews (WhatsApp style) ----------
  const fmtTime = s => Number.isFinite(s) && s >= 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  const LEVELS = [0.35,0.56,0.78,0.48,0.67,0.9,0.45,0.3,0.62,0.82,0.52,0.72,0.38,0.94,0.58,0.42,0.76,0.5,0.88,0.34,0.64,0.98,0.46,0.7,0.54,0.84,0.32,0.6,0.92,0.44,0.74,0.5,0.86,0.38,0.66,0.96,0.48,0.72,0.4,0.82];
  const SPEEDS = [1, 1.5, 2];
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>';
  const ICON_USER = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>';
  const voiceAudios = [];

  document.querySelectorAll('.vm').forEach((el, idx) => {
    const n = el.dataset.n || idx + 1, src = el.dataset.src, name = `تجربة زبونة ${n}`;
    el.innerHTML = `
      <div class="vm-side">
        <span class="vm-avatar" aria-hidden="true">${ICON_USER}</span>
        <button type="button" class="vm-speed" aria-label="سرعة التشغيل">1x</button>
      </div>
      <button type="button" class="vm-play" aria-label="تشغيل ${name}">${ICON_PLAY}</button>
      <div class="vm-body">
        <div class="vm-wave" role="slider" tabindex="0" aria-label="التقديم أو الرجوع في ${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0:00">
          ${LEVELS.map(l => `<i style="height:${Math.round(l * 100)}%"></i>`).join('')}
          <b class="vm-thumb" aria-hidden="true"></b>
        </div>
        <div class="vm-meta"><span class="vm-time">0:00</span><span class="vm-name">${name}</span></div>
      </div>
      <audio preload="metadata">
        <source src="${src}.m4a" type="audio/mp4">
        <source src="${src}.ogg" type="audio/ogg">
      </audio>`;

    const audio = $('audio', el), play = $('.vm-play', el), wave = $('.vm-wave', el);
    const bars = [...wave.querySelectorAll('i')], time = $('.vm-time', el), speed = $('.vm-speed', el);
    let si = 0, dragging = false;

    const showTime = () => { time.textContent = fmtTime(audio.currentTime > 0.05 ? audio.currentTime : audio.duration); };
    const setProgress = f => {
      const on = Math.round(f * bars.length);
      bars.forEach((b, i) => b.classList.toggle('on', i < on));
      el.style.setProperty('--p', (f * 100).toFixed(1));
      wave.setAttribute('aria-valuenow', Math.round(f * 100));
      wave.setAttribute('aria-valuetext', `${fmtTime(audio.currentTime)} من ${fmtTime(audio.duration)}`);
    };
    const fracFrom = e => {
      const r = wave.getBoundingClientRect();
      const rtl = getComputedStyle(wave).direction === 'rtl';
      return Math.min(1, Math.max(0, (rtl ? r.right - e.clientX : e.clientX - r.left) / r.width));
    };
    const seekTo = f => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      audio.currentTime = f * audio.duration;
      setProgress(f); showTime();
    };
    const fail = () => {
      el.classList.add('is-error');
      play.disabled = true; speed.disabled = true;
      time.textContent = 'غير متوفر';
    };

    audio.addEventListener('loadedmetadata', showTime);
    audio.addEventListener('durationchange', showTime);
    audio.addEventListener('timeupdate', () => {
      if (!dragging && audio.duration > 0) setProgress(audio.currentTime / audio.duration);
      showTime();
    });
    audio.addEventListener('play', () => {
      voiceAudios.forEach(a => { if (a !== audio) a.pause(); });
      el.classList.add('is-playing');
      play.innerHTML = ICON_PAUSE;
      play.setAttribute('aria-label', `إيقاف مؤقت لـ ${name}`);
    });
    audio.addEventListener('pause', () => {
      el.classList.remove('is-playing');
      play.innerHTML = ICON_PLAY;
      play.setAttribute('aria-label', `تشغيل ${name}`);
    });
    audio.addEventListener('ended', () => { audio.currentTime = 0; setProgress(0); showTime(); });
    audio.addEventListener('error', fail);
    audio.lastElementChild.addEventListener('error', fail); // last <source> failed = no format works

    play.addEventListener('click', () => {
      if (!audio.paused) { audio.pause(); return; }
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
    });
    speed.addEventListener('click', () => {
      si = (si + 1) % SPEEDS.length;
      audio.playbackRate = SPEEDS[si];
      speed.textContent = SPEEDS[si] + 'x';
    });

    // tap or drag on the waveform to seek
    wave.addEventListener('pointerdown', e => { dragging = true; wave.setPointerCapture(e.pointerId); seekTo(fracFrom(e)); });
    wave.addEventListener('pointermove', e => { if (dragging) seekTo(fracFrom(e)); });
    wave.addEventListener('pointerup', () => { dragging = false; });
    wave.addEventListener('pointercancel', () => { dragging = false; });
    wave.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const rtl = getComputedStyle(wave).direction === 'rtl';
      const back = (e.key === 'ArrowRight') === rtl;
      audio.currentTime = Math.max(0, audio.currentTime + (back ? -5 : 5));
      e.preventDefault();
    });

    voiceAudios.push(audio);
  });

  const form = $('#orderForm');
  const order = $('#order');
  const submitButton = $('#submitOrder');
  const submitStatus = $('#submitStatus');
  const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwS5EhTeGir5XZ13szsFq48G_nJ99VkTg9w5vpN_lfjSx1aZOFF1GXWS7ufr5S2x1pVfA/exec';
  let isSubmitting = false;

  // all CTAs scroll to the order form
  document.querySelectorAll('a.cta').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); order.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  // hide sticky CTA while the form is on screen
  new IntersectionObserver(([en]) => $('#sticky').classList.toggle('hide', en.isIntersecting), { threshold: .05 }).observe(order);

  // quantity + offers (1 = 249, 2 = 479, 3 = 689)
  const PRICES = { 1: 249, 2: 479, 3: 689 };
  const COLORS = ['الأحمر','الأخضر','الأسود','الأبيض','الأزرق الغامق','البني'];
  const SIZES = ['S','M','L','XL','XXL','XXXL'];
  const opts = a => a.map(v => `<option>${v}</option>`).join('');
  let qty = 1;
  const setQty = n => {
    qty = Math.min(3, Math.max(1, n));
    $('#qty').textContent = qty;
    $('#total').textContent = PRICES[qty] + ' د.م';
    document.querySelectorAll('.offer').forEach(b => b.classList.toggle('on', +b.dataset.q === qty));
    const box = $('#extras');
    while (box.children.length < qty - 1) {
      const i = box.children.length + 2;
      box.insertAdjacentHTML('beforeend', `<div class="mb-4 rounded-xl border border-brand-mid bg-white p-2"><p class="mb-1 font-bold">القطعة ${i}</p><div class="grid grid-cols-2 gap-2"><select name="color${i}" aria-label="لون القطعة ${i}" class="rounded-lg border border-brand-dark p-2 font-bold">${opts(COLORS)}</select><select name="size${i}" aria-label="مقاس القطعة ${i}" class="rounded-lg border border-brand-dark p-2 font-bold">${opts(SIZES)}</select></div></div>`);
      box.lastElementChild.querySelector('[name^=size]').value = 'XL';
    }
    while (box.children.length > qty - 1) box.lastElementChild.remove();
  };
  $('#plus').onclick = () => setQty(qty + 1);
  $('#minus').onclick = () => setQty(qty - 1);
  document.querySelectorAll('.offer').forEach(b => b.onclick = () => setQty(+b.dataset.q));
  setQty(1);

  // color / size labels
  form.addEventListener('change', e => {
    if (e.target.name === 'color') $('#colorName').textContent = e.target.value;
    if (e.target.name === 'size') $('#sizeName').textContent = e.target.value;
  });

  // validation
  const rules = {
    name: v => v.trim().split(/\s+/).filter(Boolean).length >= 2 || v.trim().length >= 4,
    phone: v => /^0[567]\d{8}$/.test(v.replace(/\s/g, '')),
    city: v => !!v,
    address: v => v.trim().length >= 6
  };
  const mark = (k, ok) => $('#' + k).closest('.fld').classList.toggle('err', !ok);
  Object.keys(rules).forEach(k => $('#' + k).addEventListener('input', e => mark(k, rules[k](e.target.value))));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (isSubmitting) return;

    let first = null;
    for (const k in rules) {
      const ok = rules[k](form[k].value);
      mark(k, ok);
      if (!ok && !first) first = form[k];
    }
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); return; }

    const d = new FormData(form);
    let items = [`${d.get('color')} (${d.get('size')})`];
    const additionalPieces = [];
    for (let i = 2; i <= qty; i++) {
      const piece = `${d.get('color' + i)} (${d.get('size' + i)})`;
      items.push(piece);
      additionalPieces.push(`القطعة ${i}: ${piece}`);
    }

    const orderData = {
      name: String(d.get('name')).trim(),
      phone: String(d.get('phone')).replace(/\s/g, ''),
      city: String(d.get('city')).trim(),
      address: String(d.get('address')).trim(),
      color: String(d.get('color')),
      size: String(d.get('size')),
      quantity: qty,
      additionalPieces: additionalPieces.join(' | ')
    };

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitStatus.classList.remove('hidden', 'text-red-700');
    submitStatus.classList.add('text-brand-dark');
    submitStatus.textContent = 'جاري إرسال الطلب...';

    try {
      await fetch(SHEETS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(orderData)
      });
    } catch (error) {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitStatus.classList.remove('text-brand-dark');
      submitStatus.classList.add('text-red-700');
      submitStatus.textContent = 'تعذر إرسال الطلب. تحقق من اتصال الإنترنت، وراجع الشيت قبل إعادة المحاولة.';
      console.error('Order submission failed:', error);
      return;
    }

    submitStatus.textContent = 'تم إرسال الطلب. راجع الشيت للتأكد من تسجيله.';
    $('#successMsg').textContent = `${d.get('name')} - ${items.join(' + ')} - المجموع ${PRICES[qty]} د.م`;
    form.classList.add('hidden');
    $('#success').classList.remove('hidden');
    order.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });