# simple-server

![CircleCI](https://img.shields.io/circleci/build/github/Jadie-Wadie/simple-server)
![Codecov](https://img.shields.io/codecov/c/github/Jadie-Wadie/simple-server)
![NPM Version](https://img.shields.io/npm/v/@jadiewadie/simple-server)
![NPM Downloads](https://img.shields.io/npm/dm/@jadiewadie/simple-server)
![NPM License](https://img.shields.io/npm/l/@jadiewadie/simple-server)

A simple HTTP/S server, built using [express](https://expressjs.com/)

## Installation

Install with [NPM](https://www.npmjs.com/).

```cmd
npm install @jadiewadie/simple-server
```

## Usage

### HTTPS

The `https` object is provided to `https.createServer()`.<br>
See the [https documentation](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) for more details.

```js
const server = new Server({
	https: {
		key: readFileSync('privkey.pem'),
		cert: readFileSync('cert.pem'),
		ca: readFileSync('chain.pem')
	}
});
await server.start(3000);
```

The server can also generate a self-signed certificate, using [selfsigned](https://www.npmjs.com/package/selfsigned).

```js
const server = new Server({
	https: true
});
await server.start(3000);
```

### API

#### Route Definition

Routes are defined as follows:

`verb` - The HTTP verb of the route. A list of verbs can be found in the [express documentation](https://expressjs.com/en/4x/api.html#app.METHOD). <br>
`name` - The name of the route. This can include url parameters, such as `/user/:id`. <br>
`call` - The callback for the route, taking `req`, `res` and `next` as arguments.

#### Route Loading

A list of routes can be provided to the `api` option. The `prefix` option is also available.

```js
const server = new Server({
	api: {
		prefix: '/api',
		routes: [
			{
				verb: 'get',
				name: '/ping',
				call: (req, res) => res.send('Pong!')
			},
			{
				verb: 'get',
				name: '/hello/:name',
				call: (req, res) => res.send(`Hello ${req.params.name}!`)
			}
		]
	}
});
```

Alternatively, routes can be loaded recursively from a folder.<br>
The `strict` flag indicates whether invalid files should throw an error (`true`) or be ignored (`false`).

```js
const server = new Server({
	api: {
		routes: {
			folder: path.join(__dirname, 'api'),
			load: async filename => (await import(filename)).default,
			strict: true
		}
	}
});
```

The recursive `getFiles` function can be used for custom route loading.

```js
import { getFiles } from '@jadiewadie/simple-server';

getFiles(path.join(__dirname, 'api')); // An array of paths
```

### Statics

A list of directories to serve as statics can be provided to `statics`.<br>
The `strict` flag indicates whether invalid paths should throw an error (`true`) or be ignored (`false`).

```js
const server = new Server({
	statics: {
		paths: [path.join(__dirname, 'public')],
		strict: true
	}
});
```

Folder paths can be passed alongside prefixes. For example, hosting the `data` folder at the `/data` route.

```js
const server = new Server({
	statics: {
		paths: [
			{
				prefix: '/data',
				folder: [path.join(__dirname, 'data')]
			}
		]
	}
});
```

### CORS

The `cors` object is provided as configuration to the [cors](https://www.npmjs.com/package/cors#configuration-options) package.

```js
const server = new Server({
	cors: {
		origin: 'http://localhost:3000'
	}
});
```

### Error Handling

A custom handlers can be provided to `error` and `api.error`.

```js
const server = new Server({
	error: (req, res) => res.redirect('/error.html'),
	api: {
		error: (req, res) => res.redirect('/api-error.html')
	}
});
```

## License

[MIT](LICENSE)
