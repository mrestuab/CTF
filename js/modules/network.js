// Network Monitor Module
// Handles real-time network activity monitoring and packet counting

export class NetworkMonitor {
    constructor() {
        this.packetCount = 0;
        this.packetsPerSecond = 0;
        this.activeConnections = new Set();
        this.threatLevel = 'LOW';
        this.isMonitoring = false;
    }

    init() {
        console.log('📶 Initializing Network Monitor...');
        
        this.startMonitoring();
        this.updateDisplay();
        
        console.log('✅ Network Monitor ready');
    }

    startMonitoring() {
        this.isMonitoring = true;
        
        // Simulate network packet monitoring
        setInterval(() => {
            this.generateNetworkActivity();
        }, 100);
        
        // Update packets per second counter
        setInterval(() => {
            this.updatePacketsPerSecond();
        }, 1000);
        
        // Update threat assessment
        setInterval(() => {
            this.assessThreatLevel();
        }, 5000);
    }

    generateNetworkActivity() {
        if (!this.isMonitoring) return;
        
        // Simulate random packet generation
        const burstSize = Math.floor(Math.random() * 10) + 1;
        this.packetCount += burstSize;
        
        // Add some variability based on time
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Higher activity during "peak" hours (simulated)
        const peakMultiplier = (hour >= 9 && hour <= 17) ? 1.5 : 1.0;
        const randomMultiplier = 0.5 + Math.random();
        
        const activity = Math.floor(burstSize * peakMultiplier * randomMultiplier);
        this.packetsPerSecond += activity;
    }

    updatePacketsPerSecond() {
        // Calculate packets per second
        const currentPps = this.packetsPerSecond;
        
        // Add some smoothing
        this.packetsPerSecond = Math.max(50, Math.floor(currentPps * 0.9 + (Math.random() * 100)));
        
        // Reset for next calculation
        this.packetCount = 0;
        
        // Update display
        this.updatePacketCounter();
    }

    updatePacketCounter() {
        const counterElement = document.querySelector('.counter-value');
        if (counterElement) {
            const currentValue = parseInt(counterElement.textContent) || 0;
            const newValue = this.packetsPerSecond;
            
            // Animate the change if significant
            if (Math.abs(newValue - currentValue) > 10) {
                this.animateCounter(counterElement, currentValue, newValue);
            } else {
                counterElement.textContent = newValue;
            }
        }
    }

    animateCounter(element, from, to) {
        const duration = 500;
        const start = performance.now();
        const difference = to - from;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(from + (difference * easeOut));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    assessThreatLevel() {
        const pps = this.packetsPerSecond;
        let newThreatLevel;
        
        if (pps > 200) {
            newThreatLevel = 'HIGH';
        } else if (pps > 150) {
            newThreatLevel = 'MEDIUM';
        } else {
            newThreatLevel = 'LOW';
        }
        
        if (newThreatLevel !== this.threatLevel) {
            this.threatLevel = newThreatLevel;
            this.updateThreatDisplay();
            this.notifyThreatChange();
        }
    }

    updateThreatDisplay() {
        // Update active nodes status if threat level changes
        const statusElement = document.querySelector('.active-nodes');
        if (statusElement) {
            const nodeCount = this.threatLevel === 'HIGH' ? 7 : 
                            this.threatLevel === 'MEDIUM' ? 6 : 5;
            statusElement.textContent = `${nodeCount} ACTIVE NODES`;
            
            // Change color based on threat level
            statusElement.style.color = this.getThreatColor();
        }
    }

    getThreatColor() {
        switch (this.threatLevel) {
            case 'HIGH': return '#ff4757';
            case 'MEDIUM': return '#ffa502';
            case 'LOW': return '#2ed573';
            default: return '#00ff88';
        }
    }

    notifyThreatChange() {
        const uiController = window.gisApp?.getModule('ui');
        if (uiController) {
            const message = `Threat level changed to ${this.threatLevel}`;
            const type = this.threatLevel === 'HIGH' ? 'error' : 
                        this.threatLevel === 'MEDIUM' ? 'warning' : 'success';
            uiController.showNotification(message, type, 5000);
        }
        
        console.log(`🚨 Threat level: ${this.threatLevel}`);
    }

    updateDisplay() {
        // Update network activity visualization
        this.updateNetworkGrid();
    }

    updateNetworkGrid() {
        // Add visual network activity indicators
        const mapCanvas = document.querySelector('.map-canvas');
        if (mapCanvas) {
            this.addNetworkPulses(mapCanvas);
        }
    }

    addNetworkPulses(container) {
        // Remove old pulses
        container.querySelectorAll('.network-pulse').forEach(pulse => {
            pulse.remove();
        });
        
        // Add new pulses based on activity level
        const pulseCount = Math.floor(this.packetsPerSecond / 50);
        
        for (let i = 0; i < Math.min(pulseCount, 10); i++) {
            const pulse = document.createElement('div');
            pulse.classList.add('network-pulse');
            pulse.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${this.getThreatColor()};
                border-radius: 50%;
                animation: pulse 2s infinite;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: 0.7;
            `;
            
            container.appendChild(pulse);
            
            // Remove after animation
            setTimeout(() => {
                if (pulse.parentNode) {
                    pulse.remove();
                }
            }, 2000);
        }
    }

    // Connection monitoring
    addConnection(sourceTeam, targetTeam, type = 'data') {
        const connectionId = `${sourceTeam}-${targetTeam}-${Date.now()}`;
        this.activeConnections.add({
            id: connectionId,
            source: sourceTeam,
            target: targetTeam,
            type: type,
            timestamp: Date.now()
        });
        
        // Auto remove after 30 seconds
        setTimeout(() => {
            this.removeConnection(connectionId);
        }, 30000);
        
        return connectionId;
    }

    removeConnection(connectionId) {
        this.activeConnections.forEach(conn => {
            if (conn.id === connectionId) {
                this.activeConnections.delete(conn);
            }
        });
    }

    getActiveConnections() {
        return Array.from(this.activeConnections);
    }

    // Network statistics
    getNetworkStats() {
        return {
            packetsPerSecond: this.packetsPerSecond,
            threatLevel: this.threatLevel,
            activeConnections: this.activeConnections.size,
            uptime: this.getUptime()
        };
    }

    getUptime() {
        // Calculate uptime since initialization
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        const uptime = Date.now() - this.startTime;
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return {
            total: uptime,
            hours: hours,
            minutes: minutes % 60,
            seconds: seconds % 60,
            formatted: `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
        };
    }

    // Control methods
    startMonitoring() {
        this.isMonitoring = true;
        console.log('🟢 Network monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        console.log('🔴 Network monitoring stopped');
    }

    pauseMonitoring() {
        this.isMonitoring = false;
        console.log('⏸️ Network monitoring paused');
    }

    resumeMonitoring() {
        this.isMonitoring = true;
        console.log('▶️ Network monitoring resumed');
    }

    resetStats() {
        this.packetCount = 0;
        this.packetsPerSecond = 0;
        this.activeConnections.clear();
        this.threatLevel = 'LOW';
        console.log('🔄 Network stats reset');
    }
}