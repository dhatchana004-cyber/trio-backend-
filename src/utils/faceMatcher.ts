import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import fs from 'fs';
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

// 1. AWS Rekognition Client setup pandrom
const rekognition = new RekognitionClient({
  region: "ap-south-1", // Unga AWS region (Mumbai na ap-south-1, Stockholm na eu-north-1)
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string, // IAM-la create panna Access Key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string // IAM-la create panna Secret Key
  }
});

// 2. Rendu photo-va compare panna oru function
export const compareFacesAWS = async (sourceImagePath: string, targetImagePath: string) => {
  try {
    // Photos-ah Buffer (Bytes) aaga convert pandrom
    const sourceImageBytes = fs.readFileSync(sourceImagePath);
    const targetImageBytes = fs.readFileSync(targetImagePath);

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: sourceImageBytes },
      TargetImage: { Bytes: targetImageBytes },
      SimilarityThreshold: 80 // 80% mela match aana thaan attendance success aagum
    });

    const response = await rekognition.send(command);
    
    // Face match aayiducha nu check pandrom
    if (response.FaceMatches && response.FaceMatches.length > 0) {
      console.log("Match Found! Similarity:", response.FaceMatches[0].Similarity);
      return true; // Match aayiduchu
    } else {
      console.log("Faces do not match");
      return false; // Match aagala
    }
  } catch (error) {
    console.error("AWS Rekognition Error:", error);
    return false;
  }
};
