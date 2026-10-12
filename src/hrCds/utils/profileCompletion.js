const hasProfileValue = (value) => {
  if (!value) return false;
  if (typeof value === 'object') {
    const label = value.name || value.roleName || value.departmentName || value.branchName || value.title || value._id || value.id || '';
    return String(label).trim().length > 0;
  }
  const str = String(value).trim();
  return str.length > 0 && str.toLowerCase() !== 'not provided' && str.toLowerCase() !== 'not added';
};

export const getProfileCompletion = (profile) => {
  if (!profile || typeof profile !== 'object') return 0;

  const fields = [
    // Personal
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
    // Employment (visible on Profile.jsx)
    profile.employeeType || profile.employmentType,
    profile.workLocation || profile.location || profile.officeLocation || profile.branch,
    profile.designation || profile.jobTitle || profile.jobRole || profile.role,
    profile.department || profile.departmentName,
    profile.joiningDate || profile.dateOfJoining,
    // Identity
    profile.aadhaar || profile.aadhar || profile.aadharCard,
    profile.panCard || profile.pan,
    // Bank (visible on Profile.jsx)
    profile.accountNumber,
    profile.ifsc,
    profile.bankName,
    // Family & Emergency
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

export const getFirstIncompleteProfileSection = (profile) => {
  if (!profile || typeof profile !== 'object') return 'personal';

  const personalComplete = [
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
  ].every(hasProfileValue);
  if (!personalComplete) return 'personal';

  const identityComplete = [
    profile.aadhaar || profile.aadhar || profile.aadharCard,
    profile.panCard || profile.pan,
  ].every(hasProfileValue);
  if (!identityComplete) return 'identity';

  const bankComplete = [
    profile.accountNumber,
    profile.ifsc,
    profile.bankName,
  ].every(hasProfileValue);
  if (!bankComplete) return 'bank';

  const familyFields = [
    profile.maritalStatus,
    profile.fatherName,
    profile.motherName,
    profile.emergencyName,
    profile.emergencyPhone,
    profile.emergencyAddress,
  ];
  if (String(profile.maritalStatus || '').trim().toLowerCase() === 'married') {
    familyFields.push(profile.spouseName);
  }
  if (!familyFields.every(hasProfileValue)) return 'family';

  return 'all';
};

