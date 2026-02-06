#!/usr/bin/env node
// Start All Services Script
// Launches all GIS CTF application components

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ServiceManager {
    constructor() {
        this.services = new Map();
        this.isShuttingDown = false;
    }

    async start() {
        console.log('🚀 Starting GIS CTF Application Services...');
        console.log('=' * 50);

        try {
            // Start services in order
            await this.startService('dns', 'node', ['server/alodek-dns.js'], { 
                env: { ...process.env, DNS_PORT: '5353' }
            });
            
            await this.delay(2000); // Wait for DNS to start
            
            await this.startService('backend', 'node', ['server/lemes-backend.js'], {
                env: { ...process.env, BACKEND_PORT: '3001' }
            });
            
            await this.delay(2000); // Wait for backend to start
            
            await this.startService('frontend', 'node', ['server/pingbox.js'], {
                env: { ...process.env, PORT: '3000' }
            });

            console.log('\n✅ All services started successfully!');
            console.log('\n🌐 Application URLs:');
            console.log('   Frontend: http://localhost:3000');
            console.log('   Backend API: http://localhost:3001');
            console.log('   DNS Server: 127.0.0.1:5353');
            console.log('\n💬 Press Ctrl+C to stop all services\n');

        } catch (error) {
            console.error('❌ Failed to start services:', error);
            await this.stopAll();
            process.exit(1);
        }
    }

    async startService(name, command, args, options = {}) {
        return new Promise((resolve, reject) => {
            console.log(`🔄 Starting ${name}...`);
            
            const service = spawn(command, args, {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe'],
                ...options
            });

            service.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[${name.toUpperCase()}] ${output.trim()}`);
            });

            service.stderr.on('data', (data) => {
                const output = data.toString();
                console.error(`[${name.toUpperCase()}] ERROR: ${output.trim()}`);
            });

            service.on('error', (error) => {
                console.error(`❌ Failed to start ${name}:`, error.message);
                reject(error);
            });

            service.on('exit', (code, signal) => {
                if (!this.isShuttingDown) {
                    console.log(`⚠️ Service ${name} exited with code ${code}, signal ${signal}`);
                }
                this.services.delete(name);
            });

            this.services.set(name, service);

            // Give service time to start
            setTimeout(() => {
                if (service.killed) {
                    reject(new Error(`Service ${name} was killed during startup`));
                } else {
                    console.log(`✅ ${name} started`);
                    resolve(service);
                }
            }, 1000);
        });
    }

    async stopAll() {
        this.isShuttingDown = true;
        console.log('\n🔄 Shutting down all services...');

        const stopPromises = [];
        
        this.services.forEach((service, name) => {
            stopPromises.push(this.stopService(name, service));
        });

        await Promise.all(stopPromises);
        console.log('✅ All services stopped');
    }

    async stopService(name, service) {
        return new Promise((resolve) => {
            console.log(`🛑 Stopping ${name}...`);
            
            service.kill('SIGTERM');
            
            const timeout = setTimeout(() => {
                console.log(`🔄 Force killing ${name}...`);
                service.kill('SIGKILL');
                resolve();
            }, 5000);

            service.on('exit', () => {
                clearTimeout(timeout);
                console.log(`✅ ${name} stopped`);
                resolve();
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupSignalHandlers() {
        process.on('SIGINT', async () => {
            console.log('\n\n🚨 Received SIGINT (Ctrl+C)');
            await this.stopAll();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n\n🚨 Received SIGTERM');
            await this.stopAll();
            process.exit(0);
        });

        process.on('uncaughtException', async (error) => {
            console.error('\n💥 Uncaught Exception:', error);
            await this.stopAll();
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            console.error('\n💥 Unhandled Rejection:', reason);
            await this.stopAll();
            process.exit(1);
        });
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new ServiceManager();
    
    manager.setupSignalHandlers();
    
    manager.start().catch((error) => {
        console.error('Failed to start service manager:', error);
        process.exit(1);
    });
}

export { ServiceManager };