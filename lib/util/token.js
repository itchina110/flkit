'use strict';
/**
 * token list
 * @type {Object}
 */
module.exports = {
  /* End of source indicator. */      
  EOS: 'EOS',
  LPAREN: '(',
  RPAREN: ')',
  LBRACK: '[',
  RBRACK: ']',
  LBRACE: '{',
  RBRACE: '}',
  COLON: ':',
  SEMICOLON: ';',
  PERIOD: '.',
  CONDITIONAL: '?',
  INC: '++',
  DEC: '--',
  /* Assignment operators. */                                           
  /* IsAssignmentOp() and Assignment::is_compound() relies on */        
  /* this block of enum values being contiguous and sorted in the */    
  /* same order! */ 
  INIT_VAR: '=init_var', /* AST-use only. */  
  INIT_LET: '=init_let', 
  INIT_CONST: '=init_const',
  INIT_CONST_HARMONY: '=init_const_harmony',

  ASSIGN: '=',
  ASSIGN_BIT_OR: '|=',
  ASSIGN_BIT_XOR: '^=',
  ASSIGN_BIT_AND: '&=',
  ASSIGN_SHL: '<<=',
  ASSIGN_SAR: '>>=',
  ASSIGN_SHR: '>>>=',
  ASSIGN_ADD: '+=',
  ASSIGN_SUB: '-=',
  ASSIGN_MUL: '*=',
  ASSIGN_DIV: '/=',
  ASSIGN_MOD: '%=',
  /* Binary operators sorted by precedence. */                          
  /* IsBinaryOp() relies on this block of enum values */                
  /* being contiguous and sorted in the same order! */ 
  COMMA: ',',
  OR: '||',
  AND: '&&',
  BIT_OR: '|',
  BIT_XOR: '^',
  BIT_AND: '&',
  SHL: '<<',
  SAR: '>>',
  SHR: '<<<',
  ROR: 'rotate right',
  ADD: '+',
  SUB: '-',
  MUL: '*',
  DIV: '/',
  MOD: '%',
  /* Compare operators sorted by precedence. */                         
  /* IsCompareOp() relies on this block of enum values */               
  /* being contiguous and sorted in the same order! */  
  EQ: '==',
  NE: '!=',
  EQ_STRICT: '===',
  NE_STRICT: '!==',
  LT: '<',
  GT: '>',
  LTE: '<=',
  GTE: '>=',
  INSTANCEOF: 'instanceof',
  IN: 'in',
  /* Unary operators. */                                                
  /* IsUnaryOp() relies on this block of enum values */                 
  /* being contiguous and sorted in the same order! */  
  NOT: '!',
  BIT_NOT: '~',
  DELETE: 'delete',
  TYPEOF: 'typeof',
  VOID: 'void',
  /* Keywords (ECMA-262, section 7.5.2, page 13). */
  BREAK: 'break',
  CASE: 'case',
  CATCH: 'catch',
  CONTINUE: 'continue',
  DEBUGGER: 'debugger',
  DEFAULT: 'default',
  /* DELETE */   
  DO: 'do',
  ELSE: 'else',
  FINALLY: 'finally',
  FOR: 'for',
  FUNCTION: 'function',
  IF: 'if',
  /* IN */                                                              
  /* INSTANCEOF */  
  NEW: 'new',
  RETURN: 'return',
  SWITCH: 'switch',
  THIS: 'this',
  THROW: 'throw',
  TRY: 'try',
  /* TYPEOF */  
  VAR: 'var',
  /* VOID */   
  WHILE: 'while',
  WITH: 'with',
  /* Literals (ECMA-262, section 7.8, page 16). */
  NULL_LITERAL: 'null',
  TRUE_LITERAL: 'true',
  FALSE_LITERAL: 'false',
  NUMBER: null,
  STRING: null,
  /* Identifiers (not keywords or future reserved words). */ 
  IDENTIFIER: null,
  FUTURE_RESERVED_WORD: null,
  FUTURE_STRICT_RESERVED_WORD: null,
  CONST: 'const',
  EXPORT: 'export',
  IMPORT: 'import',
  LET: 'let',
  /* Illegal token - not able to scan. */   
  ILLEGAL: 'ILLEGAL',
  /* Scanner-internal use only. */    
  WHITESPACE: null,
  

  NEWLINE: '\n', //new line
  LAST: 'last', //last token
}