import * as jest from '@jest/globals';
import { injectAsIndexedJest } from '@/index';

const { underEnv, it, describe, expect } = injectAsIndexedJest<typeof jest>(jest);

// fixme 不知道为啥只剩下3个测试了： should run a b c
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
      });
    });
  });
});
