/* ============ E-UJIAN MIN 3 MUKOMUKO — app.js ============ */
(function () {
  'use strict';

  var DATA = window.EXAM_DATA;
  var MAPEL_LIST = [
    "Al-Qur'an Hadis", 'Akidah Akhlak', 'Fiqih', 'SKI', 'Bahasa Arab',
    'Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PKn', 'PJOK', 'SBdP', 'Bahasa Inggris'
  ];
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------- helpers ---------------- */
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  var store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* ignore */ }
    },
    del: function (key) {
      try { localStorage.removeItem(key); } catch (err) { /* ignore */ }
    }
  };

  function safeImageSrc(value) {
    var src = String(value || '');
    if (/^data:image\/(png|jpe?g|webp);base64,/i.test(src)) return src;
    if (/^(https?:)?\/\//i.test(src)) return src;
    return '';
  }

  function compressImageFile(file, maxSide) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
        reject(new Error('Format gambar harus PNG, JPG, atau WEBP.'));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error('Ukuran file gambar maksimal 8 MB.'));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Gagal membaca file gambar.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Gambar tidak dapat dibuka.')); };
        img.onload = function () {
          var side = maxSide || 900;
          var scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var levels = [0.82, 0.7, 0.58];
          var data = canvas.toDataURL('image/jpeg', levels[0]);
          for (var i = 1; i < levels.length && data.length > 320 * 1024; i++) {
            data = canvas.toDataURL('image/jpeg', levels[i]);
          }
          resolve(data);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function questionImageFieldHTML(prefix) {
    return '<div class="field"><label>Gambar Soal (opsional)</label>' +
        '<div class="img-upload" id="' + prefix + 'Box">' +
          '<img id="' + prefix + 'Preview" alt="Pratinjau gambar soal">' +
          '<div class="img-upload-actions">' +
            '<button type="button" class="btn outline sm" id="' + prefix + 'Pick">' + icon('image') + ' Pilih Gambar</button>' +
            '<button type="button" class="btn ghost sm" id="' + prefix + 'Remove">' + icon('x') + ' Hapus</button>' +
            '<span class="hint" id="' + prefix + 'Hint">PNG/JPG/WEBP, otomatis dikompres.</span>' +
          '</div>' +
        '</div>' +
        '<input type="file" id="' + prefix + 'File" accept="image/png,image/jpeg,image/webp" hidden>' +
      '</div>';
  }

  function setupQuestionImageField(prefix, initial) {
    var box = document.getElementById(prefix + 'Box');
    if (!box) return null;
    var state = { value: safeImageSrc(initial) };
    var img = document.getElementById(prefix + 'Preview');
    var file = document.getElementById(prefix + 'File');
    var pick = document.getElementById(prefix + 'Pick');
    var remove = document.getElementById(prefix + 'Remove');
    var hint = document.getElementById(prefix + 'Hint');

    function paint() {
      var src = safeImageSrc(state.value);
      if (src) {
        img.src = src;
        img.style.display = 'block';
        remove.style.display = '';
        if (hint) hint.textContent = 'Gambar siap disimpan.';
      } else {
        img.removeAttribute('src');
        img.style.display = 'none';
        remove.style.display = 'none';
        if (hint) hint.textContent = 'PNG/JPG/WEBP, otomatis dikompres.';
      }
    }

    if (pick && file) {
      pick.onclick = function () { file.click(); };
      file.onchange = function () {
        var f = file.files && file.files[0];
        file.value = '';
        if (!f) return;
        if (hint) hint.textContent = 'Memproses gambar...';
        compressImageFile(f).then(function (data) {
          state.value = data;
          paint();
          toast('Gambar soal siap disimpan.');
        }).catch(function (err) {
          if (hint) hint.textContent = 'PNG/JPG/WEBP, otomatis dikompres.';
          toast(err && err.message ? err.message : 'Gambar gagal diproses.', 'danger');
        });
      };
    }
    if (remove) {
      remove.onclick = function () { state.value = ''; paint(); };
    }
    paint();
    return state;
  }

  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function parseDate(iso) { return new Date(iso + 'T00:00:00'); }

  function fmtFullDate(iso) {
    return parseDate(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function fmtDateOnly(iso) {
    return parseDate(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function dayNumber(iso) { return parseDate(iso).getDate(); }
  function monthShort(iso) { return MONTHS_SHORT[parseDate(iso).getMonth()]; }

  function daysUntil(iso) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var target = parseDate(iso);
    return Math.max(0, Math.round((target - today) / 86400000));
  }

  function num1(value) {
    return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function truncate(text, max) {
    var str = String(text || '');
    return str.length > max ? str.slice(0, max - 1).trim() + '…' : str;
  }

  function initials(name) {
    var parts = String(name || '').replace(/,/g, '').split(/\s+/).filter(function (word) {
      return word && !/\./.test(word) && !/^(bin|binti|dan)$/i.test(word);
    });
    var result = parts.slice(0, 2).map(function (word) { return word.charAt(0); }).join('');
    return (result || String(name || '?').slice(0, 2)).toUpperCase();
  }

  function todayLabel() {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  var ROLE_LABEL = { siswa: 'Siswa', guru: 'Guru', admin: 'Admin', kepala: 'Kepala Madrasah' };

  function getPasswords() {
    var saved = store.get('eujian.passwords', {});
    return saved && typeof saved === 'object' ? saved : {};
  }

  function passwordFor(acc) {
    var saved = getPasswords();
    return typeof saved[acc.username] === 'string' ? saved[acc.username] : acc.password;
  }

  function isAccountActive(username) {
    var statuses = store.get('eujian.akun', {});
    return statuses[username] !== false;
  }

  function getProfiles() {
    var saved = store.get('eujian.profiles', {});
    return saved && typeof saved === 'object' ? saved : {};
  }

  function withProfile(acc) {
    if (!acc) return acc;
    var profile = getProfiles()[acc.username];
    if (!profile || !profile.name) return acc;
    var copy = {};
    Object.keys(acc).forEach(function (key) { copy[key] = acc[key]; });
    copy.name = profile.name;
    return copy;
  }

  /* ---------------- icons ---------------- */
  var ICON_PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    building: '<path d="M4 21V6l8-3 8 3v15"/><path d="M2 21h20"/><path d="M9 21v-5h6v5"/><path d="M8 9h.01M12 9h.01M16 9h.01M8 12.5h.01M12 12.5h.01M16 12.5h.01"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'user-check': '<path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    'bar-chart': '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 5-5"/>',
    'alert-triangle': '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4s1-1 4-1 5 1 8 1 4-1 4-1v11s-1 1-4 1-5-1-8-1-4 1-4 1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    graduation: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.6-9.6M17 6l3 3M14 9l2 2"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="M8.2 12.6 7 22l5-3 5 3-1.2-9.4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>'
  };

  function icon(name, cls) {
    var path = ICON_PATHS[name] || '';
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function hydrateIcons(root) {
    $$('[data-icon]', root || document).forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-icon'));
    });
  }

  /* ---------------- toast / modal ---------------- */
  function toast(message, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'danger' ? ' danger' : '');
    el.innerHTML = icon(type === 'danger' ? 'alert-triangle' : 'check-circle') + '<span>' + esc(message) + '</span>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(function () { el.remove(); }, 200);
    }, 3200);
  }

  function openModal(opts) {
    var root = document.getElementById('modal-root');
    if (!root) return null;
    root.innerHTML =
      '<div class="modal-backdrop">' +
        '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true">' +
          '<div class="modal-head">' +
            '<div><h3>' + (opts.title || '') + '</h3>' + (opts.subtitle ? '<p>' + opts.subtitle + '</p>' : '') + '</div>' +
            '<button type="button" class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button>' +
          '</div>' +
          '<div class="modal-body">' + (opts.body || '') + '</div>' +
          (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
        '</div>' +
      '</div>';
    document.body.style.overflow = 'hidden';
    return root;
  }

  function closeModal() {
    var root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
    document.body.style.overflow = '';
  }

  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      openModal({
        title: opts.title || 'Konfirmasi',
        body: '<p class="modal-message">' + esc(opts.message || '') + '</p>',
        footer: '<button type="button" class="btn outline" id="cfCancel">' + esc(opts.cancelLabel || 'Batal') + '</button>' +
                '<button type="button" class="btn ' + (opts.danger ? 'danger' : '') + '" id="cfOk">' + esc(opts.confirmLabel || 'Ya, lanjutkan') + '</button>'
      });
      var ok = document.getElementById('cfOk');
      var cancel = document.getElementById('cfCancel');
      if (ok) ok.onclick = function () { closeModal(); resolve(true); };
      if (cancel) cancel.onclick = function () { closeModal(); resolve(false); };
    });
  }

  /* ---------------- shared data helpers ---------------- */
  function getSettings() {
    var saved = store.get('eujian.settings', {});
    return Object.assign({}, DATA.defaultSettings, saved || {});
  }

  function getSession() { return store.get('eujian.session', null); }

  function getStudents() {
    var extra = store.get('eujian.studentsExtra', []);
    var deleted = store.get('eujian.studentsDeleted', []);
    return DATA.students.concat(Array.isArray(extra) ? extra : []).filter(function (s) {
      return !Array.isArray(deleted) || deleted.indexOf(s.id) === -1;
    });
  }

  function getStudentAccounts() {
    var seen = {};
    return getStudents().filter(function (s) {
      if (!s || !s.nisn || seen[s.nisn]) return false;
      seen[s.nisn] = true;
      return true;
    }).map(function (s) {
      return {
        role: 'siswa',
        name: s.nama,
        username: String(s.nisn),
        password: '123456',
        detail: 'Kelas ' + s.kelas + ' · NISN ' + s.nisn,
        studentId: s.id,
        status: s.status
      };
    });
  }

  function getTeacherAccounts() {
    var seen = {};
    return getTeachers().filter(function (t) {
      if (!t || !t.nip || seen[t.nip]) return false;
      seen[t.nip] = true;
      return true;
    }).map(function (t) {
      return {
        role: 'guru',
        name: t.nama,
        username: String(t.nip),
        password: '123456',
        detail: (t.mapel || 'Guru') + ' · NIP ' + t.nip,
        teacherId: t.id,
        status: 'Aktif'
      };
    });
  }

  function accountForSession(session) {
    if (!session) return null;
    var all = DATA.accounts.concat(getTeacherAccounts(), getStudentAccounts());
    var acc = all.find(function (a) { return a.username === session.username; }) ||
      all.find(function (a) { return a.role === session.role && a.name === session.name; }) || null;
    return withProfile(acc);
  }

  function baseTeacherName(name) {
    var base = String(name || '').split(',')[0].replace(/\s+/g, ' ').trim();
    for (var i = 0; i < 3; i++) base = base.replace(/^(dra|drs|hj|h|ust|ustad|ustadzah)\.?\s+/i, '');
    return base.toLowerCase();
  }

  function findAccount(accounts, input, role) {
    var q = String(input || '').trim().toLowerCase();
    if (!q) return null;
    var pool = accounts.filter(function (a) { return a.role === role; });
    return pool.find(function (a) {
      return a.username.toLowerCase() === q || String(a.name || '').toLowerCase() === q;
    }) || pool.find(function (a) {
      return baseTeacherName(a.name) === q;
    }) || null;
  }

  function getTeachers() {
    var extra = store.get('eujian.teachersExtra', []);
    var deleted = store.get('eujian.teachersDeleted', []);
    return DATA.teachers.concat(Array.isArray(extra) ? extra : []).filter(function (t) {
      return !Array.isArray(deleted) || deleted.indexOf(t.id) === -1;
    });
  }

  function getQuestions() {
    var extra = store.get('eujian.soalExtra', []);
    var deleted = store.get('eujian.soalDeleted', []);
    return DATA.questions.concat(Array.isArray(extra) ? extra : []).filter(function (q) {
      return !Array.isArray(deleted) || deleted.indexOf(q.id) === -1;
    });
  }

  function getResults() {
    var deleted = store.get('eujian.resultsDeleted', []);
    return DATA.results.filter(function (r) {
      return !Array.isArray(deleted) || deleted.indexOf(r.studentId) === -1;
    });
  }

  function getStudentAttempts() {
    var list = store.get('eujian.attempts', []);
    if (!Array.isArray(list)) return [];
    return list.slice().sort(function (a, b) {
      return new Date(b.at || 0) - new Date(a.at || 0);
    });
  }

  function saveStudentAttemptRecord(rec) {
    if (!rec || !rec.nama || !rec.mapel) return;
    var list = store.get('eujian.attempts', []);
    if (!Array.isArray(list)) list = [];
    var key = (rec.studentId || rec.nama) + '|' + rec.mapel;
    list = list.filter(function (x) {
      return ((x.studentId || x.nama) + '|' + x.mapel) !== key;
    });
    list.unshift(rec);
    store.set('eujian.attempts', list.slice(0, 200));
  }

  var ATTEMPT_HEADERS = ['Dikirim', 'NISN', 'Nama', 'Kelas', 'Mata Pelajaran', 'Tingkat', 'Benar PG', 'Jumlah PG', 'Nilai PG', 'Nilai Maks PG', 'Soal Uraian', 'Waktu Selesai'];

  function attemptRowValues(a) {
    return [a.at || '', a.nisn || '', a.nama || '', a.kelas ? 'Kelas ' + a.kelas : '', a.mapel || '',
      a.tingkat || '', (a.correct || 0) + '/' + (a.pgCount || 0), a.pgCount || 0,
      a.pgScore || 0, a.pgMax || 0, a.essayCount || 0, a.at || ''];
  }

  /* ---------------- Google Sheets (Apps Script Web App) ---------------- */
  var GAS_URL_KEY = 'eujian.gasUrl';
  var GAS_AUTO_KEY = 'eujian.gasAuto';
  var GAS_AUTO_LAST = 'eujian.gasAutoLast';
  var GAS_SHEET_BY_JENIS = {
    'hasil-ujian': 'Hasil E-Ujian',
    'laporan-nilai': 'Laporan Nilai',
    'daftar-peserta': 'Daftar Peserta',
    'berita-acara': 'Berita Acara',
    'hasil-siswa': 'Hasil Siswa'
  };

  function validGasUrl(url) {
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/i.test(String(url || '').trim());
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('Salin otomatis tidak didukung browser ini.'));
    });
  }

  function gasFormPost(url, payload, done) {
    var frameName = 'gas-sync-' + Date.now();
    var iframe = document.createElement('iframe');
    iframe.name = frameName;
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = frameName;
    form.style.display = 'none';
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(function () { if (form.parentNode) form.parentNode.removeChild(form); }, 800);
    setTimeout(function () {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      if (done) done();
    }, 5000);
  }

  function postToGas(url, payload, done) {
    if (!window.fetch) { gasFormPost(url, payload, done); return; }
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () {
      if (done) done();
    }).catch(function () {
      gasFormPost(url, payload, done);
    });
  }

  function gasPayloadFor(cfg) {
    var built = cfg.build();
    var settings = getSettings();
    return {
      app: 'E-Ujian MIN 3 Mukomuko',
      madrasah: settings.namaMadrasah,
      tahunPelajaran: settings.tahunPelajaran,
      semester: settings.semester,
      jenis: cfg.jenis,
      sheet: GAS_SHEET_BY_JENIS[cfg.jenis] || '',
      kelas: cfg.kelasLabel(),
      syncId: cfg.syncId(),
      sentAt: new Date().toISOString(),
      headers: built.headers,
      rows: built.rows
    };
  }

  function sendGasPayload(cfg, cb) {
    var url = String(store.get(GAS_URL_KEY, '') || '').trim();
    if (!validGasUrl(url)) {
      if (cb) cb({ ok: false, reason: 'url' });
      return;
    }
    var payload = gasPayloadFor(cfg);
    if (!payload.rows.length) {
      if (cb) cb({ ok: false, reason: 'empty' });
      return;
    }
    postToGas(url, payload, function () {
      store.set(GAS_AUTO_LAST, payload.syncId);
      if (cb) cb({ ok: true, count: payload.rows.length, sheet: payload.sheet });
    });
  }

  var GAS_SCRIPT = [
    'const SHEET_ID = "";              // kosongkan bila script terikat ke spreadsheet',
    'const SHEET_BY_JENIS = {',
    '  "hasil-ujian": "Hasil E-Ujian",',
    '  "laporan-nilai": "Laporan Nilai",',
    '  "daftar-peserta": "Daftar Peserta",',
    '  "berita-acara": "Berita Acara",',
    '  "hasil-siswa": "Hasil Siswa"',
    '};',
    '',
    'function doPost(e) {',
    '  try {',
    '    var data = {};',
    '    if (e.postData && e.postData.contents) data = JSON.parse(e.postData.contents);',
    '    else if (e.parameter && e.parameter.payload) data = JSON.parse(e.parameter.payload);',
    '    var headers = data.headers || [];',
    '    var rows = data.rows || [];',
    '    if (!headers.length || !rows.length) throw new Error("Data kosong.");',
    '    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();',
    '    var name = SHEET_BY_JENIS[data.jenis] || "Hasil E-Ujian";',
    '    var sh = ss.getSheetByName(name) || ss.insertSheet(name);',
    '    if (sh.getLastRow() === 0) {',
    '      sh.appendRow(headers);',
    '      sh.getRange(1, 1, 1, headers.length).setFontWeight("bold")',
    '        .setBackground("#0f7a63").setFontColor("#ffffff");',
    '      sh.setFrozenRows(1);',
    '    }',
    '    sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);',
    '    return ContentService.createTextOutput(JSON.stringify({ ok: true, sheet: name, rows: rows.length }))',
    '      .setMimeType(ContentService.MimeType.JSON);',
    '  } catch (err) {',
    '    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))',
    '      .setMimeType(ContentService.MimeType.JSON);',
    '  }',
    '}'
  ].join('\n');

  function gasGuideHTML() {
    return '<details class="gas-guide" style="margin-top:14px">' +
        '<summary style="cursor:pointer;font-weight:600;font-size:12.5px;color:#0f7a63">Panduan Apps Script &amp; kode doPost</summary>' +
        '<ol class="steps" style="margin:10px 0 0">' +
          '<li>Buka Google Sheets baru, lalu menu <b>Extensions &rarr; Apps Script</b>.</li>' +
          '<li>Hapus isi <b>Code.gs</b> lalu tempel skrip di bawah (tombol Salin Skrip). Bila sebelumnya memakai skrip versi lama, timpa dengan versi ini.</li>' +
          '<li>Klik <b>Deploy &rarr; New deployment &rarr; Web app</b>. Atur <b>Execute as: Me</b> dan <b>Who has access: Anyone</b>, lalu Deploy dan izinkan akses.</li>' +
          '<li>Salin URL yang berakhiran <b>/exec</b>, tempel di kolom URL menu Sinkron, lalu klik Simpan URL.</li>' +
          '<li>Tekan <b>Kirim Sekarang</b>. Data masuk ke sheet sesuai jenis: Hasil E-Ujian, Laporan Nilai, Daftar Peserta, atau Berita Acara.</li>' +
        '</ol>' +
        '<textarea class="input" id="gasSyncScript" rows="12" readonly style="margin-top:10px;font-family:monospace;font-size:11px;white-space:pre">' + esc(GAS_SCRIPT) + '</textarea>' +
        '<button type="button" class="btn outline sm" id="gasSyncCopy" style="margin-top:8px">' + icon('copy') + ' Salin Skrip</button>' +
        '<p class="hint" style="margin:8px 0 0">Situs ini statis, jadi respons Apps Script tidak bisa dibaca browser. Buka spreadsheet untuk memastikan baris baru masuk.</p>' +
      '</details>';
  }

  function openGasSyncModal(cfg) {
    var savedUrl = String(store.get(GAS_URL_KEY, '') || '');
    var autoOn = !!store.get(GAS_AUTO_KEY, false);
    var jenisLabel = GAS_SHEET_BY_JENIS[cfg.jenis] || 'Hasil E-Ujian';
    openModal({
      title: cfg.title || 'Sinkron ke Google Sheets',
      subtitle: cfg.subtitle || 'Kirim data halaman ini ke Google Sheets melalui Apps Script Web App.',
      size: 'lg',
      body:
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
          '<span class="badge ' + (savedUrl ? 'info' : '') + '" id="gasSyncBadge">' + (savedUrl ? 'Terhubung' : 'Belum terhubung') + '</span>' +
          '<span class="muted small">' + esc(cfg.note || '') + '</span>' +
        '</div>' +
        '<div class="field">' +
          '<label for="gasSyncUrl">URL Web App Apps Script</label>' +
          '<input class="input" id="gasSyncUrl" type="url" placeholder="https://script.google.com/macros/s/AKfycb.../exec" value="' + esc(savedUrl) + '">' +
          '<p class="hint" style="margin-top:6px">Akhiri dengan <b>/exec</b>. Data akan masuk ke sheet <b>' + esc(jenisLabel) + '</b>.</p>' +
        '</div>' +
        (cfg.auto !== false
          ? '<label style="display:flex;gap:8px;align-items:center;font-size:12px;font-weight:500;color:var(--ink-2);margin-top:4px">' +
              '<input type="checkbox" id="gasSyncAuto"' + (autoOn ? ' checked' : '') + '> Kirim otomatis sekali saat halaman dibuka (per hari &amp; per filter)' +
            '</label>'
          : '') +
        gasGuideHTML(),
      footer:
        '<button type="button" class="btn outline" id="gasSyncSave">' + icon('save') + ' Simpan URL</button>' +
        '<button type="button" class="btn" id="gasSyncSend">' + icon('upload') + ' Kirim Sekarang</button>' +
        '<button type="button" class="btn ghost" data-close>Batal</button>'
    });

    var urlEl = document.getElementById('gasSyncUrl');
    var autoEl = document.getElementById('gasSyncAuto');
    var badge = document.getElementById('gasSyncBadge');
    var saveBtn = document.getElementById('gasSyncSave');
    var sendBtn = document.getElementById('gasSyncSend');

    function readUrl() { return urlEl ? urlEl.value.trim() : ''; }
    function readAuto() { return !!(autoEl && autoEl.checked); }
    function setBadge(text, tone) {
      if (!badge) return;
      badge.textContent = text;
      badge.className = 'badge ' + (tone || '');
    }

    if (saveBtn) saveBtn.addEventListener('click', function () {
      var url = readUrl();
      if (url && !validGasUrl(url)) {
        toast('URL harus berupa Web App Apps Script yang berakhiran /exec.', 'danger');
        return;
      }
      store.set(GAS_URL_KEY, url);
      store.set(GAS_AUTO_KEY, readAuto());
      setBadge(url ? 'Terhubung' : 'Belum terhubung', url ? 'info' : '');
      toast(url ? 'Pengaturan Google Sheets disimpan.' : 'URL Google Sheets dikosongkan.');
    });

    if (sendBtn) sendBtn.addEventListener('click', function () {
      var url = readUrl();
      if (!url) { toast('Isi URL Web App Google Apps Script terlebih dahulu.', 'danger'); return; }
      if (!validGasUrl(url)) { toast('URL harus berupa Web App Apps Script yang berakhiran /exec.', 'danger'); return; }
      store.set(GAS_URL_KEY, url);
      store.set(GAS_AUTO_KEY, readAuto());
      var payload;
      try { payload = gasPayloadFor(cfg); } catch (err) { payload = null; }
      if (!payload || !payload.rows.length) { toast('Belum ada data untuk dikirim.', 'danger'); return; }
      sendBtn.disabled = true;
      setBadge('Mengirim…', 'warn');
      postToGas(url, payload, function () {
        store.set(GAS_AUTO_LAST, payload.syncId);
        sendBtn.disabled = false;
        setBadge('Terkirim ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), 'success');
        toast(payload.rows.length + ' baris dikirim ke sheet ' + (payload.sheet || 'Hasil E-Ujian') + '.');
      });
    });

    var copyBtn = document.getElementById('gasSyncCopy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      copyText(GAS_SCRIPT).then(function () {
        toast('Kode Apps Script disalin.');
      }).catch(function () {
        var ta = document.getElementById('gasSyncScript');
        if (ta) { ta.focus(); ta.select(); }
        toast('Tekan Ctrl+C untuk menyalin kode.', 'warn');
      });
    });
  }

  function gasMetaColumns() {
    var s = getSettings();
    return [new Date().toISOString(), s.tahunPelajaran, s.semester];
  }

  function sortedSchedules() {
    return DATA.schedules.slice().sort(function (a, b) {
      return (a.date + a.start).localeCompare(b.date + b.start);
    });
  }

  function getUpcomingSchedules() {
    var now = new Date();
    return sortedSchedules().filter(function (s) {
      return new Date(s.date + 'T' + s.end + ':00') >= now;
    });
  }

  function scheduleStatus(s) {
    var now = new Date();
    var start = new Date(s.date + 'T' + s.start + ':00');
    var end = new Date(s.date + 'T' + s.end + ':00');
    if (now > end) return { label: 'Selesai', cls: 'success' };
    if (now >= start && now <= end) return { label: 'Berlangsung', cls: 'warn' };
    return { label: 'Akan Datang', cls: 'info' };
  }

  function predikat(avg) {
    if (avg >= 90) return 'A';
    if (avg >= 80) return 'B';
    if (avg >= 70) return 'C';
    return 'D';
  }

  function predikatBadge(p) {
    var cls = p === 'A' ? 'success' : p === 'B' ? 'info' : p === 'C' ? 'warn' : 'danger';
    return '<span class="badge ' + cls + '">' + p + '</span>';
  }

  /* ---------------- chrome ---------------- */
  var STAFF_ROLES = ['guru', 'admin', 'kepala'];

  var PAGE_META = {
    home: { title: 'Beranda', subtitle: 'Informasi ujian, jadwal, pengumuman dan statistik.' },
    'beranda-siswa': { title: 'Beranda Siswa', subtitle: 'Jadwal ujian, pengerjaan, dan hasil belajar Anda.' },
    profil: { title: 'Profil Madrasah', subtitle: 'Identitas, visi, misi dan informasi MIN 3 Mukomuko.' },
    login: { title: 'Login', subtitle: 'Login siswa, guru, admin dan kepala madrasah.' },
    'data-siswa': { title: 'Data Siswa', subtitle: 'Data siswa kelas 4, 5 dan 6.' },
    'data-guru': { title: 'Data Guru', subtitle: 'Data guru dan mata pelajaran.' },
    jadwal: { title: 'Jadwal Ujian', subtitle: 'Jadwal ujian berdasarkan kelas dan mata pelajaran.' },
    absensi: { title: 'Absensi Ujian', subtitle: 'Pencatatan kehadiran siswa pada pelaksanaan ujian.' },
    'bank-soal': { title: 'Bank Soal', subtitle: 'Pengelolaan soal pilihan ganda dan uraian.' },
    import: { title: 'Import Soal', subtitle: 'Impor soal dari Excel atau PDF, tinjau, lalu setujui.' },
    ujian: { title: 'Pelaksanaan Ujian', subtitle: 'Halaman pengerjaan ujian siswa.' },
    sinkron: { title: 'Sinkronisasi Soal', subtitle: 'Tarik soal terbaru dari bank soal admin dan guru.' },
    akun: { title: 'Akun Saya', subtitle: 'Ubah kata sandi akun siswa Anda sendiri.' },
    'akun-staf': { title: 'Akun Saya', subtitle: 'Ubah nama dan kata sandi akun Anda.' },
    hasil: { title: 'Hasil Ujian', subtitle: 'Nilai, peringkat dan rekapitulasi hasil ujian.' },
    laporan: { title: 'Cetak Laporan', subtitle: 'Cetak nilai, daftar peserta dan berita acara.' },
    pengaturan: { title: 'Pengaturan', subtitle: 'Pengaturan tahun pelajaran, semester dan akun pengguna.' }
  };

  var NAV_PUBLIC = [
    { group: 'Menu Utama', items: [
      { id: 'home', href: 'index.html', label: 'Beranda', icon: 'home' },
      { id: 'profil', href: 'profil.html', label: 'Profil Madrasah', icon: 'building' },
      { id: 'jadwal', href: 'jadwal-ujian.html', label: 'Jadwal Ujian', icon: 'calendar' },
      { id: 'login', href: 'login.html', label: 'Login', icon: 'login' }
    ]}
  ];

  var NAV_SISWA = [
    { group: 'Portal Siswa', items: [
      { id: 'beranda-siswa', href: 'beranda-siswa.html', label: 'Beranda', icon: 'home' },
      { id: 'jadwal', href: 'jadwal-ujian.html', label: 'Jadwal Ujian', icon: 'calendar' },
      { id: 'ujian', href: 'ujian.html', label: 'Pelaksanaan Ujian', icon: 'monitor' },
      { id: 'sinkron', href: 'sinkron-soal.html', label: 'Sinkronisasi Soal', icon: 'refresh' },
      { id: 'hasil', href: 'hasil-ujian.html', label: 'Hasil Ujian', icon: 'bar-chart' }
    ]},
    { group: 'Informasi', items: [
      { id: 'akun', href: 'akun-siswa.html', label: 'Akun & Kata Sandi', icon: 'key' },
      { id: 'profil', href: 'profil.html', label: 'Profil Madrasah', icon: 'building' }
    ]}
  ];

  var NAV_STAF = [
    { group: 'Menu Utama', items: [
      { id: 'home', href: 'index.html', label: 'Beranda', icon: 'home' },
      { id: 'profil', href: 'profil.html', label: 'Profil Madrasah', icon: 'building' }
    ]},
    { group: 'Data & Ujian', items: [
      { id: 'data-siswa', href: 'data-siswa.html', label: 'Data Siswa', icon: 'users' },
      { id: 'data-guru', href: 'data-guru.html', label: 'Data Guru', icon: 'user-check' },
      { id: 'absensi', href: 'absensi.html', label: 'Absensi Ujian', icon: 'check-circle' },
      { id: 'bank-soal', href: 'bank-soal.html', label: 'Bank Soal', icon: 'file-text' },
      { id: 'import', href: 'import-soal.html', label: 'Import Soal', icon: 'upload' }
    ]},
    { group: 'Hasil & Laporan', items: [
      { id: 'hasil', href: 'hasil-ujian.html', label: 'Hasil Ujian', icon: 'bar-chart' },
      { id: 'laporan', href: 'cetak-laporan.html', label: 'Cetak Laporan', icon: 'printer' }
    ]},
    { group: 'Sistem', items: [
      { id: 'akun-staf', href: 'akun-staf.html', label: 'Akun Saya', icon: 'key' },
      { id: 'pengaturan', href: 'pengaturan.html', label: 'Pengaturan', icon: 'settings' }
    ]}
  ];

  function navForRole(role) {
    if (role === 'siswa') return NAV_SISWA;
    if (STAFF_ROLES.indexOf(role) > -1) return NAV_STAF;
    return NAV_PUBLIC;
  }

  function buildSidebar(page) {
    var s = getSettings();
    var session = getSession();
    var role = session ? session.role : null;
    var groups = navForRole(role).map(function (group) {
      return '<div class="nav-group">' +
        '<div class="nav-label">' + esc(group.group) + '</div>' +
        group.items.map(function (item) {
          return '<a class="nav-item' + (item.id === page ? ' active' : '') + '" href="' + item.href + '">' +
            icon(item.icon) + '<span>' + esc(item.label) + '</span></a>';
        }).join('') +
      '</div>';
    }).join('');

    var footLink = role === 'siswa'
      ? '<a href="jadwal-ujian.html">Lihat jadwal ujian &rarr;</a>'
      : '<a href="pengaturan.html">Ubah pengaturan &rarr;</a>';

    return '<a class="brand" href="' + (role === 'siswa' ? 'beranda-siswa.html' : 'index.html') + '">' +
        '<div class="brand-logo logo-img"><img src="assets/img/logo-kemenag.svg" alt="Logo Kementerian Agama RI"></div>' +
        '<div><strong>E-UJIAN</strong><span>MIN 3 Mukomuko</span></div>' +
      '</a>' +
      '<nav class="sidebar-nav">' + groups + '</nav>' +
      '<div class="sidebar-foot">' +
        '<div class="tp-card">' +
          '<span class="tp-label">Tahun Pelajaran</span>' +
          '<strong>' + esc(s.tahunPelajaran) + ' · ' + esc(s.semester) + '</strong>' +
          footLink +
        '</div>' +
      '</div>';
  }

  function buildTopbar(meta) {
    var session = getSession();
    var userArea = session
      ? '<div class="user-chip">' +
          '<div class="avatar">' + esc(initials(session.name)) + '</div>' +
          '<div class="user-meta"><strong>' + esc(session.name) + '</strong><span>' + esc(ROLE_LABEL[session.role] || session.role) + '</span></div>' +
          '<button class="icon-btn" id="logoutBtn" title="Keluar" aria-label="Keluar">' + icon('logout') + '</button>' +
        '</div>'
      : '<a class="btn" href="login.html">' + icon('login') + ' Masuk</a>';

    return '<button class="icon-btn menu-btn" id="menuBtn" aria-label="Buka menu">' + icon('menu') + '</button>' +
      '<div class="topbar-title"><h1>' + esc(meta.title) + '</h1><p>' + esc(meta.subtitle) + '</p></div>' +
      '<div class="topbar-right">' +
        '<div class="date-chip">' + icon('clock') + '<span>' + esc(todayLabel()) + '</span></div>' +
        userArea +
      '</div>';
  }

  function initChrome() {
    var page = document.body.getAttribute('data-page');
    var meta = PAGE_META[page] || { title: 'E-Ujian MIN 3 Mukomuko', subtitle: '' };
    var sidebar = document.getElementById('sidebar');
    var topbar = document.getElementById('topbar');
    if (sidebar) sidebar.innerHTML = buildSidebar(page);
    if (topbar) topbar.innerHTML = buildTopbar(meta);
    if (!document.querySelector('.sidebar-backdrop')) {
      var backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }
  }

  function denyAccess(message, actions) {
    var main = document.querySelector('main.content');
    if (!main) return;
    main.innerHTML = '<div class="card access-card"><div class="card-body">' +
        '<div class="access-icon">' + icon('shield') + '</div>' +
        '<h3>Akses terbatas</h3><p>' + esc(message) + '</p>' +
        '<div class="access-actions">' + actions + '</div>' +
      '</div></div>';
    hydrateIcons();
  }

  function guardPage(page, session) {
    var role = session ? session.role : null;
    var isStaff = STAFF_ROLES.indexOf(role) > -1;
    if (page === 'home' && role === 'siswa') {
      window.location.replace('beranda-siswa.html');
      return true;
    }
    if (['data-siswa', 'data-guru', 'bank-soal', 'import', 'absensi', 'laporan', 'pengaturan'].indexOf(page) > -1 && !isStaff) {
      denyAccess(
        role === 'siswa'
          ? 'Halaman ini khusus guru, admin, dan kepala madrasah. Akun siswa tidak memiliki akses ke area pengelolaan.'
          : 'Halaman pengelolaan hanya dapat dibuka oleh guru, admin, atau kepala madrasah. Silakan masuk melalui portal staf.',
        role === 'siswa'
          ? '<a class="btn" href="beranda-siswa.html">Kembali ke Beranda Siswa</a><a class="btn outline" href="login-staf.html">Masuk Portal Staf</a>'
          : '<a class="btn" href="login-staf.html">Masuk Portal Staf</a><a class="btn outline" href="login.html">Pilih Portal</a>'
      );
      return true;
    }
    if (page === 'ujian' && role !== 'siswa') {
      denyAccess(
        isStaff
          ? 'Halaman pengerjaan ujian hanya dapat diakses siswa melalui portal siswa.'
          : 'Silakan masuk melalui portal siswa untuk mengerjakan ujian.',
        isStaff
          ? '<a class="btn" href="index.html">Kembali ke Beranda</a>'
          : '<a class="btn" href="login-siswa.html">Masuk Portal Siswa</a><a class="btn outline" href="login.html">Pilih Portal</a>'
      );
      return true;
    }
    if (page === 'beranda-siswa' && role !== 'siswa') {
      denyAccess('Beranda ini khusus siswa. Silakan masuk melalui portal siswa untuk melihat jadwal dan hasil ujian Anda.',
        '<a class="btn" href="login-siswa.html">Masuk Portal Siswa</a><a class="btn outline" href="index.html">Kembali ke Beranda</a>');
      return true;
    }
    if (page === 'akun-staf' && !isStaff) {
      denyAccess(
        role === 'siswa'
          ? 'Menu Akun Saya ini khusus guru, admin, dan kepala madrasah. Akun siswa dapat mengubah kata sandi melalui menu Akun & Kata Sandi.'
          : 'Silakan masuk melalui portal staf untuk mengubah profil akun Anda.',
        role === 'siswa'
          ? '<a class="btn" href="akun-siswa.html">Buka Akun & Kata Sandi</a><a class="btn outline" href="beranda-siswa.html">Kembali ke Beranda</a>'
          : '<a class="btn" href="login-staf.html">Masuk Portal Staf</a><a class="btn outline" href="login.html">Pilih Portal</a>'
      );
      return true;
    }
    if (page === 'akun' && role !== 'siswa') {
      denyAccess(
        isStaff
          ? 'Pengaturan kata sandi siswa dilakukan dari akun siswa masing-masing. Menu ini khusus portal siswa.'
          : 'Silakan masuk melalui portal siswa untuk mengubah kata sandi akun Anda.',
        isStaff
          ? '<a class="btn" href="index.html">Kembali ke Beranda</a>'
          : '<a class="btn" href="login-siswa.html">Masuk Portal Siswa</a><a class="btn outline" href="login.html">Pilih Portal</a>'
      );
      return true;
    }
    if (page === 'sinkron' && role !== 'siswa') {
      denyAccess(
        isStaff
          ? 'Sinkronisasi soal dilakukan dari akun siswa. Masuk melalui portal siswa untuk mencobanya.'
          : 'Silakan masuk melalui portal siswa untuk menyinkronkan soal dari bank soal admin.',
        isStaff
          ? '<a class="btn" href="login-siswa.html">Masuk Portal Siswa</a><a class="btn outline" href="index.html">Kembali ke Beranda</a>'
          : '<a class="btn" href="login-siswa.html">Masuk Portal Siswa</a><a class="btn outline" href="login.html">Pilih Portal</a>'
      );
      return true;
    }
    if (page === 'hasil' && !role) {
      denyAccess('Hasil ujian bersifat pribadi. Silakan masuk untuk melihat nilai dan peringkat.',
        '<a class="btn" href="login-siswa.html">Masuk Portal Siswa</a><a class="btn outline" href="login-staf.html">Masuk Portal Staf</a>');
      return true;
    }
    return false;
  }

  function bindGlobalEvents() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('#menuBtn')) {
        document.body.classList.add('nav-open');
        return;
      }
      if (event.target.closest('.sidebar-backdrop')) {
        document.body.classList.remove('nav-open');
        return;
      }
      if (event.target.closest('.sidebar .nav-item')) {
        document.body.classList.remove('nav-open');
      }
      if (event.target.closest('#logoutBtn')) {
        store.del('eujian.session');
        toast('Anda telah keluar dari sistem.');
        setTimeout(function () { window.location.href = 'login.html'; }, 450);
        return;
      }
      if (event.target.closest('[data-close]')) closeModal();
      if (event.target.classList && event.target.classList.contains('modal-backdrop')) closeModal();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeModal();
        document.body.classList.remove('nav-open');
      }
    });
  }

  /* ---------------- Beranda ---------------- */
  function initHome() {
    var settings = getSettings();
    var students = getStudents();
    var upcoming = getUpcomingSchedules();
    var next = upcoming[0];

    var heroPanel = document.getElementById('heroNextExam');
    if (heroPanel) {
      if (next) {
        heroPanel.innerHTML =
          '<div class="hero-panel-label">Ujian berikutnya</div>' +
          '<div class="hero-panel-title">' + esc(next.mapel) + ' · Kelas ' + esc(next.kelas) + '</div>' +
          '<div class="hero-panel-meta">' + esc(fmtFullDate(next.date)) + ' · ' + next.start + '–' + next.end + ' WIB<br>' + esc(next.room) + '</div>' +
          '<div class="hero-countdown">' +
            '<div class="cd-box"><strong>' + daysUntil(next.date) + '</strong><span>Hari lagi</span></div>' +
            '<div class="cd-box"><strong>' + esc(next.kelas) + '</strong><span>Kelas</span></div>' +
            '<div class="cd-box"><strong>' + next.start + '</strong><span>Mulai</span></div>' +
          '</div>' +
          '<a class="hero-panel-link" href="jadwal-ujian.html">Lihat jadwal lengkap ' + icon('arrow-right') + '</a>';
      } else {
        heroPanel.innerHTML =
          '<div class="hero-panel-label">Ujian</div>' +
          '<div class="hero-panel-title">Tidak ada ujian mendatang</div>' +
          '<div class="hero-panel-meta">Seluruh jadwal ujian pada periode ini telah selesai.</div>' +
          '<a class="hero-panel-link" href="jadwal-ujian.html">Lihat jadwal ' + icon('arrow-right') + '</a>';
      }
    }

    var stats = [
      { icon: 'users', cls: '', value: students.length, label: 'Total Siswa', note: 'Kelas 4, 5, dan 6' },
      { icon: 'user-check', cls: 'gold', value: DATA.teachers.length, label: 'Guru & Tendik', note: 'Aktif mengajar' },
      { icon: 'calendar', cls: 'blue', value: DATA.schedules.length, label: 'Ujian Terjadwal', note: 'UAS Ganjil ' + settings.tahunPelajaran },
      { icon: 'file-text', cls: '', value: getQuestions().length, label: 'Butir Soal', note: 'Pilihan ganda & uraian' }
    ];
    var statsEl = document.getElementById('homeStats');
    if (statsEl) {
      statsEl.innerHTML = stats.map(function (st) {
        return '<div class="stat"><div class="stat-icon ' + st.cls + '">' + icon(st.icon) + '</div>' +
          '<div><strong>' + st.value + '</strong><span class="stat-label">' + esc(st.label) + '</span><small>' + esc(st.note) + '</small></div></div>';
      }).join('');
    }

    var scheduleEl = document.getElementById('homeSchedule');
    if (scheduleEl) {
      var list = upcoming.slice(0, 4);
      scheduleEl.innerHTML = list.length
        ? list.map(function (item) {
            var status = scheduleStatus(item);
            return '<div class="schedule-item">' +
              '<div class="date-tile"><strong>' + dayNumber(item.date) + '</strong><span>' + monthShort(item.date) + '</span></div>' +
              '<div class="schedule-info"><strong>' + esc(item.mapel) + ' · Kelas ' + esc(item.kelas) + '</strong>' +
              '<span>' + item.start + '–' + item.end + ' WIB · ' + esc(item.room) + '</span></div>' +
              '<span class="badge ' + status.cls + '">' + status.label + '</span>' +
            '</div>';
          }).join('')
        : '<div class="empty-state">' + icon('calendar') + 'Belum ada jadwal ujian mendatang.</div>';
    }

    var annEl = document.getElementById('homeAnnouncements');
    if (annEl) {
      var annIcons = { Jadwal: 'calendar', Penting: 'alert-triangle', Pengumuman: 'info', Kegiatan: 'book' };
      annEl.innerHTML = DATA.announcements.map(function (ann) {
        return '<div class="announce">' +
          '<div class="announce-icon">' + icon(annIcons[ann.kategori] || 'info') + '</div>' +
          '<div><h4>' + esc(ann.title) + '</h4><p>' + esc(fmtDateOnly(ann.date)) + ' · ' + esc(ann.kategori) + '</p></div>' +
        '</div>';
      }).join('');
    }

    var chartEl = document.getElementById('homeChart');
    if (chartEl) {
      var subjects = [
        { label: 'Matematika', key: 'mtk' },
        { label: 'B. Indonesia', key: 'bin' },
        { label: 'IPA', key: 'ipa' },
        { label: 'B. Arab', key: 'arab' },
        { label: 'Fiqih', key: 'fiqih' }
      ];
      chartEl.innerHTML = '<div class="chart">' + subjects.map(function (sub) {
        var results = getResults();
        var total = results.reduce(function (sum, row) { return sum + row[sub.key]; }, 0);
        var avg = total / (results.length || 1);
        return '<div class="chart-row">' +
          '<div class="chart-label">' + esc(sub.label) + '</div>' +
          '<div class="chart-track"><div class="chart-fill" style="width:' + avg.toFixed(1) + '%"></div></div>' +
          '<div class="chart-val">' + num1(avg) + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    var quickEl = document.getElementById('quickLinks');
    if (quickEl) {
      var links = [
        ['data-siswa', 'Data Siswa', 'users'],
        ['jadwal-ujian', 'Jadwal Ujian', 'calendar'],
        ['bank-soal', 'Bank Soal', 'file-text'],
        ['hasil-ujian', 'Hasil Ujian', 'bar-chart'],
        ['cetak-laporan', 'Cetak Laporan', 'printer'],
        ['pengaturan', 'Pengaturan', 'settings']
      ];
      quickEl.innerHTML = links.map(function (link) {
        return '<a class="quick-link" href="' + link[0] + '">' + icon(link[2]) + esc(link[1]) + '</a>';
      }).join('');
    }
  }

  /* ---------------- Beranda Siswa ---------------- */
  function initStudentHome() {
    var session = getSession();
    if (!session) return;
    var settings = getSettings();
    var level = null;
    var classMatch = /Kelas\s+(\d)/.exec(session.detail || '');
    if (classMatch) level = classMatch[1];

    var banner = document.getElementById('siswaBanner');
    if (banner) banner.textContent = 'Selamat datang, ' + session.name.split(',')[0] + ' · ' + session.detail;

    var upcoming = getUpcomingSchedules().filter(function (s) { return !level || s.kelas === level; });
    var next = upcoming[0];
    var nextEl = document.getElementById('siswaNext');
    if (nextEl) {
      nextEl.innerHTML = next
        ? '<div class="hero-panel-label">Ujian berikutnya</div>' +
          '<div class="hero-panel-title">' + esc(next.mapel) + ' · Kelas ' + esc(next.kelas) + '</div>' +
          '<div class="hero-panel-meta">' + esc(fmtFullDate(next.date)) + ' · ' + next.start + '–' + next.end + ' WIB<br>' + esc(next.room) + '</div>' +
          '<div class="hero-countdown">' +
            '<div class="cd-box"><strong>' + daysUntil(next.date) + '</strong><span>Hari lagi</span></div>' +
            '<div class="cd-box"><strong>' + next.start + '</strong><span>Mulai</span></div>' +
            '<div class="cd-box"><strong>' + esc(next.kelas) + '</strong><span>Kelas</span></div>' +
          '</div>' +
          '<a class="hero-panel-link" href="jadwal-ujian.html">Lihat jadwal lengkap ' + icon('arrow-right') + '</a>'
        : '<div class="hero-panel-label">Ujian</div>' +
          '<div class="hero-panel-title">Tidak ada ujian mendatang</div>' +
          '<div class="hero-panel-meta">Seluruh jadwal pada periode ini telah selesai.</div>' +
          '<a class="hero-panel-link" href="jadwal-ujian.html">Lihat jadwal ' + icon('arrow-right') + '</a>';
    }

    var myStudent = getStudents().find(function (s) { return s.nama === session.name; });
    var myResult = getResults().find(function (r) { return myStudent && r.studentId === myStudent.id; });
    var avg = myResult ? (myResult.mtk + myResult.bin + myResult.ipa + myResult.arab + myResult.fiqih) / 5 : 0;
    var rank = '—';
    if (myResult) {
      var allAvg = getResults().map(function (r) { return (r.mtk + r.bin + r.ipa + r.arab + r.fiqih) / 5; });
      allAvg.sort(function (a, b) { return b - a; });
      rank = '#' + (allAvg.indexOf(avg) + 1);
    }
    var kkm = Number(settings.kkm) || 70;
    var statsEl = document.getElementById('siswaStats');
    if (statsEl) {
      var examCount = DATA.schedules.filter(function (s) { return level && s.kelas === level; }).length;
      statsEl.innerHTML =
        '<div class="stat"><div class="stat-icon">' + icon('calendar') + '</div><div><strong>' + upcoming.length + '</strong><span class="stat-label">Ujian Mendatang</span><small>Kelas ' + esc(level || '—') + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon gold">' + icon('bar-chart') + '</div><div><strong>' + (myResult ? num1(avg) : '—') + '</strong><span class="stat-label">Rata-rata Nilai</span><small>UAS Ganjil ' + esc(settings.tahunPelajaran) + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon blue">' + icon('award') + '</div><div><strong>' + rank + '</strong><span class="stat-label">Peringkat Kelas</span><small>' + (myResult ? 'Predikat ' + predikat(avg) : 'Belum ada hasil') + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon ' + (myResult && avg >= kkm ? '' : 'red') + '">' + icon('check-circle') + '</div><div><strong>' + (myResult ? (avg >= kkm ? 'Tuntas' : 'Belum') : '—') + '</strong><span class="stat-label">Status KKM</span><small>' + examCount + ' ujian terjadwal</small></div></div>';
    }

    var scheduleEl = document.getElementById('siswaSchedule');
    if (scheduleEl) {
      scheduleEl.innerHTML = upcoming.length ? upcoming.slice(0, 4).map(function (item) {
        var status = scheduleStatus(item);
        return '<div class="schedule-item">' +
          '<div class="date-tile"><strong>' + dayNumber(item.date) + '</strong><span>' + monthShort(item.date) + '</span></div>' +
          '<div class="schedule-info"><strong>' + esc(item.mapel) + ' · Kelas ' + esc(item.kelas) + '</strong>' +
          '<span>' + item.start + '–' + item.end + ' WIB · ' + esc(item.room) + '</span></div>' +
          '<span class="badge ' + status.cls + '">' + status.label + '</span>' +
        '</div>';
      }).join('') : '<div class="empty-state">' + icon('calendar') + 'Belum ada jadwal ujian mendatang.</div>';
    }

    var annEl = document.getElementById('siswaAnnouncements');
    if (annEl) {
      var annIcons = { Jadwal: 'calendar', Penting: 'alert-triangle', Pengumuman: 'info', Kegiatan: 'book' };
      annEl.innerHTML = DATA.announcements.map(function (ann) {
        return '<div class="announce">' +
          '<div class="announce-icon">' + icon(annIcons[ann.kategori] || 'info') + '</div>' +
          '<div><h4>' + esc(ann.title) + '</h4><p>' + esc(fmtDateOnly(ann.date)) + ' · ' + esc(ann.kategori) + '</p></div>' +
        '</div>';
      }).join('');
    }

    var resultEl = document.getElementById('siswaResult');
    if (resultEl) {
      if (myResult) {
        var subjects = [
          { label: 'Matematika', key: 'mtk' },
          { label: 'B. Indonesia', key: 'bin' },
          { label: 'IPA', key: 'ipa' },
          { label: 'B. Arab', key: 'arab' },
          { label: 'Fiqih', key: 'fiqih' }
        ];
        resultEl.innerHTML = '<div class="chart">' + subjects.map(function (sub) {
          return '<div class="chart-row">' +
            '<div class="chart-label">' + esc(sub.label) + '</div>' +
            '<div class="chart-track"><div class="chart-fill" style="width:' + myResult[sub.key] + '%"></div></div>' +
            '<div class="chart-val">' + myResult[sub.key] + '</div>' +
          '</div>';
        }).join('') + '</div>' +
        '<div class="result-note" style="margin:14px 0 0"><span>' + icon('info') + '</span><span>Rata-rata ' + num1(avg) + ' · Predikat ' + predikat(avg) + ' · Peringkat ' + rank + ' dari ' + getResults().length + ' siswa kelas 6.</span></div>';
      } else {
        resultEl.innerHTML = '<div class="empty-state">' + icon('bar-chart') + 'Hasil ujian belum tersedia.</div>';
      }
    }

    var quickEl = document.getElementById('siswaQuick');
    if (quickEl) {
      var links = [
        ['jadwal-ujian', 'Jadwal Ujian', 'calendar'],
        ['ujian', 'Mulai Ujian', 'monitor'],
        ['sinkron-soal', 'Sinkron Soal', 'refresh'],
        ['hasil-ujian', 'Hasil Ujian', 'bar-chart'],
        ['akun-siswa', 'Akun Saya', 'key'],
        ['profil', 'Profil Madrasah', 'building']
      ];
      quickEl.innerHTML = links.map(function (link) {
        return '<a class="quick-link" href="' + link[0] + '.html">' + icon(link[2]) + esc(link[1]) + '</a>';
      }).join('');
    }
  }

  /* ---------------- Sinkronisasi Soal (Siswa) ---------------- */
  function initSync() {
    var statsEl = document.getElementById('syncStats');
    if (!statsEl) return;
    var mapelSel = document.getElementById('syncMapel');
    var kelasEl = document.getElementById('syncKelas');
    var syncBtn = document.getElementById('syncNowBtn');
    var rowsEl = document.getElementById('syncRows');
    var logEl = document.getElementById('syncLog');
    var accountEl = document.getElementById('syncAccount');
    var goExam = document.getElementById('syncGoExam');
    var metaEl = document.getElementById('syncMeta');
    var tableInfo = document.getElementById('syncTableInfo');
    var tableCount = document.getElementById('syncTableCount');
    var session = getSession();
    if (!session) return;

    var levelMatch = /Kelas\s+(\d)/.exec(session.detail || '');
    var level = levelMatch ? levelMatch[1] : '6';

    var allBank = getQuestions().filter(function (q) { return String(q.kelas) === level; });
    var mapelList = Array.from(new Set(allBank.map(function (q) { return q.mapel; })));
    if (!mapelList.length) mapelList = ['Matematika'];
    if (mapelSel) {
      mapelSel.innerHTML = mapelList.map(function (m) {
        return '<option value="' + esc(m) + '">' + esc(m) + '</option>';
      }).join('');
      if (mapelList.indexOf('Matematika') > -1) mapelSel.value = 'Matematika';
    }
    if (kelasEl) kelasEl.value = 'Kelas ' + level;

    function getSnapshot() {
      var snap = store.get('eujian.soalSiswa', null);
      return snap && snap.username === session.username ? snap : null;
    }

    function questionsForSync() {
      var mapel = mapelSel ? mapelSel.value : 'Matematika';
      return getQuestions().filter(function (q) {
        return String(q.kelas) === level && q.mapel === mapel;
      });
    }

    function fmtTime(ts) {
      return new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function render() {
      var snap = getSnapshot();
      var list = questionsForSync();
      var mapel = mapelSel ? mapelSel.value : 'Matematika';
      var syncedIds = snap && snap.mapel === mapel && Array.isArray(snap.questions)
        ? snap.questions.map(function (q) { return q.id; })
        : [];
      var syncedCount = syncedIds.length;
      var active = !!snap;

      statsEl.innerHTML =
        '<div class="stat"><div class="stat-icon">' + icon('file-text') + '</div><div><strong>' + list.length + '</strong><span class="stat-label">Soal di Bank</span><small>' + esc(mapel) + ' · Kelas ' + esc(level) + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon gold">' + icon('refresh') + '</div><div><strong>' + syncedCount + '</strong><span class="stat-label">Soal Tersinkron</span><small>' + (active ? esc(snap.mapel) + ' · Kelas ' + esc(snap.kelas) : 'Belum ada paket') + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon blue">' + icon(active ? 'check-circle' : 'info') + '</div><div><strong>' + (active ? 'Aktif' : 'Menunggu') + '</strong><span class="stat-label">Status Paket</span><small>' + (snap ? 'Update ' + esc(fmtTime(snap.at)) : 'Sinkronkan untuk memulai') + '</small></div></div>';

      if (metaEl) metaEl.textContent = 'Sumber: Bank Soal Admin/Guru · ' + mapel + ' Kelas ' + level;
      if (logEl) {
        logEl.textContent = snap
          ? 'Terakhir sinkron ' + fmtTime(snap.at) + ' · ' + (snap.questions || []).length + ' soal ' + snap.mapel + ' Kelas ' + snap.kelas + ' siap dipakai.'
          : 'Belum ada sinkronisasi. Pilih mata pelajaran lalu tekan Sinkronkan Soal Sekarang.';
      }
      if (goExam) goExam.hidden = !snap;

      if (accountEl) {
        accountEl.innerHTML =
          '<div class="cell-user" style="margin-bottom:14px"><span class="avatar lg">' + esc(initials(session.name)) + '</span>' +
            '<div><strong style="font-size:14px">' + esc(session.name) + '</strong><span>' + esc(session.detail || ('Kelas ' + level)) + '</span></div>' +
          '</div>' +
          '<div class="info-grid">' +
            '<div class="info-row"><span>Sumber soal</span><strong>Bank Soal Admin/Guru</strong></div>' +
            '<div class="info-row"><span>Kelas sinkron</span><strong>Kelas ' + esc(snap ? snap.kelas : level) + '</strong></div>' +
            '<div class="info-row"><span>Paket soal</span><strong>' + (snap ? esc(snap.mapel) + ' · ' + (snap.questions || []).length + ' soal' : 'Belum ada') + '</strong></div>' +
            '<div class="info-row"><span>Terakhir sinkron</span><strong>' + (snap ? esc(fmtTime(snap.at)) : '—') + '</strong></div>' +
            '<div class="info-row"><span>Status</span><strong>' + (snap ? '<span class="badge success">Siap ujian</span>' : '<span class="badge warn">Belum sinkron</span>') + '</strong></div>' +
          '</div>';
      }

      if (tableInfo) tableInfo.textContent = 'Soal ' + mapel + ' Kelas ' + level + ' yang disusun admin/guru.';
      if (tableCount) tableCount.textContent = list.length + ' soal';

      rowsEl.innerHTML = list.length ? list.map(function (q, idx) {
        var isSynced = syncedIds.indexOf(q.id) > -1;
        return '<tr>' +
          '<td class="num">' + (idx + 1) + '</td>' +
          '<td><div class="question-text" style="max-width:430px">' + esc(truncate(q.text, 110)) + '</div></td>' +
          '<td><span class="badge info">' + esc(q.mapel) + '</span></td>' +
          '<td><span class="badge ' + (q.tipe === 'PG' ? '' : 'warn') + '">' + esc(q.tipe) + '</span></td>' +
          '<td class="num">' + esc(q.bobot) + '</td>' +
          '<td><span class="badge ' + (isSynced ? 'success' : '') + '">' + (isSynced ? 'Tersinkron' : 'Belum') + '</span></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="6"><div class="empty-state">' + icon('file-text') + 'Belum ada soal untuk ' + esc(mapel) + ' Kelas ' + esc(level) + ' di bank soal.</div></td></tr>';
    }

    if (mapelSel) mapelSel.addEventListener('change', render);

    if (syncBtn) {
      syncBtn.addEventListener('click', function () {
        var list = questionsForSync();
        var mapel = mapelSel ? mapelSel.value : 'Matematika';
        if (!list.length) {
          toast('Belum ada soal ' + mapel + ' Kelas ' + level + ' di bank soal admin/guru.', 'danger');
          return;
        }
        function doSync() {
          var snapshot = {
            username: session.username,
            name: session.name,
            kelas: level,
            mapel: mapel,
            at: Date.now(),
            questions: JSON.parse(JSON.stringify(list.map(function (q) {
              return {
                id: q.id, mapel: q.mapel, kelas: q.kelas, tipe: q.tipe, bobot: q.bobot,
                text: q.text, options: q.options || [], kunci: q.kunci || '',
                jawaban: q.jawaban || '', pembahasan: q.pembahasan || '',
                gambar: q.gambar || ''
              };
            })))
          };
          store.set('eujian.soalSiswa', snapshot);
          store.del('eujian.attempt');
          render();
          toast(list.length + ' soal ' + mapel + ' berhasil disinkronkan dari bank soal admin.');
        }
        var attempt = store.get('eujian.attempt', null);
        if (attempt) {
          confirmDialog({
            title: 'Sinkronkan ulang soal?',
            message: 'Sinkronisasi akan memperbarui paket soal dan mereset percobaan ujian yang tersimpan (termasuk jawaban sebelumnya). Lanjutkan?',
            confirmLabel: 'Ya, sinkronkan',
            danger: true
          }).then(function (ok) { if (ok) doSync(); });
        } else {
          doSync();
        }
      });
    }

    render();
  }

  /* ---------------- Akun Siswa ---------------- */
  function initStudentAccount() {
    var form = document.getElementById('studentPwdForm');
    if (!form) return;
    var session = getSession();
    var account = accountForSession(session);
    var infoEl = document.getElementById('accountInfo');
    var errEl = document.getElementById('spwdError');

    function fail(msg) {
      if (!errEl) return;
      errEl.hidden = false;
      errEl.textContent = msg;
    }
    function clearError() {
      if (errEl) errEl.hidden = true;
    }

    function renderInfo() {
      if (!infoEl || !session) return;
      var changed = !!(account && Object.prototype.hasOwnProperty.call(getPasswords(), account.username));
      var nisnMatch = /NISN\s+(\d+)/.exec(session.detail || '');
      infoEl.innerHTML =
        '<div class="cell-user" style="margin-bottom:14px">' +
          '<span class="avatar lg">' + esc(initials(session.name)) + '</span>' +
          '<div><strong style="font-size:15px">' + esc(session.name) + '</strong><span>' + esc(session.detail || '') + '</span></div>' +
        '</div>' +
        '<div class="info-grid">' +
          '<div class="info-row"><span>Akun login</span><strong>' + esc(account ? account.username : (nisnMatch ? nisnMatch[1] : '—')) + '</strong></div>' +
          '<div class="info-row"><span>Peran</span><strong>Siswa</strong></div>' +
          '<div class="info-row"><span>Status sandi</span><strong>' + (changed ? '<span class="badge success">Sudah diubah</span>' : '<span class="badge warn">Masih default</span>') + '</strong></div>' +
        '</div>' +
        '<p class="hint" style="margin:12px 0 0">Kata sandi awal setiap siswa adalah <b>123456</b>. Segera ubah agar akun Anda aman.</p>';
    }

    renderInfo();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearError();
      if (!account) return fail('Akun siswa tidak ditemukan. Hubungi operator madrasah.');
      var oldPwd = String((document.getElementById('spwdOld') || {}).value || '');
      var newPwd = String((document.getElementById('spwdNew') || {}).value || '');
      var confirmPwd = String((document.getElementById('spwdConfirm') || {}).value || '');
      if (passwordFor(account) !== oldPwd) return fail('Kata sandi saat ini salah. Periksa kembali.');
      if (newPwd.length < 6) return fail('Kata sandi baru minimal 6 karakter.');
      if (newPwd === oldPwd) return fail('Kata sandi baru harus berbeda dari kata sandi saat ini.');
      if (newPwd !== confirmPwd) return fail('Ulangi kata sandi baru dengan tepat, belum sama.');
      var pwds = getPasswords();
      pwds[account.username] = newPwd;
      store.set('eujian.passwords', pwds);
      form.reset();
      renderInfo();
      toast('Kata sandi Anda berhasil diperbarui.');
    });
  }

  /* ---------------- Akun Staf (Guru/Admin/Kepala) ---------------- */
  function initStaffAccount() {
    var form = document.getElementById('staffAccountForm');
    if (!form) return;
    var session = getSession();
    var account = accountForSession(session);
    var nameEl = document.getElementById('staffName');
    var infoEl = document.getElementById('staffAccountInfo');
    var errEl = document.getElementById('staffError');

    function fail(msg) {
      if (!errEl) return;
      errEl.hidden = false;
      errEl.textContent = msg;
    }
    function clearError() {
      if (errEl) errEl.hidden = true;
    }

    function renderInfo() {
      if (!infoEl || !session) return;
      var changed = !!(account && Object.prototype.hasOwnProperty.call(getPasswords(), account.username));
      infoEl.innerHTML =
        '<div class="cell-user" style="margin-bottom:14px">' +
          '<span class="avatar lg">' + esc(initials(session.name)) + '</span>' +
          '<div><strong style="font-size:15px">' + esc(session.name) + '</strong><span>' + esc(ROLE_LABEL[session.role] || '') + ' · @' + esc(session.username) + '</span></div>' +
        '</div>' +
        '<div class="info-grid">' +
          '<div class="info-row"><span>Peran</span><strong>' + esc(ROLE_LABEL[session.role] || '—') + '</strong></div>' +
          '<div class="info-row"><span>Username</span><strong>@' + esc(session.username) + '</strong></div>' +
          '<div class="info-row"><span>Status sandi</span><strong>' + (changed ? '<span class="badge success">Sudah diubah</span>' : '<span class="badge warn">Masih default</span>') + '</strong></div>' +
        '</div>' +
        '<p class="hint" style="margin:12px 0 0">Kata sandi awal akun demo adalah <b>123456</b>. Perubahan nama langsung dipakai pada tampilan aplikasi dan saat login.</p>';
    }

    if (nameEl && account) nameEl.value = account.name;
    renderInfo();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearError();
      if (!account) return fail('Akun tidak ditemukan. Hubungi operator madrasah.');
      var name = String((nameEl || {}).value || '').trim();
      var oldPwd = String((document.getElementById('staffOld') || {}).value || '');
      var newPwd = String((document.getElementById('staffNew') || {}).value || '');
      var confirmPwd = String((document.getElementById('staffConfirm') || {}).value || '');
      var rename = name !== account.name;
      var changePwd = !!(newPwd || confirmPwd);

      if (!name) return fail('Nama tidak boleh kosong.');
      if (name.length < 3) return fail('Nama minimal 3 karakter.');
      if (!rename && !changePwd) return fail('Belum ada perubahan untuk disimpan.');
      if (!oldPwd) return fail('Masukkan kata sandi saat ini untuk konfirmasi.');
      if (passwordFor(account) !== oldPwd) return fail('Kata sandi saat ini salah. Periksa kembali.');

      if (rename) {
        var nameTaken = DATA.accounts.map(withProfile).some(function (a) {
          return a.username !== account.username && String(a.name).toLowerCase() === name.toLowerCase();
        });
        if (nameTaken) return fail('Nama tersebut sudah dipakai akun lain. Gunakan nama yang berbeda.');
      }

      if (changePwd) {
        if (newPwd.length < 6) return fail('Kata sandi baru minimal 6 karakter.');
        if (newPwd !== confirmPwd) return fail('Ulangi kata sandi baru dengan tepat, belum sama.');
        if (newPwd === passwordFor(account)) return fail('Kata sandi baru harus berbeda dari kata sandi saat ini.');
      }

      var pwds = getPasswords();
      if (changePwd) {
        pwds[account.username] = newPwd;
        store.set('eujian.passwords', pwds);
      }
      if (rename) {
        var profiles = getProfiles();
        profiles[account.username] = { name: name };
        store.set('eujian.profiles', profiles);
      }
      session.name = name;
      store.set('eujian.session', session);
      toast(rename ? 'Nama dan profil akun berhasil diperbarui.' : 'Kata sandi akun berhasil diperbarui.');
      document.getElementById('staffOld').value = '';
      document.getElementById('staffNew').value = '';
      document.getElementById('staffConfirm').value = '';

      if (rename) {
        setTimeout(function () { window.location.reload(); }, 700);
      } else {
        renderInfo();
      }
    });
  }

  /* ---------------- Data Siswa ---------------- */
  function initStudents() {
    var tbody = document.getElementById('studentRows');
    if (!tbody) return;
    var state = { q: '', kelas: 'all', status: 'all', page: 1, size: 10 };
    var kelasSel = document.getElementById('studentKelas');
    var statusSel = document.getElementById('studentStatus');
    var searchInput = document.getElementById('studentSearch');

    var kelasOptions = [];
    function refreshKelasOptions() {
      kelasOptions = Array.from(new Set(getStudents().map(function (s) { return s.kelas; }))).sort();
      if (kelasSel) {
        kelasSel.innerHTML = '<option value="all">Semua Kelas</option>' + kelasOptions.map(function (k) {
          return '<option value="' + esc(k) + '">Kelas ' + esc(k) + '</option>';
        }).join('');
      }
      if (state.kelas !== 'all' && kelasOptions.indexOf(state.kelas) === -1) {
        state.kelas = 'all';
        if (kelasSel) kelasSel.value = 'all';
      }
      return kelasOptions;
    }
    refreshKelasOptions();

    function filtered() {
      var q = state.q.toLowerCase();
      return getStudents().filter(function (s) {
        var matchQ = !q || s.nama.toLowerCase().indexOf(q) > -1 || s.nisn.indexOf(q) > -1;
        var matchKelas = state.kelas === 'all' || s.kelas === state.kelas;
        var matchStatus = state.status === 'all' || s.status === state.status;
        return matchQ && matchKelas && matchStatus;
      });
    }

    function render() {
      var rows = filtered();
      var total = rows.length;
      var pages = Math.max(1, Math.ceil(total / state.size));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * state.size;
      var pageRows = rows.slice(start, start + state.size);

      tbody.innerHTML = pageRows.length ? pageRows.map(function (s, idx) {
        return '<tr>' +
          '<td class="num">' + (start + idx + 1) + '</td>' +
          '<td class="mono">' + esc(s.nisn) + '</td>' +
          '<td><div class="cell-user"><span class="avatar sm">' + esc(initials(s.nama)) + '</span>' +
            '<div><strong>' + esc(s.nama) + '</strong><span>' + (s.jk === 'L' ? 'Laki-laki' : 'Perempuan') + '</span></div></div></td>' +
          '<td><span class="badge info">Kelas ' + esc(s.kelas) + '</span></td>' +
          '<td>' + esc(s.jk) + '</td>' +
          '<td><span class="badge ' + (s.status === 'Aktif' ? 'success' : 'warn') + '">' + esc(s.status) + '</span></td>' +
          '<td><div class="table-action">' +
            '<button class="btn ghost sm" data-view="' + esc(s.id) + '" title="Lihat detail">' + icon('eye') + '</button>' +
            '<button class="btn ghost sm" data-del-student="' + esc(s.id) + '" title="Hapus siswa" aria-label="Hapus ' + esc(s.nama) + '">' + icon('trash') + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="7"><div class="empty-state">' + icon('users') + 'Tidak ada siswa yang sesuai pencarian.</div></td></tr>';

      var countEl = document.getElementById('studentCount');
      if (countEl) countEl.textContent = total + ' siswa';

      var pag = document.getElementById('studentPagination');
      if (pag) {
        pag.innerHTML = '<span>Menampilkan ' + (total ? start + 1 : 0) + '–' + Math.min(start + state.size, total) + ' dari ' + total + ' siswa</span>' +
          '<div class="page-btns">' +
            '<button class="page-btn" data-page="prev" ' + (state.page === 1 ? 'disabled' : '') + '>' + icon('chevron-left') + '</button>' +
            Array.from({ length: pages }, function (_, i) {
              return '<button class="page-btn ' + (state.page === i + 1 ? 'active' : '') + '" data-page="' + (i + 1) + '">' + (i + 1) + '</button>';
            }).join('') +
            '<button class="page-btn" data-page="next" ' + (state.page === pages ? 'disabled' : '') + '>' + icon('chevron-right') + '</button>' +
          '</div>';
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () { state.q = searchInput.value.trim(); state.page = 1; render(); });
    }
    if (kelasSel) {
      kelasSel.addEventListener('change', function () { state.kelas = kelasSel.value; state.page = 1; render(); });
    }
    if (statusSel) {
      statusSel.addEventListener('change', function () { state.status = statusSel.value; state.page = 1; render(); });
    }

    var pagEl = document.getElementById('studentPagination');
    if (pagEl) {
      pagEl.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var pages = Math.max(1, Math.ceil(filtered().length / state.size));
        var val = btn.getAttribute('data-page');
        if (val === 'prev') state.page = Math.max(1, state.page - 1);
        else if (val === 'next') state.page = Math.min(pages, state.page + 1);
        else state.page = parseInt(val, 10);
        render();
      });
    }

    tbody.addEventListener('click', function (event) {
      var delBtn = event.target.closest('[data-del-student]');
      if (delBtn) {
        var delId = delBtn.getAttribute('data-del-student');
        var victim = getStudents().find(function (s) { return s.id === delId; });
        if (!victim) return;
        confirmDialog({
          title: 'Hapus data siswa?',
          message: victim.nama + ' (NISN ' + victim.nisn + ') akan dihapus dari daftar siswa. Akun login siswa ini juga tidak dapat dipakai lagi.',
          confirmLabel: 'Ya, hapus',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          var extraList = store.get('eujian.studentsExtra', []);
          var inExtra = Array.isArray(extraList) && extraList.some(function (s) { return s.id === delId; });
          if (inExtra) {
            store.set('eujian.studentsExtra', extraList.filter(function (s) { return s.id !== delId; }));
          } else {
            var deletedIds = store.get('eujian.studentsDeleted', []);
            if (!Array.isArray(deletedIds)) deletedIds = [];
            if (deletedIds.indexOf(delId) === -1) deletedIds.push(delId);
            store.set('eujian.studentsDeleted', deletedIds);
          }
          refreshKelasOptions();
          render();
          toast('Data siswa berhasil dihapus.');
        });
        return;
      }
      var btn = event.target.closest('[data-view]');
      if (!btn) return;
      var student = getStudents().find(function (s) { return s.id === btn.getAttribute('data-view'); });
      if (!student) return;
      var account = getStudentAccounts().find(function (a) { return a.studentId === student.id; });
      var result = getResults().find(function (r) { return r.studentId === student.id; });
      var avgText = '—';
      if (result) {
        var avg = (result.mtk + result.bin + result.ipa + result.arab + result.fiqih) / 5;
        avgText = num1(avg) + ' (' + predikat(avg) + ')';
      }
      openModal({
        title: 'Detail Siswa',
        subtitle: 'Informasi lengkap peserta didik',
        body: '<div class="cell-user" style="margin-bottom:14px">' +
            '<span class="avatar lg">' + esc(initials(student.nama)) + '</span>' +
            '<div><strong style="font-size:15px">' + esc(student.nama) + '</strong><span>Kelas ' + esc(student.kelas) + ' · ' + esc(student.status) + '</span></div>' +
          '</div>' +
          '<div class="info-grid">' +
            '<div class="info-row"><span>NISN</span><strong>' + esc(student.nisn) + '</strong></div>' +
            '<div class="info-row"><span>Kelas</span><strong>' + esc(student.kelas) + '</strong></div>' +
            '<div class="info-row"><span>Jenis Kelamin</span><strong>' + (student.jk === 'L' ? 'Laki-laki' : 'Perempuan') + '</strong></div>' +
            '<div class="info-row"><span>Status</span><strong>' + esc(student.status) + '</strong></div>' +
            '<div class="info-row"><span>Akun Login</span><strong>' + esc(account ? account.username : student.nisn) + '</strong></div>' +
            '<div class="info-row"><span>Kata Sandi</span><strong>' + esc(account ? passwordFor(account) : '123456') + '</strong></div>' +
            '<div class="info-row"><span>Rata-rata UAS</span><strong>' + avgText + '</strong></div>' +
          '</div>',
        footer: '<button type="button" class="btn outline" data-close>Tutup</button>'
      });
    });

    var addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var options = kelasOptions.map(function (k) { return '<option value="' + esc(k) + '">Kelas ' + esc(k) + '</option>'; }).join('');
        openModal({
          title: 'Tambah Data Siswa',
          subtitle: 'Lengkapi data peserta didik dengan benar.',
          body: '<form id="studentForm">' +
              '<div class="form-grid">' +
                '<div class="field"><label>Nama Lengkap</label><input class="input" name="nama" required maxlength="60" placeholder="Nama siswa"></div>' +
                '<div class="field"><label>NISN</label><input class="input" name="nisn" required inputmode="numeric" maxlength="12" placeholder="10 digit NISN"></div>' +
                '<div class="field"><label>Kelas</label><select class="input" name="kelas">' + options + '</select></div>' +
                '<div class="field"><label>Jenis Kelamin</label><select class="input" name="jk"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>' +
                '<div class="field"><label>Status</label><select class="input" name="status"><option>Aktif</option><option>Cuti</option></select></div>' +
              '</div>' +
              '<p class="hint" style="margin:0">Akun login otomatis dibuat memakai NISN dengan kata sandi awal 123456.</p>' +
              '<div class="settings-actions"><button type="button" class="btn outline" data-close>Batal</button><button type="submit" class="btn">' + icon('save') + 'Simpan Siswa</button></div>' +
            '</form>',
          size: 'lg'
        });
        var form = document.getElementById('studentForm');
        if (!form) return;
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var fd = new FormData(form);
          var nama = String(fd.get('nama') || '').trim();
          var nisn = String(fd.get('nisn') || '').trim();
          if (!nama || !nisn) return;
          var duplicate = getStudents().some(function (s) { return s.nisn === nisn; });
          if (duplicate) {
            toast('NISN sudah terdaftar. Periksa kembali.', 'danger');
            return;
          }
          var extra = store.get('eujian.studentsExtra', []);
          if (!Array.isArray(extra)) extra = [];
          extra.push({
            id: 'SX' + Date.now(),
            nisn: nisn,
            nama: nama,
            kelas: String(fd.get('kelas') || '4A'),
            jk: String(fd.get('jk') || 'L'),
            status: String(fd.get('status') || 'Aktif')
          });
          store.set('eujian.studentsExtra', extra);
          closeModal();
          state.page = 1;
          render();
          toast('Data siswa berhasil ditambahkan.');
        });
      });
    }

    /* ---- Import Excel ---- */
    function ensureXLSX() {
      if (window.XLSX) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var existing = document.querySelector('script[data-xlsx-cdn]');
        if (existing) {
          existing.addEventListener('load', function () { resolve(); });
          return;
        }
        var el = document.createElement('script');
        el.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        el.setAttribute('data-xlsx-cdn', '');
        el.onload = function () { resolve(); };
        el.onerror = function () { reject(new Error('Pustaka Excel gagal dimuat. Periksa koneksi internet.')); };
        document.head.appendChild(el);
      });
    }

    function normCell(v) { return String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9]/g, ''); }

    function normalizeJK(v) {
      var s = normCell(v);
      if (/^(l|lk|lakilaki|male|m)$/.test(s)) return 'L';
      if (/^(p|pr|perempuan|female|f|w|wanita)$/.test(s)) return 'P';
      return '';
    }

    function normalizeKelas(v) {
      var s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
      s = s.replace(/^kelas\s*/i, '').toUpperCase();
      return s;
    }

    function normalizeNisn(v) {
      var s = String(v == null ? '' : v).replace(/[^0-9]/g, '');
      if (/^\d{1,9}$/.test(s)) s = s.padStart(10, '0');
      return s;
    }

    function parseStudentWorkbook(wb) {
      var sheet = wb.Sheets[wb.SheetNames[0]];
      var matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
      if (!matrix.length) throw new Error('File Excel kosong.');

      var aliases = {
        nisn: ['nisn', 'nomorinduksiswa', 'nomorinduk'],
        nama: ['nama', 'namasiswa', 'namalengkap', 'namapesertadidik'],
        kelas: ['kelas', 'rombel', 'kelasrombel'],
        jk: ['jk', 'jeniskelamin', 'lp', 'gender'],
        status: ['status', 'statuskeaktifan', 'statussiswa']
      };
      function headerCol(headers, key) {
        for (var i = 0; i < aliases[key].length; i++) {
          var idx = headers.indexOf(aliases[key][i]);
          if (idx > -1) return idx;
        }
        return -1;
      }

      var headerIdx = -1;
      var col = null;
      for (var i = 0; i < Math.min(matrix.length, 10); i++) {
        var headers = matrix[i].map(normCell);
        var probe = {
          nisn: headerCol(headers, 'nisn'),
          nama: headerCol(headers, 'nama'),
          kelas: headerCol(headers, 'kelas'),
          jk: headerCol(headers, 'jk'),
          status: headerCol(headers, 'status')
        };
        if (probe.nisn > -1 && probe.nama > -1) { headerIdx = i; col = probe; break; }
      }
      if (headerIdx === -1) throw new Error('Baris judul kolom dengan NISN dan Nama tidak ditemukan. Gunakan template yang disediakan.');

      var existing = {};
      getStudents().forEach(function (s) { existing[s.nisn] = true; });
      var seen = {};
      var parsed = [];

      matrix.slice(headerIdx + 1).forEach(function (row) {
        var cells = row.map(function (c) { return String(c == null ? '' : c); });
        if (cells.every(function (c) { return !c.trim(); })) return;
        var cell = function (idx) { return idx > -1 ? String(cells[idx] == null ? '' : cells[idx]).trim() : ''; };
        var item = {
          nisn: normalizeNisn(cell(col.nisn)),
          nama: cell(col.nama).replace(/\s+/g, ' ').trim(),
          kelas: normalizeKelas(cell(col.kelas)),
          jk: normalizeJK(cell(col.jk)),
          status: /cuti/i.test(cell(col.status)) ? 'Cuti' : 'Aktif',
          errors: []
        };
        if (!item.nama) item.errors.push('Nama wajib diisi.');
        if (!item.nisn) item.errors.push('NISN wajib diisi.');
        else if (!/^\d{8,12}$/.test(item.nisn)) item.errors.push('NISN harus 8–12 digit angka.');
        else if (existing[item.nisn]) item.errors.push('NISN sudah terdaftar.');
        else if (seen[item.nisn]) item.errors.push('NISN ganda di dalam file.');
        if (!item.kelas) item.errors.push('Kelas wajib diisi.');
        if (!item.jk) item.errors.push('Jenis Kelamin harus L atau P.');
        if (item.nisn) seen[item.nisn] = true;
        parsed.push(item);
      });

      if (!parsed.length) throw new Error('Tidak ada baris siswa yang dapat dibaca.');
      return parsed;
    }

    function downloadStudentTemplate() {
      ensureXLSX().then(function () {
        var aoa = [
          ['NISN', 'Nama', 'Kelas', 'Jenis Kelamin', 'Status'],
          ['0061234599', 'Contoh Nama Siswa', '6A', 'L', 'Aktif']
        ];
        var ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 8 }, { wch: 16 }, { wch: 10 }];
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
        XLSX.writeFile(wb, 'template-data-siswa.xlsx');
        toast('Template Excel berhasil diunduh.');
      }).catch(function (err) {
        toast(err.message || 'Gagal membuat template.', 'danger');
      });
    }

    function importStudentWorkbook(file) {
      if (!file) return;
      ensureXLSX().then(function () {
        return file.arrayBuffer();
      }).then(function (buf) {
        var wb = XLSX.read(buf, { type: 'array' });
        var parsed = parseStudentWorkbook(wb);
        var valid = parsed.filter(function (r) { return !r.errors.length; });
        var invalid = parsed.filter(function (r) { return r.errors.length; });
        var previewRows = invalid.concat(valid).slice(0, 12).map(function (r) {
          return '<tr>' +
            '<td class="mono">' + esc(r.nisn || '—') + '</td>' +
            '<td>' + esc(r.nama || '—') + '</td>' +
            '<td>' + esc(r.kelas || '—') + '</td>' +
            '<td>' + esc(r.jk || '—') + '</td>' +
            '<td>' + (r.errors.length
              ? '<span class="badge danger">Perlu koreksi</span><div class="row-error">' + r.errors.map(esc).join('<br>') + '</div>'
              : '<span class="badge success">Siap diimport</span>') + '</td>' +
          '</tr>';
        }).join('');
        openModal({
          title: 'Pratinjau Import Data Siswa',
          subtitle: file.name,
          size: 'lg',
          body: '<div class="preview-stats" style="margin-bottom:12px">' +
              '<span class="badge info">' + parsed.length + ' baris</span>' +
              '<span class="badge success">' + valid.length + ' valid</span>' +
              (invalid.length ? '<span class="badge danger">' + invalid.length + ' perlu koreksi</span>' : '') +
            '</div>' +
            '<div class="table-wrap"><table class="data" style="min-width:640px"><thead><tr>' +
              '<th>NISN</th><th>Nama</th><th>Kelas</th><th>L/P</th><th>Status</th>' +
            '</tr></thead><tbody>' + previewRows + '</tbody></table></div>' +
            (parsed.length > 12 ? '<p class="hint">Menampilkan 12 baris pertama. Baris yang perlu koreksi tidak akan diimport.</p>' : '') +
            (invalid.length ? '<p class="hint">Perbaiki baris bermasalah di file Excel lalu import ulang agar data rapi. Baris valid tetap dapat diimport sekarang.</p>' : ''),
          footer: '<button type="button" class="btn outline" data-close>Batal</button>' +
            '<button type="button" class="btn" id="confirmStudentImport"' + (valid.length ? '' : ' disabled') + '>' +
              icon('save') + 'Import ' + valid.length + ' Siswa</button>'
        });
        var confirmBtn = document.getElementById('confirmStudentImport');
        if (!confirmBtn) return;
        confirmBtn.addEventListener('click', function () {
          if (!valid.length) return;
          var extra = store.get('eujian.studentsExtra', []);
          if (!Array.isArray(extra)) extra = [];
          var base = Date.now();
          valid.forEach(function (r, idx) {
            extra.push({
              id: 'SX' + base + idx,
              nisn: r.nisn,
              nama: r.nama,
              kelas: r.kelas,
              jk: r.jk,
              status: r.status
            });
          });
          store.set('eujian.studentsExtra', extra);
          closeModal();
          refreshKelasOptions();
          state.q = '';
          state.kelas = 'all';
          state.status = 'all';
          state.page = 1;
          if (searchInput) searchInput.value = '';
          if (kelasSel) kelasSel.value = 'all';
          if (statusSel) statusSel.value = 'all';
          render();
          toast(valid.length + ' data siswa berhasil diimport.');
        });
      }).catch(function (err) {
        toast(err.message || 'Gagal membaca file Excel.', 'danger');
      });
    }

    var importStudentBtn = document.getElementById('importStudentBtn');
    var templateStudentBtn = document.getElementById('templateStudentBtn');
    var studentExcelFile = document.getElementById('studentExcelFile');
    if (importStudentBtn && studentExcelFile) {
      importStudentBtn.onclick = function () { studentExcelFile.click(); };
      studentExcelFile.addEventListener('change', function () {
        importStudentWorkbook(studentExcelFile.files && studentExcelFile.files[0]);
        studentExcelFile.value = '';
      });
    }
    if (templateStudentBtn) templateStudentBtn.onclick = downloadStudentTemplate;

    render();
  }

  /* ---------------- Data Guru ---------------- */
  function initTeachers() {
    var grid = document.getElementById('teacherGrid');
    if (!grid) return;
    var searchInput = document.getElementById('guruSearch');
    var mapelSel = document.getElementById('guruMapel');
    var state = { q: '', mapel: 'all' };

    function refreshMapelOptions() {
      if (!mapelSel) return;
      var current = state.mapel;
      var mapelList = Array.from(new Set(getTeachers().map(function (t) { return t.mapel; })));
      mapelSel.innerHTML = '<option value="all">Semua Mata Pelajaran</option>' + mapelList.map(function (m) {
        return '<option value="' + esc(m) + '">' + esc(m) + '</option>';
      }).join('');
      if (current !== 'all' && mapelList.indexOf(current) === -1) {
        state.mapel = 'all';
        mapelSel.value = 'all';
      } else {
        mapelSel.value = current;
      }
    }
    refreshMapelOptions();

    function render() {
      var q = state.q.toLowerCase();
      var list = getTeachers().filter(function (t) {
        var matchQ = !q || t.nama.toLowerCase().indexOf(q) > -1 || t.nip.indexOf(q) > -1;
        var matchMapel = state.mapel === 'all' || t.mapel === state.mapel;
        return matchQ && matchMapel;
      });
      var countEl = document.getElementById('guruCount');
      if (countEl) countEl.textContent = list.length + ' guru';
      grid.innerHTML = list.length ? list.map(function (t) {
        return '<article class="teacher-card">' +
          '<div class="teacher-top">' +
            '<span class="avatar lg">' + esc(initials(t.nama)) + '</span>' +
            '<div class="teacher-top-actions">' +
              '<span class="badge ' + (t.status === 'PNS' ? 'success' : t.status === 'PPPK' ? 'info' : 'warn') + '">' + esc(t.status) + '</span>' +
              '<button type="button" class="icon-btn" data-del-teacher="' + esc(t.id) + '" title="Hapus guru" aria-label="Hapus ' + esc(t.nama) + '">' + icon('trash') + '</button>' +
            '</div>' +
          '</div>' +
          '<h4>' + esc(t.nama) + '</h4>' +
          '<p class="teacher-nip">NIP. ' + esc(t.nip) + '</p>' +
          '<div class="teacher-tags"><span class="badge info">' + esc(t.mapel) + '</span><span class="badge">' + esc(t.kelas) + '</span></div>' +
          '<div class="teacher-foot"><span>' + esc(t.email) + '</span>' + icon('mail') + '</div>' +
        '</article>';
      }).join('') : '<div class="empty-state" style="grid-column:1/-1">' + icon('user-check') + 'Tidak ada guru yang sesuai pencarian.</div>';
    }

    if (searchInput) searchInput.addEventListener('input', function () { state.q = searchInput.value.trim(); render(); });
    if (mapelSel) mapelSel.addEventListener('change', function () { state.mapel = mapelSel.value; render(); });

    grid.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-del-teacher]');
      if (!btn) return;
      var id = btn.getAttribute('data-del-teacher');
      var teacher = getTeachers().find(function (t) { return t.id === id; });
      if (!teacher) return;
      confirmDialog({
        title: 'Hapus data guru?',
        message: teacher.nama + ' (NIP ' + teacher.nip + ') akan dihapus dari daftar guru.',
        confirmLabel: 'Ya, hapus',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        var extra = store.get('eujian.teachersExtra', []);
        var inExtra = Array.isArray(extra) && extra.some(function (t) { return t.id === id; });
        if (inExtra) {
          store.set('eujian.teachersExtra', extra.filter(function (t) { return t.id !== id; }));
        } else {
          var deleted = store.get('eujian.teachersDeleted', []);
          if (!Array.isArray(deleted)) deleted = [];
          deleted.push(id);
          store.set('eujian.teachersDeleted', deleted);
        }
        refreshMapelOptions();
        render();
        toast('Data guru berhasil dihapus.');
      });
    });

    var addBtn = document.getElementById('addTeacherBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var mapelOptions = MAPEL_LIST.concat(['Guru Kelas', 'Kepala Madrasah']).map(function (m) {
          return '<option>' + esc(m) + '</option>';
        }).join('');
        openModal({
          title: 'Tambah Data Guru',
          subtitle: 'Lengkapi identitas guru dengan benar.',
          size: 'lg',
          body: '<form id="teacherForm">' +
              '<div class="form-grid">' +
                '<div class="field"><label>Nama Lengkap</label><input class="input" name="nama" required maxlength="70" placeholder="Nama guru dan gelar"></div>' +
                '<div class="field"><label>NIP</label><input class="input" name="nip" required inputmode="numeric" maxlength="18" placeholder="NIP 8–18 digit"></div>' +
                '<div class="field"><label>Mata Pelajaran</label><select class="input" name="mapel">' + mapelOptions + '</select></div>' +
                '<div class="field"><label>Kelas / Tugas</label><input class="input" name="kelas" required maxlength="30" value="Kelas 4–6"></div>' +
                '<div class="field"><label>Status Kepegawaian</label><select class="input" name="status"><option>PNS</option><option>PPPK</option><option>GTY</option></select></div>' +
                '<div class="field"><label>Email</label><input class="input" name="email" type="email" required maxlength="70" placeholder="nama@min3mukomuko.sch.id"></div>' +
              '</div>' +
              '<div class="settings-actions"><button type="button" class="btn outline" data-close>Batal</button><button type="submit" class="btn">' + icon('save') + 'Simpan Guru</button></div>' +
            '</form>'
        });
        var form = document.getElementById('teacherForm');
        if (!form) return;
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var fd = new FormData(form);
          var nama = String(fd.get('nama') || '').trim();
          var nip = String(fd.get('nip') || '').trim();
          var email = String(fd.get('email') || '').trim();
          if (!nama || !nip || !email) return;
          if (!/^\d{8,18}$/.test(nip)) {
            toast('NIP harus berupa 8–18 digit angka.', 'danger');
            return;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast('Format email tidak valid.', 'danger');
            return;
          }
          if (getTeachers().some(function (t) { return t.nip === nip; })) {
            toast('NIP sudah terdaftar. Periksa kembali.', 'danger');
            return;
          }
          var extra = store.get('eujian.teachersExtra', []);
          if (!Array.isArray(extra)) extra = [];
          extra.push({
            id: 'GX' + Date.now(),
            nama: nama,
            nip: nip,
            mapel: String(fd.get('mapel') || 'Guru Kelas'),
            kelas: String(fd.get('kelas') || 'Kelas 4–6').trim(),
            status: String(fd.get('status') || 'PNS'),
            email: email
          });
          store.set('eujian.teachersExtra', extra);
          closeModal();
          refreshMapelOptions();
          render();
          toast('Data guru berhasil ditambahkan. Guru dapat masuk memakai nama atau NIP.');
        });
      });
    }

    /* ---- Import Excel ---- */
    function ensureXLSX() {
      if (window.XLSX) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var existing = document.querySelector('script[data-xlsx-cdn]');
        if (existing) {
          existing.addEventListener('load', function () { resolve(); });
          return;
        }
        var el = document.createElement('script');
        el.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        el.setAttribute('data-xlsx-cdn', '');
        el.onload = function () { resolve(); };
        el.onerror = function () { reject(new Error('Pustaka Excel gagal dimuat. Periksa koneksi internet.')); };
        document.head.appendChild(el);
      });
    }

    function normCell(v) { return String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9]/g, ''); }

    function normalizeTeacherMapel(v) {
      var s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
      if (!s) return 'Guru Kelas';
      var low = s.toLowerCase();
      var match = MAPEL_LIST.concat(['Guru Kelas', 'Kepala Madrasah']).find(function (m) { return m.toLowerCase() === low; });
      return match || s;
    }

    function normalizeTeacherStatus(v) {
      var s = normCell(v);
      if (/pppk/.test(s)) return 'PPPK';
      if (/gty|gtt|honor/.test(s)) return 'GTY';
      return 'PNS';
    }

    function parseTeacherWorkbook(wb) {
      var sheet = wb.Sheets[wb.SheetNames[0]];
      var matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
      if (!matrix.length) throw new Error('File Excel kosong.');

      var aliases = {
        nama: ['nama', 'namaguru', 'namalengkap'],
        nip: ['nip', 'nomorindukpegawai', 'nuptk', 'nomorinduk'],
        mapel: ['mapel', 'matapelajaran', 'mataajar', 'pelajaran'],
        kelas: ['kelas', 'tugas', 'kelastugas', 'rombel'],
        status: ['status', 'statuskepegawaian', 'kepegawaian'],
        email: ['email', 'surel', 'alamatemail']
      };
      function headerCol(headers, key) {
        for (var i = 0; i < aliases[key].length; i++) {
          var idx = headers.indexOf(aliases[key][i]);
          if (idx > -1) return idx;
        }
        return -1;
      }

      var headerIdx = -1;
      var col = null;
      for (var i = 0; i < Math.min(matrix.length, 10); i++) {
        var headers = matrix[i].map(normCell);
        var probe = {};
        ['nama', 'nip', 'mapel', 'kelas', 'status', 'email'].forEach(function (key) {
          probe[key] = headerCol(headers, key);
        });
        if (probe.nama > -1 && probe.nip > -1) { headerIdx = i; col = probe; break; }
      }
      if (headerIdx === -1) throw new Error('Baris judul kolom dengan Nama dan NIP tidak ditemukan. Gunakan template yang disediakan.');

      var existing = {};
      getTeachers().forEach(function (t) { existing[t.nip] = true; });
      var seen = {};
      var parsed = [];

      matrix.slice(headerIdx + 1).forEach(function (row) {
        var cells = row.map(function (c) { return String(c == null ? '' : c); });
        if (cells.every(function (c) { return !c.trim(); })) return;
        var cell = function (idx) { return idx > -1 ? String(cells[idx] == null ? '' : cells[idx]).trim() : ''; };
        var item = {
          nama: cell(col.nama).replace(/\s+/g, ' ').trim(),
          nip: cell(col.nip).replace(/[^0-9]/g, ''),
          mapel: normalizeTeacherMapel(cell(col.mapel)),
          kelas: cell(col.kelas) || 'Kelas 4–6',
          status: normalizeTeacherStatus(cell(col.status)),
          email: cell(col.email),
          errors: []
        };
        if (!item.nama) item.errors.push('Nama wajib diisi.');
        if (!item.nip) item.errors.push('NIP wajib diisi.');
        else if (!/^\d{8,18}$/.test(item.nip)) item.errors.push('NIP harus 8–18 digit angka.');
        else if (existing[item.nip]) item.errors.push('NIP sudah terdaftar.');
        else if (seen[item.nip]) item.errors.push('NIP ganda di dalam file.');
        if (item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) item.errors.push('Format email tidak valid.');
        if (item.nip) seen[item.nip] = true;
        parsed.push(item);
      });

      if (!parsed.length) throw new Error('Tidak ada baris guru yang dapat dibaca.');
      return parsed;
    }

    function downloadTeacherTemplate() {
      ensureXLSX().then(function () {
        var aoa = [
          ['Nama', 'NIP', 'Mata Pelajaran', 'Kelas / Tugas', 'Status Kepegawaian', 'Email'],
          ['Contoh Nama Guru, S.Pd.', '199001012020121001', 'Matematika', 'Kelas 4–6', 'PNS', 'nama@min3mukomuko.sch.id']
        ];
        var ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 30 }];
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
        XLSX.writeFile(wb, 'template-data-guru.xlsx');
        toast('Template Excel berhasil diunduh.');
      }).catch(function (err) {
        toast(err.message || 'Gagal membuat template.', 'danger');
      });
    }

    function importTeacherWorkbook(file) {
      if (!file) return;
      ensureXLSX().then(function () {
        return file.arrayBuffer();
      }).then(function (buf) {
        var wb = XLSX.read(buf, { type: 'array' });
        var parsed = parseTeacherWorkbook(wb);
        var valid = parsed.filter(function (r) { return !r.errors.length; });
        var invalid = parsed.filter(function (r) { return r.errors.length; });
        var previewRows = invalid.concat(valid).slice(0, 12).map(function (r) {
          return '<tr>' +
            '<td class="mono">' + esc(r.nip || '—') + '</td>' +
            '<td>' + esc(r.nama || '—') + '</td>' +
            '<td>' + esc(r.mapel) + '</td>' +
            '<td>' + esc(r.status) + '</td>' +
            '<td>' + esc(r.email || '—') + '</td>' +
            '<td>' + (r.errors.length
              ? '<span class="badge danger">Perlu koreksi</span><div class="row-error">' + r.errors.map(esc).join('<br>') + '</div>'
              : '<span class="badge success">Siap diimport</span>') + '</td>' +
          '</tr>';
        }).join('');
        openModal({
          title: 'Pratinjau Import Data Guru',
          subtitle: file.name,
          size: 'lg',
          body: '<div class="preview-stats" style="margin-bottom:12px">' +
              '<span class="badge info">' + parsed.length + ' baris</span>' +
              '<span class="badge success">' + valid.length + ' valid</span>' +
              (invalid.length ? '<span class="badge danger">' + invalid.length + ' perlu koreksi</span>' : '') +
            '</div>' +
            '<div class="table-wrap"><table class="data" style="min-width:720px"><thead><tr>' +
              '<th>NIP</th><th>Nama</th><th>Mapel</th><th>Status</th><th>Email</th><th>Status Import</th>' +
            '</tr></thead><tbody>' + previewRows + '</tbody></table></div>' +
            (parsed.length > 12 ? '<p class="hint">Menampilkan 12 baris pertama. Baris yang perlu koreksi tidak akan diimport.</p>' : '') +
            (invalid.length ? '<p class="hint">Perbaiki baris bermasalah di file Excel lalu import ulang agar data rapi. Baris valid tetap dapat diimport sekarang.</p>' : '') +
            '<p class="hint">Guru hasil import dapat masuk memakai <b>nama lengkap</b> atau <b>NIP</b> dengan kata sandi awal <b>123456</b>.</p>',
          footer: '<button type="button" class="btn outline" data-close>Batal</button>' +
            '<button type="button" class="btn" id="confirmTeacherImport"' + (valid.length ? '' : ' disabled') + '>' +
              icon('save') + 'Import ' + valid.length + ' Guru</button>'
        });
        var confirmBtn = document.getElementById('confirmTeacherImport');
        if (!confirmBtn) return;
        confirmBtn.addEventListener('click', function () {
          if (!valid.length) return;
          var extra = store.get('eujian.teachersExtra', []);
          if (!Array.isArray(extra)) extra = [];
          var base = Date.now();
          valid.forEach(function (r, idx) {
            extra.push({
              id: 'GX' + base + idx,
              nama: r.nama,
              nip: r.nip,
              mapel: r.mapel,
              kelas: r.kelas,
              status: r.status,
              email: r.email
            });
          });
          store.set('eujian.teachersExtra', extra);
          closeModal();
          refreshMapelOptions();
          state.q = '';
          state.mapel = 'all';
          if (searchInput) searchInput.value = '';
          if (mapelSel) mapelSel.value = 'all';
          render();
          toast(valid.length + ' data guru berhasil diimport. Login guru memakai nama atau NIP.');
        });
      }).catch(function (err) {
        toast(err.message || 'Gagal membaca file Excel.', 'danger');
      });
    }

    var importTeacherBtn = document.getElementById('importTeacherBtn');
    var templateTeacherBtn = document.getElementById('templateTeacherBtn');
    var teacherExcelFile = document.getElementById('teacherExcelFile');
    if (importTeacherBtn && teacherExcelFile) {
      importTeacherBtn.onclick = function () { teacherExcelFile.click(); };
      teacherExcelFile.addEventListener('change', function () {
        importTeacherWorkbook(teacherExcelFile.files && teacherExcelFile.files[0]);
        teacherExcelFile.value = '';
      });
    }
    if (templateTeacherBtn) templateTeacherBtn.onclick = downloadTeacherTemplate;

    render();
  }

  /* ---------------- Jadwal Ujian ---------------- */
  function initSchedule() {
    var tbody = document.getElementById('scheduleRows');
    if (!tbody) return;
    var state = { kelas: 'all', mapel: 'all' };
    var kelasSel = document.getElementById('scheduleKelas');
    var mapelSel = document.getElementById('scheduleMapel');

    if (kelasSel) {
      kelasSel.innerHTML = '<option value="all">Semua Kelas</option>' + ['4', '5', '6'].map(function (k) {
        return '<option value="' + k + '">Kelas ' + k + '</option>';
      }).join('');
    }
    if (mapelSel) {
      var mapelList = Array.from(new Set(DATA.schedules.map(function (s) { return s.mapel; })));
      mapelSel.innerHTML = '<option value="all">Semua Mata Pelajaran</option>' + mapelList.map(function (m) {
        return '<option value="' + esc(m) + '">' + esc(m) + '</option>';
      }).join('');
    }

    var session = getSession();
    var myLevel = null;
    if (session && session.role === 'siswa') {
      var match = /Kelas\s+(\d)/.exec(session.detail || '');
      if (match) myLevel = match[1];
    }
    if (myLevel) {
      state.kelas = myLevel;
      if (kelasSel) kelasSel.value = myLevel;
    }

    function renderNext() {
      var el = document.getElementById('nextExamCard');
      if (!el) return;
      var upcoming = getUpcomingSchedules();
      if (myLevel) upcoming = upcoming.filter(function (s) { return s.kelas === myLevel; });
      var next = upcoming[0];
      if (!next) {
        el.innerHTML = '<div class="date-badge"><strong>' + new Date().getDate() + '</strong><span>' + MONTHS_SHORT[new Date().getMonth()] + '</span></div>' +
          '<div><div class="eyebrow">Jadwal Ujian</div><h3>Tidak ada ujian mendatang</h3><p>Seluruh jadwal pada periode ini telah selesai.</p></div>' +
          '<div class="countdown-pill"><strong>0</strong><span>hari lagi</span></div>';
        return;
      }
      el.innerHTML = '<div class="date-badge"><strong>' + dayNumber(next.date) + '</strong><span>' + monthShort(next.date) + '</span></div>' +
        '<div><div class="eyebrow">Ujian berikutnya · UAS Ganjil ' + esc(getSettings().tahunPelajaran) + '</div>' +
        '<h3>' + esc(next.mapel) + ' · Kelas ' + esc(next.kelas) + '</h3>' +
        '<p>' + esc(fmtFullDate(next.date)) + ' · ' + next.start + '–' + next.end + ' WIB · ' + esc(next.room) + ' · Pengawas: ' + esc(next.pengawas) + '</p></div>' +
        '<div class="countdown-pill"><strong>' + daysUntil(next.date) + '</strong><span>hari lagi</span></div>';
    }

    function renderTable() {
      var list = sortedSchedules().filter(function (s) {
        var matchKelas = state.kelas === 'all' || s.kelas === state.kelas;
        var matchMapel = state.mapel === 'all' || s.mapel === state.mapel;
        return matchKelas && matchMapel;
      });
      tbody.innerHTML = list.length ? list.map(function (s, idx) {
        var status = scheduleStatus(s);
        return '<tr>' +
          '<td class="num">' + (idx + 1) + '</td>' +
          '<td><strong style="font-size:12px;font-weight:600">' + esc(fmtFullDate(s.date)) + '</strong></td>' +
          '<td class="mono">' + s.start + '–' + s.end + '</td>' +
          '<td><span class="badge info">' + esc(s.mapel) + '</span></td>' +
          '<td>Kelas ' + esc(s.kelas) + '</td>' +
          '<td class="mono">' + esc(s.room) + '</td>' +
          '<td>' + esc(s.pengawas) + '</td>' +
          '<td><span class="badge ' + status.cls + '">' + status.label + '</span></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty-state">' + icon('calendar') + 'Tidak ada jadwal yang sesuai filter.</div></td></tr>';

      var countEl = document.getElementById('scheduleCount');
      if (countEl) countEl.textContent = list.length + ' jadwal';
    }

    if (kelasSel) kelasSel.addEventListener('change', function () { state.kelas = kelasSel.value; renderTable(); });
    if (mapelSel) mapelSel.addEventListener('change', function () { state.mapel = mapelSel.value; renderTable(); });
    renderNext();
    renderTable();
  }

  /* ---------------- Bank Soal ---------------- */
  function initBankSoal() {
    var tbody = document.getElementById('soalRows');
    if (!tbody) return;
    var state = { q: '', mapel: 'all', kelas: 'all', tipe: 'all' };
    var searchInput = document.getElementById('soalSearch');
    var mapelSel = document.getElementById('soalMapel');
    var kelasSel = document.getElementById('soalKelas');
    var tipeSel = document.getElementById('soalTipe');

    if (mapelSel) {
      var bankMapel = Array.from(new Set(MAPEL_LIST.concat(getQuestions().map(function (q) { return q.mapel; }).filter(Boolean))));
      mapelSel.innerHTML = '<option value="all">Semua Mapel</option>' + bankMapel.map(function (m) {
        return '<option value="' + esc(m) + '">' + esc(m) + '</option>';
      }).join('');
    }
    if (kelasSel) {
      kelasSel.innerHTML = '<option value="all">Semua Kelas</option>' + ['4', '5', '6'].map(function (k) {
        return '<option value="' + k + '">Kelas ' + k + '</option>';
      }).join('');
    }

    function renderStats(all) {
      var el = document.getElementById('bankStats');
      if (!el) return;
      var pg = all.filter(function (q) { return q.tipe === 'PG'; }).length;
      var uraian = all.filter(function (q) { return q.tipe === 'Uraian'; }).length;
      el.innerHTML =
        '<div class="stat"><div class="stat-icon">' + icon('file-text') + '</div><div><strong>' + all.length + '</strong><span class="stat-label">Total Soal</span><small>Seluruh mata pelajaran</small></div></div>' +
        '<div class="stat"><div class="stat-icon gold">' + icon('check-circle') + '</div><div><strong>' + pg + '</strong><span class="stat-label">Pilihan Ganda</span><small>Dikoreksi otomatis</small></div></div>' +
        '<div class="stat"><div class="stat-icon blue">' + icon('book') + '</div><div><strong>' + uraian + '</strong><span class="stat-label">Uraian</span><small>Dikoreksi guru</small></div></div>';
    }

    function render() {
      var all = getQuestions();
      renderStats(all);
      var q = state.q.toLowerCase();
      var list = all.filter(function (item) {
        var matchQ = !q || item.text.toLowerCase().indexOf(q) > -1;
        var matchMapel = state.mapel === 'all' || item.mapel === state.mapel;
        var matchKelas = state.kelas === 'all' || item.kelas === state.kelas;
        var matchTipe = state.tipe === 'all' || item.tipe === state.tipe;
        return matchQ && matchMapel && matchKelas && matchTipe;
      });

      var extras = store.get('eujian.soalExtra', []);
      var extraIds = Array.isArray(extras) ? extras.map(function (q) { return q.id; }) : [];

      tbody.innerHTML = list.length ? list.map(function (item, idx) {
        return '<tr>' +
          '<td class="num">' + (idx + 1) + '</td>' +
          '<td><div class="question-text">' + (safeImageSrc(item.gambar) ? '<span class="q-img-tag" title="Soal dengan gambar">' + icon('image') + '</span>' : '') + esc(truncate(item.text, 92)) + '</div></td>' +
          '<td><span class="badge info">' + esc(item.mapel) + '</span></td>' +
          '<td>Kelas ' + esc(item.kelas) + '</td>' +
          '<td><span class="badge ' + (item.tipe === 'PG' ? '' : 'warn') + '">' + esc(item.tipe) + '</span></td>' +
          '<td><strong>' + (item.tipe === 'PG' ? esc(item.kunci) : '—') + '</strong></td>' +
          '<td class="num">' + item.bobot + '</td>' +
          '<td><div class="table-action">' +
            '<button class="btn ghost sm" data-view="' + esc(item.id) + '" title="Lihat soal">' + icon('eye') + '</button>' +
            (extraIds.indexOf(item.id) > -1
              ? '<button class="btn ghost sm" data-edit-q="' + esc(item.id) + '" title="Edit soal hasil import">' + icon('edit') + '</button>'
              : '') +
            '<button class="btn ghost sm" data-del="' + esc(item.id) + '" title="Hapus soal">' + icon('trash') + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty-state">' + icon('file-text') + 'Tidak ada soal yang sesuai filter.</div></td></tr>';

      var countEl = document.getElementById('soalCount');
      if (countEl) countEl.textContent = list.length + ' soal';
    }

    function editExtraSoal(item) {
      var mapelOptions = MAPEL_LIST.map(function (m) {
        return '<option' + (m === item.mapel ? ' selected' : '') + '>' + esc(m) + '</option>';
      }).join('');
      var kelasOptions = ['4', '5', '6'].map(function (k) {
        return '<option value="' + k + '"' + (String(item.kelas) === k ? ' selected' : '') + '>Kelas ' + k + '</option>';
      }).join('');
      var opts = Array.isArray(item.options) ? item.options : ['', '', '', ''];

      openModal({
        title: 'Edit Soal Import',
        subtitle: 'Perubahan langsung tersimpan ke bank soal setelah disetujui.',
        size: 'lg',
        body: '<form id="bsEditForm" novalidate>' +
            '<div class="form-grid">' +
              '<div class="field"><label for="bsMapel">Mata Pelajaran</label><select class="input" id="bsMapel">' + mapelOptions + '</select></div>' +
              '<div class="field"><label for="bsKelas">Kelas</label><select class="input" id="bsKelas">' + kelasOptions + '</select></div>' +
              '<div class="field"><label for="bsTipe">Jenis Soal</label><select class="input" id="bsTipe"><option value="PG">Pilihan Ganda</option><option value="Uraian">Uraian</option></select></div>' +
              '<div class="field"><label for="bsBobot">Bobot Nilai</label><input class="input" id="bsBobot" type="number" min="1" max="100"></div>' +
            '</div>' +
            '<div class="field"><label for="bsText">Pertanyaan</label><textarea class="input" id="bsText" rows="4"></textarea></div>' +
            '<div id="bsPgFields">' +
              '<div class="form-grid">' +
                ['A', 'B', 'C', 'D'].map(function (letter, i) {
                  return '<div class="field"><label>Pilihan ' + letter + '</label><input class="input" id="bsOpt' + i + '"></div>';
                }).join('') +
              '</div>' +
              '<div class="field" style="max-width:220px"><label for="bsKunci">Kunci Jawaban</label>' +
                '<select class="input" id="bsKunci"><option value="">— Pilih kunci —</option><option>A</option><option>B</option><option>C</option><option>D</option></select></div>' +
            '</div>' +
            '<div class="field" id="bsUraianField" hidden><label for="bsJawaban">Kunci / Rubrik Jawaban</label><textarea class="input" id="bsJawaban" rows="2"></textarea></div>' +
            '<div class="field"><label for="bsPembahasan">Pembahasan (opsional)</label><textarea class="input" id="bsPembahasan" rows="2"></textarea></div>' +
            questionImageFieldHTML('bsImg') +
            '<p class="form-error" id="bsError" hidden></p>' +
          '</form>',
        footer: '<button type="button" class="btn outline" data-close>Batal</button>' +
                '<button type="submit" form="bsEditForm" class="btn">' + icon('save') + ' Simpan Perubahan</button>'
      });

      var tipeEl = document.getElementById('bsTipe');
      var bobotEl = document.getElementById('bsBobot');
      var textEl = document.getElementById('bsText');
      var kunciEl = document.getElementById('bsKunci');
      var jawabanEl = document.getElementById('bsJawaban');
      var pembahasanEl = document.getElementById('bsPembahasan');
      var pgFields = document.getElementById('bsPgFields');
      var uraianField = document.getElementById('bsUraianField');
      var errEl = document.getElementById('bsError');
      var bsImgState = setupQuestionImageField('bsImg', item.gambar);

      tipeEl.value = item.tipe === 'Uraian' ? 'Uraian' : 'PG';
      bobotEl.value = item.bobot;
      textEl.value = item.text;
      pembahasanEl.value = item.pembahasan || '';
      ['bsOpt0', 'bsOpt1', 'bsOpt2', 'bsOpt3'].forEach(function (id, i) {
        document.getElementById(id).value = opts[i] || '';
      });
      kunciEl.value = /^[A-D]$/.test(item.kunci || '') ? item.kunci : '';
      jawabanEl.value = item.tipe === 'Uraian' ? (item.jawaban || item.kunci || '') : '';

      function syncTipe() {
        var isPg = tipeEl.value === 'PG';
        pgFields.hidden = !isPg;
        uraianField.hidden = isPg;
      }
      tipeEl.addEventListener('change', syncTipe);
      syncTipe();

      document.getElementById('bsEditForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var errs = [];
        var text = textEl.value.trim();
        var bobot = parseInt(bobotEl.value, 10) || 0;
        if (!text) errs.push('Pertanyaan wajib diisi.');
        if (bobot < 1 || bobot > 100) errs.push('Bobot nilai harus 1–100.');
        var updated = Object.assign({}, item, {
          mapel: document.getElementById('bsMapel').value,
          kelas: document.getElementById('bsKelas').value,
          tipe: tipeEl.value,
          bobot: bobot,
          text: text,
          pembahasan: pembahasanEl.value.trim(),
          gambar: bsImgState && bsImgState.value ? bsImgState.value : ''
        });
        if (tipeEl.value === 'PG') {
          var options = ['bsOpt0', 'bsOpt1', 'bsOpt2', 'bsOpt3'].map(function (id) {
            return document.getElementById(id).value.trim();
          });
          var kunci = kunciEl.value;
          if (options.some(function (o) { return !o; })) errs.push('Pilihan A–D wajib lengkap.');
          if (!/^[A-D]$/.test(kunci)) errs.push('Kunci jawaban harus A, B, C, atau D.');
          updated.options = options;
          updated.kunci = kunci;
          delete updated.jawaban;
        } else {
          updated.jawaban = jawabanEl.value.trim() || 'Jawaban uraian dinilai berdasarkan rubrik.';
          updated.kunci = '';
          delete updated.options;
        }
        if (errs.length) {
          errEl.hidden = false;
          errEl.textContent = errs.join(' ');
          return;
        }
        var extras = store.get('eujian.soalExtra', []);
        if (!Array.isArray(extras)) extras = [];
        store.set('eujian.soalExtra', extras.map(function (q) {
          return q.id === item.id ? updated : q;
        }));
        closeModal();
        render();
        toast('Soal hasil import berhasil diperbarui.');
      });
    }

    if (searchInput) searchInput.addEventListener('input', function () { state.q = searchInput.value.trim(); render(); });
    if (mapelSel) mapelSel.addEventListener('change', function () { state.mapel = mapelSel.value; render(); });
    if (kelasSel) kelasSel.addEventListener('change', function () { state.kelas = kelasSel.value; render(); });
    if (tipeSel) tipeSel.addEventListener('change', function () { state.tipe = tipeSel.value; render(); });

    tbody.addEventListener('click', function (event) {
      var viewBtn = event.target.closest('[data-view]');
      var editBtn = event.target.closest('[data-edit-q]');
      var delBtn = event.target.closest('[data-del]');

      if (editBtn) {
        var target = getQuestions().find(function (q) { return q.id === editBtn.getAttribute('data-edit-q'); });
        if (target) editExtraSoal(target);
        return;
      }

      if (viewBtn) {
        var item = getQuestions().find(function (q) { return q.id === viewBtn.getAttribute('data-view'); });
        if (!item) return;
        var optionsHTML = item.tipe === 'PG' && Array.isArray(item.options) ? item.options.map(function (opt, i) {
          var letter = 'ABCD'[i];
          return '<div class="option-preview' + (item.kunci === letter ? ' correct' : '') + '"><b>' + letter + '.</b>' + esc(opt) +
            (item.kunci === letter ? ' <span class="badge success" style="margin-left:6px">Kunci</span>' : '') + '</div>';
        }).join('') : '';
        openModal({
          title: 'Detail Soal',
          subtitle: 'Bank soal UAS Ganjil · ' + esc(item.mapel) + ' Kelas ' + esc(item.kelas),
          body: '<div class="q-tags"><span class="badge info">' + esc(item.mapel) + '</span><span class="badge">Kelas ' + esc(item.kelas) + '</span>' +
              '<span class="badge ' + (item.tipe === 'PG' ? 'success' : 'warn') + '">' + esc(item.tipe) + '</span><span class="badge">Bobot ' + item.bobot + '</span></div>' +
            '<p style="font-size:13px;line-height:1.7;margin:0 0 12px">' + esc(item.text) + '</p>' +
            (safeImageSrc(item.gambar) ? '<figure class="q-figure"><img src="' + esc(safeImageSrc(item.gambar)) + '" alt="Gambar soal"></figure>' : '') +
            optionsHTML +
            (item.tipe === 'Uraian' && item.jawaban ? '<div class="result-note" style="margin:12px 0 0"><span>' + icon('info') + '</span><span>' + esc(item.jawaban) + '</span></div>' : '') +
            (item.pembahasan ? '<p class="hint" style="margin:12px 0 0"><b>Pembahasan:</b> ' + esc(item.pembahasan) + '</p>' : ''),
          footer: '<button type="button" class="btn outline" data-close>Tutup</button>'
        });
        return;
      }

      if (delBtn) {
        var id = delBtn.getAttribute('data-del');
        var soal = getQuestions().find(function (q) { return q.id === id; });
        confirmDialog({
          title: 'Hapus soal?',
          message: 'Soal "' + (soal ? truncate(soal.text, 70) : '') + '" akan dihapus dari bank soal.',
          confirmLabel: 'Ya, hapus',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          var extra = store.get('eujian.soalExtra', []);
          var inExtra = Array.isArray(extra) && extra.some(function (q) { return q.id === id; });
          if (inExtra) {
            store.set('eujian.soalExtra', extra.filter(function (q) { return q.id !== id; }));
          } else {
            var deleted = store.get('eujian.soalDeleted', []);
            if (!Array.isArray(deleted)) deleted = [];
            deleted.push(id);
            store.set('eujian.soalDeleted', deleted);
          }
          render();
          toast('Soal berhasil dihapus.');
        });
      }
    });

    var addBtn = document.getElementById('addSoalBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var mapelOptions = MAPEL_LIST.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('');
        openModal({
          title: 'Tambah Soal Baru',
          subtitle: 'Soal akan masuk ke bank soal madrasah.',
          size: 'lg',
          body: '<form id="soalForm">' +
              '<div class="form-grid">' +
                '<div class="field"><label>Mata Pelajaran</label><select class="input" name="mapel">' + mapelOptions + '</select></div>' +
                '<div class="field"><label>Kelas</label><select class="input" name="kelas"><option value="4">Kelas 4</option><option value="5">Kelas 5</option><option value="6">Kelas 6</option></select></div>' +
                '<div class="field"><label>Tipe Soal</label><select class="input" name="tipe" id="newTipe"><option value="PG">Pilihan Ganda</option><option value="Uraian">Uraian</option></select></div>' +
                '<div class="field"><label>Bobot Nilai</label><input class="input" name="bobot" type="number" min="1" max="100" value="10" required></div>' +
              '</div>' +
              '<div class="field"><label>Pertanyaan</label><textarea class="input" name="text" rows="3" required placeholder="Tulis pertanyaan di sini..."></textarea></div>' +
              questionImageFieldHTML('soalImg') +
              '<div id="pgFields">' +
                '<div class="form-grid">' +
                  '<div class="field"><label>Pilihan A</label><input class="input" name="optA" placeholder="Pilihan A"></div>' +
                  '<div class="field"><label>Pilihan B</label><input class="input" name="optB" placeholder="Pilihan B"></div>' +
                  '<div class="field"><label>Pilihan C</label><input class="input" name="optC" placeholder="Pilihan C"></div>' +
                  '<div class="field"><label>Pilihan D</label><input class="input" name="optD" placeholder="Pilihan D"></div>' +
                '</div>' +
                '<div class="field" style="max-width:180px"><label>Kunci Jawaban</label><select class="input" name="kunci"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>' +
              '</div>' +
              '<div class="settings-actions"><button type="button" class="btn outline" data-close>Batal</button><button type="submit" class="btn">' + icon('save') + 'Simpan Soal</button></div>' +
            '</form>'
        });

        var form = document.getElementById('soalForm');
        var tipe = document.getElementById('newTipe');
        var pgFields = document.getElementById('pgFields');
        var soalImgState = setupQuestionImageField('soalImg', '');
        if (tipe && pgFields) {
          tipe.addEventListener('change', function () {
            pgFields.style.display = tipe.value === 'PG' ? '' : 'none';
          });
        }
        if (!form) return;
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var fd = new FormData(form);
          var text = String(fd.get('text') || '').trim();
          var tipeVal = String(fd.get('tipe') || 'PG');
          if (!text) return;
          var newQ = {
            id: 'QX' + Date.now(),
            mapel: String(fd.get('mapel') || 'Matematika'),
            kelas: String(fd.get('kelas') || '6'),
            tipe: tipeVal,
            bobot: parseInt(fd.get('bobot'), 10) || 10,
            text: text
          };
          if (soalImgState && soalImgState.value) newQ.gambar = soalImgState.value;
          if (tipeVal === 'PG') {
            var options = ['optA', 'optB', 'optC', 'optD'].map(function (key) { return String(fd.get(key) || '').trim(); });
            if (options.some(function (opt) { return !opt; })) {
              toast('Lengkapi seluruh pilihan jawaban.', 'danger');
              return;
            }
            newQ.options = options;
            newQ.kunci = String(fd.get('kunci') || 'A');
          } else {
            newQ.jawaban = 'Jawaban uraian akan dinilai berdasarkan rubrik.';
          }
          var extra = store.get('eujian.soalExtra', []);
          if (!Array.isArray(extra)) extra = [];
          extra.unshift(newQ);
          store.set('eujian.soalExtra', extra);
          closeModal();
          render();
          toast('Soal baru berhasil ditambahkan.');
        });
      });
    }

    render();
  }

  /* ---------------- Import Soal ---------------- */
  function initImport() {
    var previewCard = document.getElementById('previewCard');
    if (!previewCard) return;
    var mapelSel = document.getElementById('impMapel');
    var kelasSel = document.getElementById('impKelas');
    var bobotInput = document.getElementById('impBobot');
    var previewRows = document.getElementById('previewRows');
    var previewStats = document.getElementById('previewStats');
    var previewInfo = document.getElementById('previewInfo');
    var pdfLog = document.getElementById('pdfLog');
    var wordLog = document.getElementById('wordLog');
    var ocrProgress = document.getElementById('ocrProgress');
    var rows = [];
    var sourceLabel = '';
    var tesseractWorker = null;

    if (mapelSel) {
      mapelSel.innerHTML = MAPEL_LIST.map(function (m) {
        return '<option value="' + esc(m) + '">' + esc(m) + '</option>';
      }).join('');
    }

    function defaultBobot() {
      var val = parseInt(bobotInput ? bobotInput.value : 10, 10);
      return val >= 1 && val <= 100 ? val : 10;
    }

    function setLog(msg) { if (pdfLog) pdfLog.textContent = msg; }
    function setWordLog(msg) { if (wordLog) wordLog.textContent = msg; }
    function setProgress(pct, show) {
      if (!ocrProgress) return;
      ocrProgress.hidden = !show;
      var bar = ocrProgress.querySelector('span');
      if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }

    function ensureScript(src) {
      return new Promise(function (resolve, reject) {
        if (document.querySelector('script[src="' + src + '"]')) return resolve();
        var el = document.createElement('script');
        el.src = src;
        el.onload = function () { resolve(); };
        el.onerror = function () { reject(new Error('Gagal memuat pustaka dari ' + src)); };
        document.head.appendChild(el);
      });
    }

    function ensureXLSX() {
      if (window.XLSX) return Promise.resolve();
      return ensureScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    }

    function ensurePdfJs() {
      if (window.pdfjsLib) return Promise.resolve();
      return ensureScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js').then(function () {
        if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      });
    }

    function ensureMammoth() {
      if (window.mammoth) return Promise.resolve();
      return ensureScript('assets/vendor/mammoth.browser.min.js').catch(function () {
        return ensureScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
      });
    }

    function ensureTesseract() {
      if (window.Tesseract) return Promise.resolve();
      return ensureScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    }

    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = location.protocol === 'file:'
        ? 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
        : 'assets/vendor/pdf.worker.min.js';
    }

    function normalizeTipe(value) {
      var s = String(value || '').trim().toLowerCase();
      if (!s) return '';
      if (/uraian|esai|essay|subjektif/.test(s)) return 'Uraian';
      if (/pg|pilihan|objektif|multiple/.test(s)) return 'PG';
      return '';
    }

    function validateRow(r) {
      var errs = [];
      if (!String(r.text || '').trim()) errs.push('Pertanyaan wajib diisi.');
      if (r.tipe !== 'PG' && r.tipe !== 'Uraian') errs.push('Jenis soal harus PG atau Uraian.');
      var bobot = Number(r.bobot);
      if (!bobot || bobot < 1 || bobot > 100) errs.push('Bobot nilai harus 1–100.');
      if (r.tipe === 'PG') {
        if (!Array.isArray(r.options) || r.options.length !== 4 || r.options.some(function (o) { return !String(o || '').trim(); })) {
          errs.push('Pilihan A–D wajib lengkap.');
        }
        if (!/^[A-D]$/i.test(String(r.kunci || ''))) errs.push('Kunci jawaban PG harus A, B, C, atau D (isi manual bila tidak terbaca).');
      }
      return errs;
    }

    function normalizeKunci(value) {
      var m = String(value || '').trim().match(/\b([A-D])\b/i);
      return m ? m[1].toUpperCase() : '';
    }

    function showPreview(source) {
      sourceLabel = source;
      previewCard.hidden = rows.length === 0;
      renderPreview();
    }

    function renderPreview() {
      var validCount = 0;
      rows.forEach(function (r) {
        r.errors = validateRow(r);
        if (!r.errors.length) validCount++;
      });
      var invalidCount = rows.length - validCount;

      if (previewStats) {
        previewStats.innerHTML =
          '<span class="badge info">' + rows.length + ' baris</span>' +
          '<span class="badge success">' + validCount + ' valid</span>' +
          (invalidCount ? '<span class="badge danger">' + invalidCount + ' perlu koreksi</span>' : '');
      }
      if (previewInfo) {
        previewInfo.textContent = (sourceLabel ? sourceLabel + ' · ' : '') +
          (mapelSel ? mapelSel.value : '') + ' Kelas ' + (kelasSel ? kelasSel.value : '') +
          ' · soal hanya tersimpan setelah Anda menyetujui';
      }

      previewRows.innerHTML = rows.map(function (r, idx) {
        return '<tr>' +
          '<td class="num">' + (r.nomor || idx + 1) + '</td>' +
          '<td><div class="question-text" style="max-width:360px">' + esc(truncate(r.text, 110)) + '</div></td>' +
          '<td><span class="badge ' + (r.tipe === 'PG' ? '' : 'warn') + '">' + esc(r.tipe || '—') + '</span></td>' +
          '<td><strong>' + (r.tipe === 'PG' ? esc(r.kunci || '—') : 'Rubrik') + '</strong></td>' +
          '<td class="num">' + esc(r.bobot) + '</td>' +
          '<td>' + (r.errors.length
            ? '<span class="badge danger">Perlu koreksi</span><div class="row-error">' + r.errors.map(esc).join('<br>') + '</div>'
            : '<span class="badge success">Valid</span>') + '</td>' +
          '<td><div class="table-action">' +
            '<button class="btn ghost sm" data-edit="' + idx + '" title="Koreksi soal">' + icon('eye') + '</button>' +
            '<button class="btn ghost sm" data-del="' + idx + '" title="Hapus baris">' + icon('trash') + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') || '<tr><td colspan="7"><div class="empty-state">' + icon('file-text') + 'Belum ada soal hasil import.</div></td></tr>';

      previewCard.hidden = rows.length === 0;
    }

    function editRow(index) {
      var r = rows[index];
      if (!r) return;
      openModal({
        title: 'Koreksi Soal',
        subtitle: 'Periksa hasil pembacaan. Perubahan belum disimpan sampai Anda menekan Setujui.',
        size: 'lg',
        body: '<form id="impEditForm" novalidate>' +
            '<div class="form-grid">' +
              '<div class="field"><label for="impTipe">Jenis Soal</label><select class="input" id="impTipe"><option value="PG">Pilihan Ganda</option><option value="Uraian">Uraian</option></select></div>' +
              '<div class="field"><label for="impBobotEdit">Bobot Nilai</label><input class="input" id="impBobotEdit" type="number" min="1" max="100"></div>' +
            '</div>' +
            '<div class="field"><label for="impText">Pertanyaan</label><textarea class="input" id="impText" rows="4"></textarea></div>' +
            '<div id="impPgFields">' +
              '<div class="form-grid">' +
                ['A', 'B', 'C', 'D'].map(function (letter, i) {
                  return '<div class="field"><label>Pilihan ' + letter + '</label><input class="input" id="impOpt' + i + '"></div>';
                }).join('') +
              '</div>' +
              '<div class="field" style="max-width:220px"><label for="impKunci">Kunci Jawaban</label>' +
                '<select class="input" id="impKunci"><option value="">— Pilih kunci —</option><option>A</option><option>B</option><option>C</option><option>D</option></select></div>' +
            '</div>' +
            '<div class="field" id="impUraianField" hidden><label for="impJawaban">Kunci / Rubrik Jawaban</label><textarea class="input" id="impJawaban" rows="2" placeholder="Rubrik atau jawaban acuan untuk penilaian uraian"></textarea></div>' +
            '<div class="field"><label for="impPembahasan">Pembahasan (opsional)</label><textarea class="input" id="impPembahasan" rows="2"></textarea></div>' +
            '<p class="form-error" id="impEditError" hidden></p>' +
          '</form>',
        footer: '<button type="button" class="btn outline" data-close>Batal</button>' +
                '<button type="submit" form="impEditForm" class="btn">' + icon('save') + ' Simpan Koreksi</button>'
      });

      var tipeEl = document.getElementById('impTipe');
      var bobotEl = document.getElementById('impBobotEdit');
      var textEl = document.getElementById('impText');
      var kunciEl = document.getElementById('impKunci');
      var jawabanEl = document.getElementById('impJawaban');
      var pembahasanEl = document.getElementById('impPembahasan');
      var pgFields = document.getElementById('impPgFields');
      var uraianField = document.getElementById('impUraianField');
      var errEl = document.getElementById('impEditError');

      tipeEl.value = r.tipe === 'Uraian' ? 'Uraian' : 'PG';
      bobotEl.value = r.bobot;
      textEl.value = r.text;
      pembahasanEl.value = r.pembahasan || '';
      var opts = r.options || ['', '', '', ''];
      ['impOpt0', 'impOpt1', 'impOpt2', 'impOpt3'].forEach(function (id, i) {
        var el = document.getElementById(id);
        if (el) el.value = opts[i] || '';
      });
      kunciEl.value = /^[A-D]$/.test(r.kunci || '') ? r.kunci : '';
      jawabanEl.value = r.tipe === 'Uraian' ? (r.kunci || '') : '';

      function syncTipe() {
        var isPg = tipeEl.value === 'PG';
        pgFields.hidden = !isPg;
        uraianField.hidden = isPg;
      }
      tipeEl.addEventListener('change', syncTipe);
      syncTipe();

      document.getElementById('impEditForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var next = {
          nomor: r.nomor,
          text: textEl.value.trim(),
          tipe: tipeEl.value,
          bobot: parseInt(bobotEl.value, 10) || 0,
          pembahasan: pembahasanEl.value.trim(),
          mapel: r.mapel,
          kelas: r.kelas
        };
        if (next.tipe === 'PG') {
          next.options = ['impOpt0', 'impOpt1', 'impOpt2', 'impOpt3'].map(function (id) {
            return document.getElementById(id).value.trim();
          });
          next.kunci = kunciEl.value;
        } else {
          next.options = [];
          next.kunci = jawabanEl.value.trim();
        }
        next.errors = validateRow(next);
        if (next.errors.length) {
          errEl.hidden = false;
          errEl.textContent = next.errors.join(' ');
          return;
        }
        rows[index] = next;
        closeModal();
        renderPreview();
        toast('Koreksi soal disimpan di pratinjau.');
      });
    }

    previewRows.addEventListener('click', function (event) {
      var editBtn = event.target.closest('[data-edit]');
      var delBtn = event.target.closest('[data-del]');
      if (editBtn) {
        editRow(parseInt(editBtn.getAttribute('data-edit'), 10));
        return;
      }
      if (delBtn) {
        rows.splice(parseInt(delBtn.getAttribute('data-del'), 10), 1);
        renderPreview();
        toast('Baris soal dihapus dari pratinjau.');
      }
    });

    document.getElementById('discardBtn').addEventListener('click', function () {
      rows = [];
      renderPreview();
      toast('Pratinjau dibatalkan. Tidak ada soal yang disimpan.');
    });

    document.getElementById('approveBtn').addEventListener('click', function () {
      var valid = rows.filter(function (r) { return !validateRow(r).length; });
      var invalid = rows.length - valid.length;
      if (!valid.length) {
        toast('Tidak ada soal valid untuk disimpan. Perbaiki baris yang bermasalah terlebih dahulu.', 'danger');
        return;
      }
      confirmDialog({
        title: 'Setujui dan simpan soal?',
        message: valid.length + ' soal valid akan disimpan ke bank soal' +
          (invalid ? ' (' + invalid + ' baris bermasalah dilewati).' : '.') +
          ' Soal baru dipublikasikan ke bank soal setelah persetujuan ini.',
        confirmLabel: 'Ya, simpan'
      }).then(function (ok) {
        if (!ok) return;
        var extra = store.get('eujian.soalExtra', []);
        if (!Array.isArray(extra)) extra = [];
        var deleted = store.get('eujian.soalDeleted', []);
        if (!Array.isArray(deleted)) deleted = [];
        var maxNum = 0;
        DATA.questions.concat(extra).forEach(function (q) {
          var m = /^Q(\d+)$/i.exec(q.id);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });
        deleted.forEach(function (id) {
          var m = /^Q(\d+)$/i.exec(id);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });

        var newQuestions = valid.map(function (r) {
          maxNum++;
          var q = {
            id: 'Q' + String(maxNum).padStart(2, '0'),
            mapel: r.mapel || (mapelSel ? mapelSel.value : 'Matematika'),
            kelas: r.kelas || (kelasSel ? kelasSel.value : '6'),
            tipe: r.tipe,
            bobot: parseInt(r.bobot, 10) || defaultBobot(),
            text: r.text,
            pembahasan: r.pembahasan || ''
          };
          if (r.tipe === 'PG') {
            q.options = r.options;
            q.kunci = r.kunci;
          } else {
            q.jawaban = r.kunci || r.pembahasan || 'Jawaban uraian dinilai berdasarkan rubrik.';
          }
          return q;
        });

        store.set('eujian.soalExtra', newQuestions.concat(extra));
        rows = [];
        renderPreview();
        toast(newQuestions.length + ' soal berhasil disimpan ke bank soal.');
        setTimeout(function () { window.location.href = 'bank-soal.html'; }, 900);
      });
    });

    /* ---- Template Excel ---- */
    document.getElementById('downloadTemplateBtn').addEventListener('click', function () {
      ensureXLSX().then(function () {
        var headers = ['Nomor Soal', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Kunci Jawaban', 'Jenis Soal', 'Bobot Nilai', 'Pembahasan'];
        var aoa = [
          headers,
          [1, 'Hasil dari 2.450 + 1.275 − 900 adalah ....', '2.725', '2.825', '2.925', '3.025', 'B', 'PG', 10, '2.450 + 1.275 = 3.725; lalu 3.725 − 900 = 2.825.'],
          [2, 'Jelaskan proses fotosintesis pada tumbuhan.', '', '', '', '', 'Fotosintesis membutuhkan air, karbon dioksida, dan cahaya matahari untuk menghasilkan glukosa dan oksigen.', 'Uraian', 10, 'Rubrik: menyebut bahan, proses, dan hasil fotosintesis.']
        ];
        var ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [{ wch: 12 }, { wch: 52 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 46 }];
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Soal');
        XLSX.writeFile(wb, 'Template-Import-Soal-EUjian.xlsx');
        toast('Template Excel berhasil diunduh.');
      }).catch(function (err) {
        toast(err.message || 'Gagal mengunduh template.', 'danger');
      });
    });

    /* ---- Excel ---- */
    function parseWorkbook(wb) {
      var ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error('File Excel tidak memiliki lembar kerja.');
      var matrix = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
      if (!matrix.length) throw new Error('File Excel kosong.');

      var norm = function (v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''); };
      var headerIdx = -1;
      for (var i = 0; i < Math.min(matrix.length, 10); i++) {
        var rowNorm = matrix[i].map(norm);
        if (rowNorm.indexOf('pertanyaan') > -1 || rowNorm.indexOf('soal') > -1) { headerIdx = i; break; }
      }
      if (headerIdx === -1) throw new Error('Baris judul kolom tidak ditemukan. Gunakan template yang disediakan.');

      var headers = matrix[headerIdx].map(norm);
      function colOf(aliases) {
        for (var a = 0; a < aliases.length; a++) {
          var idx = headers.indexOf(aliases[a]);
          if (idx > -1) return idx;
        }
        return -1;
      }
      var col = {
        nomor: colOf(['nomorsoal', 'no', 'nomor']),
        text: colOf(['pertanyaan', 'soal']),
        a: colOf(['pilihana', 'opsia', 'a']),
        b: colOf(['pilihanb', 'opsib', 'b']),
        c: colOf(['pilihanc', 'opsic', 'c']),
        d: colOf(['pilihand', 'opsid', 'd']),
        kunci: colOf(['kuncijawaban', 'kunci', 'jawaban']),
        tipe: colOf(['jenissoal', 'tipe', 'tiposoal']),
        bobot: colOf(['bobotnilai', 'bobot', 'skor', 'nilai']),
        pembahasan: colOf(['pembahasan', 'penjelasan']),
        mapel: colOf(['matapelajaran', 'mapel']),
        kelas: colOf(['kelas'])
      };

      var missing = [];
      if (col.text === -1) missing.push('Pertanyaan');
      if (col.tipe === -1) missing.push('Jenis Soal');
      if (col.bobot === -1) missing.push('Bobot Nilai');
      if (missing.length) throw new Error('Kolom wajib tidak ditemukan: ' + missing.join(', ') + '.');

      var parsed = [];
      matrix.slice(headerIdx + 1).forEach(function (row, idx) {
        var isEmpty = row.every(function (cell) { return String(cell || '').trim() === ''; });
        if (isEmpty) return;
        var cell = function (c) { return c > -1 ? String(row[c] == null ? '' : row[c]).trim() : ''; };
        var tipe = normalizeTipe(cell(col.tipe));
        var rowData = {
          nomor: parseInt(cell(col.nomor), 10) || idx + 1,
          text: cell(col.text),
          options: [cell(col.a), cell(col.b), cell(col.c), cell(col.d)],
          kunci: tipe === 'PG' ? normalizeKunci(cell(col.kunci)) : cell(col.kunci),
          tipe: tipe,
          bobot: parseInt(cell(col.bobot), 10) || 0,
          pembahasan: cell(col.pembahasan),
          mapel: cell(col.mapel),
          kelas: cell(col.kelas).replace(/^kelas\s*/i, '')
        };
        if (!rowData.tipe) rowData.tipe = rowData.options.some(Boolean) ? 'PG' : '';
        rowData.errors = validateRow(rowData);
        parsed.push(rowData);
      });
      if (!parsed.length) throw new Error('Tidak ada baris soal yang dapat dibaca.');
      return parsed;
    }

    function handleExcelFile(file) {
      if (!file) return;
      ensureXLSX().then(function () {
        return file.arrayBuffer();
      }).then(function (buf) {
        var wb = XLSX.read(buf, { type: 'array' });
        rows = parseWorkbook(wb);
        showPreview('Sumber: Excel · ' + file.name);
        toast(rows.length + ' baris soal dibaca dari Excel. Periksa pratinjau.');
      }).catch(function (err) {
        toast(err.message || 'Gagal membaca file Excel.', 'danger');
      });
    }

    var excelFile = document.getElementById('excelFile');
    var pickExcelBtn = document.getElementById('pickExcelBtn');
    var excelDrop = document.getElementById('excelDrop');
    if (pickExcelBtn) pickExcelBtn.onclick = function () { excelFile.click(); };
    if (excelFile) excelFile.addEventListener('change', function () {
      handleExcelFile(excelFile.files && excelFile.files[0]);
      excelFile.value = '';
    });
    if (excelDrop) {
      excelDrop.addEventListener('click', function () { excelFile.click(); });
      excelDrop.addEventListener('dragover', function (e) { e.preventDefault(); excelDrop.classList.add('drag'); });
      excelDrop.addEventListener('dragleave', function () { excelDrop.classList.remove('drag'); });
      excelDrop.addEventListener('drop', function (e) {
        e.preventDefault();
        excelDrop.classList.remove('drag');
        handleExcelFile(e.dataTransfer.files && e.dataTransfer.files[0]);
      });
    }

    /* ---- Word (.docx) ---- */
    function docxHtmlToText(html) {
      var doc = document.createElement('div');
      doc.innerHTML = html || '';
      var lines = [];

      function ownText(li) {
        var clone = li.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('ul, ol'), function (list) {
          if (list.parentNode) list.parentNode.removeChild(list);
        });
        return clone.textContent.replace(/\s+/g, ' ').trim();
      }

      Array.prototype.forEach.call(doc.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6'), function (el) {
        if (el.tagName === 'LI') {
          var list = el.parentElement;
          if (!list || (list.tagName !== 'OL' && list.tagName !== 'UL')) return;
          var idx = 1;
          var prev = el.previousElementSibling;
          while (prev) {
            if (prev.tagName === 'LI') idx++;
            prev = prev.previousElementSibling;
          }
          var depth = 0;
          var anc = list.parentElement;
          while (anc) {
            if (anc.tagName === 'LI') depth++;
            anc = anc.parentElement;
          }
          var text = ownText(el);
          if (!text) return;
          var label;
          if (list.tagName === 'OL') {
            label = depth === 0 ? idx + '.' : String.fromCharCode(64 + Math.min(idx, 26)) + '.';
          } else {
            label = depth === 0 ? '-' : String.fromCharCode(64 + Math.min(idx, 26)) + '.';
          }
          lines.push(label + ' ' + text);
          return;
        }
        if (el.closest('li')) return;
        var t = el.textContent.replace(/\s+/g, ' ').trim();
        if (t) lines.push(t);
      });
      return lines.join('\n');
    }

    function handleWordFile(file) {
      if (!file) return;
      if (!/\.docx$/i.test(file.name || '')) {
        setWordLog('Format tidak didukung: ' + file.name + '. Simpan ulang file sebagai .docx lalu coba lagi.');
        toast('Gunakan file Word format .docx.', 'danger');
        return;
      }
      setWordLog('Membaca Word: ' + file.name + ' ...');
      ensureMammoth().then(function () {
        if (!window.mammoth) throw new Error('Pustaka pembaca Word gagal dimuat. Periksa koneksi internet.');
        return file.arrayBuffer().then(function (buf) {
          return window.mammoth.convertToHtml({ arrayBuffer: buf });
        });
      }).then(function (result) {
        var text = docxHtmlToText(result && result.value);
        if (!text.replace(/\s/g, '')) {
          throw new Error('Dokumen Word tidak berisi teks. Bila soal berupa gambar, gunakan tab PDF / Gambar (OCR).');
        }
        rows = buildRowsFromText(text);
        if (!rows.length) {
          setWordLog('Teks terbaca, tetapi pola soal tidak dikenali. Pastikan soal bernomor (1., 2., ...) dan pilihan A–D.');
          toast('Tidak ada soal yang dapat dikenali dari Word. Periksa susunan soal.', 'danger');
          return;
        }
        showPreview('Sumber: Word · ' + file.name);
        var keyed = rows.filter(function (r) { return r.tipe === 'PG' && r.kunci; }).length;
        var noKey = rows.filter(function (r) { return r.tipe === 'PG' && !r.kunci; }).length;
        setWordLog('Berhasil mengenali ' + rows.length + ' soal dari Word · ' + keyed + ' kunci jawaban otomatis terbaca' + (noKey ? ', ' + noKey + ' perlu diisi manual.' : '.'));
        toast(rows.length + ' soal dibaca dari Word. Periksa pratinjau.');
      }).catch(function (err) {
        setWordLog('Gagal memproses Word: ' + (err.message || err));
        toast(err.message || 'Gagal membaca file Word.', 'danger');
      });
    }

    var wordFile = document.getElementById('wordFile');
    var pickWordBtn = document.getElementById('pickWordBtn');
    var wordDrop = document.getElementById('wordDrop');
    if (pickWordBtn && wordFile) pickWordBtn.onclick = function () { wordFile.click(); };
    if (wordFile) wordFile.addEventListener('change', function () {
      handleWordFile(wordFile.files && wordFile.files[0]);
      wordFile.value = '';
    });
    if (wordDrop && wordFile) {
      wordDrop.addEventListener('click', function () { wordFile.click(); });
      wordDrop.addEventListener('dragover', function (e) { e.preventDefault(); wordDrop.classList.add('drag'); });
      wordDrop.addEventListener('dragleave', function () { wordDrop.classList.remove('drag'); });
      wordDrop.addEventListener('drop', function (e) {
        e.preventDefault();
        wordDrop.classList.remove('drag');
        handleWordFile(e.dataTransfer.files && e.dataTransfer.files[0]);
      });
    }

    /* ---- PDF / Gambar ---- */
    function buildRowsFromText(text) {
      var parsed = parseQuestionText(text);
      return parsed.map(function (r) {
        r.mapel = '';
        r.kelas = '';
        r.errors = validateRow(r);
        return r;
      });
    }

    function questionFromBlock(nomor, body, idx) {
      var joined = String(body || '').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim();
      var kunci = '';
      var kunciRe = /(?:kunci(?:\s+jawaban(?:nya)?)?|jawaban\s*(?:benar(?:nya)?)?|jawaban|jawab|answer(?:\s*key)?)\s*[:=\-–—]\s*[\(\[]?\s*([A-Da-d])\s*[\)\]]?(?![A-Za-z0-9])/i;
      var km = joined.match(kunciRe);
      if (km) {
        kunci = km[1].toUpperCase();
        joined = joined.replace(km[0], ' ');
      }
      var pembahasan = '';
      var pm = joined.match(/(?:pembahasan|penjelasan)\s*[:\-]\s*([\s\S]+)$/i);
      if (pm) {
        pembahasan = pm[1].replace(/\s+/g, ' ').trim();
        joined = joined.slice(0, pm.index);
      }

      var parts = [];
      var seq = /(?:^|[\s\n\(])([A-Da-d])[a-d]?[\.\)]\s+/g;
      var m;
      while ((m = seq.exec(joined))) {
        var letter = m[1].toUpperCase();
        if (!parts.length && letter !== 'A') continue;
        if (parts.length && letter !== 'ABCD'[parts.length]) continue;
        parts.push({ letter: letter, start: m.index, contentStart: seq.lastIndex });
        if (parts.length === 4) break;
      }

      var qText = joined;
      var options = [];
      if (parts.length === 4) {
        qText = joined.slice(0, parts[0].start).trim();
        options = parts.map(function (p, i) {
          var end = i < parts.length - 1 ? parts[i + 1].start : joined.length;
          return joined.slice(p.contentStart, end).replace(/\s+/g, ' ').trim();
        }).filter(function (o) { return !!o; });
      } else {
        var answerMatch = qText.match(/(?:jawaban|kunci(?:\s+jawaban)?)\s*[:=]\s*([\s\S]+)$/i);
        if (answerMatch) {
          if (!kunci) kunci = answerMatch[1].replace(/\s+/g, ' ').trim();
          qText = qText.slice(0, answerMatch.index).trim();
        }
      }
      var tipe = options.length === 4 ? 'PG' : 'Uraian';
      return {
        nomor: nomor || idx + 1,
        text: qText.replace(/[ \t]+/g, ' ').trim(),
        options: options.length === 4 ? options : ['', '', '', ''],
        kunci: kunci,
        tipe: tipe,
        bobot: defaultBobot(),
        pembahasan: pembahasan,
        mapel: '',
        kelas: '',
        errors: []
      };
    }

    var KEY_HEADER_RE = /^\s*(kunci(?:\s+jawaban(?:nya)?)?|no\.?\s+kunci|answer\s*key)(?:\s+(?:uas|uts|pas|pts|pat))?\s*[:\-–—]?\s*(.*)$/i;

    function parseKeyPairs(segment) {
      var keys = {};
      var pairRe = /(\d{1,3})\s*[\.\)\]:=\-–—|]?\s*[\(\[]?\s*([A-Da-d])\s*(?![A-Za-z0-9])/g;
      String(segment || '').split('\n').forEach(function (line) {
        var l = String(line || '').replace(/\s+/g, ' ').trim();
        if (!l || !/\d/.test(l)) return;
        if (/^[A-Da-d]\s*[\.\)]/.test(l)) return;
        var m;
        pairRe.lastIndex = 0;
        while ((m = pairRe.exec(l))) {
          var no = parseInt(m[1], 10);
          if (no > 0 && no < 1000) keys[no] = m[2].toUpperCase();
        }
      });
      return keys;
    }

    function isKeySegment(segment) {
      var lines = String(segment || '').split('\n').map(function (l) {
        return l.replace(/\s+/g, ' ').trim();
      }).filter(Boolean);
      if (!lines.length) return false;
      return lines.every(function (l) {
        if (/^no\.?\s*\|?\s*kunci/i.test(l)) return true;
        if (/^[\|:=\-–—\s]+$/.test(l)) return true;
        return /\d/.test(l) && /[A-Da-d]/.test(l) && /^[\d\s.,;:|\-–—()\[\]A-Da-d]+$/.test(l);
      });
    }

    function extractAnswerKeys(text) {
      var lines = String(text || '').split('\n');
      for (var i = lines.length - 1; i >= 0; i--) {
        var m = lines[i].match(KEY_HEADER_RE);
        if (!m) continue;
        var remainder = String(m[2] || '').trim();
        var tail = (remainder ? remainder + '\n' : '') + lines.slice(i + 1).join('\n');
        if (!tail.trim() || !isKeySegment(tail)) continue;
        var keys = parseKeyPairs(tail);
        if (Object.keys(keys).length >= 2) {
          return { text: lines.slice(0, i).join('\n'), keys: keys };
        }
      }
      return { text: text, keys: {} };
    }

    function parseQuestionText(raw) {
      var text = String(raw || '').replace(/\r/g, '\n');
      var keyInfo = extractAnswerKeys(text);
      text = keyInfo.text;
      var lines = text.split('\n').map(function (l) {
        return l.replace(/\s+/g, ' ').trim();
      }).filter(function (l) {
        return l && !/^(halaman|page)\s+\d+/i.test(l) && !/^[-–—]?\s*\d+\s*[-–—]?$/.test(l);
      });

      var blocks = [];
      var current = null;
      var numRe = /^(\d{1,3})[\.\)]\s*(.*)$/;
      lines.forEach(function (line) {
        var m = line.match(numRe);
        if (m) {
          if (current) blocks.push(current);
          current = { nomor: parseInt(m[1], 10), lines: [m[2]] };
        } else if (current) {
          current.lines.push(line);
        }
      });
      if (current) blocks.push(current);

      if (!blocks.length) {
        var flat = lines.join(' ');
        var inlineRe = /(\d{1,3})[\.\)]\s+/g;
        var im;
        var marks = [];
        while ((im = inlineRe.exec(flat))) {
          marks.push({ nomor: parseInt(im[1], 10), start: im.index, contentStart: inlineRe.lastIndex });
        }
        marks.forEach(function (mk, i) {
          var end = i < marks.length - 1 ? marks[i + 1].start : flat.length;
          blocks.push({ nomor: mk.nomor, lines: [flat.slice(mk.contentStart, end).trim()] });
        });
      }

      var parsed = blocks.map(function (b, idx) {
        return questionFromBlock(b.nomor, b.lines.join('\n'), idx);
      }).filter(function (r) { return r.text || r.options.some(Boolean); })
        .sort(function (a, b) { return a.nomor - b.nomor; });

      parsed.forEach(function (r) {
        if (r.tipe === 'PG' && !r.kunci && keyInfo.keys[r.nomor]) {
          r.kunci = keyInfo.keys[r.nomor];
        }
      });
      return parsed;
    }

    function handleExtractedText(text, source) {
      rows = buildRowsFromText(text);
      if (!rows.length) {
        setLog('Teks terbaca, tetapi pola soal tidak dikenali. Gunakan OCR atau periksa file.');
        toast('Tidak ada soal yang dapat dikenali dari file.', 'danger');
        return false;
      }
      showPreview(source);
      var keyed = rows.filter(function (r) { return r.tipe === 'PG' && r.kunci; }).length;
      var noKey = rows.filter(function (r) { return r.tipe === 'PG' && !r.kunci; }).length;
      setLog('Berhasil mengenali ' + rows.length + ' soal · ' + keyed + ' kunci jawaban otomatis terbaca' + (noKey ? ', ' + noKey + ' perlu diisi manual.' : '.'));
      toast(rows.length + ' soal dikenali. Periksa pratinjau sebelum menyetujui.');
      return true;
    }

    function renderPdfPageToImage(page) {
      var viewport = page.getViewport({ scale: 2 });
      var canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise.then(function () {
        return canvas;
      });
    }

    function ocrCanvas(canvas) {
      if (!tesseractWorker) {
        return ensureTesseract().then(function () {
          return Tesseract.createWorker('ind+eng', 1, {
            logger: function (m) {
              if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                setProgress(Math.round(m.progress * 100), true);
              } else if (m.status) {
                setLog('OCR: ' + m.status + (typeof m.progress === 'number' ? ' (' + Math.round(m.progress * 100) + '%)' : ''));
              }
            }
          });
        }).then(function (worker) {
          tesseractWorker = worker;
          return worker.recognize(canvas);
        });
      }
      return tesseractWorker.recognize(canvas);
    }

    function handlePdfFile(file) {
      if (!file) return;
      ensurePdfJs().then(function () {
        setLog('Membaca PDF: ' + file.name + ' ...');
        return file.arrayBuffer();
      }).then(function (buf) {
        return window.pdfjsLib.getDocument({ data: buf }).promise;
      }).then(function (pdf) {
        var pagesText = [];
        var chain = Promise.resolve();
        for (var p = 1; p <= pdf.numPages; p++) {
          (function (pageNo) {
            chain = chain.then(function () {
              return pdf.getPage(pageNo).then(function (page) {
                return page.getTextContent().then(function (tc) {
                  var t = '';
                  tc.items.forEach(function (it) {
                    t += it.str + (it.hasEOL ? '\n' : ' ');
                  });
                  pagesText.push(t);
                });
              });
            });
          })(p);
        }
        return chain.then(function () {
          var text = pagesText.join('\n');
          var compact = text.replace(/\s/g, '');

          function runOcr() {
            return confirmDialog({
              title: 'PDF hasil scan?',
              message: 'Teks PDF tidak terbaca dengan baik. Jalankan OCR (pengenalan teks gambar) untuk membaca soal? Proses ini memerlukan koneksi internet dan beberapa saat.',
              confirmLabel: 'Jalankan OCR'
            }).then(function (ok) {
              if (!ok) {
                setLog('OCR dibatalkan. File tidak diproses.');
                return;
              }
              var out = '';
              var ocrChain = Promise.resolve();
              for (var i = 1; i <= pdf.numPages; i++) {
                (function (pageNo) {
                  ocrChain = ocrChain.then(function () {
                    setLog('OCR halaman ' + pageNo + ' dari ' + pdf.numPages + ' ...');
                    return pdf.getPage(pageNo).then(renderPdfPageToImage).then(ocrCanvas).then(function (res) {
                      out += (res.data.text || '') + '\n';
                      setProgress(Math.round(pageNo / pdf.numPages * 100), true);
                    });
                  });
                })(i);
              }
              return ocrChain.then(function () {
                setProgress(100, false);
                var okParsed = handleExtractedText(out, 'Sumber: PDF (OCR) · ' + file.name);
                if (!okParsed) setLog('OCR selesai, tetapi soal tidak dikenali. Coba gambar yang lebih jelas.');
              });
            });
          }

          if (compact.length >= 40 * pdf.numPages) {
            var parsedOk = handleExtractedText(text, 'Sumber: PDF · ' + file.name + ' · ' + pdf.numPages + ' halaman');
            if (!parsedOk) {
              setLog('Teks PDF tidak memuat pola soal. Menawarkan OCR...');
              return runOcr();
            }
          } else {
            setLog('PDF tidak memiliki teks yang cukup — kemungkinan hasil scan. Menjalankan OCR...');
            return runOcr();
          }
        });
      }).catch(function (err) {
        setProgress(0, false);
        setLog('Gagal memproses PDF: ' + (err.message || err));
        toast('Gagal memproses PDF. Pastikan file valid dan koneksi internet tersedia.', 'danger');
      });
    }

    function handleImageFile(file) {
      if (!file) return;
      setLog('Menyiapkan OCR untuk gambar: ' + file.name + ' ...');
      setProgress(5, true);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var canvas = document.createElement('canvas');
        var scale = Math.min(2, 2400 / Math.max(img.width, 1));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        ocrCanvas(canvas).then(function (res) {
          setProgress(100, false);
          setLog('OCR selesai.');
          handleExtractedText(res.data.text || '', 'Sumber: Gambar (OCR) · ' + file.name);
        }).catch(function (err) {
          setProgress(0, false);
          setLog('Gagal OCR: ' + (err.message || err));
          toast('OCR gagal dijalankan.', 'danger');
        });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        toast('Gambar tidak dapat dibaca.', 'danger');
      };
      img.src = url;
    }

    var pdfFile = document.getElementById('pdfFile');
    var imageFile = document.getElementById('imageFile');
    var pickPdfBtn = document.getElementById('pickPdfBtn');
    var pickImageBtn = document.getElementById('pickImageBtn');
    var pdfDrop = document.getElementById('pdfDrop');
    if (pickPdfBtn) pickPdfBtn.onclick = function () { pdfFile.click(); };
    if (pickImageBtn) pickImageBtn.onclick = function () { imageFile.click(); };
    if (pdfFile) pdfFile.addEventListener('change', function () {
      handlePdfFile(pdfFile.files && pdfFile.files[0]);
      pdfFile.value = '';
    });
    if (imageFile) imageFile.addEventListener('change', function () {
      handleImageFile(imageFile.files && imageFile.files[0]);
      imageFile.value = '';
    });
    if (pdfDrop) {
      pdfDrop.addEventListener('click', function () { pdfFile.click(); });
      pdfDrop.addEventListener('dragover', function (e) { e.preventDefault(); pdfDrop.classList.add('drag'); });
      pdfDrop.addEventListener('dragleave', function () { pdfDrop.classList.remove('drag'); });
      pdfDrop.addEventListener('drop', function (e) {
        e.preventDefault();
        pdfDrop.classList.remove('drag');
        var f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f) return;
        if (/^image\//.test(f.type)) handleImageFile(f);
        else handlePdfFile(f);
      });
    }

    /* ---- Tabs ---- */
    $$('#importTabs .role-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('#importTabs .role-tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
        var which = tab.getAttribute('data-itab');
        ['excel', 'word', 'pdf'].forEach(function (name) {
          var panel = document.getElementById('panel' + name.charAt(0).toUpperCase() + name.slice(1));
          if (panel) panel.hidden = which !== name;
        });
      });
    });
  }

  /* ---------------- Pelaksanaan Ujian ---------------- */
  function initExam() {
    var root = document.getElementById('examRoot');
    if (!root) return;
    var EXAM = DATA.exam;
    var ATTEMPT_KEY = 'eujian.attempt';
    var settings = getSettings();
    var session = getSession();
    var isSiswa = !!(session && session.role === 'siswa');
    var snapshot = store.get('eujian.soalSiswa', null);
    var needSync = false;
    if (isSiswa) {
      if (snapshot && snapshot.username === session.username && Array.isArray(snapshot.questions) && snapshot.questions.length) {
        EXAM = {
          mapel: snapshot.mapel,
          kelas: 'Kelas ' + snapshot.kelas,
          tingkat: DATA.exam.tingkat,
          durasi: DATA.exam.durasi,
          soal: snapshot.questions.map(function (q) {
            return {
              id: q.id, tipe: q.tipe, bobot: q.bobot, text: q.text,
              options: Array.isArray(q.options) ? q.options : [],
              kunci: q.kunci || '',
              gambar: typeof q.gambar === 'string' ? q.gambar : ''
            };
          })
        };
      } else {
        needSync = true;
      }
    }
    var durationMin = Math.max(5, Number(settings.durasi) || EXAM.durasi);
    EXAM = Object.assign({}, EXAM, {
      soal: EXAM.soal.filter(function (q) { return q.tipe === 'PG'; })
        .concat(EXAM.soal.filter(function (q) { return q.tipe !== 'PG'; }))
    });
    var currentIndex = 0;
    var timerId = null;
    var LETTERS = ['A', 'B', 'C', 'D'];

    function getAttempt() { return store.get('eujian.attempt', null); }
    function saveAttempt(a) { store.set(ATTEMPT_KEY, a); }

    function fmtRemain(ms) {
      var total = Math.ceil(ms / 1000);
      var m = Math.floor(total / 60);
      var s = total % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function paintTimer() {
      var a = getAttempt();
      var el = document.getElementById('examTimer');
      if (!a || !el) return;
      var remain = Math.max(0, a.endsAt - Date.now());
      el.innerHTML = icon('clock') + '<span>' + fmtRemain(remain) + '</span>';
      el.classList.toggle('warn', remain <= 5 * 60000);
    }

    function tick() {
      var a = getAttempt();
      if (!a || a.finished) {
        clearInterval(timerId);
        return;
      }
      paintTimer();
      if (a.endsAt - Date.now() <= 0) {
        clearInterval(timerId);
        finishAttempt(true);
      }
    }

    function startTimer() {
      clearInterval(timerId);
      timerId = setInterval(tick, 1000);
      paintTimer();
    }

    function startAttempt() {
      var now = Date.now();
      saveAttempt({
        startedAt: now,
        endsAt: now + durationMin * 60000,
        answers: {},
        flags: [],
        finished: false
      });
      currentIndex = 0;
      renderExam();
      toast('Ujian dimulai. Semoga sukses!');
    }

    function answeredCount(a) {
      return EXAM.soal.filter(function (q) {
        return String((a.answers && a.answers[q.id]) || '').trim() !== '';
      }).length;
    }

    function renderStart() {
      clearInterval(timerId);
      var userCard = session
        ? '<div class="exam-start-user"><span class="avatar sm">' + esc(initials(session.name)) + '</span><div><strong>' + esc(session.name) + '</strong>' + esc(ROLE_LABEL[session.role] || '') + '</div></div>'
        : '<div class="exam-start-user">' + icon('info') + '<div><strong>Mode demo</strong>Anda mengerjakan sebagai tamu. <a class="link" href="login.html">Masuk</a> sebagai siswa untuk pengalaman penuh.</div></div>';

      if (needSync) {
        root.innerHTML = '<section class="exam-start card">' +
            '<div class="exam-cover">' +
              '<span class="badge warn">Belum ada soal tersinkron</span>' +
              '<h2>Soal ujian belum tersedia</h2>' +
              '<p>Sinkronkan soal dari bank soal admin/guru terlebih dahulu sebelum memulai ujian.</p>' +
            '</div>' +
            '<div class="card-body">' +
              '<div class="result-note" style="margin:0 0 16px">' + icon('info') + '<span>Soal ujian hanya dapat dikerjakan setelah proses sinkronisasi di halaman Sinkronisasi Soal.</span></div>' +
              '<div class="exam-start-foot">' + userCard +
                '<a class="btn" href="sinkron-soal.html">' + icon('refresh') + 'Buka Sinkronisasi Soal</a>' +
              '</div>' +
            '</div>' +
          '</section>';
        return;
      }

      var pgCount = EXAM.soal.filter(function (q) { return q.tipe === 'PG'; }).length;
      var essayCount = EXAM.soal.length - pgCount;

      root.innerHTML = '<section class="exam-start card">' +
          '<div class="exam-cover">' +
            '<span class="badge gold">Ujian Aktif · ' + esc(EXAM.tingkat) + '</span>' +
            '<h2>' + esc(EXAM.mapel) + ' · ' + esc(EXAM.kelas) + '</h2>' +
            '<p>Ujian Akhir Semester Ganjil Tahun Pelajaran ' + esc(settings.tahunPelajaran) + ' · Kurikulum Merdeka</p>' +
            '<div class="exam-meta">' +
              '<div class="exam-meta-item"><span>Jumlah Soal</span><strong>' + EXAM.soal.length + ' butir</strong></div>' +
              '<div class="exam-meta-item"><span>Durasi</span><strong>' + durationMin + ' menit</strong></div>' +
              '<div class="exam-meta-item"><span>Bentuk Soal</span><strong>' + pgCount + ' PG' + (essayCount ? ' · ' + essayCount + ' Uraian' : '') + '</strong></div>' +
              '<div class="exam-meta-item"><span>KKM</span><strong>' + esc(settings.kkm) + '</strong></div>' +
            '</div>' +
          '</div>' +
          '<div class="card-body">' +
            '<h3 class="section-title">Tata tertib peserta</h3>' +
            '<ul class="rules">' +
              '<li>' + icon('check') + '<span>Kerjakan semua soal secara mandiri dan jujur. Dilarang bekerja sama atau membuka catatan.</span></li>' +
              '<li>' + icon('check') + '<span>Waktu pengerjaan dihitung otomatis sejak tombol mulai ditekan dan tidak dapat dijeda.</span></li>' +
              '<li>' + icon('check') + '<span>Jawaban tersimpan otomatis setiap kali Anda memilih atau mengetik jawaban.</span></li>' +
              '<li>' + icon('check') + '<span>Gunakan tombol <b>Tandai ragu-ragu</b> untuk menandai soal yang ingin ditinjau kembali.</span></li>' +
              '<li>' + icon('check') + '<span>Setiap halaman berisi satu soal. Soal pilihan ganda dikerjakan lebih dulu, lalu soal uraian masing-masing pada halaman tersendiri.</span></li>' +
              '<li>' + icon('check') + '<span>Setelah waktu habis, jawaban dikumpulkan secara otomatis oleh sistem.</span></li>' +
            '</ul>' +
            '<div class="exam-start-foot">' + userCard +
              '<button type="button" class="btn" id="startExamBtn">Mulai Ujian ' + icon('arrow-right') + '</button>' +
            '</div>' +
          '</div>' +
        '</section>';
      var btn = document.getElementById('startExamBtn');
      if (btn) btn.onclick = startAttempt;
    }

    function updateNav() {
      var a = getAttempt();
      if (!a) return;
      var count = answeredCount(a);
      $$('.nav-num', root).forEach(function (btn) {
        var q = EXAM.soal[parseInt(btn.getAttribute('data-index'), 10)];
        if (!q) return;
        var isAnswered = String((a.answers && a.answers[q.id]) || '').trim() !== '';
        btn.classList.toggle('answered', isAnswered);
        btn.classList.toggle('flagged', a.flags.indexOf(q.id) > -1);
      });
      var fill = root.querySelector('.exam-progress-fill');
      if (fill) fill.style.width = (count / EXAM.soal.length * 100) + '%';
      var label = root.querySelector('.exam-progress-label');
      if (label) label.textContent = count + ' dari ' + EXAM.soal.length + ' soal terjawab';
    }

    function renderRunning() {
      var a = getAttempt();
      if (!a) return renderStart();
      if (currentIndex >= EXAM.soal.length) currentIndex = EXAM.soal.length - 1;
      var q = EXAM.soal[currentIndex];
      var answer = (a.answers && a.answers[q.id]) || '';
      var isFlagged = a.flags.indexOf(q.id) > -1;
      var count = answeredCount(a);

      root.innerHTML =
        '<div class="exam-topbar card">' +
          '<div class="exam-title"><span class="badge info">' + esc(EXAM.tingkat) + '</span>' +
            '<div><strong>' + esc(EXAM.mapel) + '</strong><span class="sub">' + esc(EXAM.kelas) + ' · ' + EXAM.soal.length + ' soal</span></div>' +
          '</div>' +
          '<div class="timer" id="examTimer">' + icon('clock') + '<span>--:--</span></div>' +
        '</div>' +
        '<div class="exam-layout exam-page-layout">' +
          '<div class="exam-main card">' +
            '<div class="exam-head">' +
              '<div><span class="q-number">Halaman ' + (currentIndex + 1) + ' / ' + EXAM.soal.length + '</span>' +
                '<span class="badge ' + (q.tipe === 'PG' ? 'success' : 'warn') + '">' + (q.tipe === 'PG' ? 'Pilihan Ganda' : 'Uraian') + '</span>' +
                (isFlagged ? ' <span class="q-flag">' + icon('flag') + 'Ragu-ragu</span>' : '') +
              '</div>' +
              '<span class="muted small">Bobot ' + q.bobot + ' · ' + (q.tipe === 'PG' ? '1 soal per halaman' : 'Halaman uraian') + '</span>' +
            '</div>' +
            '<div class="q-body ' + (q.tipe === 'PG' ? 'pg-body' : 'essay-body') + '">' +
              '<p class="q-text">' + esc(q.text) + '</p>' +
              (safeImageSrc(q.gambar) ? '<figure class="q-figure"><img src="' + esc(safeImageSrc(q.gambar)) + '" alt="Gambar soal"></figure>' : '') +
              (q.tipe === 'PG'
                ? '<div class="options">' + q.options.map(function (opt, i) {
                    var letter = LETTERS[i];
                    return '<button type="button" class="option ' + (answer === letter ? 'selected' : '') + '" data-opt="' + letter + '">' +
                      '<span class="option-letter">' + letter + '</span><span class="option-text">' + esc(opt) + '</span>' +
                    '</button>';
                  }).join('') + '</div>'
                : '<div class="field essay-field"><label>Jawaban Uraian</label><textarea class="input essay-answer" id="essayAnswer" rows="12" placeholder="Tulis jawaban lengkap Anda di halaman ini...">' + esc(answer) + '</textarea>' +
                  '<p class="hint" style="margin:0">Soal uraian menempati satu halaman penuh dan akan dikoreksi oleh guru mata pelajaran.</p></div>') +
            '</div>' +
            '<div class="exam-foot">' +
              '<button type="button" class="btn outline" id="prevBtn" ' + (currentIndex === 0 ? 'disabled' : '') + '>' + icon('arrow-left') + 'Sebelumnya</button>' +
              '<div class="group">' +
                '<button type="button" class="btn outline" id="flagBtn">' + icon('flag') + (isFlagged ? 'Hapus ragu-ragu' : 'Tandai ragu-ragu') + '</button>' +
                (currentIndex === EXAM.soal.length - 1
                  ? '<button type="button" class="btn gold" id="finishBtn">Selesai</button>'
                  : '<button type="button" class="btn" id="nextBtn">Halaman Berikutnya ' + icon('arrow-right') + '</button>') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<aside class="exam-nav card exam-nav-bottom">' +
          '<div class="exam-nav-head">' +
            '<h4>Navigasi Halaman</h4>' +
            '<span class="muted small exam-progress-label">' + count + ' dari ' + EXAM.soal.length + ' soal terjawab</span>' +
          '</div>' +
          '<div class="exam-progress"><div class="exam-progress-fill" style="width:' + (count / EXAM.soal.length * 100) + '%"></div></div>' +
          '<div class="nav-grid">' + EXAM.soal.map(function (item, i) {
            var isAnswered = String((a.answers && a.answers[item.id]) || '').trim() !== '';
            var flagged = a.flags.indexOf(item.id) > -1;
            return '<button type="button" class="nav-num ' + (isAnswered ? 'answered ' : '') + (flagged ? 'flagged ' : '') + (i === currentIndex ? 'current' : '') +
              '" data-index="' + i + '">' + (i + 1) + '</button>';
          }).join('') + '</div>' +
          '<div class="sheet-nav-foot">' +
            '<div class="legend">' +
              '<b><i class="answered"></i>Sudah dijawab</b>' +
              '<b><i class="flagged"></i>Ditandai ragu-ragu</b>' +
              '<b><i></i>Belum dijawab</b>' +
            '</div>' +
            '<button type="button" class="btn gold" id="finishExamBtn">Selesai &amp; Kumpulkan</button>' +
          '</div>' +
        '</aside>';

      startTimer();

      $$('[data-opt]', root).forEach(function (btn) {
        btn.onclick = function () {
          a.answers[q.id] = btn.getAttribute('data-opt');
          saveAttempt(a);
          renderRunning();
        };
      });

      var essay = document.getElementById('essayAnswer');
      if (essay) {
        essay.oninput = function () {
          a.answers[q.id] = essay.value;
          saveAttempt(a);
          updateNav();
        };
      }

      var prev = document.getElementById('prevBtn');
      if (prev) prev.onclick = function () { goTo(currentIndex - 1); };

      var next = document.getElementById('nextBtn');
      if (next) next.onclick = function () { goTo(currentIndex + 1); };

      var flag = document.getElementById('flagBtn');
      if (flag) {
        flag.onclick = function () {
          var idx = a.flags.indexOf(q.id);
          if (idx > -1) a.flags.splice(idx, 1);
          else a.flags.push(q.id);
          saveAttempt(a);
          renderRunning();
        };
      }

      var finish = document.getElementById('finishBtn');
      if (finish) finish.onclick = function () { finishAttempt(false); };
      var finishSide = document.getElementById('finishExamBtn');
      if (finishSide) finishSide.onclick = function () { finishAttempt(false); };

      $$('.nav-num', root).forEach(function (btn) {
        btn.onclick = function () {
          goTo(parseInt(btn.getAttribute('data-index'), 10) || 0);
        };
      });
    }

    function goTo(index) {
      currentIndex = Math.max(0, Math.min(EXAM.soal.length - 1, index));
      renderRunning();
      var sheet = root.querySelector('.exam-page-layout');
      if (sheet) sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function buildAttemptRecord(a) {
      var stu = null;
      if (isSiswa) stu = getStudents().find(function (s) { return s.nama === session.name; }) || null;
      var m = /Kelas\s+([0-9A-Z]+)/i.exec((session && session.detail) || '');
      var r = a.result || {};
      return {
        id: 'U' + String(a.finishedAt || Date.now()) + '-' + Math.random().toString(36).slice(2, 6),
        at: new Date(a.finishedAt || Date.now()).toISOString(),
        studentId: stu ? stu.id : '',
        nisn: stu ? stu.nisn : (session ? String(session.username || '') : ''),
        nama: session ? session.name : 'Tamu',
        kelas: stu ? stu.kelas : (m ? m[1] : ''),
        mapel: EXAM.mapel,
        tingkat: EXAM.tingkat,
        correct: r.correct || 0,
        pgCount: r.pgCount || 0,
        pgScore: r.pgScore || 0,
        pgMax: r.pgMax || 0,
        essayCount: r.essayCount || 0,
        total: r.total || 0
      };
    }

    function gradeAttempt(a) {
      var correct = 0;
      var pgScore = 0;
      var pgMax = 0;
      var pgCount = 0;
      var essayCount = 0;
      var essayMax = 0;
      EXAM.soal.forEach(function (q) {
        if (q.tipe === 'PG') {
          pgCount++;
          pgMax += q.bobot;
          if (String((a.answers && a.answers[q.id]) || '').toUpperCase() === q.kunci) {
            correct++;
            pgScore += q.bobot;
          }
        } else {
          essayCount++;
          essayMax += q.bobot;
        }
      });
      a.finished = true;
      a.finishedAt = Date.now();
      a.result = {
        correct: correct,
        pgCount: pgCount,
        pgScore: pgScore,
        pgMax: pgMax,
        essayCount: essayCount,
        essayMax: essayMax,
        total: pgScore
      };
      saveAttempt(a);
      if (isSiswa) saveStudentAttemptRecord(buildAttemptRecord(a));
    }

    function finishAttempt(auto) {
      var a = getAttempt();
      if (!a || a.finished) return;
      clearInterval(timerId);
      if (auto) {
        closeModal();
        gradeAttempt(a);
        renderExam();
        toast('Waktu habis — jawaban dikumpulkan otomatis.');
        return;
      }
      var unanswered = EXAM.soal.length - answeredCount(a);
      confirmDialog({
        title: 'Kumpulkan ujian?',
        message: unanswered > 0
          ? 'Masih ada ' + unanswered + ' soal yang belum dijawab. Jawaban yang dikumpulkan tidak dapat diubah lagi.'
          : 'Semua soal telah dijawab. Pastikan jawaban Anda sudah benar sebelum dikumpulkan.',
        confirmLabel: 'Ya, kumpulkan',
        danger: unanswered > 0
      }).then(function (ok) {
        if (!ok) {
          startTimer();
          return;
        }
        var fresh = getAttempt();
        if (!fresh || fresh.finished) return;
        gradeAttempt(fresh);
        renderExam();
        toast('Jawaban berhasil dikumpulkan.');
      });
    }

    function resultGasCfg(a) {
      var rec = buildAttemptRecord(a);
      return {
        jenis: 'hasil-siswa',
        kelasLabel: function () { return rec.kelas ? 'Kelas ' + rec.kelas : EXAM.kelas; },
        syncId: function () { return 'siswa|' + (rec.nisn || rec.nama) + '|' + rec.mapel + '|' + (a.finishedAt || ''); },
        build: function () {
          return { headers: ATTEMPT_HEADERS.slice(), rows: [attemptRowValues(rec)] };
        }
      };
    }

    function renderResult() {
      clearInterval(timerId);
      var a = getAttempt();
      if (!a || !a.result) return renderStart();
      var r = a.result;
      var elapsed = Math.max(0, Math.round(((a.finishedAt || Date.now()) - a.startedAt) / 60000));
      var percent = Math.round(r.total / 100 * 100);

      var review = EXAM.soal.map(function (q, i) {
        var answer = (a.answers && a.answers[q.id]) || '';
        if (q.tipe === 'PG') {
          var isCorrect = String(answer).toUpperCase() === q.kunci;
          return '<div class="review-item">' +
            '<div class="review-status ' + (isCorrect ? 'ok' : 'bad') + '">' + icon(isCorrect ? 'check' : 'x') + '</div>' +
            '<div class="review-body"><strong>Soal ' + (i + 1) + ' · Pilihan ganda</strong>' + esc(truncate(q.text, 110)) +
              '<div class="review-answer"><span>Jawaban Anda: <b>' + (answer ? esc(answer) : 'Kosong') + '</b></span><span>Kunci: <b>' + q.kunci + '</b></span></div>' +
            '</div>' +
          '</div>';
        }
        return '<div class="review-item">' +
          '<div class="review-status pending">' + icon('alert-triangle') + '</div>' +
          '<div class="review-body"><strong>Soal ' + (i + 1) + ' · Uraian</strong>' + esc(truncate(q.text, 110)) +
            '<div class="review-answer"><span>Status: <b>' + (answer ? 'Menunggu koreksi guru' : 'Tidak dijawab') + '</b></span></div>' +
          '</div>' +
        '</div>';
      }).join('');

      root.innerHTML = '<section class="exam-result card">' +
          '<div class="result-head">' +
            '<span class="badge success">' + icon('check-circle') + 'Ujian selesai</span>' +
            '<h2>Hasil Ujian ' + esc(EXAM.mapel) + '</h2>' +
            '<p>' + esc(EXAM.kelas) + ' · ' + esc(EXAM.tingkat) + ' ' + esc(settings.tahunPelajaran) + ' · Dikumpulkan ' +
              new Date(a.finishedAt || Date.now()).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</p>' +
          '</div>' +
          '<div class="result-grid">' +
            '<div class="score-panel">' +
              '<div class="score-ring" style="--score:' + percent + '">' +
                '<div class="score-ring-inner"><strong>' + r.total + '</strong><span>Nilai objektif</span></div>' +
              '</div>' +
              '<p>Nilai sementara dari soal pilihan ganda</p>' +
            '</div>' +
            '<div class="mini-stats">' +
              '<div class="mini-stat"><span>Benar (PG)</span><strong>' + r.correct + ' / ' + r.pgCount + '</strong><small>Nilai ' + r.pgScore + ' dari ' + r.pgMax + '</small></div>' +
              '<div class="mini-stat"><span>Soal Uraian</span><strong>' + r.essayCount + ' soal</strong><small>Menunggu koreksi guru</small></div>' +
              '<div class="mini-stat"><span>Waktu Pengerjaan</span><strong>' + elapsed + ' menit</strong><small>Dari ' + durationMin + ' menit</small></div>' +
              '<div class="mini-stat"><span>Status</span><strong>Selesai</strong><small>Jawaban tersimpan</small></div>' +
            '</div>' +
          '</div>' +
          (r.essayCount ? '<div class="result-note">' + icon('info') + '<span>Nilai akhir akan diperbarui setelah guru selesai mengoreksi ' + r.essayCount + ' soal uraian.</span></div>' : '') +
          '<div class="review"><h3>Rincian Jawaban</h3><p class="muted small" style="margin:0 0 4px">Tinjau jawaban pilihan ganda dan status soal uraian Anda.</p>' + review + '</div>' +
          '<div class="result-actions">' +
            (isSiswa ? '<button type="button" class="btn outline" id="syncExamResult">' + icon('upload') + 'Sinkron Nilai</button>' : '') +
            '<button type="button" class="btn outline" id="resetExam">' + icon('refresh') + 'Kerjakan Ulang</button>' +
            '<a class="btn" href="hasil-ujian.html">' + icon('bar-chart') + 'Lihat Hasil Ujian</a>' +
          '</div>' +
        '</section>';

      var reset = document.getElementById('resetExam');
      if (reset) {
        reset.onclick = function () {
          confirmDialog({
            title: 'Kerjakan ulang ujian?',
            message: 'Jawaban dan nilai percobaan sebelumnya akan dihapus dari perangkat ini.',
            confirmLabel: 'Ya, mulai ulang',
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            store.del(ATTEMPT_KEY);
            currentIndex = 0;
            renderExam();
            toast('Ujian direset. Anda dapat memulai kembali.');
          });
        };
      }

      var syncExam = document.getElementById('syncExamResult');
      if (syncExam) {
        syncExam.onclick = function () {
          var cfg = resultGasCfg(a);
          cfg.title = 'Sinkron Nilai Ujian';
          cfg.note = 'Mengirim nilai ' + EXAM.mapel + ' atas nama ' + (session ? session.name : 'siswa') + ' ke sheet Hasil Siswa.';
          cfg.auto = true;
          openGasSyncModal(cfg);
        };
      }
      if (isSiswa && store.get(GAS_AUTO_KEY, false) && validGasUrl(store.get(GAS_URL_KEY, ''))) {
        var autoCfg = resultGasCfg(a);
        if (store.get(GAS_AUTO_LAST, '') !== autoCfg.syncId()) {
          setTimeout(function () {
            sendGasPayload(autoCfg, function (res) {
              if (res.ok) toast('Nilai ujian terkirim ke Google Sheets.');
            });
          }, 600);
        }
      }
    }

    function renderExam() {
      clearInterval(timerId);
      var a = getAttempt();
      if (a && a.finished) renderResult();
      else if (a) renderRunning();
      else renderStart();
    }

    renderExam();
  }

  /* ---------------- Hasil Ujian ---------------- */
  function initResults() {
    var tbody = document.getElementById('resultRows');
    if (!tbody) return;
    var select = document.getElementById('resultKelas');
    var session = getSession();
    var isSiswa = !!(session && session.role === 'siswa');
    var isStaff = !!(session && STAFF_ROLES.indexOf(session.role) > -1);
    var SUBJECTS = [
      { key: 'mtk', label: 'MTK' },
      { key: 'bin', label: 'BIN' },
      { key: 'ipa', label: 'IPA' },
      { key: 'arab', label: 'B. Arab' },
      { key: 'fiqih', label: 'Fiqih' }
    ];

    function classListNow() {
      return Array.from(new Set(getResults().map(function (r) {
        var s = getStudents().find(function (x) { return x.id === r.studentId; });
        return s ? s.kelas : null;
      }).filter(Boolean))).sort();
    }

    if (select) {
      refreshClassOptions();
      if (isSiswa) select.style.display = 'none';
    }
    if (isSiswa) {
      var podiumEl = document.getElementById('podium');
      if (podiumEl && podiumEl.closest('.card')) podiumEl.closest('.card').style.display = 'none';
      var card = tbody.closest('.card');
      if (card) {
        var head = card.querySelector('.card-head h3');
        var sub = card.querySelector('.card-head p');
        if (head) head.textContent = 'Nilai Ujian Anda';
        if (sub) sub.setAttribute('data-student-meta', '1');
      }
    }

    function rowsFor(kelas) {
      var rows = getResults().map(function (r) {
        var s = getStudents().find(function (x) { return x.id === r.studentId; });
        if (!s) return null;
        var avg = (r.mtk + r.bin + r.ipa + r.arab + r.fiqih) / 5;
        return {
          studentId: r.studentId, nama: s.nama, kelas: s.kelas, nisn: s.nisn,
          mtk: r.mtk, bin: r.bin, ipa: r.ipa, arab: r.arab, fiqih: r.fiqih,
          avg: avg
        };
      }).filter(function (r) {
        return r && (kelas === 'all' || r.kelas === kelas);
      });
      rows.sort(function (a, b) { return b.avg - a.avg || a.nama.localeCompare(b.nama); });
      rows.forEach(function (r, i) { r.rank = i + 1; r.predikat = predikat(r.avg); });
      return rows;
    }

    function refreshClassOptions() {
      if (!select) return;
      var current = select.value;
      var list = classListNow();
      select.innerHTML = '<option value="all">Semua Kelas 6</option>' + list.map(function (k) {
        return '<option value="' + esc(k) + '">Kelas ' + esc(k) + '</option>';
      }).join('');
      if (list.indexOf(current) > -1) select.value = current;
    }

    function renderStats(rows) {
      var el = document.getElementById('resultStats');
      if (!el) return;
      var kkm = Number(getSettings().kkm) || 70;
      if (isSiswa) {
        var my = rows[0];
        if (!my) {
          el.innerHTML = '<div class="stat"><div class="stat-icon">' + icon('info') + '</div><div><strong>—</strong><span class="stat-label">Belum ada nilai</span><small>Hasil ujian belum tersedia</small></div></div>';
          return;
        }
        var tuntas = my.avg >= kkm;
        el.innerHTML =
          '<div class="stat"><div class="stat-icon">' + icon('bar-chart') + '</div><div><strong>' + num1(my.avg) + '</strong><span class="stat-label">Rata-rata Anda</span><small>5 mata pelajaran</small></div></div>' +
          '<div class="stat"><div class="stat-icon gold">' + icon('award') + '</div><div><strong>#' + my.rank + '</strong><span class="stat-label">Peringkat Kelas</span><small>Kelas ' + esc(my.kelas) + '</small></div></div>' +
          '<div class="stat"><div class="stat-icon blue">' + icon('check-circle') + '</div><div><strong>' + my.predikat + '</strong><span class="stat-label">Predikat</span><small>A ≥ 90, B 80–89, C 70–79</small></div></div>' +
          '<div class="stat"><div class="stat-icon ' + (tuntas ? '' : 'red') + '">' + icon(tuntas ? 'check-circle' : 'alert-triangle') + '</div><div><strong>' + (tuntas ? 'Tuntas' : 'Belum') + '</strong><span class="stat-label">Status KKM</span><small>KKM ' + kkm + '</small></div></div>';
        return;
      }
      var avgAll = rows.reduce(function (sum, r) { return sum + r.avg; }, 0) / (rows.length || 1);
      var top = rows.length ? rows[0].avg : 0;
      var bottom = rows.length ? rows[rows.length - 1].avg : 0;
      var lulus = rows.filter(function (r) { return r.avg >= kkm; }).length;
      var pct = rows.length ? Math.round(lulus / rows.length * 100) : 0;
      el.innerHTML =
        '<div class="stat"><div class="stat-icon">' + icon('bar-chart') + '</div><div><strong>' + num1(avgAll) + '</strong><span class="stat-label">Rata-rata Kelas</span><small>5 mata pelajaran</small></div></div>' +
        '<div class="stat"><div class="stat-icon gold">' + icon('check-circle') + '</div><div><strong>' + num1(top) + '</strong><span class="stat-label">Nilai Tertinggi</span><small>' + esc(rows.length ? rows[0].nama : '—') + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon blue">' + icon('user') + '</div><div><strong>' + (rows.length ? pct + '%' : '0%') + '</strong><span class="stat-label">Tuntas KKM</span><small>KKM ' + kkm + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon red">' + icon('users') + '</div><div><strong>' + rows.length + '</strong><span class="stat-label">Peserta Ujian</span><small>Nilai terendah ' + num1(bottom) + '</small></div></div>';
    }

    function renderPodium(rows) {
      var el = document.getElementById('podium');
      if (!el) return;
      var top3 = rows.slice(0, 3);
      if (!top3.length) {
        el.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Belum ada data nilai.</div>';
        return;
      }
      var order = [top3[1], top3[0], top3[2]];
      el.innerHTML = order.map(function (r) {
        if (!r) return '';
        var cls = r.rank === 1 ? 'first' : r.rank === 2 ? 'second' : 'third';
        return '<div class="podium-card ' + cls + '">' +
          '<div class="podium-rank">' + r.rank + '</div>' +
          '<strong>' + esc(r.nama) + '</strong>' +
          '<span>Kelas ' + esc(r.kelas) + '</span>' +
          '<b>' + num1(r.avg) + '</b>' +
        '</div>';
      }).join('');
    }

    function renderDistribution(rows) {
      var el = document.getElementById('distribution');
      if (!el) return;
      var counts = { A: 0, B: 0, C: 0, D: 0 };
      rows.forEach(function (r) { counts[r.predikat]++; });
      var max = Math.max(1, counts.A, counts.B, counts.C, counts.D);
      el.innerHTML = ['A', 'B', 'C', 'D'].map(function (p) {
        return '<div class="dist-row"><span>' + p + '</span>' +
          '<div class="chart-track"><div class="chart-fill" style="width:' + (counts[p] / max * 100) + '%"></div></div>' +
          '<span class="dist-val">' + counts[p] + '</span></div>';
      }).join('');
    }

    function renderTable(rows) {
      tbody.innerHTML = rows.length ? rows.map(function (r) {
        return '<tr>' +
          '<td><span class="badge ' + (r.rank <= 3 ? 'gold' : '') + '">#' + r.rank + '</span></td>' +
          '<td><div class="cell-user"><span class="avatar sm">' + esc(initials(r.nama)) + '</span>' +
            '<div><strong>' + esc(r.nama) + '</strong><span>NISN ' + esc(r.nisn) + '</span></div></div></td>' +
          '<td>Kelas ' + esc(r.kelas) + '</td>' +
          '<td class="num">' + r.mtk + '</td>' +
          '<td class="num">' + r.bin + '</td>' +
          '<td class="num">' + r.ipa + '</td>' +
          '<td class="num">' + r.arab + '</td>' +
          '<td class="num">' + r.fiqih + '</td>' +
          '<td><strong>' + num1(r.avg) + '</strong></td>' +
          '<td>' + predikatBadge(r.predikat) + '</td>' +
          (isStaff ? '<td class="no-print"><button type="button" class="btn ghost sm" data-del-result="' + esc(r.studentId) + '" title="Hapus hasil ujian" aria-label="Hapus hasil ' + esc(r.nama) + '">' + icon('trash') + '</button></td>' : '') +
        '</tr>';
      }).join('') : '<tr><td colspan="' + (isStaff ? 11 : 10) + '"><div class="empty-state">' + icon('bar-chart') + 'Belum ada data hasil ujian.</div></td></tr>';
    }

    tbody.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-del-result]');
      if (!btn || !isStaff) return;
      var sid = btn.getAttribute('data-del-result');
      var student = getStudents().find(function (s) { return s.id === sid; });
      var row = rowsFor('all').find(function (r) { return r.studentId === sid; });
      confirmDialog({
        title: 'Hapus hasil ujian?',
        message: (student ? student.nama : 'Siswa ini') + (row ? ' (NISN ' + row.nisn + ', rata-rata ' + num1(row.avg) + ')' : '') +
          ' akan dihapus dari rekap hasil ujian, peringkat, cetak laporan, dan portal siswa.',
        confirmLabel: 'Ya, hapus',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        var del = store.get('eujian.resultsDeleted', []);
        if (!Array.isArray(del)) del = [];
        if (del.indexOf(sid) === -1) del.push(sid);
        store.set('eujian.resultsDeleted', del);
        refreshClassOptions();
        render();
        toast('Hasil ujian berhasil dihapus.');
      });
    });

    function render() {
      var all = rowsFor(select ? select.value : 'all');
      var rows = isSiswa
        ? all.filter(function (r) { return r.nama === session.name; })
        : all;
      renderStats(rows);
      if (!isSiswa) {
        renderPodium(rows);
        renderDistribution(rows);
      }
      renderTable(rows);
      var meta = document.getElementById('resultMeta');
      if (meta) meta.textContent = isSiswa
        ? 'Nilai Anda · UAS Ganjil ' + getSettings().tahunPelajaran + ' · KKM ' + getSettings().kkm
        : 'UAS Ganjil ' + getSettings().tahunPelajaran + ' · KKM ' + getSettings().kkm + ' · ' + rows.length + ' peserta';
    }

    if (isSiswa) {
      var exportWrap = document.getElementById('resultExport');
      if (exportWrap) exportWrap.style.display = 'none';
      var exportHint = document.getElementById('resultExportHint');
      if (exportHint) exportHint.style.display = 'none';
    }
    if (!isStaff) {
      var aksiHead = tbody.closest('table').querySelector('thead th:last-child');
      if (aksiHead) aksiHead.style.display = 'none';
      var syncBtnEl = document.getElementById('resultSyncBtn');
      if (syncBtnEl) syncBtnEl.style.display = 'none';
    }

    function exportRows() { return rowsFor(select ? select.value : 'all'); }

    function exportMatrix(list) {
      var head = ['No', 'Rank', 'NISN', 'Nama Siswa', 'Kelas', 'MTK', 'BIN', 'IPA', 'Bahasa Arab', 'Fiqih', 'Rata-rata', 'Predikat'];
      var body = list.map(function (r, i) {
        return [i + 1, r.rank, r.nisn, r.nama, r.kelas, r.mtk, r.bin, r.ipa, r.arab, r.fiqih, Math.round(r.avg * 10) / 10, r.predikat];
      });
      return [head].concat(body);
    }

    function exportFileName(ext) {
      var kelas = select ? select.value : 'all';
      var tahun = String(getSettings().tahunPelajaran || '').replace(/\//g, '-');
      return 'hasil-uas-' + (kelas === 'all' ? 'kelas-6' : 'kelas-' + kelas) + (tahun ? '-' + tahun : '') + '.' + ext;
    }

    function ensureXLSX() {
      if (window.XLSX) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var el = document.createElement('script');
        el.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        el.onload = function () { resolve(); };
        el.onerror = function () { reject(new Error('Pustaka Excel gagal dimuat. Periksa koneksi internet.')); };
        document.head.appendChild(el);
      });
    }

    function downloadBlob(content, type, filename) {
      var blob = new Blob([content], { type: type });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    var xlsxBtn = document.getElementById('resultXlsxBtn');
    if (xlsxBtn) xlsxBtn.addEventListener('click', function () {
      var list = exportRows();
      if (!list.length) { toast('Belum ada data untuk diekspor.', 'danger'); return; }
      ensureXLSX().then(function () {
        var ws = XLSX.utils.aoa_to_sheet(exportMatrix(list));
        ws['!cols'] = [{ wch: 5 }, { wch: 6 }, { wch: 13 }, { wch: 26 }, { wch: 8 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 12 }, { wch: 7 }, { wch: 10 }, { wch: 9 }];
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Hasil UAS');
        XLSX.writeFile(wb, exportFileName('xlsx'));
        toast('File Excel berhasil diunduh.');
      }).catch(function (err) {
        toast(err.message || 'Gagal membuat file Excel.', 'danger');
      });
    });

    var csvBtn = document.getElementById('resultCsvBtn');
    if (csvBtn) csvBtn.addEventListener('click', function () {
      var list = exportRows();
      if (!list.length) { toast('Belum ada data untuk diekspor.', 'danger'); return; }
      function csvCell(v) {
        var s = String(v == null ? '' : v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }
      var csv = '\ufeff' + exportMatrix(list).map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
      downloadBlob(csv, 'text/csv;charset=utf-8;', exportFileName('csv'));
      toast('File CSV berhasil diunduh.');
    });

    var sheetsBtn = document.getElementById('resultSheetsBtn');
    if (sheetsBtn) sheetsBtn.addEventListener('click', function () {
      var list = exportRows();
      if (!list.length) { toast('Belum ada data untuk disalin.', 'danger'); return; }
      var tsv = exportMatrix(list).map(function (row) { return row.join('\t'); }).join('\n');
      copyText(tsv).then(function () {
        toast('Tabel disalin. Buka Google Sheets lalu tempel dengan Ctrl+V.');
      }).catch(function () {
        openModal({
          title: 'Salin ke Google Sheets',
          subtitle: 'Pilih semua teks (Ctrl+A) lalu salin (Ctrl+C), kemudian tempel di Google Sheets.',
          size: 'lg',
          body: '<textarea class="input" id="sheetsText" rows="12" style="font-family:monospace;font-size:11.5px" readonly>' + esc(tsv) + '</textarea>',
          footer: '<button type="button" class="btn" data-close>Selesai</button>'
        });
        var ta = document.getElementById('sheetsText');
        if (ta) { ta.focus(); ta.select(); }
      });
    });

    /* ---- Sinkron Google Sheets ---- */
    function resultsGasCfg() {
      return {
        jenis: 'hasil-ujian',
        kelasLabel: function () {
          var k = select ? select.value : 'all';
          return k === 'all' ? 'Kelas 6 (semua)' : 'Kelas ' + k;
        },
        syncId: function () {
          return new Date().toISOString().slice(0, 10) + '|hasil|' + (select ? select.value : 'all');
        },
        build: function () {
          var k = select ? select.value : 'all';
          var label = k === 'all' ? 'Kelas 6 (semua)' : 'Kelas ' + k;
          var meta = gasMetaColumns();
          return {
            headers: ['Dikirim', 'Tahun', 'Semester', 'Filter Kelas', 'Rank', 'NISN', 'Nama', 'Kelas',
              'MTK', 'BIN', 'IPA', 'B. Arab', 'Fiqih', 'Rata-rata', 'Predikat'],
            rows: exportRows().map(function (r) {
              return meta.concat([label, r.rank, r.nisn, r.nama, r.kelas,
                r.mtk, r.bin, r.ipa, r.arab, r.fiqih, Math.round(r.avg * 10) / 10, r.predikat]);
            })
          };
        }
      };
    }

    var syncBtn = document.getElementById('resultSyncBtn');
    if (syncBtn) syncBtn.addEventListener('click', function () {
      var cfg = resultsGasCfg();
      cfg.title = 'Sinkron Hasil Ujian';
      cfg.note = 'Mengirim rekap ' + exportRows().length + ' peserta sesuai filter kelas yang aktif.';
      cfg.auto = true;
      openGasSyncModal(cfg);
    });

    if (isStaff && store.get(GAS_AUTO_KEY, false) && validGasUrl(store.get(GAS_URL_KEY, ''))) {
      setTimeout(function () {
        var cfg = resultsGasCfg();
        if (store.get(GAS_AUTO_LAST, '') !== cfg.syncId()) {
          sendGasPayload(cfg, function (res) {
            if (res.ok) toast('Rekap otomatis dikirim ke Google Sheets.');
          });
        }
      }, 900);
    }

    /* ---- Hasil pengerjaan siswa ---- */
    var attemptBody = document.getElementById('attemptRows');
    var myStudent = (isSiswa && session) ? (getStudents().find(function (s) { return s.nama === session.name; }) || null) : null;

    function attemptList() {
      var list = getStudentAttempts();
      if (!isSiswa || !session) return list;
      return list.filter(function (a) {
        return (myStudent && a.studentId === myStudent.id) || a.nama === session.name;
      });
    }

    function fmtAttemptTime(v) {
      var d = new Date(v);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function renderAttempts() {
      if (!attemptBody) return;
      var list = attemptList();
      var countEl = document.getElementById('attemptCount');
      if (countEl) countEl.textContent = list.length + ' hasil';
      var meta = document.getElementById('attemptMeta');
      if (meta) meta.textContent = isSiswa
        ? 'Nilai ujian yang Anda kumpulkan di perangkat ini.'
        : 'Nilai ujian yang dikumpulkan dari perangkat siswa (tersimpan lokal di perangkat ini).';
      attemptBody.innerHTML = list.length ? list.map(function (a) {
        return '<tr>' +
          '<td>' + esc(fmtAttemptTime(a.at)) + '</td>' +
          '<td><div class="cell-user"><span class="avatar sm">' + esc(initials(a.nama || '?')) + '</span>' +
            '<div><strong>' + esc(a.nama || '—') + '</strong><span>NISN ' + esc(a.nisn || '—') + '</span></div></div></td>' +
          '<td>' + (a.kelas ? 'Kelas ' + esc(a.kelas) : '—') + '</td>' +
          '<td>' + esc(a.mapel || '—') + '</td>' +
          '<td class="num">' + (a.correct || 0) + ' / ' + (a.pgCount || 0) + '</td>' +
          '<td class="num"><strong>' + (a.pgScore || 0) + '</strong> / ' + (a.pgMax || 0) + '</td>' +
          '<td class="num">' + (a.essayCount || 0) + '</td>' +
          (isStaff ? '<td class="no-print"><button type="button" class="btn ghost sm" data-del-attempt="' + esc(a.id) + '" title="Hapus hasil pengerjaan">' + icon('trash') + '</button></td>' : '') +
        '</tr>';
      }).join('') : '<tr><td colspan="' + (isStaff ? 8 : 7) + '"><div class="empty-state">' + icon('bar-chart') + 'Belum ada hasil pengerjaan siswa di perangkat ini.</div></td></tr>';
    }

    if (attemptBody) {
      attemptBody.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-del-attempt]');
        if (!btn || !isStaff) return;
        var id = btn.getAttribute('data-del-attempt');
        var rec = getStudentAttempts().find(function (x) { return x.id === id; });
        confirmDialog({
          title: 'Hapus hasil pengerjaan?',
          message: (rec ? rec.nama + ' · ' + rec.mapel : 'Hasil ini') + ' akan dihapus dari daftar dan tidak ikut sinkron berikutnya.',
          confirmLabel: 'Ya, hapus',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          var list = store.get('eujian.attempts', []);
          list = (Array.isArray(list) ? list : []).filter(function (x) { return x.id !== id; });
          store.set('eujian.attempts', list);
          renderAttempts();
          toast('Hasil pengerjaan berhasil dihapus.');
        });
      });
    }

    var attemptSyncBtn = document.getElementById('attemptSyncBtn');
    var attemptPrintBtn = document.getElementById('attemptPrintBtn');
    function setAttemptPrintHref() {
      if (!attemptPrintBtn) return;
      var kelas = select ? select.value : 'all';
      attemptPrintBtn.href = 'cetak-laporan.html#jenis=hasil-siswa' + (kelas !== 'all' ? '&kelas=' + encodeURIComponent(kelas) : '');
    }
    setAttemptPrintHref();
    if (attemptSyncBtn) {
      if (!isStaff) {
        attemptSyncBtn.style.display = 'none';
        if (attemptPrintBtn) attemptPrintBtn.style.display = 'none';
        if (isSiswa) {
          var attemptHint = document.getElementById('attemptHint');
          if (attemptHint) attemptHint.textContent = 'Nilai ini tersimpan di perangkat ini dan akan tampil pada rekap guru di perangkat yang sama.';
        }
      } else {
        attemptSyncBtn.addEventListener('click', function () {
          var list = attemptList();
          if (!list.length) { toast('Belum ada hasil pengerjaan siswa untuk dikirim.', 'danger'); return; }
          openGasSyncModal({
            jenis: 'hasil-siswa',
            title: 'Sinkron Hasil Siswa',
            note: 'Mengirim ' + list.length + ' hasil pengerjaan siswa ke sheet Hasil Siswa.',
            auto: false,
            kelasLabel: function () { return 'Semua kelas'; },
            syncId: function () { return new Date().toISOString().slice(0, 10) + '|hasil-siswa'; },
            build: function () {
              return { headers: ATTEMPT_HEADERS.slice(), rows: list.map(attemptRowValues) };
            }
          });
        });
      }
    }
    if (!isStaff && attemptBody) {
      var attemptHead = attemptBody.closest('table').querySelector('thead th:last-child');
      if (attemptHead) attemptHead.style.display = 'none';
    }
    renderAttempts();

    if (select) select.addEventListener('change', function () {
      render();
      setAttemptPrintHref();
    });
    render();
  }

  /* ---------------- Cetak Laporan ---------------- */
  function initReport() {
    var printArea = document.getElementById('printArea');
    if (!printArea) return;
    var typeSel = document.getElementById('reportType');
    var classSel = document.getElementById('reportClass');
    var semesterEl = document.getElementById('reportSemester');
    var refreshBtn = document.getElementById('reportRefresh');
    var printBtn = document.getElementById('reportPrint');
    var settings = getSettings();
    var paramSource = String(window.location.search || window.location.hash || '').replace(/^[?#]/, '');
    var reportParams = new URLSearchParams(paramSource);
    var paramJenis = reportParams.get('jenis');

    if (semesterEl) semesterEl.value = settings.semester + ' · ' + settings.tahunPelajaran;
    populateClasses();
    if (typeSel && paramJenis && ['nilai', 'peserta', 'berita-acara', 'hasil-siswa'].indexOf(paramJenis) > -1) {
      typeSel.value = paramJenis;
    }
    var paramKelas = reportParams.get('kelas');
    if (classSel && paramKelas && classList().indexOf(paramKelas) > -1) classSel.value = paramKelas;

    var SUBJECT_BY_MAPEL = {
      'matematika': 'mtk',
      'bahasa indonesia': 'bin',
      'ipa': 'ipa',
      'ilmu pengetahuan alam': 'ipa',
      'bahasa arab': 'arab',
      'fiqih': 'fiqih',
      'fikih': 'fiqih'
    };

    function classList() {
      var seen = {};
      getStudents().forEach(function (s) { if (s.kelas) seen[s.kelas] = 1; });
      return Object.keys(seen).sort();
    }

    function populateClasses() {
      if (!classSel) return;
      var current = classSel.value || 'all';
      var list = classList();
      var levels = [];
      list.forEach(function (k) {
        var lv = String(k).charAt(0);
        if (levels.indexOf(lv) === -1) levels.push(lv);
      });
      var allLabel = levels.length > 1
        ? 'Semua Kelas (' + levels[0] + '–' + levels[levels.length - 1] + ')'
        : 'Semua Kelas';
      classSel.innerHTML = '<option value="all">' + esc(allLabel) + '</option>' + list.map(function (k) {
        return '<option value="' + esc(k) + '">Kelas ' + esc(k) + '</option>';
      }).join('');
      classSel.value = (current === 'all' || list.indexOf(current) > -1) ? current : 'all';
    }

    function studentList(kelas) {
      return getStudents().filter(function (s) {
        return kelas === 'all' || s.kelas === kelas;
      }).sort(function (a, b) {
        return a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama);
      });
    }

    function attemptScores(student) {
      var scores = {};
      getStudentAttempts().forEach(function (a) {
        var mine = (a.studentId && a.studentId === student.id) ||
          (!a.studentId && a.nama === student.nama);
        if (!mine) return;
        var key = SUBJECT_BY_MAPEL[String(a.mapel || '').toLowerCase().trim()];
        if (!key || scores[key] != null) return;
        scores[key] = a.pgMax > 0 ? Math.round((a.pgScore || 0) / a.pgMax * 100) : (a.pgScore || 0);
      });
      return scores;
    }

    function nilaiRows(kelas) {
      var resultByNisn = {};
      getResults().forEach(function (r) {
        var s = getStudents().find(function (x) { return x.id === r.studentId; });
        if (s) resultByNisn[s.nisn] = r;
      });
      return studentList(kelas).map(function (s) {
        var r = resultByNisn[s.nisn] || {};
        var vals = {
          mtk: typeof r.mtk === 'number' ? r.mtk : null,
          bin: typeof r.bin === 'number' ? r.bin : null,
          ipa: typeof r.ipa === 'number' ? r.ipa : null,
          arab: typeof r.arab === 'number' ? r.arab : null,
          fiqih: typeof r.fiqih === 'number' ? r.fiqih : null
        };
        var att = attemptScores(s);
        Object.keys(att).forEach(function (k) {
          if (vals[k] == null) vals[k] = att[k];
        });
        var filled = ['mtk', 'bin', 'ipa', 'arab', 'fiqih'].map(function (k) { return vals[k]; })
          .filter(function (v) { return typeof v === 'number'; });
        var avg = filled.length ? filled.reduce(function (a, b) { return a + b; }, 0) / filled.length : null;
        return {
          nama: s.nama, nisn: s.nisn, kelas: s.kelas,
          mtk: vals.mtk, bin: vals.bin, ipa: vals.ipa, arab: vals.arab, fiqih: vals.fiqih,
          avg: avg, predikat: avg == null ? '—' : predikat(avg)
        };
      }).filter(function (r) { return r.avg != null; });
    }

    function pesertaRows(kelas) {
      var counters = {};
      return studentList(kelas).map(function (s) {
        counters[s.kelas] = (counters[s.kelas] || 0) + 1;
        return {
          nama: s.nama, nisn: s.nisn, kelas: s.kelas,
          noPeserta: 'SAS-' + s.kelas + '-' + String(counters[s.kelas]).padStart(2, '0')
        };
      });
    }

    function attemptsRows(kelas) {
      return getStudentAttempts().filter(function (a) {
        return kelas === 'all' || a.kelas === kelas;
      });
    }

    function attemptTimeText(v) {
      var d = new Date(v);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function kelasLabel(kelas) {
      return kelas === 'all' ? 'Seluruh Kelas IV–VI' : 'Kelas ' + kelas;
    }

    function scheduleFor(kelas) {
      var level = kelas === 'all' ? '' : String(kelas).charAt(0);
      var list = DATA.schedules.filter(function (s) { return !level || s.kelas === level; });
      return list[0] || DATA.schedules[0] || null;
    }

    function jamText(t) {
      return String(t || '').replace(/:/g, '.');
    }

    function scoreCell(v) {
      return v == null ? '—' : v;
    }

    function reportGasCfg() {
      var type = typeSel ? typeSel.value : 'nilai';
      var kelas = classSel ? classSel.value : 'all';
      var jenis = type === 'peserta' ? 'daftar-peserta'
        : type === 'berita-acara' ? 'berita-acara'
        : type === 'hasil-siswa' ? 'hasil-siswa'
        : 'laporan-nilai';
      var jenisText = GAS_SHEET_BY_JENIS[jenis];
      var label = kelasLabel(kelas);
      var peserta = pesertaRows(kelas);
      var sch = scheduleFor(kelas);
      var pengawas = sch ? sch.pengawas : 'Rina Marlina, S.Pd.';
      return {
        jenis: jenis,
        kelasLabel: function () { return label; },
        syncId: function () { return new Date().toISOString().slice(0, 10) + '|laporan|' + jenis + '|' + kelas; },
        build: function () {
          var s = getSettings();
          var base = [new Date().toISOString(), jenisText, s.tahunPelajaran, s.semester, label];
          if (jenis === 'hasil-siswa') {
            return {
              headers: ATTEMPT_HEADERS.slice(),
              rows: attemptsRows(kelas).map(attemptRowValues)
            };
          }
          if (jenis === 'daftar-peserta') {
            return {
              headers: ['Dikirim', 'Jenis Laporan', 'Tahun', 'Semester', 'Kelas', 'No', 'No Peserta', 'NISN', 'Nama', 'Kelas Siswa', 'Ruang'],
              rows: peserta.map(function (r, i) {
                return base.concat([i + 1, r.noPeserta, r.nisn, r.nama, r.kelas, 'R-' + r.kelas]);
              })
            };
          }
          if (jenis === 'berita-acara') {
            return {
              headers: ['Dikirim', 'Jenis Laporan', 'Tahun', 'Semester', 'Kelas', 'Uraian', 'Keterangan'],
              rows: [
                ['Mata Pelajaran', sch ? sch.mapel : 'Matematika'],
                ['Kelas', label],
                ['Hari/Tanggal', sch ? fmtFullDate(sch.date) : fmtFullDate('2026-11-23')],
                ['Waktu', sch ? jamText(sch.start) + '–' + jamText(sch.end) + ' WIB' : '07.30–09.00 WIB'],
                ['Pengawas', pengawas],
                ['Jumlah Peserta', peserta.length],
                ['Hadir', peserta.length],
                ['Tidak Hadir', 0]
              ].map(function (pair) { return base.concat(pair); })
            };
          }
          var rows = nilaiRows(kelas);
          return {
            headers: ['Dikirim', 'Jenis Laporan', 'Tahun', 'Semester', 'Kelas', 'No', 'Nama', 'NISN', 'MTK', 'BIN', 'IPA', 'B. Arab', 'Fiqih', 'Rata-rata', 'Predikat'],
            rows: rows.map(function (r, i) {
              return base.concat([i + 1, r.nama, r.nisn,
                r.mtk == null ? '' : r.mtk, r.bin == null ? '' : r.bin, r.ipa == null ? '' : r.ipa,
                r.arab == null ? '' : r.arab, r.fiqih == null ? '' : r.fiqih,
                Math.round(r.avg * 10) / 10, r.predikat]);
            })
          };
        }
      };
    }

    function kopHTML() {
      var alamat = String(settings.alamat || 'Jl. Raya Mukomuko–Ipuh, Kecamatan Kota Mukomuko, Kabupaten Mukomuko, Provinsi Bengkulu').replace(/\s+/g, ' ').trim();
      return '<div class="kop">' +
          '<div class="kop-logo kemenag"><img src="assets/img/logo-kemenag.svg" alt="Logo Kementerian Agama Republik Indonesia"></div>' +
          '<div class="kop-text">' +
            '<div class="k1">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>' +
            '<div class="k2">' + esc(settings.namaMadrasah.toUpperCase()) + '</div>' +
            '<div class="k3">' + esc(alamat) + '</div>' +
            '<div class="k3">NPSN ' + esc(settings.npsn) + ' · eujian@min3mukomuko.sch.id</div>' +
          '</div>' +
          '<div class="kop-logo">' + (settings.logo
            ? '<img src="' + settings.logo + '" alt="Logo ' + esc(settings.namaMadrasah) + '">'
            : icon('graduation')) + '</div>' +
        '</div>' +
        '<div class="kop-line"></div>';
    }

    function signHTML(dateText) {
      return '<div class="sign">' +
          '<div class="sign-block">Mukomuko, ' + esc(dateText) + '<br>Kepala Madrasah' +
            '<div class="sign-space"></div><div class="sign-name">' + esc(settings.kepala) + '</div>NIP. 197504122003122003</div>' +
        '</div>';
    }

    function build() {
      var type = typeSel ? typeSel.value : 'nilai';
      var kelas = classSel ? classSel.value : 'all';
      var rows = nilaiRows(kelas);
      var peserta = pesertaRows(kelas);
      var sch = scheduleFor(kelas);
      var pengawasNama = sch ? sch.pengawas : 'Rina Marlina, S.Pd.';
      var pengawasT = getTeachers().find(function (t) { return t.nama === pengawasNama; });
      var head = kopHTML();
      var title = '';
      var body = '';
      var dateText = fmtDateOnly(new Date().toISOString().slice(0, 10));

      if (type === 'hasil-siswa') {
        var attempts = attemptsRows(kelas);
        title = '<h2>Hasil Pengerjaan Siswa</h2><div class="paper-sub">Ujian Akhir Semester ' + esc(settings.semester) + ' Tahun Pelajaran ' + esc(settings.tahunPelajaran) + ' · ' + esc(kelasLabel(kelas)) + '</div>';
        body = '<table class="paper-table"><thead><tr>' +
            '<th style="width:28px">No</th><th>Waktu Kumpul</th><th>Nama Peserta</th><th>NISN</th><th>Kelas</th>' +
            '<th>Mata Pelajaran</th><th>Benar PG</th><th>Nilai PG</th><th>Uraian</th>' +
          '</tr></thead><tbody>' +
          (attempts.length ? attempts.map(function (a, i) {
            return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + esc(attemptTimeText(a.at)) + '</td>' +
              '<td>' + esc(a.nama) + '</td><td class="c">' + esc(a.nisn || '—') + '</td><td class="c">' + esc(a.kelas || '—') + '</td>' +
              '<td>' + esc(a.mapel || '—') + '</td><td class="c">' + (a.correct || 0) + ' / ' + (a.pgCount || 0) + '</td>' +
              '<td class="c"><b>' + (a.pgScore || 0) + '</b> / ' + (a.pgMax || 0) + '</td><td class="c">' + (a.essayCount || 0) + '</td></tr>';
          }).join('') : '<tr><td colspan="9" class="c">Belum ada hasil pengerjaan siswa yang tersimpan di perangkat ini.</td></tr>') +
          '</tbody></table>' +
          '<p class="body-text" style="margin-top:10px;font-size:10.5px">Nilai PG dihitung otomatis dari jawaban pilihan ganda; soal uraian menunggu koreksi guru. Data berasal dari hasil ujian yang dikumpulkan siswa pada perangkat ini.</p>' +
          signHTML(dateText);
      } else if (type === 'nilai') {
        title = '<h2>Daftar Nilai Ujian Akhir Semester</h2><div class="paper-sub">Semester ' + esc(settings.semester) + ' Tahun Pelajaran ' + esc(settings.tahunPelajaran) + ' · ' + esc(kelasLabel(kelas)) + '</div>';
        body = '<table class="paper-table"><thead><tr>' +
            '<th style="width:28px">No</th><th>Nama Peserta Didik</th><th>NISN</th><th>Kelas</th>' +
            '<th>MTK</th><th>BIN</th><th>IPA</th><th>B. Arab</th><th>Fiqih</th><th>Rata-rata</th><th>Predikat</th>' +
          '</tr></thead><tbody>' +
          (rows.length ? rows.map(function (r, i) {
            return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(r.nama) + '</td><td class="c">' + esc(r.nisn) + '</td>' +
              '<td class="c">' + esc(r.kelas) + '</td>' +
              '<td class="c">' + scoreCell(r.mtk) + '</td><td class="c">' + scoreCell(r.bin) + '</td><td class="c">' + scoreCell(r.ipa) + '</td>' +
              '<td class="c">' + scoreCell(r.arab) + '</td><td class="c">' + scoreCell(r.fiqih) + '</td>' +
              '<td class="c"><b>' + num1(r.avg) + '</b></td><td class="c">' + r.predikat + '</td></tr>';
          }).join('') : '<tr><td colspan="11" class="c">Belum ada nilai tercatat untuk ' + esc(kelasLabel(kelas)) + '.</td></tr>') +
          '</tbody></table>' +
          '<p class="body-text" style="margin-top:10px;font-size:10.5px">Keterangan: KKM ' + esc(settings.kkm) + '. Nilai merupakan hasil Ujian Akhir Semester Ganjil dan menjadi bagian dari penilaian rapor. Tanda — berarti nilai belum tersedia.</p>' +
          signHTML(dateText);
      } else if (type === 'peserta') {
        title = '<h2>Daftar Peserta Ujian</h2><div class="paper-sub">Ujian Akhir Semester ' + esc(settings.semester) + ' Tahun Pelajaran ' + esc(settings.tahunPelajaran) + ' · ' + esc(kelasLabel(kelas)) + '</div>';
        body = '<table class="paper-table"><thead><tr>' +
            '<th style="width:28px">No</th><th>No Peserta</th><th>NISN</th><th>Nama Peserta</th><th>Kelas</th><th>Ruang</th><th style="width:120px">Tanda Tangan</th>' +
          '</tr></thead><tbody>' +
          peserta.map(function (r, i) {
            return '<tr><td class="c">' + (i + 1) + '</td><td class="c">' + esc(r.noPeserta) + '</td><td class="c">' + esc(r.nisn) + '</td>' +
              '<td>' + esc(r.nama) + '</td><td class="c">' + esc(r.kelas) + '</td><td class="c">R-' + esc(r.kelas) + '</td><td></td></tr>';
          }).join('') +
          '</tbody></table>' +
          '<p class="body-text" style="margin-top:10px;font-size:10.5px">Jumlah peserta: ' + peserta.length + ' orang. Peserta wajib membawa kartu peserta dan hadir 15 menit sebelum ujian dimulai.</p>' +
          signHTML(dateText);
      } else {
        var dateISO = sch ? sch.date : '2026-11-23';
        var timeStart = sch ? jamText(sch.start) : '07.30';
        var timeEnd = sch ? jamText(sch.end) : '09.00';
        var mapelName = sch ? sch.mapel : 'Matematika';
        title = '<h2>Berita Acara Pelaksanaan Ujian</h2><div class="paper-sub">Ujian Akhir Semester ' + esc(settings.semester) + ' Tahun Pelajaran ' + esc(settings.tahunPelajaran) + '</div>';
        body = '<p class="ident"><b>Mata Pelajaran</b>: ' + esc(mapelName) + '<br><b>Kelas</b>: ' + esc(kelasLabel(kelas)) + '<br><b>Hari/Tanggal</b>: ' + esc(fmtFullDate(dateISO)) + '<br><b>Waktu</b>: ' + timeStart + '–' + timeEnd + ' WIB</p>' +
          '<p class="body-text">Pada hari ini, ' + esc(fmtFullDate(dateISO)) + ', telah dilaksanakan Ujian Akhir Semester (UAS) ' + esc(settings.semester) +
            ' Tahun Pelajaran ' + esc(settings.tahunPelajaran) + ' untuk mata pelajaran ' + esc(mapelName) + ' di ' + esc(settings.namaMadrasah) +
            '. Ujian dimulai pukul ' + timeStart + ' WIB dan berakhir pukul ' + timeEnd + ' WIB.</p>' +
          '<p class="body-text">Jumlah peserta terdaftar sebanyak ' + peserta.length + ' siswa, hadir ' + peserta.length + ' siswa, dan tidak hadir 0 siswa. ' +
            'Ujian berlangsung aman, tertib, dan lancar tanpa kendala berarti. Seluruh peserta mengerjakan soal secara mandiri sesuai tata tertib yang berlaku.</p>' +
          '<p class="body-text">Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>' +
          '<div class="sign">' +
            '<div class="sign-block">Mukomuko, ' + esc(fmtDateOnly(dateISO)) + '<br>Pengawas Ruang' +
              '<div class="sign-space"></div><div class="sign-name">' + esc(pengawasNama) + '</div>' + (pengawasT ? 'NIP. ' + esc(pengawasT.nip) : '') + '</div>' +
            '<div class="sign-block">Mukomuko, ' + esc(fmtDateOnly(dateISO)) + '<br>Kepala Madrasah' +
              '<div class="sign-space"></div><div class="sign-name">' + esc(settings.kepala) + '</div>NIP. 197504122003122003</div>' +
          '</div>';
      }

      printArea.innerHTML = head + title + body;
    }

    if (typeSel) typeSel.addEventListener('change', build);
    if (classSel) classSel.addEventListener('change', build);
    if (refreshBtn) refreshBtn.addEventListener('click', function () { build(); toast('Pratinjau laporan diperbarui.'); });
    if (printBtn) printBtn.addEventListener('click', function () { build(); window.print(); });

    var reportSyncBtn = document.getElementById('reportSyncBtn');
    if (reportSyncBtn) reportSyncBtn.addEventListener('click', function () {
      var cfg = reportGasCfg();
      var kelasNow = classSel ? classSel.value : 'all';
      var typeNow = typeSel ? typeSel.value : 'nilai';
      var count = typeNow === 'berita-acara' ? 0
        : typeNow === 'peserta' ? pesertaRows(kelasNow).length
        : typeNow === 'hasil-siswa' ? attemptsRows(kelasNow).length
        : nilaiRows(kelasNow).length;
      cfg.title = 'Sinkron Cetak Laporan';
      cfg.note = (count ? 'Mengirim ' + count + ' baris laporan' : 'Mengirim ringkasan berita acara') +
        ' ke sheet ' + (GAS_SHEET_BY_JENIS[cfg.jenis] || 'Hasil E-Ujian') + '.';
      cfg.auto = false;
      openGasSyncModal(cfg);
    });

    build();
  }

  /* ---------------- Pengaturan ---------------- */
  function initSettings() {
    var form = document.getElementById('settingsForm');
    var settings = getSettings();
    if (form) {
      var fields = {
        setNama: 'namaMadrasah', setNpsn: 'npsn', setKepala: 'kepala',
        setTahun: 'tahunPelajaran', setSemester: 'semester', setKkm: 'kkm', setDurasi: 'durasi'
      };
      Object.keys(fields).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = settings[fields[id]];
      });
      var acak = document.getElementById('setAcak');
      var hasil = document.getElementById('setHasil');
      if (acak) acak.checked = !!settings.acakSoal;
      if (hasil) hasil.checked = !!settings.hasilLangsung;

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var current = getSettings();
        var next = {
          namaMadrasah: ($('#setNama') || {}).value ? $('#setNama').value.trim() : settings.namaMadrasah,
          npsn: ($('#setNpsn') || {}).value ? $('#setNpsn').value.trim() : settings.npsn,
          kepala: ($('#setKepala') || {}).value ? $('#setKepala').value.trim() : settings.kepala,
          tahunPelajaran: $('#setTahun') ? $('#setTahun').value : settings.tahunPelajaran,
          semester: $('#setSemester') ? $('#setSemester').value : settings.semester,
          kkm: Math.min(100, Math.max(0, parseInt($('#setKkm') ? $('#setKkm').value : settings.kkm, 10) || 70)),
          durasi: Math.min(180, Math.max(5, parseInt($('#setDurasi') ? $('#setDurasi').value : settings.durasi, 10) || 60)),
          acakSoal: acak ? acak.checked : !!settings.acakSoal,
          hasilLangsung: hasil ? hasil.checked : !!settings.hasilLangsung,
          alamat: current.alamat || '',
          logo: current.logo || ''
        };
        if (!next.namaMadrasah || !next.npsn || !next.kepala) {
          toast('Lengkapi identitas madrasah terlebih dahulu.', 'danger');
          return;
        }
        store.set('eujian.settings', next);
        var tp = document.querySelector('.tp-card strong');
        if (tp) tp.textContent = next.tahunPelajaran + ' · ' + next.semester;
        toast('Pengaturan berhasil disimpan.');
      });
    }

    var reportForm = document.getElementById('reportSettingsForm');
    if (reportForm) {
      var alamatEl = document.getElementById('setAlamat');
      var logoPreview = document.getElementById('logoPreview');
      var logoFile = document.getElementById('logoFile');
      var savedReport = getSettings();
      var pendingLogo = savedReport.logo || '';

      if (alamatEl) alamatEl.value = savedReport.alamat || '';

      function renderLogoPreview() {
        if (!logoPreview) return;
        logoPreview.innerHTML = pendingLogo
          ? '<img src="' + pendingLogo + '" alt="Logo madrasah">'
          : icon('image');
      }
      renderLogoPreview();

      var pickLogoBtn = document.getElementById('pickLogoBtn');
      var removeLogoBtn = document.getElementById('removeLogoBtn');
      if (pickLogoBtn && logoFile) pickLogoBtn.onclick = function () { logoFile.click(); };
      if (logoFile) {
        logoFile.addEventListener('change', function () {
          var file = logoFile.files && logoFile.files[0];
          logoFile.value = '';
          if (!file) return;
          if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
            toast('Logo harus berformat PNG, JPG, atau WebP.', 'danger');
            return;
          }
          if (file.size > 500 * 1024) {
            toast('Ukuran logo maksimal 500 KB.', 'danger');
            return;
          }
          var reader = new FileReader();
          reader.onload = function () {
            pendingLogo = String(reader.result || '');
            renderLogoPreview();
            toast('Logo siap. Klik Simpan Pengaturan Cetak untuk menerapkan.');
          };
          reader.onerror = function () { toast('Gagal membaca file logo.', 'danger'); };
          reader.readAsDataURL(file);
        });
      }
      if (removeLogoBtn) {
        removeLogoBtn.onclick = function () {
          pendingLogo = '';
          renderLogoPreview();
          toast('Logo dihapus dari pratinjau. Klik Simpan untuk menerapkan.');
        };
      }

      reportForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var latest = getSettings();
        latest.alamat = alamatEl ? alamatEl.value.trim() : (latest.alamat || '');
        latest.logo = pendingLogo;
        store.set('eujian.settings', latest);
        toast('Pengaturan cetak laporan berhasil disimpan.');
      });
    }

    var accountRows = document.getElementById('accountRows');
    if (accountRows) {
      function renderAccounts() {
        var statuses = store.get('eujian.akun', {});
        accountRows.innerHTML = DATA.accounts.map(withProfile).map(function (acc) {
          var aktif = statuses[acc.username] !== false;
          return '<tr>' +
            '<td><span class="badge ' + (acc.role === 'admin' ? 'gold' : acc.role === 'guru' ? 'info' : acc.role === 'kepala' ? 'warn' : 'success') + '">' + esc(ROLE_LABEL[acc.role]) + '</span></td>' +
            '<td><div class="cell-user"><span class="avatar sm">' + esc(initials(acc.name)) + '</span>' +
              '<div><strong>' + esc(acc.name) + '</strong><span>@' + esc(acc.username) + '</span></div></div></td>' +
            '<td><span class="badge ' + (aktif ? 'success' : 'danger') + '">' + (aktif ? 'Aktif' : 'Nonaktif') + '</span></td>' +
            '<td><div class="account-row-actions">' +
              '<button type="button" class="btn ghost sm" data-reset="' + esc(acc.username) + '" title="Ubah kata sandi" aria-label="Ubah kata sandi">' + icon('key') + '</button>' +
              '<button type="button" class="btn ghost sm" data-toggle="' + esc(acc.username) + '">' + (aktif ? 'Nonaktifkan' : 'Aktifkan') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('');
      }

      function openPasswordModal(username) {
        var acc = DATA.accounts.map(withProfile).find(function (a) { return a.username === username; });
        if (!acc) return;
        openModal({
          title: 'Ubah Kata Sandi',
          subtitle: esc(ROLE_LABEL[acc.role] || '') + ' · @' + esc(acc.username) + ' — ' + esc(acc.name),
          body: '<form id="pwdForm" novalidate>' +
              '<div class="field"><label for="pwdNew">Kata sandi baru</label>' +
                '<input class="input" id="pwdNew" type="password" autocomplete="new-password" placeholder="Minimal 6 karakter"></div>' +
              '<div class="field"><label for="pwdConfirm">Ulangi kata sandi baru</label>' +
                '<input class="input" id="pwdConfirm" type="password" autocomplete="new-password" placeholder="Ulangi kata sandi baru"></div>' +
              '<p class="form-error" id="pwdError" hidden></p>' +
              '<p class="hint" style="margin:2px 0 0">Kata sandi disimpan di perangkat ini (mode demo).</p>' +
            '</form>',
          footer: '<button type="button" class="btn outline" id="pwdCancel">Batal</button>' +
                  '<button type="button" class="btn" id="pwdSave">' + icon('save') + ' Simpan Kata Sandi</button>'
        });

        var errEl = document.getElementById('pwdError');
        function fail(msg) {
          errEl.hidden = false;
          errEl.textContent = msg;
        }
        function save() {
          var p1 = document.getElementById('pwdNew').value;
          var p2 = document.getElementById('pwdConfirm').value;
          if (p1.length < 6) return fail('Kata sandi minimal 6 karakter.');
          if (p1 !== p2) return fail('Ulangi kata sandi dengan tepat, belum sama.');
          var pwds = getPasswords();
          pwds[acc.username] = p1;
          store.set('eujian.passwords', pwds);
          closeModal();
          toast('Kata sandi @' + acc.username + ' berhasil diperbarui.');
        }
        document.getElementById('pwdCancel').onclick = closeModal;
        document.getElementById('pwdSave').onclick = save;
        document.getElementById('pwdForm').onsubmit = function (event) {
          event.preventDefault();
          save();
        };
        var first = document.getElementById('pwdNew');
        if (first) first.focus();
      }

      accountRows.addEventListener('click', function (event) {
        var resetBtn = event.target.closest('[data-reset]');
        var toggleBtn = event.target.closest('[data-toggle]');
        if (resetBtn) {
          openPasswordModal(resetBtn.getAttribute('data-reset'));
          return;
        }
        if (toggleBtn) {
          var username = toggleBtn.getAttribute('data-toggle');
          var statuses = store.get('eujian.akun', {});
          statuses[username] = statuses[username] === false;
          store.set('eujian.akun', statuses);
          renderAccounts();
          toast('Status akun @' + username + ' diperbarui.');
        }
      });

      renderAccounts();
    }

    var exportBtn = document.getElementById('exportDataBtn');
    var importBtn = document.getElementById('importDataBtn');
    var importFile = document.getElementById('importDataFile');
    var transferInfo = document.getElementById('dataTransferInfo');

    function collectBackup() {
      var data = {};
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf('eujian.') !== 0 || key === 'eujian.session' || key === 'eujian.attempt') return;
        try { data[key] = JSON.parse(localStorage.getItem(key)); } catch (err) { /* skip invalid */ }
      });
      return data;
    }

    function backupLabel(data) {
      function count(key) { return Array.isArray(data[key]) ? data[key].length : 0; }
      return count('eujian.soalExtra') + ' soal, ' + count('eujian.studentsExtra') + ' siswa tambahan, ' +
        count('eujian.teachersExtra') + ' guru tambahan, ' + Object.keys(data['eujian.profiles'] || {}).length + ' profil akun diubah';
    }

    if (exportBtn) {
      exportBtn.onclick = function () {
        var data = collectBackup();
        var payload = { app: 'eujian-min3mukomuko', version: 1, exportedAt: new Date().toISOString(), data: data };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'eujian-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        if (transferInfo) transferInfo.textContent = 'Backup diunduh: ' + backupLabel(data) + '.';
        toast('Data berhasil diekspor.');
      };
    }

    if (importBtn && importFile) {
      importBtn.onclick = function () { importFile.click(); };
      importFile.addEventListener('change', function () {
        var file = importFile.files && importFile.files[0];
        importFile.value = '';
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast('Ukuran file backup maksimal 5 MB.', 'danger'); return; }
        var reader = new FileReader();
        reader.onload = function () {
          var payload;
          try { payload = JSON.parse(String(reader.result || '')); }
          catch (err) { toast('File bukan JSON yang valid.', 'danger'); return; }
          var data = payload && payload.data ? payload.data : payload;
          if (!data || typeof data !== 'object' || Array.isArray(data)) { toast('Format file backup tidak dikenali.', 'danger'); return; }
          var keys = Object.keys(data).filter(function (key) {
            return key.indexOf('eujian.') === 0 && key !== 'eujian.session' && key !== 'eujian.attempt';
          });
          if (!keys.length) { toast('Tidak ada data E-Ujian di dalam file backup.', 'danger'); return; }
          confirmDialog({
            title: 'Impor data ke perangkat ini?',
            message: 'Seluruh data E-Ujian di perangkat ini akan diganti dengan isi file (' + backupLabel(data) + '). Sesi login Anda tetap dipertahankan.',
            confirmLabel: 'Ya, impor data',
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            Object.keys(localStorage).filter(function (key) {
              return key.indexOf('eujian.') === 0 && key !== 'eujian.session' && key !== 'eujian.attempt';
            }).forEach(function (key) { localStorage.removeItem(key); });
            keys.forEach(function (key) { store.set(key, data[key]); });
            toast('Impor data berhasil. Halaman akan dimuat ulang.');
            setTimeout(function () { window.location.reload(); }, 900);
          });
        };
        reader.readAsText(file);
      });
    }

    var resetBtn = document.getElementById('resetDemoBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        confirmDialog({
          title: 'Reset data demo?',
          message: 'Seluruh perubahan demo (siswa tambahan, soal baru, pengaturan, kata sandi, sesi login, dan jawaban ujian) akan dihapus. Halaman akan dimuat ulang.',
          confirmLabel: 'Ya, reset sekarang',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          try {
            Object.keys(localStorage).filter(function (key) { return key.indexOf('eujian.') === 0; })
              .forEach(function (key) { localStorage.removeItem(key); });
          } catch (err) { /* ignore */ }
          window.location.reload();
        });
      });
    }
  }

  /* ---------------- Login ---------------- */
  function initLogin() {
    var form = document.getElementById('loginForm');
    var errorEl = document.getElementById('loginError');
    var tabs = $$('.role-tab');
    var allowedRoles = tabs.map(function (tab) { return tab.getAttribute('data-role'); });
    var isStudentPortal = allowedRoles.indexOf('siswa') > -1;
    var role = allowedRoles[0] || 'siswa';
    var allAccounts = DATA.accounts.concat(getTeacherAccounts(), getStudentAccounts()).map(withProfile);
    var session = getSession();
    var homeFor = function (r) { return r === 'siswa' ? 'beranda-siswa.html' : 'index.html'; };

    var sessionEl = document.getElementById('loginSession');
    if (sessionEl) {
      sessionEl.innerHTML = session
        ? '<div class="session-banner"><span class="avatar sm">' + esc(initials(session.name)) + '</span>' +
            '<div><strong>Anda sudah masuk sebagai ' + esc(session.name) + '</strong><span>' + esc(ROLE_LABEL[session.role] || '') + '</span></div>' +
            '<a class="btn outline" href="' + homeFor(session.role) + '">Lanjut</a>' +
            '<button type="button" class="btn ghost" id="sessionLogout">Keluar</button>' +
          '</div>'
        : '';
      var sessionLogout = document.getElementById('sessionLogout');
      if (sessionLogout) {
        sessionLogout.onclick = function () {
          store.del('eujian.session');
          toast('Anda telah keluar dari sistem.');
          sessionEl.innerHTML = '';
          var tabsEl = document.getElementById('roleTabs');
          if (tabsEl) tabsEl.classList.remove('is-dimmed');
        };
      }
    }

    function setRole(value) {
      if (allowedRoles.indexOf(value) === -1) return;
      role = value;
      tabs.forEach(function (tab) {
        tab.classList.toggle('active', tab.getAttribute('data-role') === value);
      });
      if (errorEl) errorEl.hidden = true;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { setRole(tab.getAttribute('data-role')); });
    });

    var demoList = document.getElementById('demoList');
    if (demoList) {
      var demoAccounts = allAccounts.filter(function (acc) { return allowedRoles.indexOf(acc.role) > -1 && acc.status !== 'Cuti'; });
      if (isStudentPortal) demoAccounts = demoAccounts.slice(0, 4);
      else demoAccounts = demoAccounts.slice(0, 8);
      demoList.innerHTML = demoAccounts.map(function (acc) {
        return '<button type="button" class="demo-btn" data-user="' + esc(acc.username) + '">' +
          '<strong>' + esc(ROLE_LABEL[acc.role]) + ' · ' + esc(acc.username) + '</strong><span>' + esc(acc.detail) + '</span>' +
        '</button>';
      }).join('');
      demoList.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-user]');
        if (!btn) return;
        var acc = allAccounts.find(function (a) { return a.username === btn.getAttribute('data-user'); });
        if (!acc) return;
        setRole(acc.role);
        var userInput = document.getElementById('username');
        var passInput = document.getElementById('password');
        if (userInput) userInput.value = acc.username;
        if (passInput) passInput.value = passwordFor(acc);
        if (passInput) passInput.focus();
      });

      var demoHint = document.getElementById('demoHint');
      if (demoHint) {
        demoHint.textContent = isStudentPortal
          ? 'Semua siswa: NISN atau nama · sandi 123456'
          : 'Guru: nama atau NIP · sandi 123456';
      }
    }

    var toggle = document.getElementById('togglePassword');
    var passInput = document.getElementById('password');
    if (toggle && passInput) {
      toggle.addEventListener('click', function () {
        var showing = passInput.type === 'text';
        passInput.type = showing ? 'password' : 'text';
        toggle.setAttribute('aria-label', showing ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi');
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var username = String((document.getElementById('username') || {}).value || '').trim();
        var password = String((document.getElementById('password') || {}).value || '');
        var acc = findAccount(allAccounts, username, role);
        if (!acc || passwordFor(acc) !== password) {
          if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = role === 'siswa'
              ? 'NISN/nama atau kata sandi salah. Masukkan NISN atau nama lengkap siswa dengan kata sandi yang benar.'
              : role === 'guru'
                ? 'Nama guru atau NIP tidak cocok dengan kata sandi. Gunakan nama lengkap atau NIP guru yang terdaftar.'
                : 'Username atau kata sandi salah untuk peran ' + (ROLE_LABEL[role] || role) + '. Gunakan akun demo di bawah.';
          }
          return;
        }
        if (acc.status === 'Cuti') {
          if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Akun ' + acc.name + ' berstatus Cuti. Hubungi operator madrasah untuk mengaktifkan kembali.';
          }
          return;
        }
        if (!isAccountActive(acc.username)) {
          if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Akun @' + acc.username + ' sedang dinonaktifkan. Hubungi operator madrasah.';
          }
          return;
        }
        store.set('eujian.session', {
          role: acc.role,
          name: acc.name,
          username: acc.username,
          detail: acc.detail,
          loginAt: Date.now()
        });
        toast('Berhasil masuk. Selamat datang, ' + acc.name.split(',')[0] + '!');
        setTimeout(function () { window.location.href = homeFor(acc.role); }, 500);
      });
    }
  }

  /* ---------------- Absensi Ujian ---------------- */
  var ABSENSI_STATUS = ['Hadir', 'Sakit', 'Izin', 'Alpa'];

  function getAbsensiRecords() {
    var list = store.get('eujian.absensiUjian', []);
    return Array.isArray(list) ? list.filter(function (record) {
      return record && record.id && Array.isArray(record.students);
    }) : [];
  }

  function saveAbsensiRecords(list) {
    store.set('eujian.absensiUjian', list);
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function absensiBadgeClass(status) {
    if (status === 'Hadir') return 'success';
    if (status === 'Sakit') return 'warn';
    if (status === 'Izin') return 'info';
    return 'danger';
  }

  function initAbsensi() {
    var rowsEl = document.getElementById('absStudentRows');
    if (!rowsEl) return;
    var session = getSession();
    var isGuru = session && session.role === 'guru';
    var tanggalEl = document.getElementById('absTanggal');
    var kelasEl = document.getElementById('absKelas');
    var mapelEl = document.getElementById('absMapel');
    var pengawasEl = document.getElementById('absPengawas');
    var infoEl = document.getElementById('absFormInfo');
    var statsEl = document.getElementById('absStats');
    var historyEl = document.getElementById('absHistoryRows');
    var histCount = document.getElementById('absHistoryCount');
    var histNote = document.getElementById('absHistoryNote');
    var roleBadge = document.getElementById('absensiRoleBadge');
    var allHadirBtn = document.getElementById('absAllHadirBtn');
    var saveBtn = document.getElementById('absSaveBtn');
    var statuses = {};
    var loaded = [];

    if (roleBadge) {
      roleBadge.innerHTML = icon(isGuru ? 'user' : 'shield') + (isGuru ? 'Guru · catatan pribadi' : 'Rekap semua catatan');
    }

    var kelasList = [];
    getStudents().forEach(function (s) {
      if (s && s.kelas && kelasList.indexOf(s.kelas) === -1) kelasList.push(s.kelas);
    });
    kelasList.sort();
    if (kelasEl) {
      kelasEl.innerHTML = kelasList.map(function (k) {
        return '<option value="' + esc(k) + '">Kelas ' + esc(k) + '</option>';
      }).join('') || '<option value="">Belum ada kelas</option>';
    }

    var mapelList = [];
    DATA.schedules.forEach(function (s) {
      if (s && s.mapel && mapelList.indexOf(s.mapel) === -1) mapelList.push(s.mapel);
    });
    if (mapelEl) {
      mapelEl.innerHTML = mapelList.map(function (m) {
        return '<option value="' + esc(m) + '">' + esc(m) + '</option>';
      }).join('');
    }

    if (tanggalEl && !tanggalEl.value) tanggalEl.value = todayISO();

    function visibleRecords() {
      var list = getAbsensiRecords();
      if (!isGuru) return list;
      return list.filter(function (r) { return r.guruUsername === session.username; });
    }

    function findExisting(tanggal, mapel, kelas) {
      return getAbsensiRecords().find(function (r) {
        return r.tanggal === tanggal && r.mapel === mapel && r.kelas === kelas && r.guruUsername === session.username;
      });
    }

    function setInfo(message, tone) {
      if (!infoEl) return;
      if (!message) { infoEl.hidden = true; infoEl.innerHTML = ''; return; }
      infoEl.hidden = false;
      infoEl.innerHTML = icon(tone === 'danger' ? 'alert-triangle' : 'info') + '<span>' + esc(message) + '</span>';
    }

    function renderRows() {
      rowsEl.innerHTML = loaded.length ? loaded.map(function (s, i) {
        return '<tr>' +
          '<td class="num">' + (i + 1) + '</td>' +
          '<td><div class="cell-user"><span class="avatar sm">' + esc(initials(s.nama)) + '</span>' +
            '<div><strong>' + esc(s.nama) + '</strong><span>Kelas ' + esc(s.kelas) + '</span></div></div></td>' +
          '<td>' + esc(s.nisn) + '</td>' +
          '<td><div class="att-pills" data-nisn="' + esc(s.nisn) + '">' + ABSENSI_STATUS.map(function (st) {
            return '<button type="button" class="att-pill' + (statuses[s.nisn] === st ? ' active' : '') + '" data-status="' + st + '">' + st + '</button>';
          }).join('') + '</div></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="4"><div class="empty-state">' + icon('users') + 'Belum ada siswa pada kelas ini.</div></td></tr>';
    }

    function loadStudents() {
      var kelas = kelasEl ? kelasEl.value : '';
      loaded = getStudents().filter(function (s) { return s && s.kelas === kelas; });
      statuses = {};
      loaded.forEach(function (s) { statuses[s.nisn] = 'Hadir'; });
      var existing = findExisting(tanggalEl ? tanggalEl.value : '', mapelEl ? mapelEl.value : '', kelas);
      if (existing) {
        existing.students.forEach(function (s) {
          if (statuses.hasOwnProperty(s.nisn) && ABSENSI_STATUS.indexOf(s.status) > -1) statuses[s.nisn] = s.status;
        });
        setInfo('Absensi ini sudah pernah disimpan. Menyimpan lagi akan memperbarui data.', 'info');
      } else {
        setInfo('', '');
      }
      renderRows();
      renderStats();
    }

    function currentCounts() {
      var counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
      loaded.forEach(function (s) {
        var st = statuses[s.nisn] || 'Hadir';
        counts[st] = (counts[st] || 0) + 1;
      });
      return counts;
    }

    function renderStats() {
      if (!statsEl) return;
      var counts = currentCounts();
      var hadir = counts.Hadir;
      var tidak = loaded.length - hadir;
      statsEl.innerHTML =
        '<div class="stat"><div class="stat-icon">' + icon('users') + '</div><div><strong>' + loaded.length + '</strong><span class="stat-label">Siswa di Kelas</span><small>' + esc(kelasEl ? 'Kelas ' + kelasEl.value : '—') + '</small></div></div>' +
        '<div class="stat"><div class="stat-icon">' + icon('check-circle') + '</div><div><strong>' + hadir + '</strong><span class="stat-label">Hadir</span><small>Siap mengikuti ujian</small></div></div>' +
        '<div class="stat"><div class="stat-icon red">' + icon('alert-triangle') + '</div><div><strong>' + tidak + '</strong><span class="stat-label">Tidak Hadir</span><small>Sakit · Izin · Alpa</small></div></div>' +
        '<div class="stat"><div class="stat-icon blue">' + icon('file-text') + '</div><div><strong>' + visibleRecords().length + '</strong><span class="stat-label">Catatan Tersimpan</span><small>' + (isGuru ? 'Absensi Anda' : 'Semua guru') + '</small></div></div>';
    }

    function renderHistory() {
      if (!historyEl) return;
      var records = visibleRecords().slice().sort(function (a, b) {
        if (a.tanggal === b.tanggal) return (b.savedAt || 0) - (a.savedAt || 0);
        return a.tanggal < b.tanggal ? 1 : -1;
      });
      if (histCount) histCount.textContent = records.length + ' catatan';
      if (histNote) histNote.textContent = isGuru
        ? 'Anda hanya melihat absensi yang Anda catat sendiri.'
        : 'Rekap seluruh absensi yang dicatat guru, admin, dan kepala madrasah.';
      historyEl.innerHTML = records.length ? records.map(function (r, idx) {
        var hadir = r.students.filter(function (s) { return s.status === 'Hadir'; }).length;
        var tidak = r.students.length - hadir;
        var canManage = r.guruUsername === session.username;
        return '<tr>' +
          '<td class="num">' + (idx + 1) + '</td>' +
          '<td><strong style="font-size:12px">' + esc(fmtDateOnly(r.tanggal)) + '</strong>' +
            (r.pengawas ? '<span style="display:block;font-size:10.5px;color:var(--muted)">' + esc(r.pengawas) + '</span>' : '') + '</td>' +
          '<td>Kelas ' + esc(r.kelas) + '</td>' +
          '<td><span class="badge info">' + esc(r.mapel) + '</span></td>' +
          '<td><div class="cell-user"><span class="avatar sm">' + esc(initials(r.guruName || 'G')) + '</span>' +
            '<div><strong>' + esc(r.guruName || r.guruUsername || '—') + '</strong><span>' + esc(session.role === 'guru' ? 'Anda' : 'Pencatat') + '</span></div></div></td>' +
          '<td><span class="badge success">' + hadir + '</span></td>' +
          '<td><span class="badge ' + (tidak ? 'danger' : '') + '">' + tidak + '</span></td>' +
          '<td><div class="table-action">' +
            '<button class="btn ghost sm" type="button" data-abs-view="' + esc(r.id) + '" title="Lihat detail">' + icon('eye') + '</button>' +
            (canManage ? '<button class="btn ghost sm" type="button" data-abs-load="' + esc(r.id) + '" title="Muat ke formulir">' + icon('edit') + '</button>' +
              '<button class="btn ghost sm" type="button" data-abs-del="' + esc(r.id) + '" title="Hapus absensi">' + icon('trash') + '</button>' : '') +
          '</div></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty-state">' + icon('file-text') + 'Belum ada absensi yang dicatat.</div></td></tr>';
    }

    function openDetail(record) {
      var hadir = record.students.filter(function (s) { return s.status === 'Hadir'; }).length;
      var body = '<div class="info-grid" style="margin-bottom:14px">' +
          '<div class="info-row"><span>Tanggal</span><strong>' + esc(fmtFullDate(record.tanggal)) + '</strong></div>' +
          '<div class="info-row"><span>Kelas</span><strong>Kelas ' + esc(record.kelas) + '</strong></div>' +
          '<div class="info-row"><span>Mata Pelajaran</span><strong>' + esc(record.mapel) + '</strong></div>' +
          '<div class="info-row"><span>Pencatat</span><strong>' + esc(record.guruName || record.guruUsername || '—') + '</strong></div>' +
          '<div class="info-row"><span>Pengawas / Sesi</span><strong>' + esc(record.pengawas || '—') + '</strong></div>' +
          '<div class="info-row"><span>Rekap</span><strong>' + hadir + ' hadir · ' + (record.students.length - hadir) + ' tidak hadir</strong></div>' +
        '</div>' +
        '<div class="table-wrap"><table class="data" style="min-width:420px"><thead><tr><th>No</th><th>Siswa</th><th>NISN</th><th>Kehadiran</th></tr></thead><tbody>' +
        record.students.map(function (s, i) {
          return '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(s.nama) + '</td><td>' + esc(s.nisn) + '</td>' +
            '<td><span class="badge ' + absensiBadgeClass(s.status) + '">' + esc(s.status) + '</span></td></tr>';
        }).join('') +
        '</tbody></table></div>';
      openModal({
        title: 'Detail Absensi Ujian',
        subtitle: esc(record.mapel) + ' · Kelas ' + esc(record.kelas),
        size: 'lg',
        body: body,
        footer: '<button type="button" class="btn outline" data-close>Tutup</button>'
      });
    }

    rowsEl.addEventListener('click', function (event) {
      var pill = event.target.closest('.att-pill');
      if (!pill) return;
      var group = pill.parentNode;
      var nisn = group.getAttribute('data-nisn');
      statuses[nisn] = pill.getAttribute('data-status');
      Array.prototype.forEach.call(group.children, function (btn) {
        btn.classList.toggle('active', btn === pill);
      });
      renderStats();
    });

    if (allHadirBtn) {
      allHadirBtn.addEventListener('click', function () {
        loaded.forEach(function (s) { statuses[s.nisn] = 'Hadir'; });
        renderRows();
        renderStats();
        toast('Semua siswa ditandai hadir.');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (!loaded.length) { toast('Pilih kelas yang memiliki siswa terlebih dahulu.', 'danger'); return; }
        var tanggal = tanggalEl ? tanggalEl.value : '';
        var mapel = mapelEl ? mapelEl.value : '';
        var kelas = kelasEl ? kelasEl.value : '';
        if (!tanggal) { toast('Tanggal ujian wajib diisi.', 'danger'); return; }
        if (!mapel || !kelas) { toast('Mata pelajaran dan kelas wajib dipilih.', 'danger'); return; }
        var list = getAbsensiRecords();
        var record = {
          id: '',
          tanggal: tanggal,
          mapel: mapel,
          kelas: kelas,
          pengawas: pengawasEl ? pengawasEl.value.trim() : '',
          guruUsername: session.username,
          guruName: session.name,
          savedAt: Date.now(),
          students: loaded.map(function (s) {
            return { nisn: s.nisn, nama: s.nama, status: statuses[s.nisn] || 'Hadir' };
          })
        };
        var index = list.findIndex(function (r) {
          return r.tanggal === tanggal && r.mapel === mapel && r.kelas === kelas && r.guruUsername === session.username;
        });
        if (index > -1) {
          record.id = list[index].id;
          list[index] = record;
        } else {
          record.id = 'AB' + Date.now();
          list.push(record);
        }
        saveAbsensiRecords(list);
        setInfo('Absensi ' + mapel + ' Kelas ' + kelas + ' berhasil disimpan.', 'info');
        renderHistory();
        renderStats();
        toast('Absensi berhasil disimpan.');
      });
    }

    historyEl.addEventListener('click', function (event) {
      var viewBtn = event.target.closest('[data-abs-view]');
      var loadBtn = event.target.closest('[data-abs-load]');
      var delBtn = event.target.closest('[data-abs-del]');
      var records = getAbsensiRecords();
      var record;
      if (viewBtn) {
        record = records.find(function (r) { return r.id === viewBtn.getAttribute('data-abs-view'); });
        if (record) openDetail(record);
        return;
      }
      if (loadBtn) {
        record = records.find(function (r) { return r.id === loadBtn.getAttribute('data-abs-load'); });
        if (!record) return;
        tanggalEl.value = record.tanggal;
        if (kelasEl) kelasEl.value = record.kelas;
        if (mapelEl) mapelEl.value = record.mapel;
        if (pengawasEl) pengawasEl.value = record.pengawas || '';
        loadStudents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('Data absensi dimuat ke formulir.');
        return;
      }
      if (delBtn) {
        record = records.find(function (r) { return r.id === delBtn.getAttribute('data-abs-del'); });
        if (!record) return;
        confirmDialog({
          title: 'Hapus absensi?',
          message: 'Absensi ' + record.mapel + ' Kelas ' + record.kelas + ' (' + fmtDateOnly(record.tanggal) + ') akan dihapus.',
          confirmLabel: 'Ya, hapus',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          saveAbsensiRecords(records.filter(function (r) { return r.id !== record.id; }));
          loadStudents();
          renderHistory();
          renderStats();
          toast('Absensi berhasil dihapus.');
        });
      }
    });

    [tanggalEl, kelasEl, mapelEl].forEach(function (el) {
      if (el) el.addEventListener('change', loadStudents);
    });

    renderHistory();
    loadStudents();
  }

  /* ---------------- Profil Madrasah ---------------- */
  var PROFIL_DEFAULTS = {
    visi: 'Terwujudnya peserta didik yang beriman, berakhlak mulia, cakap, mandiri, dan berwawasan global berlandaskan nilai-nilai Islam.',
    misi: [
      'Menanamkan akidah dan akhlak mulia melalui pembiasaan ibadah dan keteladanan.',
      'Menyelenggarakan pembelajaran aktif, kreatif, dan menyenangkan berbasis Kurikulum Merdeka.',
      'Mengembangkan potensi akademik dan nonakademik peserta didik secara optimal.',
      'Meningkatkan kompetensi guru dan tenaga kependidikan secara berkelanjutan.',
      'Membangun kemitraan yang harmonis dengan orang tua dan masyarakat.'
    ],
    sejarah: 'MIN 3 Mukomuko berdiri sejak tahun 1975 sebagai lembaga pendidikan dasar Islam di bawah Kementerian Agama Kabupaten Mukomuko. Seiring berjalannya waktu, madrasah terus berkembang baik dari segi sarana prasarana, kualitas tenaga pendidik, maupun mutu pembelajaran. Kini MIN 3 Mukomuko dipercaya oleh masyarakat sebagai salah satu madrasah ibtidaiyah negeri yang unggul dalam pembinaan karakter, literasi, dan nilai-nilai keislaman.',
    org: {
      lead: { title: 'Kepala Madrasah', name: 'Dra. Hj. Nurhasanah, M.Pd.' },
      rows: [
        [
          { title: 'Koord. Kurikulum', sub: 'Rina Marlina, S.Pd.' },
          { title: 'Koord. Kesiswaan', sub: 'Dewi Kurnia, S.Pd.' },
          { title: 'Tata Usaha', sub: 'Operator Madrasah' }
        ],
        [
          { title: 'Guru Kelas 4', sub: '4A, 4B & 4C' },
          { title: 'Guru Kelas 5', sub: '5A, 5B & 5C' },
          { title: 'Guru Kelas 6', sub: '6A & 6B' },
          { title: 'Guru Mapel', sub: 'PJOK · Arab · Fiqih' }
        ]
      ]
    }
  };

  function normalizeOrg(org) {
    if (!org || typeof org !== 'object') return null;
    var lead = org.lead && typeof org.lead === 'object' ? org.lead : null;
    if (!lead || !String(lead.title || '').trim()) return null;
    var rows = Array.isArray(org.rows) ? org.rows.map(function (row) {
      return (Array.isArray(row) ? row : []).filter(function (box) {
        return box && String(box.title || '').trim();
      }).map(function (box) {
        return { title: String(box.title).trim(), sub: String(box.sub || '').trim() };
      });
    }).filter(function (row) { return row.length; }) : [];
    if (!rows.length) return null;
    return {
      lead: { title: String(lead.title).trim(), name: String(lead.name || '').trim() },
      rows: rows
    };
  }

  function getProfilMadrasah() {
    var saved = store.get('eujian.profilMadrasah', {});
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
    var visi = typeof saved.visi === 'string' && saved.visi.trim() ? saved.visi.trim() : PROFIL_DEFAULTS.visi;
    var sejarah = typeof saved.sejarah === 'string' && saved.sejarah.trim() ? saved.sejarah.trim() : PROFIL_DEFAULTS.sejarah;
    var misi = Array.isArray(saved.misi) ? saved.misi.map(function (item) {
      return String(item || '').trim();
    }).filter(Boolean) : [];
    if (!misi.length) misi = PROFIL_DEFAULTS.misi.slice();
    return {
      visi: visi,
      misi: misi,
      sejarah: sejarah,
      org: normalizeOrg(saved.org) || PROFIL_DEFAULTS.org
    };
  }

  function saveProfilMadrasah(patch) {
    var data = getProfilMadrasah();
    Object.keys(patch).forEach(function (key) { data[key] = patch[key]; });
    store.set('eujian.profilMadrasah', data);
  }

  function renderProfilMadrasah() {
    var p = getProfilMadrasah();
    var visiEl = document.getElementById('visiText');
    if (visiEl) visiEl.textContent = '"' + p.visi + '"';
    var misiEl = document.getElementById('misiList');
    if (misiEl) {
      misiEl.innerHTML = p.misi.map(function (item, i) {
        return '<li><span class="misi-num">' + (i + 1) + '</span><span>' + esc(item) + '</span></li>';
      }).join('');
    }
    var orgEl = document.getElementById('orgWrap');
    if (orgEl) {
      orgEl.innerHTML = '<div class="org-box lead">' + esc(p.org.lead.title) +
          (p.org.lead.name ? '<small>' + esc(p.org.lead.name) + '</small>' : '') + '</div>' +
        p.org.rows.map(function (row) {
          return '<div class="org-line"></div><div class="org-row">' + row.map(function (box) {
            return '<div class="org-box">' + esc(box.title) +
              (box.sub ? '<small>' + esc(box.sub) + '</small>' : '') + '</div>';
          }).join('') + '</div>';
        }).join('');
    }
    var sejarahEl = document.getElementById('sejarahText');
    if (sejarahEl) sejarahEl.textContent = p.sejarah;
  }

  function orgToText(org) {
    return org.rows.map(function (row) {
      return row.map(function (box) {
        return box.title + (box.sub ? ' | ' + box.sub : '');
      }).join('\n');
    }).join('\n---\n');
  }

  function parseOrgText(text) {
    var rows = [];
    var current = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var value = line.trim();
      if (!value) return;
      if (/^-{3,}$/.test(value)) {
        if (current.length) rows.push(current);
        current = [];
        return;
      }
      var parts = value.split('|');
      var title = String(parts.shift() || '').trim();
      if (!title) return;
      current.push({ title: title, sub: parts.join('|').trim() });
    });
    if (current.length) rows.push(current);
    return rows;
  }

  function openVisiEditor() {
    var p = getProfilMadrasah();
    openModal({
      title: 'Edit Visi & Misi',
      subtitle: 'Perubahan langsung tampil di halaman Profil Madrasah.',
      size: 'lg',
      body: '<form id="profilVisiForm">' +
          '<div class="field"><label>Visi Madrasah</label>' +
            '<textarea class="input" name="visi" rows="3" required>' + esc(p.visi) + '</textarea></div>' +
          '<div class="field"><label>Misi Madrasah</label>' +
            '<textarea class="input" name="misi" rows="7" required>' + esc(p.misi.join('\n')) + '</textarea>' +
            '<p class="hint">Satu baris = satu poin misi.</p></div>' +
          '<div class="settings-actions"><button type="button" class="btn outline" data-close>Batal</button>' +
            '<button type="submit" class="btn">' + icon('save') + 'Simpan</button></div>' +
        '</form>'
    });
    var form = document.getElementById('profilVisiForm');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var fd = new FormData(form);
      var visi = String(fd.get('visi') || '').trim();
      var misi = String(fd.get('misi') || '').split(/\r?\n/).map(function (line) {
        return line.trim();
      }).filter(Boolean);
      if (!visi) { toast('Visi madrasah wajib diisi.', 'danger'); return; }
      if (!misi.length) { toast('Isi minimal satu poin misi.', 'danger'); return; }
      saveProfilMadrasah({ visi: visi, misi: misi });
      closeModal();
      renderProfilMadrasah();
      toast('Visi & misi berhasil diperbarui.');
    });
  }

  function openSejarahEditor() {
    var p = getProfilMadrasah();
    openModal({
      title: 'Edit Sejarah Singkat',
      subtitle: 'Ceritakan perjalanan singkat madrasah.',
      size: 'lg',
      body: '<form id="profilSejarahForm">' +
          '<div class="field"><label>Teks Sejarah</label>' +
            '<textarea class="input" name="sejarah" rows="8" required>' + esc(p.sejarah) + '</textarea></div>' +
          '<div class="settings-actions"><button type="button" class="btn outline" data-close>Batal</button>' +
            '<button type="submit" class="btn">' + icon('save') + 'Simpan</button></div>' +
        '</form>'
    });
    var form = document.getElementById('profilSejarahForm');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = String(new FormData(form).get('sejarah') || '').trim();
      if (!value) { toast('Teks sejarah wajib diisi.', 'danger'); return; }
      saveProfilMadrasah({ sejarah: value });
      closeModal();
      renderProfilMadrasah();
      toast('Sejarah madrasah berhasil diperbarui.');
    });
  }

  function openOrgEditor() {
    var p = getProfilMadrasah();
    openModal({
      title: 'Edit Struktur Organisasi',
      subtitle: 'Susun jabatan dan nama pejabat madrasah.',
      size: 'lg',
      body: '<form id="profilOrgForm">' +
          '<div class="form-grid">' +
            '<div class="field"><label>Jabatan Puncak</label>' +
              '<input class="input" name="leadTitle" value="' + esc(p.org.lead.title) + '" required></div>' +
            '<div class="field"><label>Nama Pejabat</label>' +
              '<input class="input" name="leadName" value="' + esc(p.org.lead.name) + '"></div>' +
          '</div>' +
          '<div class="field"><label>Kotak Jabatan</label>' +
            '<textarea class="input" name="rows" rows="9" required>' + esc(orgToText(p.org)) + '</textarea>' +
            '<p class="hint">Satu baris = satu kotak, format <b>Jabatan | Keterangan</b>. Tulis <b>---</b> pada baris sendiri untuk memisahkan baris struktur.</p></div>' +
          '<div class="settings-actions"><button type="button" class="btn outline" data-close>Batal</button>' +
            '<button type="submit" class="btn">' + icon('save') + 'Simpan</button></div>' +
        '</form>'
    });
    var form = document.getElementById('profilOrgForm');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var fd = new FormData(form);
      var leadTitle = String(fd.get('leadTitle') || '').trim();
      var leadName = String(fd.get('leadName') || '').trim();
      var rows = parseOrgText(fd.get('rows'));
      if (!leadTitle) { toast('Jabatan puncak wajib diisi.', 'danger'); return; }
      if (!rows.length) { toast('Isi minimal satu kotak jabatan.', 'danger'); return; }
      saveProfilMadrasah({ org: { lead: { title: leadTitle, name: leadName }, rows: rows } });
      closeModal();
      renderProfilMadrasah();
      toast('Struktur organisasi berhasil diperbarui.');
    });
  }

  function initProfile() {
    renderProfilMadrasah();
    var session = getSession();
    if (!session || session.role !== 'admin') return;
    [['editVisiBtn', openVisiEditor], ['editSejarahBtn', openSejarahEditor], ['editOrgBtn', openOrgEditor]].forEach(function (pair) {
      var btn = document.getElementById(pair[0]);
      if (!btn) return;
      btn.style.display = '';
      btn.addEventListener('click', pair[1]);
    });
  }

  function initPortal() {
    var urlEl = document.getElementById('studentLoginUrl');
    var btn = document.getElementById('copyStudentLogin');
    if (!urlEl || !btn) return;
    var link = location.href.replace(/[^/\\]*$/, '') + 'login-siswa.html';
    urlEl.textContent = link;
    btn.addEventListener('click', function () {
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = link;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        toast(ok ? 'Tautan login siswa disalin.' : 'Tautan: ' + link, ok ? undefined : 'danger');
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(link).then(function () {
          toast('Tautan login siswa disalin.');
        }).catch(fallback);
      } else {
        fallback();
      }
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    hydrateIcons();
    var page = document.body.getAttribute('data-page');
    var layout = document.body.getAttribute('data-layout');

    if (layout !== 'blank') initChrome();
    bindGlobalEvents();

    if (page === 'portal') { initPortal(); return; }
    if (page === 'login') { initLogin(); return; }
    if (layout !== 'blank' && guardPage(page, getSession())) return;

    var pages = {
      home: initHome,
      'beranda-siswa': initStudentHome,
      profil: initProfile,
      'data-siswa': initStudents,
      'data-guru': initTeachers,
      jadwal: initSchedule,
      absensi: initAbsensi,
      'bank-soal': initBankSoal,
      import: initImport,
      ujian: initExam,
      sinkron: initSync,
      akun: initStudentAccount,
      'akun-staf': initStaffAccount,
      hasil: initResults,
      laporan: initReport,
      pengaturan: initSettings
    };
    if (pages[page]) pages[page]();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
