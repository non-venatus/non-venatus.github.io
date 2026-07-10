/**
 * NON-VENATUS — ENGAGEMENTS PAGE
 * Event card popup modal
 */

(function () {
  'use strict';

  const modal    = document.getElementById('eventModal');
  const closeBtn = document.getElementById('closeEventModal');
  const modalBox = document.getElementById('eventModalBox');

  if (!modal) return;

  function openEventModal(id) {
    if (typeof EVENTS_DATA === 'undefined') return;
    const ev = EVENTS_DATA.find(e => e.id === id);
    if (!ev) return;

    const cardImg = document.querySelector(`.event-card[data-event="${id}"] .event-card__img img`);
    const modalImg = document.getElementById('eventModalImg');
    if (cardImg && cardImg.naturalWidth > 0) {
      modalImg.src   = cardImg.src;
      modalImg.alt   = ev.title;
      modalImg.style.display = '';
    } else {
      modalImg.style.display = 'none';
    }
    document.getElementById('eventModalTags').innerHTML =
      (ev.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    document.getElementById('eventModalTitle').textContent = ev.title;
    document.getElementById('eventModalMeta').innerHTML =
      `<span>${ev.date}</span><span>${ev.venue}</span>`;
    document.getElementById('eventModalText').textContent = ev.text;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeEventModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => openEventModal(card.dataset.event));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openEventModal(card.dataset.event);
    });
  });

  closeBtn.addEventListener('click', closeEventModal);
  modal.addEventListener('click', e => {
    if (!modalBox.contains(e.target)) closeEventModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeEventModal();
  });

})();
