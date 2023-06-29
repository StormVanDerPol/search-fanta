import fs from "node:fs";
import path from "node:path";

function sanitize(word) {
  return word
    .trim()
    .toLowerCase()
    .replace("the ", "")
    .replace(/\[.*?\]/g, "")
    .replace(/\W/g, "");
}

const docs = fs
  .readFileSync(path.resolve(process.cwd(), "sample.txt"))
  .toString()
  .split("\n")
  .map(sanitize);

function nGram(n, str) {
  const nGrams = [];
  for (let i = 0; i < str.length; i++) {
    const slice = str.slice(i, i + n).padEnd(n, "_");
    nGrams.push(slice);
  }
  return nGrams;
}

const triGram = (str) => nGram(3, str);

const gramsByDocument = docs.map((doc) => triGram(doc));
const vocabulary = Array.from(new Set(gramsByDocument.flat()));
const vectors = new Map();
let max = 0;
const min = 0; // can be incorrect but it's always going to be the case in my case

const normalize = (n, min, max) => (n - min) / (max - min);

for (let i = 0; i < gramsByDocument.length; i++) {
  const grams = gramsByDocument[i];
  const key = docs[i];
  const vec = new Array(vocabulary.length).fill(0);

  grams.forEach((gram) => {
    const gramIndex = vocabulary.indexOf(gram);
    const rawValue = ++vec[gramIndex];

    max = Math.max(max, rawValue);
  });

  vectors.set(key, vec);
}

// normalize
for (const [key, vector] of vectors) {
  vectors.set(
    key,
    vector.map((n) => normalize(n, min, max))
  );
}

function dotProduct(x, y) {
  function dotpSum(a, b) {
    return a + b;
  }
  function dotpTimes(a, i) {
    return x[i] * y[i];
  }
  return x.map(dotpTimes).reduce(dotpSum, 0);
}

function cosineSimilarity(A, B) {
  return (
    dotProduct(A, B) /
    (Math.sqrt(dotProduct(A, A)) * Math.sqrt(dotProduct(B, B)))
  );
}

const compare = (str, threshold = 0.3) => {
  const grams = triGram(sanitize(str));
  const vec = new Array(vocabulary.length).fill(0);

  grams.forEach((gram) => {
    const gramIndex = vocabulary.indexOf(gram);
    if (gramIndex > -1) ++vec[gramIndex];
  });

  const similar = [];

  for (const [key, tVec] of vectors) {
    const similarity = cosineSimilarity(vec, tVec);
    if (similarity > threshold) similar.push([key, similarity]);
  }

  return similar.sort(([, a], [, b]) => b - a);
};

export { vectors, vocabulary, compare };
