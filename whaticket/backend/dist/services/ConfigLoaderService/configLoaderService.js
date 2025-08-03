"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function configLoader() {
    return {
        webhook: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            limiter: {
                max: 1,
                duration: 150,
            },
        },
    };
}
exports.default = configLoader;
//# sourceMappingURL=configLoaderService.js.map