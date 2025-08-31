#!/usr/bin/env node

/**
 * Test backup for a single space
 */

require('dotenv').config();
const ClickUpBackupAgent = require('./backup-script-local.js');

async function testSingleSpace() {
  console.log('🧪 Testing Single Space Backup...\n');
  
  const agent = new ClickUpBackupAgent();
  
  try {
    // Get all spaces first
    const spaces = await agent.getSpaces();
    console.log(`📋 Found ${spaces.length} spaces:`);
    spaces.forEach((space, index) => {
      console.log(`   ${index + 1}. ${space.name} (ID: ${space.id})`);
    });
    
    // Let user choose a space
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    const spaceIndex = await question(`\nEnter space number to test (1-${spaces.length}): `);
    const selectedSpace = spaces[parseInt(spaceIndex) - 1];
    
    if (!selectedSpace) {
      console.log('❌ Invalid space selection');
      rl.close();
      return;
    }
    
    console.log(`\n🎯 Testing backup for space: ${selectedSpace.name}`);
    
    // Run backup for selected space
    const backupData = await agent.backupSpace(selectedSpace);
    const savedFiles = await agent.saveBackup(selectedSpace, backupData);
    
    console.log('\n✅ Single space backup completed!');
    console.log(`📁 Files saved:`);
    console.log(`   - JSON: ${savedFiles.jsonPath}`);
    console.log(`   - Markdown: ${savedFiles.mdPath}`);
    
    rl.close();
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testSingleSpace();