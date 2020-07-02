const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');

const { Server, getFiles } = require('./index');

test('server starts on the correct port', () => {
	let ports1 = [];
	let ports2 = [];

	for (let i = 3000; i <= 4000; i += 100) {
		const server = new Server();
		server.start(i);

		ports1.push(i);
		ports2.push(server.server.address().port);

		server.close();
	}

	expect(ports2).toStrictEqual(ports1);
});

test('server uses api prefix', async () => {
	const server = new Server({
		api: {
			prefix: '/prefix',
			routes: [
				{
					name: '/ping',
					call: (req, res) => res.send('Pong!')
				}
			]
		}
	});
	server.start(3000);

	const res = await (await fetch('http://localhost:3000/prefix/ping')).text();

	server.close();

	expect(res).toStrictEqual('Pong!');
});

test('server hosts api routes from an array', async () => {
	const server = new Server({
		api: {
			routes: [
				{
					name: '/ping',
					call: (req, res) => res.send('Pong!')
				},
				{
					name: '/hello/:name',
					call: (req, res) => res.send(`Hello ${req.params.name}!`)
				}
			]
		}
	});
	server.start(3000);

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

test('server hosts api routes from a directory', async () => {
	const server = new Server({
		api: {
			routes: {
				folder: path.resolve(__dirname, './test'),
				load: async filename => await require(filename)
			}
		}
	});
	await server.start(3000);

	const res = await (await fetch('http://localhost:3000/route')).text();

	server.close();

	expect(res).toBe('Hello!');
});

test('server uses custom api error handler', async () => {
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
		server.start(3000);

		errors1.push(await (await fetch('http://localhost:3000/test')).text());
		errors2.push(
			await (await fetch('http://localhost:3000/api/test')).text()
		);

		server.close();
	}

	expect(errors2).not.toStrictEqual(errors1);
});

test('server hosts a static directory', async () => {
	const server = new Server({
		statics: [__dirname]
	});
	server.start(3000);

	const file = await (await fetch('http://localhost:3000/LICENSE')).text();

	server.close();

	expect(file).toBe(fs.readFileSync('./LICENSE', { encoding: 'utf8' }));
});

test('server uses custom error handler', async () => {
	let errors1 = [];
	let errors2 = [];

	for (let i = 0; i <= 10; i++) {
		const server = new Server({
			error: (req, res) => res.send(i.toString())
		});
		server.start(3000);

		errors1.push(i.toString());
		errors2.push(await (await fetch('http://localhost:3000/test')).text());

		server.close();
	}

	expect(errors2).toStrictEqual(errors1);
});
