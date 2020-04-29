# 每周总结可以写在这里
原生对象无法用js实现
Object
Function
Boolean
Symbol
Number
BigInt
Math
Date
String
RegExp
Error
AggregateError
EvalError
InternalError
RangeError
Array
Int8Array
Uint8Array
Uint8ClampedArray
Int16Array
Uint16Array
Int32Array
Map
Set
WeakMap
WeakSet

这些构造器创建的对象多数使用了私有字段, 例如：
Error: [[ErrorData]]
Boolean: [[BooleanData]]
Number: [[NumberData]]
Date: [[DateValue]]
RegExp: [[RegExpMatcher]]
Symbol: [[SymbolData]]
Map: [[MapData]]