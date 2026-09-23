import multer from "multer";

// A route mounts a multer middleware directly (e.g. `upload.single("file")`)
// as a normal Express middleware. When multer rejects a file — wrong type
// (fileFilter) or over the size limit — it reports that via `next(err)`
// *before* the route handler ever runs, so the route's own try/catch never
// sees it. With nothing else registered to handle it, that error falls
// through to the app's generic error middleware in index.js, which returns
// an unhelpful "Internal server error" regardless of the real reason.
//
// This wraps a multer middleware so its errors get the same
// `{ success: false, message }` shape every route already returns, instead
// of a mystery 500. Use it in place of passing the multer middleware
// directly: `wrapUpload(upload.single("file"))` instead of
// `upload.single("file")`.
export const wrapUpload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File is too large." });
    }

    // Both other MulterErrors (e.g. unexpected field) and the custom Error
    // a route's fileFilter throws for a disallowed mimetype land here —
    // `err.message` is already a meaningful, user-facing string in both
    // cases (see each route's own multer() config).
    res.status(400).json({ success: false, message: err.message || "Failed to upload file." });
  });
};
