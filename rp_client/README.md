# Rendezvous Client
The client will connect to the Rendezvous Server in order to proxy outbound and/or inbound TCP connections. The configuration of the client is controlled from the server. There is a single TOKEN environment variable that is required for the client to connect and authenticate.
## Settings TOKEN environment variable
This token can be retrieved from either the Rendezvous Server in local configuration mode, or from the Rendezvous Manager if a backend Mongo Database is used.
```
export TOKEN=2o1i3u4op2314uqkwlejhrkwlqjrkljweqhrklwqejhosiufposadufdsafdsaf
```
## Running the client with node.js intalled
```
git clone https://github.com/ucipass/rp
cd rp/rp_client
npm install
npm start
```
## Running the server with docker
if you are planning on using the client to listen on certain TCP ports. Docker ports will have to be specified.
This is not needed,  if the client is used to forward TCP ports.
```
docker run --rm -it -e TOKEN="$TOKEN" -p 3128:3128 -p 2222:2222 ucipass/rp_client
```
