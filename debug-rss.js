
const https = require('node:https');
const http = require('node:http');

const url = 'https://feeds.simplecast.com/Sl5CSM3S';

console.log('--- Debugging RSS Fetch ---');
console.log('Target URL:', url);

// Test 1: Native HTTPS module
console.log('\n1. Testing native https.get...');
try {
    https.get(url, (res) => {
        console.log('   Status:', res.statusCode);
        res.on('data', () => { });
        res.on('end', () => console.log('   Success!'));
    }).on('error', (e) => {
        console.error('   Failed:', e.message);
    });
} catch (e) {
    console.error('   Sync Error:', e.message);
}

// Test 2: Global Fetch
console.log('\n2. Testing global fetch...');
fetch(url).then(res => {
    console.log('   Status:', res.status);
}).catch(e => {
    console.error('   Failed:', e.message);
});

// Test 3: New URL parsing
console.log('\n3. Testing URL parsing...');
try {
    const u = new URL(url);
    console.log('   Protocol:', u.protocol);
} catch (e) {
    console.error('   Parsing Failed:', e.message);
}
