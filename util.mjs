export const flatMap = (f) => (xs) => {
  let ys = [];
  xs.forEach(x => {
    ys = ys.concat(f(x));
  });
  return ys;
};

export const sortByName = (a, b) => {
  return a.names[a.names.length-1].localeCompare(b.names[b.names.length-1]);
}

export const zip = a => b => a.map((v, i) => [v, b[i]]);

const wrapMeta = a => ({ types: a.sort(sortByName) });

export const getOperationalMeta = (kind) => (left) => (right) => {
  return (left.kind === kind)
  ? (right.kind === kind)
    ? wrapMeta([...left.meta.types, ...right.meta.types])
    : wrapMeta([...left.meta.types, right])
  : (right.kind === kind)
    ? (left.kind === kind)
      ? wrapMeta([...left.meta.types, ...right.meta.types])
      : wrapMeta([...right.meta.types, left])
    : wrapMeta([left, right])
}

export const getDifferenceMeta = (left) => (right) => {
  return (left.kind === 'difference' || left.kind === 'union')
    ? (right.kind === 'difference' || right.kind === 'union')
      ? wrapMeta([...left.meta.types, ...right.meta.types])
      : wrapMeta([...left.meta.types, right])
    : (right.kind === 'difference' || right.kind === 'union')
      ? wrapMeta([...right.meta.types, left])
      : wrapMeta([left, right])
};

export const getOperationalSubsets = (kind) => (left) => (right) => {
  return (left.kind === kind)
    ? (right.kind === kind)
      ? [...left.subsets, ...right.subsets]
      : [...left.subsets, right]
    : (right.kind === kind)
      ? (left.kind === kind)
        ? [...left.subsets, ...right.subsets]
        : [...right.subsets, left]
      : [left, right];
};

export const getOperationalNames = (kindSymbol) => (types) => [
  `(${types.map(t => t.names[0]).join(` ${kindSymbol} `)})`
];

export const getIntersectionSupersets = (type) => {
  if (type.kind === 'intersection') {
    return flatMap (getIntersectionSupersets) (type.supersets);
  }
  return type.supersets;
};

export const compose = (f) => (g) => (x) => f(g(x))