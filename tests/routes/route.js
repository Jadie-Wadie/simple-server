module.exports = {
	verb: 'get',
	name: '/route',
	call: function (req, res) {
		res.send('Hello!');
	}
};
