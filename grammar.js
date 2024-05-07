const PREC = {
  primary: 150,
  unary: 145,
  multiplicative: 140,
  additive: 130,
  bitwise_not: 120,
  bitwise_and: 110,
  bitwise_xor: 100,
  bitwise_or: 90,
  shift: 80,
  relational: 70,
  equality: 60,
  logical_not: 50,
  logical_and: 40,
  logical_xor: 30,
  logical_or: 20,
};

module.exports = grammar({
  name: 'ttcn3',

  // This rule enforces that keyword tokens and identifiers must be separated
  // by whitespace.
  // See [Keyword Extraction](https://tree-sitter.github.io/tree-sitter/creating-parsers#keyword-extraction)
  word: $ => $._identifier,

  extras: $ => [
    $.comment,
    /[\s\u00A0\uFEFF\u3000]+/,
  ],

  conflicts: $ => [

    // The optional identifier token of an optional label (or expression)
    // conflicts with the identifier of a following statement, due to optional
    // semicolons.
    //
    // We could use precedence to resolve this conflict since a following
    // statement does not make any sense after a jump instruction. In case of
    // break and continue this could lead to spurious syntax errors.
    //
    //        break
    //        f()
    //
    //  Above code would be parsed as a break statement with label `f`,
    //  followed by an syntax error for the `()`.
    //
    //  We therefore let the GLR algorithm figure out the correct parse tree.
    [$.break_stmt],
    [$.continue_stmt],
    [$.return_stmt],

    // Constants and variables have a conflict between the optional type, name
    // and following expression statements, due to optional semicolons.
    [$.reference, $.name],
    [$.var_decl],
    [$.const_decl],
  ],

  rules: {

    // Modules are just definitions (like group definitions) and can also be
    // nested. This allows for a simpler grammar with more flexibility.
    //
    // At this moment I don't know if tree-sitter API allows for custom entry
    // points. Therefore we also source files to contain standalone
    // expressions. This makes it easier to parse module parameter values.
    source_file: $ => choice(repeat(seq($._definition, optional(';'))), $._expression),

    // For debugging purposes
    //source_file: $ => $._expression,
    //source_file: $ => repeat(seq($._definition, optional(';'))),

    _definition: $ => choice(
      $.altstep,
      $.altstep_type,
      $.class_type,
      $.component_type,
      $.configuration,
      $.const_decl,
      $.constructor,
      $.control,
      $.enumerated_type,
      $.external_function,
      $.friend,
      $.func,
      $.function_type,
      $.group,
      $.import_definition,
      $.map_type,
      $.mode_definition,
      $.module,
      $.module_parameter,
      $.port_type,
      $.record_of_type,
      $.record_type,
      $.set_of_type,
      $.set_type,
      $.signature,
      $.subtype,
      $.template,
      $.testcase,
      $.testcase_type,
      $.union_type,
      $.var_decl,
      $.timer_decl,
      $.port_decl,
    ),

    module: $ => seq(
      'module',
      $._parameterized_name,
      field('language_spec', optional($.language_spec)),
      $._definition_body,
      field('attributes', optional($.attributes)),
    ),

    group: $ => seq(
      field('visibility', optional($.visibility)),
      'group',
      $._parameterized_name,
      $._definition_body,
      field('attributes', optional($.attributes)),
    ),

    func: $ => seq(
      field('visibility', optional($.visibility)),
      'function',
      field('modifiers', optional($.modifiers)),
      $._parameterized_name,
      field('parameters', $.parameters),
      field('extends', optional(seq('extends', $.reference))),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('mtc', optional(seq('mtc', $.reference))),
      field('system', optional(seq('system', $.reference))),
      field('return_type', optional($.return_type)),
      field('exception', optional(seq('exception', '(', $.references, ')'))),
      field('body', optional($.block)),
      field('attributes', optional($.attributes)),
    ),

    external_function: $ => seq(
      field('visibility', optional($.visibility)),
      'external', 'function',
      field('modifiers', optional($.modifiers)),
      $._parameterized_name,
      field('extends', optional(seq('extends', $.reference))),
      field('parameters', $.parameters),
      field('extends', optional(seq('extends', $.reference))),
      field('return_type', optional($.return_type)),
      field('exception', optional(seq('exception', '(', $.references, ')'))),
      field('attributes', optional($.attributes)),
    ),

    altstep: $ => seq(
      field('visibility', optional($.visibility)),
      'altstep',
      field('modifiers', optional($.modifiers)),
      field('interleave', optional('interleave')),
      $._parameterized_name,
      field('parameters', $.parameters),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('mtc', optional(seq('mtc', $.reference))),
      field('system', optional(seq('system', $.reference))),
      field('exception', optional(seq('exception', '(', $.references, ')'))),
      field('body', optional($.block)),
      field('attributes', optional($.attributes)),
    ),

    testcase: $ => seq(
      field('visibility', optional($.visibility)),
      'testcase',
      $._parameterized_name,
      field('parameters', $.parameters),
      optional(choice(
        field('execute_on', seq('execute', 'on', $.reference)),
        field('runs_on', seq('runs', 'on', $.reference, optional(seq('system', $.reference)))),
      )),
      field('body', optional($.block)),
      field('attributes', optional($.attributes)),
    ),

    configuration: $ => seq(
      field('visibility', optional($.visibility)),
      'configuration',
      $._parameterized_name,
      field('parameters', $.parameters),
      field('runs_on', seq('runs', 'on', $.reference, optional(seq('system', $.reference)))),
      field('body', optional($.block)),
      field('attributes', optional($.attributes)),
    ),

    control: $ => seq(
      field('visibility', optional($.visibility)),
      'control',
      field('body', $.block),
      field('attributes', optional($.attributes)),
    ),

    altstep_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'altstep',
      $._parameterized_name,
      field('parameters', $.parameters),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('mtc', optional(seq('mtc', $.reference))),
      field('system', optional(seq('system', $.reference))),
      field('attributes', optional($.attributes)),
    ),

    testcase_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'testcase',
      $._parameterized_name,
      field('parameters', $.parameters),
      field('runs_on', seq('runs', 'on', $.reference, optional(seq('system', $.reference)))),
      field('attributes', optional($.attributes)),
    ),

    function_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'function',
      $._parameterized_name,
      field('parameters', $.parameters),
      field('extends', optional(seq('extends', $.reference))),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('mtc', optional(seq('mtc', $.reference))),
      field('system', optional(seq('system', $.reference))),
      field('return_type', optional($.return_type)),
      field('attributes', optional($.attributes)),
    ),

    class_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type',
      field('external', optional('external')),
      'class',
      field('modifiers', optional($.modifiers)),
      $._parameterized_name,
      field('super_class', optional(seq('extends', $.reference))),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('mtc', optional(seq('mtc', $.reference))),
      field('system', optional(seq('system', $.reference))),
      $._definition_body,
      field('destructor', optional(seq('finally', $.block))),
      field('attributes', optional($.attributes)),
    ),

    component_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'component',
      $._parameterized_name,
      field('extends', optional(seq('extends', $.references))),
      field('body', optional($.block)),
      field('attributes', optional($.attributes)),
    ),

    control: $ => seq(
      field('visibility', optional($.visibility)),
      'control',
      field('body', $.block),
      field('attributes', optional($.attributes)),
    ),

    constructor: $ => seq(
      field('visibility', optional($.visibility)),
      'constructor',
      field('parameters', $.parameters),
      field('superclass_constructor', optional(seq(':', $.reference, $.parameters))),
      field('body', optional($.block)),
      field('attributes', optional($.attributes)),
    ),

    subtype: $ => seq(
      field('visibility', optional($.visibility)),
      'type',
      field('super_type', $.nested_type),
      $._parameterized_name,
      field('value_constraint', optional($.template_values)),
      field('length_constraint', optional($.length_spec)),
      field('attributes', optional($.attributes)),
    ),

    record_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'record',
      $._parameterized_name,
      '{',
      field('fields', sepBy(',', $.field)),
      '}',
      field('attributes', optional($.attributes)),
    ),

    set_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'set',
      $._parameterized_name,
      '{',
      field('fields', sepBy(',', $.field)),
      '}',
      field('attributes', optional($.attributes)),
    ),

    record_of_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'record',
      field('length_constraint', optional($.length_spec)),
      'of',
      field('element_type', $.nested_type),
      $._parameterized_name,
      field('element_value_constraint', optional($.template_values)),
      field('element_length_constraint', optional($.length_spec)),
      field('attributes', optional($.attributes)),
    ),

    set_of_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'set',
      field('length_constraint', optional($.length_spec)),
      'of',
      field('element_type', $.nested_type),
      $._parameterized_name,
      field('element_value_constraint', optional($.template_values)),
      field('element_length_constraint', optional($.length_spec)),
      field('attributes', optional($.attributes)),
    ),

    union_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'union',
      $._parameterized_name,
      '{',
      field('fields', sepBy(',', $.field)),
      '}',
      field('attributes', optional($.attributes)),
    ),

    var_decl: $ => seq(
      field('visibility', optional($.visibility)),
      'var',
      field('template_restriction', optional($.nested_template)),
      field('type', optional($.nested_type)),
      field('declarators', sepBy1(',', $.declarator)),
      field('attributes', optional($.attributes)),
    ),

    timer_decl: $ => seq(
      field('visibility', optional($.visibility)),
      field('type', alias('timer', $.reference)),
      field('declarators', sepBy1(',', $.declarator)),
      field('attributes', optional($.attributes)),
    ),

    port_decl: $ => seq(
      field('visibility', optional($.visibility)),
      'port',
      field('type', $.nested_type),
      field('declarators', sepBy1(',', $.declarator)),
      field('attributes', optional($.attributes)),
    ),

    map_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'map',
      field('key_type', seq('from', $.nested_type)),
      field('value_type', seq('to', $.nested_type)),
      $._parameterized_name,
      field('attributes', optional($.attributes)),
    ),

    friend: $ => seq(
      field('private', optional('private')),
      'friend', 'module',
      $.references,
      field('attributes', optional($.attributes)),
    ),

    template: $ => seq(
      field('visibility', optional($.visibility)),
      'template',
      field('restriction', optional(seq('(', $.template_restriction, ')'))),
      field('modifiers', optional($.modifiers)),
      $.reference,
      $._parameterized_name,
      field('parameters', optional($.parameters)),
      field('modifies', optional(seq('modifies', $.reference))),
      ':=',
      $._expression,
      field('attributes', optional($.attributes)),
    ),

    enumerated_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'enumerated',
      $._parameterized_name,
      '{',
      field('values', sepBy(',', $.enumerated_value)),
      '}',
      field('attributes', optional($.attributes)),
    ),

    port_type: $ => seq(
      field('visibility', optional($.visibility)),
      'type', 'port',
      $._parameterized_name,
      field('map_to', optional(seq('map', 'to', $.references))),
      field('connect_to', optional(seq('connect', 'to', $.references))),
      field('kind', choice('procedure', 'message', 'stream', 'mixed')),
      field('realtime', optional('realtime')),
      field('port_attributes', optional($.port_attributes)),
      field('attributes', optional($.attributes)),
    ),

    signature: $ => seq(
      field('visibility', optional($.visibility)),
      'signature',
      $._parameterized_name,
      field('parameters', $.parameters),
      field('exception', optional(seq('exception', '(', $.references, ')'))),
      field('return_type', optional($.return_type)),
      field('attributes', optional($.attributes)),
    ),

    module_parameter: $ => seq(
      field('visibility', optional($.visibility)),
      'modulepar',
      field('template_restriction', optional($.nested_template)),
      field('type', optional($.nested_type)),
      field('declarators', sepBy1(',', $.declarator)),
      field('attributes', optional($.attributes)),
    ),


    const_decl: $ => seq(
      field('visibility', optional($.visibility)),
      'const',
      field('template_restriction', optional($.nested_template)),
      field('type', optional($.nested_type)),
      field('declarators', sepBy1(',', $.declarator)),
      field('attributes', optional($.attributes)),
    ),

    mode_definition: $ => seq(
      field('visibility', optional($.visibility)),
      'mode',
      $._parameterized_name,
      field('parameters', optional($.parameters)),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      '{',
      // TODO: Mode Spec
      '}',
      field('attributes', optional($.attributes)),
    ),

    import_definition: $ => seq(
      field('visibility', optional($.visibility)),
      'import',
      'from',
      field('module_id', $.reference),
      field('local_name', optional(seq('->', $.name))),
      field('body', $._import_body),
      field('attributes', optional($.attributes)),
    ),

    _import_body: $ => choice(
      seq('all', optional(seq('except', '{', repeat(seq($._except_spec, optional(';'))), '}'))),
      seq('{', repeat(seq($._import_spec, optional(';'))), '}'),
    ),

    _except_spec: $ => seq(
      field('kind', choice('group', 'type', 'template', 'const', 'testcase', 'altstep', 'function', 'signature', 'modulepar')),
      field('refs', choice($.references, 'all')),
    ),

    _import_spec: $ => choice(
      seq(
        field('kind', 'group'),
        sepBy1(',', seq($.reference,
          optional(seq('except', '{', repeat(seq($._except_spec, optional(';'))), '}'))))),
      seq(
        field('kind', choice('type', 'template', 'const', 'testcase', 'altstep', 'function', 'signature', 'modulepar', 'import')),
        choice(
          $.references,
          seq('all', optional(seq('except', $.references))),
        ),
      ),
    ),

    _expression: $ => choice(
      $.unary_expression,
      $.binary_expression,
      'null',
      'omit',
      '-',
      $.boolean_literal,
      $.verdict_literal,
      $.number,
      $.charstring,
      $.bitstring,
      $.hexstring,
      $.octetstring,
      $.template_values,
      $.composite_literal,
      $.function_literal,
      $.inline_template,
      alias('testcase', $._identifier),

      $.reference,
    ),

    unary_expression: $ => choice(
      prec.right(PREC.unary, seq(field('operator', choice('+', '-', '!', '++', '--')), field('operand', $._expression))),
      prec.right(PREC.bitwise_not, seq(field('operator', 'not4b'), field('operand', $._expression))),
      prec.right(PREC.logical_not, seq(field('operator', 'not'), field('operand', $._expression))),
    ),

    binary_expression: $ => choice(
      prec.left(PREC.primary, seq(
        field('left', $.reference),
        field('operator', '=>'),
        field('right', $._expression),
      )),
      prec.left(PREC.multiplicative, seq(
        field('left', $._expression),
        field('operator', choice('*', '/', 'mod', 'rem')),
        field('right', $._expression),
      )),
      prec.left(PREC.additive, seq(
        field('left', $._expression),
        field('operator', choice('+', '-', '&')),
        field('right', $._expression),
      )),
      prec.left(PREC.bitwise_and, seq(
        field('left', $._expression),
        field('operator', 'and4b'),
        field('right', $._expression),
      )),
      prec.left(PREC.bitwise_xor, seq(
        field('left', $._expression),
        field('operator', 'xor4b'),
        field('right', $._expression),
      )),
      prec.left(PREC.bitwise_or, seq(
        field('left', $._expression),
        field('operator', 'or4b'),
        field('right', $._expression),
      )),
      prec.left(PREC.shift, seq(
        field('left', $._expression),
        field('operator', choice('<<', '>>', '<@', '@>')),
        field('right', $._expression),
      )),
      prec.left(PREC.relational, seq(
        field('left', $._expression),
        field('operator', choice('<', '>', '<=', '>=')),
        field('right', $._expression),
      )),
      prec.left(PREC.equality, seq(
        field('left', $._expression),
        field('operator', choice('==', '!=')),
        field('right', $._expression),
      )),
      prec.left(PREC.logical_and, seq(
        field('left', $._expression),
        field('operator', 'and'),
        field('right', $._expression),
      )),
      prec.left(PREC.logical_xor, seq(
        field('left', $._expression),
        field('operator', 'xor'),
        field('right', $._expression),
      )),
      prec.left(PREC.logical_or, seq(
        field('left', $._expression),
        field('operator', 'or'),
        field('right', $._expression),
      )),
    ),

    template_values: $ => seq(
      '(',
      sepBy1(',', $._expression),
      ')',
    ),

    composite_literal: $ => seq(
      '{', sepBy1(',', $._expression), '}',
    ),

    function_literal: $ => seq(
      'function',
      field('modifiers', optional($.modifiers)),
      field('parameters', $.parameters),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('mtc', optional(seq('mtc', $.reference))),
      field('system', optional(seq('system', $.reference))),
      field('return_type', optional($.return_type)),
      field('exception', optional(seq('exception', '(', $.references, ')'))),
      field('body', $.block),
    ),

    inline_template: $ => seq($.reference, ':', $._expression),

    references: $ => sepBy1(',', $.reference),

    reference: $ => choice(
      $.type_instantiation_expression,
      $.selector_expression,
      $.index_expression,
      $.function_call_expression,
      $._identifier,
      alias('this', $._identifier),
      alias('self', $._identifier),
      alias('???', $._identifier),
      alias(seq('all', 'port'), $._identifier),
      alias(seq('any', 'port'), $._identifier),
      alias(seq('all', 'timer'), $._identifier),
      alias(seq('any', 'timer'), $._identifier),
      alias(seq('all', 'component'), $._identifier),
      alias(seq('any', 'component'), $._identifier),
    ),

    type_instantiation_expression: $ => prec(PREC.primary, seq(
      field('type', $._identifier),
      '<',
      sepBy(',', $.nested_type),
      '>',
    )),

    selector_expression: $ => prec.left(PREC.primary, seq(
      field('operand', $.reference),
      '.',
      field('field', $.reference),
    )),

    index_expression: $ => prec.left(PREC.primary, seq(
      field('operand', $.reference),
      '[',
      field('index', sepBy(',', $._expression)),
      ']',
    )),

    function_call_expression: $ => prec.left(PREC.primary, choice(
      seq(
        field('function', $.reference),
        '(',
        field('arguments', sepBy(',', $._expression)),
        field('variadic', optional('...')),
        ')'),
      seq(
        field('function', seq('any', 'from')),
        field('arguments', alias($._identifier, $.reference))),
      seq(
        field('function', seq('all', 'from')),
        field('arguments', alias($._identifier, $.reference))), // TODO: use correct expressions instead of just identifier
    )),

    redirection_expr: $ => seq(
      $.reference,
      '->',
      field('value', optional(seq('value', $._expression))),
      field('sender', optional(seq('sender', $._expression))),
      field('verdict', optional(seq('verdict', $._expression))),
      field('param', optional(seq('param', $._expression))),
      field('timestamp', optional(seq('timestamp', $._expression))),
      field('index', optional(seq('@index', 'value', $._expression))),
    ),

    length_spec: $ => seq(
      'length', '(',
      field('lower', optional(seq($._boundary, '..'))),
      field('upper', $._boundary),
    ),

    _boundary: $ => seq(
      field('exclusive', optional('!')),
      field('boundary', choice($.number, $.reference)),
    ),

    _parameterized_name: $ => seq(
      field('name', $.name),
      field('type_parameters', optional($.type_parameters)),
    ),

    _definition_body: $ => seq(
      '{',
      repeat(seq($._definition, optional(';'))),
      '}',
    ),

    block: $ => seq(
      field('body', $._basic_block),
      field('catches', repeat($.catch_clause)),
      field('finally', optional($.finally_clause)),
    ),

    _basic_block: $ => seq('{', repeat(seq($._statement, optional(';'))), '}'),
    catch_clause: $ => seq('catch', $._basic_block),
    finally_clause: $ => seq('finally', $._basic_block),

    _statement: $ => choice(
      $.block,
      $.reference,
      $.redirection_expr,
      $.assignment,
      $.var_decl,
      $.timer_decl,
      $.port_decl,
      $.const_decl,
      $.template,
      $.label_stmt,
      $.goto_stmt,
      $.break_stmt,
      $.continue_stmt,
      $.return_stmt,
      $.if_stmt,
      $.select_stmt,
      $.select_union_stmt,
      $.select_class_stmt,
      $.select_type_stmt,
      $.for_stmt,
      $.for_range_stmt,
      $.while_stmt,
      $.do_while_stmt,
      $.alt_stmt,
      $.interleave_stmt,
    ),

    _init_stmt: $ => choice(
      $.assignment,
      $.var_decl,
      $.timer_decl,
      $.port_decl,
      $.const_decl,
      $.template,
    ),

    assignment: $ => seq(
      field('left', $.reference),
      ':=',
      field('right', $._expression),
    ),

    label_stmt: $ => seq('label', $.name),
    goto_stmt: $ => seq('goto', $.name),
    break_stmt: $ => seq('break', optional($.name)),
    continue_stmt: $ => seq('continue', optional($.name)),
    return_stmt: $ => seq('return', optional($._expression)),

    if_stmt: $ => seq(
      'if', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('condition', $._expression),
      ')',
      field('then', $.block),
      field('else', optional(seq('else', choice($.if_stmt, $.block)))),
    ),

    for_stmt: $ => seq(
      'for', '(',
      field('init', optional($._init_stmt)),
      ';',
      field('condition', optional($._expression)),
      ';',
      field('post', optional($._statement)),
      ')',
      field('body', $.block),
    ),

    for_range_stmt: $ => seq(
      'for', '(',
      field('iterator', seq(optional(choice('var', 'const')), $.name)),
      'in',
      field('range', $._expression),
      ')',
      field('body', $.block),
    ),

    while_stmt: $ => seq(
      'while', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('condition', $._expression),
      ')',
      field('body', $.block),
    ),

    do_while_stmt: $ => seq(
      'do',
      field('body', $.block),
      'while', '(',
      field('condition', $._expression),
      ')',
    ),

    select_stmt: $ => seq(
      'select', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      field('clauses', repeat1($.select_clause)),
    ),

    select_union_stmt: $ => seq(
      'select', 'union', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      field('clauses', repeat1($.select_clause)),
    ),

    select_class_stmt: $ => seq(
      'select', 'class', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      field('clauses', repeat1($.select_clause)),
    ),

    select_type_stmt: $ => seq(
      'select', 'type', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      field('clauses', repeat1($.select_clause)),
    ),

    select_clause: $ => choice(
      $.select_case_clause,
      $.select_else_clause,
    ),

    select_case_clause: $ => seq(
      'case', '(',
      field('expression', $._expression),
      ')',
      field('body', $.block),
    ),

    select_else_clause: $ => seq(
      'case', 'else',
      field('body', $.block),
    ),

    alt_stmt: $ => seq(
      'alt',
      field('nodefault', optional('@nodefault')),
      field('body', $.alt_block),
    ),

    interleave_stmt: $ => seq(
      'interleave',
      field('nodefault', optional('@nodefault')),
      field('body', $.alt_block),
    ),

    alt_block: $ => seq(
      field('body', $._basic_alt_block),
      field('catches', repeat($.catch_clause)),
      field('finally', optional($.finally_clause)),
    ),

    _basic_alt_block: $ => seq('{', repeat(seq(choice(
      $.var_decl,
      $.timer_decl,
      $.port_decl,
      $.const_decl,
      $.template,
      $.guarded_stmt,
      $.guarded_else_stmt,
    ), optional(';'))), '}'),

    guarded_stmt: $ => seq(
      '[',
      field('condition', $._expression),
      ']',
      field('stmt', $._communication_stmt),
      field('body', optional($.block)),
    ),

    _communication_stmt: $ => choice(
      $.reference,
      $.redirection_expr,
    ),

    guarded_else_stmt: $ => seq(
      '[', 'else', ']',
      field('body', $.block),
    ),

    nested_type: $ => $.reference,

    port_attributes: $ => seq(
      '{',
      repeat(seq($._port_attribute, optional(';'))),
      '}',
    ),

    declarator: $ => seq(
      $._parameterized_name,
      field('value', optional(seq(':=', $._expression))),
    ),

    _port_attribute: $ => choice(
      $.var_decl,
      $.const_decl,
      $.port_address,
      $.port_map_param,
      $.port_unmap_param,
      $.port_message_types,
    ),

    port_address: $ => seq(
      'address',
      $._port_translatation_spec,
    ),

    port_map_param: $ => seq(
      'map', 'param',
      field('parameters', $.parameters),
    ),

    port_unmap_param: $ => seq(
      'unmap', 'param',
      field('parameters', $.parameters),
    ),

    port_message_types: $ => seq(
      field('direction', choice('in', 'out', 'inout')),
      field('messages', sepBy1(',', $._port_translatation_spec)),
    ),

    _port_translatation_spec: $ => seq(
      field('type', $.reference),
      field('translate', optional(seq(
        field('direction', choice('from', 'to')),
        field('outer_type', $.reference),
        'with',
        field('translator', $.reference),
        '(', ')',))),
    ),

    attributes: $ => seq(
      'with', '{', repeat(seq($.attribute, optional(';'))), '}'
    ),

    attribute: $ => seq(
      field('kind', choice('extension', 'encode', 'variant', 'display', 'optional')),
      field('modifier', optional(choice('override', '@local'))),
      field('specifier', optional(seq('(', sepBy1(',',
        seq($.reference, optional(seq('except', '{', $.references, '}')))), ')'))),
      field('encodings', optional(seq('{', sepBy1(',', $.charstring), '}'))),
      field('value', $.charstring),
    ),

    enumerated_value: $ => seq(
      field('name', $.name),
      field('value', optional(seq('(', sepBy1(',', $._expression), ')'))),
    ),

    field: $ => seq(
      field('default', optional('@default')),
      field('type', $.nested_type),
      field('name', optional($.name)),
      field('array_def', optional($.array_def)),
      field('value_constraint', optional($.template_values)),
      field('length_constraint', optional($.length_spec)),
      field('optional', optional('optional')),
    ),

    array_def: $ => repeat1(seq('[', $._expression, ']')),

    parameters: $ => seq(
      '(',
      sepBy(',', $.parameter),
      ')'
    ),

    parameter: $ => seq(
      field('direction', optional(choice('in', 'out', 'inout'))),
      field('type', $.nested_type),
      field('name', $.name),
      field('array_def', optional($.array_def)),
      field('variadic', optional('...')),
      field('default', optional(seq(':=', $._expression))),
    ),

    type_parameters: $ => seq(
      '<',
      sepBy(',', $.type_parameter),
      '>',
    ),

    type_parameter: $ => seq(
      'in',
      field('type', choice(
        $.nested_type,
        alias('type', $._identifier),
        alias('signature', $._identifier),
      )),
      field('name', $.name),
      field('default', optional(seq(':=', $.nested_type))),
    ),

    language_spec: $ => seq(
      'language', sepBy1(',', $.charstring),
    ),

    return_type: $ => seq(
      'return',
      field('template_restriction', optional($.nested_template)),
      field('type', $.nested_type),  // NOTE: Nested types support ArrayDef due to index_expression in reference
    ),

    nested_template: $ => choice(
      seq("template", optional(seq('(', $.template_restriction, ')'))),
      $.template_restriction
    ),

    template_restriction: _ => choice("omit", "value", "present"),

    modifiers: $ => repeat1($.modifier),

    name: $ => $._identifier,

    visibility: _ => choice('public', 'private', 'friend'),

    _identifier: _ => /[a-zA-Z_]\w*/,

    modifier: _ => /@\w+/,

    boolean_literal: _ => choice('true', 'false'),
    verdict_literal: _ => choice('none', 'pass', 'inconc', 'fail', 'error'),
    bitstring: $ => /'([01*? ])+'(b|B)/,
    hexstring: $ => /'([0..9A-Fa-f*? ])+'(h|H)/,
    octetstring: $ => /'([0..9A-Fa-f*? ])+'(o|O)/,
    malformed_string: $ => /'[^']+'[a-zA-Z_]*/,

    number: _ => token(seq(/\d+(\.\d+)?/, optional(/[eE][+-]?[0-9][0-9_]*/),)),

    charstring: _ => /\"(\\.|\"\"|[^\"])*\"/,
    comment: $ => token(choice(
      seq('//', /[^\n\r]*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/'
      )
    )),


  }
});

function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule))
}

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)), optional(sep))
}


