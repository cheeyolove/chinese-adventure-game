// 판다 탐험대 · 5차시 숫자 계곡(미션형) 2판 코드 발췌 — 검토용 (단독 실행 안 됨)
// 원본: src/game.html. 줄 번호는 src/game.html 기준.

// ===== [1] 지역 정의 — src/game.html:1624 =====
    // 5차시: 미션형 (NPC 부탁 → 탐험·조작·수집·배달·퍼즐 → 보고). 예전 몬스터 퀴즈형은 docs/backup/number-stage-v1.js
    number: {
      id: 'number', status: 'ready', lessonNo: '5차시', label: '11월 10일 1교시', title: '숫자 계곡', short: '숫자 계곡', topic: '숫자 一 ~ 九十九', mapName: '숫자 계곡', isNew: true, theme: 'cave',
      quest: true, clearTitle: '숫자 마스터! 一부터 九十九까지!',
      ...LAYOUT,
      monsters: [],
      gates: layoutGates(['첫째 돌문', '둘째 돌문', '셋째 돌문', '숫자의 문']),
      missions: [
        { label: '🍎 사과나무 三 · 五', zone: '사과나무 언덕', cards: ['num1', 'num2', 'num3', 'num4', 'num5'] },
        { label: '🧩 十一 · 二十 만들기', zone: '석판 연구소', cards: ['num6', 'num7', 'num8', 'num9', 'num10'] },
        { label: '📦 二十一 ~ 九十九 배달', zone: '배달 골목', cards: [] },
        { label: '🎉 숫자 축제', zone: '축제 광장', cards: [], cheer: '숫자 마스터!' },
      ],
      finalText: '숫자의 문', decorate: decorateNumber,
      words: NUMW, cardOrder: NUMS.map(n => n.id), cardName: '숫자 카드', bossFinale: 'none',
      introRules: [{ h: '十一', p: 'shí yī', t: 0, ko: '11 = 十 + 一' }, { h: '二十', p: 'èr shí', t: 0, ko: '20 = 二 + 十' }, { h: '三十五', p: 'sān shí wǔ', t: 0, ko: '35 = 三 + 十 + 五' }],
      noteIntro: '중국어 숫자 <b>一(1)부터 十(10)</b>까지 배우고, 규칙으로 <b>99까지</b> 만들어요.<br>· 11~19: <b>十 + 숫자</b> → 十一 shí yī (11), 十五 shí wǔ (15)<br>· 몇십: <b>숫자 + 十</b> → 二十 èr shí (20), 三十 sān shí (30)<br>· 21~99: <b>숫자 + 十 + 숫자</b> → 三十五 sān shí wǔ (35), 九十九 jiǔ shí jiǔ (99)',
      qgen: () => null, makeQueue: () => [],
    },

