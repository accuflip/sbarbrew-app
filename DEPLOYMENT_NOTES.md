# SBAR Brew Flashcard App - Deployment Setup

## Status
Local git repository initialized and ready for deployment.

## What's Configured

### Local Git Repository
- **Location**: `/sessions/kind-fervent-knuth/sbarbrew-deploy/`
- **Branch**: main
- **Commit**: fa4d0a2 - Initial commit with all app files
- **Files included**:
  - dashboard.html
  - index.html
  - login.html
  - study.html
  - terms.html
  - js/auth.js
  - js/cards.js
  - js/subjects.js
  - js/supabase-client.js

### Remote Configuration
- **Repository**: git@github.com:duracraftboat/sbarbrew-app.git
- **Status**: Configured but not yet pushed (network connectivity issue in current environment)

### Important Notes
1. **Supabase Credentials**: Currently using placeholder values in `js/supabase-client.js`:
   - SUPABASE_URL = 'YOUR_PROJECT_URL_HERE'
   - SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'
   - These should be updated with actual Supabase project credentials before final deployment

2. **Next Steps for GitHub Push**:
   - The repository needs to be pushed from an environment with GitHub access
   - Command to push: `cd /sessions/kind-fervent-knuth/sbarbrew-deploy && git push -u origin main`
   - The remote `sbarbrew-app` repo should be created on GitHub (make it public)

3. **Vercel Deployment**:
   - Once pushed to GitHub, connect the repository to Vercel
   - No build step needed - this is a static site (HTML/JS)
   - Set environment variables in Vercel if using the Supabase credentials

## Files Structure
```
sbarbrew-deploy/
âââ .git/                    (git repository)
âââ index.html              (flashcard study page)
âââ dashboard.html          (user dashboard)
âââ login.html              (authentication page)
âââ study.html              (study interface)
âââ terms.html              (terms of service)
âââ js/
    âââ supabase-client.js  (Supabase initialization)
    âââ auth.js             (authentication logic)
    âââ cards.js            (flashcard operations)
    âââ subjects.js         (subject management)
```
