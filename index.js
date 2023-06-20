import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { cartesianProduct } from './utils.js';
import { $ } from 'zx';

const args = parseArgs({
  options: {
    name: {
      type: 'string',
      short: 'n'
    },
    maxHeap: {
      type: 'string',
      short: 'h',
      default: '256'
    }
  }
})

const rawCombos = readFileSync(`./tests/${args.values.name}/combos.json`, 'utf-8')
const combos = JSON.parse(rawCombos)

if (Object.keys(combos).length > 2) {
  throw new Error(`Too many parameters. Resulting data would have ${Object.keys(combos).length} dimensions`)
}

const rawSubjects = readFileSync(`./tests/${args.values.name}/subjects.json`, 'utf-8')
const subjects = JSON.parse(rawSubjects)

const rawParams = readFileSync(`./tests/${args.values.name}/params.json`, 'utf-8')
const params = JSON.parse(rawParams)

const { before } = await import(`./tests/${args.values.name}/before.js`)
const allCombos = cartesianProduct(combos)

const allSubjects  = cartesianProduct(subjects)
console.log(`All combinations:`, allCombos.length)

for (const subject of allSubjects) {
  await before(subject)
  mkdirSync(`./out/${subject.branch}`, { recursive: true }) 
  const parameterName = combos[Object.keys(combos)[0]].name
  let results = [[parameterName]]
  for (const combo of allCombos) {
    console.log(`Running combo:`, combo)
    const flagsFromCombos = Object.entries(combo).map(([key, value]) => `--${key}=${value}`).join(' ')
    const flagsFromParams = Object.entries(params).map(([key, value]) => `--${key}=${value}`).join(' ')
    const flags = `${flagsFromCombos} ${flagsFromParams}`
    let attempts = 20
    

    const parameterValue = Object.values(combo)[0]
    // results.push([parameterValue])
    let attemptsSerie = []

    while (attempts--) {
      const run = await $`node --max-old-space-size=${args.values.maxHeap} ./tests/${args.values.name}/index.js ${flagsFromCombos}`
      attemptsSerie.push(run.stdout.replace('\n', ''))
    }

    results.push([
      parameterValue,
      ...attemptsSerie
    ])

  }
  console.log(results)

  const summaryData = results.reduce((summary, serie, index) => {
    if (index === 0) {
      return summary
    }
    const [parameterValue, ...attempts] = serie
    const average = attempts.reduce((sum, attempt) => sum + parseInt(attempt), 0) / attempts.length
    const max = Math.max(...attempts)
    const min = Math.min(...attempts)
    const median = attempts.sort()[Math.floor(attempts.length / 2)]
    return [...summary, [parameterValue, average, median, max, min, ]]
  }, [])

  const summary = [
    [...results[0], 'average', 'median', 'max', 'min'],
    ...summaryData
  ]


  // to csv
  const csvSeries = results.map(row => row.join(',')).join('\n')
  writeFileSync(`./out/${subject.branch}/out-raw.csv`, csvSeries, 'utf-8')

  // to csv
  const csvSummary = summary.map(row => row.join(',')).join('\n')
  writeFileSync(`./out/${subject.branch}/out-summary.csv`, csvSummary, 'utf-8')
}

