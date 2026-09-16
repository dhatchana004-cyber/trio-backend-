import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign(
  { id: '3c941580-6a51-4312-88ea-6730547dd9d1', org_id: '58e858a3-f251-427c-9468-a007340ae4a5', role: 'EMPLOYEE' }, 
  process.env.JWT_SECRET as string,
  { expiresIn: '1h' }
);
console.log('Generated token:', token);
