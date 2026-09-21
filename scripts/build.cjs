const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'</style>');
html=html.replace('<script src="engine.js"></script><script src="app.js"></script>',()=>'<script>'+fs.readFileSync(path.join(root,'engine.js'),'utf8')+'</script><script>'+fs.readFileSync(path.join(root,'app.js'),'utf8')+'</script>');
fs.writeFileSync(path.join(root,'Numbercraft.html'),html);
console.log('Built portable Numbercraft.html ('+Buffer.byteLength(html)+' bytes).');
