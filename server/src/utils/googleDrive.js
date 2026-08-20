import { google } from "googleapis";
import stream from "stream";

const getDriveClient = () => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Drive API credentials are not properly configured in .env");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
};

export const uploadFileToDrive = async (fileBuffer, fileName, mimeType) => {
  try {
    const drive = getDriveClient();

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetaData = {
      name: `logo_${Date.now()}_${fileName}`,
    };

    if (
      process.env.GOOGLE_DRIVE_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_FOLDER_ID !== "your_folder_id"
    ) {
      fileMetaData.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    }

    const media = {
      mimeType: mimeType,
      body: bufferStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetaData,
      media: media,
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = response.data.id;

    // Set permission to anyone with link can view
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permErr) {
      console.warn("Notice: Drive permission setting warning:", permErr.message);
    }

    // Google Drive direct view links & proxy URL
    const thumbnailLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    const googleUserContentLink = `https://lh3.googleusercontent.com/d/${fileId}`;
    const proxyLink = `/api/settings/logo-proxy/${fileId}`;

    return {
      success: true,
      fileId,
      thumbnailLink,
      googleUserContentLink,
      proxyLink,
      directLink: proxyLink, // Default to proxyLink for bulletproof browser rendering
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error("Google Drive upload error:", error);
    throw new Error(`Google Drive Upload Failed: ${error.message}`);
  }
};

export const getFileStreamFromDrive = async (fileId) => {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId: fileId, alt: "media" },
    { responseType: "stream" }
  );
  return response.data;
};
