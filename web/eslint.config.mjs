// @ts-check
import stylistic from '@stylistic/eslint-plugin'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
	{
		files: ['**/*.vue', '**/*.ts', '**/*.mjs'],
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			// vue styles
			'vue/block-order': ['error', {
				order: ['script', 'template', 'style']
			}],
			'sort-imports': ['error', {
				ignoreCase: false,
				ignoreDeclarationSort: false,
				ignoreMemberSort: false,
				memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
				allowSeparatedGroups: false
			}],
			'vue/max-attributes-per-line': ['error', {
				singleline: {
					max: 2
				},
				multiline: {
					max: 1
				}
			}],
			'vue/html-indent': ['error', 'tab', {
				attribute: 1,
				baseIndent: 1,
				closeBracket: 0,
				alignAttributesVertically: true,
				ignores: []
			}],
			'vue/no-multi-spaces': ['error', {
				'ignoreProperties': false
			}],

			// stylistics to fix @stylisitc
			'@stylistic/semi': ['error', 'never'],

			// stylisitcs to replace prettier
			'semi': ['error', 'never'],
			'space-in-parens': ['error', 'never'],
			'no-multi-spaces': ['error'],
			'indent': ['error', 'tab'],
			'quotes': ['error', 'single'],
			'comma-dangle': ['error', 'never'],
			'object-curly-spacing': ['error', 'always'],
			'array-bracket-spacing': ['error', 'never'],
			'block-spacing': ['error', 'always'],
			'key-spacing': ['error', { beforeColon: false, afterColon: true }]
		}
	}
)
