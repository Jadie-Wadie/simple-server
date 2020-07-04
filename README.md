# simple-server

![NPM Version](https://img.shields.io/npm/v/@jadiewadie/simple-server)
![NPM Downloads](https://img.shields.io/npm/dw/@jadiewadie/simple-server)
![NPM License](https://img.shields.io/npm/l/@jadiewadie/simple-server)

A simple HTTP/S server, built using [express](https://expressjs.com/)

### Installation

```
npm install @jadiewadie/simple-server
```

### Usage

#### HTTPS

The `https` object is provided to `https.createServer()`. See the [documentation](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) for more details.

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

#### API

##### Route Methods

The following HTTP methods (verbs) are supported:

-   all
-   get
-   post
-   put
-   delete
-   patch
-   head

More information can be found at the [express documentation](https://expressjs.com/en/4x/api.html#app.METHOD).

##### Route Loading

A list of routes can be provided to the `api` option. <br>

```js
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
				call: (req, res) => res.send(`Hello ${req.params.name}!`)
			}
		]
	}
});
```

Alternatively, routes can be loaded recursively from a folder. <br>
The `strict` flag indicates whether invalid files should throw errors.

```js
const server = new Server({
	api: {
		routes: {
			folder: path.join(__dirname, 'api'),
			load: async filename => (await import(filename)).default,
			strict: false
		}
	}
});
```

The `getFiles` function can be used for custom route loading. `getFiles` is recursive.

```js
const { getFiles } = require('@jadiewadie/simple-server');

getFiles(path.join(__dirname, 'api')); // An array of paths
```

#### Statics

A list of directories to serve as statics can be provided to `statics`.

```js
const server = new Server({
	statics: [path.join(__dirname, 'public')]
});
```

#### CORS

The `cors` object is provided as configuration to the [cors](https://www.npmjs.com/package/cors#configuration-options) package.

```js
const server = new Server({
	cors: {
		origin: 'http://localhost:3000'
	}
});
```

#### Error Handling

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
