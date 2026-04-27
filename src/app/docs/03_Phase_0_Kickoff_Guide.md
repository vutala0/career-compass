# Phase 0: Kickoff Guide
**Goal:** Get a "Hello World" Career Compass app running on your laptop AND deployed to a public URL — *before* writing a single line of product code.
**Time estimate:** 60–90 minutes
**Prerequisites:** A laptop. That's it.

---

## Why We're Doing It This Way

> **PM Concept: "Deployment-First Development"**
> The single most common mistake in software projects is building a lot of code, then trying to deploy it on day 30 — and discovering the deploy is broken. By deploying a *trivial* app on day 1, we prove the entire pipeline (laptop → GitHub → public URL) works. Every change after this is small. We never face a "big scary deploy" again.
>
> This is a principle that travels: **prove the riskiest, dullest plumbing works first. Glamour comes later.**

---

## What You'll Have at the End of Phase 0

1. A working code editor (VS Code) on your laptop
2. Claude Code installed and configured — your developer
3. A GitHub account with an empty Career Compass repository
4. A Next.js "Hello World" app running locally on your laptop
5. The same app deployed to a public Vercel URL (e.g., `career-compass-priya.vercel.app`)
6. An Anthropic API key ready for Phase 1

You can show this URL to a friend. It does nothing yet. That's the point.

---

## Accounts You'll Need

Create these in this order. All free.

1. **GitHub account** — https://github.com/signup
   - Username suggestion: something professional, this will be visible
2. **Anthropic API account** — https://console.anthropic.com
   - You'll add a small credit balance (~$5 is plenty for the entire build)
3. **Vercel account** — https://vercel.com/signup
   - Sign up using your GitHub account (one click)

> **PM Concept: "Free tier first."** Every tool we're using has a free tier sufficient for an MVP. Locking yourself into paid infrastructure before validating the product is one of the most expensive mistakes early builders make. We will only pay for what we *cannot* avoid (Anthropic API usage).

---

## Step 1: Install VS Code

1. Go to https://code.visualstudio.com
2. Download the version for your operating system (Mac / Windows)
3. Install it like any other app
4. Open it once to confirm it works. Close it.

---

## Step 2: Install Node.js

Node.js is the runtime that lets your laptop run web app code. We don't need to understand it — we just need it installed.

1. Go to https://nodejs.org
2. Download the **LTS** version (the left button, NOT the "Current")
3. Install it with all default settings
4. Open the **Terminal** app:
   - Mac: Press Cmd+Space, type "Terminal", press Enter
   - Windows: Press Win, type "PowerShell", press Enter
5. Type this and press Enter:
   ```
   node --version
   ```
6. You should see something like `v20.x.x`. If you do, you're good. If you see an error, restart your laptop and try again.

---

## Step 3: Install Claude Code

Claude Code is what turns Claude into your developer. You give it instructions in plain English; it writes and edits files.

In the same Terminal window:

```
npm install -g @anthropic-ai/claude-code
```

Wait for it to finish (could take 1–2 minutes). When the prompt comes back, type:

```
claude --version
```

If you see a version number, success.

> **What just happened:** You installed a tool globally on your laptop that, when run, opens a chat with Claude that has the ability to read and write files in whatever folder you're in. This is your developer.

---

## Step 4: Create Your Project Folder

Still in Terminal:

```
cd ~/Documents
mkdir career-compass
cd career-compass
```

Translation: "Go to my Documents folder, make a new folder called career-compass, then go inside it."

Now open this folder in VS Code:

```
code .
```

