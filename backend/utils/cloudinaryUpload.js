import { v2 as cloudinary } from "cloudinary";

const folderFor = (group) => {
  const root = process.env.CLOUDINARY_FOLDER || "charu_garments";
  return group ? `${root}/${group}` : root;
};

export const isOwnCloudinaryUrl = (url) => {
  const cloud = process.env.CLOUDINARY_NAME;
  return (
    typeof url === "string" &&
    Boolean(cloud) &&
    url.includes(`res.cloudinary.com/${cloud}/`)
  );
};

export const uploadBuffer = (buffer, group) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderFor(group), resource_type: "image" },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });

export const uploadRemoteImage = async (url, group) => {
  const result = await cloudinary.uploader.upload(url, {
    folder: folderFor(group),
    resource_type: "image",
  });
  if (!result?.secure_url) throw new Error("Cloudinary upload failed");
  return result.secure_url;
};
