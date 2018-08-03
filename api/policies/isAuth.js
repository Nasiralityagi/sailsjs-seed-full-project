module.exports = function (req, res, next) {
	var token;
	// Check if authorization header is present
	if (req.headers && req.headers.authorization) {
		//authorization header is present
		var parts = req.headers.authorization.split(' ');
		if (parts.length == 2) {
			var scheme = parts[0];
			var credentials = parts[1];

			if (/^Bearer$/i.test(scheme)) {
				token = credentials;
			}
		} else {
			return res.status(401).send({ err: 'Format is Authorization: Bearer [token]' });
		}
	} else {
		//authorization header is not present
		return res.status(401).send({ err: 'No Authorization header was found' });
	}

	jwToken.verify(token, async function (err, token) {

		if (err) {
			return res.status(401).send({ err: 'Invalid token' });
		}

		let strReq = req.url;

		if ((_.includes(req.url, 'findOne') || _.includes(req.url, 'find')) && (req.url.match(/\//g) || []).length == 3) {
			let n = req.url.lastIndexOf('/');
			strReq = req.url.substring(0, n);

		}
		else if (_.includes(req.url, '?')) {
			let n = req.url.lastIndexOf('?');
			strReq = req.url.substring(0, n);
		}
		
		let check = false;

		// console.log('user',token.user);
		const user = await User.findOne({where: {id: token.user.id}}).populate('role');
		if(!user){
			return res.status(401).send({ err: 'User not found please login  again.' });
		}
	
		let roleRoutes = await RolesRoutes.find({ roles: user.role.id, status_id: { '!=': Status.DELETED } }).populate('routes');

		for (let rr of roleRoutes) {
			if (rr.routes.end_point == strReq) {
				check = true;
				break;
			}

		}
		if (check) {
			req.token = token;
			next();
			return;
		}

		let userRoutes = await UsersRoutes.find({ user: user.id, status_id: { '!=': Status.DELETED } }).populate('routes');
		for (let ur of userRoutes) {

			if (ur.routes.end_point == strReq) {
				check = true;
				break;
			}

		}
		if (!check) {
			return res.status(401).send({ err: 'unauthrized url' });
		}
		req.token = token;
		next();
		return;
	
	


	});

};

