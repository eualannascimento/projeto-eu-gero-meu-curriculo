// Espelho da configuracao que o site aplica a `resume/**`.
//
// `resume/` nao e versionado no repositorio do site: ele copia este
// repositorio no momento do build. Em 31/07/2026 arquivos novos daqui
// chegaram la e o ESLint do site quebrou o deploy por 23 dias, sem que nada
// tivesse mudado naquele repositorio. Quem fez a mudanca nao tinha como saber.
//
// Este arquivo existe para a quebra aparecer aqui, no PR que a causa. Por isso
// ele **precisa** dizer o mesmo que o do site: se os dois divergirem, a
// garantia some. Os caminhos sao os unicos ajustes, porque la tudo vive sob
// `resume/`.
//
// Divergir para mais rigoroso e seguro: o que passa aqui passa la. Divergir
// para menos rigoroso e o que quebra o deploy, e nao deve acontecer.
//
// Site: https://github.com/eualannascimento/project-classificavagas-page-jobs
// Arquivo espelhado: eslint.config.js, blocos `resume/js/**` e `resume/scripts/**`.
import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        // La: `resume/js/**/*.js`. Ambiente de navegador.
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                window: 'readonly', document: 'readonly', navigator: 'readonly',
                localStorage: 'readonly', console: 'readonly', setTimeout: 'readonly',
                clearTimeout: 'readonly', requestAnimationFrame: 'readonly',
                URL: 'readonly', Blob: 'readonly', FileReader: 'readonly',
                matchMedia: 'readonly', location: 'readonly', history: 'readonly',
                getComputedStyle: 'readonly', Image: 'readonly', ResizeObserver: 'readonly',
                CSS: 'readonly', alert: 'readonly', confirm: 'readonly',
                // Os modulos conversam por globais (padrao IIFE): cada arquivo
                // define o seu e consome os dos vizinhos.
                EuGeroA11y: 'writable',
                EuGeroApp: 'writable',
                EuGeroCharacters: 'writable',
                EuGeroConfig: 'writable',
                EuGeroDates: 'writable',
                EuGeroLinkedInGuide: 'writable',
                EuGeroPdfExport: 'writable',
                EuGeroPdfFonts: 'writable',
                EuGeroPreview: 'writable',
                EuGeroPromptModal: 'writable',
                EuGeroPrompts: 'writable',
                EuGeroReviewScreen: 'writable',
                EuGeroRouter: 'writable',
                EuGeroSampleData: 'writable',
                EuGeroScoring: 'writable',
                EuGeroStartScreen: 'writable',
                EuGeroStorage: 'writable',
                EuGeroUtils: 'writable',
                EuGeroValidation: 'writable',
                EuGeroWizardScreen: 'writable'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^EuGero' }],
            // Cada arquivo declara o proprio modulo global e consome os vizinhos.
            'no-redeclare': 'off'
        }
    },
    {
        // La: `resume/scripts/**/*.js` e `resume/playwright.config.js`. Node.
        files: ['scripts/**/*.js', 'playwright.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                fetch: 'readonly',
                AbortController: 'readonly',
                TextDecoder: 'readonly',
                TextEncoder: 'readonly'
            }
        },
        rules: {
            // O site desliga esta regra porque nao pode consertar codigo que
            // nao versiona: a proxima sincronizacao sobrescreveria o arquivo.
            // Aqui o codigo e nosso, entao ela fica ligada. E a divergencia na
            // direcao segura.
            'preserve-caught-error': 'error'
        }
    },
    {
        // O site ignora `resume/tests/**` e `resume/js/vendor/**`. Aqui vale o
        // mesmo recorte: lintar o que o site nao linta criaria alarme que nao
        // corresponde a risco nenhum de quebrar o deploy.
        ignores: [
            'node_modules/**',
            'js/vendor/**',
            'tests/**',
            // `.docs/design-reference/` guarda bundle de ferramenta de design,
            // minificado e de terceiro. O site tambem o ignora, via
            // `resume/.docs/**`.
            '.docs/**',
            'docs/**',
            'issues-015/**'
        ]
    }
];
