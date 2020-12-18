const request = require('supertest');
const expect = require('expect');
const mongoose = require('mongoose');
const app = require('../src/app-test');
const Task = require('../src/models/task-models');
const { userOne, userOneID, userTwo, userTwoID } = require('./user-test');

//*       TEST TASKS

const taskOne = {
	_id: new mongoose.Types.ObjectId(),
	description: 'Mocha prvi user',
	completed: true,
	author: userOneID,
};

const taskTwo = {
	_id: new mongoose.Types.ObjectId(),
	description: 'Mocha drugi user',
	completed: true,
	author: userTwoID,
};

describe('Task model', () => {
	before(async () => {
		await Task.deleteMany();
		await new Task(taskOne).save();
		await new Task(taskTwo).save();
	});

	it('CREATE new task', async function () {
		const response = await request(app)
			.post('/tasks')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send({
				description: 'da vidmo vrace li sve',
			})
			.expect(201);

		const task = await Task.findById(response.body._id);
		expect(task).not.toBeNull();
	});

	it('GET tasks', async () => {
		const response = await request(app)
			.get('/tasks')
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send()
			.expect(200);

		const task = Task.find({ author: response.body._id });

		expect(response.body.length).toEqual(2);
	});

	it('DELETE tasks', async () => {
		const response = await request(app)
			.delete(`/tasks/${taskOne._id}`)
			.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
			.send()
			.expect(200);

		const task = await Task.find({ author: userOneID });

		expect(task.length).toBe(1);
	});

	it('NOT delete tasks by other users', async () => {
		const response = await request(app)
			.delete(`/tasks/${taskOne._id}`)
			.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
			.send()
			.expect(404);

		const task = await Task.find({ author: userOne._id });

		expect(task).not.toBeNull();
	});
});
