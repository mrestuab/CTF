// Data Service Module
// Manages all data operations for the GIS CTF application

export class DataService {
    constructor() {
        this.teams = [];
        this.networkActivity = [];
        this.globalStats = {
            packetsPerSecond: 0,
            activeNodes: 5,
            totalThreats: 0
        };
        this.isConnected = false;
    }

    async init() {
        console.log('📊 Initializing Data Service...');
        
        // Load initial data
        await this.loadInitialData();
        
        // Setup data generators for demo purposes
        this.setupDataGenerators();
        
        this.isConnected = true;
        console.log('✅ Data Service ready');
    }

    async loadInitialData() {
        // Initialize teams data
        this.teams = [
            {
                id: 1,
                name: 'Team Glend',
                location: 'Tokyo, Japan',
                coordinates: { lat: 35.6762, lng: 139.6503 },
                ip: '192.168.1.101',
                members: 5,
                score: 0,
                solved: 0,
                status: 'LOW',
                progress: 0,
                color: '#ff4757',
                lastActivity: Date.now()
            },
            {
                id: 2,
                name: 'Team Bona',
                location: 'San Francisco, USA',
                coordinates: { lat: 37.7749, lng: -122.4194 },
                ip: '192.168.1.102',
                members: 5,
                score: 0,
                solved: 0,
                status: 'LOW',
                progress: 0,
                color: '#ffa502',
                lastActivity: Date.now()
            },
            {
                id: 3,
                name: 'Team Arief',
                location: 'Berlin, Germany',
                coordinates: { lat: 52.5200, lng: 13.4050 },
                ip: '192.168.1.103',
                members: 5,
                score: 0,
                solved: 0,
                status: 'LOW',
                progress: 88,
                color: '#2ed573',
                lastActivity: Date.now()
            },
            {
                id: 4,
                name: 'Team Irfan',
                location: 'Singapore',
                coordinates: { lat: 1.3521, lng: 103.8198 },
                ip: '192.168.1.104',
                members: 5,
                score: 0,
                solved: 0,
                status: 'LOW',
                progress: 59,
                color: '#ffd700',
                lastActivity: Date.now()
            },
            {
                id: 5,
                name: 'Team Deni',
                location: 'Sydney, Australia',
                coordinates: { lat: -33.8688, lng: 151.2093 },
                ip: '192.168.1.105',
                members: 5,
                score: 0,
                solved: 0,
                status: 'LOW',
                progress: 69,
                color: '#a55eea',
                lastActivity: Date.now()
            }
        ];

        // Initialize network activity
        this.generateNetworkActivity();
    }

    setupDataGenerators() {
        // Generate random network activity
        setInterval(() => {
            this.generateNetworkActivity();
            this.updateGlobalStats();
        }, 2000);

        // Update team activities
        setInterval(() => {
            this.updateTeamActivities();
        }, 5000);
    }

    generateNetworkActivity() {
        const activities = [];
        const activityCount = Math.floor(Math.random() * 10) + 5;
        
        for (let i = 0; i < activityCount; i++) {
            const sourceTeam = this.teams[Math.floor(Math.random() * this.teams.length)];
            const targetTeam = this.teams[Math.floor(Math.random() * this.teams.length)];
            
            if (sourceTeam.id !== targetTeam.id) {
                activities.push({
                    id: Date.now() + i,
                    source: sourceTeam.coordinates,
                    target: targetTeam.coordinates,
                    sourceTeam: sourceTeam.name,
                    targetTeam: targetTeam.name,
                    type: Math.random() > 0.7 ? 'attack' : 'scan',
                    timestamp: Date.now()
                });
            }
        }
        
        this.networkActivity = activities;
    }

    updateGlobalStats() {
        this.globalStats.packetsPerSecond = Math.floor(Math.random() * 200) + 50;
        this.globalStats.totalThreats = Math.floor(Math.random() * 50) + 10;
    }

    updateTeamActivities() {
        this.teams.forEach(team => {
            // Randomly update team scores and progress
            if (Math.random() > 0.7) {
                team.score += Math.floor(Math.random() * 100) + 10;
                team.solved += Math.floor(Math.random() * 2);
                team.progress = Math.min(100, team.progress + Math.floor(Math.random() * 5));
                team.lastActivity = Date.now();
                
                // Update status based on activity
                if (team.progress > 80) {
                    team.status = 'HIGH';
                } else if (team.progress > 40) {
                    team.status = 'MEDIUM';
                } else {
                    team.status = 'LOW';
                }
            }
        });
    }

    // Getter methods
    getTeams() {
        return [...this.teams]; // Return copy to prevent external modification
    }

    getTeam(id) {
        return this.teams.find(team => team.id === id);
    }

    getNetworkActivity() {
        return [...this.networkActivity];
    }

    getGlobalStats() {
        return { ...this.globalStats };
    }

    // Update methods
    updateTeamScore(teamId, points) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
            team.lastActivity = Date.now();
        }
    }

    updateTeamProgress(teamId, progress) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.progress = Math.max(0, Math.min(100, progress));
            team.lastActivity = Date.now();
        }
    }

    // Event system for data changes
    addEventListener(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }

    // Connection status
    isServiceConnected() {
        return this.isConnected;
    }
}