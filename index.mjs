const flatMap = (f) => (xs) => {
  let ys = [];
  xs.forEach(x => {
    ys = ys.concat(f(x));
  });
  return ys;
};

//           Any :: Type
export const Any = {
  kind: 'any',
  names: ['Any'],
  docs: ['https://github.com/wearereasonablepeople/typisch#any'],
  subsets: [],
  supersets: [],
  has: _ => true,
  equals: ({kind}) => kind === 'any',
};

//           intersection :: Type -> Type -> Type
export const intersection = (left) => (right) => ({
  kind: 'intersection',
  meta: {left, right},
  names: [`(${left.names[0]} ∩ ${right.names[0]})`],
  docs: [
    'https://github.com/wearereasonablepeople/typisch#intersection',
    left.docs[0],
    right.docs[0],
  ],
  subsets: [],
  supersets: [left, right],
  has: (member) => left.has(member) && right.has(member),
  equals: ({kind, meta}) => (
    kind === 'intersection' &&
    meta.left.equals(left) &&
    meta.right.equals(right)
  ),
});

//           difference :: Type -> Type -> Type
export const difference = (left) => (right) => ({
  kind: 'difference',
  meta: {left, right},
  names: [`(${left.names[0]} ⊖ ${right.names[0]})`],
  docs: [
    'https://github.com/wearereasonablepeople/typisch#difference',
    left.docs[0],
    right.docs[0],
  ],
  subsets: [],
  supersets: [left, right],
  has: (member) => left.has(member) !== right.has(member),
  equals: ({kind, meta}) => (
    kind === 'difference' &&
    meta.left.equals(left) &&
    meta.right.equals(right)
  ),
});

//           without :: Type -> Type -> Type
export const without = (left) => (right) => ({
  kind: 'without',
  meta: {left, right},
  names: [`(${right.names[0]} \\ ${left.names[0]})`],
  docs: [
    'https://github.com/wearereasonablepeople/typisch#without',
    left.docs[0],
    right.docs[0],
  ],
  subsets: [],
  supersets: [right],
  has: (member) => !left.has(member) && right.has(member),
  equals: ({kind, meta}) => (
    kind === 'without' &&
    meta.left.equals(left) &&
    meta.right.equals(right)
  ),
});

//           union :: Type -> Type -> Type
export const union = (left) => (right) => ({
  kind: 'union',
  meta: {left, right},
  names: [`(${left.names[0]} ∪ ${right.names[0]})`],
  docs: [
    'https://github.com/wearereasonablepeople/typisch#union',
    left.docs[0],
    right.docs[0],
  ],
  subsets: [left, right],
  supersets: [],
  has: (member) => left.has(member) || right.has(member),
  equals: ({kind, meta}) => (
    kind === 'union' &&
    meta.left.equals(left) &&
    meta.right.equals(right)
  ),
});

//           suchthat :: (a -> Boolean) -> Type -> Type
export const suchthat = (pred) => (parent) => ({
  kind: 'suchthat',
  meta: {pred, parent},
  names: [`(${parent.names[0]} | ${pred.toString()})`],
  docs: [
    'https://github.com/wearereasonablepeople/typisch#suchthat',
    parent.docs[0],
  ],
  subsets: [],
  supersets: [parent],
  has: (member) => parent.has(member) && pred(member),
  equals: ({kind, meta}) => (
    kind === 'suchthat' &&
    meta.pred === pred &&
    meta.parent.equals(parent)
  ),
});

//           alias :: String -> Type -> Type
export const alias = (name) => (parent) => ({
  kind: parent.kind,
  meta: parent.meta,
  names: [name].concat(parent.names),
  docs: parent.docs,
  subsets: parent.subsets,
  supersets: parent.supersets,
  has: parent.has,
  equals: parent.equals,
});

//           alias :: Type -> Type
export const unalias = (type) => type.names.length === 1 ? type : ({
  kind: parent.kind,
  meta: parent.meta,
  names: type.names.slice(1),
  docs: parent.docs,
  subsets: parent.subsets,
  supersets: parent.supersets,
  has: parent.has,
  equals: parent.equals,
});

//           doc :: Array String -> Type -> Type
export const doc = (docs) => (type) => ({
  kind: parent.kind,
  meta: parent.meta,
  names: parent.names,
  docs: docs,
  subsets: parent.subsets,
  supersets: parent.supersets,
  has: parent.has,
  equals: parent.equals,
});

//           unary :: Type -> (t a -> [a]) -> Type -> Type
export const unary = (outer) => (extractor) => (inner) => ({
  kind: 'unary',
  meta: {outer, extractor, inner},
  names: [`(${outer.names[0]} ${inner.names[0]})`],
  docs: [
    'https://github.com/wearereasonablepeople/typisch#unary',
    outer.docs[0],
    inner.docs[0],
  ],
  subsets: (
    flatMap
      (osub => (
        (osub === outer ? [] : [inner])
        .concat(inner.subsets)
        .map(unary(osub)(extractor))
      ))
      ([outer].concat(outer.subsets))
  ),
  supersets: [outer].concat(inner.supersets.map(unary(outer)(extractor))),
  has: (member) => outer.has(member) && extractor(member).every(inner.has),
  equals: ({kind, meta}) => (
    kind === 'unary' &&
    meta.extractor === extractor &&
    meta.outer.equals(outer) &&
    meta.inner.equals(inner)
  ),
});

//           supersedes :: Type -> Type -> Boolean
export const supersedes = (sup) => (sub) => (
  sup.equals(sub) ||
  sup.subsets.some(subset => supersedes(subset)(sub)) ||
  sub.supersets.some(superset => supersedes(sup)(superset))
);

//           composeType :: String -> Type -> Array (Type -> Type) -> Type
export const composeType = (name) => (base) => (fns) => (
  alias(name)(fns.reduce((type, fn) => fn(type), base))
);
