#!/usr/bin/env node

/**
 * SSG Build Validation Script
 * Überprüft die generierten statischen Dateien nach dem Build
 */

import fs from 'fs'
import path from 'path'

const DIST_DIR = './.output/public'
const REQUIRED_FILES = [
	'index.html',
	'200.html',
	'sitemap.xml'
]

const REQUIRED_DIRS = [
	'pool',
	'shows',
	'schedule',
	'words'
]

function validateBuild() {
	console.log('🔍 Validating SSG build...')
  
	// Prüfe ob dist Verzeichnis existiert
	if (!fs.existsSync(DIST_DIR)) {
		console.error('❌ dist directory not found!')
		process.exit(1)
	}
  
	// Prüfe erforderliche Dateien
	let missingFiles = []
	REQUIRED_FILES.forEach(file => {
		const filePath = path.join(DIST_DIR, file)
		if (!fs.existsSync(filePath)) {
			missingFiles.push(file)
		} else {
			console.log(`✅ ${file} found`)
		}
	})
  
	// Prüfe erforderliche Verzeichnisse
	let missingDirs = []
	REQUIRED_DIRS.forEach(dir => {
		const dirPath = path.join(DIST_DIR, dir)
		if (!fs.existsSync(dirPath)) {
			missingDirs.push(dir)
		} else {
			console.log(`✅ ${dir}/ directory found`)
		}
	})
  
	// Zähle generierte Dateien
	const files = getAllFiles(DIST_DIR)
	const htmlFiles = files.filter(f => f.endsWith('.html')).length
	const jsFiles = files.filter(f => f.endsWith('.js')).length
	const cssFiles = files.filter(f => f.endsWith('.css')).length
  
	console.log('📊 Build Statistics:')
	console.log(`   📄 HTML files: ${htmlFiles}`)
	console.log(`   📜 JS files: ${jsFiles}`)
	console.log(`   🎨 CSS files: ${cssFiles}`)
	console.log(`   📁 Total files: ${files.length}`)
  
	// Finale Validierung
	if (missingFiles.length > 0) {
		console.error(`❌ Missing required files: ${missingFiles.join(', ')}`)
		process.exit(1)
	}
  
	if (missingDirs.length > 0) {
		console.error(`❌ Missing required directories: ${missingDirs.join(', ')}`)
		process.exit(1)
	}
  
	if (htmlFiles < 5) {
		console.error(`❌ Too few HTML files generated (${htmlFiles}). Expected at least 5.`)
		process.exit(1)
	}
  
	console.log('✅ SSG build validation passed!')
}

function getAllFiles(dir, files = []) {
	const dirFiles = fs.readdirSync(dir)
	for (const file of dirFiles) {
		const filePath = path.join(dir, file)
		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, files)
		} else {
			files.push(filePath)
		}
	}
	return files
}

validateBuild()
