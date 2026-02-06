// UI Controller Module
// Handles general UI interactions, themes, and responsive design

export class UIController {
    constructor() {
        this.theme = 'dark'; // Default theme
        this.isFullscreen = false;
        this.notifications = [];
        this.isInitialized = false;
    }

    init() {
        console.log('🎨 Initializing UI Controller...');
        
        this.setupTheme();
        this.setupResponsiveHandlers();
        this.setupKeyboardShortcuts();
        this.createNotificationContainer();
        this.addLoadingStates();
        
        this.isInitialized = true;
        console.log('✅ UI Controller ready');
    }

    setupTheme() {
        // Apply theme class to body
        document.body.classList.add(`theme-${this.theme}`);
        
        // Add theme toggle button (if desired)
        this.createThemeToggle();
    }

    createThemeToggle() {
        // Create theme toggle button in header
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const themeToggle = document.createElement('button');
            themeToggle.classList.add('theme-toggle');
            themeToggle.innerHTML = '🌙'; // Moon icon for dark theme
            themeToggle.title = 'Toggle theme';
            themeToggle.style.cssText = `
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                margin-left: 1rem;
                transition: all 0.3s ease;
            `;
            
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            headerRight.insertBefore(themeToggle, headerRight.firstChild);
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.body.className = document.body.className.replace(/theme-\w+/, `theme-${this.theme}`);
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.theme === 'dark' ? '🌙' : '☀️';
        }
        
        this.showNotification(`Switched to ${this.theme} theme`, 'info');
    }

    setupResponsiveHandlers() {
        // Handle mobile menu if needed
        this.handleMobileLayout();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
    }

    handleMobileLayout() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-layout', isMobile);
        
        if (isMobile) {
            this.optimizeForMobile();
        }
    }

    optimizeForMobile() {
        // Add mobile-specific optimizations
        const header = document.querySelector('.header');
        if (header) {
            header.style.flexDirection = 'column';
            header.style.gap = '1rem';
        }
        
        // Optimize teams grid for mobile
        const teamsContainer = document.querySelector('.teams-container');
        if (teamsContainer) {
            teamsContainer.style.gridTemplateColumns = '1fr';
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update mobile layout
        this.handleMobileLayout();
        
        // Emit resize event for other modules
        const resizeEvent = new CustomEvent('appResize', {
            detail: { width, height }
        });
        window.dispatchEvent(resizeEvent);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Check for modifier keys
            const isCtrl = event.ctrlKey || event.metaKey;
            
            switch (event.key) {
                case 'F11':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
                    
                case 't':
                    if (isCtrl) {
                        event.preventDefault();
                        this.toggleTheme();
                    }
                    break;
                    
                case 'r':
                    if (isCtrl && event.shiftKey) {
                        event.preventDefault();
                        this.refreshApplication();
                    }
                    break;
                    
                case 'Escape':
                    this.handleEscapeKey();
                    break;
                    
                default:
                    // Handle number keys for team selection
                    if (event.key >= '1' && event.key <= '5') {
                        const teamId = parseInt(event.key);
                        this.selectTeam(teamId);
                    }
                    break;
            }
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                this.showNotification('Entered fullscreen mode', 'info');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.isFullscreen = false;
                this.showNotification('Exited fullscreen mode', 'info');
            });
        }
    }

    refreshApplication() {
        this.showNotification('Refreshing application...', 'info');
        
        // Trigger refresh for all modules
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    handleEscapeKey() {
        // Clear selections
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Close any open dialogs or modals
        this.closeAllModals();
    }

    selectTeam(teamId) {
        const teamsController = window.gisApp?.getModule('teams');
        if (teamsController) {
            teamsController.selectTeam(teamId);
        }
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification-${type}`);
        notification.style.cssText = `
            background: rgba(12, 20, 39, 0.95);
            border: 1px solid ${this.getNotificationColor(type)};
            color: ${this.getNotificationColor(type)};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            backdrop-filter: blur(10px);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${this.getNotificationIcon(type)}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">&times;</button>
            </div>
        `;
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        // Click to remove
        notification.addEventListener('click', () => {
            notification.remove();
        });
        
        this.notifications.push({ message, type, timestamp: Date.now() });
    }

    getNotificationColor(type) {
        const colors = {
            info: '#00d4ff',
            success: '#2ed573',
            warning: '#ffa502',
            error: '#ff4757'
        };
        return colors[type] || colors.info;
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    addLoadingStates() {
        // Add loading spinner utility
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #00d4ff;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
        `;
        document.head.appendChild(style);
    }

    showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.classList.add('loading-overlay');
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div class="loading-spinner" style="width: 40px; height: 40px; margin-bottom: 1rem;"></div>
                <div>${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    hideLoading(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal, .dialog, .popup').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Animation utilities
    animateElement(element, animation, duration = 300) {
        return new Promise(resolve => {
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    // Public API methods
    setTheme(theme) {
        this.theme = theme;
        this.setupTheme();
    }

    getTheme() {
        return this.theme;
    }

    isReady() {
        return this.isInitialized;
    }
}