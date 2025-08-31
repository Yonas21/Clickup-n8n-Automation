#!/usr/bin/env node

/**
 * Test Word document backup for a single space
 */

require('dotenv').config();
const ClickUpBackupAgent = require('./backup-script-word.js');

async function testWordBackup() {
  console.log('🧪 Testing Word Document Backup...\n');
  
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
    
    console.log(`\n🎯 Testing Word backup for space: ${selectedSpace.name}`);
    console.log('📊 This will include detailed sprint information...\n');
    
    // Run backup for selected space
    const backupData = await agent.backupSpace(selectedSpace);
    const savedFiles = await agent.saveBackup(selectedSpace, backupData);
    
    console.log('\n✅ Word document backup completed!');
    console.log(`📁 Files saved:`);
    console.log(`   - JSON: ${savedFiles.jsonPath}`);
    console.log(`   - Word: ${savedFiles.docPath}`);
    
    console.log('\n📋 Word document includes:');
    console.log('   ✅ Space information with features');
    console.log('   ✅ All folders with details');
    console.log('   ✅ All lists with status');
    console.log('   ✅ Detailed sprint information');
    console.log('   ✅ Sprint goals and progress');
    console.log('   ✅ Sprint tasks with assignees');
    console.log('   ✅ All tasks organized by list');
    console.log('   ✅ Backup statistics');
    
    console.log('\n💡 You can now open the Word document to view the formatted report!');
    
    rl.close();
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testWordBackup();