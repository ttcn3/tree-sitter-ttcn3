
Tree-sitter 

# **Creating parsers** 

Developing Tree-sitter grammars can have a difficult learning curve, but once you get the hang of it, it can be fun and even zen-like. This document will help you to get started and to develop a useful mental model. 

 

Tree-sitter 

# **Getting Started** 

## **Dependencies** 

To develop a Tree-sitter parser, there are two dependencies that you need to install: 

- **A JavaScript runtime** — Tree-sitter grammars are written in JavaScript, and Tree-sitter uses a JavaScript runtime (the default being Node.js) to interpret JavaScript files. It requires this runtime command (default: `node` ) to be in one of the directories in your `PATH` . 

- **A C Compiler** — Tree-sitter creates parsers that are written in C. To run and test these parsers with the `tree-sitter parse` or `tree-sitter test` commands, you must have a C/C++ compiler installed. Tree-sitter will try to look for these compilers in the standard places for each platform. 

## **Installation** 

To create a Tree-sitter parser, you need to use the `tree-sitter` CLI. You can install the CLI in a few different ways: 

- Build the `tree-sitter-cli` Rust crate from source using `cargo` , the Rust package manager. This works on any platform. See the contributing docs for more information. 

- Install the `tree-sitter-cli` Rust crate from crates.io using `cargo` . You can do so by running the following command: `cargo install tree-sitter-cli --locked` 

- Install the `tree-sitter-cli` Node.js module using `npm` , the Node package manager. This approach is fast, but it only works on certain platforms, because it relies on prebuilt binaries. 

- Download a binary for your platform from the latest GitHub release, and put it into a directory on your `PATH` . 

## **Project Setup** 

The preferred convention is to name the parser repository "tree-sitter-" followed by the name of the language, in lowercase. 

 

Tree-sitter 

```
mkdir tree-sitter-${LOWER_PARSER_NAME}
cd tree-sitter-${LOWER_PARSER_NAME}
```

#### **Note** 

The `LOWER_` prefix here means the "lowercase" name of the language. 

#### **Warning** 

Dashes are not permitted via the CLI's `init` command and should not be used in parser names. 

### **Init** 

Once you've installed the `tree-sitter` CLI tool, you can start setting up your project, which will allow your parser to be used from multiple languages. 

```
# This will prompt you for input
tree-sitter init
```

The `init` command will create a bunch of files in the project. There should be a file called `grammar.js` with the following contents: 

```
/**
 * @file PARSER_DESCRIPTION
 * @author PARSER_AUTHOR_NAME PARSER_AUTHOR_EMAIL
 * @license PARSER_LICENSE
 */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
exportdefault grammar({
name: 'LOWER_PARSER_NAME',
rules: {
// TODO: add the actual grammar rules
source_file: $ => 'hello'
  }
});
```

 

Tree-sitter 

#### **Info** 

The placeholders shown above would be replaced with the corresponding data you provided in the `init` sub-command's prompts. 

To learn more about this command, check the reference page. 

### **Generate** 

Next, run the following command: 

```
tree-sitter generate
```

This will generate the C code required to parse this trivial language. 

You can test this parser by creating a source file with the contents "hello" and parsing it: 

```
echo'hello' > example-file
tree-sitter parse example-file
```

Alternatively, in Windows PowerShell: 

```
"hello" | Out-File example-file -Encoding utf8
tree-sitter parse example-file
```

This should print the following: 

```
(source_file [0, 0] - [1, 0])
```

You now have a working parser. 

Finally, look back at the triple-slash and `@ts-check` comments in `grammar.js` ; these tell your editor to provide documentation and type information as you edit your grammar. For these to work, you must download Tree-sitter's TypeScript API from npm into a `node_modules` directory in your project: 

```
npm install # or your package manager of choice
```

To learn more about this command, check the reference page. 

 

Tree-sitter 

# **The Grammar DSL** 

The following is a complete list of built-in functions you can use in your `grammar.js` to define rules. Use-cases for some of these functions will be explained in more detail in later sections. 

- **Symbols (the** $ **object)** — Every grammar rule is written as a JavaScript function that takes a parameter conventionally called `$` . The syntax `$.identifier` is how you refer to another grammar symbol within a rule. Names starting with `$.MISSING` or 

- `$.UNEXPECTED` should be avoided as they have special meaning for the `tree-sitter` 

- `test` command. 

- **String and Regex literals** — The terminal symbols in a grammar are described using JavaScript strings and regular expressions. Of course during parsing, Tree-sitter does not actually use JavaScript's regex engine to evaluate these regexes; it generates its own regex-matching logic based on the Rust regex syntax as part of each parser. Regex literals are just used as a convenient way of writing regular expressions in your grammar. You can use Rust regular expressions in your grammar DSL through the `RustRegex` class. Simply pass your regex pattern as a string: 

```
new RustRegex('(?i)[a-z_][a-z0-9_]*') // matches a simple identifier
```

Unlike JavaScript's builtin `RegExp` class, which takes a pattern and flags as separate arguments, `RustRegex` only accepts a single pattern string. While it doesn't support separate flags, you can use inline flags within the pattern itself. For more details about Rust's regex syntax and capabilities, check out the Rust regex documentation. 

#### **Note** 

Only a subset of the Regex engine is actually supported. This is due to certain features like lookahead and lookaround assertions not being feasible to use in an LR(1) grammar, as well as certain flags being unnecessary for tree-sitter. However, plenty of features are supported by default: 

- Character classes 

- Character ranges Character sets Quantifiers 

- Alternation 

- Grouping 

- Unicode character escapes 

- Unicode property escapes 

 

Tree-sitter 

- **Sequences :** seq(rule1, rule2, ...) — This function creates a rule that matches any number of other rules, one after another. It is analogous to simply writing multiple symbols next to each other in EBNF notation. 

- **Alternatives :** choice(rule1, rule2, ...) — This function creates a rule that matches _one_ of a set of possible rules. The order of the arguments does not matter. This is analogous to the `|` (pipe) operator in EBNF notation. 

- **Repetitions :** repeat(rule) — This function creates a rule that matches _zero-or-more_ occurrences of a given rule. It is analogous to the `{x}` (curly brace) syntax in EBNF notation. 

- **Repetitions :** repeat1(rule) — This function creates a rule that matches _one-or-more_ occurrences of a given rule. The previous `repeat` rule is implemented in `repeat1` but is included because it is very commonly used. 

- **Options :** optional(rule) — This function creates a rule that matches _zero or one_ occurrence of a given rule. It is analogous to the `[x]` (square bracket) syntax in EBNF notation. 

