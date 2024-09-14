const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log(`Connected to ${con.connection.host}`)
    } catch (e) {
        console.log(`Error connecting to ${e.message}`);
        process.exit();

    }
}

module.exports = connectDB;



// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGODB_CONNECTION_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then((r) => {
//     console.log('connected!')
// }).catch((e) => {
//     console.log('Error connecting to MongoDB driver');
//     console.log(e.message);
//     console.log(e);
// })
