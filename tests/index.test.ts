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

        it.each([2, 3])('iteach', (arg) => {
          // 同步测试，不需要 done
          expect(arg).toBeGreaterThan(1);
        });

        // 如果需要异步测试，用这种方式：
        it.each([5, 6])('async iteach', (arg, done) => {
          expect(arg).toBeGreaterThan(1);
          console.log('done', done);
          done();
        });

        it('should run d1 test', () => {
          expect('r').not.toBe(3);
        });
      });
    });
    describe('third test', () => {
      it('should run da test', () => {
        expect('r').not.toBe(3);
      });
    });
  });
});
