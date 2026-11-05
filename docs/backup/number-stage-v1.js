// 5차시 숫자 계곡 v1 (몬스터 퀴즈형) 백업 — 2026-11-05, 미션형 개편 전 원본
// src/game.html에서 그대로 복사한 부분이에요. 되돌릴 때 참고하세요. (커밋 51d2b07)

// ----- 숫자 데이터 -----
  // 숫자 계곡: 숫자 1~10 (t: 성조)
  const NUMS = [
    { id: 'num1', h: '一', p: 'yī', t: 1, v: 1 }, { id: 'num2', h: '二', p: 'èr', t: 4, v: 2 },
    { id: 'num3', h: '三', p: 'sān', t: 1, v: 3 }, { id: 'num4', h: '四', p: 'sì', t: 4, v: 4 },
    { id: 'num5', h: '五', p: 'wǔ', t: 3, v: 5 }, { id: 'num6', h: '六', p: 'liù', t: 4, v: 6 },
    { id: 'num7', h: '七', p: 'qī', t: 1, v: 7 }, { id: 'num8', h: '八', p: 'bā', t: 1, v: 8 },
    { id: 'num9', h: '九', p: 'jiǔ', t: 3, v: 9 }, { id: 'num10', h: '十', p: 'shí', t: 2, v: 10 },
  ];
  const NUM_HUN = ['한 일', '두 이', '석 삼', '넉 사', '다섯 오', '여섯 륙', '일곱 칠', '여덟 팔', '아홉 구', '열 십'];
  NUMS.forEach(n => { n.hun = NUM_HUN[n.v - 1]; n.ko = `${n.hun} · 숫자 ${n.v}`; });
  const NUMW = Object.fromEntries(NUMS.map(n => [n.id, n]));
  const numOf = (v) => NUMS[v - 1];

// ----- 지역 정의 (STAGES.number) -----
    number: {
      id: 'number', status: 'draft', lessonNo: '5차시', label: '11월 10일 1교시', title: '숫자 계곡', short: '숫자 계곡', topic: '숫자 一 ~ 十', mapName: '숫자 계곡', isNew: true, theme: 'cave',
      clearTitle: '숫자 마스터! 1부터 10까지 정복!',
      ...LAYOUT,
      monsters: layoutMonsters([
        ['숫자 수정', '숫자 수정', '꼭대기 수정', '문지기 수정'],
        ['하늘 수정', '하늘 수정', '꼭대기 수정', '문지기 수정'],
        ['숫자 석판', '숫자 석판', '꼭대기 석판', '문지기 석판'],
      ], { name: '숫자 골렘', hp: 5 }, { name: '숫자 수정 골렘' }),
      gates: layoutGates(['첫째 돌문', '둘째 돌문', '셋째 돌문', '숫자의 문']),
      missions: [
        { label: '一 二 三', zone: '1구역', cards: ['num1', 'num2', 'num3'] },
        { label: '四 五 六', zone: '2구역', cards: ['num4', 'num5', 'num6'] },
        { label: '七 八 九 十', zone: '3구역', cards: ['num7', 'num8', 'num9', 'num10'] },
        { label: '1~10 종합', zone: '보스', cards: [], boss: true },
      ],
      finalText: '숫자의 문', decorate: decorateNumber,
      words: NUMW, cardOrder: NUMS.map(n => n.id), cardName: '숫자 카드', bossFinale: 'none',
      qgen: (m) => numQuestion(m), makeQueue: (i) => numQueue(i),
      // 중간보스 2문제: 一~三 1문제 + 四~六 1문제 복습 (문제 유형은 기존 것 그대로)
      midQ: () => { const ks = shuffle(['h2n', 'n2h', 'py2h', 'hun2h']); const a = 1 + Math.floor(Math.random() * 3), b = 4 + Math.floor(Math.random() * 3); return [() => numQ(ks[0], a), () => numQ(ks[1], b)]; },
      quickMons: [{ type: 'mon', skin: 'crystal', name: '숫자 수정' }, { type: 'mon', skin: 'slab', name: '숫자 석판' }],
    },
  };
  // 지역 순서 (시작 화면에 이 순서대로, 준비 안 된 지역은 아예 넣지 않음)

