const esbuild = require('esbuild');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const baseConfig = {
    bundle: true,
    platform: 'browser',
    format: 'esm',
    loader: { '.js': 'jsx' },
    sourcemap: true,
    external: ['electron'],
    define: {
        'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
    },
};

const entryPoints = [
    { in: 'src/app/PickleGlassApp.js', out: 'public/build/content' },
];

async function buildCSS() {
    try {
        console.log('Building Tailwind CSS...');
        await execAsync('./node_modules/.bin/tailwindcss -i ./src/features/ui/styles/tailwind.css -o ./public/build/styles.css --minify');
        console.log('✅ CSS build successful!');
    } catch (error) {
        console.error('CSS build failed:', error);
        throw error;
    }
}

async function build() {
    try {
        console.log('Building renderer process code...');
        
        // Build CSS first
        await buildCSS();
        
        // Build JavaScript
        await Promise.all(entryPoints.map(point => esbuild.build({
            ...baseConfig,
            entryPoints: [point.in],
            outfile: `${point.out}.js`,
        })));
        console.log('✅ Renderer builds successful!');
    } catch (e) {
        console.error('Renderer build failed:', e);
        process.exit(1);
    }
}

async function watch() {
    try {
        // Initial build including CSS
        await buildCSS();
        
        const contexts = await Promise.all(entryPoints.map(point => esbuild.context({
            ...baseConfig,
            entryPoints: [point.in],
            outfile: `${point.out}.js`,
        })));
        
        console.log('Watching for changes...');
        await Promise.all(contexts.map(context => context.watch()));
        
        // Watch CSS changes (simple implementation)
        console.log('Watching CSS for changes...');
        const fs = require('fs');
        fs.watchFile('./src/styles/tailwind.css', async () => {
            console.log('CSS file changed, rebuilding...');
            try {
                await buildCSS();
            } catch (error) {
                console.error('CSS rebuild failed:', error);
            }
        });

    } catch (e) {
        console.error('Watch mode failed:', e);
        process.exit(1);
    }
}

if (process.argv.includes('--watch')) {
    watch();
} else {
    build();
} 