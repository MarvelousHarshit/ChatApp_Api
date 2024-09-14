const express = require('express');
const {signUp, login, getAllUsers} = require('../routeHandlers/userController');
const { verifyUser } = require('../middlewares/verifyUser');
const router = express.Router();

router.route('/').post(signUp);
router.route('/').get(verifyUser, getAllUsers);
router.post('/login', login);

module.exports = router;