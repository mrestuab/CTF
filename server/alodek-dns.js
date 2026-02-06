#!/usr/bin/env node
// Alodek DNS Server
// Inspired by github.com/n0z0/alodek
// Lightweight DNS server for local development

import dgram from 'dgram';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AlodekDNS {
    constructor(options = {}) {
        this.port = options.port || 53;
        this.host = options.host || '127.0.0.1';
        this.configFile = options.configFile || join(__dirname, 'dns-config.json');
        this.server = dgram.createSocket('udp4');
        this.dnsRecords = new Map();
        
        console.log('🌐 Initializing Alodek DNS Server...');
        this.loadDNSConfig();
        this.setupServer();
    }

    loadDNSConfig() {
        // Default DNS configuration
        const defaultConfig = {
            domains: {
                'gis-ctf.local': {
                    type: 'A',
                    value: '127.0.0.1',
                    ttl: 300
                },
                'api.gis-ctf.local': {
                    type: 'A',
                    value: '127.0.0.1',
                    ttl: 300
                },
                'backend.gis-ctf.local': {
                    type: 'A',
                    value: '127.0.0.1',
                    ttl: 300
                },
                'team1.gis-ctf.local': {
                    type: 'A',
                    value: '192.168.1.101',
                    ttl: 300
                },
                'team2.gis-ctf.local': {
                    type: 'A',
                    value: '192.168.1.102',
                    ttl: 300
                },
                'team3.gis-ctf.local': {
                    type: 'A',
                    value: '192.168.1.103',
                    ttl: 300
                },
                'team4.gis-ctf.local': {
                    type: 'A',
                    value: '192.168.1.104',
                    ttl: 300
                },
                'team5.gis-ctf.local': {
                    type: 'A',
                    value: '192.168.1.105',
                    ttl: 300
                }
            },
            upstreamDNS: ['8.8.8.8', '1.1.1.1'],
            settings: {
                enableLogging: true,
                enableCache: true,
                cacheMaxAge: 3600
            }
        };

        let config = defaultConfig;
        
        // Load configuration from file if it exists
        if (existsSync(this.configFile)) {
            try {
                const configData = readFileSync(this.configFile, 'utf8');
                config = JSON.parse(configData);
                console.log(`📁 Loaded DNS configuration from ${this.configFile}`);
            } catch (error) {
                console.warn(`⚠️ Failed to load DNS config file, using defaults: ${error.message}`);
            }
        } else {
            console.log('📝 Using default DNS configuration');
        }

        // Convert domains to internal format
        Object.entries(config.domains).forEach(([domain, record]) => {
            this.dnsRecords.set(domain.toLowerCase(), {
                type: record.type,
                value: record.value,
                ttl: record.ttl || 300
            });
        });

        this.upstreamDNS = config.upstreamDNS || ['8.8.8.8'];
        this.settings = config.settings || {};
        
        console.log(`🎯 Loaded ${this.dnsRecords.size} DNS records`);
    }

    setupServer() {
        this.server.on('message', (msg, rinfo) => {
            this.handleDNSQuery(msg, rinfo);
        });

        this.server.on('error', (err) => {
            console.error('💥 DNS server error:', err);
        });

        this.server.on('listening', () => {
            const address = this.server.address();
            console.log('✅ Alodek DNS Server started successfully!');
            console.log(`🌐 DNS server listening on: ${address.address}:${address.port}`);
            console.log(`🎯 Serving ${this.dnsRecords.size} local domains`);
            console.log(`⬆️ Upstream DNS: ${this.upstreamDNS.join(', ')}`);
            console.log('🚀 Ready to resolve domain names!\n');
        });
    }

    handleDNSQuery(msg, rinfo) {
        try {
            const query = this.parseDNSQuery(msg);
            
            if (this.settings.enableLogging) {
                console.log(`📥 DNS Query: ${query.domain} (${query.type}) from ${rinfo.address}:${rinfo.port}`);
            }

            const record = this.dnsRecords.get(query.domain.toLowerCase());
            
            if (record) {
                // We have a local record for this domain
                const response = this.createDNSResponse(query, record, msg);
                this.server.send(response, rinfo.port, rinfo.address);
                
                if (this.settings.enableLogging) {
                    console.log(`📤 DNS Response: ${query.domain} -> ${record.value}`);
                }
            } else {
                // Forward to upstream DNS
                this.forwardDNSQuery(msg, rinfo, query);
            }
            
        } catch (error) {
            console.error('❌ Error handling DNS query:', error);
            // Send DNS error response
            const errorResponse = this.createDNSErrorResponse(msg);
            this.server.send(errorResponse, rinfo.port, rinfo.address);
        }
    }

    parseDNSQuery(msg) {
        // Simple DNS query parser (basic implementation)
        const header = {
            id: msg.readUInt16BE(0),
            flags: msg.readUInt16BE(2),
            qdcount: msg.readUInt16BE(4),
            ancount: msg.readUInt16BE(6),
            nscount: msg.readUInt16BE(8),
            arcount: msg.readUInt16BE(10)
        };

        let offset = 12;
        const labels = [];
        
        // Parse domain name
        while (true) {
            const length = msg.readUInt8(offset);
            if (length === 0) {
                offset++;
                break;
            }
            
            const label = msg.toString('utf8', offset + 1, offset + 1 + length);
            labels.push(label);
            offset += length + 1;
        }

        const domain = labels.join('.');
        const type = msg.readUInt16BE(offset);
        const class_ = msg.readUInt16BE(offset + 2);

        return {
            header,
            domain,
            type,
            class: class_,
            typeString: this.getTypeString(type)
        };
    }

    createDNSResponse(query, record, originalMsg) {
        // Create DNS response packet
        const response = Buffer.alloc(512);
        
        // Copy header from original query
        originalMsg.copy(response, 0, 0, 12);
        
        // Set response flags
        response.writeUInt16BE(0x8180, 2); // Standard response
        response.writeUInt16BE(1, 6); // 1 answer
        
        // Copy question section
        let offset = 12;
        while (originalMsg.readUInt8(offset) !== 0) {
            response.writeUInt8(originalMsg.readUInt8(offset), offset);
            offset++;
        }
        response.writeUInt8(0, offset); // End of domain name
        offset++;
        
        // Copy QTYPE and QCLASS
        originalMsg.copy(response, offset, offset, offset + 4);
        offset += 4;
        
        // Answer section
        // Domain name pointer to question
        response.writeUInt16BE(0xC00C, offset);
        offset += 2;
        
        // Type
        response.writeUInt16BE(record.type === 'A' ? 1 : 1, offset);
        offset += 2;
        
        // Class (IN)
        response.writeUInt16BE(1, offset);
        offset += 2;
        
        // TTL
        response.writeUInt32BE(record.ttl, offset);
        offset += 4;
        
        // Data length
        if (record.type === 'A') {
            response.writeUInt16BE(4, offset); // IPv4 address length
            offset += 2;
            
            // IP address
            const ipParts = record.value.split('.');
            ipParts.forEach(part => {
                response.writeUInt8(parseInt(part), offset);
                offset++;
            });
        }
        
        return response.slice(0, offset);
    }

    createDNSErrorResponse(originalMsg) {
        const response = Buffer.alloc(originalMsg.length);
        originalMsg.copy(response);
        
        // Set error flags (RCODE = 3, Name Error)
        response.writeUInt16BE(0x8183, 2);
        
        return response;
    }

    forwardDNSQuery(msg, rinfo, query) {
        // Forward query to upstream DNS server
        const upstreamSocket = dgram.createSocket('udp4');
        const upstreamDNS = this.upstreamDNS[Math.floor(Math.random() * this.upstreamDNS.length)];
        
        upstreamSocket.send(msg, 53, upstreamDNS, (err) => {
            if (err) {
                console.error(`❌ Error forwarding to upstream DNS ${upstreamDNS}:`, err);
                const errorResponse = this.createDNSErrorResponse(msg);
                this.server.send(errorResponse, rinfo.port, rinfo.address);
                return;
            }
        });
        
        upstreamSocket.on('message', (response) => {
            // Forward response back to client
            this.server.send(response, rinfo.port, rinfo.address);
            
            if (this.settings.enableLogging) {
                console.log(`🔄 Forwarded response for ${query.domain} from ${upstreamDNS}`);
            }
            
            upstreamSocket.close();
        });
        
        // Timeout for upstream query
        setTimeout(() => {
            upstreamSocket.close();
            const errorResponse = this.createDNSErrorResponse(msg);
            this.server.send(errorResponse, rinfo.port, rinfo.address);
        }, 5000);
    }

    getTypeString(type) {
        const types = {
            1: 'A',
            28: 'AAAA',
            5: 'CNAME',
            15: 'MX',
            2: 'NS',
            12: 'PTR',
            16: 'TXT'
        };
        return types[type] || `TYPE${type}`;
    }

    addRecord(domain, type, value, ttl = 300) {
        this.dnsRecords.set(domain.toLowerCase(), {
            type,
            value,
            ttl
        });
        console.log(`➕ Added DNS record: ${domain} -> ${value}`);
    }

    removeRecord(domain) {
        if (this.dnsRecords.delete(domain.toLowerCase())) {
            console.log(`➖ Removed DNS record: ${domain}`);
            return true;
        }
        return false;
    }

    listRecords() {
        console.log('📋 Current DNS records:');
        this.dnsRecords.forEach((record, domain) => {
            console.log(`   ${domain} -> ${record.value} (${record.type}, TTL: ${record.ttl})`);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.bind(this.port, this.host, (error) => {
                if (error) {
                    if (error.code === 'EACCES') {
                        console.error(`❌ Permission denied: Cannot bind to port ${this.port}`);
                        console.log('💡 Try running with sudo or use a port > 1024');
                    }
                    reject(error);
                    return;
                }
                resolve(this.server);
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🛑 Alodek DNS Server stopped');
                resolve();
            });
        });
    }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const dns = new AlodekDNS({ port: process.env.DNS_PORT || 5353 }); // Use alternative port for development
    
    dns.start().catch((error) => {
        console.error('Failed to start Alodek DNS server:', error);
        process.exit(1);
    });
    
    // CLI interface
    process.stdin.setEncoding('utf8');
    console.log('\n💬 DNS Server Console (type "help" for commands):');
    
    process.stdin.on('data', (input) => {
        const [command, ...args] = input.trim().split(' ');
        
        switch (command) {
            case 'help':
                console.log('Available commands:');
                console.log('  list - Show all DNS records');
                console.log('  add <domain> <type> <value> [ttl] - Add DNS record');
                console.log('  remove <domain> - Remove DNS record');
                console.log('  quit - Stop the server');
                break;
                
            case 'list':
                dns.listRecords();
                break;
                
            case 'add':
                if (args.length >= 3) {
                    dns.addRecord(args[0], args[1], args[2], parseInt(args[3]) || 300);
                } else {
                    console.log('Usage: add <domain> <type> <value> [ttl]');
                }
                break;
                
            case 'remove':
                if (args[0]) {
                    dns.removeRecord(args[0]);
                } else {
                    console.log('Usage: remove <domain>');
                }
                break;
                
            case 'quit':
            case 'exit':
                dns.stop().then(() => process.exit(0));
                break;
                
            default:
                console.log('Unknown command. Type "help" for available commands.');
        }
    });
}

export { AlodekDNS };