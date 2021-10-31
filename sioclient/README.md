# Client testing from command line
- RP_URL: Socket.io URL
- RP_CLIENT: Client name set by the manager
- RP_TOKEN: Authentication token set by the manager
```
export RP_URL=http://localhost:8081/rp
export RP_CLIENT=test2
export RP_TOKEN=43cb2226945a52dd3c701a7d39d075319e44a8ed9449a022
node sio-client.js 
```