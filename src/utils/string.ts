export function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function getMethodsMap(obj: any): { [key: string]: Function } {
  let properties = new Set<string>()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  const methodNames = [...properties.keys()].filter(item => typeof obj[item] === 'function')
  const methodNameToFnObj: { [key: string]: Function } = {}
  methodNames.map(item => methodNameToFnObj[item] = obj[item])
  return methodNameToFnObj;
}
