export const isPlatformAccount = user =>
  String(user?.email || '').trim().toLowerCase() === 'ashutoshrai130@gmail.com' ||
  user?.isSuperAdmin === true || user?.superAdmin === true;

export const subscriptionExpiryTime = company => {
  if (!company?.subscriptionExpiry) return null;
  const time = new Date(company.subscriptionExpiry).getTime();
  if (!Number.isFinite(time)) return null;
  const offset = 330 * 60000;
  const ist = new Date(time + offset);
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 23, 59, 59, 999) - offset;
};

export const isSubscriptionExpired = (company, now = Date.now()) => {
  const expiry = subscriptionExpiryTime(company);
  return expiry !== null && now > expiry;
};

// Browsing, filters, opening records and session controls remain available.
export const isWriteAction = (label = '', hint = '') => {
  const text = `${label} ${hint}`.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  if (/^\s*(view|open|preview|download|search|filter|refresh|next|previous|select|show|sort)\b/i.test(label)) return false;
  if (/\b(log\s*out|logout|sign\s*out|cancel|close|dismiss|back|renew|upgrade|view plans)\b/.test(label.toLowerCase())) return false;
  return label.trim() === '+' || /\b(add|plus|create|new|edit|pencil|trash|delete|remove|save|submit|send|upload|attach|camera|mic|import|assign|approve|reject|activate|deactivate|restore|update|apply|process|pay|record|start|stop|complete|confirm|clock|check\s*in|check\s*out|punch|break|call|dial|invite|forward|reply|react|reaction|mute)\b/.test(text);
};

export const isSubscriptionWriteRequest = config => {
  if (['get', 'head', 'options'].includes(String(config.method || 'get').toLowerCase())) return false;
  const path = String(config.url || '').split('?')[0].replace(/\/$/, '');
  return !(/\/auth\/(?:logout|refresh|refresh-token|verify-token)$/.test(path) ||
    /\/notifications\/devices(?:\/[^/]+)?(?:\/(?:register|unregister))?$/.test(path) ||
    /\/activity\/views$/.test(path) ||
    /\/chat\/(?:message\/[^/]+\/seen|messages\/delivered)$/.test(path) ||
    /\/notifications\/(?:[^/]+\/read|read-all|mark-all-read)$/.test(path) ||
    /\/alerts\/(?:[^/]+\/read|mark-all\/read)$/.test(path));
};
