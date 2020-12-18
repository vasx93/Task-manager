const mongoose = require('mongoose');

mongoose
	.connect(process.env.DB_LOCAL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})
	.then(db => console.log(`MongoDB connection  successful!`))
	.catch(err => console.log(err));
