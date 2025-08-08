import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mime from "mime-types";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { upload } from "../middleware/uploadMiddleware";
import { getUploadedFileUrl } from "../utils/getFileUrl";


dotenv.config();
const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

const LOCAL_UPLOADS_PATH = path.join(__dirname, "..", "..", "uploads");

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "audio/mpeg",
  "audio/wav",
  "application/mp4",
];

router.get("/:key", async (req, res) => {
  const filename = req.params.key;
  const localFilePath = path.join(LOCAL_UPLOADS_PATH, filename);

  if (fs.existsSync(localFilePath)) {
    let mimeType = mime.lookup(localFilePath) || "application/octet-stream";
    if (mimeType === "application/mp4") mimeType = "video/mp4";

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(403).json({ message: "Forbidden media type" });
    }

    const stat = fs.statSync(localFilePath);
    const total = stat.size;
    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : total - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(localFilePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mimeType,
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": total,
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      });

      fs.createReadStream(localFilePath).pipe(res);
    }

    return;
  }

  if (process.env.USE_S3 === "true") {
    const key = `${filename}`;

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      });

      const s3Response = await s3.send(command);

      let mimeType = mime.lookup(filename) || "application/mp4";
      if (mimeType === "application/mp4") mimeType = "video/mp4";

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return res.status(403).json({ message: "Forbidden media type" });
      }

      const range = req.headers.range;
      const contentLength = s3Response.ContentLength!;
      const stream = s3Response.Body as NodeJS.ReadableStream;

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : contentLength - 1;
        const chunkSize = end - start + 1;

        const rangeCommand = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Range: `bytes=${start}-${end}`,
        });

        const rangedResponse = await s3.send(rangeCommand);

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": mimeType,
        });

        (rangedResponse.Body as NodeJS.ReadableStream).pipe(res);
      } else {
        res.set({
          "Content-Type": mimeType,
          "Content-Length": contentLength.toString(),
          "Accept-Ranges": "bytes",
        });

        stream.pipe(res);
      }
    } catch (err) {
      console.error("S3 stream error:", err);
      res.status(404).json({ message: "File not found on disk or S3" });
    }
  } else {
    res.status(404).json({ message: "File not found on disk" });
  }
});

router.post(
  "/",
  upload.single("profilePic"),
  async (req, res) => {
    const isUsingS3 = process.env.USE_S3 === "true";

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    try {
      let newProfilePicUrl: string;

      if (isUsingS3) {
        const s3File = req.file as Express.MulterS3.File;
        newProfilePicUrl = s3File.location;
      } else {
        newProfilePicUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      }

      return res.status(200).json({ profilePic: newProfilePicUrl });
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      return res
        .status(500)
        .json({ message: "Failed to upload profile picture." });
    }
  }
);

router.patch(
  "/",
  upload.single("profilePic"),
  async (req, res) => {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    try {
      return res.status(200).json({ profilePic: getUploadedFileUrl(req) });
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      return res
        .status(500)
        .json({ message: "Failed to upload profile picture." });
    }
  }
);

export default router;

