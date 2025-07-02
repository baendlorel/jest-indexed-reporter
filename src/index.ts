interface JestLike {
  it: (...args: any[]) => any;
  describe: (...args: any[]) => any;
  test: (...args: any[]) => any;
  fit: (...args: any[]) => any;
  xit: (...args: any[]) => any;
  xtest: (...args: any[]) => any;
  xdescribe: (...args: any[]) => any;
  fdescribe: (...args: any[]) => any;
  [key: string]: any; // 允许其他属性
}

interface FormatterParam {
  level: number;
  currentItIndex: number;
  totalIndex: number;
  localIndex?: number;
  blockIndexes: number[];
  name: string;
}

interface IndexedOptions {
  /**
   * This formats the name of `describe` blocks.
   * @param data a FormatterParam object
   * @returns formatted name, will be used as `blockName` param
   */
  blockNameFormatter?: (data: FormatterParam) => string;

  /**
   * This formats the name of `it` tests.
   * @param data a FormatterParam object
   * @returns formatted name, will be used as `testName` param
   */
  testNameFormatter?: (data: FormatterParam) => string;
}

/**
 * Usage
 * @param jest
 * @returns
 */
export const injectAsIndexedJest = <T extends JestLike>(jest: T, options?: IndexedOptions) => {
  type TestNameLike = Parameters<T['it']>[0];
  type TestFn = Parameters<T['it']>[1];

  type BlockNameLike = Parameters<T['describe']>[0];
  type BlockFn = Parameters<T['describe']>[1];

  const NODE_ENV = process.env.NODE_ENV;
  console.info(`process.env.NODE_ENV: ${NODE_ENV}`);

  const {
    blockNameFormatter = (data) => `${data.blockIndexes.join('.')} ${data.name}`,
    testNameFormatter = (data) =>
      `${currentItIndex.toString().padStart(3, ' ')}. ${data.name} ${data.totalIndex}`,
  } = Object(options) as IndexedOptions;

  // # vars
  let level = 0;
  let currentItIndex = 0;
  let totalIndex = 0;
  const blockIndexes: number[] = [];

  // # formatters
  const itNameFormat = (name: string, localIndex?: number) =>
    testNameFormatter({
      level,
      currentItIndex,
      totalIndex,
      blockIndexes: blockIndexes.slice(),
      name,
      localIndex,
    });

  const blockNameFormat = (name: string) =>
    blockNameFormatter({
      level,
      currentItIndex,
      totalIndex,
      blockIndexes: blockIndexes.slice(),
      name,
    });

  // # utils
  const err = (msg: string) => {
    const m = `Please "import * as jest from '@jest/globals'" then "const { it, ... } = createIndexedJest(jest)".`;
    new TypeError(`${msg}. ${m}`);
  };

  const expectFunc: (fn: any, key: string, minLen: number) => asserts fn is Function = (
    f: any,
    k: string,
    m: number
  ) => {
    if (typeof f !== 'function') {
      throw err(`'jest.${k}' is not a function`);
    }
    if (f.length < m) {
      throw err(`'jest.${k}' should have at least ${m} params. Got ${f.length}`);
    }
  };

  /**
   * Depends on `jest.it` can accept funtions and classes as the `testName` parameter.
   */
  const underEnv = (env: 'dev' | 'prod' | 'test' | string, blockFn: BlockFn) => {
    if (env && NODE_ENV !== env) {
      return;
    }
    console.log('appending block', blockFn.name);
    blockFn();
  };

  const createDescribe = <DescKey extends 'describe' | 'xdescribe' | 'fdescribe'>(key: DescKey) => {
    const oldDescribe = Reflect.get(jest, key);
    expectFunc(oldDescribe, key, 2);

    const describe = function (name: BlockNameLike, fn: BlockFn) {
      const i = level;
      level++;
      if (level < blockIndexes.length) {
        blockIndexes.splice(level);
      }
      blockIndexes[i] = i in blockIndexes ? blockIndexes[i] + 1 : 1;
      currentItIndex = 0;
      oldDescribe(blockNameFormat(name), fn);
      currentItIndex = 0;
      level--;
    };
    return describe as T[typeof key];
  };

  const createIt = <ItKey extends 'it' | 'test' | 'fit' | 'xit' | 'xtest'>(key: ItKey) => {
    const originIt = Reflect.get(jest, key);
    expectFunc(originIt, key, 2);
    const originEach = Reflect.get(originIt, 'each');
    expectFunc(originEach, key, 1);

    const it = function (name: TestNameLike, fn: TestFn, timeout?: number) {
      currentItIndex++;
      totalIndex++;
      originIt(itNameFormat(name), fn, timeout);
    } as T[typeof key];

    let localIndex = 0;
    Reflect.set(it, 'each', (table: readonly Record<string, unknown>[]) => {
      const eached = originEach(table) as (
        name: string,
        fn: (arg: number, done: Function) => void | any,
        timeout?: number
      ) => void;

      const newEached = (name: string, fn: Function, timeout?: number) => {
        console.log('newEached', { name, fn: fn.toString(), timeout });

        let newFn: any;
        if (fn.length === 1) {
          newFn = (arg: any) => {
            currentItIndex++;
            totalIndex++;
            return fn(arg);
          };
        } else {
          newFn = (arg: any, done: Function) => {
            currentItIndex++;
            totalIndex++;
            return fn(arg, done);
          };
        }
        return eached(itNameFormat(name, localIndex), newFn, timeout);
      };

      return newEached;
    });

    return it as T[typeof key];
  };

  return {
    /**
     * Execute a block **only** under the specified environment.
     * - If `env` !== `process.env.NODE_ENV`, the test functions will not be added.
     * @param env Specify the `env` condition
     * @param blockFn The function containing the block of tests.
     */
    underEnv,
    expect: jest.expect as T['expect'],
    describe: createDescribe('describe'),
    xdescribe: createDescribe('xdescribe'),
    fdescribe: createDescribe('fdescribe'),
    it: createIt('it'),
    test: createIt('test'),
    fit: createIt('fit'),
    xit: createIt('xit'),
    xtest: createIt('xtest'),
  };
};
