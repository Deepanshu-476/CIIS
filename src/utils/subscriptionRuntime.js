import {isPlatformAccount, isSubscriptionExpired, isSubscriptionWriteRequest} from './subscriptionPolicy.js';

let current = null;
let owner = null;
export const setSubscriptionCompany = (company, user) => { current = company; owner = user; };
export const subscriptionIsReadOnly = () => !isPlatformAccount(owner) && isSubscriptionExpired(current);
export const showExpiredPlan = () => window.dispatchEvent(new Event('ciis-plan-expired'));
export const showAvailablePlans = () => window.dispatchEvent(new Event('ciis-view-plans'));
export const guardSubscriptionRequest = config => {
  if (subscriptionIsReadOnly() && isSubscriptionWriteRequest(config)) {
    showExpiredPlan();
    const error = new Error('Plan expired. Please renew a plan to make changes.');
    error.response = {status: 403, data: {errorCode: 'SUBSCRIPTION_EXPIRED', message: error.message}};
    error.config = config;
    throw error;
  }
  return config;
};
