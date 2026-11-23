import React from 'react';
import './MarketingLeadDetails.css';

export default function MarketingLeadDetails({ marketing, source, campaignName }) {
  if (!marketing) return null;
  const details = [
    ['Source', source], ['Platform', marketing.channel], ['Account', marketing.accountName || marketing.accountId],
    ['Page', marketing.pageName], ['Campaign', campaignName || marketing.campaignId],
    ['Ad group', marketing.adGroupName || marketing.adGroupId], ['Ad', marketing.adName || marketing.adId],
    ['Form', marketing.formName || marketing.formId], ['Company', marketing.advertiserCompany],
    ['External lead ID', marketing.externalLeadId]
  ];
  return (
    <section className="marketing-lead-details">
      <h3>Marketing Source</h3>
      <dl>{details.filter(([, value]) => value).map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}</dl>
      {marketing.answers?.length > 0 && <>
        <h4>Ad Form Answers</h4>
        <dl>{marketing.answers.map(({ label, value }, index) => (
          <div key={index}><dt>{label}</dt><dd>{value}</dd></div>
        ))}</dl>
      </>}
    </section>
  );
}
