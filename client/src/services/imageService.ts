import { db, StoredImageBlob } from '../db/index.ts';

export interface CompressedImageResult {
  localBlobKey: string;
  blob: Blob;
  previewUrl: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Compresses an image file client-side using HTML5 Canvas
 * Limits max dimension to 1200px and encodes to JPEG quality 0.75
 */
export async function compressImage(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const localBlobKey = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              localBlobKey,
              blob,
              previewUrl,
              mimeType: 'image/jpeg',
              sizeBytes: blob.size,
            });
          },
          'image/jpeg',
          0.75
        );
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Persists an image blob locally in IndexedDB
 */
export async function storeImageLocally(
  lotClientId: string,
  imageResult: CompressedImageResult
): Promise<void> {
  const record: StoredImageBlob = {
    localBlobKey: imageResult.localBlobKey,
    lotClientId,
    mimeType: imageResult.mimeType,
    blob: imageResult.blob,
    sizeBytes: imageResult.sizeBytes,
    syncStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await db.imageBlobs.put(record);
}

/**
 * Uploads a locally stored image to the server for a given lot
 */
export async function uploadImageToServer(
  lotIdentifier: string,
  storedImage: StoredImageBlob
): Promise<any> {
  const formData = new FormData();
  formData.append('image', storedImage.blob, `${storedImage.localBlobKey}.jpg`);
  formData.append('localBlobKey', storedImage.localBlobKey);

  const res = await fetch(`/api/lots/${lotIdentifier}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Image upload failed with status ${res.status}`);
  }

  return await res.json();
}
