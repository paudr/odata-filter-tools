export default class ParseError extends Error {
  constructor (message, indexStart, indexEnd) {
    super(`${message}. Starting at position ${indexStart} and ending at ${indexEnd}.`)
    this.displayMessage = message
    this.indexStart = indexStart
    this.indexEnd = indexEnd
  }
}
