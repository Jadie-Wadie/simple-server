// Packages
const fs = require('fs').promises;
const { resolve } = require('path');

const http = require('http');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');

const cors = require('cors');

// Server
class Server {
	options = {
		https: false,

		api: {
			prefix: '',
			routes: [],
			error: (req, res) => res.sendStatus(404)
		},

		statics: [],

		cors: [],

		error: (req, res) => res.sendStatus(404)
	};

	connections = {};

	constructor(options = {}) {
		// Merge Options
		const recursiveMerge = (target, source) => {
			for (const key in source) {
				if (
					typeof target[key] === 'object' &&
					!Array.isArray(target[key]) &&
					typeof source[key] === 'object' &&
					!Array.isArray(source[key])
				) {
					recursiveMerge(target[key], source[key]);
				} else {
					target[key] = source[key];
				}
			}
		};
		recursiveMerge(this.options, options);

		// Setup Server
		this.app = express();
		this.server =
			this.options.https === false
				? http.createServer(this.app)
				: https.createServer(this.options.https, this.app);
	}

	async start(port) {
		// BodyParser
		this.app.use(bodyParser.urlencoded({ extended: false }));
		this.app.use(bodyParser.json());

		// CORS
		for (const options of this.options.cors) {
			this.app.use(cors(options));
		}

		// Load Routes
		if (Array.isArray(this.options.api.routes)) {
			for (const route of this.options.api.routes) {
				this.app.use(this.options.api.prefix + route.name, route.call);
			}
		} else {
			for (const file of await getFiles(this.options.api.routes.folder)) {
				const route = await this.options.api.routes.load(file);
				if (route?.name !== undefined && route?.call !== undefined)
					this.app.use(
						this.options.api.prefix + route.name,
						route.call
					);
			}
		}

		// Load Statics
		for (const folder of this.options.statics) {
			this.app.use(express.static(folder));
		}

		// 404 Handling
		if (this.options.api.prefix.length != 0)
			this.app.use(this.options.api.prefix, this.options.api.error);
		this.app.use(this.options.error);

		// Start the Server
		this.server.listen(port);

		// Record Connections
		this.server.on('connection', c => {
			this.connections[c.remoteAddress + ':' + c.remotePort] = c;
			c.on('close', () => {
				delete this.connections[c.remoteAddress + ':' + c.remotePort];
			});
		});
	}

	// Close the Server
	async close() {
		if (this.server === undefined) return;

		this.server.close();
		for (const key in this.connections) this.connections[key].destroy();
	}
}

// Get Files (Recursive)
async function getFiles(dir) {
	const dirents = await fs.readdir(dir, {
		withFileTypes: true
	});

	const files = await Promise.all(
		dirents.map(async dirent => {
			const path = resolve(dir, dirent.name);
			return dirent.isDirectory() ? getFiles(path) : path;
		})
	);

	return files.flat();
}

// Export
module.exports = {
	Server,
	getFiles
};
