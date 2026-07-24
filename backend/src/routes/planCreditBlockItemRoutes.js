const express = require('express');
const router = express.Router();
const planCreditBlockItemController = require('../controllers/planCreditBlockItemController');

router.get('/', planCreditBlockItemController.getAll);

module.exports = router;
