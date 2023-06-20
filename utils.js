export function cartesianProduct(obj) {
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    return [{}];
  }

  const key = keys[0];
  const restKeys = keys.slice(1);
  const restProduct = cartesianProduct(
    restKeys.reduce((result, k) => ({ ...result, [k]: obj[k] }), {})
  );

  return obj[key].values.reduce((product, value) => {
    return product.concat(
      restProduct.map(combination => ({
        ...combination,
        [key]: value
      }))
    );
  }, []);
}