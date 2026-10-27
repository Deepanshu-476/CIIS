const toFormData = (body, files) => {
  const formData = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  Object.entries(files).forEach(([field, list]) => list.forEach(file => formData.append(field, file)));
  return formData;
};

// Preserve Axios auth/error interceptors and keep small writes alive on reload.
// `files` ({ field: [File] }) sends the status as multipart, e.g. a remark image.
export const createTaskStatusSaver = (client) => {
  const pending = new Map();
  const save = (url, payload, files = null) => {
    const previous = pending.get(url);
    const fields = { ...payload, _statusRequestId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    const hasFiles = Boolean(files && Object.values(files).some(list => list?.length));
    const body = hasFiles ? toFormData(fields, files) : fields;
    // Browsers cap keepalive bodies at 64 KB, so uploads use a normal request.
    const config = hasFiles ? {} : { adapter: 'fetch', fetchOptions: { keepalive: true } };
    const send = async () => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const response = await client.patch(url, body, config);
          if (response.data?.success === false) {
            const error = new Error(response.data.error || response.data.message || 'Status could not be saved');
            error.response = response;
            throw error;
          }
          return response;
        } catch (error) {
          const temporary = (!error.response && ['ERR_NETWORK', 'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) ||
            [502, 503, 504].includes(error.response?.status);
          if (!temporary || attempt >= 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      }
    };
    const request = (previous ? previous.catch(() => {}) : Promise.resolve())
      .then(send).finally(() => {
        if (pending.get(url) === request) pending.delete(url);
      });
    pending.set(url, request);
    return request;
  };
  save.whenIdle = async () => {
    while (pending.size) await Promise.allSettled([...pending.values()]);
  };
  return save;
};
