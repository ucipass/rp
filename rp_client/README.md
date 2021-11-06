# Rendezvous Client
In order to connect to the server, the following 3 parameters will need to be provided so that the client can connect tot he server
- RP_URL: Socket.io URL
- RP_CLIENT: Client name set by the manager
- RP_TOKEN: Authentication token set by the manager
```
export RP_URL=http://localhost:8081/rp
export RP_CLIENT=client1
export RP_TOKEN=client1pass
export LOG_LEVEL=info
node rp_client.js 
```