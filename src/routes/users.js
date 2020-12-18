const express = require('express');
const { auth } = require('../middleware/auth');

const {
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
} = require('../controllers/user-controller');

const router = express.Router();

router
	.route('/users/me')
	.get(auth, getUserProfile)
	.delete(auth, deleteUser)
	.patch(auth, updateUser);

router.get('/users/:id/avatar', getAvatar);

router.post('/users', createUser);
router.post('/users/login', login);
router.post('/users/logout', auth, logout);
router.post('/users/logout-all', auth, logoutAllDevices);

router.post('/users/me/avatar', auth, upload.single('upload'), uploadAvatar);

router.delete('/users/me/avatar', auth, deleteAvatar);

module.exports = router;
