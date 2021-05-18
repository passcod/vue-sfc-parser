[![CI status](https://github.com/passcod/vue-sfc-parser/actions/workflows/check.yml/badge.svg)](https://github.com/passcod/vue-sfc-parser/actions/workflows/check.yml)
[![Uses Caretaker Maintainership](https://flat.badgen.net/badge/Caretaker/Maintainership%20👥%20/purple)][caretaker]

Vue SFC Parser
==============

- [Dual-licensed][copyright] with Apache 2.0 and MIT.
- Uses [Caretaker Maintainership][caretaker].

[caretaker]: ./CARETAKERS.md
[copyright]: ./COPYRIGHT

Parses a Vue-style Single File Component in a limited fashion for further
post-processing, with no dependencies, suitable for use in a Service Worker
or other such constrained environment.

Parses only the top-level tags and provides their content as strings. Does
not prescribe any set of top-level tags, it will just parse everything. Also
supports HTML comments. Has some support for attributes on top-level tags,
such as for `<style scoped>` and `<script type="text/typescript">`. Supports
nested `<template>` tags (it will leave interior ones as string content but it
internally keeps track for proper parsing).

Does not support the string `</script>` inside a script tag, and similarly
for other tags. Just break it up e.g. `"<" + "/script>"` if you need to.


Install
-------

Via npm: `npm i https://github.com/passcod/vue-sfc-parser`.

Or download the relevant file(s) from the [`dist/`](./dist) folder.


Use
---

```js
// either
import parseSfc from '/path/to/sfc-parser.mjs';
// or
import parseSfc from '/path/to/sfc-parser.js';
// or
import parseSfc from 'vue-sfc-parser';
// or
require('sfc-parser.umd.min.js', (parser) => { ... });
// etc
```

```js
const file = `
<template>
    <div>Hello {{ name }}</div>
</template>

<script>
export default {
    data () {
        return {
            name: 'World',
        };
    },
}
</script>

<style>
div {
    font-weight: 500;
    text-decoration: overline red 2px;
}
</style>
`;

// throws on parse errors
const sfc = parseSfc(file);

assertEq(sfc.length, 3);
assertEq(sfc[0].tag, 'template');
assert(sfc[2].content.contains('overline'));
// or something more useful
```