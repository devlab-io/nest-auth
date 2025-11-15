// Suppress NestJS Logger output during tests
import { Logger } from '@nestjs/common';

// Override Logger methods to suppress output
Logger.prototype.log = jest.fn();
Logger.prototype.error = jest.fn();
Logger.prototype.warn = jest.fn();
Logger.prototype.debug = jest.fn();
Logger.prototype.verbose = jest.fn();

