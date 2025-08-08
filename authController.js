// authController.js
exports.register = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 模拟保存到数据库（你后面可以接上 mongoose）
        console.log('📥 Registering user:', email, password);
        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('❌ Register error:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('🔐 Logging in:', email, password);
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ message: 'Login failed' });
    }
};
