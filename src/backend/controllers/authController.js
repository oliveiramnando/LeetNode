import crypto from "crypto";

function getGithubAuthorizeUrl(state) {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: "read:user user:email",
        state
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export const startGithubOAuth = (req,res) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthstate = state;
    res.redirect(getGithubAuthorizeUrl(state));
};

export const githubCallback = async (req,res) => {
    try {
        const {code, state } = req.query;

        if (!state || state !== req.session.oauthState) {
            return res.status(400).send("Invalid OAuth state");
        }

        delete req.session.oauthstate;

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_CALLBACK_URL
            })
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json"
            }
        });

        const ghUser = await userRes.json();

        const emailRes = await fetch("https://api.github.com/user/emails", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json"
            }
        });

        let email = null;
        if (emailRes.ok) {
            const emails = await emailRes.json();
            const primary = emails.find(e => e.primary && e.verified);
            email = primary?.email ?? null;
        }

        req.session.user = {
            githubId: ghUser.id,
            username: ghUser.login,
            avatarUrl: ghUser.avatar_url,
            email
        };

        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}
