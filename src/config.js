module.exports = {
	hashring: {
		base_host: process.env.HASHRING_BASE_HOST || 'localhost',
		base_port: process.env.HASHRING_BASE_PORT || 7373,
	},
	api: {
		host: process.env.API_HOST || 'localhost',
		port: process.env.API_PORT || 8081,
	},
	port: process.env.PORT || 8000,
};