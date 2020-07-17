// Packages
import fs from 'fs';
import path from 'path';

import fetch from 'node-fetch';
import { AddressInfo } from 'net';

import { Server, getFiles, ServerOptions } from '../src';

// Server Tests
describe('server', () => {
	it('should ignore close before start', async () => {
		const server = new Server();
		expect(() => server.close()).not.toThrow();
	});

	it('should start on the correct port', async () => {
		let ports1 = [];
		let ports2 = [];

		for (let i = 3000; i <= 4000; i += 100) {
			const server = new Server();
			await server.start(i);

			ports1.push(i);
			ports2.push((server.server.address() as AddressInfo).port);

			server.close();
		}

		expect(ports2).toStrictEqual(ports1);
	});

	it('should use https', async () => {
		const server = new Server({ https: {} });
		await server.start(3000);

		let error = false;
		try {
			await fetch('http://localhost:3000/');
		} catch (err) {
			error = true;
		}

		server.close();

		expect(error).toBeTruthy();
	});

	describe('api', () => {
		it('should use a prefix', async () => {
			const server = new Server({
				api: {
					prefix: '/prefix',
					routes: [
						{
							verb: 'get',
							name: '/ping',
							call: (req, res) => res.send('Pong!')
						}
					]
				}
			});
			await server.start(3000);

			const res = await (
				await fetch('http://localhost:3000/prefix/ping')
			).text();

			server.close();

			expect(res).toBe('Pong!');
		});

		describe('loading', () => {
			it('should load routes from an array', async () => {
				const server = new Server({
					api: {
						routes: [
							{
								verb: 'get',
								name: '/ping',
								call: (req, res) => res.send('Pong!')
							},
							{
								verb: 'get',
								name: '/hello/:name',
								call: (req, res) =>
									res.send(`Hello ${req.params.name}!`)
							}
						]
					}
				});
				await server.start(3000);

				let res1 = ['Pong!'];
				let res2 = [
					await (await fetch('http://localhost:3000/ping')).text()
				];

				for (let i = 0; i <= 10; i++) {
					res1.push(`Hello ${i}!`);
					res2.push(
						await (
							await fetch(`http://localhost:3000/hello/${i}`)
						).text()
					);
				}

				server.close();

				expect(res2).toStrictEqual(res1);
			});

			it('should throw if a route is invalid', async () => {
				expect.assertions(3);

				await expect(async () => {
					const server = new Server({
						api: {
							routes: [
								{
									verb: 'bad_verb' as unknown
								}
							]
						}
					} as ServerOptions);

					(await server.start(3000)).close();
				}).rejects.toThrow();

				await expect(async () => {
					const server = new Server({
						api: {
							routes: [
								{
									verb: 'get',
									name: 1 as unknown
								}
							]
						}
					} as ServerOptions);

					(await server.start(3000)).close();
				}).rejects.toThrow();

				await expect(async () => {
					const server = new Server({
						api: {
							routes: [
								{
									verb: 'get',
									name: '/route',
									call: 'bad_call' as unknown
								}
							]
						}
					} as ServerOptions);

					(await server.start(3000)).close();
				}).rejects.toThrow();
			});

			it('should load routes from a directory', async () => {
				const server = new Server({
					api: {
						routes: {
							folder: path.join(__dirname, 'routes'),
							load: async filename => await require(filename)
						}
					}
				});
				await server.start(3000);

				const res = await (
					await fetch('http://localhost:3000/route')
				).text();

				server.close();

				expect(res).toBe('Hello!');
			});

			it('should throw if a route is invalid in strict mode', async () => {
				const server = new Server({
					api: {
						routes: {
							folder: path.join(__dirname, 'routes'),
							load: async filename => await require(filename),
							strict: true
						}
					}
				});

				await expect(async () =>
					(await server.start(3000)).close()
				).rejects.toThrow();
			});
		});

		describe('error handler', () => {
			it('should 404 by default', async () => {
				const server = new Server({
					api: {
						prefix: '/api'
					},
					error: (req, res) => res.sendStatus(200)
				});
				await server.start(3000);

				const status = (await fetch('http://localhost:3000/api/test'))
					.status;

				server.close();

				expect(status).toBe(404);
			});

			it('should allow a custom handler', async () => {
				let errors1 = [];
				let errors2 = [];

				for (let i = 0; i <= 10; i++) {
					const server = new Server({
						error: (req, res) => res.send(i.toString()),
						api: {
							prefix: '/api',
							error: (req, res) => res.send((i + 1).toString())
						}
					});
					await server.start(3000);

					errors1.push(
						await (await fetch('http://localhost:3000/test')).text()
					);
					errors2.push(
						await (
							await fetch('http://localhost:3000/api/test')
						).text()
					);

					server.close();
				}

				expect(errors2).not.toStrictEqual(errors1);
			});
		});
	});

	describe('statics', () => {
		describe('loading', () => {
			it('should load a directory', async () => {
				const server = new Server({
					statics: { paths: [path.join(__dirname, '..')] }
				});
				await server.start(3000);

				const file1 = fs.readFileSync(
					path.join(__dirname, '../LICENSE'),
					{
						encoding: 'utf8'
					}
				);
				const file2 = await (
					await fetch('http://localhost:3000/LICENSE')
				).text();

				server.close();

				expect(file2).toBe(file1);
			});

			it('should use a prefix', async () => {
				const server = new Server({
					statics: {
						paths: [
							{
								prefix: '/data',
								folder: path.join(__dirname, '..')
							}
						]
					}
				});
				await server.start(3000);

				const file1 = fs.readFileSync(
					path.join(__dirname, '../LICENSE'),
					{
						encoding: 'utf8'
					}
				);
				const file2 = await (
					await fetch('http://localhost:3000/data/LICENSE')
				).text();

				server.close();

				expect(file2).toBe(file1);
			});

			it('should acknowledge strict mode', async () => {
				expect.assertions(4);

				await expect(
					new Promise(async (resolve, reject) => {
						try {
							const server = new Server({
								statics: {
									paths: ['bad_path'],
									strict: false
								}
							});
							await server.start(3000);

							server.close();

							resolve();
						} catch (err) {
							reject(err);
						}
					})
				).resolves.toBeUndefined();

				await expect(async () => {
					const server = new Server({
						statics: { paths: ['bad_path'], strict: true }
					});

					(await server.start(3000)).close();
				}).rejects.toThrow();

				await expect(
					new Promise(async (resolve, reject) => {
						try {
							const server = new Server({
								statics: {
									paths: [
										{
											prefix: '/files',
											folder: 'bad_path'
										}
									],
									strict: false
								}
							});
							await server.start(3000);

							server.close();

							resolve();
						} catch (err) {
							reject(err);
						}
					})
				).resolves.toBeUndefined();

				await expect(async () => {
					const server = new Server({
						statics: {
							paths: [
								{
									prefix: '/files',
									folder: 'bad_path'
								}
							],
							strict: true
						}
					});

					(await server.start(3000)).close();
				}).rejects.toThrow();
			});
		});

		describe('error handler', () => {
			it('should 404 by default', async () => {
				const server = new Server({
					api: {
						prefix: '/api',
						error: (req, res) => res.sendStatus(200)
					}
				});
				await server.start(3000);

				const status = (await fetch('http://localhost:3000/test'))
					.status;

				server.close();

				expect(status).toBe(404);
			});

			it('should use a custom error handler', async () => {
				let errors1 = [];
				let errors2 = [];

				for (let i = 0; i <= 10; i++) {
					const server = new Server({
						error: (req, res) => res.send(i.toString())
					});
					await server.start(3000);

					errors1.push(i.toString());
					errors2.push(
						await (await fetch('http://localhost:3000/test')).text()
					);

					server.close();
				}

				expect(errors2).toStrictEqual(errors1);
			});
		});
	});

	describe('cors', () => {
		it('should allow true', async () => {
			const server = new Server({
				api: {
					routes: [
						{
							verb: 'get',
							name: '/ping',
							call: (req, res) => res.send('Pong!')
						}
					]
				},
				cors: true
			});
			await server.start(3000);

			const header = (
				await fetch('http://localhost:3000/ping')
			).headers.get('access-control-allow-origin');

			server.close();

			expect(header).toBe('*');
		});

		it('should allow false', async () => {
			const server = new Server({
				api: {
					routes: [
						{
							verb: 'get',
							name: '/ping',
							call: (req, res) => res.send('Pong!')
						}
					]
				},
				cors: false
			});
			await server.start(3000);

			const header = (
				await fetch('http://localhost:3000/ping')
			).headers.get('access-control-allow-origin');

			server.close();

			expect(header).toBeNull();
		});

		it('should allow object values', async () => {
			const server = new Server({
				api: {
					routes: [
						{
							verb: 'get',
							name: '/ping',
							call: (req, res) => res.send('Pong!')
						}
					]
				},
				cors: {
					origin: 'localhost'
				}
			});
			await server.start(3000);

			const header = (
				await fetch('http://localhost:3000/ping')
			).headers.get('access-control-allow-origin');

			server.close();

			expect(header).toBe('localhost');
		});

		it('should throw if cors is not boolean or an object', async () => {
			const server = new Server(({
				cors: 'bad_argument'
			} as unknown) as ServerOptions);

			await expect(async () =>
				(await server.start(3000)).close()
			).rejects.toThrow();
		});
	});
});

describe('getFiles', () => {
	it('should throw on an invalid path', async () => {
		expect(() => getFiles('bad_path')).toThrow();
	});

	it('should return an array of strings', async () => {
		expect(getFiles(path.join(__dirname, '../tests/routes'))).toEqual([
			path.join(__dirname, 'routes/error/error.ts'),
			path.join(__dirname, 'routes/route.ts')
		]);
	});
});
