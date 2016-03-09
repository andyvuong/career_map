import SimpleHTTPServer
import SocketServer

PORT = 9000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler, bind_and_activate=False)
httpd.allow_reuse_address = True
httpd.server_bind()
httpd.server_activate()

print "serving at port", PORT
httpd.serve_forever()