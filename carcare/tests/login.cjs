const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const accounts = source.slice(source.indexOf('  const demoUsers ='), source.indexOf('  const products ='));
const validation = source.slice(source.indexOf('  $$("form[data-validate]")'), source.indexOf('  // Existing static product links'));
function login(email, password, remember = true) {
  const handlers = {};
  const status = {};
  const field = { classList: { toggle() {} } };
  function input(value) {
    return {value, dataset: {}, setCustomValidity() {}, checkValidity() {return Boolean(this.value)}, closest() {return field}, setAttribute() {}, focus() {}};
  }
  const emailInput = input(email), passwordInput = input(password);
  const form = {id: 'loginForm', addEventListener(type, fn) {handlers[type] = fn}};
  const localStorage = new Map(), sessionStorage = new Map();
  for (const storage of [localStorage, sessionStorage]) {
    storage.setItem = storage.set.bind(storage);
    storage.removeItem = storage.delete.bind(storage);
    storage.set('carcare.session', 'old session');
  }
  const context = {
    $(selector) {return ({'.status': status, '#le': emailInput, '#lp': passwordInput, '#rm': {checked: remember}})[selector] || null},
    $$(selector) {return selector === 'form[data-validate]' ? [form] : [emailInput, passwordInput]},
    localStorage, sessionStorage, location: {href: 'login.html'},
  };
  vm.runInNewContext(accounts + validation, context);
  handlers.submit({preventDefault() {}});
  return {...context, status};
}
for (const [id, role, destination] of [[1, 'user', 'index.html'], [2, 'admin', 'admin-overview.html'], [3, 'supplier', 'supplier-overview.html']]) {
  const result = login('  ' + role.toUpperCase() + '@CARCARE.COM  ', '123');
  assert.equal(result.location.href, destination);
  const session = JSON.parse(result.localStorage.get('carcare.session'));
  assert.equal(session.id, id);
  assert.equal(session.role, role);
  assert(!('password' in session));
  assert(!result.sessionStorage.has('carcare.session'));
}
const tab = login('user@carcare.com', '123', false);
assert(!tab.localStorage.has('carcare.session'));
assert.equal(JSON.parse(tab.sessionStorage.get('carcare.session')).role, 'user');
for (const [email, password] of [['admin@carcare.com', 'wrong'], ['unknown@carcare.com', '123'], ['user@carcare.com', '']]) {
  const result = login(email, password);
  assert.equal(result.location.href, 'login.html');
  assert.equal(result.status.className, 'status bad');
}
const html = fs.readFileSync(path.join(root, 'login.html'), 'utf8');
assert(html.includes('id="loginForm"'));
assert(!html.includes('data-min="8"'));
const workspaceStart = source.lastIndexOf('  if ($(".ws"))');
const bannerEnd = source.indexOf('    $$(\'input[type="text"]\')', workspaceStart);
const banner = source.slice(workspaceStart, bannerEnd) + '\n}';
const admins = fs.readdirSync(root).filter(name => /^admin-.*\.html$/.test(name));
assert.equal(admins.length, 6);
for (const filename of [...admins, 'supplier-overview.html']) {
  let count = 0;
  vm.runInNewContext(banner, {
    $: () => true, path: filename,
    document: {createElement: () => ({})}, main: {prepend() {count++}},
  });
  assert.equal(count, filename.startsWith('admin-') ? 0 : 1);
}
console.log('PASS: three role logins, redirects, invalid credentials, session storage, password exclusion, and notice removal on all six admin pages.');
