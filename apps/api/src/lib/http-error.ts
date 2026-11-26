// An error with an HTTP status. errorHandler responds with that status and,
// for 4xx, with this message.
class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export { HttpError };
