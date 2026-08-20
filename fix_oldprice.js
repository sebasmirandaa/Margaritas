const fs = require('fs');

// 1. Fix admin.js to explicitly send oldPrice even if null
let adminJs = fs.readFileSync('public/admin.js', 'utf8');
adminJs = adminJs.replace(
    /const product = \{ title, price, desc, tag \};\s*if \(oldPrice\) product\.oldPrice = oldPrice;/g,
    `const product = { title, price, desc, tag, oldPrice };`
);
fs.writeFileSync('public/admin.js', adminJs, 'utf8');

// 2. Fix server.js to delete oldPrice if it is null
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
    /if \(idx >= 0\) products\[idx\] = \{ \.\.\.products\[idx\], \.\.\.product \};/g,
    `if (idx >= 0) {
                  products[idx] = { ...products[idx], ...product };
                  if (product.oldPrice === null) delete products[idx].oldPrice;
              }`
);
fs.writeFileSync('server.js', serverJs, 'utf8');

console.log('Fix applied to admin.js and server.js for oldPrice.');
