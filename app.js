// ===== WorkLoom SPA Application =====

class WorkLoomApp {
    constructor() {
        this.currentRoute = '';
        this.currentUser = null;
        this.jobs = [];
        this.savedJobs = new Set();
        this.filteredJobs = [];
        this.currentFilters = {
            keyword: '',
            location: '',
            type: '',
            experience: '',
            salaryMin: 0,
            salaryMax: 200000,
            sort: 'newest'
        };
        
        this.init();
    }
    
    async init() {
        // Initialize with fallback data immediately
        this.jobs = this.getFallbackJobs();
        this.filteredJobs = [...this.jobs];
        
        this.loadUserData();
        this.updateAuthUI();
        this.setupEventListeners();
        // Load jobs first before setting up routing
        await this.loadJobs();
        this.setupRouter();
        this.navigate(window.location.hash || '#/');
    }
    
    // ===== ROUTER =====
    setupRouter() {
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash);
        });
        
        window.addEventListener('load', () => {
            this.navigate(window.location.hash || '#/');
        });
    }
    
    navigate(hash) {
        this.currentRoute = hash;
        this.updateActiveNavLinks();
        this.announceRouteChange(hash);
        
        const routes = {
            '#/': () => this.renderHome(),
            '#/jobs': () => this.renderJobs(),
            '#/saved': () => this.renderSaved(),
            '#/about': () => this.renderAbout(),
            '#/contact': () => this.renderContact(),
            '#/auth/signin': () => this.renderSignIn(),
            '#/auth/signup': () => this.renderSignUp()
        };
        
        // Handle job detail routes
        const jobDetailMatch = hash.match(/^#\/jobs\/(\d+)$/);
        if (jobDetailMatch) {
            const jobId = parseInt(jobDetailMatch[1]);
            return this.renderJobDetail(jobId);
        }
        
        const route = routes[hash];
        if (route) {
            this.showLoading();
            setTimeout(() => {
                route();
                this.hideLoading();
            }, 100);
        } else {
            this.render404();
        }
    }
    
    announceRouteChange(hash) {
        const routeNames = {
            '#/': 'Home',
            '#/jobs': 'Jobs',
            '#/saved': 'Saved Jobs',
            '#/about': 'About',
            '#/contact': 'Contact',
            '#/auth/signin': 'Sign In',
            '#/auth/signup': 'Sign Up'
        };
        
        const routeName = routeNames[hash] || 'Page';
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `Navigated to ${routeName} page`;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }
    
    updateActiveNavLinks() {
        // Update desktop nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === this.currentRoute) {
                link.classList.add('active');
            }
        });
        
        // Update mobile nav links
        this.updateMobileNavActiveLinks();
    }
    
    // ===== DATA MANAGEMENT =====
    async loadJobs() {
        try {
            const response = await fetch('./data/jobs.json');
            this.jobs = await response.json();
            this.filteredJobs = [...this.jobs];
        } catch (error) {
            console.error('Failed to load jobs:', error);
            this.jobs = this.getFallbackJobs();
            this.filteredJobs = [...this.jobs];
        }
    }
    
    getFallbackJobs() {
        return [
            {
                id: 1,
                title: "Senior Frontend Developer",
                company: "TechCorp",
                logo: "TC",
                location: "San Francisco, CA",
                type: "Full-time",
                experience: "Senior",
                salaryMin: 120000,
                salaryMax: 160000,
                tags: ["React", "TypeScript", "Next.js"],
                postedAt: "2024-01-20",
                description: "We're looking for a senior frontend developer to join our growing team...",
                requirements: ["5+ years React experience", "TypeScript proficiency", "Team leadership"],
                benefits: ["Health insurance", "401k matching", "Remote work"]
            },
            {
                id: 2,
                title: "Product Manager",
                company: "StartupXYZ",
                logo: "SX",
                location: "New York, NY",
                type: "Full-time",
                experience: "Mid-level",
                salaryMin: 100000,
                salaryMax: 140000,
                tags: ["Product Strategy", "Analytics", "Agile"],
                postedAt: "2024-01-19",
                description: "Join our product team and help shape the future of our platform...",
                requirements: ["3+ years product management", "Data-driven mindset", "Cross-functional collaboration"],
                benefits: ["Equity package", "Flexible PTO", "Learning budget"]
            }
        ];
    }
    
    loadUserData() {
        const userData = localStorage.getItem('workloom_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        
        const savedJobsData = localStorage.getItem('workloom_saved_jobs');
        if (savedJobsData) {
            this.savedJobs = new Set(JSON.parse(savedJobsData));
        }
    }
    
    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('workloom_user', JSON.stringify(this.currentUser));
        }
        localStorage.setItem('workloom_saved_jobs', JSON.stringify([...this.savedJobs]));
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Header scroll effect
        this.setupHeaderScrollEffect();
        
        // Mobile menu functionality
        this.setupMobileMenu();
        
        // Modal close
        document.querySelector('.modal__close').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeMobileMenu();
            }
        });
        
        // User menu toggle
        document.addEventListener('click', (e) => {
            const userAvatar = document.querySelector('.user-avatar');
            const dropdown = document.querySelector('.dropdown-menu');
            
            if (userAvatar && userAvatar.contains(e.target)) {
                dropdown.classList.toggle('show');
            } else if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Sign out
        document.getElementById('sign-out-btn').addEventListener('click', () => {
            this.signOut();
        });
        
        // Mobile sign out
        const mobileSignOutBtn = document.querySelector('.mobile-sign-out-btn');
        if (mobileSignOutBtn) {
            mobileSignOutBtn.addEventListener('click', () => {
                this.signOut();
                this.closeMobileMenu();
            });
        }
        
        // Search shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearchModal();
            }
        });
        
        // Search button click
        document.querySelector('.search-btn')?.addEventListener('click', () => {
            this.openSearchModal();
        });
        
        // Mobile search button
        document.querySelector('.search-btn--mobile')?.addEventListener('click', () => {
            this.openSearchModal();
            this.closeMobileMenu();
        });
        
        // Handle window resize - close mobile menu on tablet/desktop
        window.addEventListener('resize', () => {
            this.handleResponsiveLayout();
        });
        
        // Initial responsive layout check
        this.handleResponsiveLayout();
    }
    
    setupHeaderScrollEffect() {
        const header = document.querySelector('.header');
        let lastScrollY = window.scrollY;
        
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Add/remove scrolled class based on scroll position
            if (currentScrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        };
        
        // Use throttled scroll for better performance
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', throttledScroll, { passive: true });
    }
    
    // ===== AUTH MANAGEMENT =====
    updateAuthUI() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const mobileAuthButtons = document.querySelector('.mobile-auth-buttons');
        const mobileUserMenu = document.querySelector('.mobile-user-menu');
        
        if (this.currentUser) {
            // Desktop auth UI
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            
            // Mobile auth UI
            if (mobileAuthButtons) mobileAuthButtons.style.display = 'none';
            if (mobileUserMenu) mobileUserMenu.style.display = 'block';
            
            // Update initials
            const initials = this.getInitials(this.currentUser.name);
            const avatarInitials = document.querySelector('.avatar-initials');
            const mobileAvatarInitials = document.querySelector('.mobile-avatar-initials');
            const mobileUserName = document.querySelector('.mobile-user-name');
            const mobileUserEmail = document.querySelector('.mobile-user-email');
            
            if (avatarInitials) avatarInitials.textContent = initials;
            if (mobileAvatarInitials) mobileAvatarInitials.textContent = initials;
            if (mobileUserName) mobileUserName.textContent = this.currentUser.name;
            if (mobileUserEmail) mobileUserEmail.textContent = this.currentUser.email;
        } else {
            // Desktop auth UI
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            
            // Mobile auth UI
            if (mobileAuthButtons) mobileAuthButtons.style.display = 'flex';
            if (mobileUserMenu) mobileUserMenu.style.display = 'none';
        }
    }
    
    // ===== RESPONSIVE UTILITIES =====
    isTablet() {
        return window.innerWidth >= 768 && window.innerWidth <= 991;
    }
    
    isMobile() {
        return window.innerWidth < 768;
    }
    
    isDesktop() {
        return window.innerWidth >= 992;
    }
    
    handleResponsiveLayout() {
        const isTabletView = this.isTablet();
        const isMobileView = this.isMobile();
        
        // Log current screen size for debugging
        console.log(`Screen size: ${window.innerWidth}px - ${isMobileView ? 'Mobile' : isTabletView ? 'Tablet' : 'Desktop'}`);
        
        // Ensure mobile menu is hidden on tablet and desktop
        if (!isMobileView) {
            this.closeMobileMenu();
        }
        
        // Adjust grid layouts for tablet
        if (isTabletView) {
            document.body.classList.add('tablet-view');
            document.body.classList.remove('mobile-view', 'desktop-view');
        } else if (isMobileView) {
            document.body.classList.add('mobile-view');
            document.body.classList.remove('tablet-view', 'desktop-view');
        } else {
            document.body.classList.add('desktop-view');
            document.body.classList.remove('tablet-view', 'mobile-view');
        }
    }
    setupMobileMenu() {
        console.log('Setting up mobile menu...');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileNavClose = document.querySelector('.mobile-nav__close');
        const mobileNavBackdrop = document.querySelector('.mobile-nav__backdrop');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav__link');
        
        console.log('Mobile menu elements found:', {
            toggle: !!mobileMenuToggle,
            nav: !!mobileNav,
            close: !!mobileNavClose,
            backdrop: !!mobileNavBackdrop,
            links: mobileNavLinks.length
        });
        
        // Mobile menu toggle
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Mobile menu toggle clicked');
                this.toggleMobileMenu();
            });
        } else {
            console.error('Mobile menu toggle not found!');
        }
        
        // Mobile nav close button
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Mobile nav close clicked');
                this.closeMobileMenu();
            });
        }
        
        // Mobile nav backdrop
        if (mobileNavBackdrop) {
            mobileNavBackdrop.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Mobile nav backdrop clicked');
                this.closeMobileMenu();
            });
        }
        
        // Mobile nav links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                console.log('Mobile nav link clicked:', link.getAttribute('href'));
                // Close mobile menu after navigation
                setTimeout(() => {
                    this.closeMobileMenu();
                }, 100);
            });
        });
    }
    
    toggleMobileMenu() {
        console.log('Toggle mobile menu called');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (!mobileMenuToggle || !mobileNav) {
            console.error('Mobile menu elements not found!');
            return;
        }
        
        if (mobileNav.classList.contains('active')) {
            console.log('Closing mobile menu');
            this.closeMobileMenu();
        } else {
            console.log('Opening mobile menu');
            this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        console.log('Opening mobile menu...');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.getElementById('mobile-nav');
        const body = document.body;
        
        if (!mobileMenuToggle || !mobileNav) {
            console.error('Cannot open mobile menu - elements not found');
            return;
        }
        
        mobileMenuToggle.classList.add('active');
        mobileNav.classList.add('active');
        body.classList.add('mobile-menu-open');
        
        // Update accessibility attributes
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        mobileNav.setAttribute('aria-hidden', 'false');
        
        console.log('Mobile menu opened successfully');
        
        // Focus trap
        const focusableElements = mobileNav.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    closeMobileMenu() {
        console.log('Closing mobile menu...');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.getElementById('mobile-nav');
        const body = document.body;
        
        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
        if (mobileNav) mobileNav.classList.remove('active');
        if (body) body.classList.remove('mobile-menu-open');
        
        // Update accessibility attributes
        if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'false');
        if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
        
        console.log('Mobile menu closed successfully');
    }
    
    updateMobileNavActiveLinks() {
        document.querySelectorAll('.mobile-nav__link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === this.currentRoute) {
                link.classList.add('active');
            }
        });
    }
    
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    signOut() {
        this.currentUser = null;
        localStorage.removeItem('workloom_user');
        this.updateAuthUI();
        this.showToast('Signed out successfully', 'success');
        if (this.currentRoute.includes('/saved')) {
            this.navigate('#/');
        }
    }
    
    // ===== UI HELPERS =====
    showLoading() {
        const loading = document.querySelector('.loading-skeleton');
        const content = document.getElementById('app-content');
        loading.style.display = 'block';
        content.style.display = 'none';
    }
    
    hideLoading() {
        const loading = document.querySelector('.loading-skeleton');
        const content = document.getElementById('app-content');
        loading.style.display = 'none';
        content.style.display = 'block';
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        modalTitle.textContent = title;
        modalContent.innerHTML = content;
        modal.style.display = 'flex';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        
        // Disable body scroll when modal is open
        document.body.classList.add('modal-open');
        
        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    closeModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        
        // Re-enable body scroll when modal is closed
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2em; cursor: pointer;">&times;</button>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ===== RENDER METHODS =====
    renderHome() {
        try {
            console.log('Starting home page render...');
            
            // Basic hero section first
            let content = `
                <section class="hero">
                    <div class="container">
                        <h1 class="hero__title">
                            Find Your <span class="gradient-text">Dream Job</span><br>
                            with WorkLoom
                        </h1>
                        <p class="hero__subtitle">
                            Connect with top companies worldwide and discover opportunities that match your skills and ambitions. Join over 2.5 million professionals who trust WorkLoom.
                        </p>
                        <div class="hero__actions">
                            <a href="#/jobs" class="btn btn--primary btn--large">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                Browse Jobs
                            </a>
                            <button class="btn btn--outline btn--large" onclick="app.openPostJobModal()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Post a Job
                            </button>
                        </div>
                        <div class="hero__stats">
                            <div class="hero__stat">
                                <span class="hero__stat-number">2.5M+</span>
                                <span class="hero__stat-label">Active Users</span>
                            </div>
                            <div class="hero__stat">
                                <span class="hero__stat-number">15K+</span>
                                <span class="hero__stat-label">Companies</span>
                            </div>
                            <div class="hero__stat">
                                <span class="hero__stat-number">850K+</span>
                                <span class="hero__stat-label">Jobs Filled</span>
                            </div>
                            <div class="hero__stat">
                                <span class="hero__stat-number">94%</span>
                                <span class="hero__stat-label">Success Rate</span>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            
            console.log('Hero section created');
            
            // Add trusted by section
            try {
                const trustedLogos = this.renderTrustedLogos();
                content += `
                    <section class="trusted-by">
                        <div class="container">
                            <h2 class="trusted-by__title">Trusted by leading companies</h2>
                            <div class="trusted-by__logos">
                                ${trustedLogos}
                            </div>
                        </div>
                    </section>
                `;
                console.log('Trusted by section added');
            } catch (error) {
                console.error('Error in trusted by section:', error);
                content += `
                    <section class="trusted-by">
                        <div class="container">
                            <h2 class="trusted-by__title">Trusted by leading companies</h2>
                            <div class="trusted-by__logos">
                                <p>Leading companies trust WorkLoom</p>
                            </div>
                        </div>
                    </section>
                `;
            }
            
            // Add features section
            try {
                const features = this.renderFeatures();
                content += `
                    <section class="features">
                        <div class="container">
                            <div class="features__header">
                                <h2 class="features__title">Why Choose WorkLoom?</h2>
                                <p class="features__subtitle">
                                    We make job searching and hiring simple, efficient, and effective for everyone.
                                </p>
                            </div>
                            <div class="features__grid">
                                ${features}
                            </div>
                        </div>
                    </section>
                `;
                console.log('Features section added');
            } catch (error) {
                console.error('Error in features section:', error);
                content += `
                    <section class="features">
                        <div class="container">
                            <h2 class="features__title">Why Choose WorkLoom?</h2>
                            <p>Smart job matching, one-click apply, and more features coming soon.</p>
                        </div>
                    </section>
                `;
            }
            
            // Add CTA sections
            content += `
                <section class="cta-sections">
                    <div class="container">
                        <div class="grid grid--2">
                            <div class="card">
                                <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-4);">For Job Seekers</h3>
                                <p style="color: var(--color-gray-600); margin-bottom: var(--space-6);">
                                    Discover opportunities that match your skills and career goals. Apply with one click and track your applications.
                                </p>
                                <a href="#/jobs" class="btn btn--primary">Start Job Search</a>
                            </div>
                            <div class="card">
                                <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-4);">For Employers</h3>
                                <p style="color: var(--color-gray-600); margin-bottom: var(--space-6);">
                                    Find top talent quickly with our advanced matching algorithm and comprehensive candidate profiles.
                                </p>
                                <button class="btn btn--outline" onclick="app.openPostJobModal()">Post a Job</button>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            
            // Add featured jobs section
            try {
                const featuredJobs = this.renderFeaturedJobs();
                content += `
                    <section class="featured-jobs" style="padding: var(--space-20) 0; background: var(--color-gray-50);">
                        <div class="container">
                            <div class="text-center" style="margin-bottom: var(--space-16);">
                                <h2 style="font-size: var(--text-4xl); font-weight: var(--font-weight-bold); color: var(--color-gray-900); margin-bottom: var(--space-4);">Featured Opportunities</h2>
                                <p style="font-size: var(--text-lg); color: var(--color-gray-600); max-width: 600px; margin: 0 auto; line-height: var(--leading-relaxed);">Hand-picked roles from top companies actively hiring right now</p>
                            </div>
                            <div class="grid grid--auto" style="margin-bottom: var(--space-12);">
                                ${featuredJobs}
                            </div>
                            <div style="text-align: center;">
                                <a href="#/jobs" class="btn btn--outline btn--large">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 12h14"/>
                                        <path d="M12 5l7 7-7 7"/>
                                    </svg>
                                    View All Jobs
                                </a>
                            </div>
                        </div>
                    </section>
                `;
                console.log('Featured jobs section added');
            } catch (error) {
                console.error('Error in featured jobs section:', error);
                content += `
                    <section class="featured-jobs" style="padding: var(--space-20) 0; background: var(--color-gray-50);">
                        <div class="container">
                            <h2>Featured Opportunities</h2>
                            <p>Great job opportunities will be featured here soon.</p>
                            <a href="#/jobs" class="btn btn--outline btn--large">View All Jobs</a>
                        </div>
                    </section>
                `;
            }
            
            // Add testimonials section
            try {
                const testimonials = this.renderTestimonials();
                content += `
                    <section class="testimonials" style="padding: var(--space-20) 0;">
                        <div class="container">
                            <div class="text-center" style="margin-bottom: var(--space-16);">
                                <h2 style="font-size: var(--text-4xl); font-weight: var(--font-weight-bold); color: var(--color-gray-900); margin-bottom: var(--space-4);">Success Stories</h2>
                                <p style="font-size: var(--text-lg); color: var(--color-gray-600); max-width: 600px; margin: 0 auto; line-height: var(--leading-relaxed);">See how WorkLoom has transformed careers around the world</p>
                            </div>
                            <div class="grid grid--3">
                                ${testimonials}
                            </div>
                        </div>
                    </section>
                `;
                console.log('Testimonials section added');
            } catch (error) {
                console.error('Error in testimonials section:', error);
                content += `
                    <section class="testimonials" style="padding: var(--space-20) 0;">
                        <div class="container">
                            <h2>Success Stories</h2>
                            <p>Amazing success stories from our users will be featured here.</p>
                        </div>
                    </section>
                `;
            }
            
            // Add newsletter section
            content += `
                <section class="newsletter" style="padding: var(--space-20) 0; background: var(--gradient-primary);">
                    <div class="container">
                        <div class="text-center">
                            <h2 style="font-size: var(--text-3xl); font-weight: var(--font-weight-bold); color: white; margin-bottom: var(--space-4);">Stay Ahead of the Curve</h2>
                            <p style="font-size: var(--text-lg); color: rgba(255, 255, 255, 0.9); margin-bottom: var(--space-8); max-width: 500px; margin-left: auto; margin-right: auto; line-height: var(--leading-relaxed);">Get weekly insights on job market trends, career advice, and exclusive job opportunities delivered to your inbox.</p>
                            <div style="max-width: 400px; margin: 0 auto; display: flex; gap: var(--space-3);">
                                <input type="email" placeholder="Enter your email" class="form-input" style="flex: 1; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); color: white;" id="newsletter-email">
                                <button class="btn btn--secondary" onclick="app.subscribeNewsletter()" style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); color: white;">
                                    Subscribe
                                </button>
                            </div>
                            <p style="font-size: var(--text-sm); color: rgba(255, 255, 255, 0.7); margin-top: var(--space-4);">Join 50,000+ professionals already subscribed</p>
                        </div>
                    </div>
                </section>
            `;
            
            document.getElementById('app-content').innerHTML = content;
            console.log('Home page rendered successfully with all sections');
            
        } catch (error) {
            console.error('Error rendering home page:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="container" style="padding: var(--space-16); text-align: center;">
                    <h1>Sorry, there was an error loading the page.</h1>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn--primary">Refresh Page</button>
                </div>
            `;
        }
    }
    
    renderTrustedLogos() {
        const companies = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix'];
        return companies.map(company => `
            <div class="trusted-by__logo">
                <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
                    <text x="60" y="25" text-anchor="middle" font-family="var(--font-family)" font-size="14" font-weight="600">${company}</text>
                </svg>
            </div>
        `).join('');
    }
    
    renderFeatures() {
        const features = [
            {
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4m-8 0V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 0h6"/>
                </svg>`,
                title: 'Smart Job Matching',
                description: 'Our AI-powered algorithm matches you with jobs that fit your skills, experience, and preferences.'
            },
            {
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>`,
                title: 'One-Click Apply',
                description: 'Apply to multiple jobs instantly with your saved profile and customizable cover letters.'
            },
            {
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                </svg>`,
                title: 'Save & Track',
                description: 'Save interesting jobs and track your application status all in one convenient dashboard.'
            },
            {
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
                </svg>`,
                title: 'Global Remote',
                description: 'Access remote opportunities from companies worldwide and work from anywhere.'
            }
        ];
        
        return features.map(feature => `
            <div class="feature-card">
                <div class="feature-card__icon">
                    ${feature.icon}
                </div>
                <h3 class="feature-card__title">${feature.title}</h3>
                <p class="feature-card__description">${feature.description}</p>
            </div>
        `).join('');
    }
    
    renderFeaturedJobs() {
        // Get first 3 jobs as featured
        if (!this.jobs || this.jobs.length === 0) {
            return '<div class="text-center"><p style="color: var(--color-gray-600);">Featured jobs will appear here once available.</p></div>';
        }
        const featuredJobs = this.jobs.slice(0, 3);
        return featuredJobs.map(job => `
            <div class="card hover-lift" onclick="app.navigate('#/jobs/${job.id}')" style="cursor: pointer; padding: var(--space-6);">
                <div style="display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4);">
                    <div style="width: 48px; height: 48px; background: var(--gradient-primary); color: white; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; font-weight: var(--font-weight-bold); font-size: var(--text-base);">${job.logo}</div>
                    <div>
                        <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-gray-900); margin-bottom: var(--space-1);">${job.title}</h3>
                        <p style="color: var(--color-gray-600); font-size: var(--text-sm);">${job.company}</p>
                    </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4);">
                    <span style="background: var(--color-gray-100); color: var(--color-gray-700); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--font-weight-medium);">📍 ${job.location}</span>
                    <span style="background: var(--color-primary); color: white; padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--font-weight-medium);">💰 $${job.salaryMin.toLocaleString()}+</span>
                    <span style="background: var(--color-gray-100); color: var(--color-gray-700); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--font-weight-medium);">⏰ ${job.type}</span>
                </div>
                <p style="color: var(--color-gray-600); font-size: var(--text-sm); line-height: var(--leading-relaxed);">${job.description.substring(0, 120)}...</p>
            </div>
        `).join('');
    }
    
    renderTestimonials() {
        const testimonials = [
            {
                name: "Sarah Johnson",
                role: "Software Engineer at Google",
                content: "WorkLoom helped me find my dream job at Google. The AI matching was incredibly accurate, and I got responses from companies I never would have discovered otherwise.",
                avatar: "SJ",
                rating: 5
            },
            {
                name: "Michael Chen",
                role: "Product Manager at Stripe",
                content: "As someone transitioning careers, WorkLoom's personalized recommendations were game-changing. I landed a PM role at Stripe within 3 weeks of signing up.",
                avatar: "MC",
                rating: 5
            },
            {
                name: "Emily Rodriguez",
                role: "Designer at Airbnb",
                content: "The platform is incredibly user-friendly, and the quality of job opportunities is outstanding. I found my current role at Airbnb through WorkLoom's smart matching.",
                avatar: "ER",
                rating: 5
            }
        ];
        
        return testimonials.map(testimonial => `
            <div class="card" style="padding: var(--space-8); height: 100%;">
                <div style="display: flex; margin-bottom: var(--space-4);">
                    ${Array(testimonial.rating).fill('⭐').join('')}
                </div>
                <p style="color: var(--color-gray-700); line-height: var(--leading-relaxed); margin-bottom: var(--space-6); font-style: italic;">"${testimonial.content}"</p>
                <div style="display: flex; align-items: center; gap: var(--space-3); margin-top: auto;">
                    <div style="width: 48px; height: 48px; background: var(--gradient-secondary); color: white; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-weight: var(--font-weight-bold); font-size: var(--text-sm);">${testimonial.avatar}</div>
                    <div>
                        <div style="font-weight: var(--font-weight-semibold); color: var(--color-gray-900); font-size: var(--text-sm);">${testimonial.name}</div>
                        <div style="color: var(--color-gray-600); font-size: var(--text-xs);">${testimonial.role}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    subscribeNewsletter() {
        const email = document.getElementById('newsletter-email').value;
        if (!email) {
            this.showToast('Please enter your email address', 'error');
            return;
        }
        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Simulate newsletter subscription
        this.showToast('Successfully subscribed to our newsletter!', 'success');
        document.getElementById('newsletter-email').value = '';
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    renderJobs() {
        const content = `
            <div class="container">
                <div class="jobs-header">
                    <div>
                        <h1 class="jobs-title">Find Your Next Opportunity</h1>
                        <p class="jobs-count">${this.filteredJobs.length} jobs found</p>
                    </div>
                </div>
                
                <div class="filters">
                    ${this.renderFilters()}
                </div>
                
                <div class="grid" id="jobs-grid">
                    ${this.renderJobCards()}
                </div>
                
                ${this.renderPagination()}
            </div>
        `;
        
        document.getElementById('app-content').innerHTML = content;
        this.setupJobsEventListeners();
    }
    
    renderFilters() {
        return `
            <div class="filters__row">
                <div class="form-group">
                    <label class="form-label">Keyword</label>
                    <input type="text" class="form-input" id="filter-keyword" placeholder="Job title, skills, company..." value="${this.currentFilters.keyword}">
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="filter-location" placeholder="City, state, or remote" value="${this.currentFilters.location}">
                </div>
                <div class="form-group">
                    <label class="form-label">Job Type</label>
                    <select class="form-select" id="filter-type">
                        <option value="">All Types</option>
                        <option value="Full-time" ${this.currentFilters.type === 'Full-time' ? 'selected' : ''}>Full-time</option>
                        <option value="Part-time" ${this.currentFilters.type === 'Part-time' ? 'selected' : ''}>Part-time</option>
                        <option value="Contract" ${this.currentFilters.type === 'Contract' ? 'selected' : ''}>Contract</option>
                        <option value="Intern" ${this.currentFilters.type === 'Intern' ? 'selected' : ''}>Internship</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Experience</label>
                    <select class="form-select" id="filter-experience">
                        <option value="">All Levels</option>
                        <option value="Entry-level" ${this.currentFilters.experience === 'Entry-level' ? 'selected' : ''}>Entry Level</option>
                        <option value="Mid-level" ${this.currentFilters.experience === 'Mid-level' ? 'selected' : ''}>Mid Level</option>
                        <option value="Senior" ${this.currentFilters.experience === 'Senior' ? 'selected' : ''}>Senior</option>
                        <option value="Lead" ${this.currentFilters.experience === 'Lead' ? 'selected' : ''}>Lead</option>
                    </select>
                </div>
            </div>
            <div class="filters__row">
                <div class="form-group">
                    <label class="form-label">Salary Range</label>
                    <div class="range-slider">
                        <input type="range" id="salary-min" min="0" max="200000" step="5000" value="${this.currentFilters.salaryMin}">
                        <input type="range" id="salary-max" min="0" max="200000" step="5000" value="${this.currentFilters.salaryMax}">
                        <div class="range-values">
                            <span>$${this.currentFilters.salaryMin.toLocaleString()}</span>
                            <span>$${this.currentFilters.salaryMax.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Sort By</label>
                    <select class="form-select" id="filter-sort">
                        <option value="newest" ${this.currentFilters.sort === 'newest' ? 'selected' : ''}>Newest</option>
                        <option value="salary" ${this.currentFilters.sort === 'salary' ? 'selected' : ''}>Salary</option>
                        <option value="relevance" ${this.currentFilters.sort === 'relevance' ? 'selected' : ''}>Relevance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">&nbsp;</label>
                    <button class="btn btn--outline" onclick="app.clearFilters()">Clear Filters</button>
                </div>
            </div>
        `;
    }
    
    renderJobCards() {
        if (this.filteredJobs.length === 0) {
            return `
                <div style="text-align: center; padding: var(--space-16);">
                    <h3>No jobs found</h3>
                    <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">Try adjusting your filters or search terms.</p>
                    <button class="btn btn--outline" onclick="app.clearFilters()">Clear Filters</button>
                </div>
            `;
        }
        
        return this.filteredJobs.map(job => `
            <div class="job-card" onclick="app.navigate('#/jobs/${job.id}')">
                <div class="job-card__header">
                    <div class="job-card__logo">${job.logo}</div>
                    <div class="job-card__info">
                        <h3 class="job-card__title">${job.title}</h3>
                        <p class="job-card__company">${job.company}</p>
                        <div class="job-card__meta">
                            <span>${job.location}</span>
                            <span>•</span>
                            <span>${job.type}</span>
                            <span>•</span>
                            <span>${this.formatDate(job.postedAt)}</span>
                        </div>
                    </div>
                </div>
                
                <p class="job-card__description">${job.description.substring(0, 150)}...</p>
                
                <div class="job-card__tags">
                    ${job.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                
                <div class="job-card__actions">
                    <div class="job-card__salary">
                        $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}
                    </div>
                    <div class="job-card__buttons">
                        <button class="btn btn--small btn--outline" onclick="event.stopPropagation(); app.toggleSaveJob(${job.id})">
                            ${this.savedJobs.has(job.id) ? 'Saved' : 'Save'}
                        </button>
                        <button class="btn btn--small btn--primary" onclick="event.stopPropagation(); app.applyToJob(${job.id})">
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderPagination() {
        return `<div class="pagination"><button class="pagination__btn" disabled>‹</button><button class="pagination__btn active">1</button><button class="pagination__btn">2</button><button class="pagination__btn">›</button></div>`;
    }
    
    toggleSaveJob(jobId) {
        if (this.savedJobs.has(jobId)) {
            this.savedJobs.delete(jobId);
            this.showToast('Job removed from saved', 'success');
        } else {
            this.savedJobs.add(jobId);
            this.showToast('Job saved successfully', 'success');
        }
        this.saveUserData();
        if (this.currentRoute === '#/saved') this.renderSaved();
    }
    
    applyToJob(jobId) {
        if (!this.currentUser) {
            this.showToast('Please sign in to apply for jobs', 'warning');
            this.navigate('#/auth/signin');
            return;
        }
        this.showToast('Application submitted successfully!', 'success');
    }
    
    openPostJobModal() {
        this.showModal('Post a Job', '<div style="text-align: center;"><p style="margin-bottom: var(--space-6);">Job posting is available for employers. Please contact our sales team.</p><a href="#/contact" class="btn btn--primary" onclick="app.closeModal()">Contact Sales</a></div>');
    }
    
    openSearchModal() {
        const searchContent = `
            <div class="search-modal">
                <div class="search-input-container" style="margin-bottom: var(--space-6);">
                    <div style="position: relative;">
                        <input 
                            type="text" 
                            id="global-search-input" 
                            class="form-input" 
                            placeholder="Search jobs by title, company, skills, or location..." 
                            style="padding-left: var(--space-10); font-size: var(--font-size-lg);"
                            autocomplete="off"
                        >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); color: var(--muted);">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                    </div>
                </div>
                
                <div id="search-results" class="search-results">
                    <div class="search-suggestions">
                        <h4 style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.05em;">Popular Searches</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-6);">
                            ${this.getPopularSearches().map(term => `
                                <button class="search-suggestion-tag" onclick="app.performSearch('${term}')" style="background: var(--surface); border: 1px solid var(--border); padding: var(--space-2) var(--space-3); border-radius: var(--border-radius); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-fast);">
                                    ${term}
                                </button>
                            `).join('')}
                        </div>
                        
                        <h4 style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.05em;">Quick Actions</h4>
                        <div style="display: grid; gap: var(--space-3);">
                            <button onclick="app.navigate('#/jobs'); app.closeModal();" class="search-quick-action">
                                <span style="margin-right: var(--space-3);">💼</span>
                                <div style="text-align: left;">
                                    <div style="font-weight: var(--font-weight-medium);">Browse All Jobs</div>
                                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">View all available positions</div>
                                </div>
                            </button>
                            <button onclick="app.navigate('#/saved'); app.closeModal();" class="search-quick-action">
                                <span style="margin-right: var(--space-3);">❤️</span>
                                <div style="text-align: left;">
                                    <div style="font-weight: var(--font-weight-medium);">Saved Jobs</div>
                                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">View your saved positions</div>
                                </div>
                            </button>
                            <button onclick="app.openPostJobModal();" class="search-quick-action">
                                <span style="margin-right: var(--space-3);">📝</span>
                                <div style="text-align: left;">
                                    <div style="font-weight: var(--font-weight-medium);">Post a Job</div>
                                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">List your open position</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('Search Jobs', searchContent);
        
        // Focus on search input and set up event listeners
        setTimeout(() => {
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.addEventListener('input', (e) => {
                    this.handleSearchInput(e.target.value);
                });
                
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.performSearch(e.target.value);
                    }
                });
            }
        }, 100);
    }
    
    getPopularSearches() {
        return [
            'Frontend Developer',
            'React',
            'Remote',
            'Product Manager',
            'Data Scientist',
            'Senior Engineer',
            'Marketing',
            'Design'
        ];
    }
    
    handleSearchInput(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        if (query.length < 2) {
            // Show suggestions when query is too short
            resultsContainer.innerHTML = this.renderSearchSuggestions();
            return;
        }
        
        // Filter jobs based on search query
        const searchResults = this.searchJobs(query);
        resultsContainer.innerHTML = this.renderSearchResults(searchResults, query);
    }
    
    searchJobs(query) {
        const searchTerm = query.toLowerCase().trim();
        
        return this.jobs.filter(job => {
            const matchesTitle = job.title.toLowerCase().includes(searchTerm);
            const matchesCompany = job.company.toLowerCase().includes(searchTerm);
            const matchesLocation = job.location.toLowerCase().includes(searchTerm);
            const matchesDescription = job.description.toLowerCase().includes(searchTerm);
            const matchesTags = job.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            const matchesType = job.type.toLowerCase().includes(searchTerm);
            const matchesExperience = job.experience.toLowerCase().includes(searchTerm);
            
            return matchesTitle || matchesCompany || matchesLocation || 
                   matchesDescription || matchesTags || matchesType || matchesExperience;
        }).slice(0, 8); // Limit to 8 results for preview
    }
    
    renderSearchSuggestions() {
        return `
            <div class="search-suggestions">
                <h4 style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.05em;">Popular Searches</h4>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-6);">
                    ${this.getPopularSearches().map(term => `
                        <button class="search-suggestion-tag" onclick="app.performSearch('${term}')" style="background: var(--surface); border: 1px solid var(--border); padding: var(--space-2) var(--space-3); border-radius: var(--border-radius); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-fast);">
                            ${term}
                        </button>
                    `).join('')}
                </div>
                
                <h4 style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.05em;">Quick Actions</h4>
                <div style="display: grid; gap: var(--space-3);">
                    <button onclick="app.navigate('#/jobs'); app.closeModal();" class="search-quick-action">
                        <span style="margin-right: var(--space-3);">💼</span>
                        <div style="text-align: left;">
                            <div style="font-weight: var(--font-weight-medium);">Browse All Jobs</div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">View all available positions</div>
                        </div>
                    </button>
                    <button onclick="app.navigate('#/saved'); app.closeModal();" class="search-quick-action">
                        <span style="margin-right: var(--space-3);">❤️</span>
                        <div style="text-align: left;">
                            <div style="font-weight: var(--font-weight-medium);">Saved Jobs</div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">View your saved positions</div>
                        </div>
                    </button>
                    <button onclick="app.openPostJobModal();" class="search-quick-action">
                        <span style="margin-right: var(--space-3);">📝</span>
                        <div style="text-align: left;">
                            <div style="font-weight: var(--font-weight-medium);">Post a Job</div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">List your open position</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderSearchResults(results, query) {
        if (results.length === 0) {
            return `
                <div style="text-align: center; padding: var(--space-8);">
                    <div style="font-size: var(--font-size-2xl); margin-bottom: var(--space-4);">🔍</div>
                    <h3 style="margin-bottom: var(--space-2);">No jobs found</h3>
                    <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">Try adjusting your search terms or browse all jobs.</p>
                    <button onclick="app.navigate('#/jobs'); app.closeModal();" class="btn btn--outline">Browse All Jobs</button>
                </div>
            `;
        }
        
        return `
            <div class="search-results-list">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h4 style="color: var(--text); font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">Search Results</h4>
                    <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">${results.length} results</span>
                </div>
                
                <div style="display: grid; gap: var(--space-3); max-height: 400px; overflow-y: auto; margin-bottom: var(--space-4);">
                    ${results.map(job => this.renderSearchResultItem(job, query)).join('')}
                </div>
                
                <div style="text-align: center; padding-top: var(--space-4); border-top: 1px solid var(--border);">
                    <button onclick="app.performSearch('${query}')" class="btn btn--primary">
                        View All Results (${this.searchJobs(query).length})
                    </button>
                </div>
            </div>
        `;
    }
    
    renderSearchResultItem(job, query) {
        const highlightText = (text, query) => {
            if (!query) return text;
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark style="background: var(--primary-light); color: var(--primary); padding: 1px 2px; border-radius: 2px;">$1</mark>');
        };
        
        return `
            <div class="search-result-item" onclick="app.navigate('#/jobs/${job.id}'); app.closeModal();" style="display: flex; gap: var(--space-4); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--border-radius); cursor: pointer; transition: all var(--transition-fast);">
                <div class="job-logo" style="width: 48px; height: 48px; background: var(--surface); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: center; font-weight: var(--font-weight-semibold); color: var(--primary); flex-shrink: 0;">
                    ${job.logo}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h5 style="font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-1); color: var(--text);">
                        ${highlightText(job.title, query)}
                    </h5>
                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
                        ${highlightText(job.company, query)} • ${highlightText(job.location, query)}
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-1);">
                        ${job.tags.slice(0, 3).map(tag => `
                            <span class="tag" style="font-size: var(--font-size-xs); background: var(--surface); color: var(--text-secondary); padding: 2px var(--space-2);">
                                ${highlightText(tag, query)}
                            </span>
                        `).join('')}
                        ${job.tags.length > 3 ? `<span style="color: var(--text-secondary); font-size: var(--font-size-xs);">+${job.tags.length - 3} more</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: end; justify-content: center; text-align: right;">
                    <div style="font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-1);">
                        $${job.salaryMin.toLocaleString()}+
                    </div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                        ${job.type}
                    </div>
                </div>
            </div>
        `;
    }
    
    performSearch(query) {
        // Close modal
        this.closeModal();
        
        // Navigate to jobs page
        this.navigate('#/jobs');
        
        // Wait for jobs page to render, then apply search filter
        setTimeout(() => {
            const keywordInput = document.getElementById('filter-keyword');
            if (keywordInput) {
                keywordInput.value = query;
                this.currentFilters.keyword = query;
                this.applyFilters();
                this.updateJobsDisplay();
            }
        }, 200);
    }
    
    setupJobsEventListeners() {
        ['keyword', 'location', 'type', 'experience', 'sort'].forEach(filter => {
            const element = document.getElementById(`filter-${filter}`);
            if (element) {
                element.addEventListener('input', () => this.updateFilters());
                element.addEventListener('change', () => this.updateFilters());
            }
        });
        
        // Setup salary range sliders
        const salaryMin = document.getElementById('salary-min');
        const salaryMax = document.getElementById('salary-max');
        if (salaryMin && salaryMax) {
            salaryMin.addEventListener('input', () => this.updateSalaryFilter());
            salaryMax.addEventListener('input', () => this.updateSalaryFilter());
        }
    }
    
    updateFilters() {
        this.currentFilters = {
            keyword: document.getElementById('filter-keyword')?.value || '',
            location: document.getElementById('filter-location')?.value || '',
            type: document.getElementById('filter-type')?.value || '',
            experience: document.getElementById('filter-experience')?.value || '',
            salaryMin: parseInt(document.getElementById('salary-min')?.value || '0'),
            salaryMax: parseInt(document.getElementById('salary-max')?.value || '200000'),
            sort: document.getElementById('filter-sort')?.value || 'newest'
        };
        this.applyFilters();
        this.updateJobsDisplay();
    }
    
    updateSalaryFilter() {
        const salaryMin = document.getElementById('salary-min');
        const salaryMax = document.getElementById('salary-max');
        const rangeValues = document.querySelector('.range-values');
        
        if (salaryMin && salaryMax && rangeValues) {
            const minValue = parseInt(salaryMin.value);
            const maxValue = parseInt(salaryMax.value);
            
            // Ensure min is not greater than max
            if (minValue > maxValue) {
                salaryMin.value = maxValue;
            }
            if (maxValue < minValue) {
                salaryMax.value = minValue;
            }
            
            // Update the display values
            const spans = rangeValues.querySelectorAll('span');
            if (spans.length >= 2) {
                spans[0].textContent = `$${parseInt(salaryMin.value).toLocaleString()}`;
                spans[1].textContent = `$${parseInt(salaryMax.value).toLocaleString()}`;
            }
            
            // Update filters and refresh display
            this.updateFilters();
        }
    }
    
    applyFilters() {
        this.filteredJobs = this.jobs.filter(job => {
            const matchesKeyword = !this.currentFilters.keyword || 
                job.title.toLowerCase().includes(this.currentFilters.keyword.toLowerCase()) ||
                job.company.toLowerCase().includes(this.currentFilters.keyword.toLowerCase());
            const matchesLocation = !this.currentFilters.location ||
                job.location.toLowerCase().includes(this.currentFilters.location.toLowerCase());
            const matchesType = !this.currentFilters.type || job.type === this.currentFilters.type;
            const matchesExperience = !this.currentFilters.experience || job.experience === this.currentFilters.experience;
            
            // Salary filtering: job salary range should overlap with filter range
            const matchesSalary = (job.salaryMax >= this.currentFilters.salaryMin) && 
                                  (job.salaryMin <= this.currentFilters.salaryMax);
            
            return matchesKeyword && matchesLocation && matchesType && matchesExperience && matchesSalary;
        });
        
        this.filteredJobs.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'salary': return b.salaryMax - a.salaryMax;
                case 'newest':
                default: return new Date(b.postedAt) - new Date(a.postedAt);
            }
        });
    }
    
    updateJobsDisplay() {
        const jobsGrid = document.getElementById('jobs-grid');
        const jobsCount = document.querySelector('.jobs-count');
        if (jobsGrid) jobsGrid.innerHTML = this.renderJobCards();
        if (jobsCount) jobsCount.textContent = `${this.filteredJobs.length} jobs found`;
    }
    
    clearFilters() {
        this.currentFilters = { keyword: '', location: '', type: '', experience: '', salaryMin: 0, salaryMax: 200000, sort: 'newest' };
        ['filter-keyword', 'filter-location', 'filter-type', 'filter-experience', 'filter-sort'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        // Reset salary sliders
        const salaryMin = document.getElementById('salary-min');
        const salaryMax = document.getElementById('salary-max');
        if (salaryMin && salaryMax) {
            salaryMin.value = '0';
            salaryMax.value = '200000';
            this.updateSalaryFilter();
        } else {
            this.applyFilters();
            this.updateJobsDisplay();
        }
    }
    
    handleSignIn() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        if (!email || !password) { this.showToast('Please fill in all fields', 'error'); return; }
        this.currentUser = { id: 1, name: 'John Doe', email: email };
        this.saveUserData(); this.updateAuthUI();
        this.showToast('Signed in successfully!', 'success');
        this.navigate('#/');
    }
    
    handleSignUp() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        if (!name || !email || !password || !confirmPassword) { this.showToast('Please fill in all fields', 'error'); return; }
        if (password !== confirmPassword) { this.showToast('Passwords do not match', 'error'); return; }
        this.currentUser = { id: Date.now(), name: name, email: email };
        this.saveUserData(); this.updateAuthUI();
        this.showToast('Account created successfully!', 'success');
        this.navigate('#/');
    }
    
    formatDate(dateString) {
        const diffDays = Math.ceil(Math.abs(new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }
    
    renderSaved() {
        if (!this.currentUser) { this.navigate('#/auth/signin'); return; }
        const savedJobsList = this.jobs.filter(job => this.savedJobs.has(job.id));
        const content = `<div class="container"><div class="jobs-header"><div><h1 class="jobs-title">Saved Jobs</h1><p class="jobs-count">${savedJobsList.length} saved jobs</p></div></div>${savedJobsList.length === 0 ? '<div style="text-align: center; padding: var(--space-16);"><h3>No saved jobs yet</h3><p style="color: var(--text-secondary); margin-bottom: var(--space-6);">Start browsing jobs and save the ones you\'re interested in.</p><a href="#/jobs" class="btn btn--primary">Browse Jobs</a></div>' : `<div class="grid">${savedJobsList.map(job => this.renderJobCard(job)).join('')}</div>`}</div>`;
        document.getElementById('app-content').innerHTML = content;
    }
    
    renderJobCard(job) {
        return `<div class="job-card" onclick="app.navigate('#/jobs/${job.id}')"><div class="job-card__header"><div class="job-card__logo">${job.logo}</div><div class="job-card__info"><h3 class="job-card__title">${job.title}</h3><p class="job-card__company">${job.company}</p></div></div><p class="job-card__description">${job.description.substring(0, 150)}...</p><div class="job-card__actions"><div class="job-card__salary">$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}</div><div class="job-card__buttons"><button class="btn btn--small btn--outline" onclick="event.stopPropagation(); app.toggleSaveJob(${job.id})">Remove</button><button class="btn btn--small btn--primary" onclick="event.stopPropagation(); app.applyToJob(${job.id})">Apply</button></div></div></div>`;
    }
    
    renderAbout() {
        const content = `
            <div class="container">
                <!-- Hero Section -->
                <section class="hero" style="padding: var(--space-16) 0; background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);">
                    <h1 class="hero__title">About WorkLoom</h1>
                    <p class="hero__subtitle">
                        We're revolutionizing the way talent connects with opportunity through innovative technology and human-centered design.
                    </p>
                </section>
                
                <!-- Company Story -->
                <section style="padding: var(--space-20) 0;">
                    <div class="grid grid--2" style="gap: var(--space-12); align-items: center;">
                        <div>
                            <h2 style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-6);">Our Story</h2>
                            <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--space-4); color: var(--text-secondary);">Founded in 2019 by a team of former tech executives and HR innovators, WorkLoom emerged from a simple yet powerful observation: the traditional hiring process was fundamentally broken. After experiencing firsthand the frustrations of both job seekers and employers in Silicon Valley's competitive landscape, our founders—Sarah Chen and Marcus Rodriguez—set out to create a platform that would fundamentally transform how people discover meaningful work.</p>
                            <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--space-4); color: var(--text-secondary);">What began as late-night conversations in a San Francisco coffee shop has evolved into a global movement. Starting with just three team members in a cramped WeWork space, WorkLoom has grown into a global platform serving millions of professionals across 50+ countries. Our journey has been marked by significant milestones: our Series A funding led by Sequoia Capital, partnerships with Fortune 500 companies, and the launch of our AI-powered matching algorithm that has revolutionized talent discovery.</p>
                            <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--space-4); color: var(--text-secondary);">Despite our rapid growth, our mission remains unchanged: to democratize access to opportunity and help every person find work that truly matters to them. We believe that when people find roles that align with their passions and skills, they don't just succeed—they thrive, innovate, and create positive ripple effects throughout their communities.</p>
                            <p style="line-height: var(--line-height-relaxed); color: var(--text-secondary);">Today, WorkLoom is trusted by leading companies from innovative startups to Fortune 500 enterprises, all united by a commitment to building diverse, talented teams that drive meaningful impact in the world. Our platform has facilitated over 850,000 successful job placements, with 94% of candidates reporting higher job satisfaction in their WorkLoom-discovered roles.</p>
                        </div>
                        <div>
                            <div class="card" style="background: var(--primary-light); border: none; padding: var(--space-8); margin-bottom: var(--space-6);">
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--primary); margin-bottom: var(--space-4);">Our Mission</h3>
                                <p style="line-height: var(--line-height-relaxed); color: var(--text); font-weight: var(--font-weight-medium);">To connect the world's best talent with opportunities that matter, creating a future where everyone can find work that aligns with their values, skills, and aspirations.</p>
                            </div>
                            <div class="card" style="background: var(--success-light); border: none; padding: var(--space-8);">
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--success); margin-bottom: var(--space-4);">Our Vision</h3>
                                <p style="line-height: var(--line-height-relaxed); color: var(--text); font-weight: var(--font-weight-medium);">A world where geographical boundaries, network limitations, and unconscious bias no longer determine career opportunities—where talent meets opportunity based purely on merit and mutual fit.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Our Approach -->
                <section style="padding: var(--space-20) 0; background: var(--surface);">
                    <div class="container">
                        <div style="text-align: center; margin-bottom: var(--space-16);">
                            <h2 style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-6);">Our Approach</h2>
                            <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 700px; margin: 0 auto; line-height: var(--line-height-relaxed);">At WorkLoom, we combine cutting-edge technology with human insight to create meaningful connections between talent and opportunity. Our methodology is built on three core principles that drive everything we do.</p>
                        </div>
                        <div class="grid grid--3" style="gap: var(--space-8);">
                            <div class="card" style="padding: var(--space-8); height: 100%;">
                                <div style="width: 64px; height: 64px; background: var(--primary-light); color: var(--primary); border-radius: var(--border-radius-xl); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 8V4H8"/>
                                        <rect width="16" height="12" x="4" y="8" rx="2"/>
                                        <path d="M2 14h2"/>
                                        <path d="M20 14h2"/>
                                        <path d="M15 13v2"/>
                                        <path d="M9 13v2"/>
                                    </svg>
                                </div>
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-4);">AI-Powered Matching</h3>
                                <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed); margin-bottom: var(--space-4);">Our proprietary machine learning algorithms analyze over 200 data points to identify perfect job-candidate matches, considering not just skills and experience, but also company culture, growth opportunities, and career aspirations.</p>
                                <ul style="color: var(--text-secondary); font-size: var(--font-size-sm); padding-left: var(--space-5);">
                                    <li style="margin-bottom: var(--space-2);">Behavioral compatibility analysis</li>
                                    <li style="margin-bottom: var(--space-2);">Skill gap identification and recommendations</li>
                                    <li style="margin-bottom: var(--space-2);">Career trajectory prediction modeling</li>
                                </ul>
                            </div>
                            <div class="card" style="padding: var(--space-8); height: 100%;">
                                <div style="width: 64px; height: 64px; background: var(--success-light); color: var(--success); border-radius: var(--border-radius-xl); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M9 12l2 2 4-4"/>
                                        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                        <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                                        <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                                    </svg>
                                </div>
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-4);">Human-Centric Design</h3>
                                <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed); margin-bottom: var(--space-4);">While technology powers our platform, human experiences guide our design. We conduct extensive user research to ensure our platform serves the real needs of job seekers and employers at every stage of their journey.</p>
                                <ul style="color: var(--text-secondary); font-size: var(--font-size-sm); padding-left: var(--space-5);">
                                    <li style="margin-bottom: var(--space-2);">Continuous user feedback integration</li>
                                    <li style="margin-bottom: var(--space-2);">Accessibility-first interface design</li>
                                    <li style="margin-bottom: var(--space-2);">Personalized career guidance and coaching</li>
                                </ul>
                            </div>
                            <div class="card" style="padding: var(--space-8); height: 100%;">
                                <div style="width: 64px; height: 64px; background: var(--warning-light); color: var(--warning); border-radius: var(--border-radius-xl); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 3v5h5"/>
                                        <path d="M21 21v-5h-5"/>
                                        <path d="M21 3L9 15l-6-6"/>
                                        <rect width="6" height="6" x="14" y="14" rx="1"/>
                                        <rect width="6" height="6" x="4" y="4" rx="1"/>
                                    </svg>
                                </div>
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-4);">Data-Driven Insights</h3>
                                <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed); margin-bottom: var(--space-4);">We leverage comprehensive market data and hiring trends to provide actionable insights that help both candidates and employers make informed decisions about their careers and hiring strategies.</p>
                                <ul style="color: var(--text-secondary); font-size: var(--font-size-sm); padding-left: var(--space-5);">
                                    <li style="margin-bottom: var(--space-2);">Real-time salary benchmarking</li>
                                    <li style="margin-bottom: var(--space-2);">Industry trend analysis and forecasting</li>
                                    <li style="margin-bottom: var(--space-2);">Skills demand and supply mapping</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Company Values -->
                <section style="padding: var(--space-16) 0; background: var(--surface);">
                    <div class="container">
                        <h2 style="text-align: center; font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-12);">Our Values</h2>
                        <div class="grid grid--3">
                            <div class="card" style="text-align: center; padding: var(--space-8);">
                                <div style="width: 64px; height: 64px; background: var(--success-light); color: var(--success); border-radius: var(--border-radius-xl); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-3);">Excellence</h3>
                                <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed);">We strive for excellence in everything we do, from our platform technology to our customer service, ensuring the highest quality experience for our users.</p>
                            </div>
                            <div class="card" style="text-align: center; padding: var(--space-8);">
                                <div style="width: 64px; height: 64px; background: var(--primary-light); color: var(--primary); border-radius: var(--border-radius-xl); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-3);">Integrity</h3>
                                <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed);">Trust is the foundation of every great relationship. We operate with complete transparency and honesty in all our interactions.</p>
                            </div>
                            <div class="card" style="text-align: center; padding: var(--space-8);">
                                <div style="width: 64px; height: 64px; background: var(--warning-light); color: var(--warning); border-radius: var(--border-radius-xl); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.062a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                                    </svg>
                                </div>
                                <h3 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-3);">Innovation</h3>
                                <p style="color: var(--text-secondary); line-height: var(--line-height-relaxed);">We continuously push boundaries and embrace new technologies to create better solutions for the evolving world of work.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Statistics -->
                <section style="padding: var(--space-20) 0;">
                    <h2 style="text-align: center; font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-12);">Impact by Numbers</h2>
                    <div class="grid grid--4">
                        <div class="card" style="text-align: center; padding: var(--space-8);">
                            <div style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">2.5M+</div>
                            <p style="color: var(--text); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);">Active Job Seekers</p>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Professionals trust our platform to find their next opportunity</p>
                        </div>
                        <div class="card" style="text-align: center; padding: var(--space-8);">
                            <div style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">15,000+</div>
                            <p style="color: var(--text); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);">Company Partners</p>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">From startups to Fortune 500 companies</p>
                        </div>
                        <div class="card" style="text-align: center; padding: var(--space-8);">
                            <div style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">850K+</div>
                            <p style="color: var(--text); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);">Successful Hires</p>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Lives changed through meaningful connections</p>
                        </div>
                        <div class="card" style="text-align: center; padding: var(--space-8);">
                            <div style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">50+</div>
                            <p style="color: var(--text); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);">Countries</p>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Global reach with local expertise</p>
                        </div>
                    </div>
                </section>
                
                <!-- Leadership Team -->
                <section style="padding: var(--space-20) 0; background: var(--surface);">
                    <div class="container">
                        <h2 style="text-align: center; font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-4);">Leadership Team</h2>
                        <p style="text-align: center; color: var(--text-secondary); font-size: var(--font-size-lg); margin-bottom: var(--space-16); max-width: 600px; margin-left: auto; margin-right: auto;">Meet the visionaries and industry experts who are driving WorkLoom's mission to transform the future of work.</p>
                        <div class="grid grid--3" style="gap: var(--space-8);">
                            ${this.renderLeadershipTeam()}
                        </div>
                    </div>
                </section>
                
                <!-- Company Culture -->
                <section style="padding: var(--space-20) 0;">
                    <div class="grid grid--2" style="gap: var(--space-12); align-items: center;">
                        <div>
                            <h2 style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-6);">Our Culture</h2>
                            <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--space-4); color: var(--text-secondary);">At WorkLoom, we believe that great products are built by great people. Our culture is rooted in collaboration, continuous learning, and making a meaningful impact on the world. We've intentionally crafted an environment where every team member can thrive, grow, and contribute to our shared mission of connecting talent with opportunity.</p>
                            <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--space-4); color: var(--text-secondary);">We foster psychological safety where bold ideas are welcomed, mistakes are learning opportunities, and diverse perspectives are not just accepted but actively sought. Our remote-first approach means talent isn't limited by geography, and our flexible work arrangements recognize that peak performance happens when people can work in ways that suit their lives.</p>
                            <p style="line-height: var(--line-height-relaxed); margin-bottom: var(--space-6); color: var(--text-secondary);">From our monthly innovation days where anyone can pitch new ideas, to our mentorship programs that pair junior team members with industry veterans, we're committed to creating an environment where everyone can reach their full potential while doing work that matters.</p>
                            <div style="display: flex; flex-wrap: wrap; gap: var(--space-3);">
                                <span class="tag" style="background: var(--primary-light); color: var(--primary); padding: var(--space-2) var(--space-4);">Remote-First</span>
                                <span class="tag" style="background: var(--success-light); color: var(--success); padding: var(--space-2) var(--space-4);">Inclusive</span>
                                <span class="tag" style="background: var(--warning-light); color: var(--warning); padding: var(--space-2) var(--space-4);">Innovation-Driven</span>
                                <span class="tag" style="background: var(--primary-light); color: var(--primary); padding: var(--space-2) var(--space-4);">Growth-Oriented</span>
                                <span class="tag" style="background: var(--success-light); color: var(--success); padding: var(--space-2) var(--space-4);">Purpose-Driven</span>
                                <span class="tag" style="background: var(--warning-light); color: var(--warning); padding: var(--space-2) var(--space-4);">Collaborative</span>
                            </div>
                        </div>
                        <div>
                            <div class="grid grid--2" style="gap: var(--space-4);">
                                <div class="card" style="padding: var(--space-6); text-align: center;">
                                    <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">4.9/5</div>
                                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Employee Satisfaction</p>
                                </div>
                                <div class="card" style="padding: var(--space-6); text-align: center;">
                                    <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">95%</div>
                                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Retention Rate</p>
                                </div>
                                <div class="card" style="padding: var(--space-6); text-align: center;">
                                    <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">45+</div>
                                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Nationalities</p>
                                </div>
                                <div class="card" style="padding: var(--space-6); text-align: center;">
                                    <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--primary); margin-bottom: var(--space-2);">$5K</div>
                                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Annual Learning Budget</p>
                                </div>
                            </div>
                            <div class="card" style="margin-top: var(--space-4); padding: var(--space-6);">
                                <h4 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-4);">Employee Benefits</h4>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--text-secondary);">
                                    <div>• Unlimited PTO</div>
                                    <div>• Mental Health Support</div>
                                    <div>• Equity Package</div>
                                    <div>• Home Office Setup</div>
                                    <div>• Health & Dental</div>
                                    <div>• Parental Leave</div>
                                    <div>• Conference Budget</div>
                                    <div>• Team Retreats</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Office Locations -->
                <section style="padding: var(--space-16) 0; background: var(--surface);">
                    <div class="container">
                        <h2 style="text-align: center; font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text); margin-bottom: var(--space-12);">Global Presence</h2>
                        <div class="grid grid--3">
                            <div class="card" style="text-align: center; padding: var(--space-6);">
                                <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-3);">San Francisco HQ</h3>
                                <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">123 Market Street</p>
                                <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">San Francisco, CA 94105</p>
                                <p style="color: var(--muted); font-size: var(--font-size-sm);">Engineering & Product Hub</p>
                            </div>
                            <div class="card" style="text-align: center; padding: var(--space-6);">
                                <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-3);">New York Office</h3>
                                <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">456 Broadway</p>
                                <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">New York, NY 10013</p>
                                <p style="color: var(--muted); font-size: var(--font-size-sm);">Sales & Marketing Center</p>
                            </div>
                            <div class="card" style="text-align: center; padding: var(--space-6);">
                                <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-3);">London Office</h3>
                                <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">789 Canary Wharf</p>
                                <p style="color: var(--text-secondary); margin-bottom: var(--space-2);">London, UK E14 5AB</p>
                                <p style="color: var(--muted); font-size: var(--font-size-sm);">European Operations</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        document.getElementById('app-content').innerHTML = content;
    }
    
    renderLeadershipTeam() {
        const team = [
            {
                name: 'Sarah Chen',
                role: 'CEO & Co-Founder',
                image: 'SC',
                background: 'Former VP of Engineering at Google, Stanford CS PhD',
                description: 'Sarah brings 15 years of experience in scaling technology platforms and building world-class engineering teams. She previously led product development for Google Search and holds a PhD in Computer Science from Stanford University. Her vision for WorkLoom stems from her belief that technology should empower human potential.',
                linkedin: '#'
            },
            {
                name: 'Marcus Rodriguez',
                role: 'CTO & Co-Founder',
                image: 'MR',
                background: 'Ex-Meta Senior Engineer, MIT Alumni',
                description: 'Marcus is a seasoned technology leader with deep expertise in distributed systems and machine learning. At Meta, he architected recommendation systems serving billions of users. He holds degrees from MIT and has been recognized as a top engineering talent by Forbes 30 Under 30.',
                linkedin: '#'
            },
            {
                name: 'Emily Thompson',
                role: 'Chief People Officer',
                image: 'ET',
                background: 'Former LinkedIn Head of Talent, Harvard MBA',
                description: 'Emily revolutionized talent acquisition strategies at LinkedIn, where she led teams responsible for connecting millions of professionals with opportunities. With an MBA from Harvard Business School and 12 years in HR leadership, she champions inclusive hiring practices and employee development.',
                linkedin: '#'
            },
            {
                name: 'David Kim',
                role: 'Head of Product',
                image: 'DK',
                background: 'Ex-Uber Principal PM, Berkeley Engineering',
                description: 'David led product initiatives at Uber that transformed how millions of people work and earn income in the gig economy. His background in behavioral psychology and engineering from UC Berkeley helps him design intuitive user experiences that solve real-world employment challenges.',
                linkedin: '#'
            },
            {
                name: 'Rachel Foster',
                role: 'VP of Marketing',
                image: 'RF',
                background: 'Former Salesforce Marketing Director, Wharton MBA',
                description: 'Rachel built and scaled marketing teams at Salesforce, driving growth from startup to Fortune 500. Her data-driven approach and customer-centric mindset have generated over $500M in revenue. She holds an MBA from Wharton and is passionate about authentic brand storytelling.',
                linkedin: '#'
            },
            {
                name: 'James Wilson',
                role: 'Chief Financial Officer',
                image: 'JW',
                background: 'Ex-Goldman Sachs VP, CPA, Northwestern Kellogg MBA',
                description: 'James brings Wall Street expertise to WorkLoom\'s financial strategy, having previously managed portfolios worth over $2B at Goldman Sachs. His analytical rigor and strategic insight have been instrumental in WorkLoom\'s funding rounds and sustainable growth trajectory.',
                linkedin: '#'
            }
        ];
        
        return team.map(member => `
            <div class="card" style="text-align: center; padding: var(--space-8); height: 100%;">
                <div style="width: 80px; height: 80px; background: var(--primary); color: white; border-radius: var(--border-radius-full); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold);">${member.image}</div>
                <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text); margin-bottom: var(--space-2);">${member.name}</h3>
                <p style="color: var(--primary); font-weight: var(--font-weight-medium); margin-bottom: var(--space-3); font-size: var(--font-size-sm);">${member.role}</p>
                <p style="color: var(--muted); font-size: var(--font-size-xs); margin-bottom: var(--space-4); font-weight: var(--font-weight-medium);">${member.background}</p>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm); line-height: var(--line-height-relaxed); margin-bottom: var(--space-6);">${member.description}</p>
                <a href="${member.linkedin}" class="btn btn--outline btn--small" style="margin-top: auto;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: var(--space-1);">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                        <rect x="2" y="9" width="4" height="12"/>
                        <circle cx="4" cy="4" r="2"/>
                    </svg>
                    LinkedIn
                </a>
            </div>
        `).join('');
    }
    
    renderContact() {
        const content = '<div class="container"><div class="grid grid--2" style="max-width: 800px; margin: 0 auto;"><div><h1 style="font-size: var(--font-size-3xl); margin-bottom: var(--space-6);">Get in Touch</h1><p style="color: var(--text-secondary);">Have questions? We\'d love to hear from you.</p></div><div class="card"><form id="contact-form"><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" required></div><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" required></div><div class="form-group"><label class="form-label">Message</label><textarea class="form-textarea" rows="5" required></textarea></div><button type="submit" class="btn btn--primary" style="width: 100%;">Send Message</button></form></div></div></div>';
        document.getElementById('app-content').innerHTML = content;
        document.getElementById('contact-form').addEventListener('submit', (e) => { e.preventDefault(); this.showToast('Message sent successfully!', 'success'); });
    }
    
    renderSignIn() {
        const content = '<div class="container"><div class="card" style="max-width: 400px; margin: var(--space-16) auto;"><h1 style="text-align: center; margin-bottom: var(--space-8);">Sign In to WorkLoom</h1><form id="signin-form"><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="signin-email" required></div><div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" id="signin-password" required></div><button type="submit" class="btn btn--primary" style="width: 100%;">Sign In</button></form><p style="text-align: center; color: var(--text-secondary); margin-top: var(--space-4);">Don\'t have an account? <a href="#/auth/signup" style="color: var(--primary);">Sign up</a></p></div></div>';
        document.getElementById('app-content').innerHTML = content;
        document.getElementById('signin-form').addEventListener('submit', (e) => { e.preventDefault(); this.handleSignIn(); });
    }
    
    renderSignUp() {
        const content = '<div class="container"><div class="card" style="max-width: 400px; margin: var(--space-16) auto;"><h1 style="text-align: center; margin-bottom: var(--space-8);">Join WorkLoom</h1><form id="signup-form"><div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" id="signup-name" required></div><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="signup-email" required></div><div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" id="signup-password" required minlength="8"></div><div class="form-group"><label class="form-label">Confirm Password</label><input type="password" class="form-input" id="signup-confirm" required></div><button type="submit" class="btn btn--primary" style="width: 100%;">Create Account</button></form><p style="text-align: center; color: var(--text-secondary); margin-top: var(--space-4);">Already have an account? <a href="#/auth/signin" style="color: var(--primary);">Sign in</a></p></div></div>';
        document.getElementById('app-content').innerHTML = content;
        document.getElementById('signup-form').addEventListener('submit', (e) => { e.preventDefault(); this.handleSignUp(); });
    }
    
    render404() {
        document.getElementById('app-content').innerHTML = '<div class="container"><div style="text-align: center; padding: var(--space-20) 0;"><h1 style="font-size: var(--font-size-4xl); margin-bottom: var(--space-4);">404</h1><h2 style="margin-bottom: var(--space-6);">Page Not Found</h2><p style="color: var(--text-secondary); margin-bottom: var(--space-8);">The page you\'re looking for doesn\'t exist.</p><a href="#/" class="btn btn--primary">Go Home</a></div></div>';
    }
    
    renderJobDetail(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) { this.render404(); return; }
        const content = `<div class="container"><button class="btn btn--ghost" onclick="history.back()" style="margin-bottom: var(--space-6);">← Back to Jobs</button><div class="card"><div class="job-card__header"><div class="job-card__logo" style="width: 64px; height: 64px; font-size: var(--font-size-xl);">${job.logo}</div><div class="job-card__info"><h1 class="job-card__title" style="font-size: var(--font-size-2xl);">${job.title}</h1><p class="job-card__company" style="font-size: var(--font-size-lg);">${job.company}</p><div class="job-card__meta"><span>${job.location}</span><span>•</span><span>${job.type}</span></div></div></div><div class="job-card__tags" style="margin: var(--space-6) 0;">${job.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div><div style="margin-bottom: var(--space-6);"><h2 style="margin-bottom: var(--space-4);">Job Description</h2><p style="line-height: var(--line-height-relaxed);">${job.description}</p></div><div style="margin-bottom: var(--space-6);"><h2 style="margin-bottom: var(--space-4);">Requirements</h2><ul style="padding-left: var(--space-5);">${job.requirements.map(req => `<li style="margin-bottom: var(--space-2);">${req}</li>`).join('')}</ul></div><div><h2 style="margin-bottom: var(--space-4);">Benefits</h2><ul style="padding-left: var(--space-5);">${job.benefits.map(benefit => `<li style="margin-bottom: var(--space-2);">${benefit}</li>`).join('')}</ul></div><div style="margin-top: var(--space-8); text-align: center;"><div class="job-card__salary" style="font-size: var(--font-size-lg); margin-bottom: var(--space-4);">$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}</div><div style="display: flex; gap: var(--space-3); justify-content: center;"><button class="btn btn--primary btn--large" onclick="app.applyToJob(${job.id})">Apply Now</button><button class="btn btn--outline btn--large" onclick="app.toggleSaveJob(${job.id})">${this.savedJobs.has(job.id) ? 'Saved' : 'Save Job'}</button></div></div></div></div>`;
        document.getElementById('app-content').innerHTML = content;
    }
}

const app = new WorkLoomApp();
window.app = app;