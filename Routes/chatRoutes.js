const express = require('express');
const { verifyUser } = require('../middlewares/verifyUser');
const { accessChat, fetchChat, createGroup, renameGroup, addToGroup, removeFromGroup, deleteChat } = require('../routeHandlers/chatController');
const router = express.Router();

router.route('/').post(verifyUser, accessChat);
router.route('/').get(verifyUser, fetchChat);
router.route('/delete').post(verifyUser, deleteChat);
router.route('/group').post(verifyUser, createGroup);
router.route('/group/rename').post(verifyUser, renameGroup);
router.route('/group/add_to_group').post(verifyUser, addToGroup);
router.route('/group/remove_from_group').post(verifyUser, removeFromGroup);

module.exports = router;