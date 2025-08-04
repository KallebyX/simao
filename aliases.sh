# Aliases para desenvolvimento rápido do Whaticket
# Adicione estas linhas ao seu ~/.bashrc ou ~/.zshrc

# Navegação rápida
alias wr='cd /workspaces/simao'
alias wb='cd /workspaces/simao/whaticket/backend'
alias wf='cd /workspaces/simao/whaticket/frontend'

# NPM shortcuts
alias ni='npm install --legacy-peer-deps'
alias nid='npm install --legacy-peer-deps --save-dev'
alias nr='npm run'
alias ns='npm start'
alias nb='npm run build'
alias nt='npm test'
alias nd='npm run dev'

# Git shortcuts
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline'
alias gb='git branch'
alias gco='git checkout'

# Docker shortcuts
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs -f'
alias dcp='docker-compose ps'
alias dcr='docker-compose restart'

# Whaticket specific
alias wstart='/workspaces/simao/quick.sh start'
alias wstop='/workspaces/simao/quick.sh stop'
alias wdb='/workspaces/simao/quick.sh migrate'
alias wseed='/workspaces/simao/quick.sh seed'
alias wreset='/workspaces/simao/quick.sh reset-db'
alias wclean='/workspaces/simao/quick.sh clean'

# Development shortcuts
alias wbe='cd /workspaces/simao/whaticket/backend && npm run dev'
alias wfe='cd /workspaces/simao/whaticket/frontend && npm start'

# Quick commands
alias q='/workspaces/simao/quick.sh'
alias auto='/workspaces/simao/auto-dev.sh'

# Sistema
alias ll='ls -la'
alias la='ls -la'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'

# Processos
alias psg='ps aux | grep'
alias killnode='killall node 2>/dev/null || true'
alias killnpm='killall npm 2>/dev/null || true'

echo "🚀 Aliases do Whaticket carregados!"
echo "💡 Digite 'q help' para ver todos os comandos disponíveis"
