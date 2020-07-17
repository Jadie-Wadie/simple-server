import { Route } from '../../src';

module.exports = {
	verb: 'get',
	name: '/route',
	call: function (req, res) {
		res.send('Hello!');
	}
} as Route;
