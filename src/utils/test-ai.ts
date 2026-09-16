import { biometricEngine } from './aiEngine';
import path from 'path';
import fs from 'fs';

async function runTests() {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg'));
  
  if (files.length < 2) {
    console.log('Not enough images in uploads folder to test.');
    return;
  }

  const profilePath = path.join(uploadsDir, files[0]);
  const selfiePath = path.join(uploadsDir, files[1]);

  console.log(`Testing AI Engine...`);
  console.log(`Profile: ${files[0]}`);
  console.log(`Selfie: ${files[1]}`);

  try {
    const result = await biometricEngine.verify(profilePath, selfiePath);
    console.log('Result:', result);
  } catch (e) {
    console.error('Test Failed:', e);
  }
}

runTests();
