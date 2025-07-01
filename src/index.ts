import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestContext,
  TestResult,
} from '@jest/test-result';
import type { Circus, Config } from '@jest/types';
import { DefaultReporter } from '@jest/reporters';
import type { ReporterOnStartOptions } from './types';

export default class IndexedReporter extends DefaultReporter {
  onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {}

  onTestFileResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {}

  onTestCaseStart(test: Test, testCaseStartInfo: Circus.TestCaseStartInfo) {}

  onTestCaseResult(test: Test, testCaseResult: TestCaseResult) {}

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {}

  onTestStart(test: Test) {}

  onTestFileStart(test: Test) {}

  onRunComplete(testContexts: Set<TestContext>, results: AggregatedResult) {}

  getLastError() {}
}
