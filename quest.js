'use strict';
const byId = id => document.getElementById(id);
const query = new URLSearchParams(location.search);
const fragment = new URLSearchParams(location.hash.slice(1));
function parameter(keys, fallback) {
  for (const source of [query, fragment]) {
    for (const key of keys) {
      const value = source.get(key)?.trim();
      if (value) return value.slice(0, 80);
    }
  }
  return fallback;
}
const combinedNames = parameter(['names', 'couple'], '');
const groom = parameter(['groom'], combinedNames ? '' : '덕준');
const bride = parameter(['bride'], combinedNames ? '' : '나연');
const couple = groom && bride ? groom + ' · ' + bride : combinedNames;
const speakers = {
  groom: groom ? groom + ' · 신랑' : '신랑',
  bride: bride ? bride + ' · 신부' : '신부',
  both: couple,
};
const date = parameter(['date'], '2027-01-15');
const time = parameter(['time'], '오후 1시');
const reply = {name:'', wedding:'', lunch:'', note:''};
const chapters = ['별빛 마을에서 인사하기','봉인된 초대장 열기','초대장 펼쳐 보기','법원으로 향하기','답장 작성하기','초대에 답했어요'];
const scene = document.querySelector('.scene');
byId('signature').textContent = '사랑을 담아, ' + couple;
const address = parameter(['address'], '');
const lunchDetails = parameter(['lunchDetails'], '오후 1시 45분 · Old Ellicott City');
function button(label, action) {
  const element = document.createElement('button');
  element.textContent = label;
  element.onclick = action;
  byId('actions').append(element);
  return element;
}
function paragraph(text) {
  const element = document.createElement('p');
  element.textContent = text;
  byId('content').append(element);
}
function field(key, label, multiline = false) {
  const input = document.createElement(multiline ? 'textarea' : 'input');
  const caption = document.createElement('label');
  caption.textContent = label;
  input.id = 'reply-' + key;
  caption.htmlFor = input.id;
  if (!multiline) input.autocomplete = 'name';
  input.maxLength = multiline ? 300 : 60;
  input.required = !multiline;
  input.value = reply[key];
  byId('content').append(caption, input);
  return input;
}
function render(chapter, speaker, message, mood, item = '') {
  byId('objective').textContent = chapters[chapter];
  byId('count').textContent = (chapter + 1) + ' / 6';
  byId('speaker').textContent = speakers[speaker];
  scene.dataset.speaker = speaker;
  byId('speech').textContent = message;
  const moodBadge = byId('mood');
  moodBadge.replaceChildren();
  if (mood === '♥' || mood === '♡') {
    const heart = document.createElement('img');
    heart.className = 'pixel-heart';
    heart.src = 'assets/pixel-heart.svg?v=3';
    heart.alt = '';
    moodBadge.append(heart);
  }
  const smiling = chapter === 2 || chapter === 5;
  scene.dataset.expression = smiling ? 'smile' : 'neutral';
  document.querySelector('figure img').src = smiling ? 'assets/smile.png?v=4' : 'assets/couple.png?v=4';
  const previousChapter = scene.dataset.chapter;
  scene.dataset.chapter = chapter;
  byId('paper').hidden = chapter !== 2;
  byId('quest-label').textContent = chapter === 5 ? '✦　완료' : '✦　퀘스트';
  delete scene.dataset.task;
  const prop = byId('item');
  prop.replaceChildren();
  if (chapter === 1 || chapter === 2) {
    const envelope = document.createElement('img');
    envelope.src = chapter === 1 ? 'assets/heart-envelope.png?v=5' : 'assets/opened.png';
    envelope.alt = '';
    if (chapter === 1) {
      const open = document.createElement('button');
      open.className = 'envelope';
      open.setAttribute('aria-label', '봉인된 초대장 열기');
      open.append(envelope);
      open.onclick = invitation;
      prop.append(open);
    } else {
      prop.append(envelope);
    }
  } else {
    prop.textContent = item;
  }
  byId('place').textContent = chapter >= 3 ? '⌖　눈 내린 법원' : '⌖　별빛 마을';
  scene.classList.toggle('court', chapter >= 3);
  byId('actions').replaceChildren();
  byId('content').replaceChildren();
  if (previousChapter !== undefined) {
    const cue = chapter === 2 ? 'open' : chapter === 5 ? 'seal' : 'step';
    byId('speech').focus({preventScroll: true});
    questTransition(document.querySelector('.dialog'), cue);
  }
}
function welcome() {
  render(0, 'groom', '여기야 여기! 추운데 먼 길 와줘서 고마워.', '♡');
  button('안녕! 손에 든 건 뭐야?', letter);
}
function letter() {
  render(1, 'bride', '소중한 너를 위해 준비한 초대장이야.', '♪');
  paragraph('하트가 찍힌 봉투를 눌러 열어 보세요.');
  document.querySelector('.envelope').focus({preventScroll: true});
}
function invitation() {
  render(2, 'both', '우리 초대를 받아줘서 고마워. 예식장까지 같이 걸을래?', '♥');
  button('두 사람과 법원으로', details);
}
function details() {
  render(3, 'groom', '저기 불 켜진 건물 보이지? 우리가 결혼할 곳이야.', '✦');
  weddingInfo(byId('content'));
  if (replyEndpoint) {
    button('참석 답장 쓰기', () => attendance('wedding'));
  } else {
    paragraph('답장 접수를 준비하고 있어요.');
    button('초대장 다시 보기', invitation);
  }
}
function displayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const day = new Date(value + 'T12:00:00Z');
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value) return value;
  const dateText = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(day);
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    weekday: 'short', timeZone: 'UTC',
  }).format(day);
  return `${dateText} (${weekday})`;
}
function weddingInfo(container) {
  const info = document.createElement('dl');
  info.className = 'event-info';
  const rows = [['날짜', displayDate(date)], ['시간', time], ['장소', 'Howard County Circuit Courthouse']];
  if (address) rows.push(['주소', address]);
  for (const [label, value] of rows) {
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    if (label === '장소') {
      const map = document.createElement('a');
      map.href = 'https://maps.app.goo.gl/FnhP4NMmC6YWfaNEA';
      map.target = '_blank';
      map.rel = 'noopener noreferrer';
      map.className = 'venue-link';
      map.textContent = value;
      detail.append(map);
    } else {
      detail.textContent = value;
    }
    info.append(term, detail);
  }
  container.append(info);
  if (address) {
    const copy = document.createElement('button');
    copy.textContent = '주소 복사';
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(address);
        copy.textContent = '주소를 복사했어요';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(info.lastElementChild);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        copy.textContent = '선택한 주소를 복사해 주세요';
      }
    };
    container.append(copy);
  }

}
const book = byId('letter-book');
function openBook(title, populate) {
  byId('book-title').textContent = title;
  const body = byId('book-details');
  body.replaceChildren();
  populate(body);
  book.showModal();
  questTransition(book, 'open');
}
function showWedding() {
  openBook('예식 정보', container => {
    weddingInfo(container);
    if (reply.wedding === '참석') {
      const heading = document.createElement('h3');
      heading.textContent = '예식 후 식사';
      const details = document.createElement('p');
      details.textContent = lunchDetails;
      container.append(heading, details);
    }
  });
}
byId('keepsake').onclick = showWedding;

