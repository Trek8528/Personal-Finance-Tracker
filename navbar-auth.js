// Handles authentication state in the navigation bar on public pages (index.html, about.html)
(function () {
  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function updateNavForLoggedInUser() {
    const token = localStorage.getItem('ft_token');
    if (!token) return;

    let profile = null;
    try {
      profile = JSON.parse(localStorage.getItem('ft_profile')) || {};
    } catch {
      profile = {};
    }

    const email = profile.email || localStorage.getItem('ft_user_email') || '';
    const name = profile.name || 'User';
    const avatar = profile.avatar || (email ? localStorage.getItem(`ft_avatar_${email}`) : null);
    const initials = getInitials(name);

    // Update nav links container
    const navLinks = document.getElementById('navLinks') || document.querySelector('.nav-links');
    if (navLinks) {
      // Find Login / Get Started buttons or links
      navLinks.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim().toLowerCase();
        if (href.includes('login.html') || href.includes('signup.html') || text === 'login' || text === 'get started' || text === 'sign up') {
          a.remove();
        }
      });

      // Avoid duplicate injection
      if (!navLinks.querySelector('.nav-dashboard-link')) {
        const dashLink = document.createElement('a');
        dashLink.href = 'dashboard.html';
        dashLink.className = 'nav-link nav-dashboard-link';
        dashLink.textContent = 'Dashboard';
        navLinks.appendChild(dashLink);
      }

      if (!navLinks.querySelector('#homeNavProfileBtn')) {
        const profileLink = document.createElement('a');
        profileLink.href = 'dashboard.html';
        profileLink.id = 'homeNavProfileBtn';
        profileLink.className = 'home-nav-profile-btn';
        profileLink.title = `Logged in as ${name} - Open Dashboard`;
        profileLink.setAttribute('aria-label', 'Dashboard Profile');

        if (avatar) {
          profileLink.innerHTML = `<img src="${avatar}" class="home-nav-avatar-img" alt="${name}" />`;
        } else {
          profileLink.innerHTML = `<span class="home-nav-avatar-initials">${initials}</span>`;
        }
        navLinks.appendChild(profileLink);
      }
    }

    // Update Hero section action buttons if present
    const heroActions = document.querySelector('.hero-actions') || document.getElementById('heroActions');
    if (heroActions) {
      heroActions.innerHTML = `
        <a href="dashboard.html" class="btn-primary btn-large">Go to Dashboard &rarr;</a>
        <a href="about.html" class="btn-outline btn-large">Learn More</a>
      `;
    }

    // Refresh profile & avatar from cloud if api function exists
    if (typeof api === 'function') {
      api('/users/me').then((user) => {
        if (!user) return;
        localStorage.setItem('ft_profile', JSON.stringify({
          name: user.name || '',
          email: user.email || '',
          since: user.since || '',
          avatar: user.avatar || ''
        }));
        if (user.email) {
          localStorage.setItem('ft_user_email', user.email);
          if (user.avatar) {
            localStorage.setItem(`ft_avatar_${user.email}`, user.avatar);
          } else if (user.avatar === null) {
            localStorage.removeItem(`ft_avatar_${user.email}`);
          }
        }
        // Update avatar image if it changed
        const btn = document.getElementById('homeNavProfileBtn');
        if (btn) {
          const newInitials = getInitials(user.name);
          btn.title = `Logged in as ${user.name} - Open Dashboard`;
          if (user.avatar) {
            btn.innerHTML = `<img src="${user.avatar}" class="home-nav-avatar-img" alt="${user.name}" />`;
          } else {
            btn.innerHTML = `<span class="home-nav-avatar-initials">${newInitials}</span>`;
          }
        }
      }).catch(() => {
        // Silent catch if offline or waking up
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavForLoggedInUser);
  } else {
    updateNavForLoggedInUser();
  }

  window.addEventListener('pageshow', updateNavForLoggedInUser);
})();

