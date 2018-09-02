const { JSDOM } = require('jsdom');
const Gists = require('gists');
const IFTTT = require('node-ifttt-maker');

const gists = new Gists({ token: process.env.GITHUB_GIST_ACCESS_TOKEN });
const ifttt = new IFTTT(process.env.IFTTT_MAKER_KEY);

(async () => {
  try {
    const url = 'https://oldnavy.gap.com/browse/product.do?pid=139537002';

    const { window } = await JSDOM.fromURL(url);

    const [name, currentPrice] = Array.from(window.document.querySelectorAll('h1.product-title, h5.product-price')).map((node) => {
      return node.textContent.trim();
    });

    const { body } = await gists.get('b1c0c984ef7dc1d6a292c2609d8f1818');
    const { price: previousPrice } = JSON.parse(body.files['db.json'].content);

    if (currentPrice !== previousPrice) {
      const iftttResponse = await ifttt.request({
        event: 'old_navy_price_change',
        params: {
          value1: name,
          value2: currentPrice,
          value3: previousPrice,
        },
      });
    }

    console.log({ name, currentPrice, previousPrice });

    const db = await gists.edit('b1c0c984ef7dc1d6a292c2609d8f1818', {
      description: `Old Navy: ${name} • ${currentPrice}`,
      files: {
        'db.json': {
          content: JSON.stringify({ name, price: currentPrice, url, date: new Date().toISOString() }, null, 2),
        },
      },
    });
  } catch (e) {
    console.error(e);
  }
})();
