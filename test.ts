import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/stock-data?scripCode=RELIANCE.NS');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error("ERROR", err.message);
  }
}
test();
