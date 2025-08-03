"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomizarCaminho = randomizarCaminho;
function randomizarCaminho(chance) {
    const chanceA = chance;
    const max = 1;
    const min = 0;
    const numeroAleatorio = Math.random() * (max - min) + min;
    if (numeroAleatorio < chanceA) {
        return "A";
    }
    else {
        return "B";
    }
}
//# sourceMappingURL=randomizador.js.map