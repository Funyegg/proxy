//Server Setup + error handling
const net = require('net');
const server = net.createServer();
const port = 7777
server.listen(port);
server.on('error', ()=>{}); //Do nothing. This is triggered on unexpected disconnect.
server.on('connection', res=>{
res.proxy = {port:80};

//Actual proxy
res.on('data', data=>{

if(res.proxy.connected == undefined){
data = data.toString();
//Ensure is HTTP request
if(!data.includes("HTTP/1.")){
res.end();
return;
}

//Parse data
res.proxy.method = data.substring(0, data.indexOf(' '));
res.proxy.url = data.substring(data.indexOf(' ')+1, data.indexOf(" H"));

res.proxy.url = res.proxy.url.replace("http://","");
if(res.proxy.method!="CONNECT") res.proxy.host = res.proxy.url.substring(0, res.proxy.url.indexOf('/'));
else res.proxy.host = res.proxy.url;

//Handle connections to proxy as HTTP server
if(res.proxy.url.startsWith("/")){
res.write("HTTP/1.1 400 THIS ISNT HTTP\r\n\r\n<h1>PLEASE DO NOT TRY TO BREAK THE PROXY</h1>");
res.end();
return;
}

//Allow Custom Ports
if(res.proxy.host.includes(":")){
res.proxy.port = res.proxy.host.substring(res.proxy.host.indexOf(":")+1, res.proxy.host.length);
res.proxy.host2 = res.proxy.host.substring(0, res.proxy.host.indexOf(":"));
}

//Establish connection to client
res.proxy.server = net.createConnection({host:res.proxy.host2, port:res.proxy.port});
if(res.proxy.method == "CONNECT"){
res.proxy.connected = true;
res.write("HTTP/1.1 200 PROXY SUCCESSFUL\r\n\r\n");
}

//Forward data from server
res.proxy.server.on('data', data2=>{
res.write(data2);
})

//On close of web server, close tunnel. Also catch errors.
res.proxy.server.on('error', ()=>{});
res.proxy.server.on('close', ()=>{res.end()});

//Don't send the CONNECT request to the web server.
if(res.proxy.connected) return;
}

//Ensure request is valid
if(!res.proxy.connected) data = data.toString().replace("http://"+res.proxy.host, "");
res.proxy.server.write(data);
})

//Catch errors so it doesnt crash. Don't waste time responding to them.
res.on("error", ()=>{});
})
