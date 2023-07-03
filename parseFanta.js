function nGram(n, doc) {
  const str = `__${doc}`;

  const nGrams = [];
  for (let i = 0; i < str.length; i++) {
    const slice = str.slice(i, i + n).padEnd(n, '_');
    nGrams.push(slice);
  }
  return nGrams;
}

const triGram = (str) => nGram(3, str);

const wordGram = (doc) => {
  return doc.split(' ').filter((w) => w && w !== ' ');
};

const normalize = (n, min, max) => (n - min) / (max - min);

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
  return dotProduct(A, B) / (Math.sqrt(dotProduct(A, A)) * Math.sqrt(dotProduct(B, B)));
}

function FuzzySearcher(...intialDocuments) {
  this.documents = [...intialDocuments];
  this.gramsByDocument = null;
  this.vocabulary = null;
  this.vocabularyIndex = null;
  this.vectors = new Map();
  this.min = 0; // can be incorrect but it's always going to be the case in this case
  this.max = 0;

  this.strToGrams = triGram;

  this.bagOfWords = () => {
    // build grams for each document
    // build vocabulary from unique grams
    // index vocabulary for easy access
    // build vectors by counting how many times a specific gram appears in a document
    // result: massive 3k long vectors, not great

    this.gramsByDocument = this.documents.map((d) => this.strToGrams(d));
    this.vocabulary = Array.from(new Set(this.gramsByDocument.flat()));
    this.vocabularyIndex = new Map(this.vocabulary.map((v, i) => [v, i]));

    for (let i = 0; i < this.gramsByDocument.length; i++) {
      const grams = this.gramsByDocument[i];
      const key = this.documents[i];
      const vector = new Array(this.vocabulary.length).fill(0);

      grams.forEach((gram) => {
        const gramIndex = this.vocabularyIndex.get(gram);
        const rawValue = ++vector[gramIndex];
        this.max = Math.max(this.max, rawValue);
      });

      this.vectors.set(key, vector);
    }
  };

  this.parseDocuments = () => {
    this.bagOfWords();

    // normalize
    for (const [key, vector] of this.vectors) {
      this.vectors.set(
        key,
        vector.map((n) => normalize(n, this.min, this.max)),
      );
    }
  };

  this.addDocs = (...documents) => {
    this.documents.push(...documents);
    this.parseDocuments();
  };

  this.compare = (search, threshold = 0) => {
    const seachGrams = this.strToGrams(search);
    const searchVector = new Array(this.vocabulary.length).fill(0);

    seachGrams.forEach((gram) => {
      const gramIndex = this.vocabularyIndex.get(gram);
      if (gramIndex) ++searchVector[gramIndex];
    });

    const similar = [];

    for (const [key, targetVector] of this.vectors) {
      const similarity = cosineSimilarity(searchVector, targetVector);
      if (similarity > threshold) similar.push([key, similarity]);
    }

    return similar.sort(([, a], [, b]) => b - a);
  };

  this.parseDocuments();
}

export { FuzzySearcher };
