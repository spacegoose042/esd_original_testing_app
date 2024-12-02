const bcrypt = require('bcryptjs');

const password = 'Admin123!';

bcrypt.genSalt(10).then(salt => {
    bcrypt.hash(password, salt).then(hash => {
        console.log('Use this hash:', hash);
    });
});