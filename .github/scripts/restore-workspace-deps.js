#!/usr/bin/env node

/**
 * Script pour restaurer les dépendances workspace:* après la publication
 */

const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '..', '..', 'packages');

// Liste des packages qui ont des dépendances workspace
const packagesToFix = ['nest-auth', 'nest-auth-client'];

// Packages workspace qui doivent être restaurés
const workspacePackages = {
  '@devlab-io/nest-auth-types': 'nest-auth-types',
};

function restoreWorkspaceDeps(packageName) {
  const packagePath = path.join(packagesDir, packageName);
  const packageJsonPath = path.join(packagePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ Package.json not found: ${packageJsonPath}`);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let modified = false;

  // Parcourir les dépendances
  if (packageJson.dependencies) {
    for (const [depName] of Object.entries(packageJson.dependencies)) {
      if (workspacePackages[depName]) {
        const currentVersion = packageJson.dependencies[depName];
        // Si c'est une version (commence par ^ ou ~ ou un chiffre), restaurer à workspace:*
        if (currentVersion && !currentVersion.startsWith('workspace:')) {
          console.log(`  ✓ ${depName}: ${currentVersion} → workspace:*`);
          packageJson.dependencies[depName] = 'workspace:*';
          modified = true;
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
    console.log(`✓ Restored workspace dependencies in ${packageName}`);
    return true;
  } else {
    console.log(`  No workspace dependencies to restore in ${packageName}`);
    return false;
  }
}

function main() {
  console.log('🔧 Restoring workspace dependencies...\n');

  let anyModified = false;
  for (const packageName of packagesToFix) {
    console.log(`Processing ${packageName}...`);
    if (restoreWorkspaceDeps(packageName)) {
      anyModified = true;
    }
    console.log('');
  }

  if (anyModified) {
    console.log('✅ All workspace dependencies restored!');
    process.exit(0);
  } else {
    console.log('ℹ️  No changes needed');
    process.exit(0);
  }
}

main();
