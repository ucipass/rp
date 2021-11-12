# Rendezvous Server
This server starts listening on a predefined port for HTTP/Websocket connections in order to bridge traffic between two clients.
Hostname, port, HTTP path are all customizable and it is expected that this program is behind a load balancer performing SSL proxying/

## Server configuration using the "CONFIG" environment variable
```
export CONFIG=$(cat <<EOF
---
server:
  hostname: 172.18.2.8
  port: 8081
  prefix: rp
  logLevel: info
rooms:
- name:    SSH_Room
  rcvName: client1
  rcvPort: 2222
  fwdName: client2
  fwdHost: localhost
  fwdPort: 22
  expiration: yyyy-MM-ddTHH:mm:ss
- name:    Proxy_Room
  rcvName: client1
  rcvPort: 3127
  fwdName: client2
  fwdHost: localhost
  fwdPort: 3128
  expiration: yyyy-MM-ddTHH:mm:ss
clients:
- username: client1
  password: client1pass
  proxyport: 0
- username: client2
  password: client2pass
  proxyport: 3128
EOF
)

```
## Runnins the server with node.js intalled
```
git clone https://github.com/ucipass/rp
cd rp/rp_server
npm install
npm start
```
## Runnins the server with docker
```
docker run --rm -it -e CONFIG="$CONFIG" -p 8081:8081 ucipass/rp_server
```
