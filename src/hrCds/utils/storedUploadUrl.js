export const getStoredUploadUrl = (rawPath, apiUrl) => {
  const normalizedPath = rawPath.replace(/\\/g, '/');
  // Older task records store the full disk path returned by Multer.
  const uploadPath = normalizedPath.match(/(?:^|\/)(uploads\/.+)$/)?.[1];
  const relativeTaskPath = normalizedPath.match(/^\/?(tasks\/.+)$/)?.[1];
  const publicPath = uploadPath || (relativeTaskPath && `uploads/${relativeTaskPath}`);

  return publicPath ? `${apiUrl.replace(/\/api\/?$/, '')}/${publicPath}` : '';
};
