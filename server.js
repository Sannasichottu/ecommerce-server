const app = require('./app');
const mongoose = require('mongoose');

require('dotenv').config()

//Handling uncaught exception
process.on("uncaughtException",(err) => {
    console.log(`Error:${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
})


//mongoose connection
const uri = process.env.ATLAS_URI
mongoose.set('strictQuery', false);
mongoose.connect(uri,err => {
    if(err) throw err;
})
const connection = mongoose.connection;
connection.once('open',()=>{
    console.log("Db connection successfully")
})




const server = app.listen(process.env.PORT,()=> {
    console.log(`Server is Working on ${process.env.PORT}`)
})

//unhandled Promise Rejection
process.on("unhandledRejection",err=>{
    console.log(`Error:${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);

    server.close(() => {
        process.exit(1);
    })
})
