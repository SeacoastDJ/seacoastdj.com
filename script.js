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