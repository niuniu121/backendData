// auth.js
const express = require('express');
const router = express.Router();
const { login, register } = require('../authController'); // 加上 register 控制器

router.post('/login', login);
router.post('/register', register); // ✅ 加上这一行

module.exports = router;
