Build a vanilla JavaScript file login.js (no framework, no build step) that powers a split-panel authentication page for a luxury body-jewelry brand called SherryBerries. The HTML it controls has two forms (#loginForm and #signupForm), a pill-style tab switcher (#authTabs with data-mode attribute and child .auth-tab buttons), animated floating-label inputs, a password visibility toggle, a strength meter, social login buttons, and a small toast notification element (#toast).

Wrap everything in an IIFE so nothing leaks to the global scope. At the top, define two helpers: $(sel, root = document) for querySelector, and $$(sel, root = document) returning [...root.querySelectorAll(sel)].

Toast system. Define a SBToast(msg) function that sets #toast text content, adds a .show class, and removes it after 2600ms via a single shared timeout (clearTimeout the previous one first).

Tab switching. Maintain a COPY object with two keys — login and signup — each containing title, sub, and foot HTML strings:

login.title: Welcome back,<br/><em>sweet berry</em>.
login.sub: Sign in to track orders, sync your wishlist, and unlock <strong>Berry List</strong> exclusives.
login.foot: New to SherryBerries? <a href="#" data-tab-go="signup">Create an account</a>
signup.title: Become a<br/><em>sweet berry</em>.
signup.sub: Join 12,400+ berries — get 10% off your first order, early drops, and free aftercare with every piece.
signup.foot: Already have an account? <a href="#" data-tab-go="login">Sign in</a>
Implement setMode(mode) that sets tabs.dataset.mode, toggles the .active class on .auth-tab (by data-tab) and .auth-form (by data-form), and injects the matching title/sub/foot HTML into #authTitle, #authSub, #authFoot. Wire two delegated click handlers on document: one for .auth-tab clicks (read data-tab), and one for elements with data-tab-go (prevent default, switch mode).

Password visibility toggle. Delegate clicks on elements with data-toggle="<inputId>". Toggle the input's type between password and text. Swap the button's inner SVG between an open eye icon and a slashed eye icon (use inline SVG strings with stroke="currentColor", stroke-width="1.7", 18×18 viewBox).

Password strength meter. Bind an input event on #signupPassword. Score the password (0–4): +1 for length ≥ 8, +1 for mixed case, +1 for at least one digit, +1 for at least one special char. Set data-strength on #pwMeter to the score. Update #pwHelper.textContent from this copy array, and add a .match class when score ≥ 3:

"Use 8+ characters with letters, numbers & a symbol."
"Getting started — try a longer mix."
"Decent — add a number or symbol for extra glow."
"Strong — one more touch unlocks elite."
"Sparkling secure. Sherry-approved ✦"
Form submission (mocked). For each form.auth-form: preventDefault, then run form.checkValidity(). If invalid, focus the first :invalid field and toast "Please check your details ✦". If valid, find the submit button, save its original label text, add a .loading class, swap label to "One moment…". After 1100ms, remove loading, set label to "✓ You're in", and toast either "Welcome back, sweet berry ♡" (login) or `Welcome to the Berry List, ${firstName} ✦` (signup — read #firstName value, fallback to "you"). After another 1400ms, restore the original label and redirect via window.location.href = "SherryBerries.html".

Social buttons. For every .social-btn, on click read data-social, capitalize the first letter, and toast `Connecting with ${Label}…`. (No actual OAuth flow — purely visual.)

Don't add any other features. Keep it readable, no minification, no dependencies.