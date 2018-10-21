const dns = require('dns');
const redbird = require('redbird');
const hashring = require('swim-hashring');
const { promisify } = require('util');
const querystring = require('querystring');
const config = require('./config');
const lookup = promisify(dns.lookup);

function getRoute(url){
	const idx = url.indexOf('?');
	if(idx === -1) return null;
	const { roomId } = querystring.parse(url.substring(idx + 1));
	return roomId;
}

function getSocketServerURL({ id, meta: { socketServerPort } }){
	const idx = id.indexOf(':');
	const base = idx !== -1 ? id.substring(0, idx) : id;
	return 'http://' + base + ':' + socketServerPort;
}

/**
 * Wait for given ring to successfully emit *up* before *error* event.
 * @param ring
 * @returns {Promise<*>}
 */
function waitForHashring(ring){
	return new Promise((resolve, reject) => {
		ring.on('up', resolve);
		ring.on('error', reject);
	});
}

async function getBaseHost(base_host){
	const IP_REGEX = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
	if(base_host === "localhost" || !!base_host.match(IP_REGEX))
		return { address: base_host };
	return lookup(config.hashring.base_host, { family: 4 });
}

function routeToGameServer(ring, url){
	const route = getRoute(url);
	if(!route) return null;
	const lookup = ring.lookup(route);
	return getSocketServerURL(lookup);
}

async function main(){
	const { address: baseHost } = await getBaseHost(config.hashring.base_host);
	const ring = hashring({ base: [`${baseHost}:${config.hashring.base_port}`], client: true });
	await waitForHashring(ring);

	function resolver(host, url){
		if(url.startsWith('/socket.io/')){
			return routeToGameServer(ring, url)
		}
		return `http://${config.api.host}:${config.api.port}`;
	}

	const proxy = redbird({
		port: config.port,
		resolvers: [
			resolver
		]
	});
	console.log(`started redbird proxy on ${config.port}`);
}

main().catch((err) => console.log('an error happened when bootstrapping the proxy', err));
