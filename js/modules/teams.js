// Teams Controller Module
// Handles team display, statistics, and real-time updates

export class TeamsController {
    constructor(dataService) {
        this.dataService = dataService;
        this.teamsContainer = null;
        this.teamCards = new Map();
        this.isInitialized = false;
    }

    async init() {
        console.log('👥 Initializing Teams Controller...');
        
        this.teamsContainer = document.getElementById('teams-container');
        if (!this.teamsContainer) {
            throw new Error('Teams container not found');
        }
        
        await this.renderTeams();
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ Teams Controller ready');
    }

    async renderTeams() {
        const teams = this.dataService.getTeams();
        
        // Clear existing teams
        this.teamsContainer.innerHTML = '';
        this.teamCards.clear();
        
        teams.forEach(team => {
            this.createTeamCard(team);
        });
    }

    createTeamCard(team) {
        const card = document.createElement('div');
        card.classList.add('team-card', `team-${team.id}`);
        card.dataset.teamId = team.id;
        
        card.innerHTML = this.getTeamCardHTML(team);
        
        // Add event listeners
        this.addCardEventListeners(card, team);
        
        this.teamsContainer.appendChild(card);
        this.teamCards.set(team.id, card);
    }

    getTeamCardHTML(team) {
        const statusClass = team.status.toLowerCase();
        const progressPercentage = team.progress;
        
        return `
            <div class="team-header">
                <div class="team-name">
                    <span class="icon">${this.getTeamIcon(team.id)}</span>
                    <span class="name">${team.name}</span>
                </div>
                <span class="team-badge team-${team.id}">TEAM ${team.id}</span>
            </div>
            
            <div class="team-info">
                <div class="team-location">
                    <span>📍</span>
                    <span>${team.location}</span>
                </div>
                <div class="team-ip">${team.ip}</div>
            </div>
            
            <div class="team-stats">
                <div class="stat-item">
                    <span class="stat-value">${team.members}</span>
                    <span class="stat-label">Members</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${team.score}</span>
                    <span class="stat-label">Score</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${team.solved}</span>
                    <span class="stat-label">Solved</span>
                </div>
            </div>
            
            <div class="team-status">
                <span class="status-badge">${team.status}</span>
                <span class="team-activity">⏱️ Pending: 0 submissions</span>
            </div>
            
            <div class="team-progress">
                <div class="progress-bar">
                    <div class="progress-fill team-${team.id}" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${progressPercentage}%</span>
                </div>
            </div>
        `;
    }

    getTeamIcon(teamId) {
        const icons = {
            1: '🔴', // Red heart for Team Glend
            2: '🛡️', // Shield for Team Bona
            3: '📚', // Green heart for Team Arief
            4: '🔑', // Yellow heart for Team Irfan
            5: '💜'  // Purple heart for Team Deni
        };
        return icons[teamId] || '👥';
    }

    addCardEventListeners(card, team) {
        // Click to highlight team on map
        card.addEventListener('click', () => {
            this.selectTeam(team.id);
        });
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            this.highlightTeam(team.id);
        });
        
        card.addEventListener('mouseleave', () => {
            this.unhighlightTeam(team.id);
        });
    }

    selectTeam(teamId) {
        // Remove previous selections
        this.teamCards.forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select current team
        const card = this.teamCards.get(teamId);
        if (card) {
            card.classList.add('selected');
            
            // Notify map controller to highlight team
            const mapController = window.gisApp?.getModule('map');
            if (mapController) {
                mapController.highlightTeam(teamId);
            }
        }
    }

    highlightTeam(teamId) {
        const card = this.teamCards.get(teamId);
        if (card) {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.zIndex = '10';
        }
    }

    unhighlightTeam(teamId) {
        const card = this.teamCards.get(teamId);
        if (card) {
            card.style.transform = '';
            card.style.zIndex = '';
        }
    }

    updateStats() {
        if (!this.isInitialized) return;
        
        const teams = this.dataService.getTeams();
        
        teams.forEach(team => {
            const card = this.teamCards.get(team.id);
            if (card) {
                this.updateTeamCard(card, team);
            }
        });
    }

    updateTeamCard(card, team) {
        // Update score
        const scoreElement = card.querySelector('.stat-item:nth-child(2) .stat-value');
        if (scoreElement && scoreElement.textContent !== team.score.toString()) {
            scoreElement.textContent = team.score;
            this.animateStatChange(scoreElement);
        }
        
        // Update solved count
        const solvedElement = card.querySelector('.stat-item:nth-child(3) .stat-value');
        if (solvedElement && solvedElement.textContent !== team.solved.toString()) {
            solvedElement.textContent = team.solved;
            this.animateStatChange(solvedElement);
        }
        
        // Update progress
        const progressFill = card.querySelector('.progress-fill');
        const progressLabel = card.querySelector('.progress-label span:last-child');
        if (progressFill && progressLabel) {
            progressFill.style.width = `${team.progress}%`;
            progressLabel.textContent = `${team.progress}%`;
        }
        
        // Update status
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge && statusBadge.textContent !== team.status) {
            statusBadge.textContent = team.status;
            statusBadge.className = `status-badge ${team.status.toLowerCase()}`;
        }
        
        // Update last activity time
        const activityElement = card.querySelector('.team-activity');
        if (activityElement) {
            const timeSince = this.getTimeSince(team.lastActivity);
            activityElement.innerHTML = `⏱️ Last activity: ${timeSince} ago`;
        }
    }

    animateStatChange(element) {
        element.style.transform = 'scale(1.2)';
        element.style.color = '#00ff88';
        
        setTimeout(() => {
            element.style.transform = '';
            element.style.color = '';
        }, 500);
    }

    getTimeSince(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    setupEventListeners() {
        // Listen for data updates
        this.dataService.addEventListener('teamsUpdated', () => {
            this.updateStats();
        });
        
        // Handle search/filter functionality
        const searchInput = document.querySelector('.teams-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTeams(e.target.value);
            });
        }
    }

    filterTeams(searchTerm) {
        const term = searchTerm.toLowerCase();
        
        this.teamCards.forEach((card, teamId) => {
            const team = this.dataService.getTeam(teamId);
            const shouldShow = !term || 
                team.name.toLowerCase().includes(term) ||
                team.location.toLowerCase().includes(term) ||
                team.ip.includes(term);
            
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // Public API methods
    getTeamCard(teamId) {
        return this.teamCards.get(teamId);
    }

    refreshTeams() {
        this.renderTeams();
    }

    addTeam(team) {
        this.createTeamCard(team);
    }

    removeTeam(teamId) {
        const card = this.teamCards.get(teamId);
        if (card) {
            card.remove();
            this.teamCards.delete(teamId);
        }
    }

    sortTeams(criteria = 'score') {
        const teams = this.dataService.getTeams();
        teams.sort((a, b) => {
            switch (criteria) {
                case 'score':
                    return b.score - a.score;
                case 'progress':
                    return b.progress - a.progress;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
        
        // Re-render in sorted order
        this.renderTeams();
    }
}