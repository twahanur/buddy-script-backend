async function run() {
  const url = 'https://files-management.nahidbusinessacademy.com';
  const email = 'rokon.mastery.com.bd@gmail.com';
  const password = 'Pass@135';
  const policyId = 'XZiV';

  // 1. Login
  const loginRes = await fetch(`${url}/api/v4/session/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token.access_token;
  console.log('Login successful, token retrieved.');

  // 2. Test create upload session endpoints
  const endpoints = [
    { method: 'POST', path: '/api/v4/file/upload', body: { path: '/', size: 10, name: 'test.png', policy_id: policyId } },
    { method: 'PUT', path: '/api/v4/file/upload', body: { path: '/', size: 10, name: 'test.png', policy_id: policyId } },
    { method: 'POST', path: '/api/v4/upload/session', body: { path: '/', size: 10, name: 'test.png', policy_id: policyId } },
    { method: 'POST', path: '/api/v4/storage/session', body: { path: '/', size: 10, name: 'test.png', policy_id: policyId } },
    { method: 'PUT', path: '/api/v4/file/upload', body: { path: '/', size: 10, name: 'test.png' } }, // without policy
    { method: 'POST', path: '/api/v4/file/upload', body: { path: '/', size: 10, name: 'test.png' } }, // without policy
  ];

  for (const ep of endpoints) {
    try {
      console.log(`Trying ${ep.method} ${url}${ep.path} with body:`, JSON.stringify(ep.body));
      const res = await fetch(`${url}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(ep.body),
      });
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      console.log(`Body:`, text.substring(0, 500));
      console.log('-----------------------------------');
    } catch (e: any) {
      console.error(`Error for ${ep.path}:`, e.message);
    }
  }
}

run();
