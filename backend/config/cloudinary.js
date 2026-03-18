const { v2: cloudinary } = require("cloudinary");

const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER = "college-complaints",
} = process.env;

const hasCloudinaryUrl = Boolean(CLOUDINARY_URL);
const hasCloudinaryKeys = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);
const isCloudinaryConfigured = hasCloudinaryUrl || hasCloudinaryKeys;

if (isCloudinaryConfigured) {
  if (hasCloudinaryUrl) {
    cloudinary.config(CLOUDINARY_URL);
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

const uploadComplaintImage = async (file) => {
  if (!isCloudinaryConfigured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET."
    );
  }

  if (!file?.buffer) {
    throw new Error("Image file buffer is missing.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = {
  uploadComplaintImage,
};
