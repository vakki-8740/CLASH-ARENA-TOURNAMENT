// =========================================
// ADMIN PANEL - Firebase
// ⚠️ Replace firebaseConfig with your project credentials
// =========================================

const firebaseConfig = {
  apiKey: "AIzaSyB14Jlab6DyLOQDwGA7y8-Fqh6cMimK1os",
  authDomain: "site-a9ac1.firebaseapp.com",
  projectId: "site-a9ac1",
  storageBucket: "site-a9ac1.firebasestorage.app",
  messagingSenderId: "501216847535",
  appId: "1:501216847535:web:e633f15d3b4f225e45965a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const settingsRef = db.collection('settings');

// =========================================
// FIREBASE HELPERS
// =========================================
async function getSetting(key) {
  const snap = await settingsRef.doc(key).get();
  return snap.exists ? snap.data().value : null;
}
async function setSetting(key, value) {
  await settingsRef.doc(key).set({ value: String(value) });
}
async function getAllSettings() {
  const snap = await settingsRef.get();
  const s = {};
  snap.forEach(doc => { s[doc.id] = doc.data().value; });
  return s;
}
async function getCollection(col) {
  const snap = await db.collection(col).orderBy('order', 'asc').get();
  return snap.docs.map((d, i) => ({ id: d.id, order: i, ...d.data() }));
}
async function addDoc(col, data) {
  const snap = await db.collection(col).get();
  data.order = snap.size;
  return db.collection(col).add(data);
}
async function delDoc(col, id) {
  return db.collection(col).doc(id).delete();
}

function closeAdminPanel() {
  document.getElementById('admin-panel').classList.remove('show');
}

function switchAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  const section = document.getElementById('admin-' + tab + '-section');
  if (section) section.classList.add('active');
}

// =========================================
// CONTENT
// =========================================
async function loadAdminContent() {
  try {
    const s = await getAllSettings();
    const fields = ['appName','appLogo','tagline','appUrl','heroBadge','heroHeading','heroSubtext','featuresHeading','featuresSub','howHeading','howSub','testHeading','testSub','ctaHeading','ctaSub','footerDesc','footerCopy'];
    fields.forEach(f => {
      const el = document.getElementById('ac-' + f);
      if (el && s[f]) el.value = s[f];
    });
    ['telegram','instagram','youtube','email'].forEach(f => {
      const el = document.getElementById('ac-' + f);
      if (el && s[f]) el.value = s[f];
    });
  } catch (e) { console.warn('Admin content load failed', e); }
}

async function saveSiteContent() {
  const fields = ['appName','appLogo','tagline','appUrl','heroBadge','heroHeading','heroSubtext','featuresHeading','featuresSub','howHeading','howSub','testHeading','testSub','ctaHeading','ctaSub','footerDesc','footerCopy'];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById('ac-' + f);
    if (el && el.value.trim()) data[f] = el.value.trim();
  });
  try {
    for (const [key, value] of Object.entries(data)) await setSetting(key, value);
    showAdminToast('Content saved successfully!');
  } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
}

async function saveSiteSocial() {
  const fields = ['telegram','instagram','youtube','email'];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById('ac-' + f);
    if (el && el.value.trim()) data[f] = el.value.trim();
  });
  try {
    for (const [key, value] of Object.entries(data)) await setSetting(key, value);
    showAdminToast('Social links saved!');
  } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
}

async function saveAdminSettings() {
  const passEl = document.getElementById('ac-adminPass');
  if (passEl && passEl.value.trim()) {
    try {
      await setSetting('adminPass', passEl.value.trim());
      showAdminToast('Admin password updated!');
    } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
  }
}

// =========================================
// TESTIMONIALS
// =========================================
async function loadAdminTestimonials() {
  try {
    const items = await getCollection('site_testimonials');
    const container = document.getElementById('testimonials-admin-list');
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No testimonials added yet.</div>';
      return;
    }
    container.innerHTML = items.map(t => `
      <div class="admin-list-item">
        <div class="ali-info">
          <strong>${t.name || 'Unknown'}</strong>
          <span>${t.role || ''} — "${(t.quote || '').substring(0, 60)}${(t.quote || '').length > 60 ? '...' : ''}"</span>
        </div>
        <button class="ali-del" onclick="deleteTestimonial('${t.id}')"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
  } catch (e) { console.warn('Testimonials admin load failed', e); }
}

async function addTestimonial() {
  const name = document.getElementById('atm-name').value.trim();
  const role = document.getElementById('atm-role').value.trim();
  const icon = document.getElementById('atm-icon').value;
  const quote = document.getElementById('atm-quote').value.trim();
  if (!name || !quote) { showAdminToast('Name and Quote required!', 'error'); return; }
  try {
    await addDoc('site_testimonials', { name, role, icon, quote });
    document.getElementById('atm-name').value = '';
    document.getElementById('atm-role').value = '';
    document.getElementById('atm-quote').value = '';
    showAdminToast('Testimonial added!');
    await loadAdminTestimonials();
  } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await delDoc('site_testimonials', id);
    showAdminToast('Testimonial deleted');
    await loadAdminTestimonials();
  } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
}

// =========================================
// FEATURES
// =========================================
async function loadAdminFeatures() {
  try {
    const items = await getCollection('site_features');
    const container = document.getElementById('features-admin-list');
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No features added yet.</div>';
      return;
    }
    container.innerHTML = items.map(f => `
      <div class="admin-list-item">
        <div class="ali-info">
          <strong><i class="fas fa-${f.icon || 'trophy'}"></i> ${f.title || ''}</strong>
          <span>${(f.desc || '').substring(0, 60)}${(f.desc || '').length > 60 ? '...' : ''}</span>
        </div>
        <button class="ali-del" onclick="deleteFeature('${f.id}')"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
  } catch (e) { console.warn('Features admin load failed', e); }
}

async function addFeature() {
  const icon = document.getElementById('afe-icon').value;
  const title = document.getElementById('afe-title').value.trim();
  const desc = document.getElementById('afe-desc').value.trim();
  if (!title || !desc) { showAdminToast('Title and Description required!', 'error'); return; }
  try {
    await addDoc('site_features', { icon, title, desc });
    document.getElementById('afe-title').value = '';
    document.getElementById('afe-desc').value = '';
    showAdminToast('Feature added!');
    await loadAdminFeatures();
  } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
}

async function deleteFeature(id) {
  if (!confirm('Delete this feature?')) return;
  try {
    await delDoc('site_features', id);
    showAdminToast('Feature deleted');
    await loadAdminFeatures();
  } catch (e) { showAdminToast('Failed: ' + e.message, 'error'); }
}

// =========================================
// STATS REFRESH
// =========================================
async function refreshSiteStats() {
  showAdminToast('Refresh the public site page to see updated stats');
}

// =========================================
// TOAST
// =========================================
function showAdminToast(msg, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;z-index:999999;color:white;background:' + (type === 'error' ? '#ff3b30' : '#34c759') + ';box-shadow:0 8px 30px rgba(0,0,0,0.2);animation:fadeInUp 0.3s ease;';
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2500);
}

// =========================================
// INIT
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  loadAdminContent();
  loadAdminTestimonials();
  loadAdminFeatures();
});
