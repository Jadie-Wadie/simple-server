// Packages
import { resolve } from 'path';
import { existsSync, readdirSync } from 'fs';

import http from 'http';
import https from 'https';
import { Socket } from 'net';

import express from 'express';
import bodyParser from 'body-parser';

import cors from 'cors';

// Enums
export enum RouteMethod {
	checkout = 'checkout',
	copy = 'copy',
	delete = 'delete',
	get = 'get',
	head = 'head',
	lock = 'lock',
	merge = 'merge',
	mkactivity = 'mkactivity',
	mkcol = 'mkcol',
	move = 'move',
	'm-search' = 'm-search',
	notify = 'notify',
	options = 'options',
	patch = 'patch',
	post = 'post',
	purge = 'purge',
	put = 'put',
	report = 'report',
	search = 'search',
	subscribe = 'subscribe',
	trace = 'trace',
	unlock = 'unlock',
	unsubscribe = 'unsubscribe'
}

// Interfaces
export interface ServerOptions {
	https: https.ServerOptions | false;
	api: {
		prefix: string;
		routes:
			| Route[]
			| {
					folder: string;
					load: (filename: string) => Route | Promise<Route>;
					strict?: boolean;
			  };
		error: express.RequestHandler;
	};
	statics: string[] | { prefix: string; folder: string }[];
	cors: (cors.CorsOptions | cors.CorsOptionsDelegate)[];
	error: express.RequestHandler;
}

export interface Route {
	verb: keyof typeof RouteMethod;
	name: string;
	call: express.RequestHandler;
}

type NestedPartial<T> = {
	[P in keyof T]?: Partial<T[P]>;
};

// Server
export class Server {
	public app: express.Express;
	public server: http.Server | https.Server;

	public readonly options: ServerOptions = {
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

	private connections: {
		[key: string]: Socket;
	} = {};

	public constructor(options: NestedPartial<ServerOptions> = {}) {
		// Merge Options
		const recursiveMerge = (
			target: { [key: string]: any },
			source: { [key: string]: any }
		) => {
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

	public async start(port: number) {
		// BodyParser
		this.app.use(bodyParser.urlencoded({ extended: false }));
		this.app.use(bodyParser.json());

		// CORS
		if (typeof this.options.cors !== 'object')
			throw new TypeError('cors must be an object');
		for (const options of this.options.cors) this.app.use(cors(options));

		// Load Routes
		if (Array.isArray(this.options.api.routes)) {
			for (const route of this.options.api.routes) {
				this.validateRoute(route);
				this.app[route.verb](
					this.options.api.prefix + route.name,
					route.call
				);
			}
		} else {
			for (const file of getFiles(this.options.api.routes.folder)) {
				const route = await this.options.api.routes.load(file);
				try {
					this.validateRoute(route);
					this.app[route.verb](
						this.options.api.prefix + route.name,
						route.call
					);
				} catch (err) {
					if (this.options.api.routes.strict === true) throw err;
				}
			}
		}

		// Load Statics
		for (const value of this.options.statics) {
			if (typeof value === 'string') {
				if (existsSync(value)) {
					this.app.use(express.static(value));
				} else {
					throw new Error(`${value} is not a valid folder`);
				}
			} else {
				if (existsSync(value.folder)) {
					this.app.use(value.prefix, express.static(value.folder));
				} else {
					throw new Error(`${value.folder} is not a valid folder`);
				}
			}
		}

		// 404 Handling
		if (this.options.api.prefix.length != 0)
			this.app.use(this.options.api.prefix, this.options.api.error);
		this.app.use(this.options.error);

		// Start the Server
		this.server.listen(port);

		// Record Connections
		this.server.on('connection', (connection: Socket) => {
			const name = connection.remoteAddress + ':' + connection.remotePort;

			this.connections[name] = connection;
			connection.on('close', () => {
				delete this.connections[name];
			});
		});
	}

	// Close the Server
	public close() {
		if (this.server === undefined) return;

		this.server.close();
		for (const key in this.connections) this.connections[key].destroy();
	}

	// Validate Route
	public validateRoute(route: Route) {
		if (RouteMethod[route.verb] === undefined)
			throw new TypeError(`${route.verb} is not a valid HTTP verb`);
		if (typeof route.name !== 'string')
			throw new TypeError(`${route.name} is not a string`);
		if (typeof route.call !== 'function')
			throw new TypeError(`${route.call} is not a function`);

		return true;
	}
}

// Get Files (Recursive)
export function getFiles(dir: string): string[] {
	let dirents;
	try {
		dirents = readdirSync(dir, {
			withFileTypes: true
		});
	} catch (err) {
		throw err;
	}

	const files = dirents.map(dirent => {
		const path = resolve(dir, dirent.name);
		return dirent.isDirectory() ? getFiles(path) : path;
	});

	return files.flat();
}