// ===== [2] 미션형 모듈 — src/game.html:2320~2993 =====
  // ================= 5차시 숫자 계곡: 미션형 (NPC 부탁 → 탐험·조작 → 보고) =================
  // 이 지역(STAGE.quest)에서만 돌아요. 다른 지역의 몬스터·퀴즈 흐름은 그대로예요.
  // 숫자 규칙: 11~19 = 十 + 일의 자리, 몇십 = 숫자 + 十, 21~99 = 숫자 + 十 + 숫자 (二十은 二를 씀)
  // 2판(2026-11-09): 학생이 직접 판단(흔든 횟수·사과 개수 제출), 석판 섞기, 안내/힌트 기록 분리, 배달 양방향, 축제 단계 연출, 3단계 힌트, 화면 밖 방향 안내
  const ZH_D = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const PY_D = ['', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'];
  function zhNum(n) {
    if (n <= 10) return { h: ZH_D[n], p: PY_D[n], toks: [n] };
    const t = Math.floor(n / 10), u = n % 10;
    const toks = (t === 1 ? [10] : [t, 10]).concat(u ? [u] : []);
    return { h: toks.map(k => ZH_D[k]).join(''), p: toks.map(k => PY_D[k]).join(' '), toks };
  }
  // 석판 순서 → 숫자 (규칙에 맞지 않으면 null)
  function tokVal(toks) {
    const ok = (d) => d >= 1 && d <= 9;
    if (toks.length === 1) return toks[0];
    if (toks.length === 2) { if (toks[0] === 10 && ok(toks[1])) return 10 + toks[1]; if (toks[1] === 10 && toks[0] >= 2 && toks[0] <= 9) return toks[0] * 10; return null; }
    if (toks.length === 3 && toks[1] === 10 && toks[0] >= 2 && toks[0] <= 9 && ok(toks[2])) return toks[0] * 10 + toks[2];
    return null;
  }
  // 화면에 크게: 한자 + 병음 (뜻은 힌트를 눌러야 보여요)
  const znum = (n) => { const z = zhNum(n); return `<span class="znum"><span class="han">${z.h}</span><span class="py t0">${z.p}</span></span>`; };
  const zSay = (n) => `<button class="btn small say-z" data-say="${zhNum(n).h}" aria-label="${zhNum(n).h} 듣기">🔊</button>`;
  const zp = (n) => `${zhNum(n).h} ${zhNum(n).p}`;

  const NPC_DEF = [
    { id: 'glasses', name: '안경 판다', x: 200, mission: 0, scarf: '#e5484d', hat: null, glasses: true },
    { id: 'research', name: '숫자 연구가 판다', x: 1350, mission: 1, scarf: '#3d7bd9', hat: 'beret' },
    { id: 'delivery', name: '배달 판다', x: 2060, mission: 2, scarf: '#f08a24', hat: 'cap' },
    { id: 'chief', name: '축제 촌장 판다', x: 2790, mission: 3, scarf: '#8a5cd6', hat: 'festival' },
  ];
  const NPC_SPR = {};
  function npcSpr(d) { return NPC_SPR[d.id] || (NPC_SPR[d.id] = makeSprite([...PANDA_HEAD, ...PANDA_BODY.idle], { ...PANDA_PAL, r: d.scarf })); }
  const Q_TREE_X = 700, Q_ALTAR_X = 1830;
  const Q_SPOTS = [
    [{ x: 2168, y: GY }, { x: 2335, y: 236 }, { x: 2490, y: 176 }, { x: 2625, y: GY }],   // 배달 골목
    [{ x: 2860, y: 236 }, { x: 3010, y: 180 }, { x: 3150, y: GY }, { x: 3320, y: GY }],   // 축제 광장
  ];
  const APPLE_N = 8, SHAKE_MAX = 6, SHAKE_CD = 0.35;

  function newQuest() {
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    let teen2; do { teen2 = r(13, 19); } while (teen2 === 15);
    return {
      m1: { acc: false, shakes: 0, fallen: false, apples: [], got: 0 },
      m2: { acc: false, ri: 0, rounds: [{ n: 11, guide: true }, { n: r(12, 14) }, { n: r(15, 19) }, { n: 20, guide: true }, { n: pick([30, 40, 50]) }] },
      // 배달 3번: 한자 → 숫자 상자 2번, 숫자 → 한자 상자 1번 (마지막)
      m3: { acc: false, ri: 0, rounds: [{ n: 21, dir: 'h2a' }, { n: pick([35, 62]), dir: 'h2a' }, { n: pick([48, 99]), dir: 'a2h' }], items: [] },
      m4: { acc: false, ti: 0, items: [], decoT: [],
        tasks: [{ type: 'slab', n: pick([6, 7, 8, 9]) }, { type: 'make', n: teen2 }, { type: 'make', n: pick([60, 70, 80, 90]) }, { type: 'box', n: pick([73, 56, 84, 27]) }] },
      carry: -1, shakeT: 0, shakeCd: 0, party: false, partyT: 0, task: null,
    };
  }
  const qAct = () => run ? run.ms.findIndex(x => !x.complete) : -1;
  const qNpc = (i) => NPC_DEF[i];
  // 몇 번째 미션의 들고 다니는 물건 목록
  const qItems = () => { const q = run.q, a = qAct(); return a === 2 ? q.m3.items : a === 3 ? q.m4.items : []; };

  // ----- 판정 기록: 과제 하나마다 (안내 문제·힌트 사용·처음 틀림을 따로 셈) -----
  // run.asked / run.firstTry = 혼자 푼 과제 수 / 그중 힌트 없이 처음에 맞힌 수 (안내 문제는 둘 다 빼요)
  // run.guided = 안내 문제 수, run.hints = 힌트를 쓴 과제 수
  function taskBegin(key, label, right, guided = false) {
    const q = run.q;
    if (q.task && q.task.key === key) return;
    q.task = { key, label, right, guided, hint: false, miss: false };
  }
  function taskHint() { const t = run && run.q && run.q.task; if (t) t.hint = true; }
  function taskMiss() { const t = run.q.task; if (t && !t.miss) { t.miss = true; logWrong(t.label, t.right); } }
  function taskEnd() {
    const t = run.q.task; if (!t) return;
    if (t.guided) run.guided = (run.guided || 0) + 1;
    else { run.asked++; if (!t.hint && !t.miss) run.firstTry++; }
    if (t.hint) { run.hints = (run.hints || 0) + 1; if (!t.miss) logWrong(`💡힌트 사용: ${t.label}`, t.right); }
    run.q.task = null;
  }
  function logWrong(what, right) {
    run.wrongs = run.wrongs || [];
    if (run.wrongs.length < 20) run.wrongs.push(`${what} → ${right}`.slice(0, 90));
  }

  // ----- 힌트 3단계: ① 규칙·생각하는 방법 ② 필요한 숫자의 뜻 ③ 정답과 원리 -----
  // dir: 'h2a' 한자를 보고 숫자 찾기 / 'a2h' 숫자를 보고 한자 찾기·만들기
  function ruleHints(n, dir = 'a2h') {
    const a = Math.floor(n / 10), b = n % 10, z = zhNum(n);
    const mean = (d) => `${ZH_D[d]} ${PY_D[d]}${pp(ZH_D[d], '은/는')} ${josa(d, '이에요/예요')}`;
    if (n <= 10) return ['一 二 三 四 五 六 七 八 九 十, 손가락을 하나씩 펴며 차례대로 세어 봐요.', '一은 1, 五는 5, 十은 10이에요. 그 사이 숫자를 차례로 세어 봐요.', `정답: ${n} = ${zp(n)}`];
    if (n < 20) return ['十(10) 뒤에 일의 자리 숫자를 붙이면 11~19가 돼요.', `${josa(b, '은/는')} ${ZH_D[b]} ${PY_D[b]}예요.`, `정답: ${n} = 十 + ${ZH_D[b]} → ${zp(n)}`];
    if (!b) return ['숫자를 十 앞에 붙이면 \'몇십\'이 돼요. (二十 = 20)', `${josa(a, '은/는')} ${ZH_D[a]} ${PY_D[a]}예요.`, `정답: ${n} = ${ZH_D[a]} + 十 → ${zp(n)}`];
    if (dir === 'h2a') return [`두 자리 숫자는 十을 가운데 두고 나누어 생각해요. 十 앞은 십의 자리, 뒤는 일의 자리 → ${ZH_D[a]} + 十 + ${ZH_D[b]}`, a === b ? `${mean(a)}.` : `${mean(a)}. ${mean(b)}.`, `정답: ${z.h} = 十이 ${a}개 + ${b} → ${n}`];
    return [`${josa(n, '을/를')} 십의 자리 ${a}, 일의 자리 ${b}로 나누어 생각해요 → (십의 자리) + 十 + (일의 자리)`, a === b ? `${josa(a, '은/는')} ${ZH_D[a]} ${PY_D[a]}예요.` : `${josa(a, '은/는')} ${ZH_D[a]} ${PY_D[a]}, ${josa(b, '은/는')} ${ZH_D[b]} ${PY_D[b]}예요.`, `정답: ${n} = ${ZH_D[a]} + 十 + ${ZH_D[b]} → ${zp(n)}`];
  }
  const M1_HINTS = ['손가락을 하나씩 펴며 중국어로 세어 봐요: 一 yī · 二 èr · 三 sān · 四 sì · 五 wǔ', '三은 3, 五는 5예요.', '정답: 나무를 3번 흔들고 ✋ 버튼, 사과는 5개를 모아 건네줘요.'];

  // ----- 들고 다니는 물건 (상자·석판) -----
  function boxNums(t) {
    const a = Math.floor(t / 10), b = t % 10, out = [];
    const add = (x) => { if (x >= 1 && x <= 99 && x !== t && !out.includes(x)) out.push(x); };
    if (b && b !== a) add(b * 10 + a);   // 자리를 바꾼 수 (48 ↔ 84)
    add(a * 10);                         // 몇십만 (40)
    add((a > 2 ? a - 1 : a + 1) * 10 + b);   // 십의 자리만 다른 수 (38)
    add(a * 10 + (b % 9 + 1));
    return out.slice(0, 3);
  }
  function slabNums(t) { const out = []; for (const d of [t - 1, t + 1, t + 2, t - 2]) if (d >= 1 && d <= 10 && out.length < 3) out.push(d); return out; }
  // kind: 'box' 숫자 상자 · 'zbox' 한자 상자 · 'slab' 한자 석판(1~10)
  function spawnItems(list, kind, target, spots) {
    const vals = shuffle([target, ...(kind === 'slab' ? slabNums(target) : boxNums(target))]);
    list.length = 0;
    vals.forEach((v, i) => list.push({ kind, v, x: spots[i].x, y: spots[i].y, hx: spots[i].x, hy: spots[i].y, held: false }));
    run.q.carry = -1;
  }
  function dropCarry() { const it = qItems()[run.q.carry]; if (it) { it.held = false; it.x = it.hx; it.y = it.hy; } run.q.carry = -1; }
  const itemLabel = (it) => it.kind === 'box' ? String(it.v) : zhNum(it.v).h;

  // ----- 상호작용 (E·Enter = 큰 버튼, Q = 둘째 버튼) -----
  function questCand() {
    if (!run || !run.q || mode !== 'play') return null;
    const q = run.q, a = qAct(), px = P.x + P.w / 2, feet = P.y + P.h;
    const near = (x, y, r = 30) => Math.abs(px - x) < r && feet > y - 46 && feet < y + 8;
    const carrying = q.carry >= 0;
    for (const d of NPC_DEF) {
      if (!near(d.x, GY, 34)) continue;
      if (d.mission === a && carrying) return { label: '🤲 건네주기', act: () => talkTo(d) };
      if (d.mission === 0 && a === 0 && q.m1.fallen && q.m1.got > 0) return { label: '🍎 사과 건네주기', act: () => talkTo(d) };
      return { label: '💬 말 걸기', act: () => talkTo(d) };
    }
    const m1 = q.m1;
    if (a === 0 && m1.acc && !m1.fallen && near(Q_TREE_X, GY, 40)) {
      const c = m1.shakes < SHAKE_MAX ? { label: '🌳 흔들기', act: shakeTree } : { label: '✋ 이만큼 흔들었어요!', act: shakeDone };
      if (m1.shakes > 0 && m1.shakes < SHAKE_MAX) { c.label2 = '✋ 이만큼 흔들었어요!'; c.act2 = shakeDone; }
      return c;
    }
    if (a === 1 && q.m2.acc && q.m2.ri < q.m2.rounds.length && near(Q_ALTAR_X, GY, 36)) return { label: '🧩 석판 맞추기', act: openAltar };
    const items = qItems();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.held || !near(it.x, it.y, 24)) continue;
      return { label: carrying ? '🔄 바꿔 들기' : it.kind === 'slab' ? '🪨 들기' : '📦 들기', act: () => { if (q.carry >= 0) dropCarry(); q.carry = i; it.held = true; SFX.coin(); } };
    }
    return null;
  }
  function questInteract(second = false) { const c = questCand(); if (!c) return; const f = second ? c.act2 : c.act; if (f) { audio(); f(); } }
  let actLabel = null, actLabel2 = null;
  function questSyncUI() {
    const show = !!(STAGE && STAGE.quest && run && run.q);
    const c = show && mode === 'play' ? questCand() : null;
    const lbl = c ? c.label : '', lbl2 = c && c.label2 ? c.label2 : '';
    if (lbl !== actLabel) { actLabel = lbl; $('actBtn').hidden = !lbl; if (lbl) $('actBtn').innerHTML = `${lbl}<span class="kh"> (E)</span>`; }
    if (lbl2 !== actLabel2) { actLabel2 = lbl2; $('actBtn2').hidden = !lbl2; if (lbl2) $('actBtn2').innerHTML = `${lbl2}<span class="kh"> (Q)</span>`; }
    const tip = show && mode === 'play' ? questGoal().tip : '';
    if ($('questTip').dataset.t !== tip) { $('questTip').dataset.t = tip; $('questTip').textContent = tip; $('questTip').hidden = !tip; }
  }
  $('actBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); questInteract(false); });
  $('actBtn2').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); questInteract(true); });

  // ----- 지금 할 일 (화면 위 짧은 안내 + 화살표). 정답 상자·석판은 가리키지 않아요 -----
  function questGoal() {
    const q = run.q, a = qAct();
    const at = (i) => ({ x: qNpc(i).x, y: GY - 40 });
    if (a < 0) return { tip: '🚪 숫자의 문으로 가요 →', mark: { x: GATE_X[3] + 12, y: GY - 120 } };
    if (a === 0) {
      const m = q.m1;
      if (!m.acc) return { tip: '💬 안경 판다에게 말을 걸어요', mark: at(0) };
      if (!m.fallen) return { tip: `🌳 나무를 흔들고 ✋ 버튼을 눌러요 (흔든 횟수: ${m.shakes}번)`, mark: { x: Q_TREE_X, y: GY - 96 } };
      return { tip: `🍎 사과를 주워 안경 판다에게 건네줘요 (바구니: ${m.got}개)`, mark: m.got > 0 ? at(0) : null };
    }
    if (a === 1) {
      const m = q.m2;
      if (!m.acc) return { tip: '💬 숫자 연구가 판다에게 말을 걸어요', mark: at(1) };
      if (m.ri < m.rounds.length) return { tip: `🧩 석판 제단에서 숫자를 만들어요 (${m.ri}/${m.rounds.length})`, mark: { x: Q_ALTAR_X, y: GY - 70 } };
      return { tip: '💬 연구가 판다에게 다 했다고 알려요 ←', mark: at(1) };
    }
    if (a === 2) {
      const m = q.m3;
      if (!m.acc) return { tip: '💬 배달 판다에게 말을 걸어요', mark: at(2) };
      const r = m.rounds[m.ri];
      if (q.carry < 0) return { tip: r.dir === 'a2h' ? `📦 ${r.n}번 상자(중국어로 적힌 상자)를 찾아요 (${m.ri + 1}/3)` : `📦 ${zp(r.n)} 상자를 찾아요 (${m.ri + 1}/3)`, mark: null };
      return { tip: '🤲 배달 판다에게 가져가요', mark: at(2) };
    }
    const m = q.m4;
    if (!m.acc) return { tip: '💬 축제 촌장 판다에게 말을 걸어요', mark: at(3) };
    const t = m.tasks[m.ti];
    if (!t) return { tip: '💬 촌장 판다에게 말을 걸어요', mark: at(3) };
    if (t.type === 'make') return { tip: `💬 촌장 판다에게 말을 걸어요 (축제 준비 ${m.ti + 1}/4)`, mark: at(3) };
    if (q.carry < 0) return { tip: t.type === 'slab' ? `🪨 숫자 ${josa(t.n, '을/를')} 중국어로 쓴 석판을 찾아요 (${m.ti + 1}/4)` : `📦 ${zp(t.n)} 상자를 찾아요 (${m.ti + 1}/4)`, mark: null };
    return { tip: '🤲 촌장 판다에게 가져가요', mark: at(3) };
  }

  // ----- 대화창 (힌트 3단계, 둘째 버튼) -----
  let talkCtx = null;
  function openTalk(npcI, html, { ok = '알겠어요!', hints = [], onOk = null, alt = null } = {}) {
    mode = 'talk'; releaseAll(); closeMissionPanel();
    const d = qNpc(npcI), spr = npcSpr(d), c = $('talkFace'), g = c.getContext('2d');
    c.width = 32; c.height = 42; g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height); g.drawImage(spr, 0, 10, 32, 32); drawNpcAcc(g, d, 0, 10, 1);
    talkCtx = { onOk, hints, hi: 0, alt };
    $('talkName').textContent = d.name;
    $('talkBody').innerHTML = html;
    $('talkHint').innerHTML = ''; $('talkHint').hidden = true;
    $('talkHintBtn').hidden = !hints.length; $('talkHintBtn').textContent = '💡 힌트';
    $('talkAlt').hidden = !alt; if (alt) $('talkAlt').textContent = alt.label;
    $('talkOk').textContent = ok;
    bindSoundButtons($('talkBody')); refreshVoiceUI();
    $('talk').hidden = false; $('talk').scrollTop = 0; $('talkOk').focus({ preventScroll: true });
  }
  const HINT_LBL = ['💡 힌트', '💡 힌트 더 보기', '💡 정답과 원리 보기'];
  function talkHint() {
    if (!talkCtx || talkCtx.hi >= talkCtx.hints.length) return;
    taskHint();
    $('talkHint').insertAdjacentHTML('beforeend', `<div>💡 ${talkCtx.hints[talkCtx.hi++]}</div>`); $('talkHint').hidden = false;
    if (talkCtx.hi >= talkCtx.hints.length) $('talkHintBtn').hidden = true; else $('talkHintBtn').textContent = HINT_LBL[talkCtx.hi] || HINT_LBL[1];
  }
  function closeTalk() {
    if (mode !== 'talk') return;
    $('talk').hidden = true; mode = 'play'; focusStage();
    const f = talkCtx && talkCtx.onOk; talkCtx = null;
    if (f) f();
    updateMissionPanel();
  }
  function talkAlt() {
    if (mode !== 'talk' || !talkCtx || !talkCtx.alt) return;
    const f = talkCtx.alt.fn;
    $('talk').hidden = true; mode = 'play'; talkCtx = null; focusStage();
    if (f) f();
    updateMissionPanel();
  }
  $('talkOk').addEventListener('click', closeTalk);
  $('talkHintBtn').addEventListener('click', talkHint);
  $('talkAlt').addEventListener('click', talkAlt);

  // ----- NPC에게 말 걸기 -----
  const M1_REQ = () => `<p>안녕! 부탁이 하나 있어.</p><div class="zline">사과나무를 ${znum(3)} 번 흔들고,</div><div class="zline">사과 ${znum(5)} 개를 가져다줘!</div>`;
  function talkTo(d) {
    const q = run.q, a = qAct(), i = d.mission;
    if (i < a || a < 0) { openTalk(i, i === 3 ? '<p>숫자 축제를 완성해 줘서 고마워! 숫자의 문으로 가 봐 →</p>' : '<p>고마워! 다음 구역으로 가 봐 →</p>', { ok: '네!' }); return; }
    if (i > a) { openTalk(i, '<p>앞 구역 친구의 부탁을 먼저 들어줘!</p>', { ok: '네!' }); return; }
    if (i === 0) return talkM1();
    if (i === 1) {
      const m = q.m2;
      if (!m.acc) {
        openTalk(1, `<p>숫자 만드는 규칙을 알려 줄게!</p><div class="zline">${znum(10)} 은 10이에요.</div><div class="zline">${znum(10)} 뒤에 ${znum(1)} 을 붙이면 ${znum(11)} = 11!</div><p>저쪽 <b>석판 제단</b>에서 숫자 석판 5개를 맞춰 줘!</p>`,
          { ok: '석판 제단으로 갈게요!', onOk: () => { m.acc = true; toast('🧩 석판 제단으로 가요 →', 2000, true); } });
        return;
      }
      if (m.ri >= m.rounds.length) {
        openTalk(1, `<p>대단해! 규칙을 알아냈구나!</p><div class="zline">十 + 一 → ${znum(11)} = 11</div><div class="zline">二 + 十 → ${znum(20)} = 20</div>`, { ok: '규칙을 알았어요!', onOk: () => questDone(1) });
        return;
      }
      openTalk(1, `<p>석판 제단에서 숫자를 만들어 줘! (${m.ri}/${m.rounds.length})</p><div class="zline">${znum(10)} 뒤에 숫자를 붙이면 11~19, 숫자 뒤에 ${znum(10)} 을 붙이면 '몇십'이야.</div>`, { ok: '알겠어요!' });
      return;
    }
    if (i === 2) {
      const m = q.m3;
      if (!m.acc) { m.acc = true; askDelivery('<p>배달할 상자가 많은데 숫자를 잘 못 읽겠어. 도와줄래?</p>'); return; }
      if (q.carry >= 0) {
        const r = m.rounds[m.ri];
        judgeDeliver(2, r.n, r.dir, () => { m.ri++; m.items.length = 0; if (m.ri < m.rounds.length) askDelivery('<p>고마워! 딱 맞아!</p><p>이번엔 다른 상자야.</p>'); else openTalk(2, '<p>상자 배달 끝! 너 덕분이야. 고마워!</p>', { ok: '천만에요!', onOk: () => questDone(2) }); });
        return;
      }
      askDelivery('<p>아직 상자를 못 찾았구나. 다시 알려 줄게.</p>');
      return;
    }
    // 축제 촌장 판다
    const m = q.m4;
    if (!m.acc) { m.acc = true; openTalk(3, '<p>오늘은 마을의 <b>숫자 축제</b>야! 준비할 일이 4개 있어. 하나씩 끝낼 때마다 광장이 꾸며질 거야!</p>', { ok: '좋아요!', onOk: () => festTask() }); return; }
    const t = m.tasks[m.ti];
    if (!t) return;
    if ((t.type === 'slab' || t.type === 'box') && q.carry >= 0) { judgeDeliver(3, t.n, t.type === 'slab' ? 'a2h' : 'h2a', () => { m.items.length = 0; festStep(); festTask('<p>좋아, 딱 맞아!</p>'); }); return; }
    festTask('<p>다시 알려 줄게!</p>');
  }
  // 미션 1: 부탁 → (흔든 횟수 제출) → 사과 줍기 → 사과 건네주기(개수 판정)
  function talkM1() {
    const q = run.q, m = q.m1;
    if (!m.acc) {
      taskBegin('m1shake', '사과나무: 三 번 흔들기', '3번');
      openTalk(0, M1_REQ(), { ok: '좋아요, 할게요!', hints: M1_HINTS, onOk: () => { m.acc = true; toast('🌳 나무를 흔든 다음 ✋ 버튼을 눌러요 →', 2400, true); } });
      return;
    }
    if (!m.fallen) { openTalk(0, M1_REQ() + `<p class="qprog">나무 옆에서 🌳 흔들기, 다 흔들었으면 ✋ 이만큼 흔들었어요! (지금 흔든 횟수: ${m.shakes}번)</p>`, { ok: '다시 해 볼게요!', hints: M1_HINTS }); return; }
    if (m.got === 0) { openTalk(0, `<p>사과가 떨어졌구나!</p><div class="zline">사과 ${znum(5)} 개를 주워서 가져다줘!</div>`, { ok: '주워 올게요!', hints: M1_HINTS }); return; }
    appleHandover();
  }
  function appleHandover() {
    const m = run.q.m1;
    openTalk(0, `<p>사과를 몇 개 가져왔니?</p><div class="zline">바구니: ${'🍎'.repeat(m.got)} <b>(${m.got}개)</b></div><div class="zline">내가 부탁한 건 사과 ${znum(5)} 개야.</div>`,
      { ok: '🍎 사과 건네주기', hints: M1_HINTS, onOk: judgeApples, alt: { label: '아직이에요', fn: null } });
  }
  function judgeApples() {
    const m = run.q.m1;
    if (m.got === 5) {
      taskEnd(); SFX.correct(); burst(qNpc(0).x, GY - 40, ['#fff0a8', '#f6c445', '#ff9fb2'], 16, 180);
      openTalk(0, `<p>와! 사과 ${znum(5)} 개, 딱 맞아!</p><div class="zline"><span class="znum"><span class="han">谢谢！</span><span class="py t0">Xièxie!</span></span> 고마워!</div>`, { ok: '천만에요! (不客气!)', onOk: () => questDone(0) });
      return;
    }
    taskMiss(); SFX.wrong();
    if (m.got < 5) openTalk(0, `<p>앗, 사과가 <b>${m.got}개</b>야. ${znum(5)} 개가 되려면 조금 더 있어야 해!</p><p>더 주워서 다시 가져다줄래?</p>`, { ok: '더 주워 올게요!', hints: M1_HINTS });
    else openTalk(0, `<p>앗, 사과가 <b>${m.got}개</b>야. 너무 많아!</p><div class="zline">나는 사과 ${znum(5)} 개만 필요해.</div><p>사과를 하나씩 내려놓을 수 있어.</p>`, { ok: '알겠어요!', hints: M1_HINTS, alt: { label: '🍎 하나 내려놓기', fn: dropApple } });
  }
  // 사과 하나 내려놓기: 바구니에서 1개를 빼서 판다 옆 땅에 둠 (새로 생기지 않아요)
  function dropApple() {
    const m = run.q.m1, ap = m.apples.find(x => x.got);
    if (!ap || m.got <= 0) return;
    const n = qNpc(0), dir = P.x + P.w / 2 >= n.x ? -1 : 1, k = m.apples.filter(x => x.dropped && !x.got).length;
    ap.got = false; ap.dropped = true; ap.rest = true; ap.vx = ap.vy = 0; ap.x = n.x + dir * (40 + k * 10); ap.y = GY - 4;
    m.got--; SFX.pop(); floatText(ap.x, GY - 30, `🍎 ${m.got}개`, '#ff9fb2');
    appleHandover();
  }
  function askDelivery(head) {
    const m = run.q.m3, r = m.rounds[m.ri];
    if (r.dir === 'a2h') {
      taskBegin('m3r' + m.ri, `배달: ${r.n}번 상자(중국어 상자 찾기)`, zp(r.n));
      openTalk(2, `${head}<div class="zline"><b class="numbig-s">${r.n}</b>번 상자를 가져다줘!</div><p>이번 상자에는 <b>중국어 숫자</b>가 적혀 있어.</p>`,
        { ok: '찾아올게요!', hints: ruleHints(r.n, 'a2h'), onOk: () => { if (!m.items.length) spawnItems(m.items, 'zbox', r.n, Q_SPOTS[0]); } });
      return;
    }
    taskBegin('m3r' + m.ri, `배달: ${zhNum(r.n).h} 상자`, `${r.n}`);
    openTalk(2, `${head}<div class="zline">${znum(r.n)} ${zSay(r.n)} 상자를 가져다줘!</div><p>상자에는 숫자가 적혀 있어.</p>`,
      { ok: '찾아올게요!', hints: ruleHints(r.n, 'h2a'), onOk: () => { if (!m.items.length) spawnItems(m.items, 'box', r.n, Q_SPOTS[0]); } });
  }
  function festTask(head = '') {
    const q = run.q, m = q.m4, t = m.tasks[m.ti];
    if (!t) {
      q.party = true; q.partyT = 0;
      openTalk(3, `<p>숫자 축제 완성! 친구들이 모두 모였어!</p><div class="zline">${znum(1)} 부터 ${znum(99)} 까지, 너는 <b>숫자 마스터</b>야!</div>`, { ok: '야호! 🎉', onOk: () => questDone(3) });
      return;
    }
    const step = `<p class="qprog">축제 준비 ${m.ti + 1} / ${m.tasks.length}</p>`, key = 'm4t' + m.ti;
    if (t.type === 'slab') {
      taskBegin(key, `축제: 숫자 ${josa(t.n, '을/를')} 중국어로 쓴 석판`, zp(t.n));
      openTalk(3, `${head}${step}<p>축제 깃발에 숫자 <b class="numbig-s">${t.n}</b>${pp(t.n, '을/를')} 걸어야 해.</p><p><b>${t.n}</b>${pp(t.n, '을/를')} 중국어로 쓴 석판을 찾아 줘!</p>`,
        { ok: '찾아올게요!', hints: ruleHints(t.n, 'a2h'), onOk: () => { if (!m.items.length) spawnItems(m.items, 'slab', t.n, Q_SPOTS[1]); } });
    } else if (t.type === 'box') {
      taskBegin(key, `축제: ${zhNum(t.n).h} 상자`, `${t.n}`);
      openTalk(3, `${head}${step}<div class="zline">${znum(t.n)} ${zSay(t.n)} 상자에 불꽃놀이가 들어 있어!</div><p>찾아서 가져와 줘!</p>`,
        { ok: '찾아올게요!', hints: ruleHints(t.n, 'h2a'), onOk: () => { if (!m.items.length) spawnItems(m.items, 'box', t.n, Q_SPOTS[1]); } });
    } else {
      const what = t.n < 20 ? '입장권 번호' : '축제 현수막 숫자';
      taskBegin(key, `축제: ${t.n} 만들기`, zp(t.n));
      openTalk(3, `${head}${step}<p>${what} <b class="numbig-s">${t.n}</b>${pp(t.n, '을/를')} 숫자 석판으로 만들어 줘!</p>`,
        { ok: '석판으로 만들게요!', hints: ruleHints(t.n, 'a2h'), onOk: () => openSlab({ title: '축제 준비 · 숫자 석판', rounds: [{ n: t.n }], start: 0, tag: '축제', key: () => key,
          onRound: () => {}, onAll: () => { festStep(); festTask('<p>멋져! 딱 맞아!</p>'); } }) });
    }
  }
  // 축제 준비가 하나 끝날 때마다 광장이 꾸며져요 (깃발 → 입장권 부스 → 현수막 → 친구들)
  function festStep() {
    const q = run.q, m = q.m4, t = m.tasks[m.ti];
    m.decoT[m.ti] = time; m.ti++;
    const X = [2945, 3090, 3095, 3060][m.ti - 1] || 3060;
    SFX.gate(); burst(X, GY - 90, ['#fff0a8', '#f6c445', '#ff9fb2', '#62aefc'], 18, 200);
    if (m.ti <= 3) toast(['🚩 축제 깃발이 올라갔어요!', '🎟 입장권 부스가 생겼어요!', '🎏 축제 현수막이 펼쳐졌어요!'][m.ti - 1], 1800, true);
    return t;
  }
  // 들고 온 물건이 맞는지 (dir: 'h2a' 한자로 부탁 → 숫자 상자, 'a2h' 숫자로 부탁 → 한자 상자·석판)
  function judgeDeliver(npcI, want, dir, onRight) {
    const q = run.q, items = qItems(), it = items[q.carry];
    if (!it) return;
    if (it.v === want) {
      taskEnd();
      SFX.correct(); burst(qNpc(npcI).x, GY - 40, ['#fff0a8', '#f6c445', '#ffffff'], 16, 180);
      q.carry = -1;
      onRight();
      return;
    }
    taskMiss(); SFX.wrong(); dropCarry();
    const got = it.kind === 'box'
      ? `<div class="zline">이 상자는 <b class="numbig-s">${it.v}</b>, ${znum(it.v)} ${pp(zhNum(it.v).h, '이야/야')}.</div>`
      : `<div class="zline">이 ${it.kind === 'slab' ? '석판은' : '상자는'} ${znum(it.v)}, <b class="numbig-s">${it.v}</b>${pp(it.v, '이야/야')}.</div>`;
    const ask = dir === 'a2h' ? `<b class="numbig-s">${want}</b>${it.kind === 'slab' ? '' : '번 상자'}${pp(it.kind === 'slab' ? want : '상자', '이야/야')}` : `${znum(want)} ${pp(zhNum(want).h, '이야/야')}`;
    openTalk(npcI, `<p>앗, 이건 아니야!</p>${got}<p>내가 부탁한 건 ${ask}. 다시 찾아볼까?</p>`, { ok: '다시 찾아볼게요!', hints: ruleHints(want, dir) });
  }
  // 미션 완료: 보상은 처음 한 번만 (홈·새로 고침·다시 하기로 또 받지 못함)
  function questDone(i) {
    const ever = save.questEver[STAGE.id] = save.questEver[STAGE.id] || [];
    if (!ever.includes(i)) { ever.push(i); addCoins(5); addExp(20); floatText(P.x + P.w / 2, P.y - 20, '+5 코인 · +20 EXP', '#fff0a8'); }
    else floatText(P.x + P.w / 2, P.y - 20, '미션 완료! (보상은 처음 한 번만)', '#cfe3ff');
    missionStep(i);
  }

  // ----- 미션 1: 사과나무 (학생이 횟수를 세고 직접 제출) -----
  function shakeTree() {
    const q = run.q, m = q.m1;
    if (m.fallen || m.shakes >= SHAKE_MAX || q.shakeCd > 0) return;   // 너무 빨리 누르면 한 번만
    m.shakes++; q.shakeT = 0.45; q.shakeCd = SHAKE_CD; SFX.pop();
    floatText(Q_TREE_X, GY - 110, `${m.shakes}번!`, '#fff0a8');   // 중국어 숫자가 아니라 횟수만 보여 줘요 (三이 몇인지는 학생이 판단)
    for (let k = 0; k < 6; k++) parts.push({ x: Q_TREE_X + rnd(-26, 26), y: GY - rnd(60, 90), vx: rnd(-30, 30), vy: rnd(-20, 20), life: 0.8, max: 0.8, color: '#4fae5c', size: 3 });
    if (m.shakes >= SHAKE_MAX) toast(`${SHAKE_MAX}번까지만 흔들 수 있어요. ✋ 버튼을 눌러요`, 2200, true);
  }
  function shakeDone() {
    const m = run.q.m1;
    if (m.fallen || m.shakes < 1) return;
    if (m.shakes === 3) {
      taskEnd();
      m.fallen = true; SFX.correct();
      // 사과는 하나씩 셀 수 있게 넓게 흩어져 떨어져요 (약 24px 간격)
      for (let k = 0; k < APPLE_N; k++) m.apples.push({ x: Q_TREE_X - 84 + k * 24 + rnd(-2, 2), y: GY - 80 + rnd(-8, 8), vx: rnd(-3, 3), vy: rnd(-90, -20), rest: false, got: false });
      taskBegin('m1apple', '사과: 五 개 건네주기', '5개');
      setTimeout(() => toast('딱 맞게 흔들었어요! 사과가 떨어졌어요 🍎', 2200, true), 200);
      return;
    }
    taskMiss(); SFX.wrong();
    const n = m.shakes; m.shakes = 0;
    openTalk(0, `<p>앗, 사과가 떨어지지 않았어요.</p><div class="zline">나무를 <b>${n}번</b> 흔들었어요.</div><div class="zline">안경 판다는 ${znum(3)} 번이라고 했어요.</div><p>처음부터 다시 흔들어 볼까요?</p>`, { ok: '다시 흔들어 볼게요!', hints: M1_HINTS });
  }
  // ----- 미션 2: 석판 제단 -----
  function openAltar() {
    const m = run.q.m2;
    openSlab({ title: '숫자 연구가 판다의 석판 제단', rounds: m.rounds, start: m.ri, tag: '석판', key: (ri) => 'm2r' + ri,
      onRound: (ri) => { m.ri = ri + 1; },
      onAll: () => toast('다 만들었어요! 연구가 판다에게 알려요 ←', 2400, true) });
  }

  // ----- 숫자 석판 퍼즐 (탭해서 순서대로) -----
  // 안내 문제(11·20)는 一~十 순서대로, 나머지는 한 문제마다 석판 자리를 섞어요 (오답 뒤 다시 할 때는 그대로)
  // 숫자키 1~9·0은 '화면의 석판 자리'를 고르고, 판정은 고른 한자의 순서로 해요
  let slab = null;
  const ORDERED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  function openSlab(spec) {
    mode = 'slab'; releaseAll(); closeMissionPanel();
    slab = { ...spec, ri: spec.start, toks: [], lock: false, order: ORDERED };
    $('slTitle').textContent = spec.title;
    slabRound();
    $('slab').hidden = false; $('slab').scrollTop = 0; $('slab').querySelector('.card').focus({ preventScroll: true });
  }
  function slabTiles() {
    $('slTiles').innerHTML = slab.order.map((v, i) => `<button class="sltile" data-v="${v}" data-pos="${i + 1}"><span class="han">${ZH_D[v]}</span><span class="py t0">${PY_D[v]}</span><span class="kn">${i === 9 ? 0 : i + 1}</span></button>`).join('');
    $('slTiles').querySelectorAll('.sltile').forEach(b => b.addEventListener('click', () => slabTap(+b.dataset.v)));
  }
  function slabRound() {
    const r = slab.rounds[slab.ri], z = zhNum(r.n);
    slab.toks = []; slab.lock = false; slab.need = z.toks.length; slab.hints = 0;
    if (r.guide) slab.order = ORDERED;
    else { let o; do { o = shuffle(ORDERED); } while (o.join() === ORDERED.join()); slab.order = o; }
    slabTiles();
    taskBegin(slab.key(slab.ri), `${slab.tag}: ${r.n} 만들기`, zp(r.n), !!r.guide);
    $('slProg').textContent = slab.rounds.length > 1 ? `석판 ${slab.ri + 1} / ${slab.rounds.length}${r.guide ? ' · 안내 문제' : ''}` : '';
    $('slTarget').innerHTML = `<span class="numbig">${r.n}</span><span class="sl-mk">${pp(r.n, '을/를')} 중국어 석판으로 만들어요</span>`;
    const guide = r.guide ? (r.n < 20 ? '十(10) 다음에 一(1)을 놓아요! 반짝이는 석판을 차례로 눌러요.' : '숫자를 十 앞에 놓으면 \'몇십\'이 돼요. 二 + 十 → 20!') : '';
    $('slMsg').className = 'sl-msg'; $('slMsg').textContent = guide;
    $('slHint').hidden = !!r.guide;
    slabDraw();
  }
  function slabDraw() {
    const r = slab.rounds[slab.ri], z = zhNum(r.n);
    $('slSlots').innerHTML = Array.from({ length: slab.need }, (_, i) => { const v = slab.toks[i]; return `<span class="slslot${v ? ' on' : ''}">${v ? `<span class="han">${ZH_D[v]}</span><span class="py t0">${PY_D[v]}</span>` : '?'}</span>`; }).join('');
    const nextV = r.guide && !slab.lock ? z.toks[slab.toks.length] : 0;
    $('slTiles').querySelectorAll('.sltile').forEach(b => b.classList.toggle('glow', +b.dataset.v === nextV));
    $('slUndo').disabled = !slab.toks.length || slab.lock;
  }
  function slabKey(pos) { if (slab && slab.order[pos - 1]) slabTap(slab.order[pos - 1]); }
  function slabTap(v) {
    if (mode !== 'slab' || !slab || slab.lock || slab.toks.length >= slab.need) return;
    slab.toks.push(v); SFX.pop(); slabDraw();
    if (slab.toks.length === slab.need) slabCheck();
  }
  function slabCheck() {
    const r = slab.rounds[slab.ri], z = zhNum(r.n), toks = slab.toks;
    slab.lock = true;
    if (toks.join() === z.toks.join()) {
      taskEnd();
      SFX.correct();
      const parts = z.toks.map(k => `${ZH_D[k]}(${k})`).join(' + ');
      $('slMsg').className = 'sl-msg ok'; $('slMsg').innerHTML = `✔ <span class="han">${z.h}</span> <span class="py t0">${z.p}</span> = ${r.n}<br><small>${parts}${z.toks.length > 1 ? (z.toks[0] === 10 ? ` → 10 + ${r.n - 10}` : z.toks.length === 2 ? ` → ${z.toks[0]}개의 十` : ` → ${z.toks[0]}개의 十 + ${z.toks[2]}`) : ''}</small>`;
      slabDraw();
      slab.onRound(slab.ri);
      setTimeout(() => {
        if (mode !== 'slab' || !slab) return;
        slab.ri++;
        if (slab.ri < slab.rounds.length) slabRound();
        else { const f = slab.onAll; closeSlab(); f(); }
      }, 1500);
      return;
    }
    taskMiss(); SFX.wrong();
    const got = tokVal(toks), gh = toks.map(k => ZH_D[k]).join('');
    $('slMsg').className = 'sl-msg no';
    $('slMsg').innerHTML = (got ? `<span class="han">${gh}</span>${pp(gh, '은/는')} ${josa(got, '이에요/예요')}. ` : `<span class="han">${gh}</span> 순서로는 숫자가 되지 않아요. `) + `다시 해 봐요! <small>💡 ${ruleHints(r.n)[0]}</small>`;
    $('slSlots').classList.add('shake');
    setTimeout(() => { $('slSlots').classList.remove('shake'); if (!slab) return; slab.toks = []; slab.lock = false; slabDraw(); }, 1100);   // 석판 자리는 그대로
  }
  function slabUndo() { if (!slab || slab.lock || !slab.toks.length) return; slab.toks.pop(); slabDraw(); }
  function slabHint() {
    if (!slab) return;
    const r = slab.rounds[slab.ri], h = ruleHints(r.n);
    if (r.guide) return;
    taskHint();
    slab.hints = Math.min(h.length, slab.hints + 1);
    $('slMsg').className = 'sl-msg'; $('slMsg').innerHTML = `💡 ${h.slice(0, slab.hints).join('<br>💡 ')}`;
    $('slHint').textContent = slab.hints >= h.length ? '💡 힌트' : HINT_LBL[slab.hints] || HINT_LBL[1];
  }
  function closeSlab() { if (mode !== 'slab') return; $('slab').hidden = true; $('slHint').textContent = '💡 힌트'; slab = null; mode = 'play'; focusStage(); updateMissionPanel(); }
  $('slUndo').addEventListener('click', slabUndo);
  $('slHint').addEventListener('click', slabHint);
  $('slLater').addEventListener('click', closeSlab);

  // ----- 매 프레임: 사과 떨어지기·줍기, 들고 다니기 -----
  function questUpdate(dt) {
    const q = run.q, m = q.m1;
    if (q.shakeT > 0) q.shakeT = Math.max(0, q.shakeT - dt);
    if (q.shakeCd > 0) q.shakeCd = Math.max(0, q.shakeCd - dt);
    if (q.party) q.partyT += dt;
    for (const ap of m.apples) {
      if (ap.got) continue;
      if (!ap.rest) {
        ap.vy += GRAV * 0.6 * dt; ap.x += ap.vx * dt; ap.y += ap.vy * dt;
        if (ap.y >= GY - 4) { ap.y = GY - 4; if (Math.abs(ap.vy) < 60) { ap.rest = true; ap.vy = 0; ap.vx = 0; } else { ap.vy *= -0.35; ap.vx *= 0.6; } }
        continue;
      }
      // 줍기: 판다가 닿으면 (개수는 학생이 정해요. 몇 개든 주울 수 있고, 안경 판다에게 건네줄 때 판정)
      if (Math.abs(P.x + P.w / 2 - ap.x) < 10 && P.y + P.h > GY - 14) {
        ap.got = true; m.got++; SFX.coin();
        floatText(ap.x, GY - 40, `🍎 ${m.got}개`, '#ff9fb2');
        updateMissionPanel();
      }
    }
    const it = qItems()[q.carry];
    if (it) { it.x = P.x + P.w / 2; it.y = P.y - 2; }
  }

  // ----- 그리기 -----
  function drawNpc(d, x, y, face) {
    const spr = npcSpr(d), sx = Math.round(x - 16 - cam), sy = Math.round(y - 32);
    ctx.fillStyle = 'rgba(30,40,30,.25)'; ctx.fillRect(sx + 7, Math.round(y) - 2, 18, 3);
    if (face > 0) ctx.drawImage(spr, sx, sy, 32, 32); else { ctx.save(); ctx.translate(sx + 32, sy); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0, 32, 32); ctx.restore(); }
    drawNpcAcc(ctx, d, sx, sy, face);
  }
  // 안경·모자 (게임 화면과 대화창 얼굴에 같이 씀)
  function drawNpcAcc(g, d, sx, sy, face) {
    if (d.glasses) {   // 동그란 안경
      g.fillStyle = '#d4a017';
      for (const ox of [4, 18]) { g.fillRect(sx + ox, sy + 8, 10, 2); g.fillRect(sx + ox, sy + 16, 10, 2); g.fillRect(sx + ox, sy + 8, 2, 10); g.fillRect(sx + ox + 8, sy + 8, 2, 10); }
      g.fillRect(sx + 14, sy + 11, 4, 2);
    }
    if (d.hat === 'cap') { g.fillStyle = '#f08a24'; g.fillRect(sx + 6, sy - 2, 20, 6); g.fillStyle = '#c96a10'; g.fillRect(face > 0 ? sx + 20 : sx + 2, sy + 3, 10, 2); }
    if (d.hat === 'beret') { g.fillStyle = '#3d7bd9'; g.fillRect(sx + 8, sy - 2, 16, 5); g.fillRect(sx + 14, sy - 4, 4, 2); }
    if (d.hat === 'festival') { g.fillStyle = '#e5484d'; g.fillRect(sx + 9, sy - 6, 14, 8); g.fillStyle = '#f6c445'; g.fillRect(sx + 9, sy, 14, 2); g.fillRect(sx + 15, sy - 9, 2, 3); }
  }
  function drawMarker(x, y) {
    const sx = Math.round(x - cam), sy = Math.round(y + Math.sin(time * 5) * 4);
    ctx.fillStyle = '#1d2738'; ctx.beginPath(); ctx.moveTo(sx - 10, sy - 2); ctx.lineTo(sx + 10, sy - 2); ctx.lineTo(sx, sy + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6c445'; ctx.beginPath(); ctx.moveTo(sx - 7, sy); ctx.lineTo(sx + 7, sy); ctx.lineTo(sx, sy + 9); ctx.closePath(); ctx.fill();
  }
  // 목표가 화면 밖이면 가장자리에 작은 방향 화살표 (화면 안에 들어오면 사라지고 ▼만 보여요)
  function drawEdgeArrow(dir) {
    const bob = Math.sin(time * 5) * 3, cx = dir < 0 ? 18 + bob : W - 18 - bob, cy = Math.round(H * 0.52);
    ctx.fillStyle = 'rgba(19,34,58,.78)'; ctx.fillRect(Math.round(cx - 13), cy - 15, 26, 30);
    ctx.fillStyle = '#f6c445'; ctx.beginPath();
    if (dir < 0) { ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 6, cy - 9); ctx.lineTo(cx + 6, cy + 9); } else { ctx.moveTo(cx + 7, cy); ctx.lineTo(cx - 6, cy - 9); ctx.lineTo(cx - 6, cy + 9); }
    ctx.closePath(); ctx.fill();
  }
  function drawGoalGuide() {
    if (mode !== 'play') return;
    const g = questGoal(); if (!g.mark) return;
    const sx = g.mark.x - cam;
    if (sx < 6) drawEdgeArrow(-1); else if (sx > W - 6) drawEdgeArrow(1); else drawMarker(g.mark.x, g.mark.y);
  }
  function drawBubble2(x, y, text, bg = '#f6c445') {
    const sx = Math.round(x - cam), sy = Math.round(y);
    ctx.fillStyle = '#1d2738'; ctx.fillRect(sx - 9, sy - 9, 18, 18); ctx.fillStyle = bg; ctx.fillRect(sx - 7, sy - 7, 14, 14);
    ctx.fillStyle = '#1d2738'; ctx.font = 'bold 12px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, sx, sy + 1);
  }
  function drawTree() {
    const m = run.q.m1, wob = run.q.shakeT > 0 ? Math.sin(time * 50) * 3 * (run.q.shakeT / 0.45) : 0;
    const x = Math.round(Q_TREE_X - cam), y = GY;
    if (x < -60 || x > W + 60) return;
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 6, y - 46, 12, 46); ctx.fillStyle = '#7a5232'; ctx.fillRect(x - 6, y - 46, 4, 46);
    const cx = x + Math.round(wob);
    ctx.fillStyle = '#1d4a2a'; ctx.fillRect(cx - 34, y - 92, 68, 50); ctx.fillRect(cx - 26, y - 104, 52, 66);
    ctx.fillStyle = '#3f8f4f'; ctx.fillRect(cx - 32, y - 90, 64, 46); ctx.fillRect(cx - 24, y - 102, 48, 62);
    ctx.fillStyle = '#5cb26a'; ctx.fillRect(cx - 24, y - 98, 22, 14); ctx.fillRect(cx + 4, y - 86, 18, 12);
    if (!m.fallen) for (const [ax, ay] of [[-20, -80], [-6, -94], [10, -78], [22, -66], [-14, -60], [4, -62], [18, -92], [-26, -70]]) { ctx.fillStyle = '#c92a2a'; ctx.fillRect(cx + ax, y + ay, 6, 6); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(cx + ax + 1, y + ay + 1, 2, 2); }
  }
  function drawApple(ap) {
    const x = Math.round(ap.x - cam), y = Math.round(ap.y);
    ctx.fillStyle = '#7a1414'; ctx.fillRect(x - 4, y - 7, 9, 8); ctx.fillStyle = '#e03131'; ctx.fillRect(x - 3, y - 6, 7, 6); ctx.fillStyle = '#ff8787'; ctx.fillRect(x - 2, y - 5, 2, 2);
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(x, y - 10, 3, 3);
  }
  function drawAltar() {
    const x = Math.round(Q_ALTAR_X - cam), y = GY;
    if (x < -40 || x > W + 40) return;
    ctx.fillStyle = '#2b2838'; ctx.fillRect(x - 26, y - 26, 52, 26); ctx.fillStyle = '#8a85a0'; ctx.fillRect(x - 24, y - 24, 48, 24); ctx.fillStyle = '#b3aec4'; ctx.fillRect(x - 24, y - 24, 48, 4);
    const glow = run.q.m2.acc && run.q.m2.ri < run.q.m2.rounds.length;
    ['十', '一', '二'].forEach((h, k) => {
      const tx = x - 20 + k * 14;
      ctx.fillStyle = '#2b2838'; ctx.fillRect(tx - 1, y - 42, 14, 18); ctx.fillStyle = glow ? '#d4fbff' : '#cfcbe0'; ctx.fillRect(tx, y - 41, 12, 16);
      ctx.fillStyle = '#2b2838'; ctx.font = '11px "Noto Sans SC", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(h, tx + 6, y - 33);
    });
  }
  function drawItem(it) {
    const x = Math.round(it.x - cam), y = Math.round(it.y);
    if (x < -40 || x > W + 40) return;
    if (it.kind === 'box' || it.kind === 'zbox') {
      const lab = itemLabel(it), hw = it.kind === 'zbox' ? Math.max(16, 7 + lab.length * 8) : 16;   // 휴대폰에서도 읽히게 글자 14px
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - hw, y - 22, hw * 2, 22); ctx.fillStyle = '#b07a45'; ctx.fillRect(x - hw + 2, y - 20, hw * 2 - 4, 18); ctx.fillStyle = '#c99560'; ctx.fillRect(x - hw + 2, y - 20, hw * 2 - 4, 3);
      ctx.fillStyle = '#fbfaf5'; ctx.fillRect(x - hw + 4, y - 18, hw * 2 - 8, 15);
      ctx.fillStyle = '#1d2738'; ctx.font = it.kind === 'zbox' ? 'bold 14px "Noto Sans SC", sans-serif' : 'bold 14px "Noto Sans", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, x, y - 10);
    } else {
      ctx.fillStyle = '#2b2838'; ctx.fillRect(x - 12, y - 28, 24, 28); ctx.fillStyle = '#cfcbe0'; ctx.fillRect(x - 10, y - 26, 20, 24); ctx.fillStyle = '#e8e5f2'; ctx.fillRect(x - 10, y - 26, 20, 3);
      ctx.fillStyle = '#1d2738'; ctx.font = 'bold 15px "Noto Sans SC", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ZH_D[it.v], x, y - 13);
    }
  }
  // 축제 광장 꾸미기 (준비가 하나 끝날 때마다 하나씩 나타나요)
  function drawFestival() {
    const m = run.q.m4, n = m.ti, pop = (k) => clamp((time - (m.decoT[k] || -9)) / 0.5, 0, 1);
    if (!n) return;
    const sx = (x) => Math.round(x - cam);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 1) 깃발 두 개 (깃발에 만든 숫자)
    const p1 = pop(0), fh = Math.round(70 * p1), t0 = m.tasks[0];
    for (const [px, col] of [[2945, '#e5484d'], [3240, '#f6c445']]) {
      const x = sx(px); if (x < -40 || x > W + 40) continue;
      ctx.fillStyle = '#3b3346'; ctx.fillRect(x - 1, GY - fh - 20, 3, fh + 20);
      if (p1 > 0.6) {
        const wave = Math.round(Math.sin(time * 4 + px) * 2);
        ctx.fillStyle = '#1d2738'; ctx.fillRect(x + 2, GY - fh - 20, 26, 18 + wave); ctx.fillStyle = col; ctx.fillRect(x + 3, GY - fh - 19, 24, 16 + wave);
        ctx.fillStyle = '#1d2738'; ctx.font = 'bold 12px "Noto Sans SC", sans-serif'; ctx.fillText(ZH_D[t0.n], x + 15, GY - fh - 11);
      }
    }
    // 2) 입장권 부스 (입장권 번호)
    if (n >= 2) {
      const p = pop(1), x = sx(3090), h = Math.round(46 * p);
      if (x > -50 && x < W + 50 && h > 2) {
        ctx.fillStyle = '#1d2738'; ctx.fillRect(x - 24, GY - h, 48, h); ctx.fillStyle = '#ff9fb2'; ctx.fillRect(x - 22, GY - h + 2, 44, h - 2);
        ctx.fillStyle = '#e5484d'; ctx.fillRect(x - 26, GY - h - 6, 52, 8);
        if (p > 0.8) { ctx.fillStyle = '#fbfaf5'; ctx.fillRect(x - 18, GY - h + 8, 36, 14); ctx.fillStyle = '#1d2738'; ctx.font = 'bold 11px "Noto Sans SC", sans-serif'; ctx.fillText(`🎟 ${zhNum(m.tasks[1].n).h}`, x, GY - h + 15); }
      }
    }
    // 3) 현수막 (깃발 사이에 펼쳐짐)
    if (n >= 3) {
      const p = pop(2), x1 = sx(2948), x2 = sx(3240), w = Math.round((x2 - x1) * p), y = GY - 112;
      if (x1 < W + 20 && x2 > -20 && w > 4) {
        ctx.fillStyle = '#1d2738'; ctx.fillRect(x1, y - 1, w, 22); ctx.fillStyle = '#8a5cd6'; ctx.fillRect(x1 + 1, y, w - 2, 20);
        if (p > 0.95) { ctx.fillStyle = '#fff0a8'; ctx.font = 'bold 12px Jua, "Noto Sans SC", sans-serif'; ctx.fillText(`★ 숫자 축제 ★ ${zhNum(m.tasks[2].n).h} ★`, Math.round((x1 + x2) / 2), y + 10); }
      }
    }
    // 4) 친구들이 모이면 꽃가루
    if (run.q.party) for (let k = 0; k < 14; k++) { const x = sx(2900 + ((k * 53 + time * 40) % 380)), y = Math.round((k * 37 + time * 60) % 160) + 40; ctx.fillStyle = ['#ff9fb2', '#f6c445', '#62aefc', '#5cc46a'][k % 4]; ctx.fillRect(x, y, 3, 3); }
  }
  function drawQuest() {
    const q = run.q, a = qAct();
    drawTree(); drawAltar(); drawFestival();
    for (const ap of q.m1.apples) if (!ap.got) drawApple(ap);
    for (const it of qItems()) if (!it.held) drawItem(it);
    const px = P.x + P.w / 2;
    NPC_DEF.forEach((d, i) => {
      let x = d.x;
      if (q.party && i !== 3) x = 2900 + i * 34;   // 축제가 완성되면 친구들이 광장에 모여요
      const hop = q.party ? Math.max(0, Math.sin(q.partyT * 6 + i)) * -6 : 0;
      drawNpc(d, x, GY + hop, px >= x ? 1 : -1);
      if (i === a && mode === 'play') drawBubble2(x, GY - 44 + Math.sin(time * 4) * 2, '!');
      else if (i < a || a < 0) drawBubble2(x, GY - 44, '♥', '#ff9fb2');
    });
  }
  function drawQuestTop() { const it = qItems()[run.q.carry]; if (it) drawItem(it); drawGoalGuide(); }

  // 미션 다시 보기 (미션 창의 버튼): 지금 부탁을 다시 보여 줘요 (판정은 하지 않음)
  function questRecall() {
    const q = run.q, a = qAct();
    if (a < 0) return;
    closeMissionPanel();
    const notYet = (i) => openTalk(i, `<p>아직 ${josa(qNpc(i).name, '의')} 부탁을 듣지 않았어요.</p><p>노란 ▼ 표시를 따라가서 말을 걸어 봐요!</p>`, { ok: '알겠어요!' });
    if (a === 0) { if (!q.m1.acc) return notYet(0); openTalk(0, M1_REQ() + `<p class="qprog">지금: 나무 흔든 횟수 <b>${q.m1.shakes}</b>번 · 바구니 사과 <b>${q.m1.got}</b>개</p>`, { hints: M1_HINTS }); return; }
    if (a === 1) { if (!q.m2.acc) return notYet(1); openTalk(1, `<p>석판 제단에서 숫자 석판을 맞춰 줘! (${q.m2.ri}/${q.m2.rounds.length})</p><div class="zline">${znum(10)} 뒤에 숫자 → 11~19 · 숫자 뒤에 ${znum(10)} → 몇십</div>`); return; }
    if (a === 2) {
      if (!q.m3.acc) return notYet(2);
      const r = q.m3.rounds[q.m3.ri];
      openTalk(2, r.dir === 'a2h' ? `<div class="zline"><b class="numbig-s">${r.n}</b>번 상자(중국어로 적힌 상자)를 가져다줘! (${q.m3.ri + 1}/3)</div>` : `<div class="zline">${znum(r.n)} ${zSay(r.n)} 상자를 가져다줘! (${q.m3.ri + 1}/3)</div>`, { hints: ruleHints(r.n, r.dir) });
      return;
    }
    const m = q.m4, t = m.tasks[m.ti];
    if (!m.acc) return notYet(3);
    if (!t) return;
    const what = t.type === 'slab' ? `숫자 <b class="numbig-s">${t.n}</b>${pp(t.n, '을/를')} 중국어로 쓴 석판을 찾아 줘!` : t.type === 'box' ? `${znum(t.n)} 상자를 찾아 줘!` : `촌장 판다에게 가서 숫자 <b class="numbig-s">${t.n}</b>${pp(t.n, '을/를')} 석판으로 만들어 줘!`;
    openTalk(3, `<p class="qprog">축제 준비 ${m.ti + 1} / ${m.tasks.length}</p><div class="zline">${what}</div>`, { hints: ruleHints(t.n, t.type === 'box' ? 'h2a' : 'a2h') });
  }
  $('mpAgain').addEventListener('click', () => { if (mode === 'play' && STAGE.quest && run && run.q) questRecall(); });

