// =========================================
// QBIT SPORTS - Site Script
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

// =========================================
// LOAD SITE CONTENT
// =========================================
async function loadSiteContent() {
  try {
    const s = await getAllSettings();
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) { if (id.includes('heading') || id.includes('copy')) el.innerHTML = val; else el.textContent = val; } };
    if (s.appName) {
      document.title = s.appName;
      document.getElementById('nav-brand-name').textContent = s.appName;
      document.getElementById('site-desc').content = s.appName + ' - The ultimate gaming tournament platform.';
      document.getElementById('phone-app-name').textContent = s.appName;
      document.getElementById('footer-brand-name').textContent = s.appName;
    }
    if (s.appLogo) {
      ['nav-logo-icon', 'phone-logo-icon', 'footer-logo-icon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      ['nav-logo-img', 'phone-logo-img', 'footer-logo-img'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.src = s.appLogo; el.style.display = ''; }
      });
    }
    if (s.tagline) document.getElementById('phone-tagline').textContent = s.tagline;
    if (s.heroBadge) document.getElementById('hero-badge-text').textContent = s.heroBadge;
    if (s.heroHeading) document.getElementById('hero-heading').innerHTML = s.heroHeading;
    if (s.heroSubtext) document.getElementById('hero-subtext').textContent = s.heroSubtext;
    if (s.featuresHeading) document.getElementById('features-heading').textContent = s.featuresHeading;
    if (s.featuresSub) document.getElementById('features-sub').textContent = s.featuresSub;
    if (s.howHeading) document.getElementById('how-heading').textContent = s.howHeading;
    if (s.howSub) document.getElementById('how-sub').textContent = s.howSub;
    if (s.testHeading) document.getElementById('testimonials-heading').textContent = s.testHeading;
    if (s.testSub) document.getElementById('testimonials-sub').textContent = s.testSub;
    if (s.ctaHeading) document.getElementById('cta-heading').innerHTML = s.ctaHeading;
    if (s.ctaSub) document.getElementById('cta-sub').textContent = s.ctaSub;
    if (s.footerCopy) document.getElementById('footer-copyright').innerHTML = s.footerCopy;
    if (s.footerDesc) document.getElementById('footer-desc').textContent = s.footerDesc;
    if (s.appUrl) {
      document.querySelectorAll('.nav-cta, #hero-cta-primary, #cta-btn, .footer-col a[href="/user/"]').forEach(el => el.href = s.appUrl);
    }
    const linkMap = {
      telegram: ['#social-telegram', '#footer-telegram'],
      instagram: ['#social-instagram'],
      youtube: ['#social-youtube'],
      email: ['#footer-email']
    };
    Object.entries(linkMap).forEach(([key, selectors]) => {
      if (s[key]) {
        selectors.forEach(sel => {
          const el = document.querySelector(sel);
          if (el) el.href = key === 'email' ? 'mailto:' + s[key] : s[key];
        });
      }
    });
  } catch (e) { console.warn('Content load failed'); }
}

