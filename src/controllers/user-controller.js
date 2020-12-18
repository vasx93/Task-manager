require('../db/mongoose');
const sharp = require('sharp');
const { welcomeEmail, cancelAccountEmail } = require('../emails/account');
const multer = require('multer');
const User = require('../models/user-models');

//* controllers

async function createUser(req, res) {
	try {
		const user = await User.create(req.body);

		if (!user) {
			return res.status(400).send({ message: 'Something went wrong' });
		}
		const token = await user.generateToken();
		// welcomeEmail(user.email, user.name);
		res.status(201).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
}

async function getUserProfile(req, res) {
	try {
		if (!req.user) {
			return res.status(404).send();
		}
		res.status(200).send(req.user);
	} catch (err) {
		res.status(400).send(err);
	}
}

// router.post(
// 	'/users/me/avatar',
// 	auth,
// 	upload.single('upload'),
// 	async (req, res) => {
// 		const sharpBuffer = await sharp(req.file.buffer)
// 			.resize(250, 250)
// 			.png()
// 			.toBuffer();

// 		req.user.avatar = sharpBuffer;
// 		await req.user.save();

// 		res.send();
// 	},
// 	(error, req, res, next) => {
// 		res.status(400).send({ error: error.message });
// 	}
// );

const upload = multer({
	limits: {
		fileSize: 1_000_000,
	},
	fileFilter(req, file, cb) {
		// if (!file.originalname.endsWith('.jpg') && (!file.originalname.endsWith('.png')) ...

		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Upload in correct format!'));
		}
		cb(undefined, true);
	},
});

async function uploadAvatar(req, res) {
	try {
		const sharpBuffer = await sharp(req.file.buffer)
			.resize(250, 250)
			.png()
			.toBuffer();

		req.user.avatar = sharpBuffer;
		await req.user.save();

		res.status(200).send({ msg: 'Avatar uploaded' });
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
}

async function getAvatar(req, res) {
	const _id = req.params.id;

	try {
		const user = await User.findById(_id);

		if (!user || !user.avatar) {
			return res.status(404).send({ msg: 'No user or image found!' });
		}

		res.set('Content-Type', 'image/png');
		res.status(200).send(user.avatar);
	} catch (err) {
		res.status(404).send(err);
	}
}

async function deleteAvatar(req, res) {
	try {
		if (!req.user.avatar) {
			return res.status(404).send();
		}
		req.user.avatar = undefined;
		await req.user.save();
		res.status(200).send({ msg: 'Avatar deleted' });
	} catch (err) {
		res.status(400).send(err);
	}
}

async function updateUser(req, res) {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];

	const isValid = updates.every(update => allowedUpdates.includes(update));

	if (!isValid) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		const user = req.user;

		if (!user) {
			return res.status(404).send();
		}

		updates.forEach(update => (user[update] = req.body[update]));

		await user.save();

		res.status(200).send({ msg: 'Updates successful!', user });
	} catch (err) {
		res.status(400).send(err);
	}
}

async function deleteUser(req, res) {
	try {
		if (!req.user) {
			return res.status(404).send({ msg: 'No user found' });
		}

		const user = await User.findOneAndDelete(req.user._id);

		// req.user.remove();
		cancelAccountEmail(req.user.email, req.user.name);

		res.status(200).send({ msg: 'Delete successful' });
	} catch (err) {
		res.status(400).send(err);
	}
}

async function login(req, res) {
	const { email, password } = req.body;

	try {
		const user = await User.findByCredentials(email, password);

		if (!user) {
			return res.status(400).send({ msg: 'Something went wrong' });
		}

		const token = await user.generateToken();

		res.status(200).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
}

async function logout(req, res) {
	try {
		req.user.tokens = req.user.tokens.filter(tokenObj => {
			return tokenObj.token !== req.token;
		});

		await req.user.save();

		res.status(200).send({ msg: 'logout complete' });
	} catch (e) {
		res.status(500).send(e);
	}
}

async function logoutAllDevices(req, res) {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.status(200).send({ msg: 'Logged out from all devices' });
	} catch (error) {
		res.status(500).send();
	}
}

module.exports = {
	createUser,
	getUserProfile,
	updateUser,
	deleteUser,
	getAvatar,
	upload,
	uploadAvatar,
	deleteAvatar,
	login,
	logout,
	logoutAllDevices,
};
