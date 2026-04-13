'use strict';

/**
 * Registers a require.extensions handler for .ts files so that test files can
 * require TypeScript source files directly. Uses typescript.transpileModule to
 * strip type annotations before Node evaluates the module.
 */

if (!require.extensions['.ts']) {
  const ts = require('typescript');
  const fs = require('node:fs');

  require.extensions['.ts'] = function tsExtensionHandler(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    });
    module._compile(outputText, filename);
  };
}
