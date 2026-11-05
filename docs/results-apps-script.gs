// 판다 탐험대 결과 기록 (Google Apps Script) · 2판
// 이 코드를 Google 시트의 [확장 프로그램 → Apps Script]에 붙여 넣고 '웹 앱'으로 배포하세요.
// - 학생 게임이 이 주소로 결과를 보내면 '기록' 탭에 한 줄씩 쌓여요.
// - 선생님 결과 페이지(teacher.html)가 이 주소에서 기록을 읽어 가요(?format=json).
// - 이 주소를 브라우저에서 그냥 열면 오늘의 간단한 결과표가 보여요. 다른 날은 주소 끝에 ?day=2026-11-03
const SHEET = '기록';
const TZ = 'Asia/Seoul';
const VERSION = 2;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['시간', '닉네임', '차시', '지역', '기록', '미션', '처음 정답', '푼 문제', '별', '처음에 틀린 문제', '걸린 시간(초)', '레벨', '기기']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const kind = { start: '입장', mission: '미션 성공', clear: '클리어', test: '연결 확인' }[d.event] || String(d.event || '');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_().appendRow([new Date(), String(d.name || '').slice(0, 20), String(d.lesson || ''), String(d.stage || ''), kind,
        String(d.mission || ''), Number(d.firstTry) || 0, Number(d.asked) || 0, d.stars || '', String(d.wrong || '').slice(0, 800),
        Number(d.secs) || 0, Number(d.level) || 0, String(d.device || '')]);
    } finally { lock.releaseLock(); }
  } catch (err) { /* 잘못된 요청은 무시 */ }
  return ContentService.createTextOutput('ok');
}

function dayOf_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }

// 선생님 결과 페이지용: 날짜 범위의 기록을 JSON(또는 JSONP)으로
function dataOut_(p) {
  const from = p.from || p.day || dayOf_(new Date()), to = p.to || from;
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(r => r[0] instanceof Date && dayOf_(r[0]) >= from && dayOf_(r[0]) <= to)
    .map(r => ({ t: r[0].toISOString(), day: dayOf_(r[0]), name: String(r[1]), lesson: String(r[2]), stage: String(r[3]), kind: String(r[4]),
      mission: String(r[5]), first: Number(r[6]) || 0, asked: Number(r[7]) || 0, stars: Number(r[8]) || 0, wrong: String(r[9] || ''),
      secs: Number(r[10]) || 0, level: Number(r[11]) || 0, device: String(r[12] || '') }));
  const body = JSON.stringify({ ok: true, version: VERSION, from: from, to: to, rows: rows });
  const cb = String(p.callback || '');
  if (/^[A-Za-z_$][\w$]{0,40}$/.test(cb)) return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.format === 'json' || p.callback) return dataOut_(p);
  const day = p.day || dayOf_(new Date());
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(r => r[0] instanceof Date && dayOf_(r[0]) === day && r[4] !== '연결 확인');
  const by = {};
  rows.forEach(r => {
    const key = r[1] + '|' + r[2];
    const o = by[key] = by[key] || { name: r[1], lesson: r[2], start: r[0], mission: '-', first: 0, asked: 0, stars: '', wrong: '', clear: null, device: r[12] };
    if (r[4] !== '입장') { o.mission = r[5]; o.first = r[6]; o.asked = r[7]; o.wrong = r[9]; }
    if (r[4] === '클리어') { o.clear = r[0]; o.stars = r[8]; }
  });
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t = (d) => d ? Utilities.formatDate(d, TZ, 'HH:mm') : '-';
  const list = Object.values(by).sort((a, b) => String(a.lesson).localeCompare(String(b.lesson)) || (b.first - a.first) || String(a.name).localeCompare(String(b.name)));
  const done = list.filter(o => o.clear).length;
  const rate = (o) => o.asked ? Math.round(o.first / o.asked * 100) + '%' : '-';
  const body = list.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.lesson)}</td><td>${o.clear ? '✅ 클리어' : '진행 중'} (${esc(o.mission)})</td>` +
    `<td>${o.first}/${o.asked} (${rate(o)})</td><td>${o.stars ? '★'.repeat(Number(o.stars)) : '-'}</td><td class="w">${esc(o.wrong).replace(/ \| /g, '<br>')}</td>` +
    `<td>${t(o.start)}</td><td>${t(o.clear)}</td><td>${esc(o.device)}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>판다 탐험대 선생님 화면</title>
<style>body{font-family:sans-serif;margin:16px;color:#1d2738}h1{font-size:22px}table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border-bottom:1px solid #d7e2da;padding:6px 8px;text-align:left;vertical-align:top}th{background:#e1f2ea}td.w{font-size:12px;color:#52627a;max-width:420px}
.sum{display:flex;gap:12px;margin:10px 0}.sum div{background:#f3faf6;border-radius:10px;padding:8px 14px}</style></head><body>
<h1>🐼 판다 탐험대 선생님 화면 · 닉네임별 점수 · ${esc(day)}</h1>
<div class="sum"><div>들어온 닉네임 <b>${list.length}</b></div><div>클리어 <b>${done}</b></div></div>
<p style="font-size:13px;color:#52627a">새 결과를 보려면 브라우저 새로 고침(F5)을 누르세요. 다른 날: 주소 끝에 ?day=2026-11-03 · 원본은 시트의 '기록' 탭</p>
<table><thead><tr><th>닉네임</th><th>차시</th><th>진행</th><th>점수 (처음에 맞힌 문제)</th><th>별</th><th>처음에 틀린 문제</th><th>시작</th><th>완료</th><th>기기</th></tr></thead>
<tbody>${body || '<tr><td colspan="9">아직 기록이 없어요.</td></tr>'}</tbody></table></body></html>`;
  return HtmlService.createHtmlOutput(html).setTitle('판다 탐험대 선생님 화면');
}
