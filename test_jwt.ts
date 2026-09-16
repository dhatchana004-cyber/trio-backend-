import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign({ id: 'test', org_id: 'test', role: 'EMPLOYEE' }, process.env.JWT_SECRET as string);
console.log('Token generated:', token);

jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
        console.error('Verify failed:', err);
    } else {
        console.log('Verify success:', user);
    }
});
