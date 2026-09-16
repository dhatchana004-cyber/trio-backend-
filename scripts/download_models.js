const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '../models');

const models = [
  {
    name: 'face_detection_yunet_2023mar.onnx',
    url: 'https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx'
  },
  {
    name: 'face_recognition_sface_2021dec.onnx',
    url: 'https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx'
  },
  {
    name: 'MiniFASNetV2.onnx',
    url: 'https://huggingface.co/garciafido/minifasnet-v2-anti-spoofing-onnx/resolve/main/minifasnet_v2.onnx'
  }
];

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Downloading ONNX models...');
  for (const model of models) {
    const destPath = path.join(modelsDir, model.name);
    if (!fs.existsSync(destPath)) {
      console.log(`Fetching ${model.name}...`);
      await downloadFile(model.url, destPath);
    } else {
      console.log(`Already exists: ${model.name}`);
    }
  }
  console.log('All models downloaded successfully.');
}

main().catch(err => {
  console.error('Error downloading models:', err);
  process.exit(1);
});
