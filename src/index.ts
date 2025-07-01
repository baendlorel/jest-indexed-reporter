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

interface IndexedOptions {
  totalIndexFormat?: (index: number) => string;
}

/**
 * Usage
 * @param jest
 * @returns
 */
export const createIndexedJest = <T extends JestLike>(jest: T, options?: IndexedOptions) => {
  type TestNameLike = Parameters<T['it']>[0];
  type TestFn = Parameters<T['it']>[1];

  type BlockNameLike = Parameters<T['describe']>[0];
  type BlockFn = Parameters<T['describe']>[1];

  const NODE_ENV = process.env.NODE_ENV;
  console.info(`process.env.NODE_ENV: ${NODE_ENV}`);

  const { totalIndexFormat = (i: number) => `(${i})` } = Object(options);

  let level = 0;
  let curIdx = 0;
  let maxCurIdx = 0;
  let totalIdx = 0;
  const h: number[] = [];
  const hcollapse = () => {
    return '\u0008'.repeat((h.length - 1) * 2).concat(h.join('.'));
  };

  const itStack: {}[] = [];

  const leftAlign = (n: number) => `${String(n).padStart(String(maxCurIdx).length, ' ')}`;

  const err = (msg: string) => {
    msg = msg.replace(/([.]$|$)/g, '');
    return new TypeError(
      `${msg}. Please use import * as jest from '@jest/globals' then use createIndexedJest(jest).`
    );
  };

  /**
   * Depends on `jest.it` can accept funtions and classes as the `testName` parameter.
   */
  const indexer = (msg: string) =>
    new Proxy(indexer, {
      get(target, prop) {
        if (['name', 'toString', Symbol.toPrimitive].includes(prop)) {
          console.log('curIdx', curIdx);
          return `${leftAlign(curIdx)}. ${msg} ${totalIndexFormat(totalIdx)}`;
        }
        console.log('Reading? prop:', prop);
        return Reflect.get(target, prop);
      },
    });

  const underEnv = (env: 'dev' | 'prod' | 'test' | string, blockFn: BlockFn) => {
    if (env && NODE_ENV !== env) {
      return;
    }
    blockFn();
  };

  const createDescribe = <DescKey extends 'describe' | 'xdescribe' | 'fdescribe'>(key: DescKey) => {
    const origin = Reflect.get(jest, key);
    if (typeof origin !== 'function') {
      throw err(`Jest should have a method named '${key}'`);
    }
    if (origin.length < 2) {
      throw err(`Jest's '${key}' method should have at least 2 parameters: (testName, testFn)`);
    }

    const describe: T[typeof key] = function (blockName: BlockNameLike, blockFn: BlockFn) {
      level++;
      if (level < h.length) {
        h.splice(level);
      }
      h[level - 1] = h[level - 1] === undefined ? 1 : h[level - 1] + 1;
      curIdx = 0;
      origin(`${hcollapse()} ${blockName}`, blockFn);
      curIdx = 0;
      level--;
    } as T[typeof key];
    return describe;
  };

  const createIt = <ItKey extends 'it' | 'test' | 'fit' | 'xit' | 'xtest'>(key: ItKey) => {
    const origin = Reflect.get(jest, key);
    if (typeof origin !== 'function') {
      throw err(`Jest should have a method named '${key}'`);
    }
    if (origin.length < 2) {
      throw err(
        `Jest '${key}' should have at least 2 params: (testName, fn). Got ${origin.length}`
      );
    }

    console.log('origin', origin, origin.name, origin.length);

    const originEach = Reflect.get(origin, 'each');
    if (typeof originEach !== 'function') {
      throw err(`Jest should have a method named '${key}'.each`);
    }
    if (originEach.length < 1) {
      throw err(
        `Jest '${key}'.each should have at least 1 param: (arrayLike). Got ${originEach.length}`
      );
    }

    const it: T[typeof key] = function (testName: TestNameLike, fn: TestFn, timeout?: number) {
      curIdx++;
      totalIdx++;
      maxCurIdx = Math.max(maxCurIdx, curIdx);
      origin(indexer(testName), fn, timeout);
    } as T[typeof key];

    Reflect.set(it, 'each', (...args: any[]) => {
      const [testName, fn] = args.splice(0, 2);
      originEach(indexer(testName), fn, ...args);
    });

    return it;
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
