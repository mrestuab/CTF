// Map Controller Module
// Handles interactive world map rendering and team location visualization

export class MapController {
    constructor(dataService) {
        this.dataService = dataService;
        this.mapCanvas = null;
        this.svgElement = null;
        this.markers = new Map();
        this.connections = [];
        this.isInitialized = false;
    }

    async init() {
        console.log('🗺️ Initializing Map Controller...');
        
        this.mapCanvas = document.getElementById('map-canvas');
        if (!this.mapCanvas) {
            throw new Error('Map canvas not found');
        }
        
        await this.setupMap();
        await this.renderTeamMarkers();
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ Map Controller ready');
    }

    async setupMap() {
        // Create SVG element for the world map
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.classList.add('world-map-svg');
        this.svgElement.setAttribute('viewBox', '0 0 1000 500');
        
        // Create a simplified world map outline
        await this.drawWorldOutline();
        
        this.mapCanvas.appendChild(this.svgElement);
    }

    async drawWorldOutline() {
        // Simplified world map paths (basic continents)
        const worldPaths = [
            // North America
            'M 100 100 Q 150 80 200 100 L 250 120 Q 280 140 250 180 L 200 200 Q 150 190 100 170 Z',
            // South America
            'M 180 220 Q 200 210 220 230 L 230 280 Q 225 320 210 340 L 190 350 Q 170 345 160 320 L 165 280 Q 170 240 180 220 Z',
            // Europe
            'M 450 120 Q 480 110 510 125 L 520 140 Q 515 155 500 160 L 480 155 Q 460 150 450 135 Z',
            // Africa
            'M 480 180 Q 520 170 540 200 L 550 260 Q 545 300 520 320 L 500 315 Q 480 310 470 280 L 475 240 Q 477 210 480 180 Z',
            // Asia
            'M 550 100 Q 650 90 750 110 L 800 130 Q 820 160 800 180 L 750 190 Q 700 185 650 180 L 600 175 Q 570 170 550 140 Z',
            // Australia
            'M 750 300 Q 800 295 830 310 L 835 330 Q 830 345 810 350 L 780 345 Q 760 340 750 325 Z'
        ];

        worldPaths.forEach((path, index) => {
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', path);
            pathElement.setAttribute('fill', 'rgba(100, 100, 100, 0.3)');
            pathElement.setAttribute('stroke', 'rgba(100, 100, 100, 0.5)');
            pathElement.setAttribute('stroke-width', '1');
            this.svgElement.appendChild(pathElement);
        });

        // Add grid lines
        this.addGridLines();
    }

