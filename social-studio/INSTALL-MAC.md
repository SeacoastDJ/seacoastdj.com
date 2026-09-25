# Install on a Mac with VS Code

## Requirements

- Node.js 20 or newer
- VS Code
- Terminal

## First launch

1. Open the `social-studio` folder in VS Code (it lives inside the `seacoastdj.com` repo).
2. Open **Terminal → New Terminal**.
3. Run:

```bash
cp .env.example .env
npm install
npm run dev
```

4. Visit <http://localhost:3000>.
5. Sign in using the email and password in your private `.env` file.

## Set a secure local password

Open `.env` in VS Code and replace:

```text
SESSION_SECRET=replace-with-a-long-random-string
ADMIN_PASSWORD=change-me-before-running
```

Use a unique password and a long random session secret. Never commit `.env`; it is already excluded by `.gitignore`.

## Stop the application

Return to Terminal and press **Control+C**.
