import parser from './sfc-parser.mjs';
import test from 'tape';

test('template only', (t) => {
  t.plan(1);

  const input = `
<template>
  <span>Hello {{ name }}</span>
</template>`;

  const expected = [
    { tag: 'template', content: '\n  <span>Hello {{ name }}</span>\n' },
  ];

  t.same(parser(input), expected);
});

test('template and script', (t) => {
  t.plan(1);

  const input = `
<template>
  <span>Hello {{ name }}</span>
</template>

<script>
export default {
  data () {
    return { name: 'world' };
  }
}
</script>
    `;

  const expected = [
    { tag: 'template', content: '\n  <span>Hello {{ name }}</span>\n' },
    { tag: 'script', content: '\nexport default {\n  data () {\n    return { name: \'world\' };\n  }\n}\n' },
  ];

  t.same(parser(input), expected);
});

test('template and script and style', (t) => {
  t.plan(1);

  const input = `
<template>
  <span>Hello {{ name }}</span>
</template>

<script>
export default {
  data () {
    return { name: 'world' };
  }
}
</script>

<style>
span { color: red; }
</style>
    `;

  const expected = [
    { tag: 'template', content: '\n  <span>Hello {{ name }}</span>\n' },
    { tag: 'script', content: '\nexport default {\n  data () {\n    return { name: \'world\' };\n  }\n}\n' },
    { tag: 'style', content: '\nspan { color: red; }\n' },
  ];

  t.same(parser(input), expected);
});

test('nested template', (t) => {
  t.plan(1);

  const input = `
<template>
  <span>
    Hello
    <template>{{ name }}</template>
  </span>
</template>
    `;

  const expected = [
    { tag: 'template', content: '\n  <span>\n    Hello\n    <template>{{ name }}</template>\n  </span>\n' },
  ];

  t.same(parser(input), expected);
});

test('script with double-quoted type', (t) => {
  t.plan(1);

  const input = `
<script type="text/typescript">
export default {
  methods: {
    foo (bar: string) {}
  }
}
</script>
    `;

  const expected = [
    { tag: 'script', content: '\nexport default {\n  methods: {\n    foo (bar: string) {}\n  }\n}\n', attrs: { type: 'text/typescript' } },
  ];

  t.same(parser(input), expected);
});

test('script with single-quoted type', (t) => {
  t.plan(1);

  const input = `
<script type='text/typescript'>
export default {
  methods: {
    foo (bar: string) {}
  }
}
</script>
    `;

  const expected = [
    { tag: 'script', content: '\nexport default {\n  methods: {\n    foo (bar: string) {}\n  }\n}\n', attrs: { type: 'text/typescript' } },
  ];

  t.same(parser(input), expected);
});

test('script with unquoted type', (t) => {
  t.plan(1);

  const input = `
<script type=text/typescript>
export default {
  methods: {
    foo (bar: string) {}
  }
}
</script>
    `;

  const expected = [
    { tag: 'script', content: '\nexport default {\n  methods: {\n    foo (bar: string) {}\n  }\n}\n', attrs: { type: 'text/typescript' } },
  ];

  t.same(parser(input), expected);
});

test('nested template with inner attribute', (t) => {
  t.plan(1);

  const input = `
<template>
  <span>
    Hello
    <template class="nevermind that this is invalid vue">{{ name }}</template>
  </span>
</template>
    `;

  const expected = [
    { tag: 'template', content: '\n  <span>\n    Hello\n    <template class="nevermind that this is invalid vue">{{ name }}</template>\n  </span>\n' },
  ];

  t.same(parser(input), expected);
});

test('style with scoped', (t) => {
  t.plan(1);

  const input = `
<style scoped>
.red { text-decoration: overline red; }
</style>
    `;

  const expected = [
    { tag: 'style', content: '\n.red { text-decoration: overline red; }\n', attrs: { scoped: 'scoped' } },
  ];

  t.same(parser(input), expected);
});

test('template with lots of spans', (t) => {
  t.plan(1);

  const input = `
<template>
  <div>${'<span>one</span>'.repeat(99)}</div>
</template>
    `;

  const expected = [
    { tag: 'template', content: `\n  <div>${'<span>one</span>'.repeat(99)}</div>\n` },
  ];

  t.same(parser(input), expected);
});

test('mutiple scripts and styles', (t) => {
  t.plan(1);

  const input = `
<style>.font { color: red; }</style>

<template>
  <div>Hello</div>
</template>

<script>
export default {}
</script>

<style scoped>
</style>

<script>
function foo () {}
</script>
    `;

  const expected = [
    { tag: 'style', content: `.font { color: red; }` },
    { tag: 'template', content: `\n  <div>Hello</div>\n` },
    { tag: 'script', content: `\nexport default {}\n` },
    { tag: 'style', content: `\n`, attrs: { scoped: 'scoped' } },
    { tag: 'script', content: `\nfunction foo () {}\n`, },
  ];

  t.same(parser(input), expected);
});

test('template with nested self closing tag', (t) => {
  t.plan(1);

  const input = `
<template>
<meta charset="UTF-8" />
</template>
    `;

  const expected = [
    { tag: 'template', content: `\n<meta charset="UTF-8" />\n` },
  ];

  t.same(parser(input), expected);
});

test('template with nested unclosed tag', (t) => {
  t.plan(1);

  const input = `
<template>
<ul>
  <li>Liv is livid.
</ul>
</template>
    `;

  const expected = [
    { tag: 'template', content: `\n<ul>\n  <li>Liv is livid.\n</ul>\n` },
  ];

  t.same(parser(input), expected);
});

test('template with nested JS expression', (t) => {
  t.plan(1);

  const input = `
<template>
<p v-if="1 > 2 || 4 << 6">Nope</p>
</template>
    `;

  const expected = [
    { tag: 'template', content: `\n<p v-if="1 > 2 || 4 << 6">Nope</p>\n` },
  ];

  t.same(parser(input), expected);
});

test('mutiple scripts and comments', (t) => {
  t.plan(1);

  const input = `
<script>
export default {}
</script>

<!-- helper foo: -->

<script>
function foo () {}
</script>
    `;

  const expected = [
    { tag: 'script', content: `\nexport default {}\n` },
    { tag: 'script', content: `\nfunction foo () {}\n`, },
  ];

  t.same(parser(input), expected);
});

test('only comment', (t) => {
  t.plan(1);

  const input = `
<!-- placeholder -->
    `;

  const expected = [];

  t.same(parser(input), expected);
});

test('empty comment', (t) => {
  t.plan(1);

  const input = `
<!-- -->
    `;

  const expected = [];

  t.same(parser(input), expected);
});

test('multiline comment', (t) => {
  t.plan(1);

  const input = `
<!-- place
holder -->
    `;

  const expected = [];

  t.same(parser(input), expected);
});

test('nested comment start', (t) => {
  t.plan(1);

  const input = `
<!-- place <!-- holder -->
    `;

  const expected = [];

  t.same(parser(input), expected);
});


