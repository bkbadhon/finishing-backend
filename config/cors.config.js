const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://finishing-admin.vercel.app',
        'http://localhost:5174',
        'http://127.0.0.1:5173'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = corsOptions;