- **Precedence :** prec(number, rule) — This function marks the given rule with a numerical precedence, which will be used to resolve _LR(1) Conflicts_ at parser-generation time. When two rules overlap in a way that represents either a true ambiguity or a _local_ ambiguity given one token of lookahead, Tree-sitter will try to resolve the conflict by matching the rule with the higher precedence. The default precedence of all rules is zero. This works similarly to the precedence directives in Yacc grammars. 

This function can also be used to assign lexical precedence to a given token, but it must be wrapped in a `token` call, such as `token(prec(1, 'foo'))` . This reads as "the token 

> `foo` has a lexical precedence of 1". The purpose of lexical precedence is to solve the issue where multiple tokens can match the same set of characters, but one token should be preferred over the other. See Lexical Precedence vs Parse Precedence for a more detailed explanation. 

- **Left Associativity :** prec.left([number], rule) — This function marks the given rule as left-associative (and optionally applies a numerical precedence). When an LR(1) conflict arises in which all the rules have the same numerical precedence, Tree-sitter will consult the rules' associativity. If there is a left-associative rule, Tree-sitter will prefer matching a rule that ends _earlier_ . This works similarly to associativity directives in Yacc grammars. 

- **Right Associativity :** prec.right([number], rule) — This function is like `prec.left` , but it instructs Tree-sitter to prefer matching a rule that ends _later_ . 

- **Dynamic Precedence :** prec.dynamic(number, rule) — This function is similar to `prec` , but the given numerical precedence is applied at _runtime_ instead of at parser 

- generation time. This is only necessary when handling a conflict dynamically using the 

 

Tree-sitter 

- `conflicts` field in the grammar, and when there is a genuine _ambiguity_ : multiple rules 

- correctly match a given piece of code. In that event, Tree-sitter compares the total dynamic precedence associated with each rule, and selects the one with the highest total. This is similar to dynamic precedence directives in Bison grammars. 

- **Tokens :** token(rule) — This function marks the given rule as producing only a single token. Tree-sitter's default is to treat each String or RegExp literal in the grammar as a separate token. Each token is matched separately by the lexer and returned as its own leaf node in the tree. The `token` function allows you to express a complex rule using the functions described above (rather than as a single regular expression) but still have Tree-sitter treat it as a single token. The token function will only accept terminal rules, so `token($.foo)` will not work. You can think of it as a shortcut for squashing complex rules of strings or regexes down to a single token. 

- **Immediate Tokens :** token.immediate(rule) — Usually, whitespace (and any other extras, such as comments) is optional before each token. This function means that the token will only match if there is no whitespace. 

- **Aliases :** alias(rule, name) — This function causes the given rule to _appear_ with an alternative name in the syntax tree. If `name` is a _symbol_ , as in `alias($.foo, $.bar)` , then the aliased rule will _appear_ as a named node called `bar` . And if `name` is a _string literal_ , as in `alias($.foo, 'bar')` , then the aliased rule will appear as an anonymous node, as if the rule had been written as the simple string. 

- **Field Names :** field(name, rule) — This function assigns a _field name_ to the child node(s) matched by the given rule. In the resulting syntax tree, you can then use that field name to access specific children. 

- **Reserved Keywords :** reserved(wordset, rule) — This function will override the global reserved word set with the one passed into the `wordset` parameter. This is useful for contextual keywords, such as `if` in JavaScript, which cannot be used as a variable name in most contexts, but can be used as a property name. 

In addition to the `name` and `rules` fields, grammars have a few other optional public fields that influence the behavior of the parser. Each of these fields is a function that accepts the grammar object ( `$` ) as its only parameter, like the grammar rules themselves. These fields are: 

- extras — an array of tokens that may appear _anywhere_ in the language. This is often 

- used for whitespace and comments. The default value of `extras` is to accept whitespace. To control whitespace explicitly, specify `extras: $ => []` in your grammar. See the section on using extras for more details. 

- inline — an array of rule names that should be automatically _removed_ from the 

- grammar by replacing all of their usages with a copy of their definition. This is useful 

 

Tree-sitter 

for rules that are used in multiple places but for which you _don't_ want to create syntax tree nodes at runtime. 

- conflicts — an array of arrays of rule names. Each inner array represents a set of 

- rules that's involved in an _LR(1) conflict_ that is _intended to exist_ in the grammar. When these conflicts occur at runtime, Tree-sitter will use the GLR algorithm to explore all the possible interpretations. If _multiple_ parses end up succeeding, Tree-sitter will pick the subtree whose corresponding rule has the highest total _dynamic precedence_ . 

- externals — an array of token names which can be returned by an _external scanner_ . 

