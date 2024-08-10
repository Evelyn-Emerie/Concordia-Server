const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const path = require("path");

let requestCounter = 0;

// Process all requests to increase worker usage
app.use((req, res, next) => {
	requestCounter++;
	if (requestCounter > 15) {
		cluster.worker.send("REQ[Fork]"); // Request a new fork
		console.log(`I:[${process.pid}] requests per minute = ${requestCounter}`);
	}
	next();
});

// Make sure that json gets parsed correctly
app.use(express.json());
app.use(cors());

// Load all endpoints
const endpoints = path.join(__dirname, "../api");
fs.readdirSync(endpoints).forEach((file) => {
	const endpoint = require(path.join(endpoints, file));
	endpoint(app);
});

// Start listening
app.listen(process.env.PORT, () => {
	console.log(`App listening on port ${process.env.PORT}`);
});

// Remove a request every second from counter
setInterval(() => {
	if (requestCounter > 0) requestCounter--;
}, 1000); // 1 second

//! Kill workr after ttl of inactivity
setTimeout(() => {
	cluster.worker.kill();
}, process.env.TTL * 1000 * 60); // ttl = minutes