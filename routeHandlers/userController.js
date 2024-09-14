const express = require('express')
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel.js');
const generateToken = require('../config/generateToken');

const signUp = asyncHandler(async (req, res) => {
    const { name, email, password, pp } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({message:'Input all the fields' })
        // throw new Error('Input all the fields');
    }
    try {
        const user = await User.create({
            name,
            email,
            password,
            pp
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                pp: user.pp,
                token: generateToken(user._id)
            })
        } else {
            res.status(400).json({message:'Failed to signUp. Please try again' })

            // throw new Error('Failed to signUp. Please try again');
        }
    } catch (error) {

        res.status(400).json({message : error.message})
    }

})

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
    }

    const isPasswordValid = await user.verifyPassword(password);

    if (user && isPasswordValid) {
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                pp: user.pp,
                token: generateToken(user._id)
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});


const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const search_key = req.query.search;
        console.log("search query in online users : ",search_key);
        const keyword = search_key
            ? {
                $or: [
                    { name: { $regex: search_key, $options: "i" } },
                    { email: { $regex: search_key, $options: "i" } },
                ]
            }
            : {};

        const allusers = await User.find(keyword).find({ _id: { $ne: req.user._id } });
        res.status(200).send(allusers);
    }
    catch (e) {
        res.status(400).send('sth went wrong in the db query');
        // throw new Error('sth went wrong in the db query')
    }
})

module.exports = { signUp, login, getAllUsers };