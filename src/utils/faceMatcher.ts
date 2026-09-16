import { biometricEngine } from './aiEngine';

export const compareFacesLocal = async (profilePhotoPath: string, selfiePhotoPath: string): Promise<boolean> => {
  try {
    const result = await biometricEngine.verify(profilePhotoPath, selfiePhotoPath);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return true; // Verification passed
  } catch (error: any) {
    console.error('Biometric verification error:', error);
    throw new Error(error.message || 'Error comparing faces.');
  }
};
