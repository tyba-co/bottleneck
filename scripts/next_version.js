// Prints the version after the latest release tag: node scripts/next_version.js <patch|minor|major>
const { execFileSync } = require('child_process')

const RELEASE_TAG = /^v?(\d+)\.(\d+)\.(\d+)$/

/**
 * @param {string[]} tags
 * @returns {number[]} [major, minor, patch] of the highest release tag, ignoring prereleases
 */
const getLatestReleaseVersion = (tags) => tags
  .map(tag => tag.trim().match(RELEASE_TAG))
  .filter(Boolean)
  .map(([, major, minor, patch]) => [Number(major), Number(minor), Number(patch)])
  .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]

/**
 * @param {number[]} version
 * @param {string} bump
 * @returns {string}
 */
const bumpVersion = ([major, minor, patch], bump) => {
  if (bump === 'major') return `${major + 1}.0.0`
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`
  throw new Error(`Unknown bump "${bump}": use patch, minor or major`)
}

const bump = process.argv[2] || 'patch'
const tags = execFileSync('git', ['tag', '--list'], { encoding: 'utf8' }).split('\n')
const latest = getLatestReleaseVersion(tags)
if (latest == null) {
  throw new Error('No release tag (x.y.z) found; fetch tags first')
}
console.log(bumpVersion(latest, bump))
