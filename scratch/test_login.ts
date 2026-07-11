async function run() {
  const url = 'https://files-management.nahidbusinessacademy.com';
  const email = 'rokon.mastery.com.bd@gmail.com';
  const password = 'Pass@135';

  const endpoints = [
    { method: 'GET', path: '/api/v3/site/ping' },
    { method: 'GET', path: '/api/v3/site/info' },
    { method: 'GET', path: '/api/v4/site/ping' },
    { method: 'POST', path: '/api/v3/user/session', body: { userName: email, password } },
    { method: 'POST', path: '/api/v3/user/login', body: { email, password } },
    { method: 'POST', path: '/api/v3/session', body: { userName: email, password } },
    { method: 'POST', path: '/api/v3/session/token', body: { email, password } },
    { method: 'POST', path: '/api/v4/session/token', body: { email, password } },
  ];

  for (const ep of endpoints) {
    try {
      console.log(`Trying ${ep.method} ${url}${ep.path}`);
      const res = await fetch(`${url}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
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
