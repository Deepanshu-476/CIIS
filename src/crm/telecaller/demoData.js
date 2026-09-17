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

export const getDemoAssignedLeads = () => {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = toDateStr(now);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = toDateStr(yesterday);
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowStr = toDateStr(tomorrow);
  const next3Days = new Date(now.getTime() + 3 * 86400000);
  const next3DaysStr = toDateStr(next3Days);
  const past3Days = new Date(now.getTime() - 3 * 86400000);
  const past3DaysStr = toDateStr(past3Days);

  const demoCallsMap = {
    'LD-008': [
      {
        id: 'call-1',
        leadId: 'LD-008',
        date: `${todayStr}T11:45`,
        callType: 'Outbound',
        outcome: 'Follow-up',
        notes: 'Candidate interested in NEET course, requested syllabus brochure. Follow-up scheduled today afternoon.',
        followUp: `${todayStr}T16:00`,
        timeAgo: 'Today'
      }
    ],
    'LD-007': [
      {
        id: 'call-2',
        leadId: 'LD-007',
        date: `${yesterdayStr}T14:28`,
        callType: 'Outbound',
        outcome: 'Converted',
        notes: 'Student admission confirmed, full tuition payment verified.',
        followUp: '',
        timeAgo: 'Yesterday'
      }
    ],
    'LD-009': [
      {
        id: 'call-3',
        leadId: 'LD-009',
        date: `${todayStr}T10:15`,
        callType: 'Outbound',
        outcome: 'Connected',
        notes: 'Spoke with parents regarding fee discount and scholarships.',
        followUp: `${tomorrowStr}T11:30`,
        timeAgo: 'Today'
      }
    ],
    'LD-010': [
      {
        id: 'call-4',
        leadId: 'LD-010',
        date: `${past3DaysStr}T16:20`,
        callType: 'Inbound',
        outcome: 'Need Callback',
        notes: 'Inquired about weekend batches. Requested callback next week.',
        followUp: `${next3DaysStr}T12:00`,
        timeAgo: '3 days ago'
      }
    ],
    'LD-011': [
      {
        id: 'call-5',
        leadId: 'LD-011',
        date: `${past3DaysStr}T12:30`,
        callType: 'Outbound',
        outcome: 'Follow-up',
        notes: 'Missed counseling session. Overdue follow-up call needed.',
        followUp: `${yesterdayStr}T15:00`,
        timeAgo: '3 days ago'
      }
    ],
    'LD-012': []
  };

  return leads.map(item => {
    const leadCalls = demoCallsMap[item.id] || [];
    const lastCall = leadCalls[0] || null;
    return {
      id: item.id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      city: item.city,
      source: item.source,
      type: item.type,
      status: item.status,
      assigned: item.assigned,
      priority: item.priority,
      assignedTo: item.assignedTo,
      date: lastCall?.date || '',
      outcome: lastCall?.outcome || '',
      notes: lastCall?.notes || '',
      followUp: lastCall?.followUp || '',
      calls: leadCalls
    };
  });
};

