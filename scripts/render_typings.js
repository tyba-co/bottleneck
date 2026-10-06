const ejs = require('ejs')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

for (const name of ['bottleneck', 'light']) {
  const template = path.join(root, `${name}.d.ts.ejs`)
  const rendered = ejs.render(fs.readFileSync(template, 'utf8'), {}, { filename: template })
  fs.writeFileSync(path.join(root, `${name}.d.ts`), `${rendered}\n`)
}
