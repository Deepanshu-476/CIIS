const hasProfileValue = (value) => String(value ?? '').trim().length > 0;

export const getProfileCompletion = (profile) => {
  if (!profile || typeof profile !== 'object') return 0;

  const fields = [
    profile.name,
    profile.email,
    profile.phone || profile.mobile,
    profile.dob,
    profile.gender,
    profile.address,
    profile.city,
    profile.state,
    profile.pinCode || profile.zipCode,
    profile.country,
    profile.aadhaar || profile.aadhar || profile.aadharCard,
    profile.panCard || profile.pan,
    profile.bankHolderName,
    profile.accountNumber,
    profile.ifsc,
    profile.bankName,
    profile.maritalStatus,
    profile.fatherName,
    profile.motherName,
    profile.emergencyName,
    profile.emergencyPhone,
    profile.emergencyAddress,
  ];

  if (String(profile.maritalStatus || '').trim().toLowerCase() === 'married') {
    fields.push(profile.spouseName);
  }

  const completedFields = fields.filter(hasProfileValue).length;
  return Math.round((completedFields / fields.length) * 100);
};
