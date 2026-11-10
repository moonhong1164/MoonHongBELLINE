(() => {
  'use strict';

  const CARDS = window.CARDS;
  const byN = (n) => CARDS[n - 1];

  /* 배열법. order: 뽑는 순서대로 카드가 놓이는 자리 번호. 읽을 때는 1번부터. */
  const SPREADS = {
    one: {
      name: '오늘의 한 장', sub: '원카드', count: 1, order: [1],
      mini: ['"a"', [['a', 1]]],
      intro: '하루의 흐름이나 지금 필요한 한마디를 가볍게 물을 때.',
      positions: { 1: ['메시지', '지금 나에게 건네는 말'] }
    },
    three: {
      name: '세 장 흐름', sub: '쓰리카드', count: 3, order: [1, 2, 3],
      mini: ['"a b c"', [['a', 1], ['b', 2], ['c', 3]]],
      intro: '과거·현재·미래. 가운데 카드를 중심에 두고 양옆 카드로 뜻을 물들입니다.',
      positions: {
        1: ['과거', '여기까지 온 배경'],
        2: ['현재', '지금의 상황'],
        3: ['미래', '이대로 흘러갈 때의 방향']
      }
    },
    five: {
      name: '다섯 장 줄 배열', sub: '파이브카드', count: 5, order: [1, 2, 3, 4, 5],
      mini: ['"a b c d e"', [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]]],
      intro: '왼쪽에서 오른쪽으로 한 줄. 옆자리 카드끼리의 조합을 가장 넉넉하게 읽습니다.',
      positions: {
        1: ['과거', '지나온 일'],
        2: ['현재', '지금의 상황'],
        3: ['핵심', '문제의 한가운데'],
        4: ['조언', '내가 취할 태도'],
        5: ['결과', '흘러갈 방향']
      }
    }
  };

  const TONE = { pos: '긍정', neu: '중립', neg: '부정' };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const numLabel = (c) => (c.blank ? '✦' : String(c.n));
  const imgSrc = (c) => `cards/${String(c.n).padStart(2, '0')}.png`;

  /* 치우침 없는 난수 (0 이상 n 미만) */
  function rand(n) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── 그림 ─────────────────────────── */
  function faceHTML(c, lazy) {
    return `<span class="face"><img src="${imgSrc(c)}" alt="${esc(c.ko)} 카드 그림" width="174" height="288"${lazy ? ' loading="lazy"' : ''}></span>`;
  }

  /* 카드 뒷면: 밤하늘의 네 갈래 별 */
  const BACK_SVG = '<svg class="back-art" viewBox="0 0 100 166" preserveAspectRatio="none" aria-hidden="true">' +
    '<rect class="b-ground" width="100" height="166"/>' +
    '<rect class="b-frame" x="5" y="5" width="90" height="156" rx="4"/>' +
    '<circle class="b-ring" cx="50" cy="83" r="30"/>' +
    '<path class="b-star" d="M50 55L54 79L78 83L54 87L50 111L46 87L22 83L46 79Z"/>' +
    '<path class="b-dot" d="M22 30l1.5 4.5 4.5 1.5-4.500 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5zM80 128l1.2 3.6 3.600 1.2-3.600 1.2-1.2 3.6-1.2-3.6-3.600-1.2 3.600-1.2z"/>' +
    '</svg>';

  /* ── 해설 조각 ─────────────────────── */
  function tagsHTML(c) {
    return `<div class="tags"><span class="tag tone-${c.tone}">${TONE[c.tone]}</span>` +
      (c.soothe ? '<span class="tag">부정 카드 완화</span>' : '') +
      (c.tone === 'neu' ? '<span class="tag">주변 카드 영향</span>' : '') + '</div>';
  }
  function bodyHTML(c) {
    return tagsHTML(c) +
      `<div><p class="sub">키워드</p><ul class="kw">${c.kw.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>` +
      `<div><p class="sub">풀이</p><ul class="notes">${c.notes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` +
      `<div><p class="sub">전통 풀이 한 줄</p><p class="src">${esc(c.src)}</p></div>`;
  }
  function titleHTML(c, id) {
    return `<h3${id ? ` id="${id}"` : ''}><b class="num">${numLabel(c)}</b>${esc(c.ko)} <span>${esc(c.fr)} · ${esc(c.en)}</span></h3>`;
  }
  function readingHTML(pos, label, c) {
    return `<div class="reading-card">${faceHTML(c)}</div>` +
      '<div class="reading-body">' +
      `<p class="pos"><b>${pos}</b>${esc(label)}</p>` + titleHTML(c) + bodyHTML(c) + '</div>';
  }
  function dialogHTML(c) {
    return `<div class="dialog-head"><div class="reading-card">${faceHTML(c)}</div><div>${titleHTML(c, 'dialogTitle')}</div></div>` +
      `<div class="dialog-sections">${bodyHTML(c)}</div>`;
  }

  /* ── 함께 읽기: 카드 조합 규칙 ───────── */
  const PAIRS = [
    [27, 14, '큐피드와 악마가 만났습니다. 불륜이나 떳떳하지 못한 끌림을 암시합니다.'],
    [27, 17, '큐피드와 이동이 만났습니다. 사랑의 도피, 사랑을 따라 움직이는 일.'],
    [28, 14, '결합과 악마가 만났습니다. 불륜, 이혼처럼 관계에 금이 가는 일을 조심하세요.']
  ];
  const WITH_NEG = {
    7: '신뢰·우정이 부정 카드와 함께라 구설수가 따를 수 있습니다.',
    8: '명예가 부정 카드와 함께라 혼자만의 명예이거나 명예가 흔들릴 수 있습니다.',
    12: '발견·폭로가 부정 카드와 함께라 배신이 드러나는 모양입니다.',
    16: '물이 부정 카드와 함께 나왔습니다. 물을 조심하세요.',
    20: '돈·번영이 부정 카드와 함께라 돈이 나가는 흐름입니다.',
    35: '협상이 부정 카드와 함께라 배신이나 좋지 않은 문서를 조심해야 합니다.',
    43: '기회가 부정 카드와 함께라 도박성 선택이 무너지거나 뒤통수를 맞을 수 있습니다.',
    44: '명성이 부정 카드와 함께라 좋지 않은 소문이 돌 수 있습니다.'
  };

  function togetherHTML(cards) {
    const count = { pos: 0, neu: 0, neg: 0 };
    cards.forEach((c) => { count[c.tone]++; });
    const has = (n) => cards.some((c) => c.n === n);
    const negs = cards.filter((c) => c.tone === 'neg');
    const soothers = cards.filter((c) => c.soothe);
    const lines = [];

    if (count.pos > count.neg) lines.push('긍정 카드가 더 많습니다. 전체 흐름은 밝은 쪽으로 기울어 있습니다.');
    else if (count.neg > count.pos) lines.push('부정 카드가 더 많습니다. 서두르기보다 걸림돌이 무엇인지 먼저 살필 때입니다.');
    else lines.push('긍정과 부정이 팽팽합니다. 중립 카드와 옆자리 카드가 어느 쪽 손을 들어 주는지 보세요.');

    PAIRS.forEach(([a, b, text]) => { if (has(a) && has(b)) lines.push(text); });
    if (negs.length) {
      Object.keys(WITH_NEG).forEach((n) => { if (has(Number(n))) lines.push(WITH_NEG[n]); });
      if (soothers.length) {
        lines.push(`${soothers.map((c) => c.ko).join(', ')} 카드가 ${negs.map((c) => c.ko).join(', ')} 카드의 기운을 누그러뜨립니다.`);
      }
    }
    if (has(14) && count.pos > 0) lines.push('악마가 긍정 카드 곁에 있습니다. 좋은 일 뒤에 숨은 유혹과 속임수가 더 도드라집니다.');
    const neutrals = cards.filter((c) => c.tone === 'neu');
    if (neutrals.length) lines.push(`${neutrals.map((c) => c.ko).join(', ')} 카드는 중립입니다. 바로 옆 카드의 색을 입혀 읽으세요.`);

    return '<h3>함께 읽기</h3>' +
      `<p class="tally"><span class="tone-pos">긍정 ${count.pos}</span><span class="tone-neu">중립 ${count.neu}</span><span class="tone-neg">부정 ${count.neg}</span></p>` +
      `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
  }

  /* ── 상태 ─────────────────────────── */
  const state = { spreadKey: 'three', deck: [], picks: [], flipped: new Set(), question: '' };
  const spread = () => SPREADS[state.spreadKey];

  function renderSpreadOptions() {
    $('spreadOptions').innerHTML = Object.entries(SPREADS).map(([key, s]) => {
      const cells = s.mini[1].map(([area, n]) => `<i style="grid-area:${area}">${n}</i>`).join('');
      return `<label class="spread-option"><input type="radio" name="spread" value="${key}"${key === state.spreadKey ? ' checked' : ''}>` +
        '<span class="spread-card">' +
        `<span class="mini" style="grid-template-areas:${esc(s.mini[0])}" aria-hidden="true">${cells}</span>` +
        `<span><strong>${esc(s.name)}</strong><em>${esc(s.sub)}</em><p>${esc(s.intro)}</p></span>` +
        '</span></label>';
    }).join('');
  }

  /* ── 테이블 ───────────────────────── */
  function startReading() {
    const s = spread();
    state.deck = shuffled(CARDS);
    state.picks = [];
    state.flipped = new Set();

    $('table').hidden = false;
    $('tableActions').hidden = true;
    $('together').hidden = true;
    $('spreadTitle').textContent = `${s.name} · ${s.sub}`;
    const asked = $('asked');
    asked.hidden = !state.question;
    asked.textContent = state.question;

    const deck = $('deck');
    deck.classList.remove('is-done');
    deck.innerHTML = state.deck.map((_, i) =>
      `<button type="button" class="deck-card" style="--i:${i}" data-i="${i}" aria-label="${i + 1}번째 카드 뽑기">${BACK_SVG}</button>`).join('');

    const layout = $('layout');
    layout.dataset.spread = state.spreadKey;
    layout.innerHTML = Object.keys(s.positions).map((p) =>
      `<div class="slot" data-pos="${p}">` +
      `<div class="slot-label"><b>${p}</b>${esc(s.positions[p][0])}</div>` +
      `<div class="slot-hole">${p}</div><div class="slot-name"></div></div>`).join('');

    $('readings').innerHTML = Object.keys(s.positions).map((p) =>
      `<article class="reading" data-pos="${p}" hidden></article>`).join('');

    updateStatus();
  }

  function updateStatus() {
    const s = spread();
    const left = s.count - state.picks.length;
    let msg;
    if (left > 0) {
      msg = state.picks.length === 0
        ? `질문을 떠올리며 마음이 가는 카드를 ${s.count}장 골라 주세요.`
        : `${left}장 더 골라 주세요.`;
    } else if (state.flipped.size < s.count) {
      msg = '카드를 눌러 뒤집어 보세요.';
    } else {
      msg = s.count > 1 ? '왼쪽 1번 자리부터 차례로, 옆 카드와 이어서 읽어 보세요.' : '카드가 건네는 말을 읽어 보세요.';
    }
    $('status').textContent = msg;
  }

  function pick(i) {
    const s = spread();
    if (state.picks.length >= s.count) return;
    const card = state.deck[i];
    const pos = s.order[state.picks.length];
    state.picks.push({ pos, card });

    const slot = $('layout').querySelector(`.slot[data-pos="${pos}"]`);
    slot.querySelector('.slot-hole').outerHTML =
      `<button type="button" class="flip" data-pos="${pos}" aria-label="${pos}번 자리 카드 뒤집기">` +
      `<span class="flip-inner"><span class="side back">${BACK_SVG}</span>` +
      `<span class="side front">${faceHTML(card)}</span></span></button>`;

    if (state.picks.length === s.count) {
      $('deck').classList.add('is-done');
      $('tableActions').hidden = false;
      $('flipAll').hidden = s.count === 1;
      const first = $('layout').querySelector('.flip[data-pos="1"]');
      if (first) first.focus({ preventScroll: true });
    }
    updateStatus();
  }

  function flip(pos, quiet) {
    pos = Number(pos);
    if (state.flipped.has(pos)) return;
    const picked = state.picks.find((p) => p.pos === pos);
    if (!picked) return;
    state.flipped.add(pos);
    const c = picked.card;
    const s = spread();

    const slot = $('layout').querySelector(`.slot[data-pos="${pos}"]`);
    const btn = slot.querySelector('.flip');
    btn.classList.add('is-flipped');
    btn.setAttribute('aria-label', `${pos}번 자리: ${c.ko} (${TONE[c.tone]})`);
    slot.querySelector('.slot-name').innerHTML = `<span class="dot tone-${c.tone}"></span>${esc(c.ko)}`;

    const article = $('readings').querySelector(`.reading[data-pos="${pos}"]`);
    article.innerHTML = readingHTML(pos, s.positions[pos][1], c);
    article.hidden = false;

    const done = state.flipped.size === s.count;
    if (done) $('flipAll').hidden = true;
    if (done && s.count > 1) {
      const inOrder = state.picks.slice().sort((a, b) => a.pos - b.pos).map((p) => p.card);
      $('together').innerHTML = togetherHTML(inOrder);
      $('together').hidden = false;
    }
    updateStatus();
    if (!quiet && done) {
      const target = s.count === 1 ? article : $('together');
      setTimeout(() => target.scrollIntoView({ block: 'start' }), 700);
    }
  }

  /* ── 도감 ─────────────────────────── */
  function renderLibrary() {
    $('cardGrid').innerHTML = CARDS.map((c, i) =>
      `<button type="button" class="card-tile" data-i="${i}" data-tone="${c.tone}" aria-label="${esc(c.ko)} 풀이 보기">` +
      `${faceHTML(c, true)}<span class="tile-name"><b>${numLabel(c)}</b>${esc(c.ko)}</span></button>`).join('');
    const n = (t) => CARDS.filter((c) => c.tone === t).length;
    $('cntAll').textContent = CARDS.length;
    $('cntPos').textContent = n('pos');
    $('cntNeu').textContent = n('neu');
    $('cntNeg').textContent = n('neg');
  }

  /* ── 이벤트 ───────────────────────── */
  $('setup').addEventListener('submit', (e) => {
    e.preventDefault();
    const checked = document.querySelector('input[name="spread"]:checked');
    if (checked) state.spreadKey = checked.value;
    state.question = $('question').value.trim();
    startReading();
    $('table').scrollIntoView({ block: 'start' });
  });

  $('deck').addEventListener('click', (e) => {
    const btn = e.target.closest('.deck-card');
    if (!btn || btn.classList.contains('is-taken')) return;
    btn.classList.add('is-taken');
    btn.disabled = true;
    pick(Number(btn.dataset.i));
  });

  $('layout').addEventListener('click', (e) => {
    const btn = e.target.closest('.flip');
    if (btn) flip(btn.dataset.pos);
  });

  $('flipAll').addEventListener('click', () => {
    const rest = state.picks.map((p) => p.pos).filter((p) => !state.flipped.has(p)).sort((a, b) => a - b);
    rest.forEach((p, i) => setTimeout(() => flip(p, i < rest.length - 1), i * 260));
  });

  $('redraw').addEventListener('click', () => {
    startReading();
    $('table').scrollIntoView({ block: 'start' });
  });

  $('filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const tone = chip.dataset.tone;
    $('filters').querySelectorAll('.chip').forEach((b) => {
      const on = b === chip;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('cardGrid').querySelectorAll('.card-tile').forEach((t) => {
      t.hidden = tone !== 'all' && t.dataset.tone !== tone;
    });
  });

  const dialog = $('cardDialog');
  $('cardGrid').addEventListener('click', (e) => {
    const tile = e.target.closest('.card-tile');
    if (!tile) return;
    $('dialogBody').innerHTML = dialogHTML(CARDS[Number(tile.dataset.i)]);
    dialog.showModal();
    dialog.scrollTop = 0;
  });
  $('dialogClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  renderSpreadOptions();
  renderLibrary();
})();
