//standard express setup
const express = require("express");
const app = express();

// Importing routes
const personRoute = require("./Routes/person"); // /person route
const orderRoute = require("./Routes/order");   // /order route

// middleware to parse the incoming request body
app.use(express.json());

// sending requests to the respective routes
app.use("/person", personRoute);
app.use("/order", orderRoute);

// starting the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});