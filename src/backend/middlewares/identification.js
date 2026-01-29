import jwt from 'jsonwebtoken';

export const identifier = (req,res,next) => {
    try {
        let raw = req.get('authorization');
        let source = 'header';

        if(!raw) {
            raw = req.cookies?.Authorization;
            source = 'cookie';
        }

        if (!raw || !raw.toLowerCase().startsWith('bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Bearer token missing!"
            })
        }

        const token = raw.slice(7).trim();
        const payload = jwt.verify(token, process.env.TOKEN_SECRET);

        req.user = {
            id: String(payload.userId),
            email: payload.email
        }
        next();
    } catch (error) {
        return res.status(401).json({
            success:false,
            message: "invalid or expired token"
        });
    }
}