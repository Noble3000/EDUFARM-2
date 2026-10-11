# Re-appliable patch for @netlify/plugin-nextjs on Windows machines WITHOUT
# symlink privilege (no Developer Mode / elevation).
# The plugin recreates standalone node_modules symlinks with fs.symlink(),
# which throws EPERM on such machines. We materialize real copies instead.
# All EduFarm Netlify deploys run from THIS machine via CLI, so this holds.
# Re-run after every `npm install` that touches the plugin:
#   powershell -ExecutionPolicy Bypass -File web\scripts\patch-netlify-plugin.ps1

$ErrorActionPreference = "Stop"
$f = "C:\Users\HomePC\Downloads\EDUFARM 2\web\node_modules\@netlify\plugin-nextjs\dist\build\content\server.js"
$c = Get-Content $f -Raw

# 1) import realpath alongside the other fs/promises helpers
if ($c -notmatch "realpath,") {
  $c = $c -replace "readFile,\n  readlink,", "readFile,`n  readlink,`n  realpath,"
}

# 2) copy with dereferenced (real) files instead of symlinks.
#    Node's fs.cp re-creates symlinks without this on some versions, and
#    Windows without symlink privilege throws EPERM there.
$c = $c -replace "verbatimSymlinks: true,", "dereference: true,"
$c = $c -replace "recursive: true,\n        force: true,\n        filter", "recursive: true,`n        dereference: true,`n        force: true,`n        filter"

# 3) recreate symlinks as real recursive copies of their resolved targets
$old = @'
      if (dirent.isSymbolicLink()) {
        const symlinkSrc = join(dest, org || "", dirent.name);
        const symlinkTarget = await readlink(join(src, org || "", dirent.name));
        const symlinkDest = join(dest, org || "", symlinkTarget);
        if (existsSync(symlinkDest) && !existsSync(symlinkSrc)) {
          if (org) {
            await mkdir(join(dest, org), { recursive: true });
          }
          await symlink(symlinkTarget, symlinkSrc);
        }
      }
'@
$new = @'
      if (dirent.isSymbolicLink()) {
        // Windows without symlink privilege: materialize a real copy.
        const copyDest = join(dest, org || "", dirent.name);
        if (!existsSync(copyDest)) {
          if (org) {
            await mkdir(join(dest, org), { recursive: true });
          }
          const realTarget = await realpath(join(src, org || "", dirent.name));
          await cp(realTarget, copyDest, { recursive: true, force: true });
        }
      }
'@
if ($c.Contains($old)) { $c = $c.Replace($old, $new) }

Set-Content $f $c -NoNewline
Write-Host "netlify plugin patched (idempotent)"
