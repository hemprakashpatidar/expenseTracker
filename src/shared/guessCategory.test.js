import { matchCategory, guessCategory } from './guessCategory.js';

test('matches keywords at the start of a word', () => {
  expect(matchCategory('Swiggy dinner')).toBe('Food & Dining');
  expect(matchCategory('UBER TRIP')).toBe('Transportation');
  expect(matchCategory('Electricity billing')).toBe('Bills & Utilities');
});

test('ignores keywords hidden inside other words', () => {
  expect(matchCategory('Great view')).toBeNull();      // eat
  expect(matchCategory('Automatic watch')).toBeNull(); // auto
  expect(matchCategory('Video call')).toBeNull();      // vi
  expect(matchCategory('Label maker')).toBeNull();     // lab
});

test('short keywords match as whole words', () => {
  expect(matchCategory('Vi recharge')).toBe('Bills & Utilities');
  expect(matchCategory('Ola cab')).toBe('Transportation');
});

test('guessCategory falls back to Other', () => {
  expect(guessCategory('Gym')).toBe('Other');
});