- External scanners allow you to write custom C code which runs during the lexing process to handle lexical rules (e.g. Python's indentation tokens) that cannot be described by regular expressions. 

- precedences — an array of arrays of strings, where each array of strings defines 

- named precedence levels in descending order. These names can be used in the `prec` functions to define precedence relative only to other names in the array, rather than globally. Can only be used with parse precedence, not lexical precedence. 

- word — the name of a token that will match keywords to the keyword extraction 

- optimization. 

- supertypes — an array of rule names which should be considered to be 'supertypes' 

- in the generated _node types_ file. Supertype rules are automatically hidden from the parse tree, regardless of whether their names start with an underscore. The main use case for supertypes is to group together multiple different kinds of nodes under a single abstract category, such as "expression" or "declaration". See the section on `using supertypes` for more details. 

- reserved — similar in structure to the main `rules` property, an object of reserved 

- word sets associated with an array of reserved rules. The reserved rule in the array must be a terminal token meaning it must be a string, regex, token, or terminal rule. The reserved rule must also exist and be used in the grammar, specifying arbitrary tokens will not work. The _first_ reserved word set in the object is the global word set, meaning it applies to every rule in every parse state. However, certain keywords are contextual, depending on the rule. For example, in JavaScript, keywords are typically not allowed as ordinary variables, however, they _can_ be used as a property name. In this situation, the `reserved` function would be used, and the word set to pass in would be the name of the word set that is declared in the `reserved` object that corresponds to an empty array, signifying _no_ keywords are reserved. 

 

Tree-sitter 

# **Writing the Grammar** 

Writing a grammar requires creativity. There are an infinite number of CFGs (context-free grammars) that can be used to describe any given language. To produce a good Tree-sitter parser, you need to create a grammar with two important properties: 

1. **An intuitive structure** — Tree-sitter's output is a concrete syntax tree; each node in the tree corresponds directly to a terminal or non-terminal symbol in the grammar. So to produce an easy-to-analyze tree, there should be a direct correspondence between the symbols in your grammar and the recognizable constructs in the language. This might seem obvious, but it is very different from the way that context-free grammars are often written in contexts like language specifications or Yacc/Bison parsers. 

2. **A close adherence to LR(1)** — Tree-sitter is based on the GLR parsing algorithm. This means that while it can handle any context-free grammar, it works most efficiently with a class of context-free grammars called LR(1) Grammars. In this respect, Tree-sitter's grammars are similar to (but less restrictive than) Yacc and Bison grammars, but _different_ from ANTLR grammars, Parsing Expression Grammars, or the ambiguous grammars commonly used in language specifications. 

It's unlikely that you'll be able to satisfy these two properties just by translating an existing context-free grammar directly into Tree-sitter's grammar format. There are a few kinds of adjustments that are often required. The following sections will explain these adjustments in more depth. 

## **The First Few Rules** 

It's usually a good idea to find a formal specification for the language you're trying to parse. This specification will most likely contain a context-free grammar. As you read through the rules of this CFG, you will probably discover a complex and cyclic graph of relationships. It might be unclear how you should navigate this graph as you define your grammar. 

Although languages have very different constructs, their constructs can often be categorized into similar groups like _Declarations_ , _Definitions_ , _Statements_ , _Expressions_ , _Types_ and _Patterns_ . In writing your grammar, a good first step is to create just enough structure to include all of these basic _groups_ of symbols. For a language like Go, you might start with something like this: 

 

Tree-sitter 

```
{
// ...
rules: {
source_file: $ => repeat($._definition),
_definition: $ => choice(
      $.function_definition
// TODO: other kinds of definitions
    ),
function_definition: $ => seq(
'func',
      $.identifier,
      $.parameter_list,
      $._type,
      $.block
    ),
parameter_list: $ => seq(
'(',
// TODO: parameters
')'
    ),
_type: $ => choice(
'bool'
// TODO: other kinds of types
    ),
block: $ => seq(
'{',
      repeat($._statement),
'}'
    ),
_statement: $ => choice(
      $.return_statement
// TODO: other kinds of statements
    ),
return_statement: $ => seq(
'return',
      $.expression,
';'
    ),
expression: $ => choice(
      $.identifier,
      $.number
// TODO: other kinds of expressions
    ),
identifier: $ => /[a-z]+/,
    number: $ => /\d+/
```

 

Tree-sitter 

```
  }
}
```

One important fact to know up front is that the start rule for the grammar is the first property in the `rules` object. In the example above, that would correspond to `source_file` , but it can be named anything. 

Some details of this grammar will be explained in more depth later on, but if you focus on the `TODO` comments, you can see that the overall strategy is _breadth-first_ . Notably, this initial skeleton does not need to directly match an exact subset of the context-free grammar in the language specification. It just needs to touch on the major groupings of rules in as simple and obvious a way as possible. 

With this structure in place, you can now freely decide what part of the grammar to flesh out next. For example, you might decide to start with _types_ . One-by-one, you could define the rules for writing basic types and composing them into more complex types: 

```
{
// ...
_type: $ => choice(
    $.primitive_type,
    $.array_type,
    $.pointer_type
  ),
primitive_type: $ => choice(
'bool',
'int'
  ),
array_type: $ => seq(
'[',
']',
    $._type
  ),
pointer_type: $ => seq(
'*'
,
    $._type
  )
}
```

After developing the _type_ sublanguage a bit further, you might decide to switch to working on _statements_ or _expressions_ instead. It's often useful to check your progress by trying to parse some real code using `tree-sitter parse` . 

**And remember to add tests for each rule in your** test/corpus **folder!** 

 

Tree-sitter 

## **Structuring Rules Well** 

Imagine that you were just starting work on the Tree-sitter JavaScript parser. Naively, you might try to directly mirror the structure of the ECMAScript Language Spec. To illustrate the problem with this approach, consider the following line of code: 

##### `return x + y;` 

According to the specification, this line is a `ReturnStatement` , the fragment `x + y` is an `AdditiveExpression` , and `x` and `y` are both `IdentifierReferences` . The relationship between these constructs is captured by a complex series of production rules: 

|`ReturnStatement`|`->  'return' Expression`|
|---|---|
|`Expression`|`->  AssignmentExpression`|
|`AssignmentExpression`|`->  ConditionalExpression`|
|`ConditionalExpression`|`->  LogicalORExpression`|
|`LogicalORExpression`|`->  LogicalANDExpression`|
|`LogicalANDExpression`|`->  BitwiseORExpression`|
|`BitwiseORExpression`|`->  BitwiseXORExpression`|
|`BitwiseXORExpression`|`->  BitwiseANDExpression`|
|`BitwiseANDExpression`|`->  EqualityExpression`|
|`EqualityExpression`|`->  RelationalExpression`|
|`RelationalExpression`|`->  ShiftExpression`|
|`ShiftExpression`|`->  AdditiveExpression`|
|`AdditiveExpression`|`->  MultiplicativeExpression`|
|`MultiplicativeExpression`|`->  ExponentiationExpression`|
|`ExponentiationExpression`|`->  UnaryExpression`|
|`UnaryExpression`|`->  UpdateExpression`|
|`UpdateExpression`|`->  LeftHandSideExpression`|
|`LeftHandSideExpression`|`->  NewExpression`|
|`NewExpression`|`->  MemberExpression`|
|`MemberExpression`|`->  PrimaryExpression`|
|`PrimaryExpression`|`->  IdentifierReference`|



The language spec encodes the twenty different precedence levels of JavaScript expressions using twenty levels of indirection between `IdentifierReference` and `Expression` . If we were to create a concrete syntax tree representing this statement according to the language spec, it would have twenty levels of nesting, and it would contain nodes with names like `BitwiseXORExpression` , which are unrelated to the actual code. 

## **Standard Rule Names** 

Tree-sitter places no restrictions on how to name the rules of your grammar. It can be helpful, however, to follow certain conventions used by many other established grammars in the ecosystem. Some of these well-established patterns are listed below: 

 

Tree-sitter 

- `source_file` : Represents an entire source file, this rule is commonly used as the root 

- node for a grammar, 

- `expression` / `statement` : Used to represent statements and expressions for a given 

- language. Commonly defined as a choice between several more specific subexpression/sub-statement rules. 

- `block` : Used as the parent node for block scopes, with its children representing the 

- block's contents. 

- `type` : Represents the types of a language such as `int` , `char` , and `void` . 

- `identifier` : Used for constructs like variable names, function arguments, and object 

- fields; this rule is commonly used as the `word` token in grammars. 

- `string` : Used to represent `"string literals"` . 

- `comment` : Used to represent comments, this rule is commonly used as an `extra` . 

## **Using Precedence** 

To produce a readable syntax tree, we'd like to model JavaScript expressions using a much flatter structure like this: 

```
{
// ...
expression: $ => choice(
    $.identifier,
    $.unary_expression,
    $.binary_expression,
// ...
  ),
unary_expression: $ => choice(
    seq('-', $.expression),
    seq('!', $.expression),
// ...
  ),
binary_expression: $ => choice(
    seq($.expression, '*', $.expression),
    seq($.expression, '+', $.expression),
// ...
  ),
}
```

Of course, this flat structure is highly ambiguous. If we try to generate a parser, Tree-sitter gives us an error message: 

 

Tree-sitter 

```
Error: Unresolved conflict for symbol sequence:
```

```
  '-'  _expression  •  '*'  …
```

```
Possible interpretations:
```

- `1:  '-'  (binary_expression  _expression  •  '*'  _expression)` 

- `2:  (unary_expression  '-'  _expression)  •  '*'  …` 

```
Possible resolutions:
```

- `1:  Specify a higher precedence in `binary_expression` than in the other rules.` 

- `2:  Specify a higher precedence in `unary_expression` than in the other rules.` 

- `3:  Specify a left or right associativity in `unary_expression`` 

- `4:  Add a conflict for these rules: `binary_expression` `unary_expression`` 

#### **Hint** 

The • character in the error message indicates where exactly during parsing the conflict occurs, or in other words, where the parser is encountering ambiguity. 

`-` For an expression like `-a * b` , it's not clear whether the operator applies to the `a * b` or just to the `a` . This is where the `prec` function described in the previous page comes into play. By wrapping a rule with `prec` , we can indicate that certain sequence of symbols should _bind to each other more tightly_ than others. For example, the `'-', $.expression` sequence in `unary_expression` should bind more tightly than the `$.expression, '+', $.expression` sequence in `binary_expression` : 

```
{
// ...
unary_expression: $ =>
    prec(
2,
      choice(
        seq("-", $.expression),
        seq("!", $.expression),
// ...
      ),
    );
}
```

 

Tree-sitter 

## **Using Associativity** 

Applying a higher precedence in `unary_expression` fixes that conflict, but there is still another conflict: 

```
Error: Unresolved conflict for symbol sequence:
```

```
  _expression  '*'  _expression  •  '*'  …
```

```
Possible interpretations:
```

- `1:  _expression  '*'  (binary_expression  _expression  •  '*'  _expression) 2:  (binary_expression  _expression  '*'  _expression)  •  '*'  …` 

```
Possible resolutions:
```

- `1:  Specify a left or right associativity in `binary_expression`` 

- `2:  Add a conflict for these rules: `binary_expression`` 

For an expression like `a * b * c` , it's not clear whether we mean `a * (b * c)` or `(a * b) * c` . This is where `prec.left` and `prec.right` come into use. We want to select the second interpretation, so we use `prec.left` . 

```
{
// ...
binary_expression: $ => choice(
    prec.left(2, seq($.expression, '*', $.expression)),
    prec.left(1, seq($.expression, '+', $.expression)),
// ...
  ),
}
```

## **Using Conflicts** 

Sometimes, conflicts are actually desirable. In our JavaScript grammar, expressions and patterns can create intentional ambiguity. A construct like `[x, y]` could be legitimately parsed as both an array literal (like in `let a = [x, y]` ) or as a destructuring pattern (like in `let [x, y] = arr` ). 

 

Tree-sitter 

```
exportdefault grammar({
name: "javascript",
rules: {
expression: $ => choice(
      $.identifier,
      $.array,
      $.pattern,
    ),
array: $ => seq(
"[",
      optional(seq(
        $.expression, repeat(seq(",", $.expression))
      )),
"]"
    ),
array_pattern: $ => seq(
"[",
      optional(seq(
        $.pattern, repeat(seq(",", $.pattern))
      )),
"]"
    ),
pattern: $ => choice(
      $.identifier,
      $.array_pattern,
    ),
  },
})
```

In such cases, we want the parser to explore both possibilities by explicitly declaring this ambiguity: 

```
{
name: "javascript",
conflicts: $ => [
    [$.array, $.array_pattern],
  ],
rules: {
// ...
  },
}
```

#### **Note** 

The example is a bit contrived for the purpose of illustrating the usage of conflicts. The actual JavaScript grammar isn't structured like that, but this conflict is actually present in the Tree-sitter JavaScript grammar. 

 

Tree-sitter 

## **Hiding Rules** 

You may have noticed in the above examples that some grammar rule names like `_expression` and `_type` began with an underscore. Starting a rule's name with an underscore causes the rule to be _hidden_ in the syntax tree. This is useful for rules like 

> `_expression` in the grammars above, which always just wrap a single child node. If these nodes were not hidden, they would add substantial depth and noise to the syntax tree without making it any easier to understand. 

## **Using Fields** 

Often, it's easier to analyze a syntax node if you can refer to its children by _name_ instead of by their position in an ordered list. Tree-sitter grammars support this using the `field` function. This function allows you to assign unique names to some or all of a node's children: 

```
function_definition: $ =>
  seq(
"func",
    field("name", $.identifier),
    field("parameters", $.parameter_list),
    field("return_type", $._type),
    field("body", $.block),
  );
```

. Adding fields like this allows you to retrieve nodes using the field APIs 

## **Using Extras** 

Extras are tokens that can appear anywhere in the grammar, without being explicitly mentioned in a rule. This is useful for things like whitespace and comments, which can appear between any two tokens in most programming languages. To define an extra, you can use the `extras` function: 

 

Tree-sitter 

```
module.exports = grammar({
name: "my_language",
extras: ($) => [
/\s/, // whitespace
    $.comment,
  ],
rules: {
comment: ($) =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),
  },
});
```

#### **Warning** 

When adding more complicated tokens to `extras` , it's preferable to associate the pattern with a rule. This way, you avoid the lexer inlining this pattern in a bunch of spots, which can dramatically reduce the parser size. 

> `comment` token inline in `extras` : For example, instead of defining the 

`//` ❌ `Less preferable const comment = token( choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")), ); module.exports = grammar({ name: "my_language", extras: ($) => [ /\s/, // whitespace comment, ], rules: { // ... }, });` 

`extras` : We can define it as a rule and then reference it in 

 

Tree-sitter 

`//` ✅ `More preferable module.exports = grammar({ name: "my_language", extras: ($) => [ /\s/, // whitespace $.comment, ], rules: { // ... comment: ($) => token( choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")), ), }, });` 

#### **Note** 

Tree-sitter intentionally simplifies the whitespace character class, `\s` , to `[ \t\n\r]` as a performance optimization. This is because typically users do not require the full Unicode definition of whitespace. 

## **Using Supertypes** 

Some rules in your grammar will represent abstract categories of syntax nodes, such as "expression", "type", or "declaration". These rules are often defined as simple choices between several other rules. For example, in the JavaScript grammar, the `_expression` rule is defined as a choice between many different kinds of expressions: 

```
expression: $ => choice(
  $.identifier,
  $.unary_expression,
  $.binary_expression,
  $.call_expression,
  $.member_expression,
// ...
),
```

By default, Tree-sitter will generate a visible node type for each of these abstract category rules, which can lead to unnecessarily deep and complex syntax trees. To avoid this, you can add these abstract category rules to the grammar's `supertypes` definition. Tree-sitter will 

 

Tree-sitter 

then treat these rules as _supertypes_ , and will not generate visible node types for them in the syntax tree. 

```
module.exports = grammar({
name: "javascript",
supertypes: $ => [
    $.expression,
  ],
rules: {
expression: $ => choice(
      $.identifier,
// ...
    ),
// ...
  },
});
```

Although supertype rules are hidden from the syntax tree, they can still be used in queries. See the chapter on Query Syntax for more information. 

#### **Warning** 

Aliasing a supertype rule makes the node in the alias match the supertype in name only and will not be treated as a supertype. For `alias($.foo, $.bar)` a query targeting `bar` will not transparently match the supertype's subtypes the way a query targeting `foo` would. 

# **Lexical Analysis** 

Tree-sitter's parsing process is divided into two phases: parsing (which is described above) and lexing — the process of grouping individual characters into the language's fundamental _tokens_ . There are a few important things to know about how Tree-sitter's lexing works. 

## **Conflicting Tokens** 

Grammars often contain multiple tokens that can match the same characters. For example, a grammar might contain the tokens ( `"if"` and `/[a-z]+/` ). Tree-sitter differentiates between these conflicting tokens in a few ways. 

1. **Context-aware Lexing** — Tree-sitter performs lexing on-demand, during the parsing process. At any given position in a source document, the lexer only tries to recognize 

 

Tree-sitter 

tokens that are _valid_ at that position in the document. 

2. **Lexical Precedence** — When the precedence functions described in the previous page are used _within_ the `token` function, the given explicit precedence values serve as instructions to the lexer. If there are two valid tokens that match the characters at a given position in the document, Tree-sitter will select the one with the higher precedence. 

3. **Match Length** — If multiple valid tokens with the same precedence match the characters at a given position in a document, Tree-sitter will select the token that matches the longest sequence of characters. 

4. **Match Specificity** — If there are two valid tokens with the same precedence, and they both match the same number of characters, Tree-sitter will prefer a token that is specified in the grammar as a `String` over a token specified as a `RegExp` . 

5. **Rule Order** — If none of the above criteria can be used to select one token over another, Tree-sitter will prefer the token that appears earlier in the grammar. 

If there is an external scanner it may have an additional impact over regular tokens defined in the grammar. 

## **Lexical Precedence vs. Parse Precedence** 

One common mistake involves not distinguishing _lexical precedence_ from _parse precedence_ . Parse precedence determines which rule is chosen to interpret a given sequence of tokens. _Lexical precedence_ determines which token is chosen to interpret at a given position of text, and it is a lower-level operation that is done first. The above list fully captures Tree-sitter's lexical precedence rules, and you will probably refer back to this section of the documentation more often than any other. Most of the time when you really get stuck, you're dealing with a lexical precedence problem. Pay particular attention to the difference in meaning between using `prec` inside the `token` function versus outside it. The _lexical precedence_ syntax, as mentioned in the previous page, is `token(prec(N, ...))` . 

## **Keywords** 

Many languages have a set of _keyword_ tokens (e.g. `if` , `for` , `return` ), as well as a more general token (e.g. `identifier` ) that matches any word, including many of the keyword strings. For example, JavaScript has a keyword `instanceof` , which is used as a binary operator, like this: 

```
if (a instanceof Something) b();
```

 

Tree-sitter 

The following, however, is not valid JavaScript: 

```
if (a instanceofSomething) b();
```

A keyword like `instanceof` cannot be followed immediately by another letter, because then it would be tokenized as an `identifier` , **even though an identifier is not valid at that position** . Because Tree-sitter uses context-aware lexing, as described above, it would not normally impose this restriction. By default, Tree-sitter would recognize `instanceofSomething` as two separate tokens: the `instanceof` keyword followed by an `identifier` . 

## **Keyword Extraction** 

Fortunately, Tree-sitter has a feature that allows you to fix this, so that you can match the behavior of other standard parsers: the `word` token. If you specify a `word` token in your grammar, Tree-sitter will find the set of _keyword_ tokens that match strings also matched by the `word` token. Then, during lexing, instead of matching each of these keywords individually, Tree-sitter will match the keywords via a two-step process where it _first_ matches the `word` token. 

For example, suppose we added `identifier` as the `word` token in our JavaScript grammar: 

 

Tree-sitter 

```
grammar({
name: "javascript",
word: $ => $.identifier,
rules: {
expression: $ =>
      choice(
        $.identifier,
        $.unary_expression,
        $.binary_expression,
// ...
      ),
binary_expression: $ =>
      choice(
        prec.left(1, seq($.expression, "instanceof", $.expression)),
// ...
      ),
unary_expression: $ =>
      choice(
        prec.left(2, seq("typeof", $.expression)),
// ...
      ),
identifier: $ => /[a-z_]+/,
  },
});
```

Tree-sitter would identify `typeof` and `instanceof` as keywords. Then, when parsing the invalid code above, rather than scanning for the `instanceof` token individually, it would scan for an `identifier` first, and find `instanceofSomething` . It would then correctly recognize the code as invalid. 

Aside from improving error detection, keyword extraction also has performance benefits. It allows Tree-sitter to generate a smaller, simpler lexing function, which means that **the parser will compile much more quickly** . 

#### **Note** 

The word token must be a unique token that is not reused by another rule. If you want to have a word token used in a rule that's called something else, you should just alias the word token instead, like how the Rust grammar does it here 

 

Tree-sitter 

# **External Scanners** 

Many languages have some tokens whose structure is impossible or inconvenient to describe with a regular expression. Some examples: 

- Indent and dedent tokens in Python 

- Heredocs in Bash and Ruby Percent strings in Ruby 

Tree-sitter allows you to handle these kinds of tokens using _external scanners_ . An external scanner is a set of C functions that you, the grammar author, can write by hand to add custom logic for recognizing certain tokens. 

To use an external scanner, there are a few steps. First, add an `externals` section to your grammar. This section should list the names of all of your external tokens. These names can then be used elsewhere in your grammar. 

```
grammar({
name: "my_language",
externals: $ => [$.indent, $.dedent, $.newline],
// ...
});
```

Then, add another C source file to your project. Its path must be src/scanner.c for the CLI to recognize it. 

`enum` In this new source file, define an type containing the names of all of your external tokens. The ordering of this enum must match the order in your grammar's `externals` array; the actual names do not matter. 

```
#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
enum TokenType {
  INDENT,
  DEDENT,
  NEWLINE
}
```

Finally, you must define five functions with specific names, based on your language's name and five actions: _create_ , _destroy_ , _serialize_ , _deserialize_ , and _scan_ . 

 

Tree-sitter 

## **Create** 

```
void * tree_sitter_my_language_external_scanner_create() {
// ...
}
```

This function should create your scanner object. It will only be called once anytime your language is set on a parser. Often, you will want to allocate memory on the heap and return a pointer to it. If your external scanner doesn't need to maintain any state, it's ok to return `NULL` . 

## **Destroy** 

```
voidtree_sitter_my_language_external_scanner_destroy(void *payload) {
// ...
}
```

This function should free any memory used by your scanner. It is called once when a parser is deleted or assigned a different language. It receives as an argument the same pointer that was returned from the _create_ function. If your _create_ function didn't allocate any memory, this function can be a no-op. 

## **Serialize** 

```
unsignedtree_sitter_my_language_external_scanner_serialize(
void *payload,
char *buffer
) {
// ...
}
```

This function should copy the complete state of your scanner into a given byte buffer, and return the number of bytes written. The function is called every time the external scanner successfully recognizes a token. It receives a pointer to your scanner and a pointer to a buffer. The maximum number of bytes that you can write is given by the 

`TREE_SITTER_SERIALIZATION_BUFFER_SIZE` constant, defined in the `tree_sitter/parser.h` header file. 

The data that this function writes will ultimately be stored in the syntax tree so that the scanner can be restored to the right state when handling edits or ambiguities. For your parser to work correctly, the `serialize` function must store its entire state, and 

 

Tree-sitter 

`deserialize` must restore the entire state. For good performance, you should design your scanner so that its state can be serialized as quickly and compactly as possible. 

## **Deserialize** 

```
voidtree_sitter_my_language_external_scanner_deserialize(
void *payload,
constchar *buffer,
unsigned length
) {
// ...
}
```

This function should _restore_ the state of your scanner based on the bytes that were previously written by the `serialize` function. It is called with a pointer to your scanner, a pointer to the buffer of bytes, and the number of bytes that should be read. It is good practice to explicitly erase your scanner state variables at the start of this function, before restoring their values from the byte buffer. 

## **Scan** 

Typically, one will 

- Call `lexer->advance` several times, if the characters are valid for the token being lexed. 

- Optionally, call `lexer->mark_end` to mark the end of the token, and "peek ahead" to check if the next character (or set of characters) invalidates the token. 

- Set `lexer->result_symbol` to the token type. 

- Return `true` from the scanning function, indicating that a token was successfully lexed. 

Tree-sitter will then push the resulting node to the parse stack, and the input position will remain where it reached at the point `lexer->mark_end` was called. 

```
booltree_sitter_my_language_external_scanner_scan(
void *payload,
  TSLexer *lexer,
constbool *valid_symbols
) {
// ...
}
```

 

Tree-sitter 

The second parameter to this function is the lexer, of type `TSLexer` . The `TSLexer` struct has the following fields: 

- int32_t lookahead — The current next character in the input stream, represented as 

- a 32-bit unicode code point. 

- TSSymbol result_symbol — The symbol that was recognized. Your scan function 

- should _assign_ to this field one of the values from the `TokenType` enum, described above. 

- void (*advance)(TSLexer *, bool skip) — A function for advancing to the next 

- character. If `skip` is `true` , the current character will be treated as skipped text and will not be included in the text range associated with tokens emitted by the external scanner. This is typically used before a token starts, such as when skipping leading whitespace. After a token has started, `skip` should generally be `false` . In particular, calling `advance(lexer, true)` after `mark_end` can affect the token's starting position and lead to incorrect or zero-length token ranges. 

- void (*mark_end)(TSLexer *) — A function for marking the end of the recognized 

- token. This allows matching tokens that require multiple characters of lookahead. By default, (if you don't call `mark_end` ), any character that you moved past using the `advance` function will be included in the size of the token. But once you call `mark_end` , 

- then any later calls to `advance` will _not_ increase the size of the returned token. You can call `mark_end` multiple times to increase the size of the token. 

- uint32_t (*get_column)(TSLexer *) — A function for querying the current column 

- position of the lexer. It returns the number of codepoints since the start of the current line. The codepoint position is recalculated on every call to this function by reading from the start of the line. 

- bool (*is_at_included_range_start)(const TSLexer *) — A function for checking 

- whether the parser has just skipped some characters in the document. When parsing an embedded document using the `ts_parser_set_included_ranges` function (described in the multi-language document section), the scanner may want to apply some special behavior when moving to a disjoint part of the document. For example, in EJS documents, the JavaScript parser uses this function to enable inserting automatic semicolon tokens in between the code directives, delimited by `<%` and `%>` . 

- bool (*eof)(const TSLexer *) — A function for determining whether the lexer is at `lookahead` will be `0` 

- the end of the file. The value of at the end of a file, but this function should be used instead of checking for that value because the `0` or "NUL" value is also a valid character that could be present in the file being parsed. 

The third argument to the `scan` function is an array of booleans that indicates which of external tokens are expected by the parser. You should only look for a given token if it is 

 

Tree-sitter 

valid according to this array. At the same time, you cannot backtrack, so you may need to combine certain pieces of logic. 

```
if (valid_symbols[INDENT] || valid_symbols[DEDENT]) {
```

```
// ... logic that is common to both `INDENT` and `DEDENT`
if (valid_symbols[INDENT]) {
// ... logic that is specific to `INDENT`
    lexer->result_symbol = INDENT;
returntrue;
  }
}
```

## **External Scanner Helpers** 

### **Allocator** 

Instead of using libc's `malloc` , `calloc` , `realloc` , and `free` , you should use the versions prefixed with `ts_` from `tree_sitter/alloc.h` . These macros can allow a potential consumer to override the default allocator with their own implementation, but by default will use the libc functions. 

As a consumer of the tree-sitter core library as well as any parser libraries that might use allocations, you can enable overriding the default allocator and have it use the same one as the library allocator, of which you can set with `ts_set_allocator` . To enable this overriding in scanners, you must compile them with the `TREE_SITTER_REUSE_ALLOCATOR` macro defined, and tree-sitter the library must be linked into your final app dynamically, since it needs to resolve the internal functions at runtime. If you are compiling an executable binary that uses the core library, but want to load parsers dynamically at runtime, then you will have to use a special linker flag on Unix. For non-Darwin systems, that would be `--dynamiclist` and for Darwin systems, that would be `-exported_symbols_list` . The CLI does exactly this, so you can use it as a reference (check out `cli/build.rs` ). 

For example, assuming you wanted to allocate 100 bytes for your scanner, you'd do so like the following example: 

 

Tree-sitter 

```
#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"
// ...
void* tree_sitter_my_language_external_scanner_create() {
return ts_calloc(100, 1); // or ts_malloc(100)
}
// ...
```

### **Arrays** 

If you need to use array-like types in your scanner, such as tracking a stack of indentations or tags, you should use the array macros from `tree_sitter/array.h` . 

There are quite a few of them provided for you, but here's how you could get started tracking some state. Check out the header itself for more detailed documentation. 

#### **Attention** 

Do not use any of the array functions or macros that are prefixed with an underscore and have comments saying that it is not what you are looking for. These are internal functions used as helpers by other macros that are public. They are not meant to be used directly, nor are they what you want. 

 

Tree-sitter 

```
#include "tree_sitter/parser.h"
#include "tree_sitter/array.h"
enum TokenType {
  INDENT,
  DEDENT,
  NEWLINE,
  STRING,
}
// Create the array in your create function
void* tree_sitter_my_language_external_scanner_create() {
return ts_calloc(1, sizeof(Array(int)));
// or if you want to zero out the memory yourself
  Array(int) *stack = ts_malloc(sizeof(Array(int)));
  array_init(&stack);
returnstack;
}
booltree_sitter_my_language_external_scanner_scan(
void *payload,
  TSLexer *lexer,
constbool *valid_symbols
) {
  Array(int) *stack = payload;
if (valid_symbols[INDENT]) {
    array_push(stack, lexer->get_column(lexer));
    lexer->result_symbol = INDENT;
returntrue;
  }
if (valid_symbols[DEDENT]) {
    array_pop(stack); // this returns the popped element by value, but we don't
need it
    lexer->result_symbol = DEDENT;
returntrue;
  }
// we can also use an array on the stack to keep track of a string
  Array(char) next_string = array_new();
if (valid_symbols[STRING] && lexer->lookahead == '"') {
    lexer->advance(lexer, false);
while (lexer->lookahead != '"' && lexer->lookahead != '\n' && !lexer-
>eof(lexer)) {
      array_push(&next_string, lexer->lookahead);
      lexer->advance(lexer, false);
    }
// assume we have some arbitrary constraint of not having more than 100
characters in a string
if (lexer->lookahead == '"' && next_string.size <= 100) {
      lexer->advance(lexer, false);
      lexer->result_symbol = STRING;
```

 

Tree-sitter 

```
returntrue;
    }
  }
returnfalse;
}
```

## **Other External Scanner Details** 

External scanners have priority over Tree-sitter's normal lexing process. When a token listed in the externals array is valid at a given position, the external scanner is called first. This makes external scanners a powerful way to override Tree-sitter's default lexing behavior, especially for cases that can't be handled with regular lexical rules, parsing, or dynamic precedence. 

During error recovery, Tree-sitter's first step is to call the external scanner's scan function with all tokens marked as valid. Your scanner should detect and handle this case appropriately. One simple approach is to add an unused "sentinel" token at the end of your externals array: 

```
{
name: "my_language",
externals: $ => [$.token1, $.token2, $.error_sentinel]
// ...
}
```

You can then check if this sentinel token is marked valid to determine if Tree-sitter is in error recovery mode. 

If you would rather not handle the error recovery case explicitly, the easiest way to "opt-out" and let tree-sitter's internal lexer handle it is to return `false` from your scan function when `valid_symbols` contains the error sentinel. 

```
booltree_sitter_my_language_external_scanner_scan(
void *payload,
  TSLexer *lexer,
constbool *valid_symbols
) {
if (valid_symbols[ERROR_SENTINEL]) {
returnfalse;
  }
// ...
}
```

When you include literal keywords in the externals array, for example: 

 

Tree-sitter 

```
externals: $ => ['if', 'then', 'else']
```

_those_ keywords will be tokenized by the external scanner whenever they appear in the grammar. 

This is equivalent to declaring named tokens and aliasing them: 

```
{
name: "my_language",
externals: $ => [$.if_keyword, $.then_keyword, $.else_keyword],
rules: {
// then using it in a rule like so:
if_statement: $ => seq(alias($.if_keyword, 'if'), ...),
// ...
  }
}
```

The tokenization process for external keywords works in two stages: 

1. The external scanner attempts to recognize the token first 

2. If the scanner returns true and sets a token, that token is used 

3. If the scanner returns false, Tree-sitter falls back to its internal lexer 

However, when you use rule references (like `$.if_keyword` ) in the externals array without defining the corresponding rules in the grammar, Tree-sitter cannot fall back to its internal lexer. In this case, the external scanner is solely responsible for recognizing these tokens. 

#### **Danger** 

- External scanners can easily create infinite loops 

- Be extremely careful when emitting zero-width tokens 

- Always use the `eof` function when looping through characters 

 

Tree-sitter 

# **Writing Tests** 

_test_ that describes how For each rule that you add to the grammar, you should first create a the syntax trees should look when parsing that rule. These tests are written using speciallyformatted text files in the `test/corpus/` directory within your parser's root folder. 

For example, you might have a file called `test/corpus/statements.txt` that contains a series of entries like this: 

```
==================
Return statements
==================
func x() int {
  return 1;
}
---
```

```
(source_file
  (function_definition
    (identifier)
    (parameter_list)
    (primitive_type)
    (block
      (return_statement (number)))))
```

- The **name** of each test is written between two lines containing only `=` (equal sign) characters. 

- Then the **input source code** is written, followed by a line containing three or more `-` (dash) characters. 

Then, the **expected output syntax tree** is written as an S-expression. The exact placement of whitespace in the S-expression doesn't matter, but ideally the syntax tree should be legible. 

#### **Tip** 

The S-expression does not show syntax nodes like `func` , `(` and `;` , which are expressed as strings and regexes in the grammar. It only shows the _named_ nodes, as described in this section of the page on parser usage. 

The expected output section can also _optionally_ show the _field names_ associated with each child node. To include field names in your tests, you write a node's field name followed by a colon, before the node itself in the S-expression: 

 

Tree-sitter 

```
(source_file
  (function_definition
    name: (identifier)
    parameters: (parameter_list)
    result: (primitive_type)
    body: (block
      (return_statement (number)))))
```

If your language's syntax conflicts with the `===` and `---` test separators, you can optionally add an arbitrary identical suffix (in the below example, `|||` ) to disambiguate them: 

```
==================|||
Basic module
==================|||
---- MODULE Test ----
increment(n) == n + 1
====
---|||
(source_file
  (module (identifier)
    (operator (identifier)
      (parameter_list (identifier))
      (plus (identifier_ref) (number)))))
```

`---` If your input contains lines (e.g. YAML document separators, Markdown thematic `---` breaks), the **longest** matching line is used as the divider between input and expected output. This means you can use a longer divider line to avoid ambiguity: 

```
==================
YAML document test
==================
---
key: value
------
(stream
  (document
    (block_mapping
      (block_mapping_pair
        key: (flow_node (plain_scalar))
        value: (flow_node (plain_scalar))))))
```

These tests are important. They serve as the parser's API documentation, and they can be run every time you change the grammar to verify that everything still parses correctly. 

 

Tree-sitter 

By default, the `tree-sitter test` command runs all the tests in your `test/corpus/` folder. To run a particular test, you can use the `-i` flag: 

```
tree-sitter test -i 'Return statements'
```

The recommendation is to be comprehensive in adding tests. If it's a visible node, add it to a test file in your `test/corpus` directory. It's typically a good idea to test all the permutations of each language construct. This increases test coverage, but doubly acquaints readers with a way to examine expected outputs and understand the "edges" of a language. 

#### **Tip** 

After modifying the grammar, you can run `tree-sitter test -u` to update all syntax trees in corpus files with current parser output. 

## **Attributes** 

Tests can be annotated with a few `attributes` . Attributes must be put in the header, below the test name, and start with a `:` . A couple of attributes also take in a parameter, which require the use of parenthesis. 

#### **Tip** 

If you'd like to supply in multiple parameters, e.g. to run tests on multiple platforms or to test multiple languages, you can repeat the attribute on a new line. 

The following attributes are available: 

- `:cst` - This attribute specifies that the expected output should be in the form of a CST 

- instead of the normal S-expression. This CST matches the format given by `parse -- cst` . 

- `:error` — This attribute will assert that the parse tree contains an error. It's useful to 

- just validate that a certain input is invalid without displaying the whole parse tree, as `---` 

- such you should omit the parse tree below the line. 

- `:fail-fast` — This attribute will stop the testing of additional cases if the test marked 

- with this attribute fails. 

- `:language(LANG)` — This attribute will run the tests using the parser for the specified 

- language. This is useful for multi-parser repos, such as XML and DTD, or Typescript and TSX. The default parser used will always be the first entry in the `grammars` field in the 

 

Tree-sitter 

`tree-sitter.json` config file, so having a way to pick a second or even third parser is useful. 

- `:platform(PLATFORM)` — This attribute specifies the platform on which the test should 

- run. It is useful to test platform-specific behavior (e.g. Windows newlines are different from Unix). This attribute must match up with Rust's `std::env::consts::OS` . 

- `:skip` — This attribute will skip the test when running `tree-sitter test` . This is 

- useful when you want to temporarily disable running a test without deleting it. 

Examples using attributes: 

```
=========================
```

```
Test that will be skipped
:skip
=========================
```

```
int main() {}
```

```
-------------------------
```

```
====================================
Test that will run on Linux or macOS
```

```
:platform(linux)
:platform(macos)
====================================
```

```
int main() {}
```

```
------------------------------------
```

```
========================================================================
```

```
Test that expects an error, and will fail fast if there's no parse error
:fail-fast
```

```
:error
```

```
========================================================================
```

```
int main ( {}
```

```
------------------------------------------------------------------------
```

```
=================================================
```

```
Test that will parse with both Typescript and TSX
:language(typescript)
:language(tsx)
```

```
=================================================
```

```
console.log('Hello, world!');
```

```
-------------------------------------------------
```

 

Tree-sitter 

### **Automatic Compilation** 

You might notice that the first time you run `tree-sitter test` after regenerating your parser, it takes some extra time. This is because Tree-sitter automatically compiles your C code into a dynamically-loadable library. It recompiles your parser as-needed whenever you update it by re-running `tree-sitter generate` , or whenever the external scanner file is changed. 

 

Tree-sitter 

# **Publishing your grammar** 

Once you feel that your parser is in a stable working state for consumers to use, you can publish it to various registries. It's strongly recommended to publish grammars to GitHub, crates.io (Rust), npm (JavaScript), and PyPI (Python) to make it easier for others to find and use your grammar. 

If your grammar is hosted on GitHub, you can make use of our reusable workflows to handle the publishing process for you. This action will automatically handle regenerating and publishing your grammar in CI, so long as you have the required tokens setup for the various registries. For an example of this workflow in action, see the Python grammar's GitHub 

## **From start to finish** 

To release a new grammar (or publish your first version), these are the steps you should follow: 

1. Bump your version to the desired version with `tree-sitter version` . For example, if you're releasing version `1.0.0` of your grammar, you'd run `tree-sitter version 1.0.0` . 

2. Commit the changes with `git commit -am "Release 1.0.0" (or however you like)` (ensure that your working directory is clean). 

3. Tag the commit with `git tag -- v1.0.0` . 

4. Push the commit and tag with `git push --tags origin main` (assuming you're on the `main` branch, and `origin` is your remote). 

5. (optional) If you've set up the GitHub workflows for your grammar, the release will be automatically published to GitHub, crates.io, npm, and PyPI. 

### **Adhering to Semantic Versioning** 

When releasing new versions of your grammar, it's important to adhere to Semantic Versioning. This ensures that consumers can predictably update their dependencies and that their existing tree-sitter integrations (queries, tree traversal code, node type checks) will continue to work as expected when upgrading. 

1. Increment the major version when you make incompatible changes to the grammar's node types or structure 

2. Increment the minor version when you add new node types or patterns while maintaining backward compatibility 

 

Tree-sitter 

3. Increment the patch version when you fix bugs without changing the grammar's structure 

For grammars in version 0.y.z (zero version), the usual semantic versioning rules are technically relaxed. However, if your grammar already has users, it's recommended to treat version changes more conservatively: 

- Treat patch version ( `z` ) changes as if they were minor version changes Treat minor version ( `y` ) changes as if they were major version changes 

This helps maintain stability for existing users during the pre-1.0 phase. By following these versioning guidelines, you ensure that downstream users can safely upgrade without their existing queries breaking. 

 
