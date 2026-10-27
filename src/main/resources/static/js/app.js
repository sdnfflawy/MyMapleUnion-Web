(() => {
  'use strict';

  const UNION_SLOTS = 42;           // 유니온 점수에 반영되는 캐릭터 수
  const MIN_LEVEL = 1;
  const MAX_LEVEL = 300;
  const STEPS = [-10, -1, 1, 10];   // 레벨 증감 버튼
  const STORAGE_KEY = 'mmu.apiKey'; // "키 기억하기"를 체크했을 때만 브라우저에 저장

  // 넥슨 에러코드 -> 알기 쉬운 안내
  const NEXON_MESSAGES = {
    OPENAPI00002: '이 키로는 접근할 수 없어요. 메이플스토리용으로 등록한 키인지 확인해 주세요.',
    OPENAPI00005: 'API 키가 올바르지 않아요. 키를 다시 복사해서 붙여넣어 보세요.',
    OPENAPI00007: '넥슨 호출 한도를 넘었어요. 잠시 후 다시 시도해 주세요.',
    OPENAPI00009: '넥슨 쪽 데이터가 아직 준비 중이에요. 잠시 후 다시 시도해 주세요.',
    OPENAPI00010: '게임 점검 중이에요. 점검이 끝난 뒤 다시 시도해 주세요.',
    OPENAPI00011: '넥슨 API 점검 중이에요. 잠시 후 다시 시도해 주세요.',
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    logoBtn: $('logoBtn'), loadBtn: $('loadBtn'), loadLabel: $('loadLabel'), loadSpinner: $('loadSpinner'),
    apiKeyInput: $('apiKeyInput'), toggleKeyBtn: $('toggleKeyBtn'), rememberKey: $('rememberKey'), demoBtn: $('demoBtn'),
    errorBox: $('errorBox'), emptyState: $('emptyState'), resultSection: $('resultSection'),
    demoNotice: $('demoNotice'), worldSelect: $('worldSelect'), scoreLabel: $('scoreLabel'),
    unionScore: $('unionScore'), baseScore: $('baseScore'),
    scoreDiff: $('scoreDiff'), countInfo: $('countInfo'), resetLevelsBtn: $('resetLevelsBtn'),
    charBody: $('charBody'), quitBtn: $('quitBtn'),
  };

  // 불러온 모든 캐릭터: { id, name, world, job, base(불러온 레벨), level(조정한 레벨) }
  let chars = [];
  // 지금 선택된 월드 (유니온 점수는 같은 월드 캐릭터끼리만 합산)
  let currentWorld = null;

  const fmt = (n) => n.toLocaleString('ko-KR');
  const clamp = (n) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, n));

  // ---------- 키 저장 (선택 사항) ----------
  function readSavedKey() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { return ''; }
  }
  function writeSavedKey(key) {
    try {
      if (key) localStorage.setItem(STORAGE_KEY, key);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* 저장이 막힌 브라우저면 그냥 넘어감 */ }
  }

  /** 선택된 월드의 캐릭터만 */
  const worldChars = () => chars.filter((c) => c.world === currentWorld);

  /** 월드 목록: 캐릭터가 많은 월드가 먼저, 같으면 이름순 */
  function worldList() {
    const counts = new Map();
    chars.forEach((c) => counts.set(c.world, (counts.get(c.world) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'));
  }

  /** 레벨 높은 순 상위 42개를 합산 */
  function unionScore(list, levelOf) {
    return list.map(levelOf).sort((a, b) => b - a).slice(0, UNION_SLOTS).reduce((s, v) => s + v, 0);
  }

  function node(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;   // textContent: 캐릭터 이름이 HTML로 해석되지 않게
    return e;
  }

  /** 드롭다운 항목 다시 만들기 (불러오기 직후에만 호출) */
  function renderWorldSelect() {
    const options = worldList().map(([name, count]) => {
      const o = node('option', '', `${name} (${count})`);
      o.value = name;
      return o;
    });
    el.worldSelect.replaceChildren(...options);
    el.worldSelect.value = currentWorld;
  }

  function stepButton(id, delta) {
    const b = node('button', 'btn btn-sm btn-outline-secondary step-btn', (delta > 0 ? '+' : '−') + Math.abs(delta));
    b.type = 'button';
    b.dataset.id = id;
    b.dataset.delta = delta;
    b.setAttribute('aria-label', `레벨 ${Math.abs(delta)} ${delta > 0 ? '올리기' : '내리기'}`);
    return b;
  }

  function makeRow(c, rank, counted) {
    const tr = node('tr', counted ? '' : 'is-outside');
    tr.appendChild(node('td', '', rank));
    tr.appendChild(node('td', 'fw-semibold', c.name));
    tr.appendChild(node('td', '', [c.world, c.job].filter(Boolean).join(' / ')));

    const td = node('td');
    const wrap = node('div', 'level-cell');
    wrap.appendChild(stepButton(c.id, STEPS[0]));
    wrap.appendChild(stepButton(c.id, STEPS[1]));
    wrap.appendChild(node('span', 'level-value', c.level));
    wrap.appendChild(stepButton(c.id, STEPS[2]));
    wrap.appendChild(stepButton(c.id, STEPS[3]));
    if (c.level !== c.base) {
      const diff = c.level - c.base;
      wrap.appendChild(node('span', 'level-delta ' + (diff > 0 ? 'is-up' : 'is-down'), (diff > 0 ? '+' : '') + diff));
    }
    td.appendChild(wrap);
    tr.appendChild(td);
    return tr;
  }

  function render(focusSelector) {
    const list = worldChars();                       // 선택한 월드의 캐릭터만 표시/계산
    // 점수에 반영 중인 캐릭터(현재 레벨 기준 상위 42개). 흐림 표시에만 사용
    const counted = new Set(
      [...list].sort((a, b) => b.level - a.level || a.id - b.id).slice(0, UNION_SLOTS).map((c) => c.id));

    const score = unionScore(list, (c) => c.level);
    const base = unionScore(list, (c) => c.base);
    const diff = score - base;

    el.scoreLabel.textContent = `${currentWorld} 유니온 점수`;
    el.unionScore.textContent = fmt(score);
    el.baseScore.textContent = fmt(base);
    el.scoreDiff.textContent = (diff > 0 ? '+' : '') + fmt(diff);
    el.scoreDiff.className = diff > 0 ? 'is-up' : diff < 0 ? 'is-down' : '';
    el.countInfo.textContent = `${Math.min(list.length, UNION_SLOTS)} / ${UNION_SLOTS} (이 월드 ${list.length}개)`;

    const rows = document.createDocumentFragment();
    list.forEach((c, i) => rows.appendChild(makeRow(c, i + 1, counted.has(c.id))));
    el.charBody.replaceChildren(rows);

    if (focusSelector) {
      const target = el.charBody.querySelector(focusSelector);
      if (target) target.focus();   // 다시 그린 뒤에도 키보드 포커스 유지
    }
  }

  // ---------- 화면 상태 ----------
  function showError(message) {
    el.errorBox.textContent = message;
    el.errorBox.classList.remove('d-none');
  }
  function hideError() { el.errorBox.classList.add('d-none'); }

  function setLoading(loading) {
    el.loadBtn.disabled = loading;
    el.demoBtn.disabled = loading;
    el.loadSpinner.classList.toggle('d-none', !loading);
    el.loadLabel.textContent = loading ? '불러오는 중...' : '캐릭터 불러오기';
  }

  /** 첫 접속 화면으로 초기화 (입력해 둔 키는 그대로 둠) */
  function resetToStart() {
    chars = [];
    currentWorld = null;
    hideError();
    el.resultSection.classList.add('d-none');
    el.emptyState.classList.remove('d-none');
    el.charBody.replaceChildren();
    el.worldSelect.replaceChildren();
    window.scrollTo({ top: 0 });
    el.apiKeyInput.focus();
  }

  function describeError(data, status) {
    if (data && data.nexonStatus !== undefined) {
      const code = (String(data.detail || '').match(/OPENAPI\d{5}/) || [])[0];
      if (code && NEXON_MESSAGES[code]) return `${NEXON_MESSAGES[code]} (${code})`;
      if (!data.nexonStatus) return data.detail || data.error;
      return `넥슨 API 오류 (${data.nexonStatus}) ${data.detail || ''}`.trim();
    }
    return (data && data.error) || `서버 오류가 발생했습니다 (${status})`;
  }

  /** demo=true 이면 키 없이 샘플 데이터 */
  async function loadCharacters(demo) {
    const key = el.apiKeyInput.value.trim();
    if (!demo && key && !/^[\x21-\x7E]+$/.test(key)) {
      showError('API 키에 한글이나 공백이 섞여 있어요. 복사한 키만 붙여넣었는지 확인해 주세요.');
      el.apiKeyInput.focus();
      return;
    }

    setLoading(true);
    hideError();
    try {
      const url = demo ? '/api/characters?demo=true' : '/api/characters';
      const headers = (!demo && key) ? { 'X-Nexon-Api-Key': key } : {};
      const res = await fetch(url, { headers });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(describeError(data, res.status));
      if (!data.characters || data.characters.length === 0) {
        throw new Error('불러온 캐릭터가 없어요. API 키의 계정에 캐릭터가 있는지 확인해 주세요.');
      }

      // 성공했을 때만 키 기억 여부를 반영 (잘못된 키가 저장되지 않게)
      if (!demo) writeSavedKey(el.rememberKey.checked ? key : '');

      chars = data.characters.map((c, i) => ({
        id: i, name: c.name, job: c.job, base: c.level, level: c.level,
        world: c.world && c.world.trim() ? c.world.trim() : '알 수 없음',
      })).sort((a, b) => b.base - a.base || a.id - b.id);   // 수정1

      // 이전에 고른 월드가 아직 있으면 유지, 없으면 캐릭터가 가장 많은 월드
      const worlds = worldList().map(([name]) => name);
      if (!worlds.includes(currentWorld)) currentWorld = worlds[0];

      el.demoNotice.classList.toggle('d-none', data.mode !== 'demo');
      el.emptyState.classList.add('d-none');
      el.resultSection.classList.remove('d-none');
      renderWorldSelect();
      render();
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- 시작할 때: 저장된 키가 있으면 채워 넣기 ----------
  const savedKey = readSavedKey();
  if (savedKey) {
    el.apiKeyInput.value = savedKey;
    el.rememberKey.checked = true;
  }

  // ---------- 이벤트 ----------
  el.loadBtn.addEventListener('click', () => loadCharacters(false));
  el.demoBtn.addEventListener('click', () => loadCharacters(true));
  el.apiKeyInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') loadCharacters(false);
  });
  el.logoBtn.addEventListener('click', resetToStart);

  // 프로그램 종료: 서버를 끄고 안내 화면으로 바꿈 (exe로 실행했을 때 창을 닫아도 서버가 남는 것을 방지)
  el.quitBtn.addEventListener('click', async () => {
    if (!window.confirm('프로그램을 종료할까요?')) return;
    try {
      await fetch('/api/shutdown', { method: 'POST', headers: { 'X-MMU-Action': 'shutdown' } });
    } catch (e) { /* 서버가 바로 꺼지면서 응답이 끊길 수 있어서 무시 */ }
    document.title = 'MyMapleUnion - 종료됨';
    document.body.innerHTML =
      '<div style="padding:4rem 1rem;text-align:center">' +
      '<h1 class="h4">프로그램이 종료되었습니다.</h1>' +
      '<p>이 창(탭)은 닫으셔도 됩니다.</p></div>';
  });

  el.toggleKeyBtn.addEventListener('click', () => {
    const show = el.apiKeyInput.type === 'password';
    el.apiKeyInput.type = show ? 'text' : 'password';
    el.toggleKeyBtn.textContent = show ? '숨기기' : '보기';
    el.toggleKeyBtn.setAttribute('aria-pressed', String(show));
  });

  // 월드를 바꾸면 그 월드의 캐릭터만 다시 그림 (다른 월드에서 조정한 레벨은 그대로 보관)
  el.worldSelect.addEventListener('change', () => {
    currentWorld = el.worldSelect.value;
    render();
  });

  // 되돌리기는 지금 보고 있는 월드만
  el.resetLevelsBtn.addEventListener('click', () => {
    worldChars().forEach((c) => { c.level = c.base; });
    render();
  });

  el.charBody.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-delta]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const delta = Number(btn.dataset.delta);
    const c = chars.find((x) => x.id === id);
    if (!c) return;
    c.level = clamp(c.level + delta);
    render(`button[data-id="${id}"][data-delta="${delta}"]`);
  });
})();
