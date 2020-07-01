# simple-server

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
server.start(3000);
```

#### API

A list of routes can be provieded to the `api` option.

```js
const server = new Server({
	api: [
		{
			name: '/ping',
			call: (req, res) => res.send('Pong!')
		},
		{
			name: '/hello/:name',
			call: (req, res) => res.send(`Hello ${req.params.name}!`)
		}
	]
});
```

Alternatively, routes can be loaded recursively from a folder.

```js
const server = new Server({
	api: {
		folder: './api',
		load: async filename => (await import(filename)).default
	}
});
```

The `getFiles` function can be used for custom route loading.

```js
const { getFiles } = require('@jadiewadie/simple-server');

console.log(await getFiles('./api')); // An array of paths
```

#### Statics

A list of directories to serve as statics can be provided to `statics`.

```js
const server = new Server({
	statics: ['./public']
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

A custom handler can be provided to `error`.

```js
const server = new Server({
	error: (req, res) => res.redirect('/404-error.html')
});
```

## License

[MIT](LICENSE)
