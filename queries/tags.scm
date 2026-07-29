; TTCN-3 tags query for tree-sitter
; Extracts definitions and references for code navigation
; Spec: ETSI ES 201 873-1 V4.17.1
;
; Note: function/altstep/testcase/constructor/template names are inside
; the hidden _parameterized_name rule, so we capture the whole node as
; the definition. The tool can extract the name from the node.

; --- Module definition ---
(module) @definition.module

; --- Group definition ---
(group) @definition.module

; --- Function definitions ---
(func) @definition.function
(external_function) @definition.function
(altstep) @definition.function
(testcase) @definition.function
(constructor) @definition.function

; --- Type definitions ---
(record_type) @definition.type
(set_type) @definition.type
(record_of_type) @definition.type
(set_of_type) @definition.type
(union_type) @definition.type
(enumerated_type) @definition.type
(map_type) @definition.type
(port_type) @definition.type
(component_type) @definition.type
(class_type) @definition.type
(function_type) @definition.type
(altstep_type) @definition.type
(testcase_type) @definition.type
(signature) @definition.type

; --- Variable / constant / template / timer / port declarations ---
(var_decl
  declarators: (declarator
    name: (name) @name) @definition.variable)

(const_decl
  declarators: (declarator
    name: (name) @name) @definition.constant)

(timer_decl
  declarators: (declarator
    name: (name) @name) @definition.variable)

(port_decl
  declarators: (port_declarator
    name: (name) @name) @definition.variable)

(template
  name: (name) @name) @definition.variable

(module_parameter
  declarators: (declarator
    name: (name) @name) @definition.variable)

; --- Field definitions in structured types ---
(record_type
  (field
    name: (name) @name) @definition.field)

(set_type
  (field
    name: (name) @name) @definition.field)

(union_type
  (field
    name: (name) @name) @definition.field)

; --- Enumerated values ---
(enumerated_type
  (enumerated_value
    name: (name) @name) @definition.constant)

; --- References ---
(reference) @name @reference

(port_ref) @name @reference
