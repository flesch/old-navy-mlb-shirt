const puppeteer = require('puppeteer');
const Gists = require('gists');
const IFTTT = require('node-ifttt-maker');

const gists = new Gists({ token: process.env.GITHUB_GIST_ACCESS_TOKEN });
const ifttt = new IFTTT(process.env.IFTTT_MAKER_KEY);

(async () => {
  try {
    const url = 'https://oldnavy.gap.com/browse/product.do?pid=139537002';

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url);

    const product = await page.$$eval('h1.product-title, h5.product-price', ([name, price]) => {
      return { name: name.textContent.trim(), price: price.textContent.trim() };
    });

    await browser.close();

    const { body } = await gists.get('b1c0c984ef7dc1d6a292c2609d8f1818');
    const data = JSON.parse(body.files['db.json'].content);

    if (product.price !== data.price) {
      const iftttResponse = await ifttt.request({
        event: 'old_navy_price_change',
        params: {
          value1: product.name,
          value2: product.price,
          value3: data.price,
        },
      });
    }

    const db = await gists.edit('b1c0c984ef7dc1d6a292c2609d8f1818', {
      description: `Old Navy: ${product.name} • ${product.price}`,
      files: {
        'db.json': {
          content: JSON.stringify({ ...product, url, date: new Date().toISOString() }, null, 2),
        },
      },
    });
  } catch (e) {
    console.error(e);
  }
})();