// =========================================
// LOAD TESTIMONIALS
// =========================================
async function loadTestimonials() {
  try {
    const items = await getCollection('site_testimonials');
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;
    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;opacity:0.7;">No testimonials yet. Add from Admin Panel.</div>';
      return;
    }
    const iconMap = { star: 'fa-star', trophy: 'fa-trophy', gamepad: 'fa-gamepad', bolt: 'fa-bolt' };
    grid.innerHTML = items.map(t => `
      <div class="testimonial-card">
        <p><i class="fas fa-quote-left" style="opacity:0.3;font-size:20px;"></i> ${t.quote || ''}</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar" style="background:rgba(255,255,255,0.2);"><i class="fas fa-user"></i></div>
          <div>
            <div class="testimonial-name">${t.name || 'Player'}</div>
            <div class="testimonial-role"><i class="fas ${iconMap[t.icon] || 'fa-star'}" style="color:#FFD700;"></i> ${t.role || ''}</div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) { console.warn('Testimonials load failed'); }
}

// =========================================
// LOAD FEATURES
// =========================================
async function loadFeatures() {
  try {
    const items = await getCollection('site_features');
    const grid = document.getElementById('features-grid');
    if (!grid) return;
    const colorMap = { trophy: 'rgba(0,122,255,0.1)', bolt: 'rgba(52,199,89,0.1)', 'shield-alt': 'rgba(255,149,0,0.1)', 'mobile-alt': 'rgba(255,59,48,0.1)', headset: 'rgba(0,122,255,0.1)', users: 'rgba(52,199,89,0.1)' };
    const colorTextMap = { trophy: 'var(--primary)', bolt: 'var(--success)', 'shield-alt': 'var(--warning)', 'mobile-alt': 'var(--danger)', headset: 'var(--primary)', users: 'var(--success)' };
    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-muted);">No features yet. Add from Admin Panel.</div>';
      return;
    }
    grid.innerHTML = items.map(f => `
      <div class="feature-card">
        <div class="feature-icon" style="background:${colorMap[f.icon] || 'rgba(0,122,255,0.1)'};color:${colorTextMap[f.icon] || 'var(--primary)'};"><i class="fas fa-${f.icon || 'trophy'}"></i></div>
        <h3>${f.title || ''}</h3>
        <p>${f.desc || ''}</p>
      </div>
    `).join('');
  } catch (e) { console.warn('Features load failed'); }
}

// =========================================
// LOAD HOW-IT-WORKS STEPS
// =========================================
async function loadSteps() {
  try {
    const defaultSteps = [
      { icon: 'user-plus', title: 'Sign Up', desc: 'Create your account using Google or phone number in just 30 seconds.' },
      { icon: 'gamepad', title: 'Join Tournament', desc: 'Browse available tournaments and join with a small entry fee.' },
      { icon: 'rupee-sign', title: 'Win & Withdraw', desc: 'Win matches, earn prizes, and withdraw money instantly.' }
    ];
    const items = await getCollection('site_steps');
    const container = document.querySelector('.steps');
    if (!container) return;
    const data = items.length >= 3 ? items : defaultSteps;
    container.innerHTML = data.map((s, i) => `
      <div class="step">
        <div class="step-number"><i class="fas fa-${s.icon || 'circle'}"></i></div>
        <h3>${s.title || ''}</h3>
        <p>${s.desc || ''}</p>
      </div>
    `).join('');
  } catch (e) { console.warn('Steps load failed'); }
}

// =========================================
// LOAD STATS
// =========================================
async function loadSiteStats() {
  try {
    const [usersSnap, txSnap, tSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('transactions').get(),
      db.collection('tournaments').get()
    ]);
    let totalPrizes = 0;
    txSnap.forEach(d => {
      const t = d.data();
      if (t.type === 'Prize' && t.status === 'Success') totalPrizes += t.amount || 0;
    });
    let activeTourneys = 0;
    tSnap.forEach(d => { if (d.data().status !== 'completed') activeTourneys++; });
    document.getElementById('stat-users').textContent = usersSnap.size.toLocaleString() + '+';
    document.getElementById('stat-tournaments').textContent = activeTourneys + '+';
    document.getElementById('stat-prizes').textContent = '₹' + totalPrizes.toLocaleString() + '+';
  } catch (e) { console.warn('Stats load failed'); }
}

// =========================================
// MOBILE MENU
// =========================================
function toggleMobileMenu() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('nav-hamburger').classList.toggle('active');
}
window.toggleMobileMenu = toggleMobileMenu;
function closeMobileMenu() {
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('nav-hamburger').classList.remove('active');
}
window.closeMobileMenu = closeMobileMenu;

// =========================================
// NAVBAR SCROLL
// =========================================
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// =========================================
// SMOOTH SCROLL
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    closeMobileMenu();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// =========================================
// COUNTER ANIMATION
// =========================================
function animateCounter(element, target, suffix = '+') {
  let current = 0;
  const increment = Math.max(1, Math.floor(target / 50));
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    element.textContent = current.toLocaleString() + suffix;
  }, 20);
}

// =========================================
// SCROLL OBSERVER
// =========================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.feature-card, .step, .testimonial-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `all 0.5s ease ${i * 0.08}s`;
    observer.observe(el);
  });
});

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(document.getElementById('stat-users'), 5000);
      animateCounter(document.getElementById('stat-tournaments'), 200);
      animateCounter(document.getElementById('stat-prizes'), 100000, '+');
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

// =========================================
// INIT
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadSiteContent(),
    loadTestimonials(),
    loadFeatures(),
    loadSteps(),
    loadSiteStats()
  ]);
});
