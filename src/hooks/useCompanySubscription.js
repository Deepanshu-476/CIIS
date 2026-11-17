import {useEffect, useState} from 'react';

export default function useCompanySubscription() {
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem('companyDetails') || localStorage.getItem('company') || 'null'); } catch { return null; }
  });
  useEffect(() => {
    const update = event => setCompany(event.detail);
    window.addEventListener('ciis-company-subscription-changed', update);
    return () => window.removeEventListener('ciis-company-subscription-changed', update);
  }, []);
  return company;
}
