/**
 * BKC 2026 – Bible Superheroes: Interactive Web Application
 * Single Page Application Router, Navigation Drawer, Share Handler & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Views
  const views = {
    home: document.getElementById('view-home'),
    david: document.getElementById('view-david'),
    esther: document.getElementById('view-esther'),
    moses: document.getElementById('view-moses'),
    daniel: document.getElementById('view-daniel'),
    noah: document.getElementById('view-noah'),
    ruth: document.getElementById('view-ruth'),
  };

  const navBrand = document.getElementById('navBrand');
  const btnMenuToggle = document.getElementById('btnMenuToggle');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const menuDrawer = document.getElementById('menuDrawer');
  const menuBackdrop = document.getElementById('menuBackdrop');
  
  // Share elements
  const btnHeaderShare = document.getElementById('btnHeaderShare');
  const shareModalBackdrop = document.getElementById('shareModalBackdrop');
  const btnCloseShare = document.getElementById('btnCloseShare');
  const btnCopyLink = document.getElementById('btnCopyLink');
  const shareLinkInput = document.getElementById('shareLinkInput');
  const toastFeedback = document.getElementById('toastFeedback');

  let currentHero = 'home';

  // --- Audio Synthesis for Kid-Friendly Chimes (Web Audio API) ---
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playChime(freq = 520, type = 'sine', duration = 0.15) {
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playHeroFanfare() {
    playChime(440, 'triangle', 0.1);
    setTimeout(() => playChime(554.37, 'triangle', 0.12), 100);
    setTimeout(() => playChime(659.25, 'triangle', 0.25), 220);
  }

  // --- Router / View Switcher ---
  function showView(viewId, pushHistory = true) {
    const target = views[viewId] ? viewId : 'home';
    currentHero = target;

    // Update body theme attribute
    document.body.setAttribute('data-hero', target);

    // Switch view visibility
    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === target) {
          views[key].classList.add('active');
        } else {
          views[key].classList.remove('active');
        }
      }
    });

    // Update URL hash
    if (pushHistory) {
      window.location.hash = target === 'home' ? '' : target;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sound feedback
    if (target !== 'home') {
      playHeroFanfare();
    } else {
      playChime(480, 'sine', 0.12);
    }

    // Close menu drawer if open
    closeMenu();
  }

  // Parse Hash on Load & HashChange
  function handleHash() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (views[hash]) {
      showView(hash, false);
    } else {
      showView('home', false);
    }
  }

  window.addEventListener('hashchange', handleHash);

  // --- Navigation Event Listeners ---
  navBrand.addEventListener('click', (e) => {
    e.preventDefault();
    showView('home');
  });

  // Hero Card clicks on Home page
  document.querySelectorAll('[data-hero-target]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-hero-target');
      showView(target);
    });
  });

  // Back to Home buttons
  document.querySelectorAll('.btn-back-home').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showView('home');
    });
  });

  // --- Drawer Menu Handlers ---
  function openMenu() {
    menuDrawer.classList.add('open');
    menuBackdrop.classList.add('open');
    playChime(600, 'sine', 0.1);
  }

  function closeMenu() {
    menuDrawer.classList.remove('open');
    menuBackdrop.classList.remove('open');
  }

  btnMenuToggle.addEventListener('click', openMenu);
  btnCloseDrawer.addEventListener('click', closeMenu);
  menuBackdrop.addEventListener('click', closeMenu);

  // Drawer Hero Links
  document.querySelectorAll('#menuDrawer .drawer-nav-item a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href').replace('#', '');
      showView(href);
    });
  });

  // --- Share Sheet & Custom Modal ---
  function getShareData() {
    const heroTitles = {
      david: 'David – The Giant Slayer (Courage)',
      esther: 'Esther – The Brave Queen (Bravery)',
      moses: 'Moses – The Freedom Leader (Leadership)',
      daniel: 'Daniel – The Lion Den Hero (Faith)',
      noah: 'Noah – The Ark Builder (Obedience)',
      ruth: 'Ruth – The Loyal Hero (Loyalty)'
    };

    const title = currentHero !== 'home' && heroTitles[currentHero]
      ? `BKC 2026: ${heroTitles[currentHero]}`
      : 'BKC 2026 – Bible Superheroes';

    const url = window.location.href;
    return {
      title: title,
      text: `Discover Bible Superheroes with BKC 2026! Real people, real stories, amazing lessons from God.`,
      url: url
    };
  }

  function showToast(message) {
    if (!toastFeedback) return;
    toastFeedback.textContent = message;
    toastFeedback.classList.add('show');
    setTimeout(() => {
      toastFeedback.classList.remove('show');
    }, 2400);
  }

  function openShareModal() {
    const data = getShareData();
    if (shareLinkInput) {
      shareLinkInput.value = data.url;
    }
    shareModalBackdrop.classList.add('open');
    playChime(640, 'sine', 0.1);
  }

  function closeShareModal() {
    shareModalBackdrop.classList.remove('open');
  }

  btnHeaderShare.addEventListener('click', openShareModal);
  if (btnCloseShare) btnCloseShare.addEventListener('click', closeShareModal);
  if (shareModalBackdrop) {
    shareModalBackdrop.addEventListener('click', (e) => {
      if (e.target === shareModalBackdrop) closeShareModal();
    });
  }

  // Hero Footer Share buttons
  document.querySelectorAll('.btn-hero-share').forEach(btn => {
    btn.addEventListener('click', openShareModal);
  });

  // Copy Link Button
  if (btnCopyLink && shareLinkInput) {
    btnCopyLink.addEventListener('click', () => {
      shareLinkInput.select();
      shareLinkInput.setSelectionRange(0, 99999);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
          showToast('Link copied to clipboard! ✨');
          playChime(700, 'triangle', 0.15);
          setTimeout(closeShareModal, 600);
        }).catch(() => {
          document.execCommand('copy');
          showToast('Link copied! ✨');
        });
      } else {
        document.execCommand('copy');
        showToast('Link copied! ✨');
      }
    });
  }

  // Social Share Buttons in Modal
  document.querySelectorAll('.share-opt-btn[data-platform]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.getAttribute('data-platform');
      const data = getShareData();
      let shareUrl = '';

      if (platform === 'whatsapp') {
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(data.text + ' ' + data.url)}`;
      } else if (platform === 'facebook') {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
      } else if (platform === 'twitter') {
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        closeShareModal();
      }
    });
  });

  // --- Interactive Hero Mission Action Pills (Kid Interactions) ---
  document.querySelectorAll('.action-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playChime(660, 'sine', 0.12);
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
      showToast('You can be a hero today! 🌟');
    });
  });

  // Initialize initial route
  handleHash();
});
