import {
	vungle
} from './Model/Vungle'

const http = require('http');

const hostName = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-type', 'text/plan');
	res.end('Yay Me\n');
	console.log(vungle.getSessionId());
	console.log(vungle.getConfig());
});

server.listen(port, hostName, () => {
	console.log(`Server running at http:// ${hostName}:${port}/`);
});