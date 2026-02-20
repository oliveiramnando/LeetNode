# LeetNode

LeetNode is a full-stack web application that enhances the LeetCode experience by providing structured profile viewing, GitHub identity verification, and the foundation for a social layer around competitive programming.

It integrates LeetCode data with GitHub OAuth to create verified, interactive developer profiles.


## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TailwindCSS

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- GitHub OAuth
- `leetcode-query` (LeetCode GraphQL wrapper)


## Authentication Flow

1. User signs in via GitHub OAuth  
2. Backend verifies GitHub identity  
3. GitHub URL is matched against the user’s LeetCode profile  
4. Session is established using cookies  


## Data Source

LeetNode retrieves public LeetCode profile data using:

- `leetcode-query`
- Public profile fields (question counts, contributions, GitHub URL, etc.)

Future versions will expand analytics and submission insigh
