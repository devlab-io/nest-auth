#!/usr/bin/env node

/**
 * Script pour remplacer les dépendances workspace:* par les versions réelles
 * avant la publication des packages
 */

const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '..', '..', 'packages');

// Liste des packages qui ont des dépendances workspace
const packagesToFix = ['nest-auth', 'nest-auth-client'];

// Packages workspace qui peuvent être référencés
const workspacePackages = {
  '@devlab-io/nest-auth-types': 'nest-auth-types',
};

function fixWorkspaceDeps(packageName) {
  const packagePath = path.join(packagesDir, packageName);
  const packageJsonPath = path.join(packagePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ Package.json not found: ${packageJsonPath}`);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let modified = false;

  // Lire la version du package actuel
  const currentVersion = packageJson.version;

  // Parcourir les dépendances
  if (packageJson.dependencies) {
    for (const [depName, depVersion] of Object.entries(
      packageJson.dependencies,
    )) {
      if (depVersion === 'workspace:*' && workspacePackages[depName]) {
        // Trouver la version du package workspace
        const workspacePackageName = workspacePackages[depName];
        const workspacePackagePath = path.join(
          packagesDir,
          workspacePackageName,
          'package.json',
        );

        if (fs.existsSync(workspacePackagePath)) {
          const workspacePackageJson = JSON.parse(
            fs.readFileSync(workspacePackagePath, 'utf8'),
          );
          const workspaceVersion = workspacePackageJson.version;

          console.log(`  ✓ ${depName}: workspace:* → ^${workspaceVersion}`);
          packageJson.dependencies[depName] = `^${workspaceVersion}`;
          modified = true;
        } else {
          console.error(
            `  ❌ Workspace package not found: ${workspacePackagePath}`,
          );
        }
      }
    }
  }

  if (modified) {
    // Sauvegarder le package.json modifié
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf8',
    );
    console.log(`✓ Fixed workspace dependencies in ${packageName}`);
    return true;
  } else {
    console.log(`  No workspace dependencies to fix in ${packageName}`);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing workspace dependencies...\n');

  let anyModified = false;
  for (const packageName of packagesToFix) {
    console.log(`Processing ${packageName}...`);
    if (fixWorkspaceDeps(packageName)) {
      anyModified = true;
    }
    console.log('');
  }

  if (anyModified) {
    console.log('✅ All workspace dependencies fixed!');
    process.exit(0);
  } else {
    console.log('ℹ️  No changes needed');
    process.exit(0);
  }
}

main();
