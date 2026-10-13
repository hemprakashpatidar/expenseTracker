// Keyword → category guesses, shared by the add form (as you type) and statement import
const CATEGORY_KEYWORDS = {
  'Food & Dining': ['swiggy', 'zomato', 'domino', 'pizza', 'restaurant', 'cafe', 'food', 'dining', 'hotel', 'eat', 'biryani', 'burger', 'starbucks', 'mcdonalds', 'kfc', 'blinkit'],
  Transportation: ['uber', 'ola', 'rapido', 'auto', 'taxi', 'cab', 'petrol', 'fuel', 'metro', 'bus', 'train', 'irctc', 'flight', 'airline'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'shop', 'store', 'mall', 'retail', 'meesho', 'market'],
  Entertainment: ['netflix', 'hotstar', 'prime', 'spotify', 'youtube', 'jio cinema', 'movie', 'cinema', 'theater', 'pvr', 'inox', 'game'],
  'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'bill', 'utility', 'airtel', 'jio', 'vi', 'bsnl', 'postpaid'],
  Healthcare: ['pharmacy', 'chemist', 'doctor', 'hospital', 'clinic', 'medical', 'medicine', 'apollo', 'thyrocare', 'lab'],
  Travel: ['hotel', 'oyo', 'makemytrip', 'goibibo', 'booking', 'airbnb', 'resort', 'inn'],
  Education: ['course', 'udemy', 'coursera', 'byju', 'unacademy', 'school', 'college', 'fees', 'tuition', 'book', 'stationary'],
  Groceries: ['bigbasket', 'grofer', 'dunzo', 'grocery', 'supermarket', 'kirana', 'vegetables', 'fruit', 'zepto'],
};

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A keyword must start a word, so "great" isn't Food (eat) and "automatic" isn't Transport
// (auto); "billing" still matches "bill". Keywords of three letters or fewer must be the whole
// word, so "video" isn't Bills (vi) and "label" isn't Healthcare (lab).
const SHORT_KEYWORD = 3;
const keywordPattern = (keyword) =>
  `(?:^|[^a-z0-9])${escape(keyword)}${keyword.length <= SHORT_KEYWORD ? '(?:$|[^a-z0-9])' : ''}`;

const MATCHERS = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => ({
  category,
  pattern: new RegExp(keywords.map(keywordPattern).join('|'), 'i'),
}));

// Returns null when nothing matches
export const matchCategory = (description = '') =>
  MATCHERS.find(({ pattern }) => pattern.test(description))?.category ?? null;

export const guessCategory = (description = '') => matchCategory(description) || 'Other';
