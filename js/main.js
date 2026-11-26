(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Активный раздел в основном и мобильном меню */
  const header = $('#header');
  const sectionLinks = $$('.nav a, .mobile-menu__link');
  const sections = $$('.nav a').map(link => document.getElementById(link.hash.slice(1))).reverse();
  let currentSection;
  let navigationFrame;
  function updateNavigation() {
    navigationFrame = undefined;
    const headerEdge = header.getBoundingClientRect().bottom + 20;
    const current = sections.find(section => section.getBoundingClientRect().top <= headerEdge);
    if (currentSection === current) return;
    currentSection = current;
    sectionLinks.forEach(link => {
      if (link.hash.slice(1) === current?.id) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
  const scheduleNavigation = () => {
    if (navigationFrame === undefined) navigationFrame = requestAnimationFrame(updateNavigation);
  };
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation);
  scheduleNavigation();

  /* Мобильное меню */
  const burger = $('#burger');
  const pageContent = $$('main, .footer');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
    pageContent.forEach(element => { element.inert = open; });
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') === 'false'));
  $$('#mobile-menu a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      burger.focus();
    }
  });
  window.matchMedia('(max-width: 960px)').addEventListener('change', event => {
    if (!event.matches) setMenu(false);
  });

  function animatePanelContent(element) {
    if (reducedMotion.matches || !element.animate) return;
    element.animate(
      [{ opacity: .65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 180, easing: 'ease-out' }
    );
  }

  function bindTabs(tabs, updatePanel, vertical = false) {
    const select = (tab) => {
      if (tab.getAttribute('aria-selected') === 'true') return;
      tabs.forEach(item => {
        item.setAttribute('aria-selected', String(item === tab));
        item.tabIndex = item === tab ? 0 : -1;
      });
      updatePanel(tab);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        const key = event.key;
        let next;
        if (key === 'Home') next = 0;
        if (key === 'End') next = tabs.length - 1;
        if (key === 'ArrowRight' || (vertical && key === 'ArrowDown')) next = (index + 1) % tabs.length;
        if (key === 'ArrowLeft' || (vertical && key === 'ArrowUp')) next = (index - 1 + tabs.length) % tabs.length;
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next]);
        tabs[next].focus();
      });
    });
  }

  const cardImg = $('#heroCardImg');
  const cardTitle = $('#heroCardTitle');
  const cardPanel = $('#heroCardPanel');
  let productImage;
  bindTabs($$('.hero-card__tab'), tab => {
    cardImg.getAnimations().forEach(animation => animation.cancel());
    cardImg.src = tab.dataset.img;
    cardImg.alt = tab.dataset.title;
    cardTitle.textContent = tab.dataset.title;
    cardPanel.setAttribute('aria-labelledby', tab.id);
    const decoded = cardImg.decode();
    productImage = decoded;
    decoded.then(() => {
      if (productImage === decoded) animatePanelContent(cardImg);
    }).catch(() => {});
  });

  const cyclePanels = $$('.cycle__panel');
  bindTabs($$('.cycle__step'), tab => {
    const activePanel = tab.getAttribute('aria-controls');
    cyclePanels.forEach(panel => { panel.hidden = panel.id !== activePanel; });
    const content = $('#' + activePanel).firstElementChild;
    content.getAnimations().forEach(animation => animation.cancel());
    animatePanelContent(content);
  }, true);

  /* Год в подвале */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* Форма заявки */
  const form = $('#leadForm');
  if (form) {
    const status = $('.form__status', form);
    const showErr = (input, msg) => {
      const f = input.closest('.field');
      f.classList.toggle('invalid', !!msg);
      input.setAttribute('aria-invalid', String(!!msg));
      $('.error', f).textContent = msg || '';
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form__status'; status.textContent = '';
      const { name, phone, message, agree } = form.elements;
      agree.setAttribute('aria-invalid', String(!agree.checked));
      let ok = true;
      if (!name.value.trim()) { showErr(name, 'Укажите имя или название компании'); ok = false; } else showErr(name);
      if (phone.value.replace(/\D/g, '').length < 10) { showErr(phone, 'Укажите телефон, например +7 900 000-00-00'); ok = false; } else showErr(phone);
      if (!agree.checked) { status.className = 'form__status err'; status.textContent = 'Нужно согласие на обработку данных'; ok = false; }
      if (!ok) { (form.querySelector('.invalid input') || agree).focus(); return; }

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
        const body = encodeURIComponent(`Имя/компания: ${name.value}\nТелефон: ${phone.value}\n\n${message.value}`);
        status.className = 'form__status err';
        status.innerHTML = `Не удалось отправить. Позвоните <a href="tel:+73513242783">8 351 324-27-83</a> или <a href="mailto:tdk_miass@mail.ru?subject=${encodeURIComponent('Заявка с сайта')}&body=${body}">отправьте письмо</a>.`;
      } finally {
        btn.disabled = false; btn.style.opacity = '';
      }
    });
  }
})();
