const request = require('supertest');
const expect = require('expect');
const jwt = require('jsonwebtoken');
const app = require('../src/app-test');
const mongoose = require('mongoose');
const User = require('../src/models/user-models');

//*     TEST USERS

const userOneID = new mongoose.Types.ObjectId();
const userOne = {
	_id: userOneID,
	name: 'Skovex Mudex',
	email: 'skovex@test.com',
	password: 'babaroga',
	age: 27,
	tokens: [
		{
			token: jwt.sign({ _id: userOneID }, process.env.JWT_SECRET),
		},
	],
};

const userTwoID = new mongoose.Types.ObjectId();
const userTwo = {
	_id: userTwoID,
	name: 'Vasko Raketic',
	email: 'vasko@test.com',
	password: 'babaroga',
	tokens: [
		{
			token: jwt.sign({ _id: userTwoID }, process.env.JWT_SECRET),
		},
	],
};

describe('User model testing', function () {
	before(async () => {
		await User.deleteMany();
		await new User(userOne).save();
		await new User(userTwo).save();
	});

	it('CREATE new user', async () => {
		const response = await request(app)
			.post('/users')
			.send({
				name: 'mocha jebena',
				email: 'vasko@mocha.com',
				password: 'babaroga',
			})
			.expect(201);

		const user = await User.findById(response.body.user._id);
		expect(user).not.toBeNull();
	});

	it('Login user', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({
				email: userOne.email,
				password: userOne.password,
			})
			.expect(200);

		const user = await User.findById(userOneID);

		expect(response.body.token).toBe(user.tokens[1].token);
	});

	it('BAD login user', async () => {
		await request(app)
			.post('/users/login')
			.send({
				email: 'bla@gmail.com',
				password: userOne.password,
			})
			.expect(400);
	});

	it('READ user profile', async () => {
		await request(app)
			.get('/users/me')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send()
			.expect(200);
	});

	it('BAD profile read', async () => {
		await request(app).get('/users/me').send().expect(401);
	});

	it('UPLOAD avatar', async () => {
		const response = await request(app)
			.post('/users/me/avatar')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.attach('upload', 'test/fixtures/ja.jpg')
			.expect(200);

		const user = await User.findById(userOneID);

		expect(user.avatar).toEqual(expect.any(Buffer));
	});

	it('DELETE avatar', async () => {
		const response = await request(app)
			.delete('/users/me/avatar')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send()
			.expect(200);

		const user = await User.findById(userOneID);
		expect(user.avatar).not.toEqual(expect.any(Buffer));
	});

	it('UPDATE user', async () => {
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send({
				name: 'Vaskooou',
				age: 32,
			})
			.expect(200);

		const user = await User.findById(userOneID);
		expect(user.name).toBe('Vaskooou');
	});

	it('BAD UPDATE', async () => {
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send({
				location: 'Belgrade',
			})
			.expect(400);

		const user = await User.findById(userOneID);
		expect(user.location).toBe(undefined);
	});

	it('NOT delete user account', async () => {
		await request(app).delete('/users/me').send().expect(401);

		const user = await User.findById(userOneID);
		expect(user).not.toBeNull();
	});

	it.skip('DELETE user account', async () => {
		const response = await request(app)
			.delete('/users/me')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send()
			.expect(200);
	});
});

module.exports = { userOne, userOneID, userTwo, userTwoID };
