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

	public options: ServerOptions;
	public connections: { [key: string]: Socket };

	public constructor(options: RecursivePartial<ServerOptions>);
	public constructor();

	public start(port: number): void;
	public close(): void;
}

export function getFiles(dir: string): Promise<string[]>;

export interface ServerOptions {
	https: ServerOptionsHTTPS | false;

	api: {
		prefix: string;
		routes:
			| Route[]
			| {
					folder: string;
					load: (filename: string) => Route | Promise<Route>;
			  };
		error: RequestHandler;
	};

	statics: string[];

	cors: (cors.CorsOptions | cors.CorsOptionsDelegate)[];

	error: RequestHandler;
}

export interface Route {
	name: string;
	call: RequestHandler;
}

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[]
		? RecursivePartial<U>[]
		: T[P] extends object
		? RecursivePartial<T[P]>
		: T[P];
};
