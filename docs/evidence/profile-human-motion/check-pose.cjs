'use strict';

const assert = require('node:assert/strict');
const { poseAt, names } = require('../../../assets/profile/motion.js');

const limit = 1e-6;
const idlePhases = [0, .36, .89, 1.27, 1.91, 2.4];
const joints = ['head', 'shoulder', 'hip', 'elbowL', 'elbowR', 'handL', 'handR', 'light'];
const maxGap = { contact: 0, support: 0, boundary: 0 };
const counts = { poses: 0, lockedContacts: 0, plantedFeet: 0, boundaryPairs: 0 };

function measure(kind, actual, expected, where) {
  const gap = Math.hypot(...actual.map((v, i) => v - expected[i]));
  assert.ok(gap < limit, `${where}: ${kind} gap ${gap} exceeds ${limit}`);
  maxGap[kind] = Math.max(maxGap[kind], gap);
}

for (let tick = 0; tick <= (names.length - 1) * 100; tick++) {
  const beat = tick / 100;
  for (const idle of idlePhases) {
    const pose = poseAt(beat, idle);
    counts.poses++;
    const where = `beat ${beat}, visible seconds ${idle}`;
    for (const [index, side] of ['left', 'right'].entries()) {
      const contact = pose.contacts[side];
      if (contact.active) {
        measure('contact', contact.tip, contact.target, where);
        counts.lockedContacts++;
      }
      const foot = index === 0 ? pose.support.footL : pose.support.footR;
      if (foot.weight === 1) {
        measure('support', pose.feet[index], foot.target, where);
        counts.plantedFeet++;
      }
    }
    if (Number.isInteger(beat) && beat > 0 && beat < names.length - 1) {
      const left = poseAt(beat - 1e-7, idle);
      const right = poseAt(beat + 1e-7, idle);
      for (const joint of joints) measure('boundary', left[joint], right[joint], where + ', ' + joint);
      counts.boundaryPairs++;
    }
  }
}

console.log(JSON.stringify({ counts, maxGap, limit, idlePhases }, null, 2));
