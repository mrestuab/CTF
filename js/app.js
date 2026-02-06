// Main Application Module - GIS CTF
// Using ES6+ Modules with croot.js inspired architecture

import { MapController } from './modules/map.js';
import { TeamsController } from './modules/teams.js';
import { DataService } from './services/data.js';
import { UIController } from './modules/ui.js';
import { NetworkMonitor } from './modules/network.js';

class GISCTFApp {
    constructor() {
        this.modules = new Map();
        this.services = new Map();
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing GIS CTF Application...');
            
            // Initialize services first
            await this.initServices();
            
            // Initialize modules
            await this.initModules();
            
            // Start the application
            await this.start();
            
            this.isInitialized = true;
            console.log('✅ GIS CTF Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize GIS CTF Application:', error);
            throw error;
        }
    }

    async initServices() {
        // Initialize Data Service
        const dataService = new DataService();
        await dataService.init();
        this.services.set('data', dataService);
        
        console.log('📊 Data Service initialized');
    }

    async initModules() {
        // Initialize UI Controller
        const uiController = new UIController();
        this.modules.set('ui', uiController);
        
        // Initialize Map Controller
        const mapController = new MapController(this.services.get('data'));
        await mapController.init();
        this.modules.set('map', mapController);
        
        // Initialize Teams Controller
        const teamsController = new TeamsController(this.services.get('data'));
        await teamsController.init();
        this.modules.set('teams', teamsController);
        
        // Initialize Network Monitor
        const networkMonitor = new NetworkMonitor();
        this.modules.set('network', networkMonitor);
        
        console.log('🔧 All modules initialized');
    }

    async start() {
        // Update time display
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('⚡ Application started');
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeElement = document.querySelector('.time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    startRealTimeUpdates() {
        // Update packet counter
        setInterval(() => {
            this.modules.get('network')?.updatePacketCounter();
        }, 1000);
        
        // Update team stats
        setInterval(() => {
            this.modules.get('teams')?.updateStats();
        }, 5000);
        
        // Update map activity
        setInterval(() => {
            this.modules.get('map')?.updateActivity();
        }, 3000);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.modules.get('map')?.handleResize();
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 Application paused');
            } else {
                console.log('📱 Application resumed');
            }
        });
    }

    getModule(name) {
        return this.modules.get(name);
    }

    getService(name) {
        return this.services.get(name);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new GISCTFApp();
        await app.init();
        
        // Make app available globally for debugging
        window.gisApp = app;
        
    } catch (error) {
        console.error('Failed to start application:', error);
        // Show error message to user
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: #ff4757; font-family: monospace;">
                <div style="text-align: center;">
                    <h2>🚨 Application Failed to Start</h2>
                    <p>Please check the console for more details.</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ff4757; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }
});