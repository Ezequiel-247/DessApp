'use strict';

class DomainError extends Error {
  constructor(message, statusCode = 422) {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
  }
}

module.exports = DomainError;
