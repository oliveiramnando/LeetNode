import crypto from "crypto";
import axios from "axios";

const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    REDIRECT_URI,
    FRONTEND_URL,
    NODE_ENV,
} = process.env;

function assertEnv() {
    const missing = [];
    if (!GITHUB_CLIENT_ID) missing.push("GITHUB_CLIENT_ID");
    if (!GITHUB_CLIENT_SECRET) missing.push("GITHUB_CLIENT_SECRET");
    if (!REDIRECT_URI) missing.push("REDIRECT_URI");
    if (!FRONTEND_URL) missing.push("FRONTEND_URL");
    if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

function buildGithubAuthorizeUrl(state) {
    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "read:user user:email",
        state,
    });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export const startGithubOAuth = (req, res) => {
    try {
        assertEnv();

        const state = crypto.randomBytes(16).toString("hex");
        req.session.oauthState = state;

        // Optional but helps some session stores persist before redirect:
        req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Failed to save session" });
            return res.redirect(buildGithubAuthorizeUrl(state));
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const githubCallback = async (req, res) => {
    try {
        assertEnv();

        const { code, state, error, error_description } = req.query;

        if (error) {
            return res.status(400).send(`GitHub OAuth error: ${error_description || error}`);
        }

        if (!code) return res.status(400).send("Missing code parameter");
        if (!state) return res.status(400).send("Missing state parameter");

        const expectedState = req.session.oauthState;
        if (!expectedState || state !== expectedState) {
            return res.status(400).send("Invalid OAuth state");
        }
        delete req.session.oauthState;

        // Exchange code -> access token
        const tokenRes = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI,
                state,
            }, {
                headers: { Accept: "application/json" },
                timeout: 15000,
            }
        );

        const tokenData = tokenRes.data;
        if (tokenData.error) {
            return res.status(400).json({ message: "Failed to obtain access token", details: tokenData });
        }

        const accessToken = tokenData.access_token;
        if (!accessToken) {
            return res.status(400).json({ message: "No access token returned from GitHub" });
        }

        // Fetch GitHub user
        const userRes = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
            },
            timeout: 15000,
        });

        const ghUser = userRes.data;

        // Fetch emails (optional)
        let primaryEmail = null;
        try {
            const emailsRes = await axios.get("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                },
                timeout: 15000,
            });

            const emails = Array.isArray(emailsRes.data) ? emailsRes.data : [];
            primaryEmail =
                emails.find((e) => e.primary && e.verified)?.email ||
                emails.find((e) => e.verified)?.email ||
                emails[0]?.email ||
                null;
            } catch {
            // ignore
        }

        // Create your app session
        req.session.user = {
            provider: "github",
            githubId: ghUser.id,
            username: ghUser.login,
            name: ghUser.name || null,
            avatarUrl: ghUser.avatar_url || null,
            profileUrl: ghUser.html_url || null,
            email: primaryEmail || ghUser.email || null,
        };

        req.session.save((err) => {
            if (err) return res.status(500).send("Internal Server Error");
            return res.redirect(FRONTEND_URL);
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Failed to destroy session" });

    // Must match your session cookie name: you set name: "sid" in config/session.js
    res.clearCookie("sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
    });

    return res.json({ ok: true });
  });
};
