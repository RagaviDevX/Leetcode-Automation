#!/usr/bin/env bash
# LeetAI Agent - Full Installation Script
# Run: chmod +x install.sh && ./install.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

print_banner() {
  echo -e "${GREEN}"
  echo "╔═══════════════════════════════════════════╗"
  echo "║          🤖 LeetAI Agent Setup            ║"
  echo "║     AI-Powered LeetCode Solver            ║"
  echo "╚═══════════════════════════════════════════╝"
  echo -e "${NC}"
}

step() { echo -e "\n${BLUE}▶ ${BOLD}$1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

check_command() {
  command -v "$1" >/dev/null 2>&1 || error "$1 is required but not installed"
}

print_banner

# ─── Check prerequisites ───────────────────────────────────────────────────────
step "Checking prerequisites..."

check_command node
check_command npm
check_command curl

NODE_VER=$(node -v | tr -d 'v' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  error "Node.js 18+ required. Current: $(node -v)"
fi
success "Node.js $(node -v) ✓"

# ─── Install Ollama ────────────────────────────────────────────────────────────
step "Setting up Ollama (local AI engine)..."

if command -v ollama >/dev/null 2>&1; then
  success "Ollama already installed: $(ollama --version 2>/dev/null || echo 'installed')"
else
  echo "Installing Ollama..."
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -fsSL https://ollama.ai/install.sh | sh
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Please install Ollama from: https://ollama.ai/download"
    echo "Then re-run this script."
    open "https://ollama.ai/download" 2>/dev/null || true
    exit 0
  else
    warn "Windows: Download Ollama from https://ollama.ai/download"
    exit 0
  fi
  success "Ollama installed"
fi

# Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  step "Starting Ollama..."
  ollama serve &
  sleep 3
fi

# Pull AI model
step "Pulling DeepSeek Coder model (~4GB)..."
echo "This may take several minutes depending on your internet speed..."

if ollama list 2>/dev/null | grep -q "deepseek-coder"; then
  success "deepseek-coder already available"
else
  ollama pull deepseek-coder:6.7b
  success "deepseek-coder:6.7b downloaded"
fi

# Optionally pull codellama
echo ""
read -p "Pull CodeLlama 7B as backup model? (y/N): " pull_codellama
if [[ "$pull_codellama" =~ ^[Yy]$ ]]; then
  ollama pull codellama:7b
  success "codellama:7b downloaded"
fi

# ─── Backend setup ─────────────────────────────────────────────────────────────
step "Setting up Backend..."

cd backend

if [ ! -f .env ]; then
  cp .env.example .env
  warn "Created backend/.env from template — edit with your Supabase credentials"
fi

npm install --silent
success "Backend dependencies installed"

# ─── Dashboard setup ───────────────────────────────────────────────────────────
cd ../dashboard

step "Setting up Dashboard..."

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  warn "Created dashboard/.env.local from template"
fi

npm install --silent
success "Dashboard dependencies installed"

# ─── Extension setup ───────────────────────────────────────────────────────────
cd ../extension

step "Building Chrome Extension..."

npm install --silent
npm run build
success "Extension built in extension/dist/"

cd ..

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗"
echo "║            ✅ Setup Complete!             ║"
echo "╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo ""
echo "  1. Edit backend/.env with your Supabase credentials"
echo "  2. Run backend:    cd backend && npm run dev"
echo "  3. Run dashboard:  cd dashboard && npm run dev"
echo "  4. Load extension: chrome://extensions → Load Unpacked → extension/dist/"
echo ""
echo -e "${BOLD}Supabase Setup:${NC}"
echo "  1. Create project at https://supabase.com"
echo "  2. Run SQL from docker/schema.sql in Supabase SQL editor"
echo "  3. Copy URL + service key to backend/.env"
echo ""
echo -e "${BOLD}Quick Start (no Supabase needed):${NC}"
echo "  Set SKIP_AUTH=true in backend/.env"
echo "  Backend runs without a database"
echo ""
echo -e "${BOLD}Available Models:${NC}"
ollama list 2>/dev/null || echo "  Run: ollama list"
echo ""
echo -e "${GREEN}Happy solving! 🎉${NC}"
