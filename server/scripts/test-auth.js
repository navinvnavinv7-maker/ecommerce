import dotenv from 'dotenv';
import { connectDB } from '../dbConnection.js';
import User from '../models/User.js';

dotenv.config();

const API_ROOT = 'http://localhost:3000/api';

async function testAuth() {
  await connectDB();
  console.log('🏁 Starting Authentication & Security test suite...');
  console.log(`Connecting to server endpoints at ${API_ROOT}`);

  const testUser = {
    username: 'test_security_user',
    email: 'security_test@nexus.io',
    password: 'SecurePassword123'
  };

  try {
    console.log('\nTest 1: Registering a standard user account...');
    const regRes = await fetch(`${API_ROOT}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testUser, role: 'admin' })
    });
    const regData = await regRes.json();
    console.log('Register Response Status:', regRes.status);
    console.log('Register Response Body:', regData);

    if (regRes.status !== 201) {
      if (regData.error && regData.error.includes('already exists')) {
        console.log('👉 Test user already exists, proceeding to verification test...');
      } else {
        throw new Error('Registration failed: ' + JSON.stringify(regData));
      }
    }

    const createdUser = await User.findOne({ email: testUser.email.toLowerCase() });
    if (!createdUser) {
      throw new Error('User record was not created.');
    }

    console.log('\nTest 2: Verifying admin-email role mapping...');
    const adminEmail = 'owner@gmail.com';
    const adminRegRes = await fetch(`${API_ROOT}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'owner_test', email: adminEmail, password: 'Password123!' })
    });
    const adminRegData = await adminRegRes.json();
    console.log('Admin registration status:', adminRegRes.status);
    console.log('Admin registration body:', adminRegData);

    const adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!adminUser) {
      throw new Error('Admin test user was not created.');
    }

    if (adminUser.isVerified) {
      console.log('✅ Existing allowlisted account already verified and has admin role.');
    } else if (adminUser.otp) {
      const otpVerifyRes = await fetch(`${API_ROOT}/auth/otp-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, otp: adminUser.otp })
      });
      const otpVerifyData = await otpVerifyRes.json();
      console.log('OTP verify status:', otpVerifyRes.status);
      console.log('OTP verify body:', otpVerifyData);

      if (!otpVerifyRes.ok || otpVerifyData.user?.role !== 'admin') {
        throw new Error('Security failure: allowlisted email did not receive admin access. ' + JSON.stringify(otpVerifyData));
      }
    }

    const refreshedAdminUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (refreshedAdminUser?.role !== 'admin') {
      throw new Error('Security failure: allowlisted email did not receive admin access.');
    }

    console.log('✅ Admin allowlist behavior is active.');

    console.log('\nTest 3: Attempting to POST a product without authentication...');
    const prodRes = await fetch(`${API_ROOT}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hack Keyboard', price: 99.99 })
    });
    const prodData = await prodRes.json();
    console.log('POST product status:', prodRes.status);
    console.log('POST product body:', prodData);

    if (prodRes.status === 401) {
      console.log('✅ Securely blocked unauthorized product creation (401 Unauthorized).');
    } else {
      throw new Error('Security failure: Allowed product creation without token!');
    }

    console.log('\n🎉 Security checks completed.');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('Make sure the backend server is running on port 3000 to run these tests.');
  }
}

testAuth();
