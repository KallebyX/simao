#!/bin/sh

# Exportar NODE_OPTIONS corretamente
export NODE_OPTIONS="--openssl-legacy-provider --max_old_space_size=4096"

# Iniciar React
npm start