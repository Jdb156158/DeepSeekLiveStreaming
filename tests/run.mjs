import {runTests} from './domino-engine.test.mjs';

const result=runTests();
for(const check of result.checks)console.log(`PASS ${check}`);
console.log(`\n${result.passed} checks passed`);
