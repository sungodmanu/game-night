const QUOTES = [
  { text: "It does not do to dwell on dreams and forget to live.", by: "Albus Dumbledore" },
  { text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.", by: "Albus Dumbledore" },
  { text: "It is our choices, Harry, that show what we truly are, far more than our abilities.", by: "Albus Dumbledore" },
  { text: "Working hard is important. But there is something that matters even more: believing in yourself.", by: "Harry Potter" },
  { text: "It takes a great deal of bravery to stand up to our enemies, but just as much to stand up to our friends.", by: "Albus Dumbledore" },
  { text: "We've all got both light and dark inside us. What matters is the part we choose to act on.", by: "Sirius Black" },
  { text: "I solemnly swear that I am up to no good.", by: "The Marauders" },
  { text: "Nitwit! Blubber! Oddment! Tweak!", by: "Albus Dumbledore" },
  { text: "The ones that love us never really leave us.", by: "Sirius Black" },
  { text: "You sort of start thinking anything's possible if you've got enough nerve.", by: "Ginny Weasley" },
  { text: "It is the unknown we fear when we look upon death and darkness, nothing more.", by: "Albus Dumbledore" },
  { text: "Let us step into the night and pursue that flighty temptress, adventure.", by: "Albus Dumbledore" }
];

const ACTIVITIES = [
  { id: "jacks", prompt: "Stand up! Do 10 jumping jacks.", hint: "Count out loud like a spell." },
  { id: "toes", prompt: "Touch your toes 8 times.", hint: "Bend, stretch, smile." },
  { id: "hops", prompt: "Hop in place 12 times.", hint: "Soft landings, wizard feet." },
  { id: "giraffe", prompt: "Reach for the ceiling like a giraffe for 10 seconds.", hint: "Fingers as high as they go." },
  { id: "frogs", prompt: "Do 6 frog jumps across the room.", hint: "Then hop back to your seat." },
  { id: "spin", prompt: "Spin in a slow circle twice, then freeze like a statue.", hint: "No dizzy racing." },
  { id: "patronus", prompt: "Strike a brave pose and shout your favorite spell 3 times.", hint: "Expelliarmus counts." },
  { id: "shake", prompt: "Shake out your arms and legs for 15 seconds.", hint: "Wiggle the sitting-still away." }
];

const SUBJECTS = {
  math: { id: "math", label: "Math", emoji: "🔢" },
  english: { id: "english", label: "English", emoji: "📚" },
  science: { id: "science", label: "Science", emoji: "🔬" },
  "social-studies": { id: "social-studies", label: "Social Studies", emoji: "🏛️" },
  geography: { id: "geography", label: "Geography", emoji: "🌍" }
};

function subjectsForGrade(grade) {
  if (grade <= 0) return ["math", "english"];
  if (grade <= 2) return ["math", "english", "science"];
  return ["math", "english", "science", "social-studies", "geography"];
}

function Q(id, subject, level, gradeMin, gradeMax, prompt, choices, answer, teach) {
  return { id, subject, level, gradeMin, gradeMax, prompt, choices, answer, teach: teach || "" };
}

const QUESTIONS = [
  // Kindergarten math
  Q("k-math-1-01", "math", 1, 0, 1, "What is 1 + 1?", ["1", "2", "3", "0"], 1, "Two is one and one more."),
  Q("k-math-1-02", "math", 1, 0, 1, "What is 2 + 1?", ["2", "4", "3", "1"], 2, "Start at 2, count one more: 3."),
  Q("k-math-1-03", "math", 1, 0, 1, "Which number is bigger?", ["2", "5", "3", "1"], 1, "5 is the biggest of these."),
  Q("k-math-1-04", "math", 1, 0, 1, "How many sides does a triangle have?", ["2", "3", "4", "5"], 1, "Tri means three."),
  Q("k-math-1-05", "math", 1, 0, 1, "What is 3 − 1?", ["1", "2", "3", "4"], 1, "Take one away from three: two left."),
  Q("k-math-1-06", "math", 1, 0, 1, "A circle looks most like which object?", ["A door", "A book", "A clock face", "A slide"], 2, "A clock face is round like a circle."),
  Q("k-math-1-07", "math", 1, 0, 1, "Count: ★ ★ ★ ★. How many stars?", ["3", "4", "5", "2"], 1, "Four stars."),
  Q("k-math-1-08", "math", 1, 0, 1, "What is 4 + 0?", ["0", "4", "5", "1"], 1, "Adding zero does not change the number."),

  Q("k-math-2-01", "math", 2, 0, 1, "What is 5 + 3?", ["7", "8", "9", "6"], 1, "5…6, 7, 8."),
  Q("k-math-2-02", "math", 2, 0, 1, "What is 10 − 2?", ["8", "12", "7", "9"], 0, "Two less than ten is eight."),
  Q("k-math-2-03", "math", 2, 0, 1, "What is 4 + 4?", ["6", "7", "8", "9"], 2, "A double: 4 and 4 make 8."),
  Q("k-math-2-04", "math", 2, 0, 1, "What is 7 − 3?", ["3", "4", "5", "10"], 1, "Count back three from 7: 6, 5, 4."),
  Q("k-math-2-05", "math", 2, 0, 1, "Which is an even number?", ["3", "5", "8", "9"], 2, "Even numbers can pair up: 8 = 4 + 4."),
  Q("k-math-2-06", "math", 2, 0, 1, "What is 6 + 2?", ["7", "8", "9", "4"], 1, "6 and 2 more is 8."),
  Q("k-math-2-07", "math", 2, 0, 1, "You have 9 apples and eat 4. How many left?", ["4", "5", "6", "13"], 1, "9 − 4 = 5."),
  Q("k-math-2-08", "math", 2, 0, 1, "What number comes after 19?", ["18", "20", "21", "9"], 1, "After 19 comes 20."),

  Q("k-math-3-01", "math", 3, 0, 1, "What is 8 + 7?", ["14", "15", "16", "13"], 1, "8 + 2 = 10, then 5 more is 15."),
  Q("k-math-3-02", "math", 3, 0, 1, "What is 12 − 5?", ["6", "7", "8", "17"], 1, "12 take away 5 is 7."),
  Q("k-math-3-03", "math", 3, 0, 1, "A toy is 10 galleons. You have 6. How many more do you need?", ["3", "4", "5", "16"], 1, "10 − 6 = 4."),
  Q("k-math-3-04", "math", 3, 0, 1, "What is 9 + 6?", ["14", "15", "16", "13"], 1, "9 + 1 = 10, plus 5 is 15."),
  Q("k-math-3-05", "math", 3, 0, 1, "What is 20 − 8?", ["10", "11", "12", "28"], 2, "20 − 8 = 12."),
  Q("k-math-3-06", "math", 3, 0, 1, "Two owls have 5 letters each. How many letters in all?", ["7", "10", "5", "15"], 1, "5 + 5 = 10."),
  Q("k-math-3-07", "math", 3, 0, 1, "What is 11 − 3?", ["7", "8", "9", "14"], 1, "11 − 3 = 8."),
  Q("k-math-3-08", "math", 3, 0, 1, "Which is closest to 10: 3, 8, or 20?", ["3", "8", "20", "100"], 1, "8 is only 2 away from 10."),

  // Kindergarten English
  Q("k-eng-1-01", "english", 1, 0, 1, "Which letter does BALL start with?", ["D", "B", "P", "S"], 1, "Ball starts with B."),
  Q("k-eng-1-02", "english", 1, 0, 1, "Which word rhymes with CAT?", ["Cup", "Hat", "Car", "Ten"], 1, "Cat and hat both end with -at."),
  Q("k-eng-1-03", "english", 1, 0, 1, "APPLE starts with which letter?", ["A", "E", "P", "L"], 0, "Apple starts with A."),
  Q("k-eng-1-04", "english", 1, 0, 1, "How many letters are in the word SUN?", ["2", "3", "4", "5"], 1, "S-U-N has three letters."),
  Q("k-eng-1-05", "english", 1, 0, 1, "Which word is a color?", ["Run", "Blue", "Jump", "Owl"], 1, "Blue is a color word."),
  Q("k-eng-1-06", "english", 1, 0, 1, "Which letter is a vowel?", ["B", "T", "A", "M"], 2, "The vowels are A, E, I, O, U."),
  Q("k-eng-1-07", "english", 1, 0, 1, "Which word names an animal?", ["Chair", "Frog", "Book", "Cup"], 1, "A frog is an animal."),
  Q("k-eng-1-08", "english", 1, 0, 1, "What sound does M make at the start of MOON?", ["sss", "mmm", "ttt", "rrr"], 1, "Moon starts with the mmm sound."),

  Q("k-eng-2-01", "english", 2, 0, 1, "Which is a complete word for a person: the or she?", ["the", "she", "zzz", "q"], 1, "She names a person. The is a helper word."),
  Q("k-eng-2-02", "english", 2, 0, 1, "What is the opposite of BIG?", ["Tall", "Small", "Loud", "Hot"], 1, "Small is the opposite of big."),
  Q("k-eng-2-03", "english", 2, 0, 1, "One cat, two ___?", ["cat", "cats", "cates", "cat's"], 1, "Add s to mean more than one."),
  Q("k-eng-2-04", "english", 2, 0, 1, "Which word means more than one?", ["dog", "dogs", "run", "blue"], 1, "Dogs means more than one dog."),
  Q("k-eng-2-05", "english", 2, 0, 1, "Which sentence is true about a period?", ["It starts a sentence", "It ends a telling sentence", "It is a question", "It is a letter"], 1, "A period . ends a telling sentence."),
  Q("k-eng-2-06", "english", 2, 0, 1, "Which word should start with a capital letter?", ["the name harry", "the word and", "the word is", "the word a"], 0, "Names like Harry start with a capital."),
  Q("k-eng-2-07", "english", 2, 0, 1, "Which pair rhymes?", ["mop / map", "light / night", "pen / pan", "sit / sat"], 1, "Light and night both end with -ight."),
  Q("k-eng-2-08", "english", 2, 0, 1, "A naming word (a person, place, or thing) is called a…", ["verb", "noun", "rhyme", "period"], 1, "Nouns name people, places, and things."),

  Q("k-eng-3-01", "english", 3, 0, 1, "Which is a complete sentence?", ["The owl.", "The owl flies.", "Flies.", "Owl the"], 1, "A sentence needs who + what they do."),
  Q("k-eng-3-02", "english", 3, 0, 1, "Which word is an action word (verb)?", ["hat", "jump", "red", "moon"], 1, "Jump is something you do."),
  Q("k-eng-3-03", "english", 3, 0, 1, "Choose the correct sentence.", ["we like pie.", "We like pie.", "we Like pie", "WE LIKE PIE"], 1, "Sentences start with a capital and end with a period."),
  Q("k-eng-3-04", "english", 3, 0, 1, "Which word best fits: The cat is ___ the mat.", ["on", "sun", "run", "ten"], 0, "On tells where."),
  Q("k-eng-3-05", "english", 3, 0, 1, "What do we use at the end of a question?", ["Period .", "Question mark ?", "Comma ,", "Letter A"], 1, "Questions end with ?"),
  Q("k-eng-3-06", "english", 3, 0, 1, "Which two words are opposites?", ["hot / cold", "cat / hat", "run / ran", "big / pig"], 0, "Hot and cold are opposites."),
  Q("k-eng-3-07", "english", 3, 0, 1, "Find the naming word (noun).", ["quickly", "castle", "happy", "run"], 1, "A castle is a thing."),
  Q("k-eng-3-08", "english", 3, 0, 1, "Which story order is right?", ["End, then start", "First, next, last", "Last only", "Never first"], 1, "Stories go first → next → last."),

  // Grade 4 math
  Q("g4-math-1-01", "math", 1, 4, 5, "What is 7 × 8?", ["54", "56", "63", "48"], 1, "7 × 8 = 56."),
  Q("g4-math-1-02", "math", 1, 4, 5, "What is 36 ÷ 4?", ["8", "9", "7", "12"], 1, "4 × 9 = 36, so 36 ÷ 4 = 9."),
  Q("g4-math-1-03", "math", 1, 4, 5, "What is 125 + 40?", ["155", "165", "145", "175"], 1, "125 + 40 = 165."),
  Q("g4-math-1-04", "math", 1, 4, 5, "In 4,582, the 5 is in which place?", ["Ones", "Tens", "Hundreds", "Thousands"], 2, "4 thousands, 5 hundreds, 8 tens, 2 ones."),
  Q("g4-math-1-05", "math", 1, 4, 5, "What is 9 × 6?", ["54", "56", "45", "63"], 0, "9 × 6 = 54."),
  Q("g4-math-1-06", "math", 1, 4, 5, "What is 100 − 37?", ["63", "73", "67", "53"], 0, "100 − 37 = 63."),
  Q("g4-math-1-07", "math", 1, 4, 5, "Which fraction equals one half?", ["1/3", "2/4", "3/5", "2/5"], 1, "2/4 is the same as 1/2."),
  Q("g4-math-1-08", "math", 1, 4, 5, "Round 47 to the nearest ten.", ["40", "50", "45", "60"], 1, "47 is closer to 50."),

  Q("g4-math-2-01", "math", 2, 4, 5, "What is 1/2 of 12?", ["4", "6", "8", "3"], 1, "Half of 12 is 6."),
  Q("g4-math-2-02", "math", 2, 4, 5, "Which is greater: 3/4 or 1/2?", ["3/4", "1/2", "They are equal", "Cannot tell"], 0, "3/4 is more than 2/4, and 2/4 = 1/2."),
  Q("g4-math-2-03", "math", 2, 4, 5, "What is 15 × 4?", ["45", "50", "60", "64"], 2, "15 × 4 = 60."),
  Q("g4-math-2-04", "math", 2, 4, 5, "What is 144 ÷ 12?", ["11", "12", "13", "10"], 1, "12 × 12 = 144."),
  Q("g4-math-2-05", "math", 2, 4, 5, "A rectangle is 8 cm by 3 cm. What is its perimeter?", ["11 cm", "22 cm", "24 cm", "16 cm"], 1, "Perimeter = 8+3+8+3 = 22 cm."),
  Q("g4-math-2-06", "math", 2, 4, 5, "What is 3/8 + 2/8?", ["5/8", "5/16", "6/8", "1/8"], 0, "Same denominator: add the tops, 3+2=5."),
  Q("g4-math-2-07", "math", 2, 4, 5, "Which number is a multiple of 7?", ["16", "21", "25", "26"], 1, "7 × 3 = 21."),
  Q("g4-math-2-08", "math", 2, 4, 5, "What is 1,000 − 250?", ["650", "750", "850", "1,250"], 1, "1,000 − 250 = 750."),

  Q("g4-math-3-01", "math", 3, 4, 5, "A broom costs 23 knuts. You buy 12. How many knuts in all?", ["230", "246", "276", "35"], 2, "23 × 12 = 276."),
  Q("g4-math-3-02", "math", 3, 4, 5, "What is 5/6 − 1/6?", ["4/6", "4/0", "6/6", "4/12"], 0, "5 − 1 = 4, keep the 6. 4/6 can simplify to 2/3."),
  Q("g4-math-3-03", "math", 3, 4, 5, "47 ÷ 5 is 9 remainder ___?", ["1", "2", "3", "4"], 1, "5 × 9 = 45, leftover 2."),
  Q("g4-math-3-04", "math", 3, 4, 5, "Area of a 9 by 7 rectangle?", ["16", "32", "63", "79"], 2, "Area = length × width = 63."),
  Q("g4-math-3-05", "math", 3, 4, 5, "Which decimal equals 3/10?", ["0.03", "0.3", "3.0", "0.13"], 1, "Tenths place: 0.3."),
  Q("g4-math-3-06", "math", 3, 4, 5, "What is the least common multiple of 4 and 6?", ["8", "10", "12", "24"], 2, "12 is the smallest number in both 4s and 6s."),
  Q("g4-math-3-07", "math", 3, 4, 5, "A pizza is cut into 8 slices. You eat 3. What fraction is left?", ["3/8", "5/8", "8/3", "5/3"], 1, "8 − 3 = 5 slices left → 5/8."),
  Q("g4-math-3-08", "math", 3, 4, 5, "Round 3,761 to the nearest hundred.", ["3,700", "3,800", "4,000", "3,760"], 1, "761 is closer to 800 than 700."),

  // Grade 4 English
  Q("g4-eng-1-01", "english", 1, 4, 5, "Which word is a synonym of happy?", ["Sad", "Glad", "Angry", "Tired"], 1, "Synonyms mean almost the same thing."),
  Q("g4-eng-1-02", "english", 1, 4, 5, "Which word is a noun?", ["quickly", "castle", "ran", "blue"], 1, "A castle is a thing — a noun."),
  Q("g4-eng-1-03", "english", 1, 4, 5, "Choose the correct word: ___ going to the library.", ["Their", "There", "They're", "Theyre"], 2, "They're = they are."),
  Q("g4-eng-1-04", "english", 1, 4, 5, "An adjective describes a…", ["action only", "noun", "period", "question mark"], 1, "Adjectives describe nouns (red apple)."),
  Q("g4-eng-1-05", "english", 1, 4, 5, "Which sentence is a question?", ["Close the book.", "The owl hooted.", "Where is Hedwig?", "What a night."], 2, "Questions often start with where/who/what and end with ?"),
  Q("g4-eng-1-06", "english", 1, 4, 5, "The past tense of go is…", ["goed", "went", "goneed", "goes"], 1, "Go → went."),
  Q("g4-eng-1-07", "english", 1, 4, 5, "Which word is an antonym of ancient?", ["old", "modern", "historic", "dusty"], 1, "Antonyms are opposites."),
  Q("g4-eng-1-08", "english", 1, 4, 5, "A paragraph is mostly a group of sentences about…", ["many random topics", "one main idea", "only dialogue", "only questions"], 1, "One main idea, supporting sentences."),

  Q("g4-eng-2-01", "english", 2, 4, 5, "Which is a compound word?", ["unhappy", "sunflower", "running", "quickly"], 1, "Sun + flower = sunflower."),
  Q("g4-eng-2-02", "english", 2, 4, 5, "Choose the correctly punctuated sentence.", ["Wow that broom is fast", "Wow, that broom is fast!", "Wow that broom is fast.", "wow, that broom is fast"], 1, "Interjections often take a comma and excitement can take !"),
  Q("g4-eng-2-03", "english", 2, 4, 5, "In \"The owl soared,\" soared is a…", ["noun", "verb", "adjective", "preposition"], 1, "Soared is the action."),
  Q("g4-eng-2-04", "english", 2, 4, 5, "Which prefix means not?", ["re-", "un-", "pre-", "over-"], 1, "Unhappy = not happy."),
  Q("g4-eng-2-05", "english", 2, 4, 5, "A simile compares using like or as. Which is a simile?", ["The moon is a lantern.", "The moon is bright.", "The moon is like a lantern.", "Look at the moon."], 2, "Like or as signals a simile."),
  Q("g4-eng-2-06", "english", 2, 4, 5, "Which spelling is correct?", ["recieve", "receive", "receve", "receeve"], 1, "I before E except after C: receive."),
  Q("g4-eng-2-07", "english", 2, 4, 5, "The main idea of a passage is…", ["a tiny detail", "what the text is mostly about", "the last word", "only the title"], 1, "Details support the main idea."),
  Q("g4-eng-2-08", "english", 2, 4, 5, "Which word should be capitalized in the middle of a sentence?", ["tuesday", "school", "happy", "because"], 0, "Days of the week are proper nouns."),

  Q("g4-eng-3-01", "english", 3, 4, 5, "Which sentence uses a possessive correctly?", ["The owls nest is high.", "The owl's nest is high.", "The owls' is nest high.", "The owl nest's is high."], 1, "Owl's = belonging to the owl."),
  Q("g4-eng-3-02", "english", 3, 4, 5, "A metaphor…", ["always uses like or as", "says one thing is another", "is always a question", "has no meaning"], 1, "The classroom was a zoo — that's a metaphor."),
  Q("g4-eng-3-03", "english", 3, 4, 5, "Which is a complex sentence?", ["Harry ran.", "Harry ran and Ron followed.", "When the bell rang, Harry ran.", "Run, Harry!"], 2, "A dependent clause (when…) + independent clause."),
  Q("g4-eng-3-04", "english", 3, 4, 5, "Choose the correct homophone: I can ___ the castle from here.", ["sea", "see", "si", "cee"], 1, "See = look. Sea = ocean."),
  Q("g4-eng-3-05", "english", 3, 4, 5, "An author's purpose to persuade means they want you to…", ["laugh only", "learn a fact only", "agree or take action", "fall asleep"], 2, "Persuade = change your mind or get you to do something."),
  Q("g4-eng-3-06", "english", 3, 4, 5, "Which word is an adverb?", ["soft", "softly", "softness", "soften"], 1, "Many adverbs end in -ly and describe verbs."),
  Q("g4-eng-3-07", "english", 3, 4, 5, "A topic sentence usually…", ["hides the idea", "states the paragraph's main idea", "is always last", "has no period"], 1, "It tells what the paragraph will be about."),
  Q("g4-eng-3-08", "english", 3, 4, 5, "Which revision is clearest?", ["He went because of the reason that it was late.", "He went because it was late.", "He went it was late because.", "Because late he went it."], 1, "Cut extra words. Be direct."),

  // Grade 4 science
  Q("g4-sci-1-01", "science", 1, 4, 5, "Plants need sunlight mostly to…", ["sleep", "make food", "walk", "catch fire"], 1, "Photosynthesis uses light to make food."),
  Q("g4-sci-1-02", "science", 1, 4, 5, "Ice melting into water is a change of…", ["color", "state", "planet", "magnet"], 1, "Solid ice → liquid water."),
  Q("g4-sci-1-03", "science", 1, 4, 5, "A magnet is most likely to stick to…", ["wood", "paper", "iron", "plastic"], 2, "Many magnets attract iron (and steel)."),
  Q("g4-sci-1-04", "science", 1, 4, 5, "Which is a living thing?", ["rock", "mushroom", "cloud", "glass"], 1, "Fungi like mushrooms are living."),
  Q("g4-sci-1-05", "science", 1, 4, 5, "The Sun is a…", ["planet", "star", "moon", "comet"], 1, "Stars make their own light. The Sun is our star."),
  Q("g4-sci-1-06", "science", 1, 4, 5, "We see lightning before thunder because…", ["light is faster than sound", "sound is faster than light", "they start at different times always", "clouds block sound only"], 0, "Light races ahead of sound."),
  Q("g4-sci-1-07", "science", 1, 4, 5, "Bones in your body make up the…", ["digestive system", "skeletal system", "weather", "atmosphere"], 1, "The skeleton supports and protects."),
  Q("g4-sci-1-08", "science", 1, 4, 5, "A food chain starts with…", ["a carnivore", "a producer (usually a plant)", "a mushroom only", "the Moon"], 1, "Producers make energy others can eat."),

  Q("g4-sci-2-01", "science", 2, 4, 5, "Water evaporating from a puddle becomes…", ["ice", "water vapor", "soil", "metal"], 1, "Liquid → gas is evaporation."),
  Q("g4-sci-2-02", "science", 2, 4, 5, "Friction usually…", ["speeds things up forever", "slows sliding objects", "creates new planets", "stops gravity"], 1, "Rubbing surfaces resist motion."),
  Q("g4-sci-2-03", "science", 2, 4, 5, "Herbivores eat…", ["only meat", "mostly plants", "only rocks", "only metal"], 1, "Deer and rabbits are herbivores."),
  Q("g4-sci-2-04", "science", 2, 4, 5, "Earth orbits the Sun once each…", ["day", "month", "year", "hour"], 2, "One trip around the Sun ≈ one year."),
  Q("g4-sci-2-05", "science", 2, 4, 5, "Which energy comes from moving water?", ["solar only", "hydroelectric", "chemical only in candy", "sound only"], 1, "Hydro = water turning turbines."),
  Q("g4-sci-2-06", "science", 2, 4, 5, "A hypothesis is…", ["a wild guess you never test", "a testable idea", "always a law", "a dinosaur"], 1, "Scientists test hypotheses with evidence."),
  Q("g4-sci-2-07", "science", 2, 4, 5, "Your lungs's main job is to…", ["digest pizza", "exchange gases (oxygen/carbon dioxide)", "pump only blood", "make bones"], 1, "Breathing brings O₂ in and CO₂ out."),
  Q("g4-sci-2-08", "science", 2, 4, 5, "Metamorphosis in a butterfly includes…", ["egg, larva, pupa, adult", "only adult", "rock, water, air", "seed and trunk"], 0, "Caterpillar = larva, chrysalis = pupa."),

  Q("g4-sci-3-01", "science", 3, 4, 5, "Why do we have seasons?", ["Earth is closer in summer only everywhere", "Earth's axis is tilted as it orbits the Sun", "The Moon blocks the Sun monthly", "Clouds store winter"], 1, "Tilt changes how directly sunlight hits a hemisphere."),
  Q("g4-sci-3-02", "science", 3, 4, 5, "Inherited traits are…", ["only learned at school", "passed from parents (like eye color)", "always scars", "the weather"], 1, "Genes carry inherited traits."),
  Q("g4-sci-3-03", "science", 3, 4, 5, "Sound travels fastest through…", ["outer space vacuum", "air", "steel (a solid)", "a perfect vacuum on Earth"], 2, "Particles in solids are packed, so vibrations pass quickly."),
  Q("g4-sci-3-04", "science", 3, 4, 5, "A closed circuit…", ["has a gap so no current flows", "is a complete path for electricity", "is always dangerous rain", "is a food web"], 1, "A complete loop lets current flow to a bulb."),
  Q("g4-sci-3-05", "science", 3, 4, 5, "Erosion is…", ["building new mountains instantly", "wearing away rock and soil, often by water or wind", "a type of magnet", "only lightning"], 1, "Moving water and wind can carry bits of Earth away."),
  Q("g4-sci-3-06", "science", 3, 4, 5, "Which is a renewable energy source?", ["coal", "oil", "wind", "natural gas"], 2, "Wind keeps blowing; fossil fuels do not refill on a human timescale."),
  Q("g4-sci-3-07", "science", 3, 4, 5, "The smallest unit of life that we usually study in grade school is the…", ["organ", "cell", "ecosystem", "biome"], 1, "Cells make up tissues and organs."),
  Q("g4-sci-3-08", "science", 3, 4, 5, "If you push a box with the same force on ice vs. carpet, it usually moves farther on ice because…", ["ice has more friction", "ice has less friction", "gravity turns off", "the box loses mass"], 1, "Less friction → less force fighting the push."),

  // Grade 4 social studies
  Q("g4-ss-1-01", "social-studies", 1, 4, 5, "A community is a group of people who…", ["never share anything", "live or work together and help each other", "only live on the Moon", "avoid maps"], 1, "Towns, schools, and neighborhoods are communities."),
  Q("g4-ss-1-02", "social-studies", 1, 4, 5, "Rules and laws exist mainly to…", ["make life boring", "keep people safer and fairer", "hide maps", "stop learning"], 1, "They help people live together."),
  Q("g4-ss-1-03", "social-studies", 1, 4, 5, "A map legend (key) shows…", ["only the date", "what symbols mean", "the author's name only", "weather tomorrow"], 1, "The key unlocks the symbols."),
  Q("g4-ss-1-04", "social-studies", 1, 4, 5, "Goods are…", ["things people make or grow to use or sell", "only feelings", "only laws", "only rivers"], 0, "A pencil is a good; a haircut is a service."),
  Q("g4-ss-1-05", "social-studies", 1, 4, 5, "The President of the United States belongs mainly to which branch?", ["Legislative", "Executive", "Judicial", "Map"], 1, "The executive branch carries out laws."),
  Q("g4-ss-1-06", "social-studies", 1, 4, 5, "Native peoples lived in North America…", ["only after 1900", "long before European colonists arrived", "only in one city", "never"], 1, "Indigenous nations have deep histories here."),
  Q("g4-ss-1-07", "social-studies", 1, 4, 5, "A citizen can help their community by…", ["littering", "voting when old enough and being kind now", "breaking rules for fun", "ignoring neighbors"], 1, "Help looks like respect, volunteering, and later voting."),
  Q("g4-ss-1-08", "social-studies", 1, 4, 5, "History is the study of…", ["only dinosaurs", "people and events of the past", "only weather", "only multiplication"], 1, "We use sources like letters, photos, and artifacts."),

  Q("g4-ss-2-01", "social-studies", 2, 4, 5, "The U.S. Constitution is…", ["a grocery list", "the highest law that organizes the government", "a novel", "a map of Europe"], 1, "It sets up the branches and many rights."),
  Q("g4-ss-2-02", "social-studies", 2, 4, 5, "Congress is part of which branch?", ["Executive", "Legislative", "Judicial", "Weather"], 1, "Legislative = makes laws. Congress = Senate + House."),
  Q("g4-ss-2-03", "social-studies", 2, 4, 5, "A primary source is…", ["a textbook summary from last year", "something from the time being studied (a diary, photo)", "always a movie", "a rumor"], 1, "It comes from people who were there."),
  Q("g4-ss-2-04", "social-studies", 2, 4, 5, "Immigrants are people who…", ["never move", "move to a new country to live", "only study math", "draw maps"], 1, "The U.S. has many immigrant stories."),
  Q("g4-ss-2-05", "social-studies", 2, 4, 5, "Supply and demand: if lots of people want a toy and few exist, the price often…", ["falls to zero", "rises", "turns into a law", "stops existing"], 1, "High demand + low supply can raise price."),
  Q("g4-ss-2-06", "social-studies", 2, 4, 5, "The Bill of Rights protects…", ["only kings", "freedoms like speech and religion (for people in the U.S.)", "only maps", "homework answers"], 1, "The first ten amendments list many protections."),
  Q("g4-ss-2-07", "social-studies", 2, 4, 5, "A region is…", ["always one house", "an area that shares features (climate, culture, land)", "a single person", "a magnet"], 1, "The Southwest is a U.S. region."),
  Q("g4-ss-2-08", "social-studies", 2, 4, 5, "Courts belong mainly to the…", ["executive branch", "legislative branch", "judicial branch", "post office"], 2, "Judicial = judges interpret laws."),

  Q("g4-ss-3-01", "social-studies", 3, 4, 5, "Checks and balances means…", ["one branch can grow without limit", "branches can limit each other's power", "only the President makes every law", "maps check rivers"], 1, "No single branch is supposed to hold all power."),
  Q("g4-ss-3-02", "social-studies", 3, 4, 5, "Culture includes…", ["only money", "language, food, art, beliefs, and traditions", "only weather", "only borders"], 1, "Culture is how groups live and share meaning."),
  Q("g4-ss-3-03", "social-studies", 3, 4, 5, "A timeline helps you…", ["cook dinner", "put events in order", "multiply fractions", "find magnets"], 1, "Order in time = chronology."),
  Q("g4-ss-3-04", "social-studies", 3, 4, 5, "Local government often takes care of…", ["declaring war", "schools, libraries, trash, and parks", "printing all money", "running the whole world"], 1, "Cities and counties handle nearby services."),
  Q("g4-ss-3-05", "social-studies", 3, 4, 5, "Scarcity means…", ["unlimited everything", "not enough of something for all wants", "a type of mountain", "a holiday"], 1, "People choose because resources are limited."),
  Q("g4-ss-3-06", "social-studies", 3, 4, 5, "The three branches of U.S. government are…", ["king, queen, prince", "legislative, executive, judicial", "land, air, sea", "north, south, east"], 1, "Make laws, carry out laws, interpret laws."),
  Q("g4-ss-3-07", "social-studies", 3, 4, 5, "Why do people trade?", ["To have fewer goods always", "Because different places have different resources and skills", "Maps forbid making things", "Only for fun never need"], 1, "Trade lets communities get what they cannot easily make."),
  Q("g4-ss-3-08", "social-studies", 3, 4, 5, "A constitution is different from a regular law because it…", ["is shorter always", "is the framework other laws must fit", "cannot be studied", "is only about sports"], 1, "Ordinary laws have to follow the Constitution."),

  // Grade 4 geography — informational
  Q("g4-geo-1-01", "geography", 1, 4, 5, "How many continents are usually taught in U.S. schools?", ["5", "6", "7", "8"], 2, "Africa, Antarctica, Asia, Australia, Europe, North America, South America."),
  Q("g4-geo-1-02", "geography", 1, 4, 5, "The largest ocean on Earth is the…", ["Atlantic", "Indian", "Arctic", "Pacific"], 3, "The Pacific covers more area than all land combined."),
  Q("g4-geo-1-03", "geography", 1, 4, 5, "The equator is…", ["a mountain in Asia", "an imaginary line around Earth's middle", "a river in Egypt", "the North Pole"], 1, "It splits Earth into Northern and Southern Hemispheres."),
  Q("g4-geo-1-04", "geography", 1, 4, 5, "A compass rose on a map shows…", ["population", "directions (N, S, E, W)", "temperature only", "who drew the map only"], 1, "North is usually toward the top of many maps."),
  Q("g4-geo-1-05", "geography", 1, 4, 5, "Which continent is also a country?", ["Europe", "Australia", "Africa", "Asia"], 1, "Australia is both a continent and a nation (plus nearby islands)."),
  Q("g4-geo-1-06", "geography", 1, 4, 5, "The capital of the United States is…", ["New York City", "Washington, D.C.", "Los Angeles", "Boston"], 1, "Washington, D.C. is the capital — not a state."),
  Q("g4-geo-1-07", "geography", 1, 4, 5, "A peninsula is land that…", ["is completely underwater", "is almost surrounded by water", "never touches water", "floats"], 1, "Florida is a well-known peninsula."),
  Q("g4-geo-1-08", "geography", 1, 4, 5, "Which is a continent in the Southern Hemisphere (mostly)?", ["Europe", "Antarctica", "Greenland", "Alaska"], 1, "Antarctica sits over the South Pole."),

  Q("g4-geo-2-01", "geography", 2, 4, 5, "Latitude lines run…", ["north–south and measure east–west", "east–west and measure distance from the equator", "only on the Moon", "in circles around cities only"], 1, "Latitude 0° is the equator. Higher numbers = closer to the poles."),
  Q("g4-geo-2-02", "geography", 2, 4, 5, "The Nile River is famous for flowing through…", ["Canada", "Egypt (and other African countries)", "Japan", "Brazil only"], 1, "It has long been a lifeline for people in Northeast Africa."),
  Q("g4-geo-2-03", "geography", 2, 4, 5, "The Andes are a mountain range in…", ["Australia", "South America", "Europe only", "Antarctica's cities"], 1, "They run along the west side of South America."),
  Q("g4-geo-2-04", "geography", 2, 4, 5, "A delta forms when a river…", ["dries instantly", "drops sediment as it enters a slower body of water", "climbs a mountain", "freezes the ocean"], 1, "The Nile Delta is a classic example."),
  Q("g4-geo-2-05", "geography", 2, 4, 5, "The Prime Meridian is at…", ["90° latitude", "0° longitude, through Greenwich, England", "the equator", "the South Pole only"], 1, "Longitude measures east or west of this line."),
  Q("g4-geo-2-06", "geography", 2, 4, 5, "The Sahara is…", ["a huge desert in Africa", "a forest in Canada", "an ocean current", "a U.S. state"], 0, "It is one of the world's largest hot deserts."),
  Q("g4-geo-2-07", "geography", 2, 4, 5, "An archipelago is…", ["one lake", "a group of islands", "a type of desert wind", "a capital city"], 1, "Japan and the Philippines are archipelagos."),
  Q("g4-geo-2-08", "geography", 2, 4, 5, "Climate is different from weather because climate is…", ["today's rain only", "the usual pattern over many years", "always snow", "a map symbol"], 1, "Weather = now. Climate = the long-run pattern."),

  Q("g4-geo-3-01", "geography", 3, 4, 5, "Why are rainforests often near the equator?", ["It is always night there", "Warm air rises, cools, and drops lots of rain", "There is no Sun", "Oceans cannot evaporate"], 1, "Tropical heat fuels heavy rainfall and lush forests — like the Amazon."),
  Q("g4-geo-3-02", "geography", 3, 4, 5, "The Ring of Fire is a zone of…", ["quiet lakes", "volcanoes and earthquakes around the Pacific", "only deserts", "the Arctic ice only"], 1, "Tectonic plates grind there, so the ground is restless."),
  Q("g4-geo-3-03", "geography", 3, 4, 5, "A rain shadow is…", ["a cloud shaped like a cat", "a dry area on the side of mountains away from incoming moist wind", "always on beaches", "a kind of river"], 1, "Mountains wring out rain; the far side stays drier."),
  Q("g4-geo-3-04", "geography", 3, 4, 5, "The Amazon River is in…", ["Africa", "South America", "Europe", "Australia"], 1, "It carries an enormous amount of water through the Amazon rainforest."),
  Q("g4-geo-3-05", "geography", 3, 4, 5, "Human-made borders are different from physical borders because they…", ["are always rivers", "are agreed by people (even if they ignore a mountain)", "cannot appear on maps", "never change"], 1, "A river can be a physical border; a straight line in the desert is often political."),
  Q("g4-geo-3-06", "geography", 3, 4, 5, "Which statement about hemispheres is true?", ["The U.S. is entirely in the Southern Hemisphere", "Most of Africa sits on both sides of the equator", "Antarctica is in the Northern Hemisphere", "Asia has no coast"], 1, "The equator crosses Africa, so it has land in both hemispheres."),
  Q("g4-geo-3-07", "geography", 3, 4, 5, "Population density is high when…", ["few people live on lots of land", "many people live in a small area", "nobody lives there", "only animals live there"], 1, "Cities have high density; deserts often have low density."),
  Q("g4-geo-3-08", "geography", 3, 4, 5, "The Himalayas formed mainly because…", ["wind piled up sand", "two tectonic plates collided and crumpled the crust", "a river froze", "people built them"], 1, "India's plate crashing into Asia shoved the land upward — including Mount Everest.")
];
