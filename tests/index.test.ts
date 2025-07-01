import * as jest from '@jest/globals';
import { createIndexedJest } from '@/index';

const { underEnv, it, describe, expect } = createIndexedJest<typeof jest>(jest);
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

  describe('second header', () => {
    for (let i = 0; i < 120; i++) {
      it(i.toString(36), () => {
        expect(true).toBe(true);
      });
    }
  });
});
