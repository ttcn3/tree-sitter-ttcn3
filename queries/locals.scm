; TTCN-3 locals query for tree-sitter
; Defines local scopes and references for code navigation
; Spec: ETSI ES 201 873-1 V4.17.1

; --- Scope definitions ---
; Module is the top-level scope
(module) @local.scope

; Function/altstep/testcase/constructor bodies are local scopes
(func
  body: (_) @local.scope)
(external_function) @local.scope
(altstep
  body: (_) @local.scope)
(testcase
  body: (_) @local.scope)
(constructor
  body: (_) @local.scope)

; Control part is a scope for module-level definitions
(control) @local.scope

; Groups are scopes
(group
  (_) @local.scope)

; Block statements are local scopes
(block) @local.scope

; --- Definitions ---
; Type definitions (record/set/union fields, enumerated values, etc.)
(record_type
  (field
    name: (name) @local.definition))
(set_type
  (field
    name: (name) @local.definition))
(union_type
  (field
    name: (name) @local.definition))
(enumerated_type
  (enumerated_value
    name: (name) @local.definition))

; Variable / constant / timer declarations
(var_decl
  declarators: (declarator
    name: (name) @local.definition))
(const_decl
  declarators: (declarator
    name: (name) @local.definition))
(timer_decl
  declarators: (declarator
    name: (name) @local.definition))

; Port declarations
(port_decl
  declarators: (port_declarator
    name: (name) @local.definition))

; Module parameters
(module_parameter
  declarators: (declarator
    name: (name) @local.definition))

; Labels
(label_stmt
  (name) @local.definition)

; --- References ---
; Variable/constant/template/timer/port references
(reference) @local.reference
(port_ref) @local.reference
