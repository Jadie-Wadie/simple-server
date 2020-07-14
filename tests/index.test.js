// Packages
const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');

const { Server, getFiles } = require('../dist/index');

// Server Tests
describe('server', () => {
	it('should start on the correct port', async () => {
		let ports1 = [];
		let ports2 = [];

		for (let i = 3000; i <= 4000; i += 100) {
			const server = new Server();
			await server.start(i);

			ports1.push(i);
			ports2.push(server.server.address().port);

			server.close();
		}

		expect(ports2).toStrictEqual(ports1);
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

		it('should use a custom error handler', async () => {
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
					await (await fetch('http://localhost:3000/api/test')).text()
				);

				server.close();
			}

			expect(errors2).not.toStrictEqual(errors1);
		});

		it('should throw if a route is invalid', async () => {
			const server = new Server({
				api: {
					routes: [
						{
							name: 'bad_route'
						}
					]
				}
			});

			await expect(async () =>
				(await server.start(3000)).close()
			).rejects.toThrow();
		});

		it('should throw in strict mode', async () => {
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

	describe('statics', () => {
		it('should load a directory', async () => {
			const server = new Server({
				statics: { paths: [path.join(__dirname, '..')] }
			});
			await server.start(3000);

			const file1 = fs.readFileSync(path.join(__dirname, '../LICENSE'), {
				encoding: 'utf8'
			});
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
						{ prefix: '/data', folder: path.join(__dirname, '..') }
					]
				}
			});
			await server.start(3000);

			const file1 = fs.readFileSync(path.join(__dirname, '../LICENSE'), {
				encoding: 'utf8'
			});
			const file2 = await (
				await fetch('http://localhost:3000/data/LICENSE')
			).text();

			server.close();

			expect(file2).toBe(file1);
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

		it('should throw in strict mode', async () => {
			const server = new Server({
				statics: { paths: ['bad_path'], strict: true }
			});

			await expect(async () =>
				(await server.start(3000)).close()
			).rejects.toThrow();
		});
	});

	it('should throw if cors is not an object', async () => {
		const server = new Server({
			cors: 'bad_argument'
		});

		await expect(async () =>
			(await server.start(3000)).close()
		).rejects.toThrow();
	});
});

describe('getFiles', () => {
	it('should throw on an invalid path', async () => {
		expect(() => getFiles('bad_path')).toThrow();
	});

	it('should return an array of strings', async () => {
		expect(getFiles(path.join(__dirname, 'routes'))).toEqual([
			path.join(__dirname, 'routes/error.js'),
			path.join(__dirname, 'routes/route.js')
		]);
	});
});
