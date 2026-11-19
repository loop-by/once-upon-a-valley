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
let finished = false;
function button(label, action) {
  const element = document.createElement('button');
  element.textContent = label;
  element.onclick = action;
  byId('actions').append(element);
}
function paragraph(text) {
  const element = document.createElement('p');
  element.textContent = text;
  byId('content').append(element);
}
function field(key, label, multiline = false) {
  const input = document.createElement(multiline ? 'textarea' : 'input');
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  input.maxLength = multiline ? 300 : 60;
  input.required = !multiline;
  input.value = reply[key];
  byId('content').append(input);
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
  byId('keepsake').hidden = chapter < 2;
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
    questTransition(document.querySelector('.dialog'), cue);
  }
}
function welcome() {
  render(0, 'groom', '여기야, 여기! 발 시리지? 방금 눈 쓸어 뒀어. 내 발자국 밟고 와.', '♡');
  button('왔어! 손에 든 건 뭐야?', letter);
}
function letter() {
  render(1, 'bride', '장갑 끼고는 리본을 못 묶겠더라. 그래서 도장을 꾹 찍었어. 자, 네 거야.', '♪');
  button('봉투 받아 열기　✉', invitation);
}
function invitation() {
  render(2, 'both', '우리, 결혼해요!', '♥');
  paragraph('소중한 당신에게\n이번 겨울, 우리가 부부가 돼요. 그날 고개를 들었을 때 당신 얼굴이 보이면 참 좋겠어요.\n사랑을 담아, ' + couple);
  button('두 사람과 법원으로　▸', details);
}
function details() {
  render(3, 'groom', '저기 불 켜진 창 보이지? 우리가 결혼할 곳이야. 찾아올 땐 편지 뒷장의 지도를 봐.', '✦');
  weddingInfo(byId('content'));
  button(finished ? '완료한 답장 보기' : '답장 퀘스트 시작　▸', finished ? done : () => attendance('wedding'));
}
function weddingInfo(container) {
  const info = document.createElement('dl');
  info.className = 'event-info';
  for (const [label, value] of [['날짜', date], ['시간', time], ['장소', 'Howard County Circuit Courthouse']]) {
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    info.append(term, detail);
  }
  container.append(info);
  const map = document.createElement('a');
  map.href = 'https://maps.app.goo.gl/FnhP4NMmC6YWfaNEA';
  map.target = '_blank';
  map.rel = 'noopener noreferrer';
  map.textContent = 'Google 지도에서 보기 ↗';
  map.className = 'map-link';
  container.append(map);
}
weddingInfo(byId('book-details'));
const letterBook = byId('letter-book');
byId('keepsake').onclick = () => {
  letterBook.showModal();
  questTransition(letterBook, 'open');
};
letterBook.addEventListener('close', () => questTransition(document.querySelector('.dialog'), 'step'));
function attendance(key, afterChoice) {
  const ceremony = key === 'wedding';
  render(4, ceremony ? 'bride' : 'groom', ceremony ? '법원 예식에 참석해줄 수 있을까?' : '식이 끝난 뒤 점심에도 참석해줄 수 있을까?', '♪');
  for (const value of ['참석','불참']) {
    const label = value === '참석' ? '응, 함께할게' : '아쉽지만 어려워';
    button((reply[key] === value ? '✓ ' : '') + label, () => {
      reply[key] = value;
      if (afterChoice) afterChoice();
      else if (ceremony) attendance('lunch');
      else guest();
    });
  }
}
function guest(afterSave = note) {
  render(4, 'groom', '연필은 내가 들고 있을게. 답장에 이름은 어떻게 적을까?', '♡');
  const input = field('name', '하객 이름 (필수)');
  const next = () => {
    input.setCustomValidity(input.value.trim() ? '' : '이름을 입력해 주세요.');
    if (!input.reportValidity()) return;
    reply.name = input.value.trim();
    afterSave();
  };
  input.oninput = () => input.setCustomValidity('');
  input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) next(); };
  button(afterSave === review ? '수정한 답장 확인하기' : '다음　▸', next);
}
function note() {
  render(4, 'bride', '편지 아래가 한 줄 비었네. 우리 둘한테 남기고 싶은 말 있어?', '♥');
  const input = field('note', '축하 메시지 (선택)', true);
  button('답장 확인하기', () => { reply.note = input.value.trim(); review(); });
}
function review() {
  render(4, 'groom', '잠깐, 풀칠하기 전에! 내가 잘 받아 적었는지 봐 줄래?', '✉');
  for (const [key, label, edit] of [
    ['name', '이름', () => guest(review)],
    ['wedding', '예식', () => attendance('wedding', review)],
    ['lunch', '점심', () => attendance('lunch', review)],
    ['note', '메시지', note],
  ]) {
    const row = document.createElement('div');
    row.className = 'reply-line';
    const value = document.createElement('span');
    value.textContent = label + '　' + (reply[key] || '없음');
    const change = document.createElement('button');
    change.textContent = '수정';
    change.setAttribute('aria-label', label + ' 수정');
    change.onclick = edit;
    row.append(value, change);
    byId('content').append(row);
  }
  paragraph('지금은 미리보기예요. 답장은 이 화면에서만 확인할 수 있어요.');
  button('답장 봉인하기　✦', () => { finished = true; done(); });
}
function done() {
  render(5, 'both', reply.name + '님, 겨울 마을에 들러 줘서 고마워요!', '♥', '✦ ♥ ✦');
  paragraph(reply.wedding === '참석' ? '우리의 약속을 함께 지켜봐 준다니 기뻐. 예식 날 만나!' : '멀리서 보내 준 따뜻한 마음, 오래 간직할게.');
  paragraph(reply.lunch === '참석' ? '점심 식탁에도 자리를 마련해 둘게!' : '점심 모임은 불참으로 적었어.');
  button('결혼식 정보 다시 보기', details);
}
for (let i = 0; i < 42; i++) {
  const flake = document.createElement('i');
  flake.style.left = Math.random()*100 + '%';
  flake.style.animationDuration = (5+Math.random()*6) + 's';
  flake.style.animationDelay = -Math.random()*10 + 's';
  byId('snow').append(flake);
}
welcome();