// ===== [3] 공통 엔진에 끼워 넣은 곳 (STAGE.quest일 때만) =====
2011:    ctx.fillText(STAGE.quest ? '부탁' : STAGE.missions[gt.mission].boss ? '보스' : `×${left}`, cx + 10, py + 16);
2140:    if (STAGE.quest && run && run.q) drawQuest();
2142:    if (STAGE.quest && run && run.q) drawQuestTop();
2264:    if (STAGE.quest && (c === 'KeyE' || isEnter(c)) && !e.repeat) { e.preventDefault(); questInteract(false); return; }
2265:    if (STAGE.quest && c === 'KeyQ' && !e.repeat) { e.preventDefault(); questInteract(true); return; }
3077:    if (STAGE.quest && run && run.q) questUpdate(dt);
3102:    if (STAGE.quest) { const d = NPC_DEF[gt.mission]; toast(`먼저 ${josa(d.name, '의')} 부탁을 해결해요!`, 2400, true); return; }
3862:      ...(STAGE.quest ? { hints: run.hints || 0, guided: run.guided || 0, dataVer: 2 } : {}),
3886:    $('skillChip').hidden = !!(STAGE && STAGE.quest);   // 5차시(싸우지 않는 지역)에서는 스킬을 숨겨요
4089:      ms: (STAGE.missions || []).map((M, i) => ({ need: STAGE.quest ? 1 : STAGE.monsters.filter(d => d.mission === i).length, done: 0, complete: false, qi: 0, used: [], queue: STAGE.makeQueue(i) })),
4091:    if (STAGE.quest) { run.q = newQuest(); run.hints = 0; run.guided = 0; }
4110:      const chip = st === 'done' ? '완료' : st === 'active' ? (STAGE.quest ? '진행 중' : M.boss ? '보스전' : `${s.done}/${s.need}`) : '잠김';
4114:    $('mpAgain').hidden = !(STAGE.quest && active >= 0);
4168:      [rate >= 0.7, `${STAGE.quest ? '혼자 힌트 없이 처음에 해결' : '한 번에 맞힌 문제'} 70% 이상 (${Math.round(rate * 100)}%)`],
4293:    if (!run.hello) { run.hello = 1; report('start'); setTimeout(() => { if (mode === 'play') toast(STAGE.quest ? '친구 판다들의 부탁을 들어줘요! 노란 ▼를 따라가요' : '몬스터를 모두 물리치면 문이 열려요! 오른쪽으로 출발 →', 2600, true); }, 400); }
4325:    if (STAGE.quest) {
4483:    $('rScoreLabel').textContent = STAGE.quest ? `혼자 힌트 없이 처음에 해결한 과제 (안내 ${run.guided || 0}개 · 힌트 ${run.hints || 0}개 따로)` : '한 번에 맞힌 문제';
