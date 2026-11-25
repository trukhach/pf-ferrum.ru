(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Шапка: фон при прокрутке */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Мобильное меню */
  const burger = $('#burger');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* Карточка в первом экране */
  const cardImg = $('#heroCardImg'), cardTitle = $('#heroCardTitle');
  $$('.hero-card__tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.hero-card__tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    cardImg.style.opacity = 0;
    setTimeout(() => {
      cardImg.src = tab.dataset.img;
      cardImg.alt = tab.dataset.title;
      cardTitle.textContent = tab.dataset.title;
      cardImg.onload = () => { cardImg.style.opacity = 1; };
    }, 180);
  }));

  /* Этапы производства: вкладки с клавиатурой */
  const tabs = $$('.cycle__step');
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const k = e.key;
      if (['ArrowRight', 'ArrowDown'].includes(k)) { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
      if (['ArrowLeft', 'ArrowUp'].includes(k)) { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
  });

  /* Появление блоков */
  const io = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 60 + 'ms';
    io ? io.observe(el) : el.classList.add('is-in');
  });

  /* Год в подвале */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* Форма заявки */
  const form = $('#leadForm');
  if (form) {
    const status = $('.form__status', form);
    const showErr = (input, msg) => {
      const f = input.closest('.field');
      f.classList.toggle('invalid', !!msg);
      $('.error', f).textContent = msg || '';
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form__status'; status.textContent = '';
      const name = form.name, phone = form.phone, agree = form.agree;
      let ok = true;
      if (!name.value.trim()) { showErr(name, 'Укажите имя или название компании'); ok = false; } else showErr(name);
      if (phone.value.replace(/\D/g, '').length < 10) { showErr(phone, 'Укажите телефон, например +7 900 000-00-00'); ok = false; } else showErr(phone);
      if (!agree.checked) { status.className = 'form__status err'; status.textContent = 'Нужно согласие на обработку данных'; ok = false; }
      if (!ok) { form.querySelector('.invalid input')?.focus(); return; }

      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.style.opacity = .6;
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error();
        form.reset();
        status.className = 'form__status ok';
        status.textContent = 'Заявка отправлена. Мы перезвоним в рабочее время.';
        if (window.ym) { try { ym(108733561, 'reachGoal', 'lead'); } catch (_) {} }
      } catch {
        const body = encodeURIComponent(`Имя/компания: ${name.value}\nТелефон: ${phone.value}\n\n${form.message.value}`);
        status.className = 'form__status err';
        status.innerHTML = `Не удалось отправить. Позвоните <a href="tel:+73513242783">8 351 324-27-83</a> или <a href="mailto:tdk_miass@mail.ru?subject=${encodeURIComponent('Заявка с сайта')}&body=${body}">отправьте письмо</a>.`;
      } finally {
        btn.disabled = false; btn.style.opacity = '';
      }
    });
  }
})();
