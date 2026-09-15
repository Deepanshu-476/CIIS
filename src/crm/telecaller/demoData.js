export const DEMO_DATE = '2026-09-01';

export const leads = [
  {
    id: 'LD-008',
    name: 'Ashok Pillai',
    phone: '8016315999',
    email: 'ashok.pillai51@hotmail.com',
    city: 'Surat',
    source: 'Facebook',
    type: 'NEET',
    status: 'Assigned',
    assigned: '2026-08-22',
    priority: 'High',
    assignedTo: 'Telecaller 1'
  },
  {
    id: 'LD-007',
    name: 'Zara Nair',  
    phone: '8879968460',
    email: 'zara.nair67@gmail.com',
    city: 'Mumbai',
    source: 'Facebook',
    type: 'NEET',
    status: 'Converted',
    assigned: '2026-08-22',
    priority: 'Normal',
    assignedTo: 'Telecaller 1'
  },
  {
    id: 'LD-009',
    name: 'Komal Wadhwa',
    phone: '9598564205',
    email: 'komal@example.com',
    city: 'Delhi',
    source: 'Facebook',
    type: 'NEET',
    status: 'Assigned',
    assigned: '2026-08-22',
    priority: 'High',
    assignedTo: 'Telecaller 1'
  },
  {
    id: 'LD-010',
    name: 'Rekha Kapoor',
    phone: '9887676772',
    email: 'rekha.kapoor@gmail.com',
    city: 'Pune',
    source: 'Facebook',
    type: 'NEET',
    status: 'Assigned',
    assigned: '2026-08-22',
    priority: 'High',
    assignedTo: 'Telecaller 1'
  },
  {
    id: 'LD-011',
    name: 'Sanjay Chauhan',
    phone: '7164334722',
    email: 'sanjay.c@yahoo.com',
    city: 'Jaipur',
    source: 'Facebook',
    type: 'NEET',
    status: 'Assigned',
    assigned: '2026-08-22',
    priority: 'High',
    assignedTo: 'Telecaller 1'
  },
  {
    id: 'LD-012',
    name: 'Meena Rajan',
    phone: '8936899809',
    email: 'meena.rajan@outlook.com',
    city: 'Chennai',
    source: 'Facebook',
    type: 'NEET',
    status: 'Assigned',
    assigned: '2026-08-22',
    priority: 'Normal',
    assignedTo: 'Telecaller 1'
  }
];

export const initialCalls = [
  {
    id: 'call-1',
    leadId: 'LD-008',
    date: '2026-08-24T14:45',
    callType: 'Outbound',
    outcome: 'Follow-up',
    notes: 'required next followup for this',
    followUp: '2026-08-24T12:00',
    timeAgo: '1 week ago'
  },
  {
    id: 'call-2',
    leadId: 'LD-007',
    date: '2026-08-24T14:28',
    callType: 'Outbound',
    outcome: 'Converted',
    notes: 'converted in first call the lead id = Ld..',
    followUp: '',
    timeAgo: '1 week ago'
  }
];

export const outcomes = [
  'Converted',
  'Connected',
  'Interested',
  'Not Interested',
  'Need Callback',
  'Follow-up',
  'Call Later',
  'No Answer',
  'Busy',
  'Switched Off',
  'Not Reachable',
  'Wrong Number',
  'Wrong Person',
  'Invalid Number',
  'Language Barrier',
  'Do Not Call'
];

export const formatDate = value => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(value.includes('T') || value.includes(':')
        ? { hour: '2-digit', minute: '2-digit', hour12: true }
        : {})
    });
  } catch {
    return value;
  }
};
