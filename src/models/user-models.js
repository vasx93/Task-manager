const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task-models');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		age: {
			type: Number,
			default: 18,
			validate(value) {
				if (value < 18) {
					throw new Error('Must be a over 18 to enter!');
				}
			},
		},
		email: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			lowercase: true,
			validate(value) {
				if (!isEmail(value)) {
					throw new Error('Invalid email format!');
				}
			},
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minlength: 6,
			validate(value) {
				if (value.toLowerCase().includes('password')) {
					throw new Error('Password cannot contain -password-');
				}
			},
		},
		avatar: {
			type: Buffer,
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

userSchema.virtual('userTasks').get(function () {
	const user = this.user;
	return user.tasks;
});
//? virtual property ?? --- RELATIONSHIP between user and tasks

userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'author',
});

//*  methods are used on instances of Models(User) --- user ~~~~ generating login TOKEN

userSchema.methods.generateToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
		expiresIn: '2h',
	});

	user.tokens = user.tokens.concat({ token });

	await user.save();

	return token;
};

//* Hiding private data

userSchema.methods.toJSON = function () {
	const user = this;

	const userObj = user.toObject();
	delete userObj.password;
	delete userObj.tokens;
	delete userObj.avatar;

	return userObj;
};

//* statics are used on Models(User)

userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });
	if (!user) {
		throw new Error('No user by that email');
	}

	const match = await bcrypt.compare(password, user.password);
	if (!match) {
		throw new Error('Wrong password!');
	}
	return user;
};

//* pre-save HASH hook with mongoose schema
userSchema.pre('save', async function (next) {
	const user = this;

	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 6);
	}
	next();
});

//* delete all tasks once user is deleted
userSchema.pre('remove', async function (next) {
	const user = this;
	await Task.deleteMany({ author: user._id });
	next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
