const router = require('express').Router()
const {signup} = require('../Controllers/authenticationController')
router.post('/signup',signup);

module.exports = router;