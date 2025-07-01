import * as jest from '@jest/globals';
import { injectAsIndexedJest } from '@/index';

const { underEnv, it, describe, expect } = injectAsIndexedJest<typeof jest>(jest);

underEnv('test', () => {
  describe('header', () => {
    describe('first test', () => {
      it('should run a test', () => {
        expect(true).toBe(true);
      });
      it('should run b test', () => {
        expect(1).toBe(1);
      });
    });
    describe('second test', () => {
      describe('second sub test', () => {
        it('should run c test', () => {
          expect('r').not.toBe(3);
        });

        it.each([2, 3])('iteach', (arg, done) => {
          expect(arg).toBeGreaterThan(1);
          // fixme done不是函数？
          done();
        });
      });
    });
  });
});
