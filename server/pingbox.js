#!/usr/bin/env node
// Pingbox Frontend Server
// Inspired by github.com/n0z0/pingbox
// High-performance static file server for frontend applications

import express from 'express';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import mime from 'mime-types';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

class PingboxServer {
    constructor(options = {}) {
        this.port = options.port || process.env.PORT || 3000;
        this.host = options.host || 'localhost';
        this.isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
        this.staticRoot = options.staticRoot || ROOT_DIR;
        this.app = express();
        
        console.log('🚀 Initializing Pingbox Server...');
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-eval'"], // Allow ES6 modules
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS middleware
        this.app.use(cors({
            origin: this.isDev ? '*' : ['http://localhost:3000'],
            credentials: true
        }));

        // Compression middleware
        this.app.use(compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            threshold: 1024
        }));

        // Logging middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                const status = res.statusCode;
                const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
                console.log(`${statusColor}${status}\x1b[0m ${req.method} ${req.url} - ${duration}ms`);
            });
            next();
        });

        // Custom headers for development
        if (this.isDev) {
            this.app.use((req, res, next) => {
                res.header('X-Pingbox-Server', 'Development');
                res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
                next();
            });
        }
    }

    setupRoutes() {
        // API health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                server: 'Pingbox',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // API status endpoint
        this.app.get('/api/status', (req, res) => {
            res.json({
                server: 'Pingbox Frontend Server',
                application: 'GIS CTF',
                environment: this.isDev ? 'development' : 'production',
                port: this.port,
                host: this.host,
                memory: process.memoryUsage(),
                uptime: {
                    seconds: Math.floor(process.uptime()),
                    formatted: this.formatUptime(process.uptime())
                }
            });
        });

        // Static file serving with enhanced features
        this.app.use('/', this.createStaticHandler());

        // SPA fallback - serve index.html for non-API routes
        this.app.get('*', (req, res) => {
            if (req.url.startsWith('/api/')) {
                res.status(404).json({ error: 'API endpoint not found' });
                return;
            }
            this.serveFile(req, res, 'index.html');
        });
    }

    createStaticHandler() {
        return (req, res, next) => {
            if (req.url.startsWith('/api/')) {
                return next();
            }

            let filePath = req.url === '/' ? '/index.html' : req.url;
            
            // Remove query parameters
            filePath = filePath.split('?')[0];
            
            // Remove leading slash
            if (filePath.startsWith('/')) {
                filePath = filePath.slice(1);
            }

            this.serveFile(req, res, filePath);
        };
    }

    serveFile(req, res, filePath) {
        const fullPath = join(this.staticRoot, filePath);
        
        // Security check - prevent directory traversal
        if (!fullPath.startsWith(this.staticRoot)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        try {
            if (!existsSync(fullPath)) {
                res.status(404).json({ error: 'File not found' });
                return;
            }

            const stat = statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Try to serve index.html from directory
                const indexPath = join(fullPath, 'index.html');
                if (existsSync(indexPath)) {
                    this.serveFile(req, res, join(filePath, 'index.html'));
                } else {
                    res.status(403).json({ error: 'Directory listing not allowed' });
                }
                return;
            }

            const content = readFileSync(fullPath);
            const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
            
            // Set appropriate headers
            res.set({
                'Content-Type': mimeType,
                'Content-Length': content.length,
                'Last-Modified': stat.mtime.toUTCString(),
                'ETag': `"${stat.size}-${stat.mtime.getTime()}"`
            });

            // Handle conditional requests
            const ifModifiedSince = req.headers['if-modified-since'];
            const ifNoneMatch = req.headers['if-none-match'];
            
            if (ifModifiedSince && new Date(ifModifiedSince) >= stat.mtime) {
                res.status(304).end();
                return;
            }
            
            if (ifNoneMatch && ifNoneMatch === `"${stat.size}-${stat.mtime.getTime()}"`) {
                res.status(304).end();
                return;
            }

            // Cache headers for static assets
            if (this.isStaticAsset(filePath)) {
                res.set('Cache-Control', this.isDev ? 'no-cache' : 'public, max-age=31536000');
            }

            res.send(content);
            
        } catch (error) {
            console.error('Error serving file:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    isStaticAsset(filePath) {
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
        const ext = extname(filePath).toLowerCase();
        return staticExtensions.includes(ext);
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }

    start() {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(this.port, this.host, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                console.log('✅ Pingbox Server started successfully!');
                console.log(`📡 Server running at: http://${this.host}:${this.port}`);
                console.log(`📁 Serving files from: ${this.staticRoot}`);
                console.log(`🔧 Environment: ${this.isDev ? 'development' : 'production'}`);
                console.log(`⚡ Ready to serve GIS CTF Application!\n`);
                
                resolve(server);
            });

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${this.port} is already in use`);
                    reject(error);
                } else {
                    console.error('❌ Server error:', error);
                    reject(error);
                }
            });
        });
    }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new PingboxServer();
    
    server.start().catch((error) => {
        console.error('Failed to start Pingbox server:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        console.log('\n🔄 Received SIGINT, shutting down gracefully...');
        process.exit(0);
    });
}

export { PingboxServer };