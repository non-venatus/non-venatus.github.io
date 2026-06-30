/**
 * NON-VENATUS — INTERACTIONS / COMMENTS
 * Supabase-backed comments with replies, likes, and pagination.
 */

(function () {
  'use strict';

  const PAGE_SIZE = 7;
  let supabase = null;
  let allComments = [];
  let allReplies = {};   // { commentId: [reply, reply, ...] }
  let visibleCount = PAGE_SIZE;

  function initSupabase() {
    if (!CONFIG._supabaseConfigured) return null;
    try {
      return window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
      );
    } catch (e) {
      console.warn('Supabase init failed:', e);
      return null;
    }
  }

  /* ── Load comments + replies ───────────────────────────── */
  async function loadComments() {
    const container = document.getElementById('commentsContainer');
    const countEl    = document.getElementById('commentCount');

    supabase = initSupabase();

    if (!supabase) {
      container.innerHTML = `
        <div class="setup-warning">
          <strong>Comments not yet configured.</strong>
          Set up Supabase in <code>assets/js/config.js</code> to enable this feature.
          See README.md for instructions.
        </div>
        <div class="comments-empty">No comments yet — be the first to respond!</div>
      `;
      if (countEl) countEl.textContent = '';
      return;
    }

    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('id, name, affiliation, comment, created_at, likes')
        .order('created_at', { ascending: false });

      if (error) throw error;

      allComments = comments || [];

      if (countEl) {
        countEl.textContent = allComments.length
          ? `(${allComments.length} response${allComments.length !== 1 ? 's' : ''})`
          : '';
      }

      if (allComments.length === 0) {
        container.innerHTML = `<div class="comments-empty">No comments yet — be the first to respond!</div>`;
        document.getElementById('loadMoreWrap').style.display = 'none';
        return;
      }

      // Load all replies in one go
      const { data: replies } = await supabase
        .from('replies')
        .select('id, comment_id, name, reply, created_at')
        .order('created_at', { ascending: true });

      allReplies = {};
      (replies || []).forEach(r => {
        if (!allReplies[r.comment_id]) allReplies[r.comment_id] = [];
        allReplies[r.comment_id].push(r);
      });

      visibleCount = PAGE_SIZE;
      renderComments();

    } catch (err) {
      container.innerHTML = `<div class="comments-empty">Could not load comments. Please try again later.</div>`;
      console.error('Error loading comments:', err);
    }
  }

  /* ── Render visible slice of comments ──────────────────── */
  function renderComments() {
    const container    = document.getElementById('commentsContainer');
    const loadMoreWrap = document.getElementById('loadMoreWrap');
    const slice = allComments.slice(0, visibleCount);

    container.innerHTML = slice.map(c => renderComment(c)).join('');
    attachCardHandlers();

    if (visibleCount < allComments.length) {
      loadMoreWrap.style.display = 'block';
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }

  /* ── Render a single comment card ──────────────────────── */
  function renderComment(c) {
    const date = new Date(c.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const liked     = localStorage.getItem(`liked_${c.id}`) === '1';
    const likeCount = (c.likes || 0);
    const replies   = allReplies[c.id] || [];
    const replyCountLabel = replies.length
      ? `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`
      : 'Reply';

    return `
      <div class="comment-card" data-id="${c.id}">
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">${escHtml(c.name)}</span>
            ${c.affiliation ? `<span class="comment-affiliation">${escHtml(c.affiliation)}</span>` : ''}
            <span class="comment-date">${date}</span>
          </div>
          <p class="comment-text">${escHtml(c.comment)}</p>

          <div class="comment-actions">
            <button class="love-btn ${liked ? 'is-liked' : ''}" data-id="${c.id}" ${liked ? 'disabled' : ''} aria-label="Love this">
              <span class="love-icon">${liked ? '♥' : '♡'}</span>
              <span class="love-count">${likeCount}</span>
            </button>
            <button class="reply-toggle" data-id="${c.id}">${replyCountLabel}</button>
          </div>

          <div class="replies-section" id="replies_${c.id}" style="display:none;">
            <div class="replies-list" id="repliesList_${c.id}">
              ${replies.map(r => renderReply(r)).join('')}
            </div>
            <div class="reply-form">
              <input type="text" class="reply-name-input" id="replyName_${c.id}" placeholder="Your name" maxlength="80">
              <input type="text" class="reply-text-input" id="replyText_${c.id}" placeholder="Write a reply…" maxlength="500">
              <button class="btn btn-outline reply-submit" data-id="${c.id}">Reply</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderReply(r) {
    const date = new Date(r.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return `
      <div class="reply-item">
        <span class="reply-author">${escHtml(r.name)}</span>
        <span class="reply-date">${date}</span>
        <p class="reply-text">${escHtml(r.reply)}</p>
      </div>`;
  }

  /* ── Attach handlers after each render ─────────────────── */
  function attachCardHandlers() {
    // Love button
    document.querySelectorAll('.love-btn').forEach(btn => {
      btn.addEventListener('click', () => handleLove(btn));
    });

    // Reply toggle (collapsible)
    document.querySelectorAll('.reply-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const section = document.getElementById(`replies_${id}`);
        section.style.display = (section.style.display === 'none') ? 'block' : 'none';
      });
    });

    // Reply submit
    document.querySelectorAll('.reply-submit').forEach(btn => {
      btn.addEventListener('click', () => handleReplySubmit(btn.dataset.id));
    });
  }

  /* ── Love handler ───────────────────────────────────────── */
  async function handleLove(btn) {
    const id = btn.dataset.id;
    if (localStorage.getItem(`liked_${id}`) === '1') return;

    btn.disabled = true;
    btn.classList.add('is-liked');
    btn.querySelector('.love-icon').textContent = '♥';
    const countEl = btn.querySelector('.love-count');
    countEl.textContent = parseInt(countEl.textContent || '0') + 1;
    localStorage.setItem(`liked_${id}`, '1');

    try {
      await supabase.rpc('increment_likes', { row_id: parseInt(id) });
    } catch (e) {
      console.warn('Like failed to save:', e);
    }
  }

  /* ── Reply submit handler ──────────────────────────────── */
  async function handleReplySubmit(commentId) {
    const nameEl = document.getElementById(`replyName_${commentId}`);
    const textEl = document.getElementById(`replyText_${commentId}`);
    const name   = nameEl.value.trim();
    const reply  = textEl.value.trim();

    if (!name || !reply) {
      nameEl.style.borderColor = !name ? 'var(--red)' : '';
      textEl.style.borderColor = !reply ? 'var(--red)' : '';
      return;
    }

    try {
      const { data, error } = await supabase
        .from('replies')
        .insert([{ comment_id: commentId, name, reply }])
        .select();

      if (error) throw error;

      if (!allReplies[commentId]) allReplies[commentId] = [];
      allReplies[commentId].push(data[0]);

      const list = document.getElementById(`repliesList_${commentId}`);
      list.insertAdjacentHTML('beforeend', renderReply(data[0]));

      const toggle = document.querySelector(`.reply-toggle[data-id="${commentId}"]`);
      const count = allReplies[commentId].length;
      toggle.textContent = `${count} repl${count === 1 ? 'y' : 'ies'}`;

      nameEl.value = '';
      textEl.value = '';
    } catch (err) {
      console.error('Reply error:', err);
      textEl.placeholder = 'Something went wrong — please try again.';
    }
  }

  /* ── Submit comment ─────────────────────────────────────── */
  async function submitComment() {
    const nameEl  = document.getElementById('commenterName');
    const emailEl = document.getElementById('commenterEmail');
    const affEl   = document.getElementById('commenterAffiliation');
    const textEl  = document.getElementById('commentText');
    const submitBtn = document.getElementById('submitComment');

    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const aff     = affEl.value.trim();
    const comment = textEl.value.trim();

    if (!name) { showStatus('Please enter your name.', 'error'); nameEl.focus(); return; }
    if (!email || !isValidEmail(email)) { showStatus('Please enter a valid email address.', 'error'); emailEl.focus(); return; }
    if (!comment || comment.length < 10) { showStatus('Please write a comment (at least 10 characters).', 'error'); textEl.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    hideStatus();

    supabase = initSupabase();

    if (!supabase) {
      await sendEmailNotification(name, email, aff, comment);
      showStatus('Thank you! Your comment has been received.', 'success');
      clearForm(nameEl, emailEl, affEl, textEl);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{ name, email, affiliation: aff || null, comment, status: 'approved' }]);

      if (error) throw error;

      await sendEmailNotification(name, email, aff, comment);

      showStatus('Thank you! Your comment has been posted.', 'success');
      clearForm(nameEl, emailEl, affEl, textEl);

      // Reload comments so the new one appears immediately
      await loadComments();

    } catch (err) {
      console.error('Submit error:', err);
      showStatus('Something went wrong. Please try again or email us directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  }

  /* ── Email notification via FormSubmit ────────────────── */
  async function sendEmailNotification(name, email, aff, comment) {
    try {
      const formData = new FormData();
      formData.append('_subject', `New comment on Non-Venatus — from ${name}`);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('affiliation', aff || 'Not provided');
      formData.append('comment', comment);
      formData.append('_captcha', 'false');
      formData.append('_template', 'box');

      await fetch(`https://formsubmit.co/${CONFIG.notificationEmail}`, {
        method: 'POST',
        body: formData
      });
    } catch (e) {
      console.warn('Email notification failed:', e);
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function showStatus(msg, type) {
    const el = document.getElementById('formStatus');
    el.textContent = msg;
    el.className = `form-status ${type}`;
  }
  function hideStatus() {
    const el = document.getElementById('formStatus');
    el.className = 'form-status';
  }
  function clearForm(...inputs) {
    inputs.forEach(el => el.value = '');
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  /* ── Init ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    loadComments();

    const submitBtn = document.getElementById('submitComment');
    if (submitBtn) submitBtn.addEventListener('click', submitComment);

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        visibleCount += PAGE_SIZE;
        renderComments();
      });
    }

    ['commenterName', 'commenterEmail', 'commenterAffiliation'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const fields = ['commenterName','commenterEmail','commenterAffiliation','commentText'];
            const idx = fields.indexOf(id);
            const next = document.getElementById(fields[idx + 1]);
            if (next) next.focus();
          }
        });
      }
    });
  });

})();
