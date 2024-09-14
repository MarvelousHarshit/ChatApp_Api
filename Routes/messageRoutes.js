const express = require('express');
const { verifyUser } = require('../middlewares/verifyUser');
const { sendMessage, allMessages } = require('../routeHandlers/messageController');

const router = express.Router();

router.route('/').post(verifyUser, sendMessage);
router.route('/:chatId').get(verifyUser, allMessages);

module.exports  = router;