(That's "code" then a space then a dot.) VS Code should open. The folder is empty. That's correct.

---

## Step 5: Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign in
3. Add at least $5 of credit (Settings → Billing). This will cover the entire MVP build with room to spare.
4. Go to "API Keys" → "Create Key"
5. Name it `career-compass-dev`
6. **Copy the key immediately.** You will only see it once. Paste it somewhere safe for now (a sticky note app is fine for 5 minutes).

> **Security note:** Treat this key like a password. Never paste it into chat with anyone, never commit it to GitHub, never email it.

---

## Step 6: Start Claude Code in Your Project

Back in Terminal (still in the career-compass folder):

```
claude
```

A chat interface will open in your terminal. Claude Code is now your developer, sitting inside your project folder.

---

## Step 7: Your First Prompt to Claude Code

Copy this entire block and paste it into Claude Code as your first message:

---

**PROMPT TO PASTE INTO CLAUDE CODE:**

```
You are the developer for a project called Career Compass — an AI-powered career navigation web app. I am the PM. I am non-technical, so explain what you're doing in plain language and ask me to confirm before any destructive action.

For Phase 0, please do the following:

1. Initialize a Next.js 14 project in this folder using the App Router, TypeScript, Tailwind CSS, and ESLint. Use the default options for everything else.

2. Replace the default homepage (app/page.tsx) with a clean, centered landing page that says:
   - Headline: "Career Compass"
   - Subheadline: "Your AI career GPS. Coming soon."
   - A small footer note: "Built by [PLACEHOLDER FOR YOUR NAME] — v0.1"
   Use Tailwind for styling. Make it minimal, modern, and centered. Off-white background, dark text, generous whitespace.

3. Create a .gitignore file that ignores .env.local and node_modules.

4. Create an empty .env.local file (we'll add the API key here later).

5. Initialize a git repository and make the first commit with the message "Phase 0: scaffold".

6. After all of that, tell me three things:
   - The exact command I need to run to start the app locally
   - What I should see when it's running
   - The next step (which will be pushing to GitHub)

Do not install the Anthropic SDK or write any AI code yet. Phase 0 is foundation only.
```

---

Paste that, hit Enter, and let Claude Code work. It will run several commands and ask for confirmation on some. Approve them all unless something looks unexpected — if you're unsure, paste the question back to me and I'll translate.

---

## Step 8: Run the App Locally

When Claude Code finishes Phase 0, it will tell you how to run the app. It will be something like:

```
npm run dev
```

Run that command in Terminal (open a *second* terminal window so Claude Code keeps running in the first one). You'll see something like:

```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

Open `http://localhost:3000` in your browser. You should see your Career Compass landing page.

🎉 **You just ran a web app locally.**

---

## Step 9: Push to GitHub

Tell Claude Code:

```
Now help me push this to a new GitHub repository called "career-compass". Walk me through it step by step. I do NOT have the GitHub CLI installed, so use the standard git remote method and tell me exactly what to click on github.com.
```

Follow its instructions. You'll end up with the code visible at `github.com/your-username/career-compass`.

---

## Step 10: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import" next to your `career-compass` repository
3. Leave all settings at default
4. Click "Deploy"
5. Wait ~60 seconds

You'll get a public URL like `career-compass-abc123.vercel.app`. **Open it.** Your landing page is now live on the internet.

---

## Step 11: Update Your Decision Log

Add an entry:

> **April 27 — Stack chosen: Next.js + Tailwind + Anthropic API + Vercel + localStorage.**
> **Why:** Industry-standard, free-tier sufficient, fast iteration, native fit for AI calls.
> **Alternative considered:** Plain HTML + Python backend (rejected: more moving parts).

Add another:

> **April 27 — Phase 0 complete. Public URL live before any product code written.**
> **Lesson: Deployment-first development.** Pipeline proven on day 1; future deploys are small.

---

## What to Do When You Hit This Guide's Limits

You **will** hit something this guide doesn't cover. Here's the workflow:

1. **Read the error message slowly.** 70% of errors tell you exactly what's wrong.
2. **Show Claude Code the error.** Paste the full error message and ask "what does this mean and how do I fix it?"
3. **If you're stuck for >10 minutes**, copy the error + what you've tried + come back to me. I'll translate.

> **PM Concept: "Productive struggle vs. unproductive struggle."**
> The first 10 minutes of being stuck is learning. After that, it's wasted time. Ask for help. Senior PMs ask faster than junior PMs — not slower.

---

## Definition of Done for Phase 0

You can answer "yes" to all of these:

- [ ] I can run `npm run dev` and see the landing page on localhost:3000
- [ ] My code is on GitHub at github.com/[me]/career-compass
- [ ] I have a public Vercel URL that shows the landing page
- [ ] My Anthropic API key is saved somewhere safe
- [ ] I've added two entries to my decision log
- [ ] I understand, in plain language, what each tool does (VS Code = editor, Claude Code = developer, GitHub = code storage, Vercel = hosting, Anthropic = AI brain)

When all six are true, message me **"Phase 0 done"** and we'll start Phase 1: the first agent.

---

## What's Coming in Phase 1

Preview, so you know where we're headed:

- Build the Profile Input form (with tag-based skills input)
- Set up the Anthropic API connection
- Build Agent 1: Role Discovery
- Display raw output (no polish yet)
- Concept: **structured outputs / JSON mode** — how we make AI return data we can actually use
- Concept: **prompt engineering** — the actual craft of writing instructions

Don't worry about Phase 1 yet. One phase at a time.
