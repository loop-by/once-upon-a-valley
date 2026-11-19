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
const groom = parameter(['groom'], '');
const bride = parameter(['bride'], '');
const combinedNames = parameter(['names', 'couple'], '');
const couple = (groom && bride ? [groom, bride].join(' · ') : combinedNames)
  || (groom || bride ? [groom || '신랑', bride || '신부'].join(' · ') : '우리 두 사람');
const speakers = {
  groom: groom ? groom + ' · 신랑' : '신랑',
  bride: bride ? bride + ' · 신부' : '신부',
  both: couple,
};
const date = parameter(['date'], '추후 안내');
const time = parameter(['time'], '추후 안내');
const reply = {name:'', wedding:'', lunch:'', note:''};
const chapters = ['겨울 마을에서 인사하기','봉인된 편지 받기','초대장 펼쳐 보기','법원으로 향하기','답장 작성하기','편지 봉인 완료'];
const scene = document.querySelector('.scene');
byId('welcome-names').textContent = groom || bride || combinedNames ? couple : '겨울 마을의 결혼식';
byId('signature').textContent = '사랑을 담아, ' + couple;
const address = parameter(['address'], '');
const lunchDetails = parameter(['lunchDetails'], '');
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
  byId('mood').textContent = mood;
  document.querySelector('figure img').src = chapter === 2 || chapter === 5 ? 'assets/smile.png' : 'assets/couple.png';
  const previousChapter = scene.dataset.chapter;
  scene.dataset.chapter = chapter;
  byId('paper').hidden = chapter !== 2;
  byId('quest-label').textContent = chapter === 5 ? '✦　완료' : '✦　퀘스트';
  delete scene.dataset.task;
  const prop = byId('item');
  prop.replaceChildren();
  if (chapter === 1 || chapter === 2) {
    const envelope = document.createElement('img');
    envelope.src = chapter === 1 ? 'assets/sealed.png' : 'assets/opened.png';
    envelope.alt = '';
    if (chapter === 1) {
      const open = document.createElement('button');
      open.className = 'envelope';
      open.setAttribute('aria-label', '봉인된 편지 열기');
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
  render(0, 'groom', '여기야, 여기! 발 시리지? 여기 가로등 아래로 와. 네게 줄 게 있어.', '♡');
  button('왔어! 손에 든 건 뭐야?', letter);
}
function letter() {
  render(1, 'bride', '장갑 끼고는 리본을 못 묶겠더라. 그래서 도장을 꾹 찍었어. 자, 네 거야.', '♪');
  button('봉투 받아 열기　✉', invitation);
}
function invitation() {
  render(2, 'both', '우리 편지, 받아 줘서 고마워. 예식장까지 같이 걸을래?', '♥');
  button('두 사람과 법원으로', details);
}
function details() {
  render(3, 'groom', '저기 불 켜진 창 보이지? 우리가 결혼할 곳이야.', '✦');
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
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC',
  }).format(day);
}
function weddingInfo(container) {
  const info = document.createElement('dl');
  info.className = 'event-info';
  const rows = [['날짜', displayDate(date)], ['현지 시간', time], ['장소', 'Howard County Circuit Courthouse']];
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
function showWedding() { openBook('예식 정보', weddingInfo); }
byId('keepsake').onclick = showWedding;

function replyStep(key, objective) {
  scene.dataset.task = key;
  byId('objective').textContent = objective;
  byId('quest-label').textContent = '✉　답장';
}
function back(action, editing = false) {
  button(editing ? '수정 취소' : '이전', action).className = 'back';
}
function attendance(key, editing = false) {
  const ceremony = key === 'wedding';
  render(4, ceremony ? 'bride' : 'groom', ceremony ? '법원 예식에 참석해줄 수 있을까?' : '식이 끝난 뒤 점심에도 참석해줄 수 있을까?', '♪');
  replyStep(key, ceremony ? '예식 참석 여부' : '점심 참석 여부');
  if (!ceremony && lunchDetails) paragraph(lunchDetails);
  const event = ceremony ? '예식' : '점심';
  for (const value of ['참석','불참']) {
    const label = value === '참석' ? event + '에 참석할게' : event + '은 어려워';
    button((reply[key] === value ? '✓ ' : '') + label, () => {
      reply[key] = value;
      if (editing) review();
      else if (ceremony) attendance('lunch');
      else guest();
    });
  }
  back(editing ? review : ceremony ? details : () => attendance('wedding'), editing);
}
function guest(editing = false) {
  render(4, 'groom', '연필은 내가 들고 있을게. 답장에 이름은 어떻게 적을까?', '♡');
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
  back(editing ? review : () => { reply.name = input.value; attendance('lunch'); }, editing);
}
function note(editing = false) {
  render(4, 'bride', '편지 아래가 한 줄 비었네. 우리 둘한테 남기고 싶은 말 있어?', '♥');
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
  render(4, 'groom', '풀칠하기 전에, 내가 잘 받아 적었는지 봐 줄래?', '✉');
  replyStep('review', '봉인 전 확인');
  replyRows(byId('content'), true);
  paragraph('봉인하면 두 사람의 Google 설문지로 답장을 보내요. 새 창에서 접수 결과를 확인해 주세요.');
  button('봉인하고 답장 보내기', () => {
    sendReply(reply);
    done();
  });
  back(() => note());
}
function done() {
  render(5, 'both', reply.name + '님, 겨울 마을에 들러 줘서 고마워요!', '♥', '✦ ♥ ✦');
  byId('objective').textContent = '답장 봉인 완료';
  paragraph(reply.wedding === '참석' ? '눈 오는 날, 예식장에서 반갑게 인사해요.' : '멀리서도 보내 주는 따뜻한 마음, 고마워요.');
  paragraph('법원 예식 ' + reply.wedding + ' · 점심 ' + reply.lunch);
  paragraph('새로 열린 Google 설문지에서 접수 결과를 확인해 주세요.');
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
