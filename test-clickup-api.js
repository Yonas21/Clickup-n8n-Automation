#!/usr/bin/env node

/**
 * Test script to verify ClickUp API connection
 */

require('dotenv').config();
const axios = require('axios');

async function testClickUpAPI() {
  console.log('🧪 Testing ClickUp API Connection...\n');
  
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  
  if (!token || !teamId) {
    console.log('❌ Missing ClickUp credentials in .env file');
    return;
  }
  
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Get user info
    console.log('📋 Test 1: Getting user information...');
    const userResponse = await axios.get('https://api.clickup.com/api/v2/user', { headers });
    console.log(`✅ User: ${userResponse.data.user.username} (${userResponse.data.user.email})`);
    
    // Test 2: Get team info
    console.log('\n📋 Test 2: Getting team information...');
    const teamResponse = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}`, { headers });
    console.log(`✅ Team: ${teamResponse.data.team.name}`);
    
    // Test 3: Get spaces
    console.log('\n📋 Test 3: Getting spaces...');
    const spacesResponse = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/space`, { headers });
    console.log(`✅ Found ${spacesResponse.data.spaces.length} spaces:`);
    spacesResponse.data.spaces.forEach(space => {
      console.log(`   - ${space.name} (ID: ${space.id})`);
    });
    
    // Test 4: Get specific space data
    if (spacesResponse.data.spaces.length > 0) {
      const firstSpace = spacesResponse.data.spaces[0];
      console.log(`\n📋 Test 4: Getting data for space "${firstSpace.name}"...`);
      
      // Get folders
      try {
        const foldersResponse = await axios.get(`https://api.clickup.com/api/v2/space/${firstSpace.id}/folder`, { headers });
        console.log(`   ✅ Folders: ${foldersResponse.data.folders.length}`);
      } catch (error) {
        console.log(`   ⚠️  Folders: ${error.response?.status || 'Error'}`);
      }
      
      // Get lists
      try {
        const listsResponse = await axios.get(`https://api.clickup.com/api/v2/space/${firstSpace.id}/list`, { headers });
        console.log(`   ✅ Lists: ${listsResponse.data.lists.length}`);
      } catch (error) {
        console.log(`   ⚠️  Lists: ${error.response?.status || 'Error'}`);
      }
      
      // Get sprints
      try {
        const sprintsResponse = await axios.get(`https://api.clickup.com/api/v2/space/${firstSpace.id}/sprint`, { headers });
        console.log(`   ✅ Sprints: ${sprintsResponse.data.sprints.length}`);
      } catch (error) {
        console.log(`   ⚠️  Sprints: ${error.response?.status || 'Error'} (normal if sprints not enabled)`);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Your ClickUp API connection is working properly.');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testClickUpAPI();