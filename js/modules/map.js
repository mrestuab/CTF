// Map Controller Module
// Handles interactive world map rendering using Leaflet.js with cyber theme

export class MapController {
    constructor(dataService) {
        this.dataService = dataService;
        this.mapCanvas = null;
        this.leafletMap = null;
        this.markers = new Map();
        this.connections = [];
        this.connectionLayers = [];
        this.isInitialized = false;
    }

    async init() {
        console.log('🗺️ Initializing Map Controller with Leaflet.js...');
        
        this.mapCanvas = document.getElementById('map-canvas');
        if (!this.mapCanvas) {
            throw new Error('Map canvas not found');
        }
        
        await this.setupLeafletMap();
        await this.renderTeamMarkers();
        this.setupEventListeners();
        this.startNetworkAnimation();
        
        this.isInitialized = true;
        console.log('✅ Map Controller ready');
    }

    async setupLeafletMap() {
        // Initialize Leaflet map with dark theme
        this.leafletMap = L.map('map-canvas', {
            center: [20, 0], // Center the world map
            zoom: 2,
            minZoom: 2,
            maxZoom: 6,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: false
        });

        // Add dark tile layer for cyber theme
        const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '',
            subdomains: 'abcd',
            maxZoom: 19
        });

        darkTiles.addTo(this.leafletMap);

        // Add custom CSS for cyber styling
        this.applyCyberStyling();
    }

    applyCyberStyling() {
        // Add custom cyber styling to the map
        const mapContainer = this.leafletMap.getContainer();
        mapContainer.style.background = '#0a0a0a';
        mapContainer.style.border = '1px solid #333';
        mapContainer.style.borderRadius = '8px';
        
        // Add custom CSS for the dark theme enhancement
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-container {
                background: #0a0a0a !important;
                filter: brightness(0.8) contrast(1.2) hue-rotate(180deg) invert(1);
            }
            .leaflet-tile {
                filter: brightness(0.8) contrast(1.1) saturate(1.2);
            }
        `;
        document.head.appendChild(style);
    }
    async renderTeamMarkers() {
        const teams = this.dataService.getTeams();
        
        teams.forEach(team => {
            this.createTeamMarker(team);
        });

        // Start network activity animation
        this.drawConnectionLines();
    }

    createTeamMarker(team) {
        // Create custom marker icon with team number
        const customIcon = L.divIcon({
            className: `cyber-marker team-${team.id}`,
            html: `
                <div class="marker-inner">
                    <div class="marker-number">${team.id}</div>
                    <div class="marker-pulse"></div>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });

        // Create marker
        const marker = L.marker([team.coordinates.lat, team.coordinates.lng], {
            icon: customIcon,
            title: `${team.name} - ${team.location}`
        });

        // Create popup content
        const popupContent = `
            <div class="team-popup">
                <h3>${team.name}</h3>
                <p><strong>Location:</strong> ${team.location}</p>
                <p><strong>IP:</strong> ${team.ip}</p>
                <p><strong>Members:</strong> ${team.members}</p>
                <p><strong>Status:</strong> <span class="status-${team.status.toLowerCase()}">${team.status}</span></p>
                <p><strong>Progress:</strong> ${team.progress}%</p>
            </div>
        `;

        marker.bindPopup(popupContent, {
            className: 'cyber-popup',
            maxWidth: 250
        });

        // Add click event
        marker.on('click', () => {
            this.selectTeam(team.id);
            this.updateCoordinatesDisplay(team.coordinates);
        });

        marker.addTo(this.leafletMap);
        this.markers.set(team.id, marker);
    }

    drawConnectionLines() {
        // Clear existing connections
        this.clearConnections();

        const networkActivity = this.dataService.getNetworkActivity();
        
        networkActivity.forEach(activity => {
            this.drawConnection(activity.source, activity.target, activity.type);
        });
    }

    drawConnection(source, target, type) {
        const color = type === 'attack' ? '#ff4757' : '#00d4ff';
        const weight = type === 'attack' ? 3 : 2;
        
        // Create animated line
        const connection = L.polyline([
            [source.lat, source.lng],
            [target.lat, target.lng]
        ], {
            color: color,
            weight: weight,
            opacity: 0.7,
            className: `connection-line ${type}`,
            dashArray: '10, 10'
        });

        connection.addTo(this.leafletMap);
        this.connectionLayers.push(connection);

        // Animate the connection
        this.animateConnection(connection);

        // Remove line after animation
        setTimeout(() => {
            if (this.leafletMap.hasLayer(connection)) {
                this.leafletMap.removeLayer(connection);
                const index = this.connectionLayers.indexOf(connection);
                if (index > -1) {
                    this.connectionLayers.splice(index, 1);
                }
            }
        }, 4000);
    }

    animateConnection(connection) {
        let offset = 0;
        const animate = () => {
            offset -= 2;
            if (connection._path) {
                connection._path.style.strokeDashoffset = offset;
            }
        };
        
        const interval = setInterval(animate, 100);
        setTimeout(() => clearInterval(interval), 4000);
    }

    clearConnections() {
        this.connectionLayers.forEach(layer => {
            if (this.leafletMap.hasLayer(layer)) {
                this.leafletMap.removeLayer(layer);
            }
        });
        this.connectionLayers = [];
    }

    selectTeam(teamId) {
        // Clear previous selections
        document.querySelectorAll('.cyber-marker').forEach(marker => {
            marker.classList.remove('selected');
        });

        // Select new team
        const marker = this.markers.get(teamId);
        if (marker) {
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.classList.add('selected');
            }
            
            // Center map on selected team
            const team = this.dataService.getTeam(teamId);
            if (team) {
                this.leafletMap.panTo([team.coordinates.lat, team.coordinates.lng], {
                    animate: true,
                    duration: 1
                });
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
        this.drawConnectionLines();

        // Update packet counter
        const stats = this.dataService.getGlobalStats();
        const counterElement = document.querySelector('.counter-value');
        if (counterElement) {
            counterElement.textContent = stats.packetsPerSecond;
        }
    }

    startNetworkAnimation() {
        // Start continuous network activity animation
        setInterval(() => {
            this.updateActivity();
        }, 3000);
    }

    setupEventListeners() {
        // Handle map click for coordinate display
        this.leafletMap.on('click', (e) => {
            this.updateCoordinatesDisplay(e.latlng);
        });

        // Handle marker hover effects
        this.leafletMap.on('mouseover', (e) => {
            if (e.layer.options && e.layer.options.title) {
                // Additional hover effects can be added here
            }
        });
    }

    handleResize() {
        if (this.isInitialized && this.leafletMap) {
            // Invalidate map size to handle container resize
            setTimeout(() => {
                this.leafletMap.invalidateSize();
            }, 100);
        }
    }

    // Public API methods
    zoomTo(coordinates, zoomLevel = 4) {
        if (this.leafletMap) {
            this.leafletMap.setView([coordinates.lat, coordinates.lng], zoomLevel, {
                animate: true,
                duration: 1
            });
        }
    }

    highlightTeam(teamId) {
        const marker = this.markers.get(teamId);
        if (marker) {
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.classList.add('highlighted');
                setTimeout(() => {
                    markerElement.classList.remove('highlighted');
                }, 2000);
            }
        }
    }
}