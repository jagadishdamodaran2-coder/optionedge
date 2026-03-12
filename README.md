# ⚡ OptionEdge — AI-Powered Options Analyzer

## Deploy to Vercel (Step by Step)

### 1. Get Anthropic API Key
- Go to https://console.anthropic.com
- Click API Keys → Create Key → Copy it

### 2. Upload to GitHub
- Go to https://github.com/new → create repo named "optionedge"
- Click "uploading an existing file"
- Drag ALL files from this folder into the upload box
- Click "Commit changes"

### 3. Deploy on Vercel
- Go to https://vercel.com/new
- Click "Continue with GitHub" → Import "optionedge"
- Add Environment Variable:
  - Name:  VITE_ANTHROPIC_API_KEY
  - Value: sk-ant-xxxxxxxx (your key)
- Click Deploy ✅

Your live URL will be: https://optionedge.vercel.app
