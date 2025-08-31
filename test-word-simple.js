#!/usr/bin/env node

/**
 * Simple test for Word document backup
 */

require('dotenv').config();
const ClickUpBackupAgent = require('./backup-script-word.js');

async function testWordBackupSimple() {
  console.log('🧪 Testing Word Document Backup (Simple)...\n');
  
  const agent = new ClickUpBackupAgent();
  
  try {
    // Get all spaces first
    const spaces = await agent.getSpaces();
    console.log(`📋 Found ${spaces.length} spaces`);
    
    // Use the first space for testing
    const selectedSpace = spaces[0];
    console.log(`🎯 Testing Word backup for space: ${selectedSpace.name}`);
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
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testWordBackupSimple();