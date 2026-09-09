const container = document.querySelector('.viewport-3d-container');
const vinyl = document.getElementById('vinyl-asset');
const deck = document.getElementById('deck-asset-2');
const cursorGlow = document.getElementById('cursor-glow-pad');
const modal = document.getElementById('contact-modal');
const triggerButtons = document.querySelectorAll('.booking-cta, .trigger-popup-btn');
const closeModalButton = document.getElementById('close-form');

if (container && vinyl && deck) {
  let ticking = false;

  const updateMotion = () => {
    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;

    const rotationDegree = progress * 360;
    const tiltX = -8 + progress * 16;

    vinyl.style.transform = `rotate(${rotationDegree}deg)`;
    deck.style.transform = `rotateX(${tiltX}deg)`;
    ticking = false;
  };

  container.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateMotion();
      });
      ticking = true;
    }
  }, { passive: true });

  updateMotion();
}

if (cursorGlow) {
  window.addEventListener('pointermove', (event) => {
    cursorGlow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    cursorGlow.style.background = `radial-gradient(circle at center, rgba(248, 192, 107, 0.28), transparent 28%)`;
  });
}

const heroParallax = document.querySelector('.hero-parallax');
const heroBgLayer = heroParallax?.querySelector('.layer-background');
const heroDeckLayer = heroParallax?.querySelector('.layer-dj-deck');
const heroFgLayer = heroParallax?.querySelector('.layer-fg-lasers');

const updateHeroParallax = () => {
  if (!heroParallax) return;
  const scrollTop = window.scrollY;
  const offset = Math.min(scrollTop, 300);

  if (heroBgLayer) {
    heroBgLayer.style.transform = `translateY(${offset * 0.05}px) translateZ(-420px) scale(1.78)`;
  }
  if (heroDeckLayer) {
    heroDeckLayer.style.transform = `translateY(${offset * 0.12}px) translateZ(-220px) scale(1.25)`;
  }
  if (heroFgLayer) {
    heroFgLayer.style.transform = `translateY(${offset * -0.04}px) translateZ(180px) scale(0.84)`;
  }
};

window.addEventListener('scroll', () => {
  window.requestAnimationFrame(updateHeroParallax);
});

updateHeroParallax();

window.addEventListener('pointerleave', () => {
  if (cursorGlow) {
    cursorGlow.style.opacity = '0';
  }
});

window.addEventListener('pointerenter', () => {
  if (cursorGlow) {
    cursorGlow.style.opacity = '1';
  }
});

const openModal = () => {
  modal?.classList.add('is-open');
};

const closeModal = () => {
  modal?.classList.remove('is-open');
};

triggerButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });
});

closeModalButton?.addEventListener('click', closeModal);

modal?.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// Generic modal system: any [data-modal-target="modal-id"] opens #modal-id.
document.querySelectorAll('[data-modal-target]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    const targetModal = document.getElementById(trigger.dataset.modalTarget);
    if (!targetModal) return;
    event.preventDefault();
    targetModal.classList.add('is-open');
  });
});

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.classList.remove('is-open');
  });
  overlay.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => overlay.classList.remove('is-open'));
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay.is-open').forEach((overlay) => {
    overlay.classList.remove('is-open');
  });
});

// Nav "Events" dropdown: hover on desktop (handled in CSS), tap-to-toggle on touch/mobile.
document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  toggle?.addEventListener('click', (event) => {
    event.preventDefault();
    const isOpen = dropdown.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});

document.addEventListener('click', (event) => {
  document.querySelectorAll('.nav-dropdown.is-open').forEach((dropdown) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove('is-open');
      dropdown.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    }
  });
});

// GA4 lead-funnel tracking. Runs on every page that loads gtag.js + script.js.
(function trackLeadFunnel() {
  if (typeof window.gtag !== 'function') return;

  const pageCategory = document.body.dataset.eventCategory;
  if (pageCategory) {
    window.gtag('event', 'category_page_view', { event_category: pageCategory });
  }

  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.addEventListener('click', () => {
      window.gtag('event', 'cta_click', {
        cta_label: el.dataset.cta || el.textContent.trim(),
        page_path: window.location.pathname
      });
    });
  });

  document.querySelectorAll('form[data-lead-form]').forEach((form) => {
    let started = false;
    form.addEventListener('focusin', () => {
      if (started) return;
      started = true;
      window.gtag('event', 'form_start', {
        form_location: form.dataset.leadForm,
        event_category: form.dataset.eventCategory || 'general'
      });
    });
  });
})();

// Stamp the load time onto contact-handler.php's spam-timing field.
document.querySelectorAll('form input[name="form_started"]').forEach((el) => {
  el.value = Math.floor(Date.now() / 1000);
});

const heroSlider = document.querySelector('.hero-slider');

if (heroSlider) {
  const slides = Array.from(heroSlider.querySelectorAll('.hero-slide'));
  const dots = Array.from(heroSlider.querySelectorAll('.slider-dot'));
  let activeIndex = 0;
  let sliderTimer;

  const startAutoPlay = () => {
    window.clearInterval(sliderTimer);
    sliderTimer = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, 5000);
  };

  const showSlide = (index) => {
    const nextIndex = (index + slides.length) % slides.length;
    const previousIndex = activeIndex;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === nextIndex);
      slide.classList.toggle('is-leaving', slideIndex === previousIndex && slideIndex !== nextIndex);
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === nextIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-pressed', String(isActive));
    });

    activeIndex = nextIndex;
    startAutoPlay();
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    showSlide(0);
  } else {
    showSlide(0);
  }
}