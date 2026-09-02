import assert from 'node:assert/strict';
import { learnerMatchesQuery, normalizeLearnerSearch } from '../lib/learners/search.ts';

const learner = {
  latin_first_name: 'Anna',
  latin_last_name: 'Novak',
  ukrainian_full_name: 'Анна Новак',
  learner_emails: [{ email: 'anna.novak@example.com' }],
  learner_phones: [{ phone: '+420 123 456 789' }],
};

assert.equal(normalizeLearnerSearch('  ANNA   Novak  '), 'anna novak');
assert.equal(learnerMatchesQuery(learner, 'Anna Novak'), true);
assert.equal(learnerMatchesQuery(learner, '  ANNA   NOVAK  '), true);
assert.equal(learnerMatchesQuery(learner, 'Anna'), true);
assert.equal(learnerMatchesQuery(learner, 'Novak'), true);
assert.equal(learnerMatchesQuery(learner, 'Анна Новак'), true);
assert.equal(learnerMatchesQuery(learner, 'anna.novak@example.com'), true);
assert.equal(learnerMatchesQuery(learner, '+420 123'), true);
assert.equal(learnerMatchesQuery(learner, 'Anna Other'), false);

console.log('ADM-LEARNER-FULL-NAME-SEARCH behavior test passed.');
