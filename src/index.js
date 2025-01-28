const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

const port = config.port;

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port

const connectDb = async () =>{
    try{
        await mongoose.connect(process.env.MONGODB_URL,config.mongoose.options)
    }catch(err){
        console.log("Couldn't connect to DB!")
    }
}
connectDb();

app.listen(port,()=>console.log(`Server listening at port ${port}`));

let server;

