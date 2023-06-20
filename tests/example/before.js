import { $ } from 'zx'

export async function before({branch, path}) {
  await $`(cd ${path} && git checkout ${branch})`
  await $`(cd ${path} && yarn && yarn build)`


  try {
    await $`mv ${path}dist/index.es.js ${path}dist/index.es.mjs`
  } catch(err){
    console.log(`Failed to rename file`, err)
  }
}