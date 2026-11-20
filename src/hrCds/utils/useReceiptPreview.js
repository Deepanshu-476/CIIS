import { useEffect, useState } from 'react';
import axios from '../../utils/axiosConfig';
import { accountStorage } from '../../utils/authSession';

const previewTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/avif',
]);

export const getReceiptPath = receipt => {
  const filename = receipt?.receiptImage?.split('/').pop();
  return filename ? `/clientsservice/receipt-image/${encodeURIComponent(filename)}` : '';
};

export const useReceiptPreview = path => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!path) return;

    const controller = new AbortController();
    const token = accountStorage.getItem('token') || accountStorage.getItem('authToken');
    let url;
    axios.get(path, {
      responseType: 'blob',
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const blob = previewTypes.has(data.type) ? data : data.slice(0, data.size, 'application/octet-stream');
      url = URL.createObjectURL(blob);
      setPreview({ path, url, isImage: blob.type.startsWith('image/') });
    }).catch(() => {
      if (!controller.signal.aborted) setPreview({ path, error: true });
    });

    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);

  return preview?.path === path ? preview : null;
};
