/* Unitec, site v2. Sem biblioteca. Todo movimento segue a rolagem, 1 para 1; nada anda sozinho.
   Com "reduzir movimento" (ou sem JS) a página fica parada e completa. */
(() => {
  const doc = document.documentElement;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const estreito = () => matchMedia('(max-width: 999px), (max-aspect-ratio: 1/1) and (max-width: 1400px)').matches;
  const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------------- Cabeçalho, barra de ação, menu ---------------- */
  const topo = $('[data-topo]');
  const barra = $('[data-barra-acao]');
  const hero = $('[data-hero]');
  function estadoTopo() {
    const y = scrollY;
    topo && topo.classList.toggle('rolou', y > 24);
    const limite = hero ? hero.offsetHeight * 0.7 : 280;
    barra && barra.classList.toggle('visivel', y > limite);
  }

  const menu = $('[data-menu]');
  const abrir = $('[data-menu-abrir]');
  function fecharMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; document.body.style.overflow = '';
    abrir && abrir.setAttribute('aria-expanded', 'false'); abrir && abrir.focus();
  }
  abrir && abrir.addEventListener('click', () => {
    menu.hidden = false; document.body.style.overflow = 'hidden';
    abrir.setAttribute('aria-expanded', 'true');
    const primeiro = $('a', menu); primeiro && primeiro.focus();
  });
  $('[data-menu-fechar]') && $('[data-menu-fechar]').addEventListener('click', fecharMenu);
  menu && $$('a', menu).forEach((a) => a.addEventListener('click', fecharMenu));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });

  /* ---------------- Herói vivo: a cena se mexe, as chamadas acompanham ---------------- */
  const cena = $('[data-hero-cena]');
  const etiquetasHero = $$('[data-etiqueta]');
  const linhasHero = $('[data-hero-linhas]');
  const ns = 'http://www.w3.org/2000/svg';
  const caminhos = etiquetasHero.map(() => {
    const p = document.createElementNS(ns, 'path');
    linhasHero && linhasHero.appendChild(p);
    return p;
  });
  $$('[data-chamada]').forEach((c, i) => c.querySelector('.no').style.setProperty('--i', i));
  etiquetasHero.forEach((et, i) => et.style.setProperty('--i', i));

  function posicionaEtiquetas() {
    if (!hero || !etiquetasHero.length || !linhasHero) return;
    if (estreito()) return;
    const hr = hero.getBoundingClientRect();
    const topoMin = (topo ? topo.offsetHeight : 76) + 76;
    const faixa = $('.dados-dia', hero);
    const pausaBt = $('[data-hero-pausa]', hero);
    const fundo = (faixa ? faixa.getBoundingClientRect().top - hr.top : hr.height) - (pausaBt ? 165 : 60);
    const itens = etiquetasHero.map((et, i) => {
      const no = $(`[data-chamada="${et.dataset.etiqueta}"] .no`, hero).getBoundingClientRect();
      return { et, i, x: no.left + no.width / 2 - hr.left, y: no.top + no.height / 2 - hr.top, h: et.offsetHeight };
    }).sort((a, b) => a.y - b.y);
    let fim = topoMin - 12;
    itens.forEach((it) => { it.t = Math.max(it.y - it.h / 2, fim + 12); fim = it.t + it.h; });
    let inicio = fundo + 12;
    for (let k = itens.length - 1; k >= 0; k--) { const it = itens[k]; it.t = Math.min(it.t, inicio - 12 - it.h); inicio = it.t; }
    linhasHero.setAttribute('viewBox', `0 0 ${hr.width.toFixed(0)} ${hr.height.toFixed(0)}`);
    const colunaX = etiquetasHero[0].parentElement.getBoundingClientRect().left - hr.left;
    itens.forEach((it) => {
      it.et.style.setProperty('--t', it.t.toFixed(1) + 'px');
      const ty = it.t + it.h / 2;
      const cx = colunaX - 28;
      const d = (Math.abs(ty - it.y) < 2 || it.x > cx - 4)
        ? `M${it.x.toFixed(1)},${it.y.toFixed(1)}H${colunaX.toFixed(1)}`
        : `M${it.x.toFixed(1)},${it.y.toFixed(1)}H${cx.toFixed(1)}V${ty.toFixed(1)}H${colunaX.toFixed(1)}`;
      caminhos[it.i].setAttribute('d', d);
    });
  }

  const trilhoHero = $('[data-hero-trilho]');
  const trilhoAtivo = () => trilhoHero && !reduz && !estreito();
  function ajustaTrilho() { trilhoHero && trilhoHero.classList.toggle('hero-trilho--vivo', trilhoAtivo()); }
  ajustaTrilho();
  addEventListener('resize', ajustaTrilho);
  function quadroHero() {
    if (!hero || !cena) return;
    let p;
    if (trilhoAtivo()) {
      const r = trilhoHero.getBoundingClientRect();
      p = lim(-r.top / Math.max(1, trilhoHero.offsetHeight - innerHeight));
      // a câmera mergulha na fazenda, o texto sai de cena e tudo escurece até a seção dos números
      cena.style.setProperty('--zoom', (1 + 0.42 * suave(p)).toFixed(4));
      hero.style.setProperty('--mergulho', suave(lim((p - 0.15) / 0.6)).toFixed(3));
      hero.style.setProperty('--texto', lim(1 - p * 2.6).toFixed(3));
      hero.style.setProperty('--sobe', (-70 * suave(lim(p * 1.6))).toFixed(1) + 'px');
    } else {
      p = lim(scrollY / (hero.offsetHeight * 0.9));
      if (!reduz) cena.style.setProperty('--zoom', (1 + 0.14 * suave(p)).toFixed(4));
    }
    const vis = lim(1 - p * 3).toFixed(3);
    linhasHero && linhasHero.style.setProperty('--vis', vis);
    etiquetasHero.length && etiquetasHero[0].parentElement.style.setProperty('--vis', vis);
  }

  // No celular, as chamadas mostram o conteúdo uma de cada vez; um toque abre a escolhida e para o rodízio.
  const chamadasHero = $$('[data-chamada]');
  let cicloHero = null;
  function abreChamada(alvo) {
    chamadasHero.forEach((c) => {
      const ab = c === alvo; c.classList.toggle('aberta', ab);
      const bt = $('[data-chamada-botao]', c); if (bt) bt.setAttribute('aria-expanded', String(ab));
    });
  }
  chamadasHero.forEach((c) => {
    const bt = $('[data-chamada-botao]', c);
    if (bt) bt.addEventListener('click', () => { clearInterval(cicloHero); abreChamada(c.classList.contains('aberta') ? null : c); });
  });
  // Trava: a chamada que cairia sob o topo fixo ou sob o título (mesmo aberta) não aparece nesse tamanho de tela.
  function cabeNoPalco(c) {
    const palco = $('.hero__palco'), conteudo = $('.hero__conteudo'), topo = $('[data-topo]');
    const bt = $('[data-chamada-botao]', c), jn = $('.no__janela', c);
    if (!palco || !conteudo || !bt || !jn) return true;
    const topoEm = (el, ate) => { let y = 0; while (el && el !== ate) { y += el.offsetTop; el = el.offsetParent; } return y; };
    const alto = topoEm(bt, palco);
    // a altura da etiqueta aberta, medida numa cópia invisível: a original não pisca nem dispara transição
    const copia = bt.cloneNode(true);
    copia.removeAttribute('data-chamada-botao'); copia.setAttribute('aria-hidden', 'true'); copia.tabIndex = -1;
    copia.style.cssText = 'visibility: hidden; pointer-events: none; transition: none';
    $('.no__janela', copia).style.cssText = 'max-height: none; opacity: 1; margin-top: 4px; transition: none';
    c.appendChild(copia);
    const baixo = alto + copia.offsetHeight;
    copia.remove();
    return alto > (topo ? topo.offsetHeight : 0) + 30 && baixo < topoEm(conteudo, hero) - topoEm(palco, hero) - 12;
  }
  // a largura da etiqueta fechada é a do título (padding e borda somam 24 px; 2 px de folga para o arredondamento)
  function medeTitulos() {
    chamadasHero.forEach((c) => {
      const t = $('.no__titulo', c);
      if (t && t.offsetWidth) c.style.setProperty('--larg-titulo', `${t.offsetWidth + 26}px`);
    });
  }
  document.fonts && document.fonts.ready.then(medeTitulos);
  function rodizioChamadas() {
    clearInterval(cicloHero);
    medeTitulos();
    chamadasHero.forEach((c) => c.classList.remove('chamada--fora'));
    if (!estreito()) { abreChamada(null); return; }
    const visiveis = chamadasHero.filter((c) => {
      if (c.dataset.mobile === 'nao') return false;
      const cabe = cabeNoPalco(c);
      c.classList.toggle('chamada--fora', !cabe);
      return cabe;
    });
    if (!visiveis.length) return;
    let i = 0; abreChamada(visiveis[0]);
    if (reduz) return;
    cicloHero = setInterval(() => { i = (i + 1) % visiveis.length; abreChamada(visiveis[i]); }, 3800);
  }

  // Entrada: as linhas se desenham depois que as etiquetas acham o lugar.
  let entrou = false;
  function entrada() {
    if (!hero) return;
    entrou = true;
    rodizioChamadas();
    posicionaEtiquetas();
    if (reduz) return;
    hero.classList.add('hero--entrada');
    caminhos.forEach((c, i) => {
      const len = c.getTotalLength ? c.getTotalLength() : 0;
      if (!len) return;
      c.style.strokeDasharray = len; c.style.strokeDashoffset = len;
      c.getBoundingClientRect();
      c.style.transition = `stroke-dashoffset .9s cubic-bezier(.22,1,.36,1) ${(i * 160 + 450)}ms`;
      c.style.strokeDashoffset = 0;
      setTimeout(() => { c.style.transition = ''; c.style.strokeDasharray = ''; c.style.strokeDashoffset = ''; }, i * 160 + 1500);
    });
  }

  // Vídeo da cena: entra depois da página carregada, só com movimento liberado e sem economia de dados.
  const hVideo = $('[data-hero-video]');
  const hPausa = $('[data-hero-pausa]');
  let heroVisivel = true;
  const hAbertura = $('[data-hero-abertura]');
  const comAbertura = () => doc.classList.contains('abertura');
  function iniciaLaco() {
    if (!hVideo || reduz) return;
    const con = navigator.connection;
    if (con && (con.saveData || /(^|-)2g/.test(con.effectiveType || ''))) return;
    if (!hVideo.src) hVideo.src = estreito() ? hVideo.dataset.srcAlto : hVideo.dataset.srcLargo;
    hVideo.addEventListener('playing', () => { hVideo.classList.add('pronto'); if (hPausa) hPausa.hidden = false; }, { once: true });
    hVideo.play().catch(() => {});
  }
  // Fim da abertura: o laço calmo começa no mesmo quadro, as chamadas se desenham e a câmera passa a empurrar devagar.
  function fimAbertura() {
    doc.classList.remove('abertura');
    try { sessionStorage.setItem('abertura-vista', '1'); } catch (e) { /* sem sessão, segue */ }
    if (hero && !reduz) hero.classList.add('hero--vivo');
    entrada();
  }
  function iniciaVideo() {
    if (!comAbertura() || !hAbertura) { iniciaLaco(); return; }
    const largo = !estreito();
    hAbertura.src = largo ? hAbertura.dataset.srcLargo : hAbertura.dataset.srcAlto;
    hVideo.src = largo ? hVideo.dataset.srcLargo : hVideo.dataset.srcAlto;
    hVideo.preload = 'auto';
    const desiste = () => { clearTimeout(falha); hAbertura.classList.remove('pronto'); fimAbertura(); iniciaLaco(); };
    const falha = setTimeout(() => { if (!hAbertura.classList.contains('pronto')) desiste(); }, 7000);
    hAbertura.addEventListener('playing', () => { clearTimeout(falha); hAbertura.classList.add('pronto'); if (hPausa) hPausa.hidden = false; }, { once: true });
    hAbertura.addEventListener('error', desiste, { once: true });
    hAbertura.addEventListener('ended', () => {
      hVideo.addEventListener('playing', () => {
        hVideo.classList.add('pronto');
        requestAnimationFrame(() => { hAbertura.classList.remove('pronto'); fimAbertura(); });
      }, { once: true });
      hVideo.currentTime = 0;
      hVideo.play().catch(() => { hAbertura.classList.remove('pronto'); fimAbertura(); });
    }, { once: true });
    hAbertura.play().catch(desiste);
  }
  function alternaPausa() {
    const pausar = hPausa.getAttribute('aria-pressed') !== 'true';
    hPausa.setAttribute('aria-pressed', String(pausar));
    hPausa.querySelector('use').setAttribute('href', pausar ? '#i-play' : '#i-pausa');
    hPausa.querySelector('span').textContent = pausar ? 'Continuar a cena' : 'Pausar a cena';
    hero.classList.toggle('hero--parado', pausar);
    const ativo = comAbertura() && hAbertura && hAbertura.src ? hAbertura : hVideo;
    if (ativo) pausar ? ativo.pause() : ativo.play().catch(() => {});
  }
  hPausa && hPausa.addEventListener('click', alternaPausa);
  if (hero && !reduz) {
    if (!comAbertura()) hero.classList.add('hero--vivo');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        heroVisivel = e.isIntersecting;
        const ativo = comAbertura() ? hAbertura : hVideo;
        if (!ativo || !ativo.getAttribute('src')) return;
        const pausado = hPausa && hPausa.getAttribute('aria-pressed') === 'true';
        heroVisivel && !pausado ? ativo.play().catch(() => {}) : ativo.pause();
      }).observe(hero);
    }
    // a câmera empurra devagar: as linhas acompanham os nós quadro a quadro enquanto o herói está na tela
    const segue = () => { if (heroVisivel && !estreito()) posicionaEtiquetas(); requestAnimationFrame(segue); };
    requestAnimationFrame(segue);
  }
  addEventListener('load', () => setTimeout(iniciaVideo, 150));
  if (!comAbertura()) entrada(); else posicionaEtiquetas();
  hero && hero.classList.add('hero--posicionado');
  document.fonts && document.fonts.ready.then(posicionaEtiquetas);
  addEventListener('resize', posicionaEtiquetas);
  // a cena muda de tamanho (fonte que carrega, janela que muda, captura de página inteira): as linhas se refazem antes de pintar
  let refazChamadas = null;
  if (hero && 'ResizeObserver' in window) new ResizeObserver(() => {
    posicionaEtiquetas();
    clearTimeout(refazChamadas);
    refazChamadas = setTimeout(() => { if (entrou) rodizioChamadas(); }, 250);
  }).observe(hero);

  /* ---------------- O método: a vista explodida ---------------- */
  const metodo = $('[data-metodo]');
  let trilho, pilha, placas, passos, detalhes, progresso, etiquetas, cenaMetodo, ultimoAtivo = null;
  if (metodo && !reduz) {
    metodo.classList.add('metodo--vivo');
    trilho = $('[data-metodo-trilho]', metodo);
    pilha = $('[data-pilha]', metodo);
    placas = $$('[data-placa]', metodo);
    passos = $$('[data-passo]', metodo);
    detalhes = $$('[data-detalhe]', metodo);
    progresso = $('[data-progresso]', metodo);
    etiquetas = $$('[data-etiqueta-placa]', metodo);
    cenaMetodo = $('.metodo__cena', metodo);
  }
  function quadroMetodo() {
    if (!trilho) return;
    const r = trilho.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (r.top > innerHeight || r.bottom < 0) return;
    const p = lim(-r.top / total);
    const abre = suave(lim((p - 0.04) / 0.16));
    const separa = suave(lim((p - 0.14) / 0.16));
    const fecha = suave(lim((p - 0.86) / 0.11));
    const inclina = abre * (1 - fecha);
    const sep = separa * (1 - fecha);
    const passo = estreito() ? 66 : 104;
    pilha.style.setProperty('--rx', (56 * inclina).toFixed(2) + 'deg');
    pilha.style.setProperty('--rz', (-32 * inclina).toFixed(2) + 'deg');
    pilha.style.setProperty('--s', (0.94 - 0.16 * inclina).toFixed(4));
    pilha.classList.toggle('junta', sep < 0.08);

    let ativo;
    if (p < 0.31) ativo = 'intro';
    else if (p < 0.86) ativo = String(Math.min(3, Math.floor((p - 0.31) / 0.1375)));
    else ativo = 'todo';
    const idx = Number.isNaN(+ativo) ? -1 : +ativo;

    placas.forEach((pl, i) => {
      pl.style.setProperty('--z', (i * passo * sep).toFixed(1) + 'px');
      const o = idx >= 0 ? (i === idx ? 1 : 0.32) : 1;
      pl.style.setProperty('--o', o);
      pl.classList.toggle('ativa', i === idx);
    });
    progresso && progresso.style.setProperty('--prog', lim((p - 0.31) / 0.55).toFixed(4));

    if (ativo !== ultimoAtivo) {
      ultimoAtivo = ativo;
      passos.forEach((el, i) => el.classList.toggle('ativo', idx === -1 ? ativo === 'todo' : i === idx));
      detalhes.forEach((el) => el.classList.toggle('ativo', el.dataset.detalhe === ativo));
    }

    if (etiquetas.length && !estreito()) {
      const base = cenaMetodo.getBoundingClientRect();
      const colunaX = base.width - 150;
      placas.forEach((pl, i) => {
        const a = $('[data-ancora]', pl).getBoundingClientRect();
        const x = a.left - base.left, y = a.top - base.top;
        const et = etiquetas[i];
        et.style.setProperty('--px', x.toFixed(1) + 'px');
        et.style.setProperty('--py', y.toFixed(1) + 'px');
        et.style.setProperty('--len', Math.max(16, colunaX - x).toFixed(1) + 'px');
        et.style.setProperty('--o', (lim((sep - 0.35) / 0.4) * (idx === -1 || i === idx ? 1 : 0.5)).toFixed(3));
        et.classList.toggle('ativa', i === idx);
      });
    }
  }

  /* ---------------- Aproximação das fotos de gente ---------------- */
  const aproxima = reduz ? [] : $$('[data-aproxima]');
  function quadroAproxima() {
    aproxima.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = lim(1 - r.top / innerHeight);
      const img = $('img', el);
      img && img.style.setProperty('--s', (1.16 - 0.16 * suave(p)).toFixed(4));
    });
  }


  /* ---------------- Números que contam e o mapa que acende ---------------- */
  const secNumeros = $('[data-numeros]');
  function conta(el) {
    const alvo = +el.dataset.conta; const t0 = performance.now(); const dur = 1600;
    const passo = (t) => {
      const k = lim((t - t0) / dur); const v = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString('pt-BR');
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }
  if (secNumeros) {
    const mapa = $('.mapa', secNumeros);
    if (reduz || !('IntersectionObserver' in window)) { mapa && mapa.classList.add('aceso'); }
    else {
      $$('[data-conta]', secNumeros).forEach((el) => { el.textContent = '0'; });
      const io = new IntersectionObserver((ents) => {
        ents.forEach((e) => {
          if (!e.isIntersecting) return;
          $$('[data-conta]', secNumeros).forEach(conta);
          mapa && mapa.classList.add('aceso');
          io.disconnect();
        });
      }, { threshold: 0.3 });
      io.observe(secNumeros);
    }
  }

  /* ---------------- Painéis das frentes ---------------- */
  $$('[data-paineis]').forEach((grupo) => {
    const paineis = $$('[data-painel]', grupo);
    const abre = (alvo) => paineis.forEach((p) => {
      const ab = p === alvo; p.classList.toggle('aberto', ab);
      const bt = $('[data-painel-botao]', p); bt && bt.setAttribute('aria-expanded', String(ab));
    });
    paineis.forEach((p) => {
      p.addEventListener('click', (e) => { if (!p.classList.contains('aberto')) { e.preventDefault(); abre(p); } });
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) p.addEventListener('mouseenter', () => abre(p));
      const bt = $('[data-painel-botao]', p); bt && bt.addEventListener('focus', () => abre(p));
    });
  });

  /* ---------------- Revelação ao chegar na tela ---------------- */
  const revelaveis = $$('[data-revela]');
  if (revelaveis.length && !reduz && 'IntersectionObserver' in window) {
    document.body.classList.add('revela-pronto');
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
    }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    revelaveis.forEach((el) => io.observe(el));
  }

  /* ---------------- O tempo na praça: escolha a cidade ---------------- */
  const wTempo = $('[data-tempo]');
  if (wTempo) {
    const tempo = wTempo;
    const dados = JSON.parse($('#dados-tempo').textContent);
    const cond = JSON.parse(($('#dados-condicao') || {}).textContent || '{}');
    const sel = $('[data-tempo-cidade]', tempo);
    const tipo = (c) => (c == null ? 'nuvem' : c <= 1 ? 'sol' : c === 2 ? 'sol-nuvem' : c === 3 ? 'nuvem'
      : (c === 45 || c === 48) ? 'neblina' : c >= 95 ? 'tempestade' : c >= 51 ? 'chuva' : 'nuvem');
    const tpl = (t, extra) => {
      const n = $(`[data-tempo-tpl="${t}"]`, tempo).content.firstElementChild.cloneNode(true);
      if (extra) n.classList.add(extra);
      return n;
    };
    const semana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const maiuscula = (x) => (x || '').replace(/^./, (c) => c.toUpperCase());
    function render(p) {
      $('[data-tempo-icone]', tempo).replaceChildren(tpl(tipo(p.cod), 'tempo-ico--grande'));
      $('[data-tempo-temp]', tempo).textContent = p.temp ?? '—';
      $('[data-tempo-cond]', tempo).textContent = maiuscula(p.cond || cond[p.cod] || '');
      const h = p.dias && p.dias[0];
      $('[data-tempo-min]', tempo).textContent = h ? `${h.min}°` : '—';
      $('[data-tempo-max]', tempo).textContent = h ? `${h.max}°` : '—';
      $('[data-tempo-chuva]', tempo).textContent = h ? `Chance de chuva hoje: ${h.prob ?? 0}% · ${p.chuva ?? 0} mm nos próximos 6 dias` : '';
      const lista = $('[data-tempo-dias]', tempo);
      lista.replaceChildren(...(p.dias || []).slice(1, 6).map((d) => {
        const li = document.createElement('li');
        const dia = document.createElement('span'); dia.className = 'tempo__dia'; dia.textContent = semana[new Date(`${d.data}T12:00`).getDay()];
        const val = document.createElement('span'); val.className = 'tab'; val.innerHTML = `<b>${d.max}°</b> ${d.min}°`;
        li.append(dia, tpl(tipo(d.cod), 'tempo-ico--peq'), val);
        return li;
      }));
    }
    async function aoVivo(p) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=6&timezone=America%2FSao_Paulo`;
      const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return;
      const d = await r.json(); const dd = d.daily;
      Object.assign(p, {
        temp: Math.round(d.current.temperature_2m), cod: d.current.weather_code, cond: cond[d.current.weather_code] || '',
        chuva: Math.round(dd.precipitation_sum.reduce((a, x) => a + (x || 0), 0)),
        dias: dd.time.map((t, i) => ({ data: t, cod: dd.weather_code[i], max: Math.round(dd.temperature_2m_max[i]), min: Math.round(dd.temperature_2m_min[i]), prob: dd.precipitation_probability_max[i] })),
      });
      if (sel.value === p.id) {
        render(p);
        $('[data-tempo-fonte]', tempo).textContent = `Open-Meteo, previsão por modelo · leitura das ${d.current.time.slice(11, 16).replace(':', 'h')} de hoje. Previsão é estimativa.`;
      }
    }
    const escolhe = (id) => {
      const p = dados.lista.find((x) => x.id === id) || dados.lista[0];
      sel.value = p.id; render(p); aoVivo(p).catch(() => {});
    };
    sel.addEventListener('change', () => { try { localStorage.setItem('unitec-praca', sel.value); } catch (e) { /* segue */ } escolhe(sel.value); });
    let salva = null; try { salva = localStorage.getItem('unitec-praca'); } catch (e) { /* segue */ }
    escolhe(salva || sel.value);
  }


  /* ---------------- Unitec News: as mensagens chegam quando o celular aparece ---------------- */
  const canal = $('.canal');
  if (canal && !reduz && 'IntersectionObserver' in window) {
    canal.classList.add('canal--vivo');
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { canal.classList.add('visto'); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(canal);
  }

  /* ---------------- Laço de rolagem ---------------- */
  let pedido = false;
  function quadro() {
    pedido = false;
    estadoTopo();
    if (!reduz) { quadroHero(); quadroMetodo(); quadroAproxima(); }
  }
  const agenda = () => { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } };
  addEventListener('scroll', agenda, { passive: true });
  addEventListener('resize', agenda);
  quadro();

  /* ---------------- Por onde começar (WhatsApp com a mensagem pronta) ---------------- */
  $$('[data-escolha]').forEach((form) => {
    const txt = $('textarea', form);
    $$('input[type=radio]', form).forEach((r) => r.addEventListener('change', () => { if (r.checked) txt.value = r.dataset.msg; }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = `https://wa.me/${form.dataset.numero}?text=${encodeURIComponent(txt.value.trim())}`;
      window.open(url, '_blank', 'noopener');
    });
  });

  /* ---------------- Próximo prazo, calculado no dia de quem abre ---------------- */
  try {
    const evs = JSON.parse($('#dados-eventos').textContent);
    const hoje = new Date(); const iso = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    const prox = evs.find((e) => e.data >= iso && (e.tipo === 'vencimento' || e.tipo === 'prazo'));
    const cel = $('[data-prazo]');
    if (prox && cel) {
      $('[data-valor]', cel).textContent = `${prox.data.slice(8, 10)}/${prox.data.slice(5, 7)}`;
      $('[data-hora]', cel).textContent = prox.titulo_curto || prox.titulo;
    }
    $$('[data-evento]').forEach((li) => li.classList.toggle('passou', li.dataset.evento < iso));
  } catch (e) { /* fica o valor do dia da geração */ }

  /* ---------------- Números ao vivo (Banco Central e Open-Meteo) ---------------- */
  const br = (v, c) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const icone = (n) => `<svg class="ico ico--var" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  function variacao(v) {
    if (v == null || !isFinite(v)) return '<span class="sinal sinal--neutro">sem variação</span>';
    if (Math.abs(v) < 0.005) return '<span class="sinal sinal--neutro">estável</span>';
    return `<span class="sinal ${v > 0 ? 'sinal--sobe' : 'sinal--desce'}">${icone(v > 0 ? 'sobe' : 'desce')}${br(Math.abs(v), 2)}%</span>`;
  }
  function aplica(id, valor, casas, v, hora) {
    $$(`[data-fita="${id}"]`).forEach((f) => { const b = $('b', f); if (b) b.textContent = br(valor, casas); const sn = $('.sinal', f); if (sn && v !== undefined) sn.outerHTML = variacao(v); });
    $$(`[data-ind="${id}"]`).forEach((el) => {
      const val = $('[data-valor]', el); if (val) val.textContent = br(valor, casas);
      const vr = $('[data-var]', el); if (vr && v !== undefined) vr.innerHTML = variacao(v);
      const hr = $('[data-hora]', el); if (hr && hora) hr.textContent = (el.tagName === 'TR' || el.classList.contains('cotacao')) ? hora.longa : hora.curta;
      const vt = $('[data-var-texto]', el); if (vt && hora && hora.ref) vt.textContent = hora.ref;
    });
  }
  const mdy = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
  const dm = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;

  async function ptax() {
    const hoje = new Date(); const ini = new Date(hoje.getTime() - 12 * 864e5);
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${mdy(ini)}'&@dataFinalCotacao='${mdy(hoje)}'&$format=json&$select=cotacaoVenda,dataHoraCotacao`;
    const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return;
    const v = (await r.json()).value || []; if (v.length < 2) return;
    const a = v[v.length - 1], b = v[v.length - 2];
    const d = a.dataHoraCotacao.slice(0, 10), hh = a.dataHoraCotacao.slice(11, 16).replace(':', 'h');
    const agora = new Date(); const bh = $('[data-bolsa-hora]');
    if (bh) bh.innerHTML = `<i></i>atualizado às ${String(agora.getHours()).padStart(2, '0')}h${String(agora.getMinutes()).padStart(2, '0')}`;
    aplica('dolar', a.cotacaoVenda, 4, (a.cotacaoVenda / b.cotacaoVenda - 1) * 100,
      { curta: dm(d), longa: `Banco Central · PTAX de ${dm(d)}, ${hh}`, ref: `sobre a PTAX de ${dm(b.dataHoraCotacao)}` });
  }
  if ($('[data-ind]')) { ptax().catch(() => {}); }
})();
