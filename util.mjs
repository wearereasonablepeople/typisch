export const compose = f => g => x => f (g (x));

export const flatMap = f => xs => {
  let ys = [];
  xs.forEach (x => {
    ys = ys.concat (f (x));
  });
  return ys;
};

export const zip = a => b => a.map ((v, i) => [v, b[i]]);

export const sortByName = (a, b) => (
  a.names[a.names.length - 1].localeCompare (b.names[b.names.length - 1])
);

const wrapMeta = a => ({
  types: a.sort (sortByName),
});

export const getOperationalMeta = kind => left => right => (
  left.kind === kind && right.kind === kind ?
  wrapMeta ([...left.meta.types, ...right.meta.types]) :
  left.kind === kind ?
  wrapMeta ([...left.meta.types, right]) :
  right.kind === kind ?
  wrapMeta ([...right.meta.types, left]) :
  wrapMeta ([left, right])
);

export const differenceOrUnion = ({kind}) => (
  kind === 'difference' || kind === 'union'
);

export const getDifferenceMeta = left => right => (
  differenceOrUnion (left) && differenceOrUnion (right) ?
  wrapMeta ([...left.meta.types, ...right.meta.types]) :
  differenceOrUnion (left) ?
  wrapMeta ([...left.meta.types, right]) :
  differenceOrUnion (right) ?
  wrapMeta ([...right.meta.types, left]) :
  wrapMeta ([left, right])
);

export const getOperationalSubsets = kind => left => right => (
  left.kind === kind && right.kind === kind ?
  [...left.subsets, ...right.subsets] :
  left.kind === kind ?
  [...left.subsets, right] :
  right.kind === kind ?
  [...right.subsets, left] :
  [left, right]
);

export const getOperationalNames = operator => types => [
  `(${types.map (t => t.names[0]).join (` ${operator} `)})`,
];

export const getIntersectionSupersets = type => (
  type.kind === 'intersection' ?
  flatMap (getIntersectionSupersets) (type.supersets) :
  type.supersets
);
