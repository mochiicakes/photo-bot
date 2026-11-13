// Little pose ideas shown before each shot, Korean/Japanese photobooth style.
export const POSES = [
  { icon: '✌️', en: 'Peace sign', ja: 'ピース' },
  { icon: '🫶', en: 'Heart hands', ja: 'ハート' },
  { icon: '🤏', en: 'Finger heart', ja: '指ハート' },
  { icon: '🤔', en: 'Chin rest', ja: 'あごのせ' },
  { icon: '🥺', en: 'Cheek squish', ja: 'ほっぺ' },
  { icon: '😉', en: 'Wink', ja: 'ウインク' },
  { icon: '🐱', en: 'Cat paws', ja: 'ねこポーズ' },
  { icon: '🐰', en: 'Bunny ears', ja: 'うさ耳' },
  { icon: '😮', en: 'Surprised!', ja: 'びっくり' },
  { icon: '🤫', en: 'Shh…', ja: 'しーっ' },
  { icon: '😚', en: 'Blow a kiss', ja: 'チュー' },
  { icon: '🙈', en: 'Peek-a-boo', ja: 'いないいないばあ' },
  { icon: '👑', en: 'Princess pose', ja: 'お姫さま' },
  { icon: '🌙', en: 'Look up at the moon', ja: 'お月見' },
  { icon: '😆', en: 'Big laugh', ja: '大笑い' },
  { icon: '🤳', en: 'Lean in close', ja: 'ぎゅっ' },
]

/** Returns `count` poses in random order, without repeats (cycles if count > POSES). */
export const shufflePoses = (count = POSES.length) => {
  const deck = [...POSES]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return Array.from({ length: count }, (_, i) => deck[i % deck.length])
}
