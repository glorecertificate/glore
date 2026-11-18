const noElse = {
  create: context => ({
    IfStatement: node => {
      if (!node.alternate) return
      context.report({ node: node.alternate, message: 'Use a guard clause instead of else (AGENTS.md).' })
    },
  }),
}

const plugin = {
  meta: { name: 'glore' },
  rules: { 'no-else': noElse },
}

export default plugin