    addGridLines() {
        // Vertical lines
        for (let i = 0; i <= 1000; i += 100) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', i);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', i);
            line.setAttribute('y2', 500);
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
            line.setAttribute('stroke-width', '0.5');
            this.svgElement.appendChild(line);
        }

        // Horizontal lines
        for (let i = 0; i <= 500; i += 50) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', i);
            line.setAttribute('x2', 1000);
            line.setAttribute('y2', i);
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
            line.setAttribute('stroke-width', '0.5');
            this.svgElement.appendChild(line);
        }
    }

    async renderTeamMarkers() {
        const teams = this.dataService.getTeams();
        
        teams.forEach(team => {
            this.createTeamMarker(team);
        });

        // Add connection lines between teams
        this.drawConnectionLines(teams);
    }

    createTeamMarker(team) {
        // Convert lat/lng to SVG coordinates (simplified projection)
        const x = ((team.coordinates.lng + 180) / 360) * 1000;
        const y = ((90 - team.coordinates.lat) / 180) * 500;

        // Create marker element
        const marker = document.createElement('div');
        marker.classList.add('map-marker', `team-${team.id}`);
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.title = `${team.name} - ${team.location}`;

        // Add click event
        marker.addEventListener('click', () => {
            this.selectTeam(team.id);
        });

        this.mapCanvas.appendChild(marker);
        this.markers.set(team.id, marker);
    }

    drawConnectionLines(teams) {
        // Clear existing connections
        this.clearConnections();

        const networkActivity = this.dataService.getNetworkActivity();
        
        networkActivity.forEach(activity => {
            this.drawConnection(activity.source, activity.target, activity.type);
        });
    }

    drawConnection(source, target, type) {
        const sourceX = ((source.lng + 180) / 360) * 1000;
        const sourceY = ((90 - source.lat) / 180) * 500;
        const targetX = ((target.lng + 180) / 360) * 1000;
        const targetY = ((90 - target.lat) / 180) * 500;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceX);
        line.setAttribute('y1', sourceY);
        line.setAttribute('x2', targetX);
        line.setAttribute('y2', targetY);
        line.setAttribute('stroke', type === 'attack' ? '#ff4757' : '#00d4ff');
        line.setAttribute('stroke-width', type === 'attack' ? '2' : '1');
        line.setAttribute('opacity', '0.6');
        line.classList.add('connection-line');
        
        // Add animation
        line.style.strokeDasharray = '5,5';
        line.style.animation = 'flow 2s linear infinite';

        this.svgElement.appendChild(line);
        this.connections.push(line);

        // Remove line after animation
        setTimeout(() => {
            if (line.parentNode) {
                line.parentNode.removeChild(line);
                const index = this.connections.indexOf(line);
                if (index > -1) {
                    this.connections.splice(index, 1);
                }
            }
        }, 3000);
    }

    clearConnections() {
        this.connections.forEach(connection => {
            if (connection.parentNode) {
                connection.parentNode.removeChild(connection);
            }
        });
        this.connections = [];
    }

    selectTeam(teamId) {
        // Clear previous selections
        this.markers.forEach(marker => {
            marker.classList.remove('selected');
        });

        // Select new team
        const marker = this.markers.get(teamId);
        if (marker) {
            marker.classList.add('selected');
            
            // Update coordinates display
            const team = this.dataService.getTeam(teamId);
            if (team) {
                this.updateCoordinatesDisplay(team.coordinates);
            }
        }
    }

    updateCoordinatesDisplay(coordinates) {
        const coordElement = document.querySelector('.map-coordinates span');
        if (coordElement) {
            coordElement.textContent = `LAT: ${coordinates.lat.toFixed(4)} | LNG: ${coordinates.lng.toFixed(4)}`;
        }
    }

    updateActivity() {
        if (!this.isInitialized) return;
        
        // Redraw connection lines with new activity
        const teams = this.dataService.getTeams();
        this.drawConnectionLines(teams);

        // Update packet counter
        const stats = this.dataService.getGlobalStats();
        const counterElement = document.querySelector('.counter-value');
        if (counterElement) {
            counterElement.textContent = stats.packetsPerSecond;
        }
    }

    setupEventListeners() {
        // Handle map canvas click for coordinate display
        this.mapCanvas.addEventListener('click', (event) => {
            if (event.target === this.mapCanvas || event.target === this.svgElement) {
                const rect = this.mapCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                // Convert back to lat/lng (simplified)
                const lng = ((x / this.mapCanvas.offsetWidth) * 360) - 180;
                const lat = 90 - ((y / this.mapCanvas.offsetHeight) * 180);
                
                this.updateCoordinatesDisplay({ lat, lng });
            }
        });
    }

    handleResize() {
        // Handle window resize - update marker positions if needed
        if (this.isInitialized) {
            // Could implement responsive marker repositioning here
            console.log('🔄 Map resize handled');
        }
    }

    // Public API methods
    zoomTo(coordinates, zoomLevel = 1) {
        // Could implement zooming functionality
        console.log(`🔍 Zooming to ${coordinates.lat}, ${coordinates.lng}`);
    }

    highlightTeam(teamId) {
        const marker = this.markers.get(teamId);
        if (marker) {
            marker.style.transform = 'scale(1.5)';
            setTimeout(() => {
                marker.style.transform = 'scale(1)';
            }, 2000);
        }
    }
}