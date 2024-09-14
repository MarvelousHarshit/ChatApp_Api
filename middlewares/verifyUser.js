const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const Chat = require('../models/chatModel');


const verifyUser = async (req, res, next) => {
    // console.log(req)
    // console.log(req.headers)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            var token = req.headers.authorization.split(" ")[1];
            // console.log('hi');
            const decodedInfo = jwt.verify(token, process.env.TOKEN_SECRET);
            const user_id = decodedInfo.id;
            console.log("Current User : ", user_id);
            // console.log("Current User : ", user_id);
            req.user = await User.findById(user_id).select("-password");
            //    console.log(req.user);
            if (!req.user) {
                return res.send('User DNE');
                // return;

            };
            // console.log(req.user)
            next();
        } catch (e) {
            res.json('Invalid token! relogin');
            throw new Error('Invalid token.. or some error occured in DB');
            // next();
        }

    } else {
        res.status(401).json('Invalid session. Please Login');
        // throw new Error("Not authorized. No token received from CLient");
    }
}



module.exports = { verifyUser };  //exports the value
// module.exports = verifyUser;  