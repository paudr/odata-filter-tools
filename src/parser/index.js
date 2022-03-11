import tokenizer from './token-stream.js'
import parser from './parser.js'
import transformation from './transformation.js'

export default function odataFilterParser (string) {
  const tokenStream = tokenizer(string)
  const ast = parser(tokenStream)
  const output = transformation(ast)
  return output
}
