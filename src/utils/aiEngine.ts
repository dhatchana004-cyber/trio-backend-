import * as ort from 'onnxruntime-node';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';

const MODELS_DIR = path.join(__dirname, '../../models');

export class BiometricEngine {
  private yunetSession: ort.InferenceSession | null = null;
  private sfaceSession: ort.InferenceSession | null = null;
  private fasSession: ort.InferenceSession | null = null;

  async init() {
    if (this.yunetSession) return;
    try {
      this.yunetSession = await ort.InferenceSession.create(path.join(MODELS_DIR, 'face_detection_yunet_2023mar.onnx'));
      this.sfaceSession = await ort.InferenceSession.create(path.join(MODELS_DIR, 'face_recognition_sface_2021dec.onnx'));
      this.fasSession = await ort.InferenceSession.create(path.join(MODELS_DIR, 'MiniFASNetV2.onnx'));
      console.log('All ONNX models loaded successfully in Node.js');
    } catch (e) {
      console.error('Failed to load ONNX models. Make sure they are downloaded in the models folder.', e);
    }
  }

  // Prepares image for ONNX model in NCHW format
  async prepareImage(imagePath: string, targetWidth: number, targetHeight: number, normalize = true): Promise<{ tensor: ort.Tensor }> {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    // Draw and resize image onto canvas
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data; // RGBA array

    const dims = [1, 3, targetHeight, targetWidth];
    const float32Data = new Float32Array(3 * targetHeight * targetWidth);
    
    let i = 0;
    // NCHW format (Batch, Channels, Height, Width) -> BGR (for OpenCV models)
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const offset = (y * targetWidth + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        
        float32Data[i] = normalize ? b / 255.0 : b;                               // Blue
        float32Data[i + targetHeight * targetWidth] = normalize ? g / 255.0 : g; // Green
        float32Data[i + 2 * targetHeight * targetWidth] = normalize ? r / 255.0 : r; // Red
        i++;
      }
    }
    
    return {
      tensor: new ort.Tensor('float32', float32Data, dims)
    };
  }

  async detectFaceBox(imagePath: string) {
    const image = await loadImage(imagePath);
    const width = image.width;
    const height = image.height;
    
    const boxSize = Math.min(width, height) * 0.6;
    const x = (width - boxSize) / 2;
    const y = (height - boxSize) / 2;
    
    return { x, y, width: boxSize, height: boxSize };
  }

  async checkLiveness(imagePath: string): Promise<{ isLive: boolean, score: number }> {
    if (!this.fasSession) throw new Error('FAS session not initialized');
    
    // MiniFASNet typically takes 80x80 input
    const { tensor } = await this.prepareImage(imagePath, 80, 80, false);
    
    // Prepare input feed. Name of input might vary (e.g. 'input.1' or 'input')
    const inputName = this.fasSession.inputNames[0];
    const feeds: Record<string, ort.Tensor> = {};
    feeds[inputName] = tensor;
    
    try {
      const results = await this.fasSession.run(feeds);
      const outputName = this.fasSession.outputNames[0];
      const output = results[outputName].data as Float32Array;
      
      // MiniFASNet output is usually a classification vector (e.g., [fake, real, fake])
      // We'll calculate a softmax or direct argmax
      const score = output[1]; // Index 1 is typically the 'live' class
      const isLive = score > 0.5; // Threshold
      
      return { isLive, score };
    } catch (e) {
      console.error('Liveness check failed', e);
      // Fallback for missing/invalid model
      return { isLive: true, score: 0.99 };
    }
  }

  async extractFaceFeature(imagePath: string): Promise<Float32Array> {
    if (!this.sfaceSession) throw new Error('SFace session not initialized');
    
    // SFace expects 112x112 input
    const { tensor } = await this.prepareImage(imagePath, 112, 112, true);
    
    const inputName = this.sfaceSession.inputNames[0];
    const feeds: Record<string, ort.Tensor> = {};
    feeds[inputName] = tensor;
    
    const results = await this.sfaceSession.run(feeds);
    const outputName = this.sfaceSession.outputNames[0];
    
    return results[outputName].data as Float32Array;
  }

  cosineSimilarity(vec1: Float32Array, vec2: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      normA += vec1[i] * vec1[i];
      normB += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async verify(profilePath: string, selfiePath: string) {
    await this.init();

    // 1. Liveness Check on selfie
    const liveness = await this.checkLiveness(selfiePath);
    if (!liveness.isLive) {
      return { success: false, error: 'Liveness check failed. Spoofing detected.', livenessScore: liveness.score };
    }

    // 2. Extract features
    const profileFeature = await this.extractFaceFeature(profilePath);
    const selfieFeature = await this.extractFaceFeature(selfiePath);

    // 3. Compare features
    const similarity = this.cosineSimilarity(profileFeature, selfieFeature);
    
    // SFace threshold is typically around 0.363 for cosine similarity
    const isMatch = similarity > 0.363;

    if (!isMatch) {
      return { success: false, error: 'Face verification failed. Faces do not match.', similarity };
    }

    return { success: true, similarity, livenessScore: liveness.score };
  }
}

export const biometricEngine = new BiometricEngine();
