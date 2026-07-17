import http from 'http';
import https from 'https';

function testUrl(url: string) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function main() {
  const urls = [
    'https://cdn.corenexis.com/files/c/7334284720.png',
    'https://cdn.corenexis.com/files/c/8845266720.png',
    'https://cdn.corenexis.com/files/c/7279256720.png'
  ];
  for (const url of urls) {
    const res = await testUrl(url);
    console.log(JSON.stringify(res));
  }
}

main();
