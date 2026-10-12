import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadProductImage = (buffer) =>
  new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      reject(new TypeError("A non-empty image buffer is required"));
      return;
    }

    cloudinary.uploader
      .upload_stream(
        {
          folder: "products",
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.secure_url || !result.public_id) {
            reject(new Error("Cloudinary returned an incomplete image upload result"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      )
      .end(buffer);
  });

export const deleteProductImage = async (publicId) => {
  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new TypeError("A Cloudinary public ID is required");
  }

  const result = await cloudinary.uploader.destroy(publicId.trim(), {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary image deletion failed: ${result.result}`);
  }

  return result;
};
