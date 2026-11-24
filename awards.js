const track = document.querySelector('.awards-grid');
const cards = Array.from(track.children);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('#toggle-awards');
let playing = !reduced.matches;
let touching = false;
let cycle = 0;
let position = 0;
let last = 0;
let frame = 0;
let visible = false;
let manualUntil = 0;

// A matching second row lets the first photo follow the last without a rewind.
for (const card of cards) {
  const copy = card.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelector('a').tabIndex = -1;
  track.append(copy);
}
function measure() {
  cycle = track.children[cards.length].offsetLeft - cards[0].offsetLeft;
}
new ResizeObserver(measure).observe(track);
function tick(time) {
  frame = 0;
  if (!playing || !visible || document.hidden) return;
  if (!touching && !track.matches(':focus-within') && time >= manualUntil && cycle) {
    if (Math.abs(position - track.scrollLeft) > 1) position = track.scrollLeft;
    position = (position + Math.min(time - last, 50) * .032) % cycle;
    track.scrollLeft = position;
  }
  last = time;
  frame = requestAnimationFrame(tick);
}
function sync() {
  cancelAnimationFrame(frame);
  last = performance.now();
  toggle.textContent = playing ? 'Pause' : 'Play';
  toggle.setAttribute('aria-label', toggle.textContent + ' automatic scrolling');
  if (playing && visible && !document.hidden) frame = requestAnimationFrame(tick);
}
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  sync();
}).observe(track);
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', () => { playing = !reduced.matches; sync(); });
toggle.onclick = () => { playing = !playing; sync(); };
track.addEventListener('pointerdown', () => { touching = true; });
function release() { touching = false; }
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
track.addEventListener('wheel', () => { manualUntil = performance.now() + 1200; }, { passive: true });
function step(direction) {
  measure();
  const width = cards[1].offsetLeft - cards[0].offsetLeft;
  const start = track.scrollLeft % cycle;
  track.scrollLeft = direction < 0 && start < width ? start + cycle : start;
  track.scrollBy({ left: direction * width, behavior: reduced.matches ? 'instant' : 'smooth' });
  manualUntil = performance.now() + 1500;
}
document.querySelector('#previous-award').onclick = () => step(-1);
document.querySelector('#next-award').onclick = () => step(1);
document.querySelector('.award-controls').hidden = false;
measure();
sync();
