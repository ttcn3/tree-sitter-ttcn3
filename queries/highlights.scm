; TTCN-3 syntax highlighting for tree-sitter
; Spec: ETSI ES 201 873-1 V4.17.1
; Keywords auto-highlighted via word extraction in grammar.js

; --- Comments & literals ---
(comment) @comment
(charstring) @string
(bitstring) @string
(boolean_literal) @boolean
(number) @number

; --- Module & imports ---
(module) @namespace
(group) @namespace
(configuration) @namespace
(control) @keyword.control
(module_parameter) @variable.definition
(import_definition) @include
(friend) @include

; --- Type definitions ---
(record_type) @type.definition
(set_type) @type.definition
(record_of_type) @type.definition
(set_of_type) @type.definition
(nested_record_of_type) @type.definition
(nested_set_of_type) @type.definition
(union_type) @type.definition
(enumerated_type) @type.definition
(array_def) @type.definition
(map_type) @type.definition
(nested_map_type) @type.definition
(port_type) @type.definition
(component_type) @type.definition
(class_type) @type.definition
(function_type) @type.definition
(altstep_type) @type.definition
(testcase_type) @type.definition
(subtype) @type.definition
(nested_type) @type.definition

; --- Type references ---
(type_parameter) @type
(type_parameters) @type
(type_instantiation_expression) @type

; --- Functions ---
(external_function) @function.definition
(altstep) @function.definition
(testcase) @function.definition
(constructor) @function.definition
(function_literal) @function.definition
(function_call_expression) @function.call

; --- Declarations ---
(var_decl) @variable.definition
(const_decl) @variable.definition
(timer_decl) @variable.definition
(port_decl) @variable.definition
(port_declarator) @variable.definition
(declarator) @variable.definition

; --- References ---
(name) @variable
(reference) @variable
(port_ref) @variable
(field) @property

; --- Template body ---
(compound_value) @string.special
(composite_literal) @string.special
(array_value) @string.special
(template_values) @string.special
(permutation) @string.special
(pattern_constraint) @string.special
(pattern_match) @string.special
(nested_template) @string.special
(inline_template) @string.special
(decmatch) @string.special
(any_value) @string.special

; --- Attributes ---
(attribute) @attribute
(attributes) @attribute
(modifiers) @attribute
(default_modifier) @attribute

; --- Control flow ---
(assignment) @variable
(if_stmt) @conditional
(select_stmt) @conditional
(select_type_stmt) @conditional
(select_class_stmt) @conditional
(for_stmt) @repeat
(for_range_stmt) @repeat
(while_stmt) @repeat
(do_while_stmt) @repeat
(alt_stmt) @conditional
(alt_block) @conditional
(interleave_stmt) @conditional
(guarded_stmt) @conditional
(break_stmt) @keyword.control
(continue_stmt) @keyword.control
(return_stmt) @keyword.control
(goto_stmt) @keyword.control
(label_stmt) @label
(log_stmt) @function.call
(setverdict_stmt) @function.call
(block) @keyword.control
(action_stmt) @function.call

; --- Communication ---
(send_stmt) @function.call
(receive_stmt) @function.call
(trigger_stmt) @function.call
(getcall_stmt) @function.call
(reply_stmt) @function.call
(getreply_stmt) @function.call
(raise_stmt) @function.call
(catch_clause) @function.call
(check_stmt) @function.call
(port_start_stmt) @function.call
(port_halt_stmt) @function.call
(checkstate_stmt) @function.call

; --- Configuration ---
(connect_stmt) @function.call
(map_stmt) @function.call
(disconnect_stmt) @function.call
(unmap_stmt) @function.call
(create_stmt) @function.call
(alive_stmt) @function.call
(running_stmt) @function.call
(done_stmt) @function.call
(killed_stmt) @function.call
(execute_stmt) @function.call

; --- Default handling ---
(activate_stmt) @function.call
(deactivate_stmt) @function.call

; --- Verdict ---

; --- Expressions ---
(add_expression) @operator
(mul_expression) @operator
(and_expression) @operator
(or_expression) @operator
(xor_expression) @operator
(not_expression) @operator
(rel_expression) @operator
(equal_expression) @operator
(shift_expression) @operator
(bit_and_expression) @operator
(bit_or_expression) @operator
(bit_xor_expression) @operator
(bit_not_expression) @operator
(complement) @operator
(unary_expression) @operator
