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

export const uploadFileToDrive = async (fileBuffer, fileName, mimeType, folderId = null) => {
  try {
    const drive = getDriveClient();

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetaData = {
      name: `logo_${Date.now()}_${fileName}`,
    };

    let parents = [];
    if (folderId) {
      parents = [folderId];
    } else if (
      process.env.GOOGLE_DRIVE_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_FOLDER_ID !== "your_folder_id"
    ) {
      parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    }

    if (parents.length > 0) {
      fileMetaData.parents = parents;
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

export const createFolderInDrive = async (folderName, parentFolderId = null) => {
  try {
    const drive = getDriveClient();

    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    } else if (
      process.env.GOOGLE_DRIVE_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_FOLDER_ID !== "your_folder_id"
    ) {
      fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name, webViewLink",
    });

    return {
      success: true,
      folderId: response.data.id,
      folderName: response.data.name,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error("Google Drive folder creation error:", error);
    throw new Error(`Google Drive Folder Creation Failed: ${error.message}`);
  }
};

export const findFolderInDrive = async (folderName, parentFolderId = null) => {
  try {
    const drive = getDriveClient();

    const query = [`mimeType = 'application/vnd.google-apps.folder'`];
    
    if (folderName) {
      query.push(`name = '${folderName.replace(/'/g, "\\'")}'`);
    }
    
    if (parentFolderId) {
      query.push(`'${parentFolderId}' in parents`);
    } else if (
      process.env.GOOGLE_DRIVE_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_FOLDER_ID !== "your_folder_id"
    ) {
      query.push(`'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`);
    }

    query.push("trashed = false");

    const response = await drive.files.list({
      q: query.join(" and "),
      fields: "files(id, name, webViewLink)",
    });

    if (response.data.files && response.data.files.length > 0) {
      return {
        success: true,
        folderId: response.data.files[0].id,
        folderName: response.data.files[0].name,
        webViewLink: response.data.files[0].webViewLink,
      };
    }

    return null;
  } catch (error) {
    console.error("Google Drive folder search error:", error);
    return null;
  }
};

export const getOrCreateClientFolder = async (clientName, clientId) => {
  const folderName = `${clientName} - Documents`;

  let folder = await findFolderInDrive(folderName);

  if (!folder) {
    folder = await createFolderInDrive(folderName);
  }

  return folder;
};

export const getOrCreateClientSubfolder = async (parentFolderId, subfolderName) => {
  let folder = await findFolderInDrive(subfolderName, parentFolderId);

  if (!folder) {
    folder = await createFolderInDrive(subfolderName, parentFolderId);
  }

  return folder;
};
