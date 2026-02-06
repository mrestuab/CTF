#!/usr/bin/env node
// Lemes Backend Server
// Inspired by github.com/n0z0/lemes
// Lightweight backend framework for API endpoints

import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';

class LemesBackend {
    constructor(options = {}) {
        this.port = options.port || process.env.BACKEND_PORT || 3001;
        this.host = options.host || 'localhost';
        this.app = express();
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        this.clients = new Set();
        this.rooms = new Map();
        
        console.log('🛠️ Initializing Lemes Backend...');
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        
        // CORS middleware
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:8080'],
            credentials: true
        }));
        
        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Compression middleware
        this.app.use(compression());
        
        // Request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.url}`);
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                server: 'Lemes Backend',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                connections: this.clients.size
            });
        });

        // Teams API endpoints
        this.setupTeamsAPI();
        
        // Network monitoring API
        this.setupNetworkAPI();
        
        // Real-time data API
        this.setupRealtimeAPI();
        
        // CTF specific endpoints
        this.setupCTFAPI();
    }

    setupTeamsAPI() {
        const router = express.Router();
        
        // Mock teams data
        let teams = [
            {
                id: 1,
                name: 'Team Glend',
                location: 'Tokyo, Japan',
                coordinates: { lat: 35.6762, lng: 139.6503 },
                ip: '192.168.1.101',
                members: 5,
                score: 1250,
                solved: 3,
                status: 'ACTIVE',
                progress: 75,
                lastActivity: Date.now() - 300000
            },
            {
                id: 2,
                name: 'Team Bona',
                location: 'San Francisco, USA',
                coordinates: { lat: 37.7749, lng: -122.4194 },
                ip: '192.168.1.102',
                members: 5,
                score: 980,
                solved: 2,
                status: 'ACTIVE',
                progress: 60,
                lastActivity: Date.now() - 180000
            }
            // Add more teams as needed
        ];
        
        // Get all teams
        router.get('/teams', (req, res) => {
            res.json({
                success: true,
                data: teams,
                count: teams.length
            });
        });
        
        // Get specific team
        router.get('/teams/:id', (req, res) => {
            const team = teams.find(t => t.id === parseInt(req.params.id));
            if (!team) {
                return res.status(404).json({ success: false, error: 'Team not found' });
            }
            res.json({ success: true, data: team });
        });
        
        // Update team score
        router.post('/teams/:id/score', (req, res) => {
            const team = teams.find(t => t.id === parseInt(req.params.id));
            if (!team) {
                return res.status(404).json({ success: false, error: 'Team not found' });
            }
            
            const { points, challenge } = req.body;
            team.score += points || 0;
            team.lastActivity = Date.now();
            
            if (challenge) {
                team.solved += 1;
            }
            
            // Broadcast update to WebSocket clients
            this.broadcastToRoom('teams', {
                type: 'scoreUpdate',
                teamId: team.id,
                newScore: team.score,
                points: points
            });
            
            res.json({ success: true, data: team });
        });
        
        this.app.use('/api', router);
    }

    setupNetworkAPI() {
        const router = express.Router();
        
        // Get network statistics
        router.get('/network/stats', (req, res) => {
            res.json({
                success: true,
                data: {
                    packetsPerSecond: Math.floor(Math.random() * 200) + 50,
                    activeConnections: Math.floor(Math.random() * 20) + 5,
                    threatLevel: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
                    uptime: process.uptime(),
                    timestamp: Date.now()
                }
            });
        });
        
        // Get network activity
        router.get('/network/activity', (req, res) => {
            const activities = [];
            for (let i = 0; i < 10; i++) {
                activities.push({
                    id: Date.now() + i,
                    source: `192.168.1.${Math.floor(Math.random() * 200) + 1}`,
                    target: `192.168.1.${Math.floor(Math.random() * 200) + 1}`,
                    type: Math.random() > 0.7 ? 'attack' : 'scan',
                    timestamp: Date.now() - Math.random() * 60000
                });
            }
            
            res.json({
                success: true,
                data: activities
            });
        });
        
        this.app.use('/api', router);
    }

    setupRealtimeAPI() {
        const router = express.Router();
        
        // Subscribe to real-time updates
        router.post('/realtime/subscribe', (req, res) => {
            const { clientId, rooms } = req.body;
            
            // Store subscription info (in production, use a database)
            rooms.forEach(room => {
                if (!this.rooms.has(room)) {
                    this.rooms.set(room, new Set());
                }
                this.rooms.get(room).add(clientId);
            });
            
            res.json({ success: true, message: 'Subscribed to rooms', rooms });
        });
        
        // Unsubscribe from updates
        router.post('/realtime/unsubscribe', (req, res) => {
            const { clientId, rooms } = req.body;
            
            rooms.forEach(room => {
                if (this.rooms.has(room)) {
                    this.rooms.get(room).delete(clientId);
                }
            });
            
            res.json({ success: true, message: 'Unsubscribed from rooms', rooms });
        });
        
        this.app.use('/api', router);
    }

    setupCTFAPI() {
        const router = express.Router();
        
        // Get CTF challenges
        router.get('/ctf/challenges', (req, res) => {
            const challenges = [
                {
                    id: 1,
                    name: 'Network Forensics',
                    category: 'forensics',
                    points: 100,
                    difficulty: 'easy',
                    solved: 15,
                    description: 'Analyze network traffic to find the flag'
                },
                {
                    id: 2,
                    name: 'SQL Injection',
                    category: 'web',
                    points: 200,
                    difficulty: 'medium',
                    solved: 8,
                    description: 'Find and exploit SQL injection vulnerability'
                }
            ];
            
            res.json({ success: true, data: challenges });
        });
        
        // Submit flag
        router.post('/ctf/submit', (req, res) => {
            const { teamId, challengeId, flag } = req.body;
            
            // In a real CTF, you'd validate the flag here
            const isCorrect = Math.random() > 0.3; // Simulate validation
            
            if (isCorrect) {
                this.broadcastToRoom('ctf', {
                    type: 'flagSubmission',
                    teamId,
                    challengeId,
                    correct: true,
                    timestamp: Date.now()
                });
                
                res.json({ success: true, correct: true, message: 'Correct flag!' });
            } else {
                res.json({ success: true, correct: false, message: 'Incorrect flag' });
            }
        });
        
        this.app.use('/api', router);
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            
            ws.id = this.generateClientId();
            this.clients.add(ws);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId: ws.id,
                timestamp: Date.now()
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket disconnected');
                this.clients.delete(ws);
                
                // Remove from all rooms
                this.rooms.forEach(clients => {
                    clients.delete(ws.id);
                });
            });
        });
        
        // Send periodic updates
        setInterval(() => {
            this.broadcastToRoom('network', {
                type: 'networkUpdate',
                data: {
                    packetsPerSecond: Math.floor(Math.random() * 200) + 50,
                    timestamp: Date.now()
                }
            });
        }, 5000);
    }

    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'join':
                if (message.room) {
                    if (!this.rooms.has(message.room)) {
                        this.rooms.set(message.room, new Set());
                    }
                    this.rooms.get(message.room).add(ws.id);
                    
                    ws.send(JSON.stringify({
                        type: 'joined',
                        room: message.room
                    }));
                }
                break;
                
            case 'leave':
                if (message.room && this.rooms.has(message.room)) {
                    this.rooms.get(message.room).delete(ws.id);
                    
                    ws.send(JSON.stringify({
                        type: 'left',
                        room: message.room
                    }));
                }
                break;
                
            case 'ping':
                ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now()
                }));
                break;
        }
    }

    broadcastToRoom(room, message) {
        if (!this.rooms.has(room)) return;
        
        const roomClients = this.rooms.get(room);
        const messageStr = JSON.stringify(message);
        
        this.clients.forEach(client => {
            if (roomClients.has(client.id) && client.readyState === 1) {
                client.send(messageStr);
            }
        });
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, this.host, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                console.log('✅ Lemes Backend started successfully!');
                console.log(`🚀 Backend server running at: http://${this.host}:${this.port}`);
                console.log(`🔌 WebSocket server ready for connections`);
                console.log(`📊 Ready to handle CTF data and real-time updates!\n`);
                
                resolve(this.server);
            });
        });
    }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const backend = new LemesBackend();
    
    backend.start().catch((error) => {
        console.error('Failed to start Lemes backend:', error);
        process.exit(1);
    });
}

export { LemesBackend };