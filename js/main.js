/* =====================================================
   HLAVNI JS - Svatebni web  (i18n verze)
   Obsah se nacita z config/*.json.
   Jazyk se prepina tlacitky CZ/EN v navigaci.
   ===================================================== */

'use strict';

// --- Stav jazyka & cache ---

let currentLang = localStorage.getItem('wedding_lang') || 'cs';
let _translations = null;
let _countdownInterval = null;
const _jsonCache = {};

// --- Helpers ---

async function loadJSON(path) {
  if (_jsonCache[path]) return _jsonCache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error('Nelze nacist ' + path + ' (' + res.status + ')');
  _jsonCache[path] = await res.json();
  return _jsonCache[path];
}

function el(id) { return document.getElementById(id); }

function loc(obj, key) {
  if (!obj) return '';
  if (currentLang !== 'cs') {
    const enVal = obj[key + '_en'];
    if (enVal !== undefined && enVal !== null) return enVal;
  }
  const v = obj[key];
  return (v !== undefined && v !== null) ? v : '';
}

function t(dotPath) {
  if (!_translations) return dotPath;
  const keys = dotPath.split('.');
  let val = _translations[currentLang] || _translations['cs'];
  for (const k of keys) {
    if (val == null) return dotPath;
    val = val[k];
  }
  return val != null ? val : dotPath;
}

// --- Staticke preklady ---

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(node) {
    node.textContent = t(node.dataset.i18n);
  });
}

// --- Prepnuti jazyka ---

