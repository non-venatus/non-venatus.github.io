/**
 * NON-VENATUS WEBSITE — CONFIGURATION
 * ──────────────────────────────────────────────────────────────
 * Fill in the values below before deploying.
 *
 * SUPABASE SETUP (5-minute process):
 *   1. Create a free account at https://supabase.com
 *   2. Create a new project
 *   3. Go to SQL Editor and run the SQL in README.md
 *   4. Go to Settings → API → copy the values below
 *
 * FORMSUBMIT (for email notifications):
 *   No setup needed — just confirm your email the first time
 *   a comment is submitted (FormSubmit sends a confirmation link).
 * ──────────────────────────────────────────────────────────────
 */

const CONFIG = {

  // ── Supabase ──────────────────────────────────────────────────
  // Get these from: Supabase → Settings → API
  supabase: {
    url:            'https://rwmobytwkobejjlibatn.supabase.co/rest/v1/',      // e.g. https://xxxx.supabase.co
    anonKey:        'sb_publishable_83ZPlmqlXCkHiJ-fYquQDQ_FOazw7oc',          // Safe to expose (RLS protects data)
    serviceRoleKey: 'sb_secret_ViQJLNATiCCSh3FtEk8zdw_beGQVHW2'  // Admin only — keep secret!
  },

  // ── Admin password ────────────────────────────────────────────
  // Change this before deploying! Use a strong password.
  // Note: for higher security, use Supabase Auth instead.
  admin: {
    password: 'nonvenatus2026'  // ← CHANGE THIS
  },

  // ── Email notification ────────────────────────────────────────
  // FormSubmit sends an email to this address when a new comment is submitted.
  // First submission triggers a confirmation email from FormSubmit.
  notificationEmail: 'readactsessions@gmail.com',

  // ── Site settings ─────────────────────────────────────────────
  site: {
    title: 'Non-Venatus',
    contactEmail: 'readactsessions@gmail.com'
  }

};

// Detect if Supabase is configured
CONFIG._supabaseConfigured = (
  CONFIG.supabase.url !== 'YOUR_SUPABASE_PROJECT_URL' &&
  CONFIG.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
);
