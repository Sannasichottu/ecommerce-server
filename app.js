const express = require('express');
const app =express();
app.use(express.json());
const errorMiddleware = require('./middleware/error');

//Route Imports
const product = require("./routes/productRoute");

app.use("/api/v1",product);


//Middleware                         1.08.51

app.use(errorMiddleware)

module.exports = app;