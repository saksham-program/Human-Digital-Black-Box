/*
  Echo Trace – Human Black Box (Demo)
  ---------------------------------
  IMPORTANT: UI/UX is preserved by not touching the HTML/CSS layout.
  This script only adds functionality: auth, API calls, timeline, charts,
  settings CRUD, SOS simulation, and report generation.

  The HTML already contains an inline script with baseline UI functions.
  We intentionally keep this file minimal and “augment” behavior where possible.

  NOTE: Because the provided UI file includes many inline handlers
  (onclick="login()", etc.), the most reliable way to keep UI identical is:
  - expose functions on window (global scope)
  - call backend via fetch
*/

// --- small DOM helpers ---
function $(id) { return document.getElementById(id); }

function safeText(el, value) {
  if (!el) return;
  el.textContent = value;
}

// --- auth helpers ---
function persistUser(user) {
  localStorage.setItem('echoTraceUser', JSON.stringify(user));
}

function getPersistedUser() {
  try { return JSON.parse(localStorage.getItem('echoTraceUser') || 'null'); }
  catch { return null; }
}

function clearSession() {
  localStorage.removeItem('echoTraceUser');
  if (typeof clearToken === 'function') clearToken();
}

// --- UI binding helpers (works with existing UI) ---
function updateGreeting(name) {
  // The dashboard greeting is static text in HTML. We update it safely if present.
  // Search for "Hello," header (simple best-effort).
  const dash = $('dashboard');
  if (!dash) return;
  const h1 = dash.querySelector('.header h1');
  if (h1 && name) h1.textContent = `Hello, ${name}`;
}

function updateQuickStats(stats) {
  // Quick stats are currently hard-coded as 4 .stat-card values.
  // We update them by label matching.
  const containers = document.querySelectorAll('#dashboard .stat-card');
  containers.forEach(card => {
    const label = card.querySelector('.stat-label')?.textContent?.toLowerCase() || '';
    const valueEl = card.querySelector('.stat-value');

    if (label.includes('heart rate')) safeText(valueEl, String(stats.heartRate));
    if (label.includes('blood oxygen')) safeText(valueEl, `${stats.oxygen}%`);
    if (label.includes('stress level')) safeText(valueEl, stats.stress);
    if (label.includes('last sleep')) safeText(valueEl, `${stats.sleepHours}h`);
  });

  // Health screen live stats (also hard-coded)
  const healthCards = document.querySelectorAll('#health .stat-card');
  healthCards.forEach(card => {
    const label = card.querySelector('.stat-label')?.textContent?.toLowerCase() || '';
    const valueEl = card.querySelector('.stat-value');

    if (label.includes('heart rate')) safeText(valueEl, String(stats.heartRate));
    if (label.includes('blood oxygen')) safeText(valueEl, `${stats.oxygen}%`);
    if (label.includes('stress level')) safeText(valueEl, stats.stress);
    if (label.includes('body temperature')) safeText(valueEl, `${stats.temperatureC}C`);
  });
}

function setButtonActive(activeId, inactiveId) {
  const a = $(activeId);
  const b = $(inactiveId);
  if (a) { a.classList.add('btn-active'); a.classList.remove('btn-inactive'); }
  if (b) { b.classList.add('btn-inactive'); b.classList.remove('btn-active'); }
}

