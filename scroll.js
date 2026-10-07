// Native progressive enhancement: nothing is hidden before observation.
// Motion principles adapted to this static site; no React dependency is needed.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const progress = document.querySelector('.reading-progress');
const targets = document.querySelectorAll('.section-heading, .about-title, .timeline > div, .play-section > div:first-child');
const tokens = { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)', distance: 16 };
const lowEnd = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
const animations = new Set();
let observer;
let frame = 0;
function updateProgress() {
  frame = 0;
  if (preference.matches) return;
  const distance = document.documentElement.scrollHeight - innerHeight;
  const value = distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 0;
  progress.style.transform = `scaleX(${value})`;
}
function scheduleProgress() {
  if (!preference.matches && !frame) frame = requestAnimationFrame(updateProgress);
}
function configure() {
  observer?.disconnect();
  animations.forEach(animation => animation.cancel());
  animations.clear();
  cancelAnimationFrame(frame);
  frame = 0;
  if (preference.matches) { progress.style.transform = 'scaleX(0)'; return; }
  scheduleProgress();
  if (lowEnd || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (entry.target.contains(document.activeElement)) continue;
      const animation = entry.target.animate([
        { opacity: .65, transform: `translateY(${tokens.distance}px)` },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: tokens.duration, easing: tokens.easing });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    }
  }, { threshold: .12 });
  targets.forEach(target => observer.observe(target));
}
addEventListener('scroll', scheduleProgress, { passive: true });
addEventListener('resize', scheduleProgress);
preference.addEventListener('change', configure);
// Font loading can change document height after initial paint.
document.fonts?.ready.then(scheduleProgress);
configure();

// A quiet location cue follows the reading position without moving the page.
const navigationLinks = [...document.querySelectorAll('.nav nav a')];
const navigationSections = navigationLinks.map(link => ({link, section: document.querySelector(link.hash)}));
let navigationFrame = 0;
function updateNavigation() {
  navigationFrame = 0;
  const edge = document.querySelector('.nav').getBoundingClientRect().bottom + 70;
  const active = navigationSections.filter(({section}) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= edge && rect.bottom > edge;
  }).sort((a,b) => b.section.getBoundingClientRect().top - a.section.getBoundingClientRect().top)[0];
  navigationLinks.forEach(link => {
    if (link === active?.link) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleNavigation() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}
addEventListener('scroll', scheduleNavigation, {passive: true});
addEventListener('resize', scheduleNavigation);
document.fonts?.ready.then(scheduleNavigation);
scheduleNavigation();