function replyStep(key, objective) {
  scene.dataset.task = key;
  byId('objective').textContent = objective;
  byId('quest-label').textContent = '✉　답장';
}
function back(action, editing = false) {
  button(editing ? '수정 취소' : '이전', action).className = 'back';
}
function attendance(key, editing = false, cancelEdit = review) {
  const ceremony = key === 'wedding';
  render(4, ceremony ? 'bride' : 'groom', ceremony ? '법원 예식에 참석해줄 수 있을까?' : '식이 끝난 후 점심을 대접하고 싶어. 참석해줄 수 있을까?', '♪');
  replyStep(key, ceremony ? '예식 참석 여부' : '점심 참석 여부');
  if (!ceremony && lunchDetails) paragraph(lunchDetails);
  const event = ceremony ? '예식' : '점심';
  for (const value of ['참석','불참']) {
    const label = value === '참석' ? event + '에 참석할게' : event + '은 어려워';
    button((reply[key] === value ? '✓ ' : '') + label, () => {
      const previousWedding = reply.wedding;
      reply[key] = value;
      if (ceremony && value === '불참') {
        reply.lunch = '불참';
      } else if (ceremony && (!editing || previousWedding !== value)) {
        attendance('lunch', editing, () => {
          reply.wedding = previousWedding;
          review();
        });
        return;
      }
      if (editing) review();
      else guest();
    });
  }
  back(editing ? cancelEdit : ceremony ? details : () => attendance('wedding'), editing);
}
function guest(editing = false) {
  render(4, 'groom', '이름을 알려 줄래?', '♡');
  replyStep('name', '이름 적기');
  const input = field('name', '답장에 적을 이름 (필수)');
  const error = document.createElement('p');
  error.id = 'name-error';
  error.setAttribute('role', 'alert');
  input.setAttribute('aria-describedby', error.id);
  byId('content').append(error);
  input.focus({preventScroll: true});
  const next = () => {
    if (!input.value.trim()) {
      error.textContent = '이름을 입력해 주세요.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    reply.name = input.value.trim();
    if (editing) review(); else note();
  };
  input.oninput = () => { error.textContent = ''; input.removeAttribute('aria-invalid'); };
  input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) next(); };
  button(editing ? '수정한 답장 확인하기' : '다음', next);
  back(editing ? review : () => { reply.name = input.value; attendance(reply.wedding === '참석' ? 'lunch' : 'wedding'); }, editing);
}
function note(editing = false) {
  render(4, 'bride', '혹시 우리 둘에게 남기고 싶은 말이 있을까?', '♥');
  replyStep('note', '축하 메시지');
  const input = field('note', '축하 메시지 (선택)', true);
  input.focus({preventScroll: true});
  const confirm = button('', () => { reply.note = input.value.trim(); review(); });
  function updateLabel() {
    confirm.textContent = input.value.trim() ? '답장 확인하기' : '메시지 없이 확인하기';
  }
  updateLabel();
  input.oninput = updateLabel;
  back(editing ? review : () => { reply.note = input.value; guest(); }, editing);
}
function replyRows(container, editable = false) {
  for (const [key, label, edit] of [
    ['name', '하객 이름', () => guest(true)],
    ['wedding', '법원 예식', () => attendance('wedding', true)],
    ['lunch', '예식 후 점심', () => attendance('lunch', true)],
    ['note', '축하 메시지', () => note(true)],
  ]) {
    if (key === 'lunch' && reply.wedding !== '참석') continue;
    const row = document.createElement('div');
    row.className = 'reply-line';
    const value = document.createElement('span');
    value.textContent = label + '　' + (reply[key] || '없음');
    row.append(value);
    if (editable) {
      const change = document.createElement('button');
      change.textContent = '수정';
      change.setAttribute('aria-label', label + ' 수정');
      change.onclick = edit;
      row.append(change);
    }
    container.append(row);
  }
}
function review() {
  render(4, 'groom', '내가 잘 받아 적었는지 봐 줄래?', '✉');
  replyStep('review', '봉인 전 확인');
  replyRows(byId('content'), true);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  byId('content').append(status);
  const submit = button('봉인하고 답장 보내기', async () => {
    if (submit.disabled) return;
    const controls = document.querySelectorAll('#actions button, #content button');
    controls.forEach(control => { control.disabled = true; });
    status.textContent = '편지를 보내는 중이에요…';
    try {
      await sendReply(reply);
    } catch {
      status.textContent = '전송 결과를 확인할 수 없어요. 입력한 답장은 그대로 있어요.';
      controls.forEach(control => { control.disabled = false; });
      submit.textContent = '다시 보내기';
      return;
    }
    done();
  });
  back(() => note());
}
function done() {
  render(5, 'both', '별빛 마을에 들러줘서 고마워요!', '♥', '✦ ♥ ✦');
  byId('objective').textContent = '초대에 답했어요';
  if (reply.wedding === '참석') paragraph('눈 오는 날, 예식장에서 반갑게 인사해요.');
  paragraph('법원 예식 ' + reply.wedding + (reply.wedding === '참석' ? ' · 식사 ' + reply.lunch : ''));
  paragraph('답장 전송을 요청했어요.');
  button('예식 정보 다시 보기', showWedding);
  button('내 답장 보기', () => openBook('내 답장', replyRows));
}
for (let i = 0; i < 42; i++) {
  const flake = document.createElement('i');
  flake.style.left = Math.random()*100 + '%';
  flake.style.animationDuration = (5+Math.random()*6) + 's';
  flake.style.animationDelay = -Math.random()*10 + 's';
  byId('snow').append(flake);
}
welcome();
