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

// Pad-press flash: briefly re-triggers the CSS animation on click, like a lit
// pad flashing when it's hit on the controller.
document.querySelectorAll('.btn, .footer-btn').forEach((el) => {
  el.addEventListener('click', () => {
    el.classList.remove('is-pressed');
    void el.offsetWidth; // restart the animation
    el.classList.add('is-pressed');
  });
  el.addEventListener('animationend', () => el.classList.remove('is-pressed'));
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
