
export const identifier = (req,res,next) => {
    try {
        if (!req.session.accessToken) {
            return res.status(401).json({
                success:false,
                message: "No token provided"
            });
        }
        
        next();
    } catch (error) {
        if (error.response?.status === 401) {
            delete req.session.accessToken;
            return res.status(401).json({
                success:false,
                message: "invalid or expired token"
            });
        }
        return res.status(500).json({
            error: 'Failed to fetch user data'
        });
    }
}