# simple-server

[![Build Status](https://drone.roundsquare.site/api/badges/Jadie-Wadie/simple-server/status.svg)](https://drone.roundsquare.site/Jadie-Wadie/simple-server)
[![Coverage Status](https://coveralls.io/repos/github/Jadie-Wadie/simple-server/badge.svg?branch=master)](https://coveralls.io/github/Jadie-Wadie/simple-server?branch=master)

A simple HTTP/s server, built using [express](https://expressjs.com/)

## Installation

Install with [NPM](https://www.npmjs.com/).

```cmd
npm install @jadiewadie/simple-server
```

## Usage

### HTTPS

The `https` object is provided to [`https.createServer()`](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener).

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

It can also generate a [self-signed](https://www.npmjs.com/package/selfsigned) certificate.

```js
const server = new Server({
	https: true
});
await server.start(3000);
```

### API

#### Route Definition

Routes are defined as follows:

| Field  | Value                                                                          |
| ------ | ------------------------------------------------------------------------------ |
| `verb` | The HTTP [verb](https://expressjs.com/en/4x/api.html#app.METHOD) of the route. |
| `name` | The name of the route. This can include url parameters, such as `/user/:id`.   |
| `call` | The callback for the route, taking `req`, `res` and `next` as arguments.       |

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

Alternatively, routes can be loaded recursively from a folder. The `strict` flag indicates whether invalid files should throw an error (`true`) or be ignored (`false`).

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

A list of directories to serve as statics can be provided to `statics`. The `strict` flag indicates whether invalid paths should throw an error (`true`) or be ignored (`false`).

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
	error: (req, res) => res.redirect('/404.html'),
	api: {
		error: (req, res) => res.redirect('/404-api.html')
	}
});
```

## License

[MIT](LICENSE)
