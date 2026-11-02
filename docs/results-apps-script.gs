// 판다 탐험대 결과 기록 (Google Apps Script)
// 이 코드를 Google 시트의 [확장 프로그램 → Apps Script]에 붙여 넣고 '웹 앱'으로 배포하세요.
// - 학생 게임이 이 주소로 결과를 보내면 '기록' 탭에 한 줄씩 쌓여요.
// - 이 주소를 브라우저에서 열면 오늘의 결과표(학생별)가 보여요. 다른 날은 주소 끝에 ?day=2026-11-03
const SHEET = '기록';
const TZ = 'Asia/Seoul';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['시간', '이름', '차시', '지역', '기록', '미션', '처음 정답', '푼 문제', '별', '처음에 틀린 문제', '걸린 시간(초)', '레벨', '기기']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const kind = { start: '입장', mission: '미션 성공', clear: '클리어' }[d.event] || String(d.event || '');
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

function doGet(e) {
  const day = (e && e.parameter && e.parameter.day) || Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(r => r[0] instanceof Date && Utilities.formatDate(r[0], TZ, 'yyyy-MM-dd') === day);
  const by = {};
  rows.forEach(r => {
    const key = r[1] + '|' + r[2];
    const o = by[key] = by[key] || { name: r[1], lesson: r[2], start: r[0], mission: '-', first: 0, asked: 0, stars: '', wrong: '', clear: null, device: r[12] };
    if (r[4] !== '입장') { o.mission = r[5]; o.first = r[6]; o.asked = r[7]; o.wrong = r[9]; }
    if (r[4] === '클리어') { o.clear = r[0]; o.stars = r[8]; }
  });
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t = (d) => d ? Utilities.formatDate(d, TZ, 'HH:mm') : '-';
  const list = Object.values(by).sort((a, b) => String(a.lesson).localeCompare(String(b.lesson)) || String(a.name).localeCompare(String(b.name)));
  const done = list.filter(o => o.clear).length;
  const rate = (o) => o.asked ? Math.round(o.first / o.asked * 100) + '%' : '-';
  const body = list.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.lesson)}</td><td>${o.clear ? '✅ 클리어' : '진행 중'} (${esc(o.mission)})</td>` +
    `<td>${o.first}/${o.asked} (${rate(o)})</td><td>${o.stars ? '★'.repeat(Number(o.stars)) : '-'}</td><td class="w">${esc(o.wrong).replace(/ \| /g, '<br>')}</td>` +
    `<td>${t(o.start)}</td><td>${t(o.clear)}</td><td>${esc(o.device)}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>판다 탐험대 결과</title>
<style>body{font-family:sans-serif;margin:16px;color:#1d2738}h1{font-size:22px}table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border-bottom:1px solid #d7e2da;padding:6px 8px;text-align:left;vertical-align:top}th{background:#e1f2ea}td.w{font-size:12px;color:#52627a;max-width:420px}
.sum{display:flex;gap:12px;margin:10px 0}.sum div{background:#f3faf6;border-radius:10px;padding:8px 14px}</style></head><body>
<h1>🐼 판다 탐험대 결과 · ${esc(day)}</h1>
<div class="sum"><div>들어온 학생 <b>${list.length}</b></div><div>클리어 <b>${done}</b></div></div>
<p style="font-size:13px;color:#52627a">새 결과를 보려면 브라우저 새로 고침(F5)을 누르세요. 다른 날: 주소 끝에 ?day=2026-11-03 · 원본은 시트의 '기록' 탭</p>
<table><thead><tr><th>이름</th><th>차시</th><th>진행</th><th>처음 정답</th><th>별</th><th>처음에 틀린 문제</th><th>시작</th><th>완료</th><th>기기</th></tr></thead>
<tbody>${body || '<tr><td colspan="9">아직 기록이 없어요.</td></tr>'}</tbody></table></body></html>`;
  return HtmlService.createHtmlOutput(html).setTitle('판다 탐험대 결과');
}
