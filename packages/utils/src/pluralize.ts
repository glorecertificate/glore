type Rule = RegExp | string
type CachedRule = [RegExp, string]
type IrregularMap = Map<string, string>

const IRREGULARS: [string, string][] = [
  // Pronouns
  ['I', 'we'],
  ['me', 'us'],
  ['he', 'they'],
  ['she', 'they'],
  ['them', 'them'],
  ['myself', 'ourselves'],
  ['yourself', 'yourselves'],
  ['itself', 'themselves'],
  ['herself', 'themselves'],
  ['himself', 'themselves'],
  ['themself', 'themselves'],
  ['is', 'are'],
  ['was', 'were'],
  ['has', 'have'],
  ['this', 'these'],
  ['that', 'those'],
  ['my', 'our'],
  ['its', 'their'],
  ['his', 'their'],
  ['her', 'their'],
  // Words ending in with a consonant and `o`
  ['echo', 'echoes'],
  ['dingo', 'dingoes'],
  ['volcano', 'volcanoes'],
  ['tornado', 'tornadoes'],
  ['torpedo', 'torpedoes'],
  // Ends with `us`
  ['genus', 'genera'],
  ['viscus', 'viscera'],
  // Ends with `ma`
  ['stigma', 'stigmata'],
  ['stoma', 'stomata'],
  ['dogma', 'dogmata'],
  ['lemma', 'lemmata'],
  ['schema', 'schemata'],
  ['anathema', 'anathemata'],
  // Other irregular rules
  ['ox', 'oxen'],
  ['axe', 'axes'],
  ['die', 'dice'],
  ['yes', 'yeses'],
  ['foot', 'feet'],
  ['eave', 'eaves'],
  ['goose', 'geese'],
  ['tooth', 'teeth'],
  ['quiz', 'quizzes'],
  ['human', 'humans'],
  ['proof', 'proofs'],
  ['carve', 'carves'],
  ['valve', 'valves'],
  ['looey', 'looies'],
  ['thief', 'thieves'],
  ['groove', 'grooves'],
  ['pickaxe', 'pickaxes'],
  ['passerby', 'passersby'],
  ['canvas', 'canvases'],
]
const PLURALS: [Rule, string][] = [
  [/s?$/i, 's'],
  // eslint-disable-next-line no-control-regex
  [/[^\u0000-\u007F]$/i, '$0'],
  [/([^aeiou]ese)$/i, '$1'],
  [/(ax|test)is$/i, '$1es'],
  [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, '$1es'],
  [/(e[mn]u)s?$/i, '$1s'],
  [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, '$1'],
  [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1i'],
  [/(alumn|alg|vertebr)(?:a|ae)$/i, '$1ae'],
  [/(seraph|cherub)(?:im)?$/i, '$1im'],
  [/(her|at|gr)o$/i, '$1oes'],
  [
    /(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i,
    '$1a',
  ],
  [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i, '$1a'],
  [/sis$/i, 'ses'],
  [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, '$1$2ves'],
  [/([^aeiouy]|qu)y$/i, '$1ies'],
  [/([^ch][ieo][ln])ey$/i, '$1ies'],
  [/(x|ch|ss|sh|zz)$/i, '$1es'],
  [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, '$1ices'],
  [/\b((?:tit)?m|l)(?:ice|ouse)$/i, '$1ice'],
  [/(pe)(?:rson|ople)$/i, '$1ople'],
  [/(child)(?:ren)?$/i, '$1ren'],
  [/eaux$/i, '$0'],
  [/m[ae]n$/i, 'men'],
  ['thou', 'you'],
]
const SINGLES: [Rule, string][] = [
  [/s$/i, ''],
  [/(ss)$/i, '$1'],
  [/(wi|kni|(?:after|half|high|low|mid|non|night|[^\w]|^)li)ves$/i, '$1fe'],
  [/(ar|(?:wo|[ae])l|[eo][ao])ves$/i, '$1f'],
  [/ies$/i, 'y'],
  [/(dg|ss|ois|lk|ok|wn|mb|th|ch|ec|oal|is|ck|ix|sser|ts|wb)ies$/i, '$1ie'],
  [
    /\b(l|(?:neck|cross|hog|aun)?t|coll|faer|food|gen|goon|group|hipp|junk|vegg|(?:pork)?p|charl|calor|cut)ies$/i,
    '$1ie',
  ],
  [/\b(mon|smil)ies$/i, '$1ey'],
  [/\b((?:tit)?m|l)ice$/i, '$1ouse'],
  [/(seraph|cherub)im$/i, '$1'],
  [/(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$/i, '$1'],
  [/(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$/i, '$1sis'],
  [/(movie|twelve|abuse|e[mn]u)s$/i, '$1'],
  [/(test)(?:is|es)$/i, '$1is'],
  [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1us'],
  [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$/i, '$1um'],
  [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$/i, '$1on'],
  [/(alumn|alg|vertebr)ae$/i, '$1a'],
  [/(cod|mur|sil|vert|ind)ices$/i, '$1ex'],
  [/(matr|append)ices$/i, '$1ix'],
  [/(pe)(rson|ople)$/i, '$1rson'],
  [/(child)ren$/i, '$1'],
  [/(eau)x?$/i, '$1'],
  [/men$/i, 'man'],
]
const UNCOUNTABLES: Rule[] = [
  // Singular words with no plurals
  'adulthood',
  'advice',
  'agenda',
  'aid',
  'aircraft',
  'alcohol',
  'ammo',
  'analytics',
  'anime',
  'athletics',
  'audio',
  'bison',
  'blood',
  'bream',
  'buffalo',
  'butter',
  'carp',
  'cash',
  'chassis',
  'chess',
  'clothing',
  'cod',
  'commerce',
  'cooperation',
  'corps',
  'debris',
  'diabetes',
  'digestion',
  'elk',
  'energy',
  'equipment',
  'excretion',
  'expertise',
  'firmware',
  'flounder',
  'fun',
  'gallows',
  'garbage',
  'graffiti',
  'hardware',
  'headquarters',
  'health',
  'herpes',
  'highjinks',
  'homework',
  'housework',
  'information',
  'jeans',
  'justice',
  'kudos',
  'labour',
  'literature',
  'machinery',
  'mackerel',
  'mail',
  'media',
  'mews',
  'moose',
  'music',
  'mud',
  'manga',
  'news',
  'only',
  'personnel',
  'pike',
  'plankton',
  'pliers',
  'police',
  'pollution',
  'premises',
  'rain',
  'research',
  'rice',
  'salmon',
  'scissors',
  'series',
  'sewage',
  'shambles',
  'shrimp',
  'software',
  'staff',
  'swine',
  'tennis',
  'traffic',
  'transportation',
  'trout',
  'tuna',
  'wealth',
  'welfare',
  'whiting',
  'wildebeest',
  'wildlife',
  'you',
  /pok[eé]mon$/i,
  // Regex
  /[^aeiou]ese$/i, // "chinese", "japanese"
  /deer$/i, // "deer", "reindeer"
  /fish$/i, // "fish", "blowfish", "angelfish"
  /measles$/i,
  /o[iu]s$/i, // "carnivorous"
  /pox$/i, // "chickpox", "smallpox"
  /sheep$/i,
]

const pluralRules: CachedRule[] = []
const singularRules: CachedRule[] = []
const uncountables = new Set<string>()
const irregularPlurals: IrregularMap = new Map()
const irregularSingles: IrregularMap = new Map()

const mapHas = (word: string, replaceMap: IrregularMap, keepMap: IrregularMap, rules: CachedRule[]): boolean => {
  const token = word.toLowerCase()
  if (keepMap.has(token)) return true
  if (replaceMap.has(token)) return false
  return sanitizeWord(token, token, rules) === token
}

const restoreCase = (word: string, token: string | undefined): string => {
  // Edge case
  if (typeof token !== 'string') return word
  // Tokens are an exact match
  if (word === token) return token
  // Lower cased words, e.g. "hello"
  if (word === word.toLowerCase()) return token.toLowerCase()
  // Upper cased words, e.g. "WHISKY"
  if (word === word.toUpperCase()) return token.toUpperCase()
  // Title cased words, e.g. "Title"
  if (word.startsWith(word[0].toUpperCase())) return token.charAt(0).toUpperCase() + token.substr(1).toLowerCase()
  // Lower cased words, e.g. "test"
  return token.toLowerCase()
}

const sanitizeWord = (token: string, word: string, rules: CachedRule[]): string => {
  if (!token.length || uncountables.has(token)) return word

  let { length: len } = rules

  while (len--) {
    const rule = rules[len]

    if (rule[0].test(word)) {
      return word.replace(rule[0], (...args) => {
        const [match, index] = args
        const result = rule[1].replace(/\$(\d{1,2})/g, (_, index) => args[index] || '')
        return match === '' ? restoreCase(word[index - 1], result) : restoreCase(match, result)
      })
    }
  }

  return word
}

const sanitizeRule = (rule: Rule): RegExp => (typeof rule === 'string' ? new RegExp(`^${rule}$`, 'i') : rule)

const compute = (word: string, replaceMap: IrregularMap, keepMap: IrregularMap, rules: CachedRule[]): string => {
  const token = word.toLowerCase()
  if (keepMap.has(token)) return restoreCase(word, token)
  if (replaceMap.has(token)) return restoreCase(word, replaceMap.get(token))
  return sanitizeWord(token, word, rules)
}

/**
 * Pluralize or singularize a word based on the passed in count.
 *
 * @param word
 * @param count
 * @param inclusive
 * @public
 */
const pluralize = (word: string, count?: number, inclusive?: boolean): string => {
  const pluralized = count === 1 ? pluralize.singular(word) : pluralize.plural(word)
  if (inclusive) return `${count} ${pluralized}`
  return pluralized
}

/**
 * Pluralize a word based.
 *
 * @param word
 */
pluralize.plural = (word: string): string => compute(word, irregularSingles, irregularPlurals, pluralRules)

/**
 * Singularize a word based.
 *
 * @param word
 */
pluralize.singular = (word: string): string => compute(word, irregularPlurals, irregularSingles, singularRules)

/**
 * Add a pluralization rule to the collection.
 *
 * @param rule
 * @param replacement
 */
pluralize.addPluralRule = (rule: Rule, replacement: string): void => {
  pluralRules.push([sanitizeRule(rule), replacement])
}

/**
 * Add a singularization rule to the collection.
 *
 * @param rule
 * @param replacement
 */
pluralize.addSingularRule = (rule: Rule, replacement: string): void => {
  singularRules.push([sanitizeRule(rule), replacement])
}

/**
 * Add an irregular word definition.
 *
 * @param single
 * @param plural
 */
pluralize.addIrregularRule = (single: string, plural: string): void => {
  const _plural = plural.toLowerCase()
  const _single = single.toLowerCase()
  irregularSingles.set(_single, _plural)
  irregularPlurals.set(_plural, _single)
}

/**
 * Add an uncountable word rule.
 *
 * @param rule
 */
pluralize.addUncountableRule = (rule: Rule): void => {
  if (typeof rule === 'string') {
    uncountables.add(rule.toLowerCase())
    return
  }
  pluralize.addPluralRule(rule, '$0')
  pluralize.addSingularRule(rule, '$0')
}

/**
 * Test if the provided word is plural.
 *
 * @param word
 */
pluralize.isPlural = (word: string): boolean => mapHas(word, irregularSingles, irregularPlurals, pluralRules)

/**
 * Test if the provided word is singular.
 *
 * @param word
 */
pluralize.isSingular = (word: string): boolean => mapHas(word, irregularPlurals, irregularSingles, singularRules)

for (const [single, plural] of IRREGULARS) {
  pluralize.addIrregularRule(single, plural)
}
for (const [search, replacement] of PLURALS) {
  pluralize.addPluralRule(search, replacement)
}
for (const [search, replacement] of SINGLES) {
  pluralize.addSingularRule(search, replacement)
}
for (const search of UNCOUNTABLES) {
  pluralize.addUncountableRule(search)
}

export { pluralize }
