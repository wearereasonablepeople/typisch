import {
  flatMap,
  zip,
  compose,
  getOperationalMeta,
  getDifferenceMeta,
  getOperationalSubsets,
  getOperationalNames,
  getIntersectionSupersets,
} from './util.mjs';

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

//           predicate :: (a -> Boolean) -> Type
export const predicate = (pred) => ({
  kind: 'predicate',
  names: [`Predicate (${pred.toString()})`],
  docs: ['https://github.com/wearereasonablepeople/typisch#predicate'],
  subsets: [],
  supersets: [],
  has: pred,
  equals: ({kind, has}) =>
    kind === 'predicate' &&
    pred === has,
});

//           intersection :: Type -> Type -> Type
export const intersection = (left) => (right) => {
  const meta = getOperationalMeta ('intersection') (left) (right);
  return ({
    kind: 'intersection',
    meta,
    names: getOperationalNames ('∩') (meta.types),
    docs: [
      'https://github.com/wearereasonablepeople/typisch#intersection',
      left.docs[0],
      right.docs[0],
    ],
    subsets: [],
    supersets: [...getIntersectionSupersets(left), ...getIntersectionSupersets(right)],
    has: (member) => meta.types.every(t => t.has(member)),
    equals: ({kind, meta: ometa}) => (
      kind === 'intersection' &&
      ometa.types.length === meta.types.length &&
      zip(ometa.types)(meta.types).every(([a, b]) => a.equals(b))
    ),
  });
}

//           difference :: Type -> Type -> Type
export const difference = (left) => (right) => {
  const meta = getDifferenceMeta (left) (right);
  return ({
    kind: 'difference',
    meta,
    names: getOperationalNames ('⊖') (meta.types),
    docs: [
      'https://github.com/wearereasonablepeople/typisch#difference',
      left.docs[0],
      right.docs[0],
    ],
    subsets: [],
    supersets: [left, right],
    has: (member) => meta.types.every(t => !t.has(member)),
    equals: ({kind, meta: ometa}) => (
      kind === 'difference' &&
      ometa.types.length === ometa.types.length,
      zip(meta.types)(ometa.types).map(([a, b]) => a.equals(b))
    ),
  });
}

//           without :: Type -> Type -> Type
export const without = (left) => (right) => {
  // Law: A \ (B \ C) == A \ (B ∪ C)
  // Rewrite as a union, so law is preserved
  if (right.kind === 'without') {
    return without (left) (union (right.meta.left) (right.meta.right));
  }

  return ({
    kind: 'without',
    meta: {left, right},
    names: [`(${left.names[0]} \\ ${right.names[0]})`],
    docs: [
      'https://github.com/wearereasonablepeople/typisch#without',
      left.docs[0],
      right.docs[0],
    ],
    subsets: [],
    supersets: [left],
    has: (member) => left.has(member) && !right.has(member),
    equals: ({kind, meta}) => (
      kind === 'without' &&
      meta.left.equals(left) &&
      meta.right.equals(right)
    ),
  })
};

//           union :: Type -> Type -> Type
export const union = (left) => (right) => {
  const meta = getOperationalMeta ('union') (left) (right);
  const subsets = getOperationalSubsets ('union') (left) (right);

  return ({
    kind: 'union',
    meta,
    names: getOperationalNames ('∪') (meta.types),
    docs: [
      'https://github.com/wearereasonablepeople/typisch#union',
      left.docs[0],
      right.docs[0],
    ],
    subsets,
    supersets: [],
    has: (member) => left.has(member) || right.has(member),
    equals: ({kind, meta: ometa}) => (
      kind === 'union' &&
      ometa.types.length === meta.types.length &&
      zip(ometa.types)(meta.types).every(([a, b]) => a.equals(b))
    ),
  });
}

//           suchthat :: (a -> Boolean) -> Type -> Type
export const suchthat = compose (intersection) (predicate)

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
  kind: type.kind,
  meta: type.meta,
  names: type.names,
  docs: docs,
  subsets: type.subsets,
  supersets: type.supersets,
  has: type.has,
  equals: type.equals,
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
export const supersedes = (a) => (b) => (
  a.equals(b) ||
  a.subsets.some(subset => supersedes(subset)(b)) ||
  a.supersets.some(superset => supersedes(a)(superset))
);

//           composeType :: String -> Type -> Array (Type -> Type) -> Type
export const composeType = (name) => (base) => (fns) => (
  alias(name)(fns.reduce((type, fn) => fn(type), base))
);
