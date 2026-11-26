import assert from 'node:assert/strict';
import test from 'node:test';
import { getDirectoryRoleAccess, readEmployeeDirectoryResponse } from '../src/hrCds/utils/employeeDirectory.js';

test('a company owner keeps directory access when assigned a custom job role', () => {
  const user = { companyRole: 'Company Owner', jobRole: { roleName: 'Director' } };
  assert.equal(getDirectoryRoleAccess(user).isMasterRole, true);
  assert.equal(getDirectoryRoleAccess(user).fallbackAllowed, true);
});

test('a manager or employee keeps configured directory scope', () => {
  assert.equal(getDirectoryRoleAccess({ companyRole: 'employee', jobRole: { name: 'Manager' } }).isMasterRole, false);
  assert.equal(getDirectoryRoleAccess({ companyRole: 'employee', jobRole: { name: 'Owner' } }).isMasterRole, false);
});

test('reads company and department directory responses and pagination', () => {
  const users = [{ _id: 'employee-1' }];
  const pagination = { pages: 2 };
  assert.deepEqual(readEmployeeDirectoryResponse({ success: true, message: { users } }).users, users);
  assert.deepEqual(readEmployeeDirectoryResponse({ data: { users, pagination } }), { users, pagination });
  assert.deepEqual(readEmployeeDirectoryResponse({ message: users }).users, users);
});

test('distinguishes an empty directory from an invalid API payload', () => {
  assert.deepEqual(readEmployeeDirectoryResponse({ message: { users: [] } }).users, []);
  assert.throws(() => readEmployeeDirectoryResponse({ success: true, message: 'OK' }), /valid employee list/);
});
