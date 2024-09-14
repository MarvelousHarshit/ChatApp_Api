const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema =  new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pp: {
        type: String, default: "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=1380&t=st=1686832076~exp=1686832676~hmac=d35576eae0872b724cf33e52bdf6d601e23db19748090f584254fd6de71ecc06"
    },
    isAdmin: {
        type: String,
        required: true,
        default: false
    }
},
    {
        timestamps: true,
    });

userSchema.methods.verifyPassword = async function (entered_pass) { 
      //instance method to verify password
      console.log('Ent : ', entered_pass)
      console.log('Hash : ', this.password)
    var x = await bcrypt.compare(entered_pass, this.password);
    console.log(x);
    return x;
}

userSchema.pre('save', async function (next) {                      // inbuilt instance method called before 'save' and runs a middleware
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    next();
})

const User = mongoose.model('User', userSchema);
module.exports = User;
