// Type definitions for simple-server
// Definitions by: Jadie Wadie <https://github.com/Jadie-Wadie>

import http from 'http';
import https, { ServerOptions as ServerOptionsHTTPS } from 'https';

import express, { RequestHandler } from 'express';
import { Socket } from 'net';

import cors from 'cors';

export class Server {
	public app: express.Express;
	public server: http.Server | https.Server;

	public methods: RouteVerb[];

	public options: ServerOptions;
	public connections: { [key: string]: Socket };

	public constructor(options: ServerOptions);
	public constructor();

	public start(port: number): Promise<void>;
	public close(): void;

	public validateRoute(route: Route): true | Error;
}

export function getFiles(dir: string): string[];

export interface ServerOptions {
	https?: ServerOptionsHTTPS | false;

	api?: {
		prefix?: string;
		routes?:
			| Route[]
			| {
					folder?: string;
					load?: (filename: string) => Route | Promise<Route>;
					strict?: boolean;
			  };
		error?: RequestHandler;
	};

	statics?: string[];

	cors?: (cors.CorsOptions | cors.CorsOptionsDelegate)[];

	error?: RequestHandler;
}

export interface Route {
	verb: RouteVerb;
	name: string;
	call: RequestHandler;
}

type RouteVerb = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head';
