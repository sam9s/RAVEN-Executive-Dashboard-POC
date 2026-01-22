# Vercel Deployment Guide

This guide describes how to deploy the Executive Dashboard to Vercel now that it has been refactored to support OpenAI.

## Prerequisites

1.  **GitHub Repository**: Your code must be pushed to a GitHub repository.
2.  **Vercel Account**: You need an account at [vercel.com](https://vercel.com).
3.  **API Keys**: You will need your OpenAI API Key and Supabase credentials.

## Step 1: Push to GitHub

1.  Initialize Git in your project folder (if not done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit with OpenAI support"
    ```
2.  Create a new repository on GitHub.
3.  Push your code:
    ```bash
    git remote add origin <your-repo-url>
    git push -u origin main
    ```

## Step 2: Deploy on Vercel

1.  Log in to Vercel and click **"Add New..."** -> **"Project"**.
2.  Import your GitHub repository.
3.  **Configure Project**:
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Root Directory**: `executive-dashboard` (IMPORTANT: Since your repo root has `Docs` and the app folder inside, make sure Vercel points to the inner `executive-dashboard` folder if that's how you structure it. If you pushed just the inner folder, leave as root).

4.  **Environment Variables**:
    Add the following variables in the Vercel dashboard:

    | Key | Value | Description |
    |-----|-------|-------------|
    | `AI_PROVIDER` | `openai` | **CRITICAL**: sets the app to use OpenAI instead of Ollama. |
    | `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key. |
    | `OPENAI_MODEL` | `gpt-4o` | (Optional) The model to use. |
    | `NEXT_PUBLIC_SUPABASE_URL` | `...` | Your Supabase Project URL. |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `...` | Your Supabase Anon Key. |
    | `SUPABASE_SERVICE_ROLE_KEY` | `...` | (If used) Service role key. |

    *Note: Google and ClickUp keys can also be added here if you have them.*

5.  Click **Deploy**.

## Testing

Once deployed, visit the Vercel URL.
1.  Go to **Settings** in the app.
2.  Verify that "AI Provider" shows "OpenAI".
3.  Test the chat.
