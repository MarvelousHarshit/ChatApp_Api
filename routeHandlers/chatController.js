
const asyncHandler = require('express-async-handler')
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const { default: mongoose } = require('mongoose');
const accessChat = async (req, res) => {
    const { id } = req.body;
    console.log('inside access chat route : id :', id)
    if (!id) {
        return res.send('No user selected for chat');
    }

    try {
        try {
            var chats = await Chat.find({
                isGroupChat: false,
                users: { $all: [req.user._id, id] },
            }).populate('users', '-password')
                .populate('lastMessage')  // how is it working?
            // console.log(chats);

            chats = await User.populate(chats, {
                path: 'lastMessage.sender',
                select: 'name email pp'
            })
        }
        catch (e) {
            res.staus(400).send(e.message);
            throw new Error(e);
        }
        if (chats.length > 0) {
            res.status(201).send(chats[0]);
        }
        else {
            var user = (await User.findById(id));
            var chatdata = {
                isGroupChat: false,
                users: [req.user._id, id],
                chatName: user.name
            }

            Chat.create(chatdata).then(async (newchat) => {
                newchat = await newchat.populate('users', '-password');
                res.status(201).send(newchat);
            }).catch((e) => {
                res.send(e.message);
                throw new Error(e);
            })
        }
    }
    catch (e) {
        res.send('uncaught error');
        throw new Error(e);
    }
}

const fetchChat = async (req, res) => {
    try {
        var chats = await Chat.find({
            users: { $in: [req.user._id] }
        }).populate('users', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })

        User.populate(chats, {
            path: 'lastMessage.sender',
            select: 'name email pp'
        }).then((result) => {
            res.send(result)
        }).catch((e) => {
            res.send(e.message);
            throw new Error(e);
        })

    }
    catch (e) {
        res.status(400).send(e.message);
        throw new Error(e);
    }
}

const deleteChat = async (req, res) => {
    const { chat_id } = req.body;
    console.log("CHat id to del : ", chat_id)
    if (!chat_id) return res.json({ success: false, message: 'Please select a chat to delete' });

    try {
        // chat_id = chat_id+'c';
        console.log("new : ", chat_id);
        // const exists = await Chat.findById(chat_id);
        // console.log("chat exists : ", exists);
        // if (!exists) return res.json({ success: false, message: "No chat exists" });

        const result = await Chat.deleteOne({ _id: chat_id })
        if (result.deletedCount)
            return res.json({ success: true, message: "Successfully deleted !" });
        else {
            return res.json({ success: false, message: "No chat exists" });
        }


    }
    catch (e) {
        console.log(e);
        return res.status(400).json({ success: false, message: "something went wrong. Try Again!" });
    }
}

const createGroup = async (req, res) => {
    // var sentusers = [];
    var groupname;
    ({ sentusers, groupname } = req.body);

    sentusers = JSON.parse(sentusers);
    if (!sentusers || !groupname) {
        return res.send('Input all the fields')
    }
    if (sentusers.length <= 2) {
        return res.send('At least three members required to create group ');
    }
    console.log(sentusers)
    console.log(typeof (sentusers))
    sentusers.push(req.user._id);


    //to enable promise chaining return the promise after every .then()
    Chat.create({
        isGroupChat: true,
        chatName: groupname,
        users: sentusers,
        groupAdmin: req.user._id
    }).then((result) => {
        return Chat.populate(result, [  //to DO : why can i not use User.populate()

            { path: 'users', select: '-password' },
            { path: 'groupAdmin', select: '-password' },  // To DO : set its isGroupAdmin : true
            { path: 'lastMessage' }
        ])

    }).then((result) => {
        console.log(2, " ", result)
        return User.populate(result, {
            path: 'lastMessage.sender',
            select: 'name email pp'
        })
    }).then((result) => {
        console.log(3, " ", result)
        res.send(result);
    }).catch((e) => {
        res.send(e.message);
        throw new Error(e)
    })

}

const renameGroup = async (req, res) => {

    const { id, chatName } = req.body;
    if (!id || !chatName) {
        return res.send('Input all the fields');
    }
    const isUserInChat = await Chat.find({
        _id: id,
        users: { $in: [req.user._id] }
    })
    console.log(isUserInChat)
    if (isUserInChat.length == 0) {
        return res.send('No group exists for you with the given ID');
    }



    var groupchat = await Chat.findByIdAndUpdate(
        id,
        {
            chatName: chatName
        },
        { new: true }
    )

    groupchat.populate([
        { path: 'users', select: '-password' },
        { path: 'groupAdmin', select: '-password' },
        { path: 'lastMessage' }
    ]).then((result) => {
        return User.populate(result, {
            path: 'lastMessage',
            select: 'name email pp'
        }).then((r) => {
            res.send(r);
        }).catch((e) => {
            res.status(400).send('sth went wrong while renaming group');
            throw new Error(e);
        })
    })
}

const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin
    var results = await Chat.find({
        _id: chatId,
        groupAdmin: { $eq: req.user._id }
    });

    if (results.length == 0) {
        return res.send('U are unauthorized to remove a memeber.')
    }

    var memberExists = true;
    for (const result of results) {
        if (!result.users.includes(userId)) {
            memberExists = 0;
            break;
        }
    }
    if (!memberExists) {
        return res.send('No member exists');
    }


    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(removed);
    }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin
    var results = await Chat.find({
        _id: chatId,
        groupAdmin: { $eq: req.user._id }
    });

    if (results.length == 0) {
        return res.send('U are unauthorized to add a memeber.')
    }

    //to check if member already exists
    var memberExists = false;
    for (const result of results) {
        if (result.users.includes(userId)) {
            memberExists = true;
            break;
        }
    }

    if (memberExists) {
        return res.send('Member already exists.');
    }



    try {
        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { users: userId },
            },
            {
                new: true,
            }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");
        res.send(added)
    }
    catch (e) {
        res.send(e.message);
        throw new Error(e)
    }
});



// if (!added) {
//     res.status(404);
//     throw new Error("Chat Not Found");
// } else {
//     res.json(added);
// }


module.exports = { accessChat, fetchChat, createGroup, renameGroup, addToGroup, removeFromGroup, deleteChat }