import { myFunction } from 'path'
import { parseArgs } from 'node:util';



const args = parseArgs({
  options: {
    callsCounts: { type: 'string', default: '1' },
    path: { type: 'string' },
  },
  strict: false
})

const { myFunction } = await import(`${args.values.path}/dist/index.mjs`)

let i = parseInt(args.values.callsCounts)

const start = process.hrtime()

while (i--) {
  myFunction()
}

const end = process.hrtime(start)
console.log(end[1])