#!/usr/bin/env node

/**
 * Test individual backup components
 */

require('dotenv').config();
const ClickUpBackupAgent = require('./backup-script-local.js');

async function testBackupComponents() {
  console.log('🧪 Testing Backup Components...\n');
  
  const agent = new ClickUpBackupAgent();
  
  try {
    // Test 1: Get spaces
    console.log('📋 Test 1: Getting spaces...');
    const spaces = await agent.getSpaces();
    console.log(`✅ Found ${spaces.length} spaces`);
    
    if (spaces.length > 0) {
      const firstSpace = spaces[0];
      console.log(`   Testing with space: ${firstSpace.name}`);
      
      // Test 2: Get folders
      console.log('\n📋 Test 2: Getting folders...');
      const folders = await agent.getFolders(firstSpace.id);
      console.log(`✅ Found ${folders.length} folders`);
      
      // Test 3: Get lists
      console.log('\n📋 Test 3: Getting lists...');
      const lists = await agent.getLists(firstSpace.id);
      console.log(`✅ Found ${lists.length} lists`);
      
      // Test 4: Get sprints
      console.log('\n📋 Test 4: Getting sprints...');
      const sprints = await agent.getSprints(firstSpace.id);
      console.log(`✅ Found ${sprints.length} sprints`);
      
      // Test 5: Get tasks for first list
      if (lists.length > 0) {
        console.log('\n📋 Test 5: Getting tasks...');
        const tasks = await agent.getTasks(lists[0].id);
        console.log(`✅ Found ${tasks.length} tasks in list "${lists[0].name}"`);
      }
      
      // Test 6: Test backup data formatting
      console.log('\n📋 Test 6: Testing backup data formatting...');
      const backupData = await agent.backupSpace(firstSpace);
      console.log(`✅ Backup data created with:`);
      console.log(`   - Space: ${backupData.space.name}`);
      console.log(`   - Folders: ${backupData.folders.length}`);
      console.log(`   - Lists: ${backupData.lists.length}`);
      console.log(`   - Sprints: ${backupData.sprints.length}`);
      console.log(`   - Task lists: ${Object.keys(backupData.tasks).length}`);
      
      // Test 7: Test markdown formatting
      console.log('\n📋 Test 7: Testing markdown formatting...');
      const markdown = agent.formatAsMarkdown(backupData);
      console.log(`✅ Markdown generated (${markdown.length} characters)`);
      console.log(`   Preview: ${markdown.substring(0, 200)}...`);
    }
    
    console.log('\n🎉 All component tests completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testBackupComponents();