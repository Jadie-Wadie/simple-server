const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');

const { Server, getFiles } = require('./index');

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

	it('should use an api prefix', async () => {
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

		expect(res).toStrictEqual('Pong!');
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
		let res2 = [await (await fetch('http://localhost:3000/ping')).text()];

		for (let i = 0; i <= 10; i++) {
			res1.push(`Hello ${i}!`);
			res2.push(
				await (await fetch(`http://localhost:3000/hello/${i}`)).text()
			);
		}

		server.close();

		expect(res2).toStrictEqual(res1);
	});

	it('should load routes from a directory', async () => {
		const server = new Server({
			api: {
				routes: {
					folder: path.join(__dirname, 'test'),
					load: async filename => await require(filename)
				}
			}
		});
		await server.start(3000);

		const res = await (await fetch('http://localhost:3000/route')).text();

		server.close();

		expect(res).toBe('Hello!');
	});

	it('should use a custom api error handler', async () => {
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

	it('should load a static directory', async () => {
		const server = new Server({
			statics: [__dirname]
		});
		await server.start(3000);

		const file = await (
			await fetch('http://localhost:3000/LICENSE')
		).text();

		server.close();

		expect(file).toBe(fs.readFileSync('./LICENSE', { encoding: 'utf8' }));
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

	it('should error if cors is not an object', async () => {
		const server = new Server({
			cors: 'bad_argument'
		});

		let result = false;
		try {
			await server.start(3000);
		} catch (err) {
			result = true;
		}

		server.close();

		expect(result).toBe(true);
	});

	it('should error if a route is invalid', async () => {
		const server = new Server({
			api: {
				routes: [
					{
						name: 'bad_route'
					}
				]
			}
		});

		let result = false;
		try {
			await server.start(3000);
		} catch (err) {
			result = true;
		}

		server.close();

		expect(result).toBe(true);
	});

	it('should error if a static does not exist', async () => {
		const server = new Server({
			statics: ['bad_path']
		});

		let result = false;
		try {
			await server.start(3000);
		} catch (err) {
			result = true;
		}

		server.close();

		expect(result).toBe(true);
	});
});

describe('getFiles', () => {
	it('should error on an invalid path', async () => {
		expect(() => getFiles('bad_path')).toThrow();
	});

	it('should return an array of strings', async () => {
		expect(getFiles(path.join(__dirname, 'test'))).toEqual([
			path.join(__dirname, 'test/route.js')
		]);
	});
});
