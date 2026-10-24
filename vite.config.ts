import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
/** Serve/export runtime assets only. Editable masters and render caches stay out of dist. */
const root=join(import.meta.dirname,'assets');
const categories=['environments','characters','vfx'];
export default defineConfig(({ mode }) => ({
  base:'./',publicDir:'public',
  server: { watch: { ignored: ['**/.tmp/**', '**/android/**', '**/dist-player/**', '**/test-results/**'] } },
  define:{__BUILD_SHA__:JSON.stringify(process.env.BUILD_SHA??execSync('git rev-parse --short HEAD').toString().trim())},
  plugins:[{
    name:'idle-player-entry',
    transformIndexHtml: { order: 'pre', handler(html) { return mode === 'player' ? html.replace('/src/main.ts', '/src/player.ts') : html; } },
  },{
    name:'idle-runtime-assets',
    configureServer(server){server.middlewares.use((req,res,next)=>{
      const url=(req.url??'').split('?')[0];
      if(!/^\/(environments|characters|vfx)\/runtime\/[\w.-]+\.(png|json)$/.test(url)) return next();
      try {
        const bytes=readFileSync(join(root,url.slice(1)));
        res.setHeader('Content-Type',url.endsWith('.png')?'image/png':'application/json');
        res.setHeader('Content-Length',bytes.length);res.end(bytes);
      }catch{res.statusCode=404;res.end('Runtime asset unavailable');}
    });},
    generateBundle(){
      for(const category of categories) for(const file of readdirSync(join(root,category,'runtime'))) {
        if(file.endsWith('.metadata.json')||file==='atlas-report.json') continue;
        this.emitFile({type:'asset',fileName:`${category}/runtime/${file}`,source:readFileSync(join(root,category,'runtime',file))});
      }
    },
  }],
  build:{chunkSizeWarningLimit:1600, outDir: mode === 'player' ? 'dist-player' : 'dist'},
}));