// --- timeline ---
function renderTimeline(items) {
  const container = $('timeline-content');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p style="opacity:0.7;">No activity found for this period.</p>';
    return;
  }

  container.innerHTML = items.map(it => {
    const dt = new Date(it.createdAt);
    const hh = String(dt.getHours()).padStart(2,'0');
    const mm = String(dt.getMinutes()).padStart(2,'0');
    const time = `${hh}:${mm}`;

    const icon = it.type === 'sos' ? '🚨' : (it.type === 'contact' ? '👥' : (it.type === 'privacy' ? '🔒' : '📍'));

    return `
      <div class="timeline-item">
        <div class="timeline-time">${time}</div>
        <div class="timeline-content">
          <div class="timeline-title">${icon} ${it.title}</div>
          <div class="timeline-details">${it.details}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadTimeline(filter) {
  try {
    const res = await timelineApi(filter);
    renderTimeline(res.items);
  } catch (e) {
    console.error('Timeline load failed:', e);
  }
}

// --- settings: contacts + privacy ---
async function hydrateSettings() {
  // Contacts list: Replace the static contact cards with real data (same glass style)
  const settings = $('settings');
  if (!settings) return;

  const trustedCard = settings.querySelector('.glass-card');
  if (!trustedCard) return;

  try {
    const contactsRes = await contactsApi();
    const contacts = contactsRes.contacts || [];

    // Find the "Trusted Contacts" section container (first glass-card)
    const contactContainer = trustedCard;

    // Remove all existing contact blocks except the header + description + add button.
    // We rebuild with consistent inline styles to keep the look.
    const header = contactContainer.querySelector('h3');
    const desc = contactContainer.querySelector('p');

    // Preserve existing Add button if present
    let addBtn = [...contactContainer.querySelectorAll('button')].find(b => (b.textContent || '').includes('Add New Contact'));

    // Clear everything
    contactContainer.innerHTML = '';
    contactContainer.appendChild(header);
    contactContainer.appendChild(desc);

    contacts.forEach(c => {
      const block = document.createElement('div');
      block.style.background = 'rgba(255,255,255,0.05)';
      block.style.borderRadius = '10px';
      block.style.padding = '15px';
      block.style.margin = '10px 0';

      block.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${c.name}</strong>
            <p style="font-size:14px; opacity:0.7;">${c.phone}${c.relationship ? ` • ${c.relationship}` : ''}</p>
          </div>
          <div style="display:flex; gap:10px;">
            <button data-action="edit" data-id="${c.id}" style="background:none; border:1px solid #8a2be2; color:#8a2be2; padding:5px 10px; border-radius:5px; cursor:pointer;">Edit</button>
            <button data-action="delete" data-id="${c.id}" style="background:none; border:1px solid rgba(255,71,87,0.8); color:rgba(255,71,87,0.9); padding:5px 10px; border-radius:5px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `;

      contactContainer.appendChild(block);
    });

    if (!addBtn) {
      addBtn = document.createElement('button');
      addBtn.className = 'neon-btn';
      addBtn.style.background = 'rgba(255,255,255,0.1)';
      addBtn.textContent = '+ Add New Contact';
    }
    addBtn.onclick = async () => {
      const name = prompt('Contact name (e.g., Sister):');
      if (!name) return;
      const phone = prompt('Phone number (e.g., +91 98xxxxxx):');
      if (!phone) return;
      const relationship = prompt('Relationship (optional):') || '';
      try {
        await addContactApi({ name, phone, relationship });
        await hydrateSettings();
        await loadTimeline('24h');
        window.showNotification?.('Contact added', 'Trusted contact saved successfully.');
      } catch (e) {
        alert(e.message);
      }
    };

    contactContainer.appendChild(addBtn);

    // Bind edit/delete buttons
    contactContainer.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');

        if (action === 'delete') {
          if (!confirm('Delete this trusted contact?')) return;
          try {
            await deleteContactApi(id);
            await hydrateSettings();
            await loadTimeline('24h');
          } catch (e) {
            alert(e.message);
          }
        }

        if (action === 'edit') {
          const current = contacts.find(c => c.id === id);
          if (!current) return;
          const name = prompt('Update name:', current.name);
          if (!name) return;
          const phone = prompt('Update phone:', current.phone);
          if (!phone) return;
          const relationship = prompt('Update relationship:', current.relationship || '');
          try {
            await updateContactApi(id, { name, phone, relationship });
            await hydrateSettings();
            await loadTimeline('24h');
          } catch (e) {
            alert(e.message);
          }
        }
      });
    });

    // Privacy toggles: match existing toggles by order and persist
    const privacyCard = settings.querySelectorAll('.glass-card')[1];
    if (privacyCard) {
      const privacyRes = await privacyApi();
      const p = privacyRes.privacy;

      // Helper: set checkbox value and bind
      const checkboxes = privacyCard.querySelectorAll('input.toggle-input');
      // Two toggles in "Privacy Controls"
      if (checkboxes[0]) checkboxes[0].checked = !!p.healthSharing;
      if (checkboxes[1]) checkboxes[1].checked = !!p.locationSharing;

      checkboxes.forEach((cb, idx) => {
        cb.onchange = async () => {
          const payload = {
            healthSharing: checkboxes[0]?.checked,
            locationSharing: checkboxes[1]?.checked
          };
          try {
            await updatePrivacyApi(payload);
          } catch (e) {
            console.error(e);
          }
        };
      });

      // Device permissions card is the next one (3rd glass-card)
      const deviceCard = settings.querySelectorAll('.glass-card')[2];
      if (deviceCard) {
        const devChecks = deviceCard.querySelectorAll('input.toggle-input');
        const keys = ['bluetooth', 'locationServices', 'callAccess', 'smsAccess'];
        devChecks.forEach((cb, i) => {
          const key = keys[i];
          if (!key) return;
          cb.checked = !!p[key];
          cb.onchange = async () => {
            try {
              await updatePrivacyApi({ [key]: cb.checked });
            } catch (e) {
              console.error(e);
            }
          };
        });
      }

      // Security card toggles (4th glass-card) includes blockchain toggle
      const securityCard = settings.querySelectorAll('.glass-card')[3];
      if (securityCard) {
        const cb = securityCard.querySelector('input.toggle-input');
        if (cb) {
          cb.checked = !!p.blockchainSecurity;
          cb.onchange = async () => {
            try {
              await updatePrivacyApi({ blockchainSecurity: cb.checked });
            } catch (e) {
              console.error(e);
            }
          };
        }
      }
    }

  } catch (e) {
    console.error('Settings hydration failed:', e);
  }
}

