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
const couple = parameter(['names', 'couple'], '우리 두 사람');
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
function render(chapter, message, mood, item = '') {
  byId('objective').textContent = chapters[chapter];
  byId('count').textContent = (chapter + 1) + ' / 6';
  byId('speaker').textContent = couple + ' · 예비부부';
  byId('speech').textContent = message;
  byId('mood').textContent = mood;
  document.querySelector('figure img').src = chapter === 2 || chapter === 5 ? 'assets/smile.png' : 'assets/couple.png';
  byId('item').textContent = item;
  byId('place').textContent = chapter >= 3 ? '⌖　눈 내린 법원' : '⌖　별빛 마을';
  scene.classList.toggle('court', chapter >= 3);
  byId('actions').replaceChildren();
  byId('content').replaceChildren();
  const panel = document.querySelector('.conversation');
  panel.classList.remove('reveal');
  void panel.offsetWidth;
  panel.classList.add('reveal');
}
function welcome() {
  render(0, '어서 와! 눈길을 지나 여기까지 와 줬구나.', '♡');
  paragraph('따뜻한 가로등 아래에서 두 사람이 반갑게 손을 흔든다.');
  button('두 사람에게 인사하기　▸', letter);
}
function letter() {
  render(1, '마침 기다리던 참이야. 이 편지, 받아 줄래?', '♪', '✉');
  paragraph('크림색 봉투에 작은 별 모양 밀랍 인장이 찍혀 있다.');
  button('봉투 받아 열기　✉', invitation);
}
function invitation() {
  render(2, '우리, 결혼해요!', '♥', '💌');
  paragraph('소중한 당신에게\n눈꽃이 내려앉은 겨울 마을에서 평생을 함께하기로 했어요. 우리 이야기의 첫 장을 함께 열어 주세요.\n사랑을 담아, ' + couple);
  button('두 사람과 법원으로　▸', details);
}
function details() {
  render(3, '여기가 우리가 약속을 나눌 곳이야.', '✦');
  paragraph('예식 날짜　' + date + '\n예식 시간　' + time + '\n장소　Howard County Circuit Courthouse');
  const map = document.createElement('a');
  map.href = 'https://maps.app.goo.gl/FnhP4NMmC6YWfaNEA';
  map.target = '_blank';
  map.rel = 'noopener noreferrer';
  map.textContent = 'Google 지도에서 보기 ↗';
  byId('content').append(map);
  button(finished ? '완료한 답장 보기' : '답장 퀘스트 시작　▸', finished ? done : () => attendance('wedding'));
}
function attendance(key) {
  const ceremony = key === 'wedding';
  render(4, ceremony ? '법원 예식에 함께할 수 있을까?' : '식이 끝나면 함께 점심을 먹을래?', '♪');
  for (const value of ['참석','불참']) {
    const label = value === '참석' ? '응, 함께할게' : '아쉽지만 어려워';
    button((reply[key] === value ? '✓ ' : '') + label, () => {
      reply[key] = value;
      if (ceremony) attendance('lunch');
      else guest();
    });
  }
}
function guest() {
  render(4, '편지에 어떤 이름을 적어 줄까?', '♡');
  const input = field('name', '하객 이름 (필수)');
  const next = () => {
    input.setCustomValidity(input.value.trim() ? '' : '이름을 입력해 주세요.');
    if (!input.reportValidity()) return;
    reply.name = input.value.trim();
    note();
  };
  input.oninput = () => input.setCustomValidity('');
  input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) next(); };
  button('다음　▸', next);
}
function note() {
  render(4, '마지막으로, 우리에게 남기고 싶은 말이 있어?', '♥');
  const input = field('note', '축하 메시지 (선택)', true);
  button('답장 확인하기', () => { reply.note = input.value.trim(); review(); });
}
function review() {
  render(4, '편지를 봉인하기 전에 한 번 읽어 볼래?', '✉');
  paragraph(reply.name + '님의 답장\n법원 예식　' + reply.wedding + '\n예식 후 점심　' + reply.lunch + '\n축하 메시지　' + (reply.note || '없음'));
  paragraph('지금은 미리보기예요. 답장은 이 화면에서만 확인할 수 있어요.');
  button('답장 봉인하기　✦', () => { finished = true; done(); });
  button('내용 수정하기', () => attendance('wedding'));
}
function done() {
  render(5, reply.name + '님, 답장을 완성했어요!', '♥', '✦ ♥ ✦');
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
