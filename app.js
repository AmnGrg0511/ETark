require("dotenv").config();
require("./config/database").connect();
const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const auth = require("./middleware/auth");

app.get("/home", auth, (req, res) => {
  	return res.status(200).send("Success");
});

const User = require("./model/user");

app.post("/signup", async(req, res) => {
	try {
		const {name, email, password} = req.body;
		if(!(name && email && password)) {
			return res.status(400).send("All inputs are required");
		}
		const oldUser = await User.findOne({ email });
		if(oldUser){
			return res.status(409).send("User already exists");
		}
		encryptedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({
			name,
			email: email.toLowerCase(),
			password: encryptedPassword,
		})
		const token = jwt.sign(
			{ user_id: user._id, email },
			process.env.TOKEN_KEY, 
			{
				expiresIn: "2h",
			}
		)
		user.token = token;
		return res.status(201).json(user);
	} catch(err) {
		console.log(err);
	}
})

app.post("/login", async(req, res) => {
	try {
		const {email, password} = req.body;
		if(!(email && password)){
			return res.status(400).send("All inputs are required");
		}
		const user = await User.findOne({ email });
		if(user && await bcrypt.compare(password, user.password)){
			const token = jwt.sign(
				{ user_id: user._id, email },
				process.env.TOKEN_KEY,
				{
					expiresIn: "2h",
				}
			)
			user.token = token;
			return res.status(200).json(user);
		}
		res.status(400).send("Invalid Credentials");
	} catch (err) {
		console.log(err);
	}
})

module.exports = app;