// --- exported UI functions (called by inline onclicks) ---
window.login = async function login() {
  const email = $('email')?.value || '';
  const password = $('password')?.value || '';

  try {
    const res = await loginApi({ email, password });
    setToken(res.token);
    persistUser(res.user);

    updateGreeting(res.user.name);
    await refreshDashboard();

    window.showScreen?.('dashboard');
    window.showNotification?.('Login Successful', `Welcome back, ${res.user.name}!`);
  } catch (e) {
    alert(e.message);
  }
};

window.signup = async function signup() {
  const name = $('name')?.value || '';
  const email = $('signup-email')?.value || '';
  const password = $('signup-password')?.value || '';
  const emergencyContact = $('emergency-contact')?.value || '';

  try {
    await signupApi({ name, email, password, emergencyContact });
    window.showNotification?.('Account Created', 'Now log in with your new credentials.');
    window.showScreen?.('login');
  } catch (e) {
    alert(e.message);
  }
};

window.triggerSOS = async function triggerSOS() {
  // UI says "press and hold 3 seconds". We simulate that by a short delay + visual feedback.
  if (window.emergencyActive) {
    window.showNotification?.('SOS Already Active', 'Emergency protocol is already running.');
    return;
  }

  window.showNotification?.('Hold to Confirm', 'Activating SOS in 3 seconds...');

  // mimic hold
  await new Promise(r => setTimeout(r, 3000));

  try {
    const loc = await locationsApi();
    await sosApi({ lat: loc.current.lat, lng: loc.current.lng, label: loc.current.label });

    window.emergencyActive = true;
    alert('Emergency Protocol Activated');
    window.showNotification?.('Emergency Activated', 'SOS sent and logged to your timeline.');

    await loadTimeline('24h');
  } catch (e) {
    alert(`SOS failed: ${e.message}`);
  }
};

window.filterTimeline = async function filterTimeline(filter) {
  // Button active state styling
  if (filter === '24h') setButtonActive('btn-24h', 'btn-7d');
  if (filter === '7d') setButtonActive('btn-7d', 'btn-24h');

  await loadTimeline(filter);
};

window.generateLocationReport = async function generateLocationReport() {
  try {
    const loc = await locationsApi();
    const user = getPersistedUser();

    const lines = [];
    lines.push('ECHO TRACE – LOCATION REPORT');
    lines.push('--------------------------------');
    lines.push(`Generated: ${new Date().toString()}`);
    lines.push(`User: ${user?.name || 'Unknown'}`);
    lines.push('');
    lines.push('CURRENT LOCATION');
    lines.push(`${loc.current.label}`);
    lines.push(`${loc.current.lat}, ${loc.current.lng}`);
    lines.push('');
    lines.push('RECENT LOCATIONS');
    loc.history.forEach(p => {
      lines.push(`${p.time} – ${p.label} (${p.lat}, ${p.lng})`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'echo-trace-location-report.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    window.showNotification?.('Report Generated', 'Location report downloaded successfully.');
  } catch (e) {
    alert(e.message);
  }
};

// --- dashboard refresh ---
async function refreshDashboard() {
  try {
    const dash = await dashboardApi();
    updateQuickStats(dash.stats);

    // Prepare timeline on entry
    await loadTimeline('24h');

    // Charts are rendered when screens are opened; also render once after login.
    if (window.Chart) {
      await window.renderHealthCharts?.();
      await window.renderStatsCharts?.();
    }

    // Settings
    await hydrateSettings();
  } catch (e) {
    console.error('Dashboard refresh failed (backend offline?)', e);
  }
}

// --- startup: if token exists, attempt auto-login ---
window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('echoTraceToken');
  if (!token) return;

  try {
    const res = await meApi();
    persistUser(res.user);
    updateGreeting(res.user.name);
    await refreshDashboard();
  } catch (e) {
    // token invalid or backend offline
    clearSession();
  }
});

// Expose chart renderers (used by inline screen init hooks)
window.renderHealthCharts = window.renderHealthCharts || renderHealthCharts;
window.renderStatsCharts = window.renderStatsCharts || renderStatsCharts;
