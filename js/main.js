  lucide.createIcons();
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#orderForm');
  const order = $('#order');

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
      box.insertAdjacentHTML('beforeend', `<div class="mb-4 rounded-xl border border-gray-500 bg-white p-2"><p class="mb-1 font-bold">القطعة ${i}</p><div class="grid grid-cols-2 gap-2"><select name="color${i}" aria-label="لون القطعة ${i}" class="rounded-lg border border-black p-2 font-bold">${opts(COLORS)}</select><select name="size${i}" aria-label="مقاس القطعة ${i}" class="rounded-lg border border-black p-2 font-bold">${opts(SIZES)}</select></div></div>`);
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

  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    for (const k in rules) {
      const ok = rules[k](form[k].value);
      mark(k, ok);
      if (!ok && !first) first = form[k];
    }
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); return; }
    const d = new FormData(form);
    let items = [`${d.get('color')} (${d.get('size')})`];
    for (let i = 2; i <= qty; i++) items.push(`${d.get('color' + i)} (${d.get('size' + i)})`);
    $('#successMsg').textContent = `${d.get('name')} - ${items.join(' + ')} - المجموع ${PRICES[qty]} د.م`;
    form.classList.add('hidden');
    $('#success').classList.remove('hidden');
    order.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