// ----- 문제 만들기 (NUM_HINT · numQ · numQueue · numQuestion) -----
  // ===== 숫자 계곡 문제 =====
  const NUM_HINT = {
    1: '가로줄이 하나 → 1', 2: '가로줄이 둘 → 2', 3: '가로줄이 셋 → 3',
    4: '네모 안에 다리가 있는 모양이에요. sì!', 5: 'wǔ, 손가락을 모두 편 손 하나만큼!', 6: '점 아래에 다리 두 개가 벌어진 모양, liù!',
    7: '十과 닮았지만 아래가 오른쪽으로 꺾여요. qī!', 8: '두 획이 양쪽으로 벌어진 모양, bā!', 9: '꼬리가 휘어 올라간 모양, jiǔ!', 10: '가로 한 획과 세로 한 획, 열 십(十)자!',
  };
  const nearTwo = (v) => shuffle(shuffle(NUMS.map(n => n.v).filter(x => x !== v)).sort((a, b) => Math.abs(a - v) - Math.abs(b - v)).slice(0, 4)).slice(0, 2);
  const hzOpt = (v) => ({ html: `<span class="han">${numOf(v).h}</span>`, v });
  const nOpt = (v) => ({ html: `<span class="numopt">${v}</span>`, v });
  const seqHTML = (arr) => `<span class="han sent seq">${arr.map(v => v === '?' ? '<span class="blankq">?</span>' : numOf(v).h).join(' → ')}</span>`;
  function numQ(kind, v) {
    const w = numOf(v), d = nearTwo(v);
    // 해설 첫 줄: "정답은 一(한 일)이에요!" (숫자를 고르는 문제는 "정답은 숫자 1이에요!")
    const hz = `${w.h}(${w.hun})`;
    const card = kind === 'h2n' ? `정답은 숫자 ${josa(v, '이에요/예요')}!<br><b>${hz}</b> · ${w.p}` : `정답은 <b>${hz}</b>${pp(hz, '이에요/예요')}!<br>${w.p} · 숫자 ${v}`;
    const q = { key: kind + v, target: v, words: [w], hint: NUM_HINT[v], explain: card };
    const opts = (make, others) => shuffle([make(v), ...others.map(make)]).map(o => ({ ...o, correct: o.v === v }));
    switch (kind) {
      case 'h2n': Object.assign(q, { prompt: '이 한자는 숫자 몇일까요?', show: `<span class="han">${w.h}</span>`, say: w, options: opts(nOpt, d) }); break;
      case 'n2h': Object.assign(q, { prompt: '이 숫자를 중국어 한자로 쓰면?', show: `<span class="numbig">${v}</span>`, options: opts(hzOpt, d) }); break;
      case 'py2h': Object.assign(q, { prompt: '이 병음에 맞는 한자는 무엇일까요?', show: `<span class="py big t${w.t}">${w.p}</span>`, options: opts(hzOpt, d),
        hint: `‘${w.p}’ 소리는 숫자 ${v}${pp(v, '이에요/예요')}. ${NUM_HINT[v]}` }); break;
      case 'hun2h': Object.assign(q, { prompt: '훈음을 보고 알맞은 한자를 고르세요.', show: `<span class="hun">‘${w.hun}’</span>`, options: opts(hzOpt, d),
        hint: `‘${w.hun}’ → 뜻: ${w.hun.split(' ')[0]} = 숫자 ${v}. ${NUM_HINT[v]}` }); break;
      case 'next': case 'missing': {
        // 앞뒤 숫자를 보여 주고 빈칸 채우기 (v 위치에 ?)
        let seq;
        if (kind === 'next' && v >= 3) seq = [v - 2, v - 1, '?'];
        else if (v === 1) seq = ['?', 2, 3];
        else if (v === 10) seq = [8, 9, '?'];
        else if (v >= 3) seq = [v - 2, v - 1, '?', v + 1];
        else seq = [v - 1, '?', v + 1];
        Object.assign(q, { prompt: kind === 'next' && seq[seq.length - 1] === '?' ? '다음에 올 한자는 무엇일까요?' : '빈칸에 들어갈 한자는 무엇일까요?', show: seqHTML(seq), options: opts(hzOpt, d), hint: '숫자가 하나씩 커져요! 앞의 숫자부터 차례로 세어 보세요.',
          explain: `정답은 <b>${hz}</b>${pp(hz, '이에요/예요')}!<br>` + seq.map(x => x === '?' ? `<b>${w.h}(${v})</b>` : `${numOf(x).h}(${x})`).join(' → '), words: seq.map(x => x === '?' ? w : numOf(x)) });
        q.seq = seq;
        break;
      }
      case 'order': {
        const st = 1 + Math.floor(Math.random() * 8), a = [st, st + 1, st + 2];
        const as = (arr) => arr.map(x => numOf(x).h).join(' → ');
        q.key = 'order' + st; q.target = st;
        Object.assign(q, { prompt: '작은 수부터 차례대로 바르게 놓은 것은?', show: '',
          options: shuffle([{ html: `<span class="han">${as(a)}</span>`, correct: true, ord: a }, { html: `<span class="han">${as([a[0], a[2], a[1]])}</span>`, correct: false, ord: [a[0], a[2], a[1]] }, { html: `<span class="han">${as([a[1], a[0], a[2]])}</span>`, correct: false, ord: [a[1], a[0], a[2]] }]),
          hint: '한자를 숫자로 바꿔서 1, 2, 3처럼 커지는지 확인해 보세요.', explain: '정답은 작은 수부터 차례대로 놓은 거예요!<br>' + a.map(x => `${numOf(x).h}(${x})`).join(' → '), words: a.map(numOf) });
        break;
      }
    }
    return q;
  }
  // 미션마다 4문제: 구역의 숫자가 모두 한 번씩 나오도록
  function numQueue(i) {
    const sets = [[1, 2, 3], [4, 5, 6], [7, 8, 9, 10]];
    const kinds = [['h2n', 'n2h', 'py2h', 'hun2h'], ['h2n', 'py2h', 'hun2h', 'missing'], ['n2h', 'hun2h', 'missing', 'next']];
    // 보스: 5문제 종합 (한자→숫자, 병음→한자, 훈음→한자, 순서, 빠진 숫자)
    if (i === 3) { const vs = shuffle(NUMS.map(n => n.v)); return [['h2n', vs[0]], ['py2h', vs[1]], ['hun2h', vs[2]], ['order', 1], ['missing', vs[3]]].map(([kind, v]) => ({ kind, v })); }
    const set = sets[i], vs = shuffle(set);
    while (vs.length < 4) vs.push(pick(set));
    const ks = shuffle(kinds[i]);
    return vs.map((v, k) => ({ kind: ks[k], v }));
  }
  function numQuestion(m) {
    let e;
    if (quick.on || m.mission === undefined) {
      for (let t = 0; t < 10; t++) { e = { kind: pick(['h2n', 'n2h', 'py2h', 'hun2h', 'missing', 'next', 'order']), v: 1 + Math.floor(Math.random() * 10) }; if (!quiz.last.includes(e.kind + e.v)) break; }
    } else {
      const s = run.ms[m.mission]; e = s.queue[Math.min(s.qi, s.queue.length - 1)]; s.qi++;
    }
    return numQ(e.kind, e.v);
  }


// ----- 배경 장식 -----
  function decorateNumber(g) {
    drawSign(g, 110, ['숫자 계곡', '출발! →'], 84);
    // 돌기둥 몇 개 (글자 없는 장식)
    for (const x of [560, 1300, 2020, 2760]) {
      g.fillStyle = '#2b2838'; g.fillRect(x - 2, GY - 64, 22, 64);
      g.fillStyle = '#8a85a0'; g.fillRect(x, GY - 62, 18, 62); g.fillStyle = '#b3aec4'; g.fillRect(x, GY - 62, 4, 62);
      g.fillStyle = '#5fd0e6'; g.fillRect(x + 7, GY - 50, 4, 6); g.fillStyle = '#d4fbff'; g.fillRect(x + 8, GY - 49, 1, 2);
      g.fillStyle = '#2b2838'; g.fillRect(x - 4, GY - 68, 26, 6);
    }
    drawPaifang(g, GATE_X[3] + 12, STAGE.finalText);
  }
