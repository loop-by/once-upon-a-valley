'use strict';

// Set these public values from the wedding form's prefilled link.
// Keep the destination in the site configuration so guest links cannot redirect replies.
const weddingForm = {
  responderUrl: '',
  fields: {name: '', wedding: '', lunch: '', note: ''},
  choices: {
    wedding: {'참석': '참석', '불참': '불참'},
    lunch: {'참석': '참석', '불참': '불참'},
  },
};

function googleReplyEndpoint(config) {
  const match = /^https:\/\/docs\.google\.com\/forms\/d\/e\/([A-Za-z0-9_-]+)\/viewform(?:\?[^#]*)?$/.exec(config.responderUrl);
  const entries = Object.values(config.fields);
  if (!match || !entries.every(id => /^entry\.\d+$/.test(id)) || new Set(entries).size !== 4) return null;
  return 'https://docs.google.com/forms/d/e/' + match[1] + '/formResponse';
}

const replyEndpoint = googleReplyEndpoint(weddingForm);

function sendReply(reply) {
  if (!replyEndpoint) return;
  const form = document.createElement('form');
  form.method = 'post';
  form.action = replyEndpoint;
  form.target = '_blank';
  form.rel = 'noopener';
  for (const [key, entry] of Object.entries(weddingForm.fields)) {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = entry;
    field.value = weddingForm.choices[key]?.[reply[key]] ?? reply[key];
    form.append(field);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}
