#!/usr/bin/env python3
"""
ESPN API Proxy Server
Bypasses CORS restrictions by proxying requests to ESPN from server-side
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json

class ESPNProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the requested path
        # Expected format: /proxy?url=<ESPN_URL>
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)
        
        if 'url' not in query_params:
            self.send_error(400, "Missing 'url' parameter")
            return
        
        espn_url = query_params['url'][0]
        
        # Validate it's an ESPN URL for security
        if not espn_url.startswith('https://site.api.espn.com'):
            self.send_error(403, "Only ESPN API URLs allowed")
            return
        
        try:
            # Fetch data from ESPN
            print(f"📡 Proxying request to: {espn_url}")
            
            req = urllib.request.Request(espn_url)
            req.add_header('User-Agent', 'Mozilla/5.0')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read()
                
                # Send successful response with CORS headers
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                self.wfile.write(data)
                print(f"✅ Successfully proxied {len(data)} bytes")
                
        except Exception as e:
            print(f"❌ Error proxying request: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging
        print(f"[ESPN Proxy] {format % args}")

def run_proxy(port=8006):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ESPNProxyHandler)
    print(f"""
╔══════════════════════════════════════════╗
║   🏀 ESPN API PROXY SERVER RUNNING 🏈   ║
╚══════════════════════════════════════════╝

📡 Listening on: http://localhost:{port}
🎯 Purpose: Bypass CORS for ESPN API calls
🔧 Usage: GET /proxy?url=<ESPN_URL>

Press Ctrl+C to stop the server.
""")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down proxy server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_proxy(8006)
