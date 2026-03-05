class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    success = false,
    errors = [],
    stack = ""
  ) {
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.success = success
    this.errors = errors

    if(stack) {
      this.stack = stack
    } else{
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export { ApiError }