const router = require('express').Router()

router.post('/signup',(req,res)=>{
    res.json('Received');
})

module.exports = router;