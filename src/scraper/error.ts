export class ScraperError extends Error {
  httpStatus: number;

  constructor(httpStatus: number, message?: string) {
    super(message);
    this.httpStatus = httpStatus;
  }
}
