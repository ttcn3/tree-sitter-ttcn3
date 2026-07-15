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

    // T1.5: `decmatch` is a 2-arg matching symbol that looks like a function call.
    // Conflicts with predefined_func_name (which also accepts 2-arg calls). GLR resolves.
    [$.decmatch, $.predefined_func_name],

    // S2.4: `port.send(t) to all component` — the `to all component` tail
    // could be either a `to_clause` ending the send_stmt, or a fresh
    // `reference` (since `all component` is aliased as `_identifier`).
    // GLR picks the to_clause interpretation.
    [$.reference, $.to_clause],

    // S2.4: same shape as to_clause — `port.receive(...) from any component`
    // could be a `from_clause` or a fresh reference. GLR resolves.
    [$.reference, $.from_clause],

    // S2.6: `comp.create(...)` overlaps with `reference . something`
    // at the dot. The look-ahead table can't tell whether the next token
    // starts a `create_stmt`, a `function_call_expression`, or another
    // dot-op. GLR picks based on what follows the `comp` identifier.
    [$.reference, $.create_stmt],
    // S2.6: `all component.stop` / `all component.kill` — the `all component`
    // tail could be a `reference` (via alias), a `stop_tc_stmt` body, or a
    // `kill_tc_stmt` body. Same syntactic shape, different semantics.
    [$.reference, $.stop_tc_stmt, $.kill_tc_stmt],
    // S2.8: `port.start` (S2.4) vs `timer.start(duration)` (S2.8).
    // Syntactically identical up to the next ';' / '('.
    [$.port_start_stmt, $.start_timer_stmt],
    // S2.8: 3-way `*.stop` — port, component-tc, and timer all have identical
    // shape `reference '.' 'stop'`. Distinguishable only by semantic context.
    [$.port_stop_stmt, $.stop_tc_stmt, $.stop_timer_stmt],
    // S2.8: `comp.running` (S2.6) vs `timer.running` (S2.8). Same syntactic shape.
    [$.running_stmt, $.running_timer_stmt],
    // S2.8: `comp.start(fn)` (S2.6) vs `timer.start(duration)` (S2.8). Both `ref.start(arg)`.
    [$.start_tc_stmt, $.start_timer_stmt],
    // S2.9: execute(...) — the `,` after actual_parameters could be the end of
    // the call or start of the optional timer/duration clauses. Tree-sitter
    // can't decide on linear lookahead; GLR tries both.
    [$.execute_stmt],
    // V1.1: `case (a, b) {...}` — multiple case-label expressions (spec Annex A
    // rule 590) overlap with optional trailing `;` between select clauses. GLR.
    [$.select_case_clause],
    // V1.2: `declarator [N]` — NR5GC uses `const integer tsc_Foo[75] := {...}`
    // for untyped array constants with embedded size hint. Strict TTCN-3 spec
    // wants `record length(75) of integer` instead, but NR5GC's notation is so
    // widespread that the grammar accepts it. The `[`, integer `N`, and `]`
    // overlap with index_expression after the declarator's _parameterized_name.
    [$.declarator],
    // V1.3: `record` token at start of a field type. `record_of_type` and
    // `nested_record_of_type` have identical BNF (record + optional length +
    // "of" + type) and the parser can't decide on linear lookahead whether a
    // top-level type definition or a nested-type-in-field follows. GLR.
    [$.record_of_type, $.nested_record_of_type],
    [$.set_of_type, $.nested_set_of_type],
    // TP3.9: 'pattern "X"' — the same shape appears in both the
    // subtype-constraint form `(pattern "X")` and the template-body matching
    // form `pattern "X"` (used inside template bodies). Distinguishable only
    // by surrounding context.
    [$.pattern_constraint, $.pattern_match],
    // TP3.8: 'modifier' is a choice of @abstract/@control/.../etc; 'template_modifier'
    // is a choice of ordered combos of @fuzzy/@deterministic/@abstract. The
    // lexer prefix '@' is identical; tree-sitter can't disambiguate without
    // seeing what comes after.
    [$.modifier, $.template_modifier],
    // TP3.1: 'map from T to T' starts both `type map ... Name;` (map_type) and
    // `record { map from T to T f; }` (nested_map_type as a field type).
    // Disambiguated only by what comes after 'to Type'.
    [$.map_type, $.nested_map_type],

    // Pre-existing conflicts: a `timer` or `port` declaration inside a
    // `control { }` block parses ambiguously as either another declaration
    // or as the continuation of the previous one (separated by `,`). GLR
    // picks the correct parse.
    [$.timer_decl],
    [$.port_decl],

    // Several predefined functions (ispresent, isbound, isvalue, ischosen)
    // share their name with the presence_check rule. Both are valid at the
    // same parse state; let GLR pick the right one.
    [$.presence_check, $.predefined_func_name],

    // `(expr)` parses as either `parenthesized_expression` or
    // `template_values` (a single-element tuple). Let GLR pick.
    [$.parenthesized_expression, $.template_values],
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
      field('modifiers', optional($.template_modifier)),
      $._parameterized_name,
      field('parameters', $.parameters),
      field('extends', optional(seq('extends', $.reference))),
      field('runs_on', optional(seq('runs', 'on', $.reference))),
      field('system', optional(seq('system', $.reference))),
      field('return_type', optional($.return_type)),
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
      field('super_class', optional(seq('extends', $.references))),
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
      field('pattern_constraint', optional($.pattern_constraint)),
      field('attributes', optional($.attributes)),
    ),

    pattern_constraint: $ => seq('(', 'pattern', field('pattern', $.charstring), ')'),

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
      field('is_optional', optional($.optional_modifier)),
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
      field('is_optional', optional($.optional_modifier)),
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
      field('declarators', sepBy1(',', $.port_declarator)),
      field('attributes', optional($.attributes)),
    ),

    port_declarator: $ => prec.left(seq(
      $._parameterized_name,
      field('array_dim', optional(seq('[', $._expression, ']'))),
      field('value', optional(seq(':=', $._expression))),
    )),

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
      field('modifiers', optional($.template_modifier)),
      field('type', optional($._parameterized_name)),
      $._parameterized_name,
      field('parameters', optional($.parameters)),
      field('modifies', optional($._modifies_spec)),
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
      field('body', repeat(seq($._statement, optional(';')))),
      '}',
      field('attributes', optional($.attributes)),
    ),

    import_definition: $ => seq(
      field('visibility', optional($.visibility)),
      'import',
      'from',
      field('module_id', $.reference),
      field('language_spec', optional($.language_spec)),
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

    // Expression precedence chain per TTCN-3 spec (Annex B.1.4 / B.5).
    // Order: or -> xor -> and -> not -> equal -> rel -> shift ->
    //        bit_or -> bit_xor -> bit_and -> bit_not -> add -> mul -> unary -> primary.
    // Each rule matches only with its operator; operands are `_expression`.
    _expression: $ => choice(
      $.or_expression,
      $.xor_expression,
      $.and_expression,
      $.not_expression,
      $.equal_expression,
      $.rel_expression,
      $.shift_expression,
      $.bit_or_expression,
      $.bit_xor_expression,
      $.bit_and_expression,
      $.bit_not_expression,
      $.add_expression,
      $.mul_expression,
      $.unary_expression,
      $.primary,
    ),

    or_expression: $ => prec.left(PREC.logical_or, seq(
      field('left', $._expression),
      field('operator', 'or'),
      field('right', $._expression),
    )),

    xor_expression: $ => prec.left(PREC.logical_xor, seq(
      field('left', $._expression),
      field('operator', 'xor'),
      field('right', $._expression),
    )),

    and_expression: $ => prec.left(PREC.logical_and, seq(
      field('left', $._expression),
      field('operator', 'and'),
      field('right', $._expression),
    )),

    not_expression: $ => prec.right(PREC.logical_not, seq(
      field('operator', 'not'),
      field('operand', $._expression),
    )),

    equal_expression: $ => prec.left(PREC.equality, seq(
      field('left', $._expression),
      field('operator', choice('==', '!=')),
      field('right', $._expression),
    )),

    rel_expression: $ => prec.left(PREC.relational, seq(
      field('left', $._expression),
      field('operator', choice('<', '>', '<=', '>=')),
      field('right', $._expression),
    )),

    shift_expression: $ => prec.left(PREC.shift, seq(
      field('left', $._expression),
      field('operator', choice('<<', '>>', '<@', '@>')),
      field('right', $._expression),
    )),

    bit_or_expression: $ => prec.left(PREC.bitwise_or, seq(
      field('left', $._expression),
      field('operator', 'or4b'),
      field('right', $._expression),
    )),

    bit_xor_expression: $ => prec.left(PREC.bitwise_xor, seq(
      field('left', $._expression),
      field('operator', 'xor4b'),
      field('right', $._expression),
    )),

    bit_and_expression: $ => prec.left(PREC.bitwise_and, seq(
      field('left', $._expression),
      field('operator', 'and4b'),
      field('right', $._expression),
    )),

    bit_not_expression: $ => prec.right(PREC.bitwise_not, seq(
      field('operator', 'not4b'),
      field('operand', $._expression),
    )),

    add_expression: $ => prec.left(PREC.additive, seq(
      field('left', $._expression),
      field('operator', choice('+', '-', '&')),
      field('right', $._expression),
    )),

    mul_expression: $ => prec.left(PREC.multiplicative, seq(
      field('left', $._expression),
      field('operator', choice('*', '/', 'mod', 'rem')),
      field('right', $._expression),
    )),

    unary_expression: $ => prec.right(PREC.unary, seq(
      field('operator', choice('+', '-', '!', '++', '--')),
      field('operand', $._expression),
    )),

    // Minus placeholder (spec A.1.5 / B.1.4): bare `-` is a complete
    // expression for uninitialized field/const/modulepar defaults. The
    // `prec(146, ...)` (one above PREC.unary) prevents a phantom
    // `unary_expression('-', <missing operand>)` from being chosen.
    primary: $ => choice(
      'null',
      'omit',
      prec(146, '-'),
      $.boolean_literal,
      $.verdict_literal,
      $.number,
      $.reserved_number,
      $.charstring,
      $.bitstring,
      $.hexstring,
      $.octetstring,
      $.template_values,
      $.composite_literal,
      $.compound_value,
      $.array_value,
      $.any_value,
      $.wildcard,
      $.ifpresent,
      $.length_attribute,
      $.range,
      $.complement,
      $.subset,
      $.superset,
      $.permutation,
      $.decmatch,
      $.pattern_match,
      $.function_literal,
      $.inline_template,
      alias('testcase', $._identifier),
      $.decoded_field_reference,
      $.parenthesized_expression,
      $.presence_check,
      $.predefined_func_call,
      $.reference,
    ),

    // ConstantExpression (Annex A.534): a stricter form of Expression
    // used in type lists, enum values, modulepars, and other contexts
    // where function calls and mutable variable references are forbidden.
    // The grammar can't enforce this; it produces a distinct AST node so
    // downstream tools can.
    constant_expression: $ => choice(
      $.unary_expression,
      'null',
      'omit',
      $.boolean_literal,
      $.verdict_literal,
      $.number,
      $.reserved_number,
      $.charstring,
      $.bitstring,
      $.hexstring,
      $.octetstring,
      $.composite_literal,
      seq('(', $.constant_expression, ')'),
      alias('testcase', $._identifier),
      $.constant_reference,
    ),

    // Reference to a constant. A grammar-level stand-in for "identifier
    // that resolves to a const declaration"; the actual distinction is
    // semantic.
    constant_reference: $ => $._identifier,

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    presence_check: $ => choice(
      seq(field('function', 'ispresent'), '(', field('operand', $._expression), ')'),
      seq(field('function', 'isbound'),   '(', field('operand', $._expression), ')'),
      seq(field('function', 'isvalue'),  '(', field('operand', $._expression), ')'),
      seq(field('function', 'ischosen'), '(', field('operand', $._expression), ',', field('variant', $._identifier), ')'),
    ),

    template_values: $ => seq(
      '(',
      sepBy1(',', $._expression),
      ')',
    ),

    composite_literal: $ => seq(
      '{', sepBy1(',', $._expression), '}',
    ),

    // Compound value (Annex B / A.527): assignment notation `{ field := expr, … }`.
    // Distinct from composite_literal (the list notation `{ expr, … }`).
    compound_value: $ => seq(
      '{',
      sepBy1(',', seq(
        field('field', $.name),
        field('value', optional(seq(':=', $._expression))),
        field('ifpresent', optional($.ifpresent)),
      )),
      '}',
    ),

    // Array value (spec A.526): list notation `[ expr, … ]` for record-of/set-of template bodies.
    // Distinct from `array_def` (single-dim `[ expr ]` for type definitions).
    array_value: $ => seq(
      '[', sepBy1(',', $._expression), ']',
    ),

    // Matching symbols (spec §15.7 / B.1). `*` conflicts with the multiply operator — precedence resolves it.
    any_value: _ => '?',
    wildcard: _ => '*',
    ifpresent: _ => 'ifpresent',
    length_attribute: $ => seq('length', '(', $._expression, ')'),
    // Range: `( expr .. expr )` — spec B.1.1. May conflict with template_values; GLR resolves.
    range: $ => seq('(', $._expression, '..', $._expression, ')'),
    // Remaining matching symbol function-like constructs (spec B.1.4–B.1.7).
    complement: $ => seq('complement', '(', $._expression, ')'),
    subset: $ => seq('subset', '(', $._expression, ')'),
    superset: $ => seq('superset', '(', $._expression, ')'),
    permutation: $ => seq('permutation', '(', $._expression, ')'),
    decmatch: $ => seq('decmatch', '(', $._expression, ',', $._expression, ')'),
    pattern_match: $ => seq('pattern', field('pattern', $.charstring)),

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
        field('arguments', $.actual_parameters),
        field('variadic', optional('...')),
      ),
      seq(
        field('function', seq('any', 'from')),
        field('arguments', alias($._identifier, $.reference))),
      seq(
        field('function', seq('all', 'from')),
        field('arguments', alias($._identifier, $.reference))), // TODO: use correct expressions instead of just identifier
    )),

    // Decoded field reference: `reference => Type`. Per TTCN-3 Annex A.560
    // this re-interprets an already-decoded bitstream field as the given
    // type. The right-hand side is a type reference, not an arbitrary
    // expression.
    decoded_field_reference: $ => prec(PREC.primary, seq(
      field('operand', $.reference),
      '=>',
      field('type', $.nested_type),
    )),

    // Predefined-function call (Annex C): a dedicated rule that matches
    // any of the ~40 standard function names plus allowing them to be
    // called like a regular function. Keeps the generic `reference`-then-
    // call path for user-defined functions.
    predefined_func_call: $ => prec(PREC.primary, seq(
      field('function', $.predefined_func_name),
      '(',
      field('arguments', sepBy(',', $._expression)),
      ')',
    )),

    predefined_func_name: _ => choice(
      'int2char', 'int2unichar', 'int2bit', 'int2enum', 'int2hex', 'int2oct',
      'bit2int', 'bit2hex', 'bit2oct', 'bit2str',
      'char2int', 'char2oct', 'oct2char', 'oct2bit', 'oct2int', 'oct2hex', 'oct2str',
      'hex2int', 'hex2oct', 'hex2bit', 'hex2str',
      'unichar2int', 'unichar2oct', 'oct2unichar',
      'lengthof', 'sizeof', 'ispresent', 'isbound', 'isvalue', 'ischosen',
      'match', 'valueof', 'decmatch', 'decvalue', 'encvalue', 'present',
      'replace', 'substr', 'regexp', 'str2int', 'float2int', 'int2float',
      'testcasename', 'hostid', 'get_stringencoding',
    ),

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
      ')',
    ),

    _boundary: $ => seq(
      field('exclusive', optional('!')),
      field('boundary', choice($.number, $.reserved_number, $.reference)),
    ),

    _parameterized_name: $ => seq(
      field('name', $.name),
      field('selectors', repeat(seq('.', $.name))),
      field('type_parameters', optional($.type_parameters)),
    ),

    // Derived template spec: `modifies BaseTemplate [(actual_params)]` (spec §15.2)
    _modifies_spec: $ => seq(
      'modifies',
      $._parameterized_name,
      field('arguments', optional(seq('(', sepBy(',', $._expression), ')'))),
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
      $.send_stmt,
      $.port_clear_stmt,
      $.port_start_stmt,
      $.port_stop_stmt,
      $.port_halt_stmt,
      $.checkstate_stmt,
      $.receive_stmt,
      $.trigger_stmt,
      $.getcall_stmt,
      $.getreply_stmt,
      $.catch_stmt,
      $.check_stmt,
      $.call_stmt,
      $.reply_stmt,
      $.raise_stmt,
      $.connect_stmt,
      $.map_stmt,
      $.disconnect_stmt,
      $.unmap_stmt,
      $.create_stmt,
      $.start_tc_stmt,
      $.stop_tc_stmt,
      $.kill_tc_stmt,
      $.done_stmt,
      $.killed_stmt,
      $.running_stmt,
      $.alive_stmt,
      $.activate_stmt,
      $.deactivate_stmt,
      $.repeat_stmt,
      $.start_timer_stmt,
      $.stop_timer_stmt,
      $.read_timer_stmt,
      $.running_timer_stmt,
      $.timeout_timer_stmt,
      $.testcase_stop_stmt,
      $.execute_stmt,
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
      $.setverdict_stmt,
      $.getverdict_stmt,
      $.log_stmt,
      $.action_stmt,
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

    assignment: $ => prec.left(choice(
      seq(
        field('left', $.reference),
        ':=',
        field('right', $._expression),
      ),
      // S2.3: rule 541 Assignment = ValueRef "++" | ValueRef "--"
      seq(field('left', $.reference), '++'),
      seq(field('left', $.reference), '--'),
    )),

    // S2.4: spec rule 313 SendStatement = ObjectReference Dot PortSendOp
    // PortSendOp = SendOpKeyword "(" TemplateInstance ")" [ToClause]
    send_stmt: $ => prec(1, seq(
      field('port', $.reference),
      '.',
      field('op', 'send'),
      field('arguments', $.actual_parameters),
      field('to', optional($.to_clause)),
    )),
    label_stmt: $ => seq('label', $.name),
    // S2.4: spec rule 316 ToClause = "to" (TemplateInstance | AddressRefList | "all" "component")
    to_clause: $ => seq('to', choice($._expression, seq('all', 'component'))),
    // S2.4: spec rule 383 ClearStatement = PortOrAll Dot ClearOpKeyword
    // S2.4: spec rule 386 StartStatement = PortOrAll Dot StartKeyword
    // S2.4: spec rule 387 StopStatement = PortOrAll Dot StopKeyword
    // S2.4: spec rule 389 HaltStatement = PortOrAll Dot HaltKeyword
    // These no-arg ops conflict with reference (port.start is a valid selector_expression).
    // prec(1) prefers the dedicated AST node.
    port_clear_stmt: $ => prec(1, seq(field('port', $.reference), '.', 'clear')),
    port_start_stmt: $ => prec(1, seq(field('port', $.reference), '.', 'start')),
    port_stop_stmt: $ => prec(1, seq(field('port', $.reference), '.', 'stop')),
    port_halt_stmt: $ => prec(1, seq(field('port', $.reference), '.', 'halt')),
    // S2.4: spec rule 392 CheckStateStatement = PortOrAllAny Dot CheckStateKeyword "(" SingleExpression ")"
    checkstate_stmt: $ => prec(1, seq(field('port', $.reference), '.', 'checkstate', '(', field('state', $._expression), ')')),
    // S2.4: spec rule 340 PortReceiveOp = ReceiveOpKeyword ["("TemplateInstance")"] [FromClause] [PortRedirect]
    // S2.4: spec rule 339 PortOrAny = ObjectReference | (AnyKeyword (PortKeyword | FromKeyword ValueRef))
    from_clause: $ => seq('from', choice($._expression, seq('any', 'component'))),
    port_redirect: $ => seq('->', field('target', $._expression)),
    receive_stmt: $ => prec(1, seq(
      field('port', $.reference),
      '.',
      field('op', 'receive'),
      field('template', optional(seq('(', $._expression, ')'))),
      field('from', optional($.from_clause)),
      field('redirect', optional($.port_redirect)),
    )),
    // S2.4: spec rule 351-370: trigger, getcall, getreply, catch all share
    // the same shape as receive (optional template, optional from, optional redirect).
    // Common TTCN-3 pattern - one rule suffices for the AST.
    trigger_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'trigger',
      field('template', optional(seq('(', $._expression, ')'))),
      field('from', optional($.from_clause)),
      field('redirect', optional($.port_redirect)),
    )),
    getcall_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'getcall',
      field('template', optional(seq('(', $._expression, ')'))),
      field('from', optional($.from_clause)),
      field('redirect', optional($.port_redirect)),
    )),
    getreply_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'getreply',
      field('template', optional(seq('(', $._expression, ')'))),
      field('from', optional($.from_clause)),
      field('redirect', optional($.port_redirect)),
    )),
    catch_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'catch',
      field('args', optional(seq('(', choice(
        seq(field('sig', $._expression), ',', field('template', $._expression)),
        field('sig', $._expression),
        'timeout',
      ), ')'))),
      field('from', optional($.from_clause)),
      field('redirect', optional($.port_redirect)),
    )),
    // S2.4: spec rule 372 CheckStatement = PortOrAny Dot PortCheckOp
    // PortCheckOp = CheckOpKeyword ["(" CheckParameter ")"]
    check_stmt: $ => prec(1, seq(field('port', $.reference), '.', 'check', field('args', optional($.actual_parameters)))),
    // S2.4: spec rule 319 CallStatement = ObjectReference Dot PortCallOp [PortCallBody]
    // PortCallOp = CallOpKeyword "(" CallParameters ")" [ToClause]
    // CallParameters = TemplateInstance ["," CallTimerValue] [","]
    // CallTimerValue = Expression | "nowait"
    call_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'call', '(',
      field('sig', $._expression), ',', field('value', $._expression),
      field('timer', optional(seq(',', choice($._expression, 'nowait')))),
      ')',
      field('to', optional($.to_clause)),
    )),
    // S2.4: spec rule 330 ReplyStatement = ObjectReference Dot PortReplyOp
    // PortReplyOp = ReplyKeyword "(" TemplateInstance [ReplyValue] ")" [ToClause]
    reply_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'reply', '(', field('template', $._expression), ')',
      field('to', optional($.to_clause)),
    )),
    // S2.4: spec rule 334 RaiseStatement = ObjectReference Dot PortRaiseOp
    // PortRaiseOp = RaiseKeyword "(" Signature "," TemplateInstance ")" [ToClause]
    raise_stmt: $ => prec(1, seq(
      field('port', $.reference), '.', 'raise', '(',
      field('sig', $._expression), ',', field('template', $._expression), ')',
      field('to', optional($.to_clause)),
    )),
    // S2.5: spec rule 290 PortRef = ComponentRef ":" ArrayIdentifierRef
    // ComponentRef = ObjectReference | "system" | SelfOp | "mtc"
    port_ref: $ => seq(field('component', $._identifier), ':', field('port_id', $._identifier)),
    // S2.5: spec rule 287 ConnectStatement = "connect" "(" PortRef "," PortRef ")"
    connect_stmt: $ => prec(1, seq('connect', '(', field('port_refs', $.port_ref), ',', field('port_refs', $.port_ref), ')')),
    // S2.5: spec rule 297 MapStatement = "map" "(" PortRef "," PortRef ")" ["param" ActualParList]
    map_stmt: $ => prec(1, seq(
      'map', '(', field('port_refs', $.port_ref), ',', field('port_refs', $.port_ref), ')',
      field('params', optional(seq('param', $.actual_parameters))),
    )),
    // S2.5: spec rule 292 DisconnectStatement = "disconnect" [SingleConnectionSpec | AllConnectionsSpec | AllPortsSpec | AllCompsAllPortsSpec]
    disconnect_stmt: $ => prec(1, seq('disconnect', field('target', optional(choice(
      seq('(', field('port_refs', $.port_ref), ',', field('port_refs', $.port_ref), ')'),
      seq('(', field('port_refs', $.port_ref), ')'),
      seq('(', field('component_ref', $._identifier), ':', 'all', 'port', ')'),
      seq('(', 'all', 'component', ':', 'all', 'port', ')'),
    ))))),
    // S2.5: spec rule 300 UnmapStatement = "unmap" [SingleConnectionSpec[ParamClause] | AllConnectionsSpec[ParamClause] | AllPortsSpec | AllCompsAllPortsSpec | "(" ValueRef "," SingleExpression ")"]
    unmap_stmt: $ => prec(1, seq('unmap', field('target', optional(choice(
      seq('(', field('port_refs', $.port_ref), ',', field('port_refs', $.port_ref), ')', field('params', optional(seq('param', $.actual_parameters)))),
      seq('(', field('port_refs', $.port_ref), ')', field('params', optional(seq('param', $.actual_parameters)))),
      seq('(', field('component_ref', $._identifier), ':', 'all', 'port', ')'),
      seq('(', 'all', 'component', ':', 'all', 'port', ')'),
      seq('(', field('value_ref', $._identifier), ',', field('expr', $._expression), ')'),
    ))))),
    // S2.6: spec rule 272 CreateOp = ComponentType "." "create" ["(" SingleExpression ["," SingleExpression] ")"] ["alive"]
    create_stmt: $ => seq(
      field('component_type', $._identifier), '.', 'create',
      field('args', optional(seq('(', choice($._expression, '-'), optional(seq(',', $._expression)), ')'))),
      field('alive', optional('alive')),
    ),
    // S2.6: spec rule 302 StartTCStatement = ObjectReference "." "start" "(" (FunctionInstance | AltstepInstance) ")"
    start_tc_stmt: $ => prec(1, seq(
      field('component', $.reference), '.', 'start', '(', field('callable', $._expression), ')',
    )),
    // S2.6: spec rule 304 StopTCStatement = "stop" | (ComponentReferenceOrLiteral | "all" "component") "." "stop"
    stop_tc_stmt: $ => seq(
      field('component', choice($.reference, seq('all', 'component'))), '.', 'stop',
    ),
    // S2.6: spec rule 306 KillTCStatement = "kill" | ((ComponentReferenceOrLiteral | "all" "component") "." "kill")
    kill_tc_stmt: $ => seq(
      field('component', choice($.reference, seq('all', 'component'))), '.', 'kill',
    ),
    // S2.6: spec rule 274 DoneStatement = ComponentOrAny "." "done" ["->" [ValueStoreSpec] [IndexSpec]]
    done_stmt: $ => prec(1, seq(field('component', $.reference), '.', 'done', field('redirect', optional($.port_redirect)))),
    // S2.6: spec rule 279 KilledStatement = same as DoneStatement but "killed"
    killed_stmt: $ => prec(1, seq(field('component', $.reference), '.', 'killed', field('redirect', optional($.port_redirect)))),
    // S2.6: spec rule 282 RunningOp = ComponentOrAny "." "running" [IndexAssignment]
    running_stmt: $ => prec(1, seq(field('component', $.reference), '.', 'running', field('redirect', optional($.port_redirect)))),
    // S2.6: spec rule 284 AliveOp = ComponentOrAny "." "alive" [IndexAssignment]
    alive_stmt: $ => prec(1, seq(field('component', $.reference), '.', 'alive', field('redirect', optional($.port_redirect)))),
    // S2.7: spec rule 520 ActivateOp = "activate" "(" AltstepInstance ")"
    // AltstepInstance = FunctionInstance | AltstepInstance (ref or expression)
    activate_stmt: $ => seq('activate', '(', field('altstep', $._expression), ')'),
    // S2.7: spec rule 522 DeactivateStatement = "deactivate" ["(" ObjectReference ")"]
    deactivate_stmt: $ => seq('deactivate', field('ref', optional(seq('(', $.reference, ')')))),
    // S2.7: spec rule 519 RepeatStatement = "repeat"
    repeat_stmt: $ => 'repeat',
    // S2.8: spec rule 397 StartTimerStatement = ObjectReference "." "start" ["(" Expression ")"]
    start_timer_stmt: $ => prec(1, seq(
      field('timer', $.reference), '.', 'start',
      field('duration', optional(seq('(', $._expression, ')'))),
    )),
    // S2.8: spec rule 398 StopTimerStatement = TimerRefOrAll "." "stop"
    stop_timer_stmt: $ => prec(1, seq(
      field('timer', choice($.reference, seq('all', 'timer'))), '.', 'stop',
    )),
    // S2.8: spec rule 400 ReadTimerOp = ObjectReference "." "read"
    read_timer_stmt: $ => prec(1, seq(field('timer', $.reference), '.', 'read')),
    // S2.8: spec rule 402 RunningTimerOp = TimerRefOrAny "." "running" [IndexAssignment]
    running_timer_stmt: $ => prec(1, seq(
      field('timer', choice($.reference, seq('any', 'timer'), seq('any', 'from', $._identifier))),
      '.', 'running', field('redirect', optional($.port_redirect)),
    )),
    // S2.8: spec rule 403 TimeoutStatement = TimerRefOrAny "." "timeout" [IndexAssignment]
    timeout_timer_stmt: $ => prec(1, seq(
      field('timer', choice($.reference, seq('any', 'timer'), seq('any', 'from', $._identifier))),
      '.', 'timeout', field('redirect', optional($.port_redirect)),
    )),
    // S2.9: spec rule 406 TestcaseOperation = "testcase" "." "stop" ["(" { LogItem [","] } ")"]
    testcase_stop_stmt: $ => seq(
      'testcase', '.', 'stop', field('log_args', optional(seq('(', sepBy(',', $._expression), ')'))),
    ),
    // S2.9: spec rule 196 TestcaseInstance = "execute" "(" ExtendedIdentifier "(" [ActualParList] ")" ["," ...] ")"
    execute_stmt: $ => seq(
      'execute', '(',
      field('testcase', $._identifier),
      field('call_args', $.actual_parameters),
      field('timer', optional(seq(',', field('timer_val', choice($._expression, '-'))))),
      field('duration', optional(seq(',', $._expression))),
      ')',
    ),
    goto_stmt: $ => seq('goto', $.name),
    break_stmt: $ => seq('break', optional($.name)),
    continue_stmt: $ => seq('continue', optional($.name)),
    return_stmt: $ => seq('return', optional($._expression)),
    // S2.1: spec rule 496 SetLocalVerdict = setverdict "(" SingleExpression {"," LogItem} [","] ")"
    setverdict_stmt: $ => seq(
      'setverdict', '(',
      field('verdict', $.verdict_literal),
      field('log_args', optional(seq(',', sepBy1(',', $._expression)))),
      ')',
    ),
    // S2.1: spec rule 498 GetLocalVerdict = "getverdict" (bare keyword, used as Expression)
    getverdict_stmt: $ => 'getverdict',
    // S2.2: spec rule 499 SUTStatements = action "(" ActionText {StringOp ActionText} ")"
    action_stmt: $ => seq('action', '(', sepBy1(',', $._expression), ')'),
    // S2.2: spec rule 569 LogStatement = log "(" LogItem {"," LogItem} [","] ")"
    log_stmt: $ => seq('log', '(', sepBy(',', $._expression), ')'),

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
      '{',
      field('clauses', repeat1($.select_clause)),
      '}',
    ),

    select_union_stmt: $ => seq(
      'select', 'union', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      '{',
      field('clauses', repeat1($.select_clause)),
      '}',
    ),

    select_class_stmt: $ => seq(
      'select', 'class', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      '{',
      field('clauses', repeat1($.select_clause)),
      '}',
    ),

    select_type_stmt: $ => seq(
      'select', 'type', '(',
      field('init', optional(seq($._init_stmt, ';'))),
      field('expression', $._expression),
      ')',
      '{',
      field('clauses', repeat1($.select_clause)),
      '}',
    ),

    select_clause: $ => choice(
      $.select_case_clause,
      $.select_else_clause,
    ),

    select_case_clause: $ => seq(
      'case', '(',
      field('expressions', sepBy1(',', $._expression)),
      optional(','),
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
      $.activate_stmt,
      $.deactivate_stmt,
      $.repeat_stmt,
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

    nested_type: $ => choice(
      $.reference,
      'anytype',
      prec(1, seq('universal', 'charstring')),
      $.nested_map_type,
      $.nested_record_of_type,
      $.nested_set_of_type,
    ),

    // Spec A.1.7.7 NestedRecordOfDef: "record" [StringLength] "of" TypeOrNestedTypeDef
    nested_record_of_type: $ => seq(
      'record', field('length_constraint', optional($.length_spec)), 'of', $.nested_type,
    ),
    // Spec A.1.7.7 NestedSetOfDef: "set" [StringLength] "of" TypeOrNestedTypeDef
    nested_set_of_type: $ => seq(
      'set', field('length_constraint', optional($.length_spec)), 'of', $.nested_type,
    ),

    // Spec A.26: NestedMapDef ::= "map" "from" Type "to" TypeOrNestedTypeDef.
    // Used as the type of a record/set/union field (no identifier follows the type).
    nested_map_type: $ => seq('map', 'from', $.nested_type, 'to', $.nested_type),

    port_attributes: $ => seq(
      '{',
      repeat(seq($._port_attribute, optional(';'))),
      '}',
    ),

    declarator: $ => seq(
      $._parameterized_name,
      field('array_dim', optional(seq('[', $._expression, ']'))),
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
      field('default', optional($.default_modifier)),
      field('type', $.nested_type),
      field('name', optional($.name)),
      field('array_def', optional($.array_def)),
      field('value_constraint', optional($.template_values)),
      field('length_constraint', optional($.length_spec)),
      field('is_optional', optional($.optional_modifier)),
    ),

    default_modifier: _ => '@default',
    optional_modifier: _ => 'optional',

    array_def: $ => repeat1(seq('[', $._expression, ']')),

    parameters: $ => seq(
      '(',
      sepBy(',', $.parameter),
      ')'
    ),

    // Actual parameter list: named assignments (`name := expr`) and positional expressions (spec A.1.6.8)
    actual_parameters: $ => seq(
      '(',
      sepBy(',', $.actual_parameter),
      ')'
    ),

    actual_parameter: $ => choice(
      field('named', seq($.name, ':=', $._expression)),
      $._expression,
    ),

    parameter: $ => seq(
      field('direction', optional(choice('in', 'out', 'inout'))),
      field('template_restriction', optional($.nested_template)),
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

    // Template/function modifier chain per spec §15: [ @fuzzy ] [ @deterministic ] [ @abstract ] in order.
    // Kept as a choice (not a seq of optionals) because tree-sitter rejects rules that match the empty string.
    // Generic `modifiers` is kept for other contexts where order doesn't matter.
    template_modifier: _ => choice(
      '@fuzzy',
      '@deterministic',
      '@abstract',
      seq('@fuzzy', '@deterministic'),
      seq('@fuzzy', '@abstract'),
      seq('@deterministic', '@abstract'),
      seq('@fuzzy', '@deterministic', '@abstract'),
    ),

    name: $ => $._identifier,

    visibility: _ => choice('public', 'private', 'friend'),

    _identifier: _ => /[a-zA-Z_]\w*/,

    modifier: _ => choice(
      '@abstract', '@control', '@decoded', '@default', '@deterministic',
      '@fuzzy', '@index', '@lazy', '@local', '@nocase', '@nodefault'
    ),

    boolean_literal: _ => choice('true', 'false'),
    verdict_literal: _ => choice('none', 'pass', 'inconc', 'fail', 'error'),
    bitstring: $ => /'([01*? ])+'(b|B)/,
    hexstring: $ => /'([0-9A-Fa-f*? ])+'(h|H)/,
    octetstring: $ => /'([0-9A-Fa-f*? ])+'(o|O)/,
    malformed_string: $ => /'[^']+'[a-zA-Z_]*/,

    number: _ => token(seq(/\d[\d_]*(\.\d[\d_]*)?/, optional(/[eE][+-]?\d[\d_]*/),)),

    reserved_number: _ => choice('infinity', 'not_a_number'),

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