async function switchLang(lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem('wedding_lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('.nav__lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  applyStaticTranslations();
  await renderAll();
}

// --- Navigace ---

function initNav() {
  const nav    = el('nav');
  const toggle = el('navToggle');
  const list   = el('navList');

  const onScroll = function() { nav.classList.toggle('scrolled', window.scrollY > 60); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toggle.addEventListener('click', function() {
    const open = list.classList.toggle('is-open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  list.querySelectorAll('.nav__link').forEach(function(link) {
    link.addEventListener('click', function() {
      list.classList.remove('is-open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav__link').forEach(function(l) { l.classList.remove('active'); });
        const active = document.querySelector('.nav__link[href="#' + entry.target.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(function(s) { io.observe(s); });
}

// --- Animovane listy ---

function initFallingLeaves() {
  const container = el('heroLeaves');
  if (!container) return;
  const emojis = ['\uD83C\uDF42', '\uD83C\uDF41', '\uD83C\uDF43', '\uD83C\uDF3F'];
  for (let i = 0; i < 18; i++) {
    const leaf = document.createElement('span');
    leaf.className = 'leaf';
    leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    leaf.setAttribute('aria-hidden', 'true');
    leaf.style.left              = (Math.random() * 100) + '%';
    leaf.style.fontSize          = (0.9 + Math.random() * 1.4) + 'rem';
    leaf.style.animationDuration = (7 + Math.random() * 10) + 's';
    leaf.style.animationDelay    = '-' + (Math.random() * 12) + 's';
    container.appendChild(leaf);
  }
}

// --- Countdown ---

function initCountdown(isoDate) {
  const target = new Date(isoDate);
  if (isNaN(target)) return;
  const wrap = el('heroCountdown');
  if (!wrap) return;
  if (_countdownInterval) clearInterval(_countdownInterval);

  function update() {
    const diff = target - new Date();
    if (diff <= 0) {
      wrap.innerHTML = '<span style="font-family:var(--font-serif);font-size:1.3rem;opacity:.9">' + t('countdown.dnes') + '</span>';
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    const items = [
      [t('countdown.dni'),    days],
      [t('countdown.hodin'),  hours],
      [t('countdown.minut'),  mins],
      [t('countdown.sekund'), secs],
    ];
    wrap.innerHTML = items.map(function(item) {
      return '<div class="countdown-item"><span class="countdown-item__num">' +
        String(item[1]).padStart(2, '0') +
        '</span><span class="countdown-item__label">' + item[0] + '</span></div>';
    }).join('');
  }

  update();
  _countdownInterval = setInterval(update, 1000);
}

// --- Reveal on scroll ---

function initReveal() {
  const io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function() { entry.target.classList.add('is-visible'); }, i * 70);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  window._revealObserver = io;
}

function observeReveal() {
  document.querySelectorAll('.info-card, .program-item, .uzitecne-card, .map-card, .food-item, .form').forEach(function(node) {
    node.classList.add('reveal');
    window._revealObserver.observe(node);
  });
}

// --- Sekce INFORMACE ---

async function loadInformace() {
  const cfg = await loadJSON('config/informace.json');

  if (cfg.par) {
    const title = cfg.par.zenich1 + ' & ' + cfg.par.zenich2;
    el('heroTitle').textContent   = title;
    el('navLogo').textContent     = cfg.par.zenich1[0] + ' & ' + cfg.par.zenich2[0];
    el('footerNames').textContent = title;
    document.title = t('title_prefix') + ' - ' + title;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', t('title_prefix') + ' - ' + title);
  }

  if (cfg.datum && cfg.datum.hodnota) el('heroDate').textContent = cfg.datum.hodnota;
  if (cfg.datum && cfg.datum.iso)     initCountdown(cfg.datum.iso);

  el('infoTitle').textContent    = loc(cfg, 'nadpis');
  el('infoSubtitle').textContent = loc(cfg, 'podnadpis');

  const cardDefs = [
    { icon: '\uD83D\uDCC5', label: loc(cfg.datum,        'popisek'), value: cfg.datum        && cfg.datum.hodnota },
    { icon: '\uD83D\uDD50', label: loc(cfg.cas_obradu,   'popisek'), value: cfg.cas_obradu   && cfg.cas_obradu.hodnota },
    { icon: '\uD83D\uDC92', label: loc(cfg.misto_obradu, 'popisek'), value: cfg.misto_obradu && cfg.misto_obradu.nazev, sub: cfg.misto_obradu && cfg.misto_obradu.adresa },
    { icon: '\uD83E\uDD42', label: loc(cfg.misto_party,  'popisek'), value: cfg.misto_party  && cfg.misto_party.nazev,  sub: cfg.misto_party  && cfg.misto_party.adresa },
  ].filter(function(c) { return c.value; });

  el('infoGrid').innerHTML = cardDefs.map(function(c) {
    return '<div class="info-card" role="listitem">' +
      '<div class="info-card__label">' + (c.label || '') + '</div>' +
      '<div class="info-card__value">' + c.value + '</div>' +
      (c.sub ? '<div class="info-card__sub">' + c.sub + '</div>' : '') +
      '</div>';
  }).join('');

  if (cfg.program && cfg.program.length) {
    el('programContainer').innerHTML =
      '<div class="autumn-divider" aria-hidden="true">\uD83C\uDF42 ' + t('sekce.program') + ' \uD83C\uDF42</div>' +
      '<div class="program-block"><ul class="program-list">' +
      cfg.program.map(function(p) {
        return '<li class="program-item">' +
          '<span class="program-item__time">' + p.cas + '</span>' +
          '<span class="program-item__dot" aria-hidden="true"></span>' +
          '<span class="program-item__text">' + loc(p, 'popis') + '</span>' +
          '</li>';
      }).join('') +
      '</ul></div>';
  } else {
    el('programContainer').innerHTML = '';
  }

  const mapItems = [];
  if (cfg.misto_obradu && cfg.misto_obradu.nazev) mapItems.push(Object.assign({}, cfg.misto_obradu));
  if (cfg.misto_party  && cfg.misto_party.nazev)  mapItems.push(Object.assign({}, cfg.misto_party));

  if (mapItems.length) {
    el('mapsContainer').innerHTML =
      '<div class="autumn-divider" aria-hidden="true"><span class="divider-leaf">\uD83C\uDF41</span> ' + t('sekce.mapy') + ' <span class="divider-leaf">\uD83C\uDF41</span></div>' +
      '<div class="maps-grid">' +
      mapItems.map(function(m) {
        return '<div class="map-card">' +
          '<div class="map-card__header">' +
          '<div class="map-card__name">' + m.nazev + '</div>' +
          (m.adresa ? '<div class="map-card__address">' + m.adresa + '</div>' : '') +
          '</div>' +
          '<div class="map-card__body">' +
          (m.obrazek ? '<img src="' + m.obrazek + '" alt="' + m.nazev + '" class="map-card__photo" loading="lazy">' : '') +
          (m.google_maps_embed
            ? '<iframe src="' + m.google_maps_embed + '" title="' + m.nazev + '" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>'
            : '<div class="map-placeholder"><span class="map-placeholder__icon">\uD83D\uDCCD</span><span>' + t('sekce.mapa_placeholder') + '</span></div>') +
          '</div></div>';
      }).join('') +
      '</div>';
  } else {
    el('mapsContainer').innerHTML = '';
  }
}

// --- Sekce UZITECNE INFORMACE ---

async function loadUzitecne() {
  const cfg = await loadJSON('config/uzitecne-informace.json');
  el('uzitecneTitle').textContent = loc(cfg, 'nadpis');

  el('uzitecneGrid').innerHTML = (cfg.sekce || []).map(function(s) {
    return '<div class="uzitecne-card">' +
      '<span class="uzitecne-card__icon" aria-hidden="true">' + (s.ikona || '') + '</span>' +
      '<div>' +
      '<div class="uzitecne-card__title">' + loc(s, 'titulek') + '</div>' +
      '<div class="uzitecne-card__text">'  + loc(s, 'text')    + '</div>' +
      (s.odkaz ? '<a href="' + s.odkaz.url + '" class="uzitecne-card__link" target="_blank" rel="noopener noreferrer">' + loc(s.odkaz, 'text') + ' \u2197</a>' : '') +
      '</div></div>';
  }).join('');
}

// --- Sekce PŘÍBĚH ---

async function loadPribeh() {
  const cfg = await loadJSON('config/pribeh.json');

  el('pribehTitle').textContent    = loc(cfg, 'nadpis');
  el('pribehSubtitle').textContent = loc(cfg, 'podnadpis');

  el('pribehKapitoly').innerHTML = (cfg.kapitoly || []).map(function(k, i) {
    const vlevo = k.obrazek_pozice === 'vlevo';
    return '<div class="story-chapter ' + (vlevo ? 'story-chapter--img-left' : 'story-chapter--img-right') + ' reveal">' +
      (k.obrazek
        ? '<div class="story-chapter__img-wrap"><img src="' + k.obrazek + '" alt="' + loc(k, 'titulek') + '" class="story-chapter__img" loading="lazy"></div>'
        : '') +
      '<div class="story-chapter__body">' +
      (loc(k, 'titulek') ? '<h3 class="story-chapter__title">' + loc(k, 'titulek') + '</h3>' : '') +
      '<p class="story-chapter__text">' + loc(k, 'text') + '</p>' +
      '</div>' +
      '</div>';
  }).join('');
}

// --- Sekce FORMULAR ---

let _formConfig = null;

async function loadFormular() {
  const cfg = await loadJSON('config/formular.json');
  _formConfig = cfg;

  el('formTitle').textContent     = loc(cfg, 'nadpis');
  el('formSubtitle').textContent  = loc(cfg, 'podnadpis');
  el('formSubmitBtn').textContent = loc(cfg, 'tlacitko');

  let html = '';

  if (cfg.pole && cfg.pole.jmeno) {
    const f = cfg.pole.jmeno;
    html += '<div class="form__group">' +
      '<label class="form__label" for="f-jmeno">' + loc(f, 'popisek') + ' <span class="required" aria-label="povinn\u00e9">*</span></label>' +
      '<input type="text" id="f-jmeno" name="jmeno" class="form__input" placeholder="' + (loc(f, 'placeholder') || '') + '" autocomplete="name" required>' +
      '<div class="form__error" id="err-jmeno" role="alert">' + t('form.err_jmeno') + '</div>' +
      '</div>';
  }

  if (cfg.pole && cfg.pole.ucast) {
    const f = cfg.pole.ucast;
    html += '<div class="form__group"><fieldset style="border:none;padding:0">' +
      '<legend class="form__label">' + loc(f, 'popisek') + ' <span class="required" aria-label="povinn\u00e9">*</span></legend>' +
      '<div class="radio-group" id="radioUcast">' +
      (f.moznosti || []).map(function(m) {
        return '<label class="radio-option"><input type="radio" name="ucast" value="' + m.hodnota + '" required>' +
          '<span class="radio-option__text">' + loc(m, 'text') + '</span></label>';
      }).join('') +
      '</div>' +
      '<div class="form__error" id="err-ucast" role="alert">' + t('form.err_ucast') + '</div>' +
      '</fieldset></div>';
  }

  if (cfg.pole && cfg.pole.jidlo) {
    const f = cfg.pole.jidlo;
    html += '<div class="form__group" id="grp-jidlo">' +
      '<div class="form__label">' + loc(f, 'popisek') + '</div>' +
      (loc(f, 'podnadpis') ? '<p class="food-sub">' + loc(f, 'podnadpis') + '</p>' : '') +
      '<div class="food-items">' +
      (f.moznosti || []).map(function(m) {
        return '<div class="food-item" id="fi-' + m.id + '">' +
          '<div class="food-item__info">' +
          '<div class="food-item__name">' + loc(m, 'nazev') + '</div>' +
          (loc(m, 'popis') ? '<div class="food-item__desc">' + loc(m, 'popis') + '</div>' : '') +
          '</div>' +
          '<div class="food-item__portions">' +
          '<div class="food-item__portion-row">' +
          '<span class="food-item__portion-label">' + t('form.dospeli') + '</span>' +
          '<div class="food-item__counter">' +
          '<button type="button" class="food-item__btn" data-id="' + m.id + '" data-delta="-1" aria-label="-">\u2212</button>' +
          '<input type="number" class="food-item__count" id="fc-' + m.id + '" value="0" min="0" max="20" readonly data-type="adult">' +
          '<button type="button" class="food-item__btn" data-id="' + m.id + '" data-delta="1" aria-label="+">+</button>' +
          '</div></div>' +
          '<div class="food-item__portion-row">' +
          '<span class="food-item__portion-label">' + t('form.deti') + '</span>' +
          '<div class="food-item__counter">' +
          '<button type="button" class="food-item__btn" data-id="' + m.id + '__deti" data-delta="-1" aria-label="-">\u2212</button>' +
          '<input type="number" class="food-item__count" id="fc-' + m.id + '__deti" value="0" min="0" max="20" readonly data-type="child">' +
          '<button type="button" class="food-item__btn" data-id="' + m.id + '__deti" data-delta="1" aria-label="+">+</button>' +
          '</div></div>' +
          '</div></div>';
      }).join('') +
      '</div></div>';
  }

  el('formFields').innerHTML = html;
}

// --- Validace a odeslani formulare ---

function initFormSubmit() {
  const form = el('rsvpForm');
  if (!form) return;

  // Aktualizuj text tlačítka (při přepnutí jazyka)
  const submitBtn = el('formSubmitBtn');
  if (submitBtn) submitBtn.textContent = loc(_formConfig, 'tlacitko');

  // Listenery přidej pouze jednou – form element zůstává vždy stejný
  if (form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  // --- +/- tlačítka jídel (delegace) ---
  form.addEventListener('click', function(e) {
    const btn = e.target.closest('.food-item__btn');
    if (!btn) return;
    const inp  = el('fc-' + btn.dataset.id);
    if (!inp) return;
    const next = Math.max(0, Math.min(20, parseInt(inp.value || 0) + parseInt(btn.dataset.delta, 10)));
    inp.value  = next;
    const item = btn.closest('.food-item');
    if (item) {
      const anySelected = Array.from(item.querySelectorAll('.food-item__count')).some(function(i) { return parseInt(i.value) > 0; });
      item.classList.toggle('is-selected', anySelected);
    }
  });

  // --- Radio: účast (delegace) ---
  form.addEventListener('change', function(e) {
    if (!e.target.matches('input[name="ucast"]')) return;
    form.querySelectorAll('#radioUcast .radio-option').forEach(function(o) { o.classList.remove('is-selected'); });
    e.target.closest('.radio-option').classList.add('is-selected');
    const grpJidlo = el('grp-jidlo');
    if (grpJidlo) grpJidlo.style.display = e.target.value === 'neprijdu' ? 'none' : '';
  });

  // --- Odeslání ---
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    let valid = true;

    const jmenoEl  = el('f-jmeno');
    const errJmeno = el('err-jmeno');
    if (jmenoEl && !jmenoEl.value.trim()) {
      jmenoEl.classList.add('is-invalid');
      if (errJmeno) errJmeno.classList.add('visible');
      valid = false;
    } else {
      if (jmenoEl) jmenoEl.classList.remove('is-invalid');
      if (errJmeno) errJmeno.classList.remove('visible');
    }

    const ucastEl  = form.querySelector('input[name="ucast"]:checked');
    const errUcast = el('err-ucast');
    if (!ucastEl) {
      if (errUcast) errUcast.classList.add('visible');
      valid = false;
    } else {
      if (errUcast) errUcast.classList.remove('visible');
    }

    if (!valid) {
      const first = form.querySelector('.is-invalid, .form__error.visible');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const data = {
      jmeno:        jmenoEl ? jmenoEl.value.trim() : '',
      ucast:        ucastEl ? ucastEl.value        : '',
      jidla:        {},
      cas_odeslani: new Date().toLocaleString('cs-CZ'),
    };

    form.querySelectorAll('.food-item').forEach(function(item) {
      const nameEl = item.querySelector('.food-item__name');
      const nazev  = nameEl ? nameEl.textContent.trim() : '?';
      item.querySelectorAll('.food-item__count').forEach(function(inp) {
        const count = parseInt(inp.value, 10);
        if (count > 0) {
          const suffix = inp.dataset.type === 'child'
            ? (currentLang === 'cs' ? ' (děti)' : ' (children)')
            : (currentLang === 'cs' ? ' (dospělí)' : ' (adults)');
          data.jidla[nazev + suffix] = count;
        }
      });
    });

    const btn = el('formSubmitBtn');
    btn.disabled    = true;
    btn.textContent = t('form.sending');

    try {
      await submitFormData(data);
      form.hidden = true;
      const successEl = el('formSuccess');
      successEl.hidden = false;
      successEl.innerHTML =
        '<div class="form__success-icon" aria-hidden="true">\uD83C\uDF89</div>' +
        '<div class="form__success-title">' + t('form.dekujeme') + '</div>' +
        '<p class="form__success-text">' + loc(_formConfig, 'zprava_uspech') + '</p>';
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error(err);
      btn.disabled    = false;
      btn.textContent = loc(_formConfig, 'tlacitko');
      alert(t('form.err_send'));
    }
  });
}

async function submitFormData(data) {
  const endpoint = (_formConfig && _formConfig.submit_endpoint) || '';
  const typ      = (_formConfig && _formConfig.submit_typ)      || 'demo';

  if (!endpoint || typ === 'demo') {
    console.log('Demo mod - data:', data);
    await new Promise(function(r) { setTimeout(r, 600); });
    return;
  }
  if (typ === 'google_sheets') {
    await new Promise(function(resolve, reject) {
      const iframeName = 'gs_submit_' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name  = iframeName;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = endpoint;
      tempForm.target = iframeName;

      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = 'data';
      input.value = JSON.stringify(data);
      tempForm.appendChild(input);
      document.body.appendChild(tempForm);

      iframe.onload = function() {
        document.body.removeChild(iframe);
        document.body.removeChild(tempForm);
        resolve();
      };
      setTimeout(function() {
        document.body.removeChild(iframe);
        document.body.removeChild(tempForm);
        resolve(); // timeout = stejně považujeme za úspěch
      }, 5000);

      tempForm.submit();
    });
    return;
  }
  if (typ === 'formspree') {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Formspree: ' + res.status);
    return;
  }
  throw new Error('Neznamy submit_typ: ' + typ);
}

// --- Paticka ---

function initFooter() {
  const yearEl = el('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// --- Render vsech dynamickych sekci ---

async function renderAll() {
  try {
    await Promise.all([loadInformace(), loadUzitecne(), loadPribeh(), loadFormular()]);
  } catch (err) {
    console.error('Chyba pri nacitani konfigurace:', err);
    console.warn('Otevírejte přes HTTP server (ne file://). Viz README.md.');
  }
  initFormSubmit();
  observeReveal();
}

// --- Spusteni ---

document.addEventListener('DOMContentLoaded', async function() {
  initNav();
  initFallingLeaves();
  initReveal();
  initFooter();

  try {
    _translations = await loadJSON('config/translations.json');
  } catch (err) {
    console.error('Nelze nacist translations.json:', err);
  }

  document.querySelectorAll('.nav__lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', function() { switchLang(btn.dataset.lang); });
  });
  document.documentElement.lang = currentLang;
  applyStaticTranslations();

  await renderAll();
});