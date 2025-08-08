const bcrypt = require('bcryptjs');

// Generate a password hash for 'admin'
const password = 'admin';
const hash = bcrypt.hashSync(password, 8);

console.log('Password hash for "admin":', hash);
console.log('SQL command:');
console.log(`UPDATE "Users" SET "passwordHash" = '${hash}' WHERE email='admin@admin.com';`);