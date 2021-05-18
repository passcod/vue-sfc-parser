/**
 * Parses a Vue-style Single File Component in a limited fashion for further
 * post-processing, with no dependencies, suitable for use in a Service Worker
 * or other such constrained environment.
 *
 * Parses only the top-level tags and provides their content as strings. Does
 * not prescribe any set of top-level tags, it will just parse everything. Also
 * supports HTML comments. Has some support for attributes on top-level tags,
 * such as for `<style scoped>` and `<script type="text/typescript">`. Supports
 * nested <template> tags (it will leave interior ones as string content but it
 * internally keeps track for proper parsing).
 *
 * Does not support the string `</script>` inside a script tag, and similarly
 * for other tags. Just break it up e.g. `"<" + "/script>"` if you need to.
 *
 * @param str {string} source of the SFC to parse
 * @returns {Object[]} array of `{ tag: 'root level tag name', content: 'content', [attrs: { name: 'value' }] }`
 * @license Apache-2.0 OR MIT
 */
export default function parseSfc(str) {
  const COMMENT = Symbol('comment');
  const tags = [];

  let partial = '', tag = '', attrs = {}, attr = null, content = '', depth = 0;

  for (const char of str) {
    // console.error('--(p,t,a,a,c,d,l)--', partial || null, tag || null, attrs, attr, content || null, depth, tags.length);

    if (tag == COMMENT) {
      if (char == '-') {
        partial += char;
      } else if (char == '>' && partial == '--') {
        partial = '';
        tag = '';
        depth -= 1;
      } else {
        partial = '';
      }

      continue;
    } else if (!tag) {
      if (!partial) {
        if (/\s/.test(char)) continue;
        if (char == '<') {
          partial = '<';
          continue;
        }

        throw new Error(`Unexpected '${char}', expected whitespace or '<'.`);
      } else {
        if (attr) {
          if (!attr.name) {
            if (/[a-z0-9-]/i.test(char)) {
              attr.partial += char;
              continue;
            }

            if (char == '=') {
              attr.name = attr.partial;
              attr.partial = '';
              continue;
            }

            if (/\s/.test(char)) {
              if (!attr.partial) continue;
              attrs[attr.partial] = attr.partial;
              attr.partial = '';
              continue;
            }

            if (char == '>') {
              if (attr.partial) {
                attrs[attr.partial] = attr.partial;
              }
              attr = null;
              tag = partial.slice(1);
              partial = '';
              depth += 1;
              continue;
            }

            throw new Error(`Unexpected '${char}', expected whitespace, attribute name, or '>'.`);
          } else {
            if (!attr.partial) {
              if (char == '>') throw new Error(`Unexpected '>', expected attribute value.`);
              if (/\s/.test(char)) continue;

              attr.partial += char;
              continue;
            }

            if (
              (attr.partial.startsWith('"') && char == '"') ||
              (attr.partial.startsWith('\'') && char == '\'')
            ) {
              if (attr.partial.endsWith('\\')) {
                attr.partial.pop();
                attr.partial.push(char);
                continue;
              }

              attrs[attr.name] = attr.partial.slice(1);
              attr = null;
              continue;
            }

            if (char == '>') {
              if (attr.partial.startsWith('"') || attr.partial.startsWith('\''))
                throw new Error(`Unexpected end of attribute, expected '${attr.partial[0]}' terminator.`);

              attrs[attr.name] = attr.partial;
              attr = null;
              tag = partial.slice(1);
              partial = '';
              depth += 1;
              continue;
            }

            attr.partial += char;
            continue;
          }
        } else {
          if (/[a-z0-9-!]/i.test(char)) {
            partial += char;
            continue;
          }

          if (char == '>') {
            tag = partial.slice(1);
            partial = '';
            depth += 1;
            continue;
          }

          if (/\s/.test(char)) {
            if (partial == '<!--') {
              tag = COMMENT;
              partial = '';
              depth += 1;
              continue;
            }

            attr = { partial: '', name: '' };
            continue;
          }

          throw new Error(`Unexpected '${char}', expected tag name or '>'.`);
        }
      }
    } else {
      if (partial) {
        if (char == '>') {
          if (partial.startsWith('</') && partial.slice(2) == tag) {
            depth -= 1;
            if (depth == 0) {
              const newtag = { tag, content };
              if (Object.entries(attrs).length) newtag.attrs = attrs;
              tags.push(newtag);
              tag = '';
              partial = '';
              attrs = {};
              content = '';
              continue;
            }
          } else if (partial.slice(1).split(/\s/, 2)[0] == tag) {
            depth += 1;
            content += partial + char;
            partial = '';
            continue;
          }

          content += partial + char;
          partial = '';
          continue;
        }

        partial += char;
      } else {
        if (char == '<') {
          partial = char;
          continue;
        }

        content += char;
      }
    }
  }

  if (tag || partial || attr) {
    throw new Error('Unexpected end of file.');
  }

  return tags;
}
