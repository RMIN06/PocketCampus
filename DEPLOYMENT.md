# PocketCampus deployment checklist

## Single Vercel project

1. Import the repository in Vercel with the repository root as the project root. Do not set the Root Directory to `frontend`.
2. The included `vercel.json` installs the frontend dependencies, exports the Next.js application to `frontend/out`, and rewrites `/api/*` to the FastAPI function in `api/index.py`.
3. Add these Production environment variables in Vercel: `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `JWT_ALGORITHM`, `GOOGLE_CLIENT_ID`, `CORS_ORIGINS`, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
4. Leave `NEXT_PUBLIC_API_URL` unset in Vercel. The frontend then calls the FastAPI function on the same deployment domain at `/api/v1`.
5. Set `CORS_ORIGINS` to your exact Vercel production URL, such as `https://pocketcampus.vercel.app`. Add your custom domain too when one is connected.
6. Deploy from `main`. Vercel uses Node.js for the frontend and Python dependencies from the root `requirements.txt` for the API.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`, a long random `JWT_SECRET`, and `GOOGLE_CLIENT_ID`.
2. Copy `frontend/.env.example` to `frontend/.env.local` and set the same Google web client ID.
3. Start the API with `uvicorn app.main:app --reload --port 8001` from `backend`, then start Next.js with `npm.cmd run dev -- --port 3001` from `frontend`.
4. Visit `http://localhost:3001`, sign in, and add an expense. The API creates `users` and `expenses` collections and their indexes automatically.

## MongoDB Atlas

1. Create a database user with a strong password and grant it only `readWrite` access to the `pocketcampus` database.
2. In Network Access, allow the backend host's outbound IP address. Do not use `0.0.0.0/0` for a production deployment.
3. Put the Atlas connection string in the hosting provider's `MONGO_URI` secret. Never commit it to Git.
4. Rotate the existing Atlas password and JWT secret because they were present in an untracked local `.env` file during development.

## Google OAuth publication

1. In Google Cloud Console, select the project and open **Google Auth Platform → Branding**.
2. Enter the app name, support email, developer contact email, authorized domain, homepage URL, privacy-policy URL, and terms-of-service URL. Save the page; these fields clear the “OAuth configuration is incomplete” warning.
3. Open **Audience**. Keep **Testing** while using test users; add every Google account that should test. To release publicly, choose **In production** and complete Google verification if the selected scopes or user type require it.
4. Open **Clients**, edit the Web client, and add every exact frontend URL under **Authorized JavaScript origins** (for example `https://app.example.com`) and any redirect URL only if a redirect-based OAuth flow is added later. The current Google Identity Services token flow requires the origin, not a redirect URI.
5. Set the same web client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`. Set `CORS_ORIGINS` to the exact deployed frontend HTTPS origin.
6. Use only basic `openid`, `email`, and `profile` identity scopes. They normally do not require sensitive-scope verification, but public branding details are still required.
