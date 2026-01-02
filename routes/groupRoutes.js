const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const isAuth = require('../middleware/isAuth');

router.get('/', isAuth, groupController.getGroups);
router.get('/create', isAuth, groupController.getCreateGroupForm);
router.post('/create', isAuth, groupController.createGroup);
router.get('/:id', isAuth, groupController.getGroupById);
router.post('/delete/:id', isAuth, groupController.deleteGroup);

module.exports = router;
