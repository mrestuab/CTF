# GIS CTF Application

![GIS CTF Banner](https://img.shields.io/badge/GIS-CTF-blue?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge)

A sophisticated Geographic Information System (GIS) application designed for Capture The Flag (CTF) competitions. Built with modern web technologies and featuring real-time team monitoring, network activity visualization, and interactive world maps.

## 🎆 Features

### Interactive World Map
- **Real-time team location tracking** with animated markers
- **Dynamic network activity visualization** with connection lines
- **Geographic coordinate display** with click-to-inspect functionality
- **Responsive design** that works on all screen sizes

### Team Management Dashboard
- **Live team statistics** (score, challenges solved, progress)
- **Real-time progress bars** with color-coded status indicators
- **Team information cards** with location and IP details
- **Activity monitoring** with last-activity timestamps

### Network Monitoring
- **Packet-per-second counter** with real-time updates
- **Threat level assessment** (LOW/MEDIUM/HIGH)
- **Active node monitoring** with status indicators
- **Network pulse visualization** on the map

### Real-time Updates
- **WebSocket connections** for instant data synchronization
- **Live scoring updates** as teams complete challenges
- **Dynamic threat level changes** based on network activity
- **Responsive UI updates** without page refreshes

## 🛠️ Technology Stack

### Frontend
- **Vanilla JavaScript ES6+ Modules** for modular architecture
- **CSS3** with modern animations and responsive design
- **Component-based structure** inspired by croot.js framework
- **No external dependencies** - pure web standards

### Backend & Infrastructure
- **Lemes Backend** - Lightweight API server with WebSocket support
- **Pingbox Frontend Server** - High-performance static file serving
- **Alodek DNS Server** - Local domain resolution for development
- **Express.js** for API endpoints and middleware

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure you have Node.js 16+ installed
node --version
npm --version
```

### Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd gis-ctf-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   # Start frontend server (Pingbox)
   npm start
   
   # In another terminal, start backend (optional)
   npm run backend
   
   # In another terminal, start DNS server (optional)
   npm run dns
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📚 Architecture

### Frontend Structure
```
js/
├── app.js                 # Main application entry point
├── modules/
│   ├── map.js             # Interactive map controller
│   ├── teams.js           # Team management and display
│   ├── ui.js              # UI controls and interactions
│   └── network.js         # Network monitoring
└── services/
    └── data.js            # Data management service
```

### Server Structure
```
server/
├── pingbox.js             # Frontend static file server
├── lemes-backend.js       # API server with WebSocket
└── alodek-dns.js          # Local DNS server
```

### CSS Structure
```
assets/css/
├── style.css              # Global styles and layout
├── map.css                # Map-specific styles
└── teams.css              # Team dashboard styles
```

## 🎮 Usage Guide

### Basic Operation

1. **View Team Locations**: Teams appear as colored markers on the world map
2. **Monitor Activity**: Watch real-time network connections between teams
3. **Check Statistics**: Team cards show scores, progress, and activity status
4. **Track Progress**: Progress bars update automatically as teams solve challenges

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-5` | Select team 1-5 |
| `Ctrl+T` | Toggle theme |
| `F11` | Toggle fullscreen |
| `Ctrl+Shift+R` | Refresh application |
| `Esc` | Clear selections |

### Team Information

Each team card displays:
- **Team Name** with unique icon
- **Geographic Location** (city, country)
- **IP Address** for network identification
- **Live Statistics**: Members, Score, Challenges Solved
- **Progress Bar** showing completion percentage
- **Activity Status** with last activity timestamp

## 🔧 Development

### Running in Development Mode

```bash
# Start frontend with development features
npm run dev

# Start backend server
npm run backend

# Start DNS server (uses port 5353 for development)
npm run dns
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production frontend server |
| `npm run dev` | Start development server with hot reload |
| `npm run backend` | Start Lemes backend API server |
| `npm run dns` | Start Alodek DNS server |
| `npm test` | Run tests (not implemented yet) |

### Adding New Teams

To add teams, modify the data in `js/services/data.js`:

```javascript
// Add to teams array in loadInitialData()
{
    id: 6,
    name: 'Team NewTeam',
    location: 'City, Country',
    coordinates: { lat: XX.XXXX, lng: XX.XXXX },
    ip: '192.168.1.106',
    members: 5,
    score: 0,
    solved: 0,
    status: 'LOW',
    progress: 0,
    color: '#custom-color',
    lastActivity: Date.now()
}
```

### Customizing the Map

The world map can be customized in `js/modules/map.js`:
- Add new continent outlines in `drawWorldOutline()`
- Modify grid spacing in `addGridLines()`
- Change marker styles in `createTeamMarker()`

## 🌐 Network Configuration

### DNS Setup

The Alodek DNS server provides local domain resolution:

```
gis-ctf.local          -> 127.0.0.1:3000  (Frontend)
api.gis-ctf.local      -> 127.0.0.1:3001  (Backend API)
backend.gis-ctf.local  -> 127.0.0.1:3001  (Backend)
team1.gis-ctf.local    -> 192.168.1.101   (Team 1)
team2.gis-ctf.local    -> 192.168.1.102   (Team 2)
# ... and so on for all teams
```

To use these domains, configure your system to use the DNS server:

**Windows:**
```powershell
# Add DNS server to network adapter
netsh interface ip set dns "Local Area Connection" static 127.0.0.1
```

**Linux/Mac:**
```bash
# Add to /etc/resolv.conf
echo "nameserver 127.0.0.1" | sudo tee -a /etc/resolv.conf
```

## 📊 API Documentation

### REST Endpoints

#### Teams API
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get specific team
- `POST /api/teams/:id/score` - Update team score

#### Network API
- `GET /api/network/stats` - Get network statistics
- `GET /api/network/activity` - Get network activity log

#### CTF API
- `GET /api/ctf/challenges` - Get available challenges
- `POST /api/ctf/submit` - Submit flag for challenge

### WebSocket Events

#### Client to Server
```javascript
// Join room for updates
{ type: 'join', room: 'teams' }

// Leave room
{ type: 'leave', room: 'teams' }

// Ping server
{ type: 'ping' }
```

#### Server to Client
```javascript
// Score update
{
  type: 'scoreUpdate',
  teamId: 1,
  newScore: 1500,
  points: 100
}

// Network update
{
  type: 'networkUpdate',
  data: {
    packetsPerSecond: 150,
    timestamp: 1640995200000
  }
}
```

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- **Touch-friendly interface** with larger tap targets
- **Responsive grid layout** that adapts to screen size
- **Mobile-optimized team cards** with simplified layout
- **Swipe gestures** for map navigation

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS protection** with configurable origins
- **Input validation** on all API endpoints
- **Rate limiting** on API requests (can be configured)
- **XSS protection** through CSP headers

## 🚫 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill process or use different port
set PORT=3001 && npm start
```

**DNS server permission denied:**
```bash
# Run DNS server on alternative port
set DNS_PORT=5353 && npm run dns
```

**Teams not updating:**
- Check browser console for JavaScript errors
- Verify WebSocket connection in Network tab
- Restart backend server

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚀 Deployment

### Production Build

```bash
# Install production dependencies only
npm ci --only=production

# Start all services
npm start &
npm run backend &
npm run dns &
```

### Docker Support (Future Enhancement)

```dockerfile
# Example Dockerfile structure
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔗 Related Projects

- [croot.js](https://croot.js.org) - JavaScript module framework inspiration
- [Lemes](https://github.com/n0z0/lemes) - Backend framework
- [Pingbox](https://github.com/n0z0/pingbox) - Frontend server
- [Alodek](https://github.com/n0z0/alodek) - DNS server

---

**Built with ❤️ for CTF competitions and cybersecurity education.**