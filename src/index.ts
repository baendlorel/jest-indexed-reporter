import * as jest from '@jest/globals';
type Jest = typeof jest;

type TestNameLike = Parameters<Jest['it']>[0];
type TestFn = Parameters<Jest['it']>[1];

type BlockNameLike = Parameters<Jest['describe']>[0];
type BlockFn = Parameters<Jest['describe']>[1];

interface FormatterParam {
  level: number;
  currentItIndex: number;
  totalIndex: number;
  blockIndexes: number[];
  name: BlockNameLike | TestNameLike;
}

interface IndexedOptions {
  /**
   * Disable the 'process.env.NODE_ENV: test' output on console.
   */
  hideNodeEnv?: boolean;

  /**
   * This formats the name of `describe` blocks.
   * @param data a FormatterParam object
   * @returns formatted name, will be used as `blockName` param
   */
  describeNameFormatter?: (data: FormatterParam) => string;

  /**
   * This formats the name of `it` tests.
   * @param data a FormatterParam object
   * @returns formatted name, will be used as `testName` param
   */
  testNameFormatter?: (data: FormatterParam) => string;
}

const chars = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const;
const base = chars.length;
type Char = (typeof chars)[number];
const orderedVarNames = (n: number): string => {
  if (n <= 0 || !Number.isSafeInteger(n)) {
    throw new RangeError(`n should be a positive integer. Got ${n}`);
  }
  const c2n = new Map<Char, number>(chars.map((c, i) => [c, i]));

  const result: Char[] = ['a'];

  for (let i = 1; i < n; i++) {
    const prev = result[i - 1];
  }

  return '';
};

/**
 * Usage
 * @param jest
 * @returns
 */
export const injectAsIndexedJest = (options?: IndexedOptions) => {
  if (!jest) {
    throw new ReferenceError(
      "Jest not found. Please ensure '@jest/globals' is valid to require('@jest/globals')."
    );
  }

  const {
    describeNameFormatter = (data) => `${data.blockIndexes.join('.')} ${data.name}`,
    testNameFormatter = (data) =>
      `${currentItIndex.toString().padStart(3, ' ')}. ${data.name} ${data.totalIndex}`,
    hideNodeEnv = false,
  } = Object(options) as IndexedOptions;

  const NODE_ENV = process.env.NODE_ENV;
  if (!hideNodeEnv) {
    console.info(`process.env.NODE_ENV: ${NODE_ENV}`);
  }

  // # vars
  let level = 0;
  let currentItIndex = 0;
  let totalIndex = 0;
  const blockIndexes: number[] = [];

  // # formatters
  /**
   * Formats the block name with the current level and index.
   * @param name The name of the block.
   * @returns The formatted block name.
   */
  const descNameFmt = (name: BlockNameLike) =>
    describeNameFormatter({
      level,
      currentItIndex,
      totalIndex,
      blockIndexes: blockIndexes.slice(),
      name,
    });

  const itNameFmt = (name: TestNameLike) =>
    testNameFormatter({
      level,
      currentItIndex,
      totalIndex,
      blockIndexes: blockIndexes.slice(),
      name,
    });

  const itEachNameFmt = (name: TestNameLike) =>
    testNameFormatter({
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
      oldDescribe(descNameFmt(name), fn);
      currentItIndex = 0;
      level--;
    };
    return describe as Jest[typeof key];
  };

  const createIt = <ItKey extends 'it' | 'test' | 'fit' | 'xit' | 'xtest'>(key: ItKey) => {
    const originIt = Reflect.get(jest, key);
    expectFunc(originIt, key, 2);
    const originEach = Reflect.get(originIt, 'each');
    expectFunc(originEach, key, 1);

    const it = function (name: TestNameLike, fn: TestFn, timeout?: number) {
      currentItIndex++;
      totalIndex++;
      originIt(itNameFmt(name), fn, timeout);
    } as Jest[typeof key];

    let itEachIndex = 0;
    Reflect.set(it, 'each', (table: readonly Record<string, unknown>[]) => {
      const eached = originEach(table);

      // 注册的时候名字就已经确定好了
      // 需要在注册的时候就搞定所有名字的index，把curindex也加好
      const newEached = (name: string, fn: Function, timeout?: number) => {
        // todo 这里，fn的参数的数量可能是任何数值，但不能是...args这样的参数
        const argNames = new Array(fn.length).map(() => randomString(24));
        const body = `{console.log("${fn.length}");return (${fn.toString()})(${argNames.join()})}`;
        const newFn = Reflect.construct(Function, argNames.concat(body)) as any;

        // let newFn: any;
        // if (fn.length === 1) {
        //   newFn = (arg: any) => {
        //     currentItIndex++;
        //     totalIndex++;
        //     return fn(arg);
        //   };
        // } else {
        //   newFn = (arg: any, done: Function) => {
        //     currentItIndex++;
        //     totalIndex++;
        //     return fn(arg, done);
        //   };
        // }
        return eached(itNameFmt(name), newFn, timeout);
      };

      return newEached;
    });

    return it as Jest[typeof key];
  };

  return {
    /**
     * Execute a block **only** under the specified environment.
     * - If `env` !== `process.env.NODE_ENV`, the test functions will not be added.
     * @param env Specify the `env` condition
     * @param blockFn The function containing the block of tests.
     */
    underEnv,
    expect: jest.expect as Jest['expect'],